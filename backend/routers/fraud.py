"""등기부 분석 + 사기 스코어링 라우터"""
from fastapi import APIRouter
from pydantic import BaseModel

from services import registry_service, fraud_service
from models.schemas import PropertyInfo, ApiResponse

router = APIRouter()


class RegistryParseRequest(BaseModel):
    registry_text: str


class FraudScoreRequest(BaseModel):
    property_info: PropertyInfo
    registry_text: str


@router.post("/registry/parse")
async def parse_registry(req: RegistryParseRequest) -> ApiResponse[dict]:
    """등기부등본 텍스트 -> Claude AI 해석 -> 구조화 데이터"""
    result = await registry_service.parse_registry(req.registry_text)
    return ApiResponse(success=True, data=result, warnings=["AI 해석 결과는 참고용이며 실제 등기부등본 직접 확인이 필요합니다."])


@router.post("/fraud/score")
async def score_fraud(req: FraudScoreRequest) -> ApiResponse[dict]:
    """등기부 파싱 + 사기 위험도 스코어링 통합 실행"""
    registry_data = await registry_service.parse_registry(req.registry_text)
    result = await fraud_service.calculate_fraud_score(req.property_info, registry_data)
    warnings = ["본 결과는 참고용이며 법적·금융 자문이 아닙니다. 계약 전 전문가 상담을 권장합니다."]
    return ApiResponse(success=True, data=result, warnings=warnings)
