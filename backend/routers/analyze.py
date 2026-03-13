"""통합 분석 라우터 — POST /api/analyze/full"""
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from clients import juso_client
from services import market_service, registry_service, fraud_service, loan_service
from models.schemas import Address, PropertyInfo, UserProfile, ApiResponse

router = APIRouter()


class FullAnalyzeRequest(BaseModel):
    raw_address: str
    housing_type: str
    exclusive_area_m2: float
    listed_jeonse_price: int
    registry_text: str
    user_profile: Optional[UserProfile] = None


@router.post("/analyze/full")
async def full_analyze(req: FullAnalyzeRequest) -> ApiResponse[dict]:
    """F001 + F002 + F003 통합 분석 (순차 실행)"""
    warnings: list[str] = []

    # 1. 주소 정규화
    juso = await juso_client.search_address(req.raw_address)
    if not juso:
        return ApiResponse(success=False, error="주소를 찾을 수 없습니다.", warnings=[])
    adm_cd = juso.get("admCd", "")
    sido = juso.get("siNm", "")
    address = Address(
        raw_input=req.raw_address,
        road_addr=juso.get("roadAddr", ""),
        jibun_addr=juso.get("jibunAddr", ""),
        lawd_cd_5=juso_client.extract_lawd_cd_5(adm_cd),
        lawd_cd_10=adm_cd,
        sido=sido,
        sigungu=juso.get("sggNm", ""),
        dong=juso.get("emdNm", ""),
        is_metropolitan=juso_client.classify_metropolitan(sido),
        regulation_zone=juso_client.classify_regulation_zone(sido),
    )

    # 2. 시세 분석
    market = await market_service.analyze_market(
        address, req.housing_type, req.exclusive_area_m2, req.listed_jeonse_price,
    )
    warnings.extend(market.pop("warnings", []))

    # 3. 등기부 분석 + 스코어링
    registry_data = await registry_service.parse_registry(req.registry_text)
    property_info = PropertyInfo(
        address=address,
        housing_type=req.housing_type,
        exclusive_area_m2=req.exclusive_area_m2,
        floor=None,
        built_year=None,
        listed_jeonse_price=req.listed_jeonse_price,
        listed_trade_price=None,
        market_trade_price=market.get("market_trade_price"),
        market_jeonse_price=market.get("market_jeonse_price"),
        market_data_confidence=market.get("market_data_confidence", "none"),
        senior_mortgage_amount=registry_data.get("senior_mortgage_amount", 0),
        has_attachment=registry_data.get("has_attachment", False),
        has_provisional_attachment=registry_data.get("has_provisional_attachment", False),
        has_auction=registry_data.get("has_auction", False),
        has_trust=registry_data.get("has_trust", False),
        has_lease_registration=registry_data.get("has_lease_registration", False),
    )
    fraud = await fraud_service.calculate_fraud_score(property_info, registry_data)

    # 4. 정책 대출 (user_profile 있을 때만)
    loans: dict = {"eligible": [], "ineligible": []}
    if req.user_profile:
        loans = await loan_service.get_eligible_loans(req.user_profile, property_info)

    warnings.append("본 결과는 참고용이며 법적·금융 자문이 아닙니다.")
    return ApiResponse(success=True, data={
        "market": market,
        "fraud": fraud,
        "loans": loans,
        "address": address.model_dump(),
    }, warnings=warnings)
