"""전세 사기 스코어링 단위 테스트 — Claude API 미호출, fixture 기반"""
import pytest
from unittest.mock import AsyncMock
from clients import claude_client
from services import fraud_service
from services.fraud_service import (
    calc_jeonse_ratio_score,
    calc_mortgage_ratio_score,
    calc_registry_keyword_score,
    calc_landlord_score,
    grade_fraud_score,
    calculate_fraud_score,
)
from models.schemas import PropertyInfo, Address


# 테스트용 PropertyInfo fixture
@pytest.fixture
def mock_property_info():
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
    return PropertyInfo(
        address=address,
        housing_type="apt",
        exclusive_area_m2=84.99,
        floor=5,
        built_year=2015,
        listed_jeonse_price=50000,
        listed_trade_price=None,
        market_trade_price=85000,
        market_jeonse_price=52000,
        market_data_confidence="high",
        senior_mortgage_amount=12000,
        has_attachment=False,
        has_provisional_attachment=False,
        has_auction=False,
        has_trust=False,
        has_lease_registration=False,
    )


# ─── 테스트 1: 전세가율 점수 경계값 ─────────────────────────────────────────
def test_calc_jeonse_ratio_score():
    assert calc_jeonse_ratio_score(59.9) == 0
    assert calc_jeonse_ratio_score(60.0) == 10
    assert calc_jeonse_ratio_score(70.0) == 20
    assert calc_jeonse_ratio_score(80.0) == 30
    assert calc_jeonse_ratio_score(99.9) == 30


# ─── 테스트 2: 근저당비율 점수 ────────────────────────────────────────────────
def test_calc_mortgage_ratio_score():
    # 실효비율 60% → 0점
    assert calc_mortgage_ratio_score(10000, 5000, 1000) == 0
    # 실효비율 75% → 15점
    assert calc_mortgage_ratio_score(10000, 5000, 2500) == 15
    # 실효비율 90% → 30점
    assert calc_mortgage_ratio_score(10000, 5000, 4000) == 30
    # trade_price=0 엣지케이스
    assert calc_mortgage_ratio_score(0, 5000, 1000) == 0


# ─── 테스트 3: 등기 키워드 점수 조합 ──────────────────────────────────────────
def test_calc_registry_keyword_score():
    # 위험 키워드 없음 → 0점
    clean = {k: False for k in ["has_attachment","has_provisional_attachment","has_auction","has_trust","has_lease_registration","has_seizure","has_provisional_registration"]}
    score, flags = calc_registry_keyword_score(clean)
    assert score == 0
    assert len(flags) == 0

    # 가압류만 → 10점
    data = dict(clean)
    data["has_attachment"] = True
    score, flags = calc_registry_keyword_score(data)
    assert score == 10
    assert any("가압류" in f for f in flags)

    # 경매 + 신탁 → 20점 (cap)
    data["has_auction"] = True
    data["has_trust"] = True
    score, _ = calc_registry_keyword_score(data)
    assert score == 20


# ─── 테스트 4: 전체 스코어 통합 (fixture 기반, Claude API 미호출) ───────────────
@pytest.mark.asyncio
async def test_calculate_fraud_score_safe(mock_property_info, mock_claude_response):
    result = await calculate_fraud_score(mock_property_info, mock_claude_response)
    assert 0 <= result["fraud_score"] <= 100
    assert result["fraud_grade"] in ["안전", "주의", "위험", "매우 위험"]
    assert isinstance(result["fraud_flags"], list)
    assert isinstance(result["checklist_items"], list)
    assert len(result["checklist_items"]) > 0


# ─── 테스트 5: 경계 케이스 — 0점 (완전 안전) ─────────────────────────────────
def test_fraud_score_zero():
    ratio_score = calc_jeonse_ratio_score(50.0)
    mortgage_score = calc_mortgage_ratio_score(10000, 5000, 0)
    assert ratio_score == 0
    assert mortgage_score == 0


# ─── 테스트 6: 등급 판정 경계값 ───────────────────────────────────────────────
def test_grade_fraud_score():
    assert grade_fraud_score(0)   == "안전"
    assert grade_fraud_score(30)  == "안전"
    assert grade_fraud_score(31)  == "주의"
    assert grade_fraud_score(50)  == "주의"
    assert grade_fraud_score(51)  == "위험"
    assert grade_fraud_score(70)  == "위험"
    assert grade_fraud_score(71)  == "매우 위험"
    assert grade_fraud_score(100) == "매우 위험"
