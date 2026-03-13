"""등기부 분석 + 사기 스코어링 라우터"""
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from core.utils import camelize
from models.schemas import ApiResponse, PropertyInfo
from services import fraud_service, registry_service
from services.pdf_service import MAX_PDF_SIZE, extract_text_from_pdf

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
    return ApiResponse(
        success=True,
        data=camelize(result),
        warnings=["AI 해석 결과는 참고용이며 실제 등기부등본 직접 확인이 필요합니다."],
    )


@router.post("/registry/upload-pdf")
async def upload_registry_pdf(file: UploadFile = File(...)) -> ApiResponse[dict]:
    """PDF 등기부등본 업로드 → 텍스트 추출 (최대 10MB, .pdf만 허용)"""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다.")
    content = await file.read()
    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기가 10MB를 초과합니다.")
    try:
        text = extract_text_from_pdf(content)
    except Exception:
        raise HTTPException(status_code=422, detail="PDF 텍스트 추출에 실패했습니다.")
    return ApiResponse(success=True, data={"text": text}, warnings=[])


@router.post("/fraud/score")
async def score_fraud(req: FraudScoreRequest) -> ApiResponse[dict]:
    """등기부 파싱 + 사기 위험도 스코어링 통합 실행"""
    registry_data = await registry_service.parse_registry(req.registry_text)
    result = await fraud_service.calculate_fraud_score(req.property_info, registry_data)
    warnings = ["본 결과는 참고용이며 법적·금융 자문이 아닙니다. 계약 전 전문가 상담을 권장합니다."]
    return ApiResponse(success=True, data=camelize(result), warnings=warnings)
