"""국토부 RTMS 실거래가 API 클라이언트 — 2025년 공공데이터포털 기준"""

import httpx
from core.config import settings

BASE_URL = "http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc"

# housing_type → (매매 서비스명, 전세 서비스명)
SERVICE_MAP = {
    "apt":  ("getRTMSDataSvcAptTradeDev",  "getRTMSDataSvcAptRent"),
    "rh":   ("getRTMSDataSvcRHTradeDev",   "getRTMSDataSvcRHRent"),
    "sh":   ("getRTMSDataSvcSHTradeDev",   None),
    "offi": ("getRTMSDataSvcOffiTradeDev", None),
}


async def _fetch_rtms(service_name: str, lawd_cd: str, deal_ymd: str) -> list[dict]:
    """RTMS API 공통 호출"""
    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "LAWD_CD": lawd_cd,
        "DEAL_YMD": deal_ymd,
        "numOfRows": 100,
        "pageNo": 1,
    }
    url = f"{BASE_URL}/{service_name}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            items = data.get("response", {}).get("body", {}).get("items", {})
            if not items:
                return []
            item = items.get("item", [])
            return item if isinstance(item, list) else [item]
    except Exception:
        return []


async def get_trade_prices(lawd_cd: str, deal_ymd: str, housing_type: str) -> list[dict]:
    """매매 실거래가 조회"""
    services = SERVICE_MAP.get(housing_type)
    if not services or not services[0]:
        return []
    return await _fetch_rtms(services[0], lawd_cd, deal_ymd)


async def get_rent_prices(lawd_cd: str, deal_ymd: str, housing_type: str) -> list[dict]:
    """전세 실거래가 조회"""
    services = SERVICE_MAP.get(housing_type)
    if not services or not services[1]:
        return []
    return await _fetch_rtms(services[1], lawd_cd, deal_ymd)


def parse_rtms_price(price_str: str) -> int:
    """
    RTMS API 가격 필드 파싱: "  85,000" → 85000 (만원 단위)
    """
    return int(price_str.strip().replace(",", "").replace(" ", ""))
