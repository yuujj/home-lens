# Sprint 1 — 프로젝트 초기화 + API 골격

**기간**: 2026-03-13 ~ 2026-03-14
**담당 에이전트**: Alex (백엔드) + Sam (프론트엔드) 병렬
**목표**: 로컬에서 백/프론트 모두 기동 가능한 골격 완성

---

## 목표 요약

| 항목 | 내용 |
|------|------|
| 백엔드 | `GET /api/health` 200 응답 |
| 프론트엔드 | 기본 레이아웃 + 주소 입력 화면 렌더링 |
| 테스트 | pytest 인식, vitest 설정 완료 |
| 커밋 목표 | 8개 이상 |

---

## 1. 공통 작업

### 1-1. GitHub 브랜치 설정
- `main` — 배포 브랜치 (보호)
- `dev` — 개발 통합
- `feat/sprint-1-init` — 이번 Sprint 작업 브랜치

### 1-2. 루트 파일
- [x] `.gitignore` — `.env`, `__pycache__`, `.next`, `node_modules` 포함
- [ ] `README.md` — 최소 구조만 (Sprint 5에서 완성)

---

## 2. Alex — 백엔드 초기화

### 2-1. 디렉토리 구조
```
backend/
├── main.py
├── requirements.txt
├── pyproject.toml          ← ruff + pytest 설정
├── .env.example
├── models/
│   └── schemas.py          ← Pydantic v2 전체 모델
├── core/
│   ├── config.py           ← 환경변수 (pydantic-settings)
│   └── cache.py            ← 인메모리 캐시
├── routers/
│   └── health.py           ← GET /api/health
├── services/               ← Sprint 2~4에서 채움
│   └── .gitkeep
├── clients/                ← Sprint 2~4에서 채움
│   └── .gitkeep
└── tests/
    ├── conftest.py
    └── fixtures/
        └── .gitkeep
```

### 2-2. 파일별 요구사항

#### `requirements.txt`
```
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic==2.9.2
pydantic-settings==2.5.2
httpx==0.27.2
anthropic==0.34.2
python-dotenv==1.0.1
pytest==8.3.3
pytest-asyncio==0.24.0
pytest-cov==5.0.0
ruff==0.6.9
```

#### `pyproject.toml`
```toml
[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

#### `main.py`
- FastAPI 앱 생성
- CORSMiddleware — origins은 `settings.cors_origins_list`
- `router.include_router(health.router, prefix="/api")`
- 앱 title: `"이 집 괜찮아? API"`

#### `core/config.py`
```python
# pydantic-settings BaseSettings 사용
class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    DATA_GO_KR_API_KEY: str = ""
    JUSO_API_KEY: str = ""
    RONE_API_KEY: str = ""
    ECOS_API_KEY: str = ""
    FSS_API_KEY: str = ""
    BACKEND_URL: str = "http://localhost:8000"
    CORS_ORIGINS: str = "http://localhost:3000"
    CACHE_TTL_SECONDS: int = 3600
    CLAUDE_MODEL: str = "claude-sonnet-4-6"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

