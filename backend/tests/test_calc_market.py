"""시세 분석 단위 테스트 — 외부 API 미호출, fixture 기반"""

import pytest
from unittest.mock import AsyncMock
from clients import rtms_client
from services import market_service
from services.market_service import (
    calc_jeonse_ratio,
    grade_jeonse_ratio,
    filter_similar_area,
    determine_market_price,
)
from clients.rtms_client import parse_rtms_price
from models.schemas import Address

# ─── 테스트 1: 전세가율 계산 경계값 ─────────────────────────────────────────


def test_calc_jeonse_ratio_boundary():
    """전세가율 경계값 4개 검증"""
    assert calc_jeonse_ratio(10000, 6000) == 60.0
    assert calc_jeonse_ratio(10000, 7000) == 70.0
    assert calc_jeonse_ratio(10000, 8000) == 80.0
    assert calc_jeonse_ratio(10000, 9000) == 90.0


# ─── 테스트 2: 전세가율 등급 판정 ────────────────────────────────────────────


def test_grade_jeonse_ratio():
    """5단계 등급 전환점 검증"""
    assert grade_jeonse_ratio(59.9) == "안전"
    assert grade_jeonse_ratio(60.0) == "양호"
    assert grade_jeonse_ratio(70.0) == "주의"
    assert grade_jeonse_ratio(80.0) == "위험"
    assert grade_jeonse_ratio(90.0) == "매우 위험"
    assert grade_jeonse_ratio(99.9) == "매우 위험"


# ─── 테스트 3: RTMS 가격 파싱 ────────────────────────────────────────────────


def test_parse_rtms_price():
    """공백·쉼표 포함 가격 문자열 파싱"""
    assert parse_rtms_price("  85,000") == 85000
    assert parse_rtms_price("130,000") == 130000
    assert parse_rtms_price(" 5,500") == 5500
    assert parse_rtms_price("1,000,000") == 1000000


# ─── 테스트 4: 유사 면적 필터 ────────────────────────────────────────────────


def test_filter_similar_area():
    """±10% 면적 필터 + 해제 건 제거"""
    items = [
        {"전용면적": "84.99"},                          # 타겟과 동일 → 포함
        {"전용면적": "59.99"},                          # 30% 차이 → 제외
        {"전용면적": "90.00"},                          # 6% 차이 → 포함
        {"전용면적": "84.99", "해제여부": "Y"},         # 해제 → 제외
        {"전용면적": "93.50"},                          # 10.6% 차이 → 제외
    ]
    result = filter_similar_area(items, 84.99)
    assert len(result) == 2
    areas = [float(i["전용면적"]) for i in result]
    assert 84.99 in areas
    assert 90.00 in areas


# ─── 테스트 5: 시세 분석 서비스 (fixture 기반) ───────────────────────────────


@pytest.mark.asyncio
async def test_market_service_with_fixture(monkeypatch, mock_rtms_trade_items, mock_rtms_rent_items):
    """외부 API 미호출 — fixture 기반 시세 분석 E2E 검증"""
    monkeypatch.setattr(
        rtms_client, "get_trade_prices", AsyncMock(return_value=mock_rtms_trade_items)
    )
    monkeypatch.setattr(
        rtms_client, "get_rent_prices", AsyncMock(return_value=mock_rtms_rent_items)
    )

    address = Address(
        raw_input="서울시 강남구 역삼동",
        road_addr="서울특별시 강남구 테헤란로 152",
        jibun_addr="서울특별시 강남구 역삼동 737",
        lawd_cd_5="11680",
        lawd_cd_10="1168010700",
        sido="서울특별시",
        sigungu="강남구",
        dong="역삼동",
        is_metropolitan=True,
        regulation_zone="투기지역",
    )
    result = await market_service.analyze_market(address, "apt", 84.99, 50000)

    # 외부 API가 실제로 호출되지 않았는지 확인 (mock이 응답했으면 호출됨)
    assert rtms_client.get_trade_prices.called  # type: ignore[attr-defined]
    assert result["jeonse_ratio"] is not None
    assert result["jeonse_grade"] in ["안전", "양호", "주의", "위험", "매우 위험", "데이터 부족"]
    assert "warnings" in result
