"""등기부등본 파싱 서비스"""
from clients import claude_client

# 등기부등본 최소 유효 길이 (너무 짧으면 유효 문서 아닐 가능성)
MIN_REGISTRY_LENGTH = 50

# 필수 반환 필드 및 기본값 (Claude 응답 누락 시 안전 fallback)
_REQUIRED_FIELDS: dict = {
    "senior_mortgage_amount": 0,
    "has_attachment": False,
    "has_provisional_attachment": False,
    "has_auction": False,
    "has_trust": False,
    "has_lease_registration": False,
    "owner_acquired_recently": False,
    "is_corporate_owner": False,
}


def _validate_parsed_result(result: dict) -> dict:
    """
    Claude 파싱 결과 검증 및 정규화
    - 누락 필드를 안전한 기본값으로 채움
    - 음수 금액 → 0으로 보정
    - 예: {"senior_mortgage_amount": -100} → {"senior_mortgage_amount": 0}
    """
    validated = dict(_REQUIRED_FIELDS)
    validated.update(result)
    # 금액 음수 방어
    if validated["senior_mortgage_amount"] < 0:
        validated["senior_mortgage_amount"] = 0
    # bool 타입 강제
    for field in [k for k, v in _REQUIRED_FIELDS.items() if isinstance(v, bool)]:
        validated[field] = bool(validated[field])
    return validated


async def parse_registry(registry_text: str) -> dict:
    """
    등기부등본 텍스트 → 구조화 데이터
    전처리: 연속 공백 정규화, 8000자 이후 truncation은 claude_client에서 처리
    반환 보장 필드: senior_mortgage_amount, has_attachment, has_provisional_attachment,
                   has_auction, has_trust, has_lease_registration,
                   owner_acquired_recently, is_corporate_owner
    """
    if not registry_text or len(registry_text.strip()) < MIN_REGISTRY_LENGTH:
        # 텍스트가 너무 짧으면 빈 결과 반환 (API 호출 낭비 방지)
        return dict(_REQUIRED_FIELDS)

    # 기본 전처리: 연속 공백 정규화
    cleaned = " ".join(registry_text.split())
    raw = await claude_client.parse_registry_text(cleaned)
    return _validate_parsed_result(raw)