settings = Settings()
```

#### `core/cache.py`
```python
# TTL 기반 인메모리 캐시
# get(key) → Any | None
# set(key, value, ttl=settings.CACHE_TTL_SECONDS)
# market_cache_key(lawd_cd, housing_type, ym) → "market:{lawd_cd}:{housing_type}:{ym}"
```

#### `models/schemas.py`
아래 모델 전체 구현 (Pydantic v2):

| 모델 | 주요 필드 |
|------|---------|
| `ApiResponse[T]` | success, data, error, warnings |
| `Address` | raw_input, road_addr, jibun_addr, lawd_cd_5, lawd_cd_10, sido, sigungu, dong, is_metropolitan, regulation_zone |
| `PropertyInfo` | address, housing_type, exclusive_area_m2, floor, built_year, listed_jeonse_price, listed_trade_price, market_trade_price, market_jeonse_price, market_data_confidence, senior_mortgage_amount, has_attachment, has_provisional_attachment, has_auction, has_trust, has_lease_registration |
| `UserProfile` | annual_income, is_dual_income, net_asset, age, is_married, marriage_years, num_children, has_newborn_2yr, housing_ownership, is_disabled, is_single_parent, is_multicultural, subscription_years, subscription_count, loan_purpose |
| `LoanResult` | product_name, max_limit, rate_min, rate_max, rate_with_benefit, ltv, monthly_payment_estimate, notes |
| `AnalysisResult` | property, user, jeonse_ratio, jeonse_grade, price_trend, price_trend_pct, fraud_score, fraud_grade, fraud_flags, eligible_loans |

#### `routers/health.py`
```python
@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "이 집 괜찮아? API"}
```

#### `.env.example`
```
# 필수
ANTHROPIC_API_KEY=
DATA_GO_KR_API_KEY=
JUSO_API_KEY=

# 선택
RONE_API_KEY=
ECOS_API_KEY=
FSS_API_KEY=

# 서비스 설정
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000
CACHE_TTL_SECONDS=3600
CLAUDE_MODEL=claude-sonnet-4-6
```

### 2-3. Alex 완료 기준
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000/api/health → {"status": "ok"} ✅
# → http://localhost:8000/docs → Swagger UI ✅
pytest  # → 0 errors (테스트 파일 인식) ✅
ruff check .  # → 0 errors ✅
```

---

## 3. Sam — 프론트엔드 초기화

### 3-1. 디렉토리 구조
```
frontend/
├── package.json
├── tsconfig.json           ← strict: true 필수
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json         ← shadcn/ui 설정
├── .eslintrc.json
├── .prettierrc
├── .env.example
└── src/
    ├── app/
    │   ├── layout.tsx      ← lang="ko", Header, DisclaimerBanner
    │   ├── page.tsx        ← 메인 입력 페이지
    │   └── globals.css
    ├── components/
    │   ├── ui/             ← shadcn/ui (빈 디렉토리)
    │   │   └── .gitkeep
    │   ├── Header.tsx
    │   ├── DisclaimerBanner.tsx
    │   └── AddressInput.tsx
    ├── lib/
    │   └── api.ts
    └── types/
        └── index.ts
```

### 3-2. 파일별 요구사항

#### `tsconfig.json` 핵심 설정
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

#### `src/types/index.ts`
백엔드 `schemas.py`와 1:1 대응:
```typescript
export type HousingType = "apt" | "rh" | "sh" | "offi"
export type JeonseGrade = "안전" | "양호" | "주의" | "위험" | "매우 위험"
export type FraudGrade = "안전" | "주의" | "위험" | "매우 위험"
export type RegulationZone = "투기지역" | "투기과열" | "조정" | "일반"

export interface Address { ... }
export interface PropertyInfo { ... }
export interface UserProfile { ... }
export interface LoanResult { ... }
export interface AnalysisResult { ... }
export interface ApiResponse<T> { success, data?, error?, warnings }

// 폼 입력 타입
export interface AddressInputData {
  address: string
  housingType: HousingType
  exclusiveAreaM2: number
  listedJeonsePrice: number
}

// API 요청/응답 타입
export interface MarketAnalyzeRequest { ... }
export interface MarketAnalyzeResponse {
  marketTradePrice?: number
  marketJeonsePrice?: number
  jeonseRatio?: number
  jeonseGrade: JeonseGrade
  marketDataConfidence: string
  priceTrend: string
  priceTrendPct?: number
}
```

#### `src/lib/api.ts`
```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

// 기본 fetch 래퍼 (에러 처리 포함)
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T>

// 주소 정규화
export async function normalizeAddress(rawAddress: string): Promise<Address>

// 시세 분석 (Sprint 2 구현 예정)
export async function analyzeMarket(data: MarketAnalyzeRequest): Promise<MarketAnalyzeResponse>
```

