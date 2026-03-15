"""정책 대출 자격 판단 서비스
# [정책 기준일] 2025년 국토교통부 고시 기준 — 금리·조건 변동 가능
# 최신 기준: nhuf.molit.go.kr
"""

import logging

from models.schemas import PropertyInfo, UserProfile
from services.loan_products import PRODUCTS  # 상품 테이블 전용 모듈에서 import

logger = logging.getLogger(__name__)


def calc_monthly_payment(principal: int, annual_rate: float, years: int) -> int:
    """원리금균등상환 월 납입액 (만원 단위)"""
    r = annual_rate / 100 / 12
    n = years * 12
    if r == 0 or n == 0:
        return principal // n if n else 0
    payment = principal * r * (1 + r) ** n / ((1 + r) ** n - 1)
    return round(payment)


def calc_loan_limit(product: dict, price: int) -> int:
    """최종 한도 = MIN(가격 x LTV, 상품 최대 한도) — 만원 단위"""
    ltv_limit = round(price * product["LTV"])
    return min(ltv_limit, product["최대_한도"] // 10000)


def calc_base_rate(product: dict, annual_income: int) -> float:
    """소득 구간 테이블에서 기본금리 조회"""
    for income_limit, rate in product["금리_구간"]:
        if annual_income <= income_limit:
            return rate
    return product["금리_구간"][-1][1]


def calc_benefit_rate(product_key: str, user: UserProfile) -> float:
    """우대금리 합산 (중복 적용), 최저 하한 1.0%"""
    discount = 0.0
    if user.num_children == 1:
        discount += 0.3
    elif user.num_children == 2:
        discount += 0.5
    elif user.num_children >= 3:
        discount += 0.7
    if user.is_married and user.marriage_years <= 7:
        discount += 0.2
    if user.is_disabled:
        discount += 0.2
    if user.is_single_parent:
        discount += 0.5
    if user.subscription_years >= 15:
        discount += 0.5
    elif user.subscription_years >= 10:
        discount += 0.4
    elif user.subscription_years >= 5:
        discount += 0.3
    return discount


def check_eligibility(
    product_key: str, product: dict,
    user: UserProfile, property_info: PropertyInfo,
) -> bool:
    """상품별 자격 조건 체크"""
    # 용도 필터
    if product["용도"] != user.loan_purpose:
        return False
    # 소득 상한
    income_limit = product.get(
        "소득_상한_맞벌이" if user.is_dual_income else "소득_상한",
        product["소득_상한"],
    )
    if user.annual_income * 10000 > income_limit:
        return False
    # 순자산 상한
    if user.net_asset * 10000 > product["순자산_상한"]:
        return False
    # 연령
    if not (product["연령_하한"] <= user.age <= product["연령_상한"]):
        return False
    # 주택 가격/보증금 상한
    if user.loan_purpose == "jeonse":
        price_field = (
            "보증금_상한_수도권"
            if property_info.address.is_metropolitan
            else "보증금_상한_비수도권"
        )
        price_limit = product.get(price_field, 999_999_999_999)
        listed_price = (property_info.listed_jeonse_price or 0) * 10000
        if listed_price > price_limit:
            return False
    else:
        price_limit = product.get("주택가격_상한", 999_999_999_999)
        listed_price = (property_info.listed_trade_price or 0) * 10000
        if listed_price and listed_price > price_limit:
            return False
    # 면적
    if property_info.exclusive_area_m2 > product.get("면적_상한_m2", 999):
        return False
    # 신생아 필수
    if product.get("신생아_필수") and not user.has_newborn_2yr:
        return False
    # 혼인기간 (신혼)
    if "혼인기간_상한_년" in product:
        if not user.is_married or user.marriage_years > product["혼인기간_상한_년"]:
            return False
    return True


def get_ineligible_reason(
    product_key: str, product: dict,
    user: UserProfile, property_info: PropertyInfo,
) -> str:
    """자격 미충족 이유 반환"""
    if product["용도"] != user.loan_purpose:
        return f"대출 목적 불일치 (상품: {product['용도']}, 요청: {user.loan_purpose})"
    income_limit = product.get(
        "소득_상한_맞벌이" if user.is_dual_income else "소득_상한",
        product["소득_상한"],
    )
    if user.annual_income * 10000 > income_limit:
        return f"소득 초과 (한도: {income_limit // 10000:,}만원, 입력: {user.annual_income:,}만원)"
    if not (product["연령_하한"] <= user.age <= product["연령_상한"]):
        return f"연령 조건 불충족 ({product['연령_하한']}~{product['연령_상한']}세)"
    if product.get("신생아_필수") and not user.has_newborn_2yr:
        return "2년 이내 출산·입양 이력 없음"
    if "혼인기간_상한_년" in product:
        if not user.is_married or user.marriage_years > product["혼인기간_상한_년"]:
            return f"혼인 {product['혼인기간_상한_년']}년 초과 또는 미혼"
    return "자격 조건 미충족"


async def get_eligible_loans(
    user: UserProfile, property_info: PropertyInfo,
) -> dict:
    """
    메인 함수 — 전체 7개 상품 자격 체크 후 결과 반환
    통과 상품: 한도·금리·월상환액 계산 후 금리 낮은 순 정렬
    불통과 상품: 불가 사유 포함
    """
    eligible = []
    ineligible = []
    # 사용자 입력 보증금 → 시세 보증금 → 0 순서로 fallback
    price = (
        property_info.listed_jeonse_price
        or property_info.market_jeonse_price
        or 0
        if user.loan_purpose == "jeonse"
        else property_info.listed_trade_price
        or property_info.market_trade_price
        or 0
    )

    if price == 0:
        logger.warning(
            "대출 한도 계산 불가 — 보증금/매매가 미입력 "
            "(listed_jeonse=%s, market_jeonse=%s, listed_trade=%s, market_trade=%s)",
            property_info.listed_jeonse_price,
            property_info.market_jeonse_price,
            property_info.listed_trade_price,
            property_info.market_trade_price,
        )

    for key, product in PRODUCTS.items():
        if check_eligibility(key, product, user, property_info):
            base_rate = calc_base_rate(product, user.annual_income * 10000)
            benefit = calc_benefit_rate(key, user)
            final_rate = max(round(base_rate - benefit, 2), 1.0)
            limit = calc_loan_limit(product, price)
            monthly = calc_monthly_payment(limit, final_rate, 20)
            notes = list(product["주의사항"])
            if limit == 0:
                notes = ["⚠️ 보증금(매매가) 정보 없음 — 한도 계산 불가"] + notes
            eligible.append({
                "product_name": product["상품명"],
                "max_limit": limit,
                "rate_min": final_rate,
                "rate_max": base_rate,
                "rate_with_benefit": final_rate,
                "ltv": product["LTV"],
                "monthly_payment_estimate": monthly,
                "notes": notes,
            })
        else:
            ineligible.append({
                "product_name": product["상품명"],
                "reason": get_ineligible_reason(key, product, user, property_info),
            })

    eligible.sort(key=lambda x: x["rate_with_benefit"])
    return {"eligible": eligible, "ineligible": ineligible}
