"""전세 사기 위험도 스코어링 서비스
# [정책 기준] domain-research.md 전세 사기 지표 기반 — 2026년 기준
# 총점 0~100, 높을수록 위험
"""
from models.schemas import PropertyInfo


def calc_jeonse_ratio_score(jeonse_ratio: float) -> int:
    """전세가율 점수 (0~30)"""
    if jeonse_ratio < 60:
        return 0
    if jeonse_ratio < 70:
        return 10
    if jeonse_ratio < 80:
        return 20
    return 30


def calc_mortgage_ratio_score(trade_price: int, jeonse_price: int, senior_mortgage: int) -> int:
    """
    근저당비율 점수 (0~30)
    실효비율 = (근저당채권최고액 + 전세금) / 매매가
    ~70%: 0점 / 70~80%: 15점 / 80%↑: 30점
    """
    if trade_price <= 0:
        return 0
    ratio = (senior_mortgage + jeonse_price) / trade_price * 100
    if ratio < 70:
        return 0
    if ratio < 80:
        return 15
    return 30


def calc_registry_keyword_score(registry_data: dict) -> tuple[int, list[str]]:
    """
    등기 위험키워드 점수 (0~20, cap) + 플래그 목록
    가압류: +10 / 가처분·경매: +20 / 신탁: +10
    임차권등기: +15 / 압류: +15 / 가등기: +8
    """
    score = 0
    flags: list[str] = []
    checks = [
        ("has_attachment", 10, "가압류 등기 발견 — 채권자가 재산을 묶어둔 상태"),
        ("has_provisional_attachment", 10, "가처분 등기 발견 — 소유권 분쟁 가능성"),
        ("has_auction", 20, "경매개시결정 등기 발견 — 즉시 계약 중단 권장"),
        ("has_trust", 10, "신탁등기 발견 — 신탁원부 열람 및 신탁회사 동의서 필수"),
        ("has_lease_registration", 15, "임차권등기 발견 — 이전 임차인 보증금 미반환 이력"),
        ("has_seizure", 15, "압류 등기 발견 — 세금 체납 가능성"),
        ("has_provisional_registration", 8, "가등기 발견 — 본등기 시 임차권 소멸 위험"),
    ]
    for key, pts, msg in checks:
        if registry_data.get(key):
            score += pts
            flags.append(msg)
    return min(score, 20), flags


def calc_landlord_score(registry_data: dict) -> tuple[int, list[str]]:
    """임대인 신뢰도 점수 (0~20) + 플래그 목록"""
    score = 0
    flags: list[str] = []
    if registry_data.get("owner_acquired_recently"):
        score += 5
        flags.append("최근 6개월 내 소유권 취득 — 갭투자 가능성 확인 필요")
    if registry_data.get("is_corporate_owner"):
        score += 5
        flags.append("법인 소유 부동산 — 법인 실체 및 세금 체납 이력 확인 필요")
    return min(score, 20), flags


def grade_fraud_score(score: int) -> str:
    """0~30: 안전 / 31~50: 주의 / 51~70: 위험 / 71~100: 매우 위험"""
    if score <= 30:
        return "안전"
    if score <= 50:
        return "주의"
    if score <= 70:
        return "위험"
    return "매우 위험"


def generate_checklist(registry_data: dict, fraud_score: int) -> list[dict]:
    """미완료 체크리스트 자동 생성"""
    items: list[dict] = [
        {"item": "납세증명서(국세·지방세) 제출 요청", "completed": False, "priority": "필수"},
        {"item": "전입세대 확인서 열람 (확정일자 포함)", "completed": False, "priority": "필수"},
        {"item": "전세보증금반환보증(HUG/SGI) 가입 가능 여부 확인", "completed": False, "priority": "필수"},
        {"item": "등기부등본 계약 당일 재확인 (잔금 전)", "completed": False, "priority": "필수"},
    ]
    if registry_data.get("has_trust"):
        items.insert(0, {"item": "신탁원부 열람 + 신탁회사 임대 동의서 원본 확보", "completed": False, "priority": "필수"})  # noqa: E501
    if registry_data.get("has_auction") or fraud_score >= 70:
        items.insert(0, {"item": "전문 법무사/변호사 상담 강력 권장", "completed": False, "priority": "필수"})
    if registry_data.get("is_corporate_owner"):
        items.append({"item": "법인등기부등본 열람 (대표자·주소 확인)", "completed": False, "priority": "권장"})
    items.append({"item": "임대차 계약 특약 사항 꼼꼼히 확인", "completed": False, "priority": "권장"})
    return items


async def calculate_fraud_score(property_info: PropertyInfo, registry_data: dict) -> dict:
    """
    메인 스코어링 함수
    1. 전세가율 점수 (market_trade_price 없으면 0점)
    2. 근저당비율 점수
    3. 등기 키워드 점수
    4. 임대인 신뢰도 점수
    5. 총점 합산 (100 cap) + 등급 판정 + 플래그 취합 + 체크리스트 생성
    """
    flags: list[str] = []

    # 1. 전세가율 점수
    jeonse_ratio_score = 0
    if property_info.market_trade_price and property_info.listed_jeonse_price:
        from services.market_service import calc_jeonse_ratio
        ratio = calc_jeonse_ratio(property_info.market_trade_price, property_info.listed_jeonse_price)
        jeonse_ratio_score = calc_jeonse_ratio_score(ratio)

    # 2. 근저당비율 점수
    mortgage_score = 0
    if property_info.market_trade_price and property_info.listed_jeonse_price:
        mortgage_score = calc_mortgage_ratio_score(
            property_info.market_trade_price,
            property_info.listed_jeonse_price,
            registry_data.get("senior_mortgage_amount", 0),
        )

    # 3. 등기 키워드 점수
    keyword_score, keyword_flags = calc_registry_keyword_score(registry_data)
    flags.extend(keyword_flags)

    # 4. 임대인 신뢰도 점수
    landlord_score, landlord_flags = calc_landlord_score(registry_data)
    flags.extend(landlord_flags)

    total = min(jeonse_ratio_score + mortgage_score + keyword_score + landlord_score, 100)
    grade = grade_fraud_score(total)
    checklist = generate_checklist(registry_data, total)

    return {
        "fraud_score": total,
        "fraud_grade": grade,
        "fraud_flags": flags,
        "checklist_items": checklist,
        "score_breakdown": {
            "jeonse_ratio_score": jeonse_ratio_score,
            "mortgage_score": mortgage_score,
            "keyword_score": keyword_score,
            "landlord_score": landlord_score,
        },
        # Phase C: 대출 탭 연동용 선순위 근저당 금액 전달
        "senior_mortgage_amount": registry_data.get("senior_mortgage_amount", 0),
    }
