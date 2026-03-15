# Sprint 4 — F003 정책 대출 자격 판단 + F004 통합 대시보드

**기간**: 2026-03-16 오전
**담당 에이전트**: Alex (백엔드) → Sam 병렬, Chris (테스트)
**목표**: 7개 정책 대출 자격 판단 + 3탭 통합 결과 대시보드 완성

---

## 목표 요약

| 항목 | 내용 |
|------|------|
| 핵심 기능 | `POST /api/loan/eligible` + `POST /api/analyze/full` 동작 |
| UI | 정책 대출 카드 리스트 + 3탭 통합 대시보드 완성 |
| 테스트 | 대출 자격 필터 + 월 상환액 계산 단위 테스트 |
| 커밋 목표 | Sprint 누적 30개 이상 |

---

## 1. Alex — 백엔드 정책 대출 + 통합 API

### 1-1. 신규 파일

```
backend/
├── services/
│   └── loan_service.py      ← 정책 대출 자격 판단 엔진
└── routers/
    ├── loan.py              ← POST /api/loan/eligible
    └── analyze.py           ← POST /api/analyze/full
```

### 1-2. `services/loan_service.py` (핵심)

#### 상품 테이블 (하드코딩 — 외부 API 불필요)

```python
# [정책 기준일] 2025년 국토교통부 고시 기준
# 금리·조건 변동 가능 — 최신 기준: nhuf.molit.go.kr
PRODUCTS = {
    "청년전용_버팀목": {
        "용도": "jeonse",
        "연령_하한": 19, "연령_상한": 34,
        "소득_상한": 50_000_000,
        "순자산_상한": 337_000_000,
        "보증금_상한_수도권": 300_000_000,
        "보증금_상한_비수도권": 300_000_000,
        "면적_상한_m2": 85,
        "최대_한도": 200_000_000,
        "LTV": 0.80,
        "금리_구간": [
            (20_000_000, 1.3),
            (40_000_000, 1.8),
            (50_000_000, 2.1),
        ],  # (소득상한, 기본금리)
    },
    "버팀목_일반": { ... },
    "버팀목_신혼": { ... },
    "신생아특례_버팀목": { ... },
    "디딤돌_일반": { ... },
    "신생아특례_디딤돌": { ... },
    "보금자리론": { ... },
}
```

#### 핵심 계산 함수

```python
def calc_monthly_payment(principal: int, annual_rate: float, years: int) -> int:
    """
    원리금균등상환 월 납입액 계산 (만원 단위)
    r = annual_rate / 100 / 12
    n = years * 12
    if r == 0: return principal // n  # 0% 엣지케이스
    payment = principal * r * (1+r)**n / ((1+r)**n - 1)
    return round(payment)
    """

def calc_loan_limit(product: dict, price: int, is_metropolitan: bool) -> int:
    """
    최종 한도 = MIN(가격 × LTV, 상품 최대 한도)
    전세: MIN(보증금 × LTV, 최대한도)
    구입: MIN(주택가격 × LTV, DTI 한도, 최대한도)
    """

def calc_base_rate(product: dict, annual_income: int) -> float:
    """소득 구간 테이블에서 기본금리 조회"""

def calc_benefit_rate(product_key: str, user: UserProfile) -> float:
    """
    우대금리 합산 (중복 적용)
    자녀 1명: -0.3%p / 2명: -0.5%p / 3명+: -0.7%p
    신혼: -0.2%p / 장애인: -0.2%p / 한부모: -0.5%p
    청약통장 5년: -0.3%p / 10년: -0.4%p / 15년: -0.5%p
    최저 금리 하한: 1.5%
    """

def check_eligibility(product_key: str, product: dict, user: UserProfile, property_info: PropertyInfo) -> bool:
    """
    상품별 자격 조건 체크
    Step 1: 용도 필터 (buy/jeonse)
    Step 2: 소득 상한 체크 (맞벌이 합산 여부 포함)
    Step 3: 순자산 상한 체크
    Step 4: 주택가격/보증금 상한 체크
    Step 5: 전용면적 체크
    Step 6: 특수 조건 (연령, 신생아, 신혼, 생애최초)
    """

def get_ineligible_reason(product_key: str, product: dict, user: UserProfile, property_info: PropertyInfo) -> str:
    """자격 미충족 이유 반환 (UI 표시용)"""

async def get_eligible_loans(user: UserProfile, property_info: PropertyInfo) -> dict:
    """
    메인 함수
    1. 전체 7개 상품 자격 체크
    2. 통과 상품: 한도 + 금리 + 월상환액 계산
    3. 금리 낮은 순 정렬
    4. 불통과 상품: 불가 사유 포함
    반환: {"eligible": [LoanResult], "ineligible": [{"product_name", "reason"}]}
    """
```

