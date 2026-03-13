# 부동산 종합 서비스 — 도메인 종합 및 통합 설계

## Context

전세 사기 리스크, 시세 분석, 정책 대출 3개 도메인 리서치 결과를 종합하여
공통 데이터 모델, 통합 아키텍처, API 의존성 지도, 기능별 데이터 흐름을 설계한다.

---

## 1. 3개 도메인 핵심 요약 비교

| 항목 | 전세 사기 리스크 | 시세 분석 | 정책 대출 |
|------|---------------|---------|---------|
| **핵심 입력** | 주소, 전세보증금, 선순위 채권 | 주소, 주택 유형, 전용면적 | 연소득, 순자산, 연령, 보증금/매매가 |
| **핵심 출력** | 위험도 점수(0~100), 체크리스트 | 매매가, 전세가, 전세가율, 트렌드 | 이용 가능 상품 목록, 예상 한도·금리 |
| **주요 API** | 실거래가(RTMS), 건축물대장 | 실거래가(RTMS), 공시가격, R-ONE | ECOS, FSS 금융상품, HF Open API |
| **사람이 직접 해야 하는 것** | 등기부등본 열람·붙여넣기, 납세증명서 | 없음 (자동화 가능) | 금융기관 방문 심사 |
| **계산 핵심** | 전세가율, 근저당비율, 위험 스코어링 | 실거래 median, 공시가 역산 | LTV·DTI MIN 계산, 우대금리 적용 |

---

## 2. 공통 데이터 모델

### 2-1. Address (주소)

서비스 전반에서 공유되는 핵심 식별자.

```python
@dataclass
class Address:
    # 사용자 입력 원문
    raw_input: str                  # "서울시 강남구 역삼동 123-4"

    # 도로명주소 API 정규화 결과
    road_addr: str                  # "서울특별시 강남구 테헤란로 123"
    jibun_addr: str                 # "서울특별시 강남구 역삼동 123-4"

    # 코드 (API 호출 키)
    lawd_cd_5: str                  # "11680"  — RTMS API용 (시군구 5자리)
    lawd_cd_10: str                 # "1168010100" — 공시가격 API용 (10자리)
    sido: str                       # "서울특별시"
    sigungu: str                    # "강남구"
    dong: str                       # "역삼동"

    # 지역 분류 (LTV, 보증금 상한 결정)
    is_metropolitan: bool           # 수도권 여부
    regulation_zone: str            # "투기지역" | "투기과열" | "조정" | "일반"
```

### 2-2. PropertyInfo (매물 정보)

```python
@dataclass
class PropertyInfo:
    address: Address

    # 주택 기본 정보
    housing_type: str               # "apt" | "rh" | "sh" | "offi"
    exclusive_area_m2: float        # 전용면적 (m²)
    floor: int | None               # 층수
    built_year: int | None          # 건축연도

    # 가격 정보 (만원 단위)
    listed_trade_price: int | None  # 사용자 입력 매매가 (없으면 None)
    listed_jeonse_price: int | None # 사용자 입력 전세보증금

    # 시세 분석 결과 (API 조회 후 채워짐)
    market_trade_price: int | None  # 추정 매매 시세
    market_jeonse_price: int | None # 추정 전세 시세
    market_data_confidence: str     # "high" | "medium" | "low" | "estimated" | "none"

    # 등기부등본 분석 결과 (사용자 텍스트 입력 후 채워짐)
    senior_mortgage_amount: int     # 선순위 근저당 채권최고액 합계 (만원)
    has_attachment: bool            # 가압류 존재 여부
    has_provisional_attachment: bool  # 가처분 존재 여부
    has_auction: bool               # 경매개시결정 여부
    has_trust: bool                 # 신탁등기 여부
    has_lease_registration: bool    # 임차권등기 여부
```

### 2-3. UserProfile (사용자 프로필)

정책 대출 자격 판단에 사용.

```python
@dataclass
class UserProfile:
    # 소득·자산
    annual_income: int              # 연소득 (만원, 세전)
    is_dual_income: bool            # 맞벌이 여부
    net_asset: int                  # 순자산 (만원, 총자산-총부채)

    # 인구통계
    age: int                        # 만 나이
    is_married: bool                # 혼인 여부
    marriage_years: int             # 혼인 기간 (년)
    num_children: int               # 자녀 수
    has_newborn_2yr: bool           # 2년 이내 출산/입양 여부

    # 주택 이력
    housing_ownership: str          # "none" | "first_time" | "one_house"

    # 특수 조건
    is_disabled: bool               # 장애인 가구
    is_single_parent: bool          # 한부모 가구
    is_multicultural: bool          # 다문화 가구

    # 청약통장 (디딤돌 우대금리용)
    subscription_years: int         # 청약통장 가입 기간 (년)
    subscription_count: int         # 납입 회차

    # 대출 목적
    loan_purpose: str               # "buy" | "jeonse"
```

