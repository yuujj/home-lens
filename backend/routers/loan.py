"""정책 대출 자격 판단 라우터 — POST /api/loan/eligible"""
from fastapi import APIRouter
from pydantic import BaseModel

from models.schemas import ApiResponse, PropertyInfo, UserProfile
from services import loan_service

router = APIRouter()


class LoanEligibleRequest(BaseModel):
    user_profile: UserProfile
    property_info: PropertyInfo


@router.post("/loan/eligible")
async def get_eligible_loans(req: LoanEligibleRequest) -> ApiResponse[dict]:
    """정책 대출 자격 판단 + 한도·금리·월상환액 계산"""
    result = await loan_service.get_eligible_loans(req.user_profile, req.property_info)
    warnings = [
        "대출 조건·금리는 참고용이며 실제 심사 결과와 다를 수 있습니다."
        " nhuf.molit.go.kr에서 최신 기준을 확인하세요."
    ]
    return ApiResponse(success=True, data=result, warnings=warnings)
