"""등기부등본 파싱 서비스"""
from clients import claude_client


async def parse_registry(registry_text: str) -> dict:
    """
    등기부등본 텍스트 -> 구조화 데이터
    전처리: 연속 공백 정규화, 8000자 이후 truncation은 claude_client에서 처리
    """
    # 기본 전처리
    cleaned = " ".join(registry_text.split())
    return await claude_client.parse_registry_text(cleaned)
