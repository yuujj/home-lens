"""Anthropic Claude API 클라이언트 — 등기부등본 텍스트 파싱 전용
# [API 기준] anthropic SDK, claude-sonnet-4-6 모델, tool_use 방식
# AsyncAnthropic 사용 — FastAPI async 이벤트 루프와 충돌 방지
"""
import anthropic

from core.config import settings

_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

REGISTRY_PARSE_TOOL = {
    "name": "parse_registry",
    "description": (
        "등기부등본 텍스트에서 전세 사기 관련 위험 정보를 구조화하여 추출한다. "
        "AI 해석은 참고용이며 전문가 확인이 필요합니다."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "senior_mortgage_amount": {
                "type": "integer",
                "description": "선순위 근저당 채권최고액 합계 (만원). 없으면 0",
            },
            "has_attachment": {"type": "boolean", "description": "가압류 존재 여부"},
            "has_provisional_attachment": {"type": "boolean", "description": "가처분 존재 여부"},
            "has_auction": {"type": "boolean", "description": "경매개시결정 여부"},
            "has_trust": {"type": "boolean", "description": "신탁등기 여부"},
            "has_lease_registration": {"type": "boolean", "description": "임차권등기 여부"},
            "has_seizure": {"type": "boolean", "description": "압류 여부"},
            "has_provisional_registration": {"type": "boolean", "description": "가등기 여부"},
            "owner_acquired_recently": {"type": "boolean", "description": "최근 6개월 내 소유권 취득 여부"},
            "is_corporate_owner": {"type": "boolean", "description": "법인 소유 여부"},
        },
        "required": [
            "senior_mortgage_amount", "has_attachment", "has_provisional_attachment",
            "has_auction", "has_trust", "has_lease_registration",
        ],
    },
}

_DEFAULT_REGISTRY = {
    "senior_mortgage_amount": 0,
    "has_attachment": False,
    "has_provisional_attachment": False,
    "has_auction": False,
    "has_trust": False,
    "has_lease_registration": False,
    "has_seizure": False,
    "has_provisional_registration": False,
    "owner_acquired_recently": False,
    "is_corporate_owner": False,
}


async def parse_registry_text(registry_text: str) -> dict:
    """
    등기부등본 원문 -> 구조화 dict 반환
    실패 시 _DEFAULT_REGISTRY 반환 (예외 전파 금지)
    """
    # 토큰 절약을 위해 최대 8000자로 자름
    truncated = registry_text[:8000]
    try:
        response = await _client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=1024,
            tools=[REGISTRY_PARSE_TOOL],
            tool_choice={"type": "tool", "name": "parse_registry"},
            messages=[{
                "role": "user",
                "content": (
                    "다음은 부동산 등기부등본 텍스트입니다. "
                    "parse_registry 도구를 사용해 위험 정보를 추출하세요. "
                    "확인 불가한 항목은 False/0으로 설정하세요.\n\n"
                    f"{truncated}"
                ),
            }],
        )
        for block in response.content:
            if block.type == "tool_use" and block.name == "parse_registry":
                result = dict(_DEFAULT_REGISTRY)
                result.update(block.input)
                return result
    except Exception:
        pass
    return dict(_DEFAULT_REGISTRY)
