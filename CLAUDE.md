# CLAUDE.md — HomeLens 프로젝트 원칙

> AI 에이전트 및 개발자가 이 파일을 읽고 코드를 작성할 때 반드시 따라야 할 설계 원칙 문서입니다.

---

## 1. 프로젝트 개요

**서비스명**: HomeLens
**목적**: 전세 계약 전 리스크를 자동으로 분석하여 비전문가도 안전한 판단을 내릴 수 있도록 돕는 AI 기반 부동산 안전 진단 서비스

### 핵심 기능 3가지
1. **전세 사기 리스크 분석** — 등기부등본 텍스트를 붙여넣으면 Claude AI가 해석하여 위험도 점수(0~100)와 위험 플래그를 출력
2. **시세 기반 전세가율 진단** — 주소 입력 시 공공 실거래가 API로 전세가율을 계산하고 5단계 등급(안전/양호/주의/위험/매우위험)으로 표시
3. **정책 대출 자격 판단** — 연소득·자산·나이 등 입력 시 이용 가능한 정책 대출 상품과 예상 한도·금리를 즉시 제시

### 대상 사용자
전세 계약을 앞두고 있는 사회초년생, 청년, 비전문 임차인

### 면책 고지 (모든 결과 화면 하단 필수 표시)
> 본 결과는 참고용이며 법적·금융 자문이 아닙니다. 실제 계약 전 전문가 상담 및 공문서 직접 확인을 권장합니다.

---

## 2. 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 15 + TypeScript (strict mode)
- **스타일**: TailwindCSS v4 + shadcn/ui
- **상태관리**: Zustand (전역 상태 최소화)
- **HTTP 클라이언트**: fetch API (내장)
- **테스트**: Vitest + Testing Library
- **린트**: ESLint + Prettier

### 백엔드
- **프레임워크**: FastAPI (Python 3.11+)
- **데이터 검증**: Pydantic v2
- **HTTP 클라이언트**: httpx (비동기)
- **AI 연동**: anthropic SDK (claude-sonnet-4-6)
- **테스트**: pytest + pytest-asyncio
- **린트**: ruff

### 인프라 & 기타
- **DB**: Supabase (선택 사용 — 개인정보 서버 미저장 원칙에 따라 필요 최소한만)
- **배포**: Vercel (프론트) + Railway (백엔드)
- **캐시**: 인메모리 딕셔너리 (해커톤 MVP) → 프로덕션 시 Redis 전환

---

## 3. 아키텍처 원칙

### 3계층 구조 (백엔드)

```
routers/        ← HTTP 요청·응답 처리, 입력 유효성 검사
  └── services/ ← 비즈니스 로직, 도메인 규칙
        └── clients/ ← 외부 API 호출 추상화
```

### 프론트엔드 구조

```
app/            ← Next.js 페이지 (라우팅)
components/     ← 재사용 UI 컴포넌트
lib/            ← 백엔드 API 호출 함수
types/          ← TypeScript 타입 정의
```

### 5대 설계 원칙

1. **관심사 분리**: router는 HTTP만, service는 비즈니스만, client는 외부 API만 담당
2. **모델 중심 설계**: 모든 데이터는 Pydantic 모델로 정의 후 코드 작성 시작
3. **외부 API 추상화**: 공공 API 호출 로직은 반드시 `clients/` 안에만 존재
4. **Graceful Degradation**: 외부 API 실패 시 사용자에게 오류가 아닌 "데이터 없음" 상태 표시
5. **인메모리 캐시**: 동일 주소·월의 RTMS 조회 결과는 캐시하여 API 과다 호출 방지

---

## 4. 코드 규칙

### 언어 정책
- **코드 식별자**: 영어 (변수명, 함수명, 클래스명)
- **주석**: 한국어 (비즈니스 로직 설명)
- **커밋 메시지**: 한국어 설명 포함
- **UI 텍스트**: 한국어

### 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| Python 변수·함수 | snake_case | `jeonse_ratio`, `calc_fraud_score` |
| TypeScript 변수·함수 | camelCase | `jeonsePratio`, `calcFraudScore` |
| React 컴포넌트 | PascalCase | `FraudScoreCard`, `LoanResultList` |
| API 엔드포인트 | kebab-case | `/api/fraud-score`, `/api/loan-eligible` |
| Pydantic 모델 | PascalCase | `PropertyInfo`, `AnalysisResult` |

### 프론트-백엔드 직렬화 규칙

백엔드(Python)는 snake_case, 프론트(TypeScript)는 camelCase를 사용하므로 **경계에서 반드시 변환**해야 한다.