### 1-3. `routers/loan.py`

```python
class LoanEligibleRequest(BaseModel):
    user_profile: UserProfile
    property_info: PropertyInfo

@router.post("/loan/eligible")
async def get_eligible_loans(req: LoanEligibleRequest) -> ApiResponse[dict]:
    """정책 대출 자격 판단 + 한도·금리·월상환액 계산"""
```

### 1-4. `routers/analyze.py` (통합)

```python
class FullAnalyzeRequest(BaseModel):
    raw_address: str
    housing_type: str
    exclusive_area_m2: float
    listed_jeonse_price: int
    registry_text: str
    user_profile: UserProfile

@router.post("/analyze/full")
async def full_analyze(req: FullAnalyzeRequest) -> ApiResponse[AnalysisResult]:
    """
    F001 + F002 + F003 통합 분석 (순차 실행)
    1. 주소 정규화
    2. 시세 분석 (market_service)
    3. 등기부 파싱 + 스코어링 (fraud_service)
    4. 정책 대출 자격 판단 (loan_service)
    5. AnalysisResult 조합 후 반환
    """
```

### 1-5. `main.py` 업데이트
```python
# 새 라우터 등록
app.include_router(loan.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
```

### 1-6. Alex 완료 기준
```python
# 검증 예시 1 (domain-research-policy-loan.md 예시 3)
# 연소득 3500만원, 만 29세, 전세 1.8억원 (서울)
# → 청년전용 버팀목 한도: MIN(1.8억×80%, 2억) = 1.44억 ✅

# 검증 예시 2
# 연소득 1억원, 맞벌이, 출산 1년, 주택 7억 (일반지역)
# → 신생아특례 디딤돌 한도: MIN(7억×70%, 5억) = 4.9억 ✅
```

---

## 2. Chris — 대출 + 통합 테스트

### 2-1. 우선 구현 테스트 — `test_calc_loan.py`

```python
# 테스트 1: 월 상환액 계산
def test_calc_monthly_payment():
    # 1억, 연 2%, 20년
    result = calc_monthly_payment(10000, 2.0, 20)
    assert 48 <= result <= 52   # 약 50만원/월 (만원 단위)

def test_calc_monthly_payment_zero_rate():
    # 0% 금리 엣지케이스
    result = calc_monthly_payment(12000, 0.0, 10)
    assert result == 100  # 1200만원 / 120개월

# 테스트 2: 대출 한도 계산
def test_calc_loan_limit_jeonse():
    # 청년전용 버팀목: 보증금 1.8억, LTV 80%, 최대 2억
    product = PRODUCTS["청년전용_버팀목"]
    limit = calc_loan_limit(product, 18000, is_metropolitan=True)
    assert limit == 14400  # MIN(18000×0.8=14400, 20000)

# 테스트 3: 자격 필터 — 연령 조건
def test_check_eligibility_age():
    user = UserProfile(age=35, ...)  # 청년전용 상한 34세 초과
    assert check_eligibility("청년전용_버팀목", PRODUCTS["청년전용_버팀목"], user, mock_property) == False

# 테스트 4: 자격 필터 — 소득 조건
def test_check_eligibility_income():
    user = UserProfile(annual_income=60_000_000, ...)  # 버팀목 일반 상한 5천만 초과
    assert check_eligibility("버팀목_일반", PRODUCTS["버팀목_일반"], user, mock_property) == False

# 테스트 5: 통합 자격 판단
@pytest.mark.asyncio
async def test_get_eligible_loans_youth():
    # 연소득 3500만, 만 29세, 전세 1.8억 서울
    user = UserProfile(annual_income=35_000_000, age=29, loan_purpose="jeonse", ...)
    property_info = PropertyInfo(listed_jeonse_price=18000, ...)
    result = await get_eligible_loans(user, property_info)
    product_names = [l.product_name for l in result["eligible"]]
    assert "청년전용 버팀목전세대출" in product_names
```

### 2-2. Chris 완료 기준
```bash
pytest tests/test_calc_loan.py -v  # → 5 passed ✅
pytest --cov=services --cov-report=term  # → services 커버리지 70%↑ 목표
```