### 2-4. AnalysisResult (종합 분석 결과)

3개 도메인 분석을 하나로 묶는 최종 출력 모델.

```python
@dataclass
class AnalysisResult:
    property: PropertyInfo
    user: UserProfile

    # 기능 1: 시세 분석
    jeonse_ratio: float | None      # 전세가율 (%)
    jeonse_grade: str               # "안전" | "양호" | "주의" | "위험" | "매우 위험"
    price_trend: str                # "상승" | "보합" | "하락" | "데이터 부족"
    price_trend_pct: float | None   # 3개월 변동률 (%)

    # 기능 2: 전세 사기 리스크
    fraud_score: int                # 0~100
    fraud_grade: str                # "안전" | "주의" | "위험" | "매우 위험"
    fraud_flags: list[str]          # ["가압류 존재", "전세가율 85%", ...]

    # 기능 3: 정책 대출
    eligible_loans: list[LoanResult]  # 이용 가능 대출 목록 (금리 낮은 순)

@dataclass
class LoanResult:
    product_name: str               # "청년전용 버팀목전세대출"
    max_limit: int                  # 예상 최대 한도 (만원)
    rate_min: float                 # 예상 금리 하한 (%)
    rate_max: float                 # 예상 금리 상한 (%)
    rate_with_benefit: float        # 우대금리 적용 예상 금리 (%)
    ltv: float                      # 적용 LTV
    notes: list[str]                # 주의사항 ["특례금리 5년 후 전환", ...]
```

---

## 3. 통합 아키텍처

### 3-1. 전체 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 앱 (Flutter)                    │
│                                                             │
│  [Step 1] 주소 입력         [Step 2] 매물 정보 입력           │
│    └─ 자동완성(도로명주소 API)  └─ 유형·면적·가격               │
│                                                             │
│  [Step 3] 등기부등본 텍스트   [Step 4] 사용자 프로필 입력       │
│    └─ 붙여넣기 → AI 해석      └─ 소득·자산·연령 등             │
│                                                             │
│  [결과 화면]                                                 │
│    ├─ 탭 1: 시세 분석 (전세가율, 트렌드)                       │
│    ├─ 탭 2: 전세 사기 리스크 (스코어, 체크리스트)               │
│    └─ 탭 3: 정책 대출 (이용 가능 상품, 한도·금리)              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      백엔드 서버 (FastAPI)                     │
│                                                             │
│  /api/address/normalize    주소 정규화 + 법정동 코드 변환       │
│  /api/market/analyze       시세 조회 + 전세가율 계산           │
│  /api/fraud/score          전세 사기 위험도 스코어링           │
│  /api/loan/eligible        정책 대출 자격 판단 + 한도 계산     │
│  /api/analyze/full         3개 기능 통합 분석 (배치)          │
│                                                             │
│  [AI 연동]                                                   │
│  /api/registry/parse       등기부등본 텍스트 → 구조화 데이터   │
│    └─ Claude API 호출                                        │
└─────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  공공 API 층  │  │  AI API 층   │  │  캐시 레이어  │
│              │  │              │  │              │
│ • RTMS 실거래 │  │ • Claude API │  │ • Redis      │
│ • 공시가격    │  │   (등기부    │  │   (시세 1시간 │
│ • 건축물대장  │  │    해석용)   │  │    캐싱)     │
│ • 도로명주소  │  │              │  │              │
│ • R-ONE      │  │              │  │              │
│ • ECOS       │  │              │  │              │
│ • FSS 금융상품│  │              │  │              │
│ • HF Open API│  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 3-2. API 의존성 지도

| 기능 | 필수 API | 선택 API | API 없이 처리 |
|------|---------|---------|-------------|
| **주소 정규화** | 도로명주소 API (juso.go.kr) | - | - |
| **시세 조회** | RTMS 실거래가 API | 공시가격 API (fallback), R-ONE | - |
| **전세가율** | RTMS 매매·전세 API | - | 사용자 직접 입력 |
| **등기부 분석** | - (Claude API) | - | 사용자 텍스트 입력 |
| **건축물 정보** | 건축물대장 API | - | 사용자 직접 입력 |
| **정책대출 자격** | - (로컬 규칙 엔진) | HF Open API (금리 최신화) | 하드코딩 상품 테이블 |
| **시중금리 비교** | FSS 금융상품 API | ECOS API | - |
| **기준금리** | ECOS API | - | - |