| 방향 | 변환 책임 | 위치 |
|------|-----------|------|
| 프론트 → 백엔드 (요청) | 프론트가 camelCase → snake_case 변환 | `frontend/src/lib/api.ts` 각 API 함수 내부 |
| 백엔드 → 프론트 (응답) | 백엔드가 `camelize()` 적용하거나, 프론트가 변환 | 백엔드에서 `camelize()` 미적용 시 `api.ts`에서 변환 |

**규칙**
- `lib/api.ts`의 각 함수는 백엔드로 보내기 전에 JSON body를 snake_case로 직접 매핑한다.
- 백엔드 응답에 `camelize()`가 적용된 엔드포인트는 프론트 변환 불필요 (현재: `/api/fraud/score`, `/api/registry/parse`).
- `camelize()` 미적용 엔드포인트는 `api.ts`에서 응답을 camelCase로 변환 후 반환한다 (현재: `/api/loan/eligible`).
- `types/index.ts`의 TypeScript 인터페이스는 항상 camelCase로 정의한다. snake_case 필드를 직접 노출하지 않는다.

```typescript
// ✅ 올바른 예 — api.ts에서 변환
const body = {
  annual_income: profile.annualIncome,  // camelCase → snake_case
  housing_type: profile.housingType,
};

// ❌ 잘못된 예 — 변환 없이 그대로 전송
body: JSON.stringify(profile)  // annualIncome이 그대로 전송 → 422 에러
```

### Import 순서 (Python)
```python
# 1. 표준 라이브러리
import os
from typing import Optional

# 2. 서드파티
from fastapi import APIRouter
from pydantic import BaseModel

# 3. 내부 모듈
from services.market_service import analyze_market
```

### 금지 사항
- **API 키 하드코딩 절대 금지** — 반드시 환경 변수로 관리
- **개인정보(소득·자산·주소) 로그 출력 금지**
- **파일당 300줄 초과 금지** — 초과 시 모듈 분리
- **함수당 50줄 초과 금지** — 초과 시 함수 분리
- **`any` 타입 사용 금지** (TypeScript strict 위반)

---

## 5. 데이터 모델

모든 API 입출력은 아래 Pydantic 모델을 기반으로 설계한다.

### Address (주소)
```python
class Address(BaseModel):
    raw_input: str           # 사용자 입력 원문
    road_addr: str           # 도로명주소 (정규화)
    jibun_addr: str          # 지번주소
    lawd_cd_5: str           # 법정동코드 5자리 (RTMS API용)
    lawd_cd_10: str          # 법정동코드 10자리 (공시가격 API용)
    sido: str                # 시도명
    sigungu: str             # 시군구명
    dong: str                # 읍면동명
    is_metropolitan: bool    # 수도권 여부
    regulation_zone: str     # "투기지역" | "투기과열" | "조정" | "일반"
```

### PropertyInfo (매물 정보)
```python
class PropertyInfo(BaseModel):
    address: Address
    housing_type: str               # "apt" | "rh" | "sh" | "offi"
    exclusive_area_m2: float        # 전용면적 (m²)
    floor: Optional[int]
    built_year: Optional[int]
    listed_jeonse_price: Optional[int]    # 사용자 입력 전세보증금 (만원)
    listed_trade_price: Optional[int]     # 사용자 입력 매매가 (만원)
    market_trade_price: Optional[int]     # 추정 매매 시세 (만원)
    market_jeonse_price: Optional[int]    # 추정 전세 시세 (만원)
    market_data_confidence: str     # "high" | "medium" | "low" | "estimated" | "none"
    senior_mortgage_amount: int     # 선순위 근저당 채권최고액 합계 (만원)
    has_attachment: bool            # 가압류
    has_provisional_attachment: bool  # 가처분
    has_auction: bool               # 경매개시결정
    has_trust: bool                 # 신탁등기
    has_lease_registration: bool    # 임차권등기
```

### UserProfile (사용자 프로필)
```python
class UserProfile(BaseModel):
    annual_income: int          # 연소득 세전 (만원)
    is_dual_income: bool        # 맞벌이 여부
    net_asset: int              # 순자산 = 총자산 - 총부채 (만원)
    age: int                    # 만 나이
    is_married: bool
    marriage_years: int         # 혼인 기간 (년)
    num_children: int
    has_newborn_2yr: bool       # 2년 이내 출산/입양
    housing_ownership: str      # "none" | "first_time" | "one_house"
    is_disabled: bool
    is_single_parent: bool
    is_multicultural: bool
    subscription_years: int     # 청약통장 가입 기간 (년)
    subscription_count: int     # 납입 회차
    loan_purpose: str           # "buy" | "jeonse"
```

