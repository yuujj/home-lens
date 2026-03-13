"""Pydantic v2 스키마 모듈 — API 요청/응답에 사용되는 데이터 모델을 정의합니다."""

from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """범용 API 응답 래퍼."""

    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    warnings: list[str] = []


class Address(BaseModel):
    """주소 정보 및 법정동 코드."""

    raw_input: str
    road_addr: str
    jibun_addr: str
    lawd_cd_5: str       # RTMS API용 5자리 법정동 코드
    lawd_cd_10: str      # 공시가격 API용 10자리 법정동 코드
    sido: str
    sigungu: str
    dong: str
    is_metropolitan: bool
    regulation_zone: str  # "투기지역" | "투기과열" | "조정" | "일반"


class PropertyInfo(BaseModel):
    """매물 정보 — 시세, 등기 위험 요소 포함."""

    address: Address
    housing_type: str               # "apt" | "rh" | "sh" | "offi"
    exclusive_area_m2: float
    floor: Optional[int] = None
    built_year: Optional[int] = None
    listed_jeonse_price: Optional[int] = None   # 만원 단위
    listed_trade_price: Optional[int] = None    # 만원 단위
    market_trade_price: Optional[int] = None
    market_jeonse_price: Optional[int] = None
    market_data_confidence: str = "none"  # "high"|"medium"|"low"|"estimated"|"none"
    senior_mortgage_amount: int = 0
    has_attachment: bool = False
    has_provisional_attachment: bool = False
    has_auction: bool = False
    has_trust: bool = False
    has_lease_registration: bool = False


class UserProfile(BaseModel):
    """사용자 프로필 — 대출 자격 산정에 사용됩니다."""

    annual_income: int
    is_dual_income: bool = False
    net_asset: int
    age: int
    is_married: bool = False
    marriage_years: int = 0
    num_children: int = 0
    has_newborn_2yr: bool = False
    housing_ownership: str = "none"   # "none"|"first_time"|"one_house"
    is_disabled: bool = False
    is_single_parent: bool = False
    is_multicultural: bool = False
    subscription_years: int = 0
    subscription_count: int = 0
    loan_purpose: str = "jeonse"      # "buy"|"jeonse"


class LoanResult(BaseModel):
    """대출 상품 결과 — 한도, 금리, 월 상환 추정액."""

    product_name: str
    max_limit: int
    rate_min: float
    rate_max: float
    rate_with_benefit: float
    ltv: float
    monthly_payment_estimate: Optional[int] = None
    notes: list[str] = []


class AnalysisResult(BaseModel):
    """종합 분석 결과 — 전세가율, 사기 위험도, 적격 대출 상품."""

    property: PropertyInfo
    user: UserProfile
    jeonse_ratio: Optional[float] = None
    jeonse_grade: str = "데이터 부족"
    price_trend: str = "데이터 부족"
    price_trend_pct: Optional[float] = None
    fraud_score: int = 0
    fraud_grade: str = "분석 전"
    fraud_flags: list[str] = []
    eligible_loans: list[LoanResult] = []