### 3-3. 공통 공공 API 인증키 목록

```
필수 발급 (무료):
  1. 공공데이터포털 (data.go.kr)
     → RTMS 실거래가 (매매·전세, 아파트·연립·단독·오피스텔)
     → 공동주택 공시가격
     → 건축물대장
     → 법정동 코드

  2. 도로명주소 API (juso.go.kr)
     → 별도 인증키 발급 (공공데이터포털과 다름)

선택 발급 (무료):
  3. R-ONE (reb.or.kr)
     → 지역별 전세가율 통계, 가격 지수

  4. ECOS (ecos.bok.or.kr)
     → 기준금리, 주담대 평균금리, COFIX

  5. FSS 금융상품 (finlife.fss.or.kr)
     → 시중은행 주담대·전세대출 금리 비교

  6. HF Open API (hf.go.kr)
     → 보금자리론·디딤돌 실시간 금리

  7. Claude API (anthropic.com)
     → 등기부등본 텍스트 해석 (유료)
```

---

## 4. 기능별 데이터 흐름 상세

### 4-1. 기능 1: 시세 분석 흐름

```
입력: Address + PropertyInfo(housing_type, area_m2)
  │
  ├─ [Step 1] RTMS 매매 API 호출 (최근 6~12개월, 법정동 기준)
  ├─ [Step 2] RTMS 전세 API 호출 (최근 6~12개월)
  │
  ├─ [Step 3] 유사 면적 필터 (±10%) + 해제 건 제거
  │
  ├─ [Step 4] 대표값 산출
  │    ├─ 거래 10건↑: median
  │    ├─ 거래 1~9건: 가중평균 + "데이터 적음" 경고
  │    └─ 거래 없음: 공시가격 ÷ 현실화율(0.69) + "추정치" 표시
  │
  ├─ [Step 5] 전세가율 = 전세가 / 매매가 × 100
  │
  ├─ [Step 6] 등급 판정
  │    ├─ ~60%: 안전 (초록)
  │    ├─ 60~70%: 양호 (연두)
  │    ├─ 70~80%: 주의 (노랑)
  │    ├─ 80~90%: 위험 (주황)
  │    └─ 90%↑: 매우 위험 (빨강)
  │
  └─ [Step 7] 3개월 트렌드 계산 (R-ONE 또는 RTMS 시계열)

출력: jeonse_ratio, jeonse_grade, market_prices, price_trend
```

### 4-2. 기능 2: 전세 사기 리스크 흐름

```
입력: PropertyInfo + 등기부등본 텍스트 (사용자 입력)
  │
  ├─ [Step 1] 등기부등본 텍스트 → Claude API 해석
  │    → senior_mortgage_amount, has_attachment, has_trust, ...
  │
  ├─ [Step 2] 시세 데이터 활용 (기능 1 결과 재사용)
  │    → 전세가율, 실효 전세가율 계산
  │
  ├─ [Step 3] 스코어링
  │
  │    [전세가율 점수 0~30]
  │    ~60%: 0점 / 60~70%: 10점 / 70~80%: 20점 / 80%↑: 30점
  │
  │    [근저당비율 점수 0~30]
  │    실효비율 = (근저당채권최고액 + 전세금) / 매매가
  │    ~70%: 0점 / 70~80%: 15점 / 80%↑: 30점
  │
  │    [등기 위험키워드 점수 0~20]
  │    가압류: +10 / 가처분·경매: +20 / 신탁: +10
  │    임차권등기: +15 / 가등기: +8
  │
  │    [임대인 신뢰도 점수 0~20]
  │    최근 6개월 취득: +5 / 법인 소유: +5
  │    체납 이력: +10 (납세증명서 사용자 확인 필요)
  │
  ├─ [Step 4] 총점 → 등급
  │    0~30: 안전 / 31~50: 주의 / 51~70: 위험 / 71↑: 매우 위험
  │
  └─ [Step 5] 체크리스트 자동 생성 (미완료 항목 하이라이트)

출력: fraud_score, fraud_grade, fraud_flags, checklist_items
```

### 4-3. 기능 3: 정책 대출 자격 판단 흐름

