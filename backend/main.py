"""애플리케이션 진입점 — FastAPI 앱 인스턴스 생성 및 미들웨어/라우터 등록."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers.health import router as health_router
from routers import address, market, fraud, loan, analyze

# FastAPI 앱 생성
app = FastAPI(
    title="HomeLens API",
    description="전세 사기 위험도 분석 및 대출 상품 추천 서비스",
    version="0.1.0",
)

# CORS 미들웨어 등록 — 허용 오리진은 환경변수에서 읽음
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(health_router, prefix="/api")
app.include_router(address.router, prefix="/api")
app.include_router(market.router, prefix="/api")
app.include_router(fraud.router, prefix="/api")
app.include_router(loan.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
