"""시세 분석 서비스 — RTMS 실거래가 기반 전세가율 계산"""

from datetime import date

from clients import rtms_client
from core.cache import cache
from models.schemas import Address

AREA_TOLERANCE = 0.10  # ±10%


def filter_similar_area(items: list[dict], target_m2: float) -> list[dict]:
    """전용면적 ±10% 이내 항목만 반환, 해제 건 제거"""
    low = target_m2 * (1 - AREA_TOLERANCE)
    high = target_m2 * (1 + AREA_TOLERANCE)
    result = []
    for item in items:
        # 해제 건 제거 — 새 API: cdealType "O" = 해제
        if str(item.get("cdealType", "")).strip() == "O":
            continue
        try:
            area = float(item.get("excluUseAr", 0))
            if low <= area <= high:
                result.append(item)
        except (ValueError, TypeError):
            continue
    return result


def calc_median_price(prices: list[int]) -> int:
    """중간값 계산"""
    if not prices:
        return 0
    sorted_p = sorted(prices)
    n = len(sorted_p)
    mid = n // 2
    return sorted_p[mid] if n % 2 else (sorted_p[mid - 1] + sorted_p[mid]) // 2


def calc_weighted_average(prices: list[int]) -> int:
    """단순 평균 (해커톤 MVP — 거래량 가중 미적용)"""
    if not prices:
        return 0
    return sum(prices) // len(prices)


def determine_market_price(items: list[dict], target_m2: float) -> tuple[int | None, str]:
    """
    대표 시세 산출 + 신뢰도 반환
    10건↑: median → "high"
    1~9건: 가중평균 → "medium"
    0건: None → "none"
    """
    filtered = filter_similar_area(items, target_m2)
    if not filtered:
        return None, "none"
    prices = []
    for item in filtered:
        try:
            price_field = item.get("dealAmount") or item.get("deposit", "0")
            prices.append(rtms_client.parse_rtms_price(str(price_field)))
        except (ValueError, TypeError):
            continue
    if not prices:
        return None, "none"
    if len(prices) >= 10:
        return calc_median_price(prices), "high"
    return calc_weighted_average(prices), "medium"


def extract_recent_trades(
    items: list[dict], target_m2: float, limit: int = 10
) -> list[dict]:
    """
    유사 면적 필터 후 거래일 기준 내림차순 N건 추출
    반환 필드: apt_nm, exclu_use_ar, deal_amount, floor, deal_date
    """
    filtered = filter_similar_area(items, target_m2)
    trades: list[dict] = []
    for item in filtered:
        try:
            price_str = str(item.get("dealAmount") or item.get("deposit", "0"))
            price = rtms_client.parse_rtms_price(price_str)
            deal_year = str(item.get("dealYear", "")).strip()
            deal_month = str(item.get("dealMonth", "")).strip().zfill(2)
            deal_day = str(item.get("dealDay", "")).strip().zfill(2)
            trades.append({
                "apt_nm": str(item.get("aptNm", "")).strip(),
                "exclu_use_ar": float(item.get("excluUseAr", 0)),
                "deal_amount": price,
                "floor": str(item.get("floor", "")).strip(),
                "deal_date": f"{deal_year}-{deal_month}-{deal_day}",
            })
        except (ValueError, TypeError):
            continue
    trades.sort(key=lambda x: x["deal_date"], reverse=True)
    return trades[:limit]


def calc_jeonse_ratio(trade_price: int, jeonse_price: int) -> float:
    """전세가율 = 전세가 / 매매가 × 100, 소수점 1자리"""
    if trade_price <= 0:
        return 0.0
    return round(jeonse_price / trade_price * 100, 1)


def grade_jeonse_ratio(ratio: float) -> str:
    """
    ~60%: 안전 / 60~70%: 양호 / 70~80%: 주의 / 80~90%: 위험 / 90%↑: 매우 위험
    """
    if ratio < 60:
        return "안전"
    if ratio < 70:
        return "양호"
    if ratio < 80:
        return "주의"
    if ratio < 90:
        return "위험"
    return "매우 위험"