```
입력: UserProfile + PropertyInfo(price, area, location)
  │
  ├─ [Step 1] 용도 분류 (구입/전세)
  │
  ├─ [Step 2] 상품별 기본 자격 필터
  │    각 상품: 소득상한, 자산상한, 연령, 혼인, 주택가격, 면적 체크
  │
  ├─ [Step 3] 통과 상품 한도 계산
  │    한도 = MIN(주택가격 × LTV, 상품최대한도)
  │    (구입: DTI도 함께 체크)
  │
  ├─ [Step 4] 금리 계산
  │    기본금리 (소득구간 테이블 조회)
  │    - 우대금리 합산 (자녀·신혼·장애인·청약통장 등)
  │    = 예상 적용금리 범위
  │
  ├─ [Step 5] 결과 정렬 (금리 낮은 순)
  │
  └─ [Step 6] 월 상환액 계산 (원리금균등 기준)
       월상환액 = 대출금 × [r(1+r)^n / ((1+r)^n - 1)]
       r = 월금리, n = 총 상환 개월수

출력: eligible_loans (LoanResult 리스트), monthly_payment_estimate
```

---

## 5. 공유 유틸리티 함수

3개 기능에서 공통으로 사용하는 함수.

```python
# ─── 주소 처리 ───────────────────────────────────────────
def normalize_address(raw: str, juso_key: str) -> Address:
    """도로명주소 API → Address 객체 생성"""

def get_regulation_zone(sido: str, sigungu: str, dong: str) -> str:
    """지역명 → 규제지역 구분 (정적 DB, 주기적 업데이트 필요)"""

# ─── 가격 파싱 ───────────────────────────────────────────
def parse_rtms_price(price_str: str) -> int:
    """'  85,000' → 85000 (만원)"""
    return int(price_str.strip().replace(',', '').replace(' ', ''))

# ─── 면적 단위 ───────────────────────────────────────────
def sqm_to_pyeong(sqm: float) -> float:
    return sqm / 3.3058

# ─── 금융 계산 ───────────────────────────────────────────
def calc_monthly_payment(principal: int, annual_rate: float, years: int) -> int:
    """원리금균등상환 월 납입액 계산 (만원 단위)"""
    r = annual_rate / 100 / 12
    n = years * 12
    if r == 0:
        return principal // n
    payment = principal * r * (1 + r)**n / ((1 + r)**n - 1)
    return round(payment)

def calc_jeonse_ratio(trade_price: int, jeonse_price: int) -> float:
    return round(jeonse_price / trade_price * 100, 1)

def calc_effective_jeonse_ratio(
    trade_price: int, jeonse_price: int, senior_mortgage: int
) -> float:
    """실효 전세가율: 선순위 근저당 포함"""
    estimated_loan = senior_mortgage / 1.2  # 채권최고액 → 실대출 역산
    return round((jeonse_price + estimated_loan) / trade_price * 100, 1)

# ─── 캐싱 키 ─────────────────────────────────────────────
def market_cache_key(lawd_cd: str, housing_type: str, ym: str) -> str:
    return f"market:{lawd_cd}:{housing_type}:{ym}"
```

---

## 6. 주택 유형 분류 통합 기준

3개 도메인에서 공통으로 사용하는 주택 유형 코드.

| 코드 | 명칭 | RTMS API | 공시가격 API | 특이사항 |
|------|------|---------|-----------|---------|
| `apt` | 아파트 | AptTrade / AptRent | 공동주택 공시가격 | 데이터 가장 풍부 |
| `rh` | 연립/다세대 (빌라) | RHTrade / RHRent | 공동주택 공시가격 | 전세 사기 고위험 → 별도 경고 |
| `sh` | 단독/다가구 | SHTrade / SHRent | 개별공시지가 (토지) | 다가구는 선순위 임차인 합산 필요 |
| `offi` | 오피스텔 | OffiTrade / OffiRent | 없음 | 주거용 여부 확인 안내 필수 |

---

## 7. 지역 분류 통합 기준

3개 도메인 모두 지역 분류에 따라 한도·금리·위험도가 달라진다.

```python
# 수도권 여부 (버팀목 보증금 상한, 신생아특례 보증금 상한 결정)
METROPOLITAN_SIDO = ["서울특별시", "경기도", "인천광역시"]

# 규제지역 (LTV 결정, 주기적 업데이트 필요)
REGULATION_ZONES = {
    "투기지역": [
        ("서울특별시", "강남구"),
        ("서울특별시", "서초구"),
        ("서울특별시", "송파구"),
        ("서울특별시", "용산구"),
    ],
    "투기과열": [
        # 서울 전역 (강남·서초·송파·용산 제외)
        # 경기 12개 시 (2025년 10월 이후)
        # → 별도 DB 파일로 관리 권장
    ],
    "조정": [],  # 2025년 현재 해당 없음 (금융위 공시 확인)
}

def classify_region(sido: str, sigungu: str) -> dict:
    """
    반환:
    {
        "is_metropolitan": True,
        "regulation_zone": "투기지역" | "투기과열" | "조정" | "일반",
        "jeonse_deposit_limit": 500_000_000,  # 버팀목 보증금 상한 (만원)
    }
    """
```