---

## 3. Sam — 통합 대시보드 UI

### 3-1. 신규 컴포넌트

```
frontend/src/components/
├── LoanResultCard.tsx       ← 정책 대출 상품 카드
├── LoanResultList.tsx       ← 대출 상품 카드 리스트
├── IneligibleLoanList.tsx   ← 자격 미충족 상품 목록
├── UserProfileForm.tsx      ← 사용자 프로필 입력 폼
└── AnalysisDashboard.tsx    ← 3탭 통합 대시보드
```

### 3-2. `LoanResultCard.tsx`
```typescript
interface Props {
  loan: LoanResult
}
// 상품명 / 최대 한도 / 금리 범위 / 우대금리 적용 금리 / 월 상환액 추정 / LTV
// 주의사항 목록 (notes)
// 금리는 "예상 범위" 표시 + "실제 금리는 금융기관 심사에 따라 상이" 고지
```

### 3-3. `UserProfileForm.tsx`
```typescript
interface Props {
  onSubmit: (profile: UserProfileInput) => void
}
// 필수: 대출목적(구입/전세), 연소득, 나이, 주택보유이력, 순자산
// 선택: 혼인여부, 혼인기간, 자녀수, 신생아여부
// 순자산 입력 툴팁: "총자산 - 총부채 (부동산+금융자산+기타 - 대출)"
// 연소득 입력 안내: "세전 연봉 또는 종합소득세 신고 기준"
```

### 3-4. `AnalysisDashboard.tsx` (핵심)
```typescript
// 3탭 통합 대시보드
// 헤더: 종합 위험도 점수 게이지 (fraud_score 기반)
// 탭 1: 시세 분석 (JeonseRatioGauge + MarketPriceCard)
// 탭 2: 사기 위험도 (FraudScoreGauge + FraudFlagList + ChecklistPanel)
// 탭 3: 정책 대출 (LoanResultList + IneligibleLoanList)
// 하단: DisclaimerBanner 고정
```

### 3-5. Sam 완료 기준
```bash
# 전체 플로우 동작:
# 주소 입력 → 시세 분석 → 등기부 붙여넣기 → 위험도 분석
# → (선택) 소득 입력 → 정책 대출 목록
# → 3탭 대시보드 정상 표시 ✅
npm run lint && npx tsc --noEmit  # → 0 errors ✅
```

---

## 4. Jordan — Sprint 4 커밋 계획 (5개)

| # | 커밋 메시지 |
|---|------------|
| 23 | `feat: 정책 대출 자격 판단 엔진 구현 (7개 상품, 한도·금리 계산)` |
| 24 | `feat: POST /api/loan/eligible, /api/analyze/full 라우터 구현` |
| 25 | `test: 대출 자격 필터 및 월 상환액 계산 단위 테스트 5개 추가` |
| 26 | `feat: 정책 대출 카드 UI 및 사용자 프로필 입력 폼 구현` |
| 27 | `feat: 3탭 통합 분석 대시보드 구현 (시세·사기·대출 통합)` |

---

## 5. Sprint 4 완료 기준 체크리스트

- [x] 연소득 3500만·만 29세·전세 1.8억 입력 → 청년전용 버팀목 1.44억 한도 출력
- [x] 자격 미충족 상품에 불가 사유 표시
- [x] `POST /api/analyze/full` — 3기능 통합 결과 반환
- [x] `pytest tests/test_calc_loan.py` → 5 passed
- [x] services 커버리지 70%↑
- [x] 3탭 대시보드 모든 탭 정상 동작
- [x] 면책 고지 모든 결과 화면 하단 표시 확인
- [x] Sprint 누적 커밋 30개 이상

## 6. 발생 이슈 및 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| `loan_products.py` PRODUCTS 중복 | loan_service.py와 loan_products.py에 동일 테이블 존재 | loan_service.py에서 loan_products.py를 import하도록 리팩토링 (관심사 분리) |
| `check_eligibility` 소득 단위 불일치 | UserProfile.annual_income이 만원 단위인데 상품 테이블은 원 단위 | `user.annual_income * 10000`으로 단위 변환 후 비교하도록 수정 |
| `AnalysisDashboard` UserProfile 폼 연동 | 탭3(정책대출) 입력이 POST /api/loan/eligible에 연결되지 않음 | UserProfileForm → useAnalysisStore → API 호출 흐름 구성 |
