"""헬스체크 라우터 — 서비스 정상 동작 여부를 확인하는 엔드포인트를 제공합니다."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """서비스 헬스체크 엔드포인트."""
    return {"status": "ok", "service": "HomeLens API"}