---

## 8. MVP 기능 범위 및 우선순위

### 8-1. Phase 1 — 해커톤 MVP (핵심 2개 기능)

| 우선순위 | 기능 | 구현 범위 | 필요 API |
|---------|------|---------|---------|
| **P0** | 전세 사기 리스크 분석 | 등기부등본 텍스트 입력 → Claude 해석 → 스코어링 | Claude API |
| **P0** | 시세 기반 전세가율 | 주소 입력 → RTMS 조회 → 전세가율·등급 | RTMS, 도로명주소 |
| **P1** | 정책 대출 자격 판단 | 사용자 프로필 입력 → 상품 필터 → 한도·금리 | 로컬 규칙 엔진 (API 불필요) |
| **P2** | 시세 트렌드 | 6개월 시계열 차트 | RTMS |
| **P3** | 청약 리스트업 | - | 별도 조사 필요 |

### 8-2. 최소 사용자 입력 시나리오 (해커톤 데모용)

```
[단계 1 - 30초]
  → 주소 입력 (자동완성)
  → 전세보증금 입력
  → 주택 유형 선택 (아파트/빌라/오피스텔)

[자동 처리 - 5초]
  → RTMS API 호출 → 시세 조회 → 전세가율 계산

[단계 2 - 60초]
  → 등기부등본 텍스트 붙여넣기 (인터넷등기소에서 복사)
  → Claude가 자동 해석

[결과 - 즉시]
  → 종합 위험도 점수 (0~100)
  → 전세가율 등급
  → 위험 플래그 목록
  → 미완료 체크리스트

[선택 - 30초]
  → 소득·나이 입력
  → 이용 가능한 정책 대출 목록
```

### 8-3. 기술 스택 권장

| 계층 | 기술 | 이유 |
|------|------|------|
| 앱 | Flutter | 크로스플랫폼, 해커톤 속도 |
| 백엔드 | FastAPI (Python) | 공공 API 파싱, Claude API 연동에 Python 최적 |
| AI | Claude API (claude-sonnet-4-6) | 등기부등본 한국어 해석 |
| 캐시 | 메모리 캐시 (해커톤 수준) | Redis는 프로덕션 전환 시 |
| 배포 | Cloudflare Workers / Vercel | 빠른 배포 |

---

## 9. 데이터 제약 및 한계 정리

| 항목 | 제약 | 앱 대응 |
|------|------|--------|
| 등기부등본 | API 없음, 건당 700원 유료 | 사용자 텍스트 붙여넣기 → Claude 해석 |
| KB시세 | 공개 API 없음 | RTMS 실거래가로 대체 |
| 빌라 시세 | 거래 희소 → 정확도 낮음 | "시세 불투명 — 고위험 신호" 경고 표시 |
| 납세증명서 | 직접 발급 필요 | 체크리스트 항목으로 안내 + 링크 |
| 규제지역 | API 없음, 수시 변경 | 정적 DB + 앱 업데이트 또는 서버 관리 |
| 정책대출 금리 | 국토부 고시 수시 변경 | HF Open API 연동 또는 "최신 금리 확인" 링크 |
| 선순위 임차인 | API 없음 (주민센터 발급) | 체크리스트 안내, 다가구 특별 경고 |

---

## 10. 법적 고려사항 (통합)

- **면책 고지** (모든 결과 화면 하단 필수): "본 결과는 참고용이며 법적·금융 자문이 아닙니다. 실제 계약 전 전문가 상담 및 공문서 직접 확인을 권장합니다."
- **공인중개사법**: 중개 행위로 오인되지 않도록 "정보 제공 서비스"임을 명시
- **개인정보**: 소득·자산 등 민감 정보는 서버 미저장 원칙 (로컬 처리 권장)
- **공공데이터**: 공공데이터법 이용조건 준수, 출처 명시
- **Claude API**: 등기부등본 개인정보 전송 시 API 이용약관 확인 필요

---

> **다음 단계**: 로드맵 설계 — 개발 단계별 마일스톤, 역할 분담, 데모 시나리오 확정