#### `src/components/Header.tsx`
- 서비스명 "이 집 괜찮아?" + 로고
- `interface Props {}` 명시

#### `src/components/DisclaimerBanner.tsx`
- 고정 텍스트: `"본 결과는 참고용이며 법적·금융 자문이 아닙니다. 실제 계약 전 전문가 상담 및 공문서 직접 확인을 권장합니다."`
- 노란 배경 경고 스타일

#### `src/components/AddressInput.tsx`
- 필드: 주소(text), 주택유형(select), 전용면적(number), 전세보증금(number)
- `onSubmit: (data: AddressInputData) => void` props
- `any` 타입 절대 금지

#### `src/app/page.tsx`
- 서비스 타이틀 + 핵심 기능 3개 소개 카드
- `AddressInput` 컴포넌트 배치

#### `.env.example`
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3-3. Sam 완료 기준
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000 → 기본 레이아웃 렌더링 ✅
npm run lint  # → 0 errors ✅
npx tsc --noEmit  # → 0 type errors ✅
```

---

## 4. Chris — 테스트 기반 설정

Sprint 1에서 Chris의 역할은 Alex 완료 직후 테스트 인프라를 구성하는 것.

### 4-1. 백엔드 테스트 설정
```python
# backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)
```

### 4-2. 첫 번째 테스트 (health check)
```python
# backend/tests/test_api_health.py
def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

### 4-3. Chris 완료 기준
```bash
cd backend
pytest tests/test_api_health.py -v  # → PASSED ✅
```

---

## 5. Jordan — 문서 + 커밋 기록

### 5-1. Sprint 1 커밋 계획 (8개)

| # | 커밋 메시지 | 담당 |
|---|------------|------|
| 1 | `chore: 백엔드 프로젝트 초기화 (FastAPI, requirements.txt)` | Alex |
| 2 | `feat: Pydantic v2 데이터 모델 전체 정의 (schemas.py)` | Alex |
| 3 | `feat: 환경변수 설정 및 인메모리 캐시 구현` | Alex |
| 4 | `feat: GET /api/health 엔드포인트 구현` | Alex |
| 5 | `chore: 프론트엔드 프로젝트 초기화 (Next.js 15, TypeScript strict)` | Sam |
| 6 | `feat: 공통 레이아웃 및 기본 컴포넌트 구현 (Header, DisclaimerBanner)` | Sam |
| 7 | `feat: 주소 입력 폼 컴포넌트 및 API 타입 정의` | Sam |
| 8 | `test: pytest 설정 및 health check 테스트 추가` | Chris |

### 5-2. Sprint 1 완료 후 작성
- `docs/sprint/sprint-1.md` 실제 완료 항목 체크 업데이트

---

## 6. Sprint 1 완료 기준 체크리스트

### 백엔드
- [ ] `uvicorn main:app --reload` 기동 성공
- [ ] `GET /api/health` → 200 OK
- [ ] `GET /docs` → Swagger UI 접근 가능
- [ ] `ruff check .` → 0 errors
- [ ] `pytest` → health check 테스트 통과

### 프론트엔드
- [ ] `npm run dev` 기동 성공
- [ ] `http://localhost:3000` 레이아웃 렌더링
- [ ] `npm run lint` → 0 errors
- [ ] TypeScript strict 오류 없음
- [ ] `DisclaimerBanner` 화면 하단 표시 확인

### 공통
- [ ] `feat/sprint-1-init` 브랜치 → `dev` 머지
- [ ] 커밋 8개 이상
- [ ] `.env` 파일 커밋되지 않음 확인

---

## 다음 Sprint 예고

Sprint 2에서 Alex는 RTMS API 클라이언트와 시세 분석 서비스를 구현한다.
Sam은 전세가율 게이지 UI와 결과 화면을 구현한다.
Chris는 RTMS fixture JSON을 생성하고 전세가율 계산 단위 테스트를 작성한다.
