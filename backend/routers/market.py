"""시세 분석 라우터 — POST /api/market/analyze"""

from fastapi import APIRouter
from pydantic import BaseModel

from clients import juso_client
from models.schemas import Address, ApiResponse
from services import market_service

router = APIRouter()


class MarketAnalyzeRequest(BaseModel):
    raw_address: str
    housing_type: str        # "apt" | "rh" | "sh" | "offi"
    exclusive_area_m2: float
    listed_jeonse_price: int


@router.post("/market/analyze")
async def analyze_market_endpoint(req: MarketAnalyzeRequest) -> ApiResponse[dict]:
    """시세 분석 — 주소 정규화 → RTMS 조회 → 전세가율 계산"""
    # 주소 정규화
    juso_result = await juso_client.search_address(req.raw_address)
    if not juso_result:
        return ApiResponse(
            success=False,
            error="주소를 찾을 수 없습니다.",
            warnings=[],
        )
    adm_cd = juso_result.get("admCd", "")
    sido = juso_result.get("siNm", "")
    address = Address(
        raw_input=req.raw_address,
        road_addr=juso_result.get("roadAddr", ""),
        jibun_addr=juso_result.get("jibunAddr", ""),
        lawd_cd_5=juso_client.extract_lawd_cd_5(adm_cd),
        lawd_cd_10=adm_cd,
        sido=sido,
        sigungu=juso_result.get("sggNm", ""),
        dong=juso_result.get("emdNm", ""),
        is_metropolitan=juso_client.classify_metropolitan(sido),
        regulation_zone=juso_client.classify_regulation_zone(sido),
    )
    result = await market_service.analyze_market(
        address, req.housing_type, req.exclusive_area_m2, req.listed_jeonse_price
    )
    return ApiResponse(success=True, data=result, warnings=result.pop("warnings", []))
