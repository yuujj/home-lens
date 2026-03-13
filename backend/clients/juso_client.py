"""도로명주소 개발자센터 API 클라이언트 — 2025년 juso.go.kr 기준"""

import httpx

from core.config import settings

JUSO_API_URL = "https://business.juso.go.kr/addrlink/addrLinkApi.do"


async def search_address(keyword: str) -> dict | None:
    """
    주소 검색 → 첫 번째 결과 반환
    실패 시 None 반환 (예외 전파 금지)
    반환 필드: roadAddr, jibunAddr, admCd(법정동코드 10자리), siNm, sggNm, emdNm
    """
    params = {
        "currentPage": 1,
        "countPerPage": 1,
        "keyword": keyword,
        "confmKey": settings.JUSO_API_KEY,
        "resultType": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            resp = await client.get(JUSO_API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", {}).get("juso") or []
            return results[0] if results else None
    except Exception:
        return None


def extract_lawd_cd_5(adm_cd_10: str) -> str:
    """법정동코드 10자리 → 앞 5자리 (RTMS API용)"""
    return adm_cd_10[:5]


def classify_metropolitan(sido: str) -> bool:
    """수도권 여부 판단"""
    METROPOLITAN = ["서울특별시", "경기도", "인천광역시"]
    return sido in METROPOLITAN


REGULATION_ZONE_MAP = {
    "서울특별시": "투기지역",
    "경기도": "조정",
    "인천광역시": "조정",
}


def classify_regulation_zone(sido: str) -> str:
    """규제지역 분류 (기본값: 일반)"""
    return REGULATION_ZONE_MAP.get(sido, "일반")