### AnalysisResult (종합 분석 결과)
```python
class LoanResult(BaseModel):
    product_name: str       # 상품명
    max_limit: int          # 예상 최대 한도 (만원)
    rate_min: float         # 금리 하한 (%)
    rate_max: float         # 금리 상한 (%)
    rate_with_benefit: float  # 우대금리 적용 예상 금리 (%)
    ltv: float
    notes: list[str]        # 주의사항

class AnalysisResult(BaseModel):
    property: PropertyInfo
    user: UserProfile
    # 기능 1: 시세 분석
    jeonse_ratio: Optional[float]   # 전세가율 (%)
    jeonse_grade: str               # "안전" | "양호" | "주의" | "위험" | "매우 위험"
    price_trend: str                # "상승" | "보합" | "하락" | "데이터 부족"
    price_trend_pct: Optional[float]
    # 기능 2: 전세 사기 리스크
    fraud_score: int                # 0~100
    fraud_grade: str                # "안전" | "주의" | "위험" | "매우 위험"
    fraud_flags: list[str]
    # 기능 3: 정책 대출
    eligible_loans: list[LoanResult]

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T]
    error: Optional[str]
    warnings: list[str] = []
```

---

## 6. API 엔드포인트 목록

| 메서드 | 경로 | 기능 | 입력 | 출력 |
|--------|------|------|------|------|
| `POST` | `/api/address/normalize` | 주소 정규화 + 법정동코드 변환 | `raw_address: str` | `Address` |
| `POST` | `/api/market/analyze` | 시세 조회 + 전세가율 계산 | `Address` + 매물 기본정보 | 시세·전세가율·등급 |
| `POST` | `/api/registry/parse` | 등기부등본 텍스트 → Claude 해석 | `registry_text: str` | 구조화 등기 데이터 |
| `POST` | `/api/fraud/score` | 전세 사기 위험도 스코어링 | `PropertyInfo` | `fraud_score`, `fraud_flags` |
| `POST` | `/api/loan/eligible` | 정책 대출 자격 판단 + 한도 계산 | `UserProfile` + `PropertyInfo` | `list[LoanResult]` |
| `POST` | `/api/analyze/full` | 3기능 통합 분석 (배치) | `PropertyInfo` + `UserProfile` | `AnalysisResult` |
| `GET`  | `/api/health` | 서버 헬스체크 | - | `{"status": "ok"}` |

---

## 7. 환경 변수

`.env.example` 파일을 제공하고, 실제 `.env`는 `.gitignore`에 포함한다.

### 필수 (없으면 서버 시작 불가)
```
ANTHROPIC_API_KEY=       # Claude API 키 (등기부등본 해석)
DATA_GO_KR_API_KEY=      # 공공데이터포털 인증키 (RTMS 실거래가)
JUSO_API_KEY=            # 도로명주소 API 인증키 (juso.go.kr)
```

### 선택 (없으면 해당 기능 fallback 처리)
```
RONE_API_KEY=            # R-ONE 부동산원 API (시세 트렌드)
ECOS_API_KEY=            # 한국은행 ECOS API (기준금리)
FSS_API_KEY=             # 금융감독원 금융상품 API (시중금리 비교)
```

### 서비스 설정
```
SUPABASE_URL=            # Supabase 프로젝트 URL (선택)
SUPABASE_KEY=            # Supabase anon key (선택)
BACKEND_URL=             # 프론트에서 백엔드 호출 URL
CORS_ORIGINS=            # 허용 출처 (쉼표 구분)
CACHE_TTL_SECONDS=3600   # 시세 캐시 유효시간 (기본 1시간)
CLAUDE_MODEL=claude-sonnet-4-6  # 사용 Claude 모델
```

---

## 8. 테스트 원칙

### 테스트 전략 (레이어별)
1. **순수 계산 함수** → 단위 테스트, 커버리지 90% 목표
2. **서비스 로직** → mock fixture 사용, 커버리지 70% 목표
3. **API 통합 테스트** → TestClient/supertest 사용, 커버리지 60% 목표

### 테스트에서 외부 API 미호출 원칙
실제 서비스는 외부 API를 정상 호출한다. **테스트 실행 시에만** 외부 API(RTMS, Claude API, 도로명주소 API 등)를 호출하지 않는다.
- 모든 외부 API 응답은 `tests/fixtures/` 디렉토리의 JSON fixture로 대체
- `monkeypatch` (pytest) 또는 `vi.mock` (vitest)로 클라이언트 레이어를 가로챔
- CI 환경에서 API 키 없이도 전체 테스트가 통과해야 함

```python
# tests/fixtures/rtms_apt_trade.json — 실제 API 응답 형식과 동일한 fixture
# tests/conftest.py — 공통 fixture 정의
@pytest.fixture
def mock_rtms_client(monkeypatch):
    with open("tests/fixtures/rtms_apt_trade.json") as f:
        data = json.load(f)
    monkeypatch.setattr(rtms_client, "get_trade_prices", lambda *a, **kw: data)
```

