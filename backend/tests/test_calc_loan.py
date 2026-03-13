"""정책 대출 자격 판단 단위 테스트"""
import pytest
from services.loan_service import (
    calc_monthly_payment,
    calc_loan_limit,
    calc_base_rate,
    check_eligibility,
    get_eligible_loans,
    PRODUCTS,
)
from models.schemas import UserProfile, PropertyInfo, Address


# ─── 공통 fixture ─────────────────────────────────────────────────────────────

@pytest.fixture
def seoul_address():
    return Address(
        raw_input="서울시 강남구 역삼동",
        road_addr="서울특별시 강남구 테헤란로 152",
        jibun_addr="서울특별시 강남구 역삼동 737",
        lawd_cd_5="11680", lawd_cd_10="1168010700",
        sido="서울특별시", sigungu="강남구", dong="역삼동",
        is_metropolitan=True, regulation_zone="투기지역",
    )

@pytest.fixture
def mock_property(seoul_address):
    return PropertyInfo(
        address=seoul_address, housing_type="apt",
        exclusive_area_m2=59.99, floor=5, built_year=2015,
        listed_jeonse_price=18000, listed_trade_price=None,
        market_trade_price=85000, market_jeonse_price=52000,
        market_data_confidence="high", senior_mortgage_amount=0,
        has_attachment=False, has_provisional_attachment=False,
        has_auction=False, has_trust=False, has_lease_registration=False,
    )


# ─── 테스트 1: 월상환액 계산 ─────────────────────────────────────────────────
def test_calc_monthly_payment():
    """1억, 연 2%, 20년 → 약 50만원/월"""
    result = calc_monthly_payment(10000, 2.0, 20)
    assert 48 <= result <= 52


def test_calc_monthly_payment_zero_rate():
    """0% 금리 엣지케이스"""
    result = calc_monthly_payment(12000, 0.0, 10)
    assert result == 100  # 1200만원 / 120개월


# ─── 테스트 2: 대출 한도 계산 ────────────────────────────────────────────────
def test_calc_loan_limit_jeonse():
    """청년전용 버팀목: 전세 1.8억, LTV 80%, 최대 2억 → MIN(14400, 20000) = 14400"""
    product = PRODUCTS["청년전용_버팀목"]
    limit = calc_loan_limit(product, 18000)
    assert limit == 14400


# ─── 테스트 3: 연령 조건 필터 ────────────────────────────────────────────────
def test_check_eligibility_age(mock_property):
    """청년전용 버팀목 연령 상한(34세) 초과 → False"""
    user = UserProfile(
        annual_income=3500, is_dual_income=False, net_asset=10000,
        age=35, is_married=False, marriage_years=0, num_children=0,
        has_newborn_2yr=False, housing_ownership="none",
        is_disabled=False, is_single_parent=False, is_multicultural=False,
        subscription_years=3, subscription_count=36, loan_purpose="jeonse",
    )
    result = check_eligibility("청년전용_버팀목", PRODUCTS["청년전용_버팀목"], user, mock_property)
    assert result is False


# ─── 테스트 4: 소득 조건 필터 ────────────────────────────────────────────────
def test_check_eligibility_income(mock_property):
    """버팀목 일반 소득 상한(5천만원) 초과 → False"""
    user = UserProfile(
        annual_income=6000, is_dual_income=False, net_asset=10000,
        age=30, is_married=False, marriage_years=0, num_children=0,
        has_newborn_2yr=False, housing_ownership="none",
        is_disabled=False, is_single_parent=False, is_multicultural=False,
        subscription_years=3, subscription_count=36, loan_purpose="jeonse",
    )
    result = check_eligibility("버팀목_일반", PRODUCTS["버팀목_일반"], user, mock_property)
    assert result is False


# ─── 테스트 5: 통합 자격 판단 — 청년 케이스 ──────────────────────────────────
@pytest.mark.asyncio
async def test_get_eligible_loans_youth(mock_property):
    """연소득 3500만, 만 29세, 전세 1.8억 서울 → 청년전용 버팀목 포함"""
    user = UserProfile(
        annual_income=3500, is_dual_income=False, net_asset=10000,
        age=29, is_married=False, marriage_years=0, num_children=0,
        has_newborn_2yr=False, housing_ownership="none",
        is_disabled=False, is_single_parent=False, is_multicultural=False,
        subscription_years=3, subscription_count=36, loan_purpose="jeonse",
    )
    result = await get_eligible_loans(user, mock_property)
    product_names = [l["product_name"] for l in result["eligible"]]
    assert "청년전용 버팀목전세대출" in product_names
    # 한도 검증: MIN(18000 × 0.8 = 14400, 20000) = 14400
    youth = next(l for l in result["eligible"] if l["product_name"] == "청년전용 버팀목전세대출")
    assert youth["max_limit"] == 14400
