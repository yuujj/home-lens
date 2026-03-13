"""주소 정규화 라우터 — POST /api/address/normalize"""

from fastapi import APIRouter
from pydantic import BaseModel

from clients import juso_client
from models.schemas import Address, ApiResponse

router = APIRouter()


class AddressNormalizeRequest(BaseModel):
    raw_address: str


@router.post("/address/normalize")
async def normalize_address(req: AddressNormalizeRequest) -> ApiResponse[Address]:
    """도로명주소 API 호출 → Address 모델 반환"""
    result = await juso_client.search_address(req.raw_address)
    if not result:
        return ApiResponse(
            success=False,
            error="주소를 찾을 수 없습니다. 더 구체적인 주소를 입력해 주세요.",
            warnings=[],
        )
    adm_cd = result.get("admCd", "")
    sido = result.get("siNm", "")
    address = Address(
        raw_input=req.raw_address,
        road_addr=result.get("roadAddr", ""),
        jibun_addr=result.get("jibunAddr", ""),
        lawd_cd_5=juso_client.extract_lawd_cd_5(adm_cd),
        lawd_cd_10=adm_cd,
        sido=sido,
        sigungu=result.get("sggNm", ""),
        dong=result.get("emdNm", ""),
        is_metropolitan=juso_client.classify_metropolitan(sido),
        regulation_zone=juso_client.classify_regulation_zone(sido),
    )
    return ApiResponse(success=True, data=address, warnings=[])