### 우선 구현 테스트 5개
1. `test_calc_jeonse_ratio` — 전세가율 계산 (경계값: 60/70/80/90%)
2. `test_calc_fraud_score` — 가압류·신탁·전세가율 조합별 스코어 검증
3. `test_calc_monthly_payment` — 원리금균등상환 계산 (0% 금리 엣지케이스 포함)
4. `test_loan_eligibility_filter` — 소득·연령·주택가격별 대출 상품 필터 검증
5. `test_parse_rtms_price` — RTMS API 가격 문자열 파싱 (`"  85,000"` → `85000`)

---

## 9. 문서화 원칙

### 커밋 메시지 형식
```
<type>: <한국어 설명>

feat: 전세 사기 스코어링 서비스 구현
fix: RTMS 가격 파싱 오류 수정 (공백 처리)
test: 대출 자격 필터 단위 테스트 추가
docs: API 엔드포인트 명세 업데이트
refactor: 주소 정규화 함수 clients 레이어로 이동
chore: requirements.txt 의존성 업데이트
deploy: Railway 배포 환경변수 설정
```

**커밋 목표**: 30개 이상 (평가 기준)

### Sprint 문서
각 Sprint 종료 시 `docs/sprint/sprint-{N}.md` 작성:
- 완료 기능 목록
- 발생한 이슈 및 해결 방법
- 다음 Sprint 계획

---

## 10. 개발 워크플로우

### 브랜치 전략
```
main        ← 배포 브랜치 (보호)
  └── dev   ← 개발 통합 브랜치
        └── feat/fraud-scoring    ← 기능 브랜치
        └── feat/market-analysis
        └── feat/loan-eligibility
```

### CI (GitHub Actions)
- PR → `dev`: lint + test 자동 실행
- 실패 시 머지 차단

### CD
- `main` 머지 시 Vercel(프론트) + Railway(백엔드) 자동 배포

### 로컬 개발 시작
```bash
# 백엔드 — 반드시 프로젝트 가상환경 안에서 실행
cd backend
python -m venv .venv                    # 최초 1회만
source .venv/bin/activate               # macOS/Linux
# .venv\Scripts\activate               # Windows
pip install -r requirements.txt
cp .env.example .env                    # API 키 입력
uvicorn main:app --reload

# 프론트엔드
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## 부록: AI 코딩 가이드라인 (Karpathy 원칙)

이 프로젝트에서 AI 에이전트(Claude)가 코드를 생성할 때 따르는 행동 원칙.

### 1. 과도한 복잡성 회피 (YAGNI)
- Sprint 단위로 하나씩 구현. 현재 Sprint에 없는 기능은 코드에 포함하지 않음
- 추상화는 실제로 3번 이상 반복될 때만 도입
- 설정 파일, feature flag는 현재 필요한 경우에만 추가

### 2. 수술적 변경
- 요청된 파일만 수정. 관련 없는 파일은 절대 변경하지 않음
- 기존 코드 스타일을 따름 (새 패턴 도입 최소화)
- 변경 범위는 항상 최소로 유지

### 3. 가정 명시화
- 공공 API 응답 형식이 변경될 수 있음 → 파싱 함수에 주석으로 API 버전·날짜 명시
- 정책 대출 기준일 명시: `# 2025년 기준, 국토교통부 고시 변동 가능`
- 시세 데이터 신뢰도 명시: `"confidence": "low"` 등 응답에 포함

### 4. 검증 가능한 성공 기준
- 모든 API 엔드포인트 구현 시 반드시 테스트를 함께 작성
- 함수 구현 전 예상 입출력 예시를 주석으로 작성 후 구현
- 테스트가 없는 코드는 미완성으로 간주

### 5. 점진적 빌드
- 기능 + 테스트를 함께 커밋 (테스트 없는 기능 단독 커밋 지양)
- 동작하는 상태를 유지하며 확장 (broken state로 커밋 금지)
- 각 Sprint는 독립적으로 데모 가능한 상태로 종료

---

## 참조 문서

| 파일 | 용도 |
|------|------|
| `docs/domain-synthesis.md` | 데이터 모델, API 구조, 아키텍처 다이어그램 원본 |
| `docs/domain-research-policy-loan.md` | 대출 자격 조건 테이블, 계산 예시 3개 |
| `docs/domain-research-market-analysis.md` | RTMS API 스펙, 시세 추정 로직 |
| `docs/domain-research.md` | 전세 사기 스코어링 로직, 위험도 판정 기준 |
| `docs/sprint/` | Sprint별 진행 기록 |
| `docs/design-system.md` | 색상 토큰, 컴포넌트 패턴, 등급 시스템 UI 가이드 |