def _get_recent_months(n: int = 6) -> list[str]:
    """최근 n개월 YYYYMM 리스트 반환"""
    today = date.today()
    months = []
    year, month = today.year, today.month
    for _ in range(n):
        months.append(f"{year}{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return months


def _market_cache_key(lawd_cd: str, housing_type: str) -> str:
    """시세 분석용 캐시 키 생성"""
    return f"market_analysis:{lawd_cd}:{housing_type}"


async def analyze_market(
    address: Address,
    housing_type: str,
    exclusive_area_m2: float,
    listed_jeonse_price: int,
) -> dict:
    """
    시세 분석 메인 함수
    1. 캐시 확인
    2. 최근 6개월 RTMS 조회 (매매 + 전세)
    3. 유사 면적 필터 + 대표값 산출
    4. 전세가율 + 등급 계산
    5. 주택 유형별 warnings 추가
    6. 캐시 저장 후 반환
    """
    cache_key = _market_cache_key(address.lawd_cd_5, housing_type)
    cached = cache.get(cache_key)
    if cached:
        return _build_result(cached, listed_jeonse_price, housing_type, exclusive_area_m2)

    lawd_cd = address.lawd_cd_5
    months = _get_recent_months(6)

    trade_items: list[dict] = []
    rent_items: list[dict] = []
    for ym in months:
        trade_items.extend(await rtms_client.get_trade_prices(lawd_cd, ym, housing_type))
        rent_items.extend(await rtms_client.get_rent_prices(lawd_cd, ym, housing_type))

    market_trade, trade_conf = determine_market_price(trade_items, exclusive_area_m2)
    market_rent, rent_conf = determine_market_price(rent_items, exclusive_area_m2)

    # Phase D: 캐시에 원본 거래 데이터 포함하여 면적별 재필터 가능하게 저장
    cache.set(cache_key, {
        "market_trade": market_trade,
        "market_rent": market_rent,
        "trade_items": trade_items,
    })

    return _build_result(
        {"market_trade": market_trade, "market_rent": market_rent, "trade_items": trade_items},
        listed_jeonse_price,
        housing_type,
        exclusive_area_m2,
    )


def _build_result(
    prices: dict,
    listed_jeonse_price: int,
    housing_type: str,
    exclusive_area_m2: float = 0.0,
) -> dict:
    """시세 분석 결과 딕셔너리 조합"""
    market_trade = prices.get("market_trade")
    market_rent = prices.get("market_rent")
    warnings: list[str] = []

    jeonse_ratio: float | None = None
    jeonse_grade = "데이터 부족"

    if market_trade and listed_jeonse_price:
        jeonse_ratio = calc_jeonse_ratio(market_trade, listed_jeonse_price)
        jeonse_grade = grade_jeonse_ratio(jeonse_ratio)
    elif not market_trade:
        warnings.append("매매 시세 데이터 없음 — 전세가율 계산 불가")

    if housing_type == "rh":
        warnings.append("빌라·연립은 시세 불투명 주의 — 실거래 건수 적을 수 있음")
    if housing_type == "sh":
        warnings.append("단독·다가구는 선순위 임차인 합산 여부 직접 확인 필요")

    # Phase D: 유사 면적 최근 거래 10건 추출
    trade_items = prices.get("trade_items", [])
    recent_trades = extract_recent_trades(trade_items, exclusive_area_m2) if trade_items else []

    return {
        "market_trade_price": market_trade,
        "market_jeonse_price": market_rent,
        "jeonse_ratio": jeonse_ratio,
        "jeonse_grade": jeonse_grade,
        "market_data_confidence": "none" if not market_trade else "medium",
        "price_trend": "데이터 부족",
        "price_trend_pct": None,
        "warnings": warnings,
        "recent_trades": recent_trades,
    }
