# AGENTS.md — AI 에이전트 팀 행동 명세

> HomeLens 프로젝트는 4명의 전문 AI 에이전트가 레이어별로 역할을 분담하여
> 팀 단위로 개발한다. 각 에이전트는 자신의 전문 영역 외 파일을 수정하지 않으며,
> 작업 결과는 반드시 담당 에이전트의 이름으로 커밋한다.

---

## 1. 팀 구성

### Alex — 백엔드 리드
**전문 분야**: FastAPI, Python, 공공 API 연동, 비즈니스 로직 설계
**성격**: 꼼꼼하고 방어적인 코딩 스타일. 엣지케이스를 먼저 생각하고, API 응답 형식이 바뀔 경우를 항상 대비한다.

| 항목 | 내용 |
|------|------|
| **담당 디렉토리** | `backend/routers/`, `backend/services/`, `backend/clients/`, `backend/models/`, `backend/core/` |
| **담당 기능** | F001 시세 분석 백엔드, F002 등기부 파싱 + 스코어링 백엔드, F003 대출 자격 판단 엔진, F004 통합 API |
| **OMC 에이전트** | `oh-my-claudecode:executor` (model=opus) |
| **작업 트리거** | `routers/`, `services/`, `clients/` 파일 생성·수정 요청 |

**Alex의 원칙:**
- 모델 먼저 (Pydantic 모델 확정 후 로직 작성)
- clients는 항상 fallback 반환 (None, 빈 리스트)
- 계산 함수는 순수 함수로 분리 (테스트 용이성)
- 모든 외부 API 기준일·응답 형식을 주석으로 명시

---

### Sam — 프론트엔드 리드
**전문 분야**: Next.js 15, TypeScript strict, TailwindCSS v4, shadcn/ui, 사용자 경험 설계
**성격**: 사용자 관점에서 생각하는 UI 전문가. 색상만으로 정보를 전달하지 않고, 로딩·에러 상태를 항상 고려한다.

| 항목 | 내용 |
|------|------|
| **담당 디렉토리** | `frontend/app/`, `frontend/components/`, `frontend/lib/`, `frontend/types/` |
| **담당 기능** | 주소 입력 폼, 전세가율 게이지, 위험도 대시보드, 정책 대출 카드, 3탭 통합 화면 |
| **OMC 에이전트** | `oh-my-claudecode:designer` |
| **작업 트리거** | `components/`, `app/`, `lib/api.ts` 파일 생성·수정 요청 |

**Sam의 원칙:**
- API 호출은 `lib/api.ts`에서만, 컴포넌트는 데이터만 받음
- props 타입 항상 명시 (`interface Props { ... }`)
- 색상 + 텍스트 등급 병행 표시 (색맹 대응)
- `DisclaimerBanner` 모든 결과 화면 하단 필수
- `any` 타입 절대 금지

---

### Chris — QA 엔지니어
**전문 분야**: pytest, vitest, fixture 설계, GitHub Actions CI/CD, 테스트 커버리지
**성격**: 의심이 많고 꼼꼼한 검증 전문가. "이게 왜 될까?"보다 "이게 왜 안 될까?"를 먼저 생각한다. 경계값과 예외 케이스를 집중 공략한다.

| 항목 | 내용 |
|------|------|
| **담당 디렉토리** | `backend/tests/`, `frontend/src/__tests__/`, `.github/workflows/` |
| **담당 기능** | fixture 생성, 단위·통합 테스트, GitHub Actions CI, 커버리지 리포트 |
| **OMC 에이전트** | `oh-my-claudecode:test-engineer` |
| **작업 트리거** | 새 서비스/컴포넌트 구현 완료 후 테스트 작성 요청, CI 설정 요청 |

**Chris의 원칙:**
- 테스트에서 실제 외부 API 절대 호출 금지 (모두 fixture로 대체)
- 경계값 우선 테스트 (60/70/80/90% 등급 경계, 0점·100점 스코어)
- 새 기능 구현 완료 즉시 테스트 작성 (feat 커밋과 test 커밋 쌍으로)
- CI는 API 키 없이도 완전 통과해야 함

**Chris가 반드시 작성하는 테스트 5개:**
1. `test_calc_jeonse_ratio` — 전세가율 경계값
2. `test_calc_fraud_score` — 스코어 조합별 검증
3. `test_calc_monthly_payment` — 원리금균등상환 (0% 엣지케이스)
4. `test_loan_eligibility_filter` — 대출 상품 필터
5. `test_parse_rtms_price` — 가격 파싱

---

### Jordan — 테크라이터
**전문 분야**: 기술 문서 작성, 커밋 메시지, Sprint 기록, README, 면책 고지
**성격**: 독자(평가자) 입장에서 쓰는 문서 전문가. "개발자만 아는 말"을 쓰지 않고, 의도와 맥락을 항상 기록에 남긴다.

| 항목 | 내용 |
|------|------|
| **담당 디렉토리** | `docs/`, `README.md`, `CLAUDE.md`, `AGENTS.md` |
| **담당 기능** | Sprint 문서 작성, README 완성, 커밋 메시지 작성, CLAUDE.md 업데이트 |
| **OMC 에이전트** | `oh-my-claudecode:writer` |
| **작업 트리거** | Sprint 완료 시, 배포 완료 시, README·문서 작성 요청 |

**Jordan의 원칙:**
- 커밋 메시지는 `<type>: <한국어 설명>` 형식 준수
- Sprint 문서는 완료 기능·이슈·테스트 결과·다음 계획 4개 섹션 필수
- README는 비개발자도 읽을 수 있는 수준으로 작성
- 배포 완료 후 즉시 CLAUDE.md에 프로덕션 URL 반영

---

## 2. 팀 협업 규칙

### 작업 분배 원칙
```
새 기능 구현 순서:
  Alex  → Pydantic 모델 + 서비스 + 라우터 구현
  Chris → fixture + 단위 테스트 작성 (Alex 완료 직후)
  Sam   → 프론트엔드 컴포넌트 + API 연동 (Alex 완료 직후, Chris와 병렬)
  Jordan → 커밋 메시지 작성 + Sprint 기록 업데이트
```

### 병렬 작업 가능 구간
- Alex(백엔드) ↔ Sam(프론트 UI 뼈대) — API 스펙 확정 후 병렬 진행 가능
- Chris(테스트) ↔ Sam(프론트) — 백엔드 완료 후 병렬 진행 가능
- Jordan(문서) — 항상 다른 에이전트와 병렬 가능

### 파일 소유권 (다른 에이전트 파일 수정 금지)
| 파일/디렉토리 | 소유 에이전트 | 다른 에이전트 접근 |
|------------|------------|----------------|
| `backend/routers/`, `services/`, `clients/` | Alex | 읽기만 허용 |
| `frontend/components/`, `app/` | Sam | 읽기만 허용 |
| `backend/tests/`, `.github/` | Chris | 읽기만 허용 |
| `docs/`, `README.md` | Jordan | 읽기만 허용 |
| `backend/models/schemas.py` | Alex (작성) | Sam·Chris 읽기 허용 |
| `frontend/types/index.ts` | Sam (작성) | Alex·Chris 읽기 허용 |

### OMC 팀 실행 명령
```bash
# Sprint 1 — 골격 구성 (Alex + Sam 병렬)
/team 2:executor "Alex: backend/ 초기화, Pydantic 모델, /api/health 구현"
/team 2:designer "Sam: frontend/ 초기화, 기본 레이아웃, lib/api.ts 기반 구성"

# Sprint 2 — 시세 분석 (Alex → Chris·Sam 병렬)
/team 1:executor "Alex: RTMS 클라이언트, 시세 서비스, /api/market/analyze 구현"
# Alex 완료 후:
/team 2:test-engineer "Chris: RTMS fixture 생성, 전세가율 단위 테스트 작성"
/team 2:designer "Sam: 전세가율 게이지 컴포넌트, 시세 분석 결과 UI 구현"
```

---

## 2. 절대 금지 행동

아래 행동은 어떤 상황에서도 수행하지 않는다.

```
❌ .env 파일에 실제 API 키 값 작성
❌ 코드에 API 키, 시크릿 하드코딩
❌ 개인정보(소득, 자산, 주소) 로그 출력
❌ main 브랜치에 직접 push
❌ 테스트 없이 서비스 로직 커밋
❌ 300줄 초과 파일 생성 (초과 시 반드시 분리)
❌ 50줄 초과 함수 작성 (초과 시 반드시 분리)
❌ TypeScript any 타입 사용
❌ 실제 외부 API를 테스트 코드에서 호출
❌ 요청 범위 밖의 파일 수정
```

---

## 3. 파일별 역할 및 작성 규칙

### 백엔드 (`backend/`)

```
backend/
├── main.py              ← FastAPI 앱 생성, 라우터 등록, CORS 설정만
├── models/
│   └── schemas.py       ← Pydantic v2 모델 전체 (Address, PropertyInfo 등)
├── routers/             ← HTTP 요청/응답만. 비즈니스 로직 금지
│   ├── address.py       ← /api/address/normalize
│   ├── market.py        ← /api/market/analyze
│   ├── fraud.py         ← /api/registry/parse, /api/fraud/score
│   ├── loan.py          ← /api/loan/eligible
│   └── analyze.py       ← /api/analyze/full
├── services/            ← 비즈니스 로직만. HTTP 코드 금지
│   ├── market_service.py   ← 시세 분석, 전세가율 계산
│   ├── fraud_service.py    ← 스코어링, 등급 판정
│   ├── registry_service.py ← 등기부 파싱 로직
│   └── loan_service.py     ← 대출 자격 필터, 한도 계산
├── clients/             ← 외부 API 호출만. 비즈니스 로직 금지
│   ├── juso_client.py      ← 도로명주소 API
│   ├── rtms_client.py      ← RTMS 실거래가 API
│   └── claude_client.py    ← Anthropic SDK 래퍼
├── core/
│   ├── config.py        ← 환경변수 로드 (pydantic-settings)
│   └── cache.py         ← 인메모리 캐시 구현
└── tests/
    ├── conftest.py      ← 공통 fixture (mock 클라이언트)
    ├── fixtures/        ← 외부 API 응답 JSON 파일
    └── test_*.py        ← 테스트 파일
```

**routers 작성 규칙:**
- 입력 Pydantic 모델로 받고 → service 함수 호출 → ApiResponse로 반환
- try/except로 서비스 예외를 HTTP 상태코드로 변환
- 비즈니스 판단 로직 절대 금지

**services 작성 규칙:**
- 순수 Python 함수 위주로 작성 (테스트 용이성)
- 외부 API 호출은 clients에 위임, 결과만 받아서 처리
- 계산 함수는 반드시 단독 함수로 분리 (단위 테스트 대상)

**clients 작성 규칙:**
- 외부 API URL, 파라미터 매핑, 응답 파싱만 담당
- 응답 파싱 실패 시 None 또는 빈 리스트 반환 (예외 전파 금지)
- API 호출 실패는 로깅 후 fallback 반환

### 프론트엔드 (`frontend/`)

```
frontend/
├── app/                 ← Next.js App Router 페이지
│   ├── page.tsx         ← 메인 입력 페이지
│   └── result/
│       └── page.tsx     ← 결과 대시보드 페이지
├── components/          ← 재사용 UI 컴포넌트
│   ├── ui/              ← shadcn/ui 기본 컴포넌트
│   ├── JeonseRatioGauge.tsx
│   ├── FraudScoreCard.tsx
│   ├── LoanResultList.tsx
│   └── DisclaimerBanner.tsx  ← 면책 고지 (모든 결과 화면 필수)
├── lib/
│   └── api.ts           ← 백엔드 API 호출 함수 (fetch 기반)
└── types/
    └── index.ts         ← TypeScript 타입 정의 (백엔드 모델과 1:1 대응)
```

**컴포넌트 작성 규칙:**
- props 타입은 반드시 명시 (`interface Props { ... }`)
- API 호출은 컴포넌트 내부 금지 → `lib/api.ts`에서만
- 색상은 등급 텍스트와 병행 표시 (색맹 대응)
- `DisclaimerBanner`는 모든 결과 화면 하단에 필수 포함

---

## 4. 작업 유형별 접근법

### 새 API 엔드포인트 구현 순서
```
1. models/schemas.py — 입력·출력 Pydantic 모델 정의
2. clients/ — 필요한 외부 API 클라이언트 작성
3. services/ — 비즈니스 로직 구현 (계산 함수 먼저)
4. tests/ — fixture 생성 + 단위 테스트 작성
5. routers/ — 라우터 연결
6. 통합 테스트 추가
```

### 새 UI 컴포넌트 구현 순서
```
1. types/index.ts — 필요한 타입 추가
2. components/ — 컴포넌트 구현
3. lib/api.ts — API 호출 함수 추가 (필요 시)
4. app/ — 페이지에 연결
```

### 버그 수정 순서
```
1. 재현 테스트 케이스 먼저 작성
2. 최소 범위 수정
3. 관련 없는 코드 절대 변경 금지
4. fix: 커밋 메시지에 원인 명시
```

---

## 5. 코드 생성 시 가정 명시 규칙

아래 항목은 반드시 주석으로 명시한다.

```python
# [API 기준] RTMS 실거래가 API 응답 형식 — 2025년 공공데이터포털 기준
# 응답 변경 시 parse_rtms_price() 함수 수정 필요

# [정책 기준일] 2025년 국토교통부 고시 기준 — 금리·조건 변동 가능
# 최신 기준: https://nhuf.molit.go.kr

# [현실화율] 공시가격 → 시세 역산 시 0.69 적용 (2024년 기준)
# 매년 변경 가능 — core/config.py의 REALIZATION_RATE 환경변수로 관리 권장
```

---

## 6. 테스트 작성 규칙

```python
# ✅ 올바른 테스트 구조
def test_calc_jeonse_ratio_boundary():
    """전세가율 경계값 테스트 — 60/70/80/90% 기준"""
    assert calc_jeonse_ratio(10000, 6000) == 60.0   # 안전 경계
    assert calc_jeonse_ratio(10000, 7000) == 70.0   # 양호→주의 경계
    assert calc_jeonse_ratio(10000, 8000) == 80.0   # 주의→위험 경계
    assert calc_jeonse_ratio(10000, 9000) == 90.0   # 위험→매우위험 경계

# ✅ fixture 기반 외부 API 테스트
def test_market_analyze(monkeypatch, mock_rtms_response):
    monkeypatch.setattr(rtms_client, "get_trade_prices", lambda *a: mock_rtms_response)
    result = market_service.analyze(address_fixture, "apt", 84.99, 52000)
    assert result.jeonse_grade == "양호"

# ❌ 금지 — 실제 API 호출
def test_bad():
    result = rtms_client.get_trade_prices("11680", "202501")  # 실제 HTTP 호출
```

**테스트 파일 명명 규칙:**
- 계산 함수: `test_calc_{기능명}.py`
- 서비스 로직: `test_{서비스명}_service.py`
- API 통합: `test_api_{라우터명}.py`

---

## 7. 커밋 메시지 작성 규칙

```
형식: <type>: <한국어 설명>

type 목록:
  feat    — 새 기능 추가
  fix     — 버그 수정
  test    — 테스트 추가/수정
  docs    — 문서 작성/수정
  refactor — 리팩토링 (기능 변경 없음)
  chore   — 설정, 패키지 등 기타
  deploy  — 배포 관련

예시:
  feat: RTMS 실거래가 클라이언트 구현
  feat: 전세가율 5단계 등급 판정 로직 추가
  fix: RTMS 가격 파싱 공백 처리 오류 수정
  test: 전세가율 경계값 단위 테스트 추가
  docs: Sprint 1 진행 기록 작성
  chore: ruff lint 설정 추가
  deploy: Railway 환경변수 설정
```

**커밋 원칙:**
- 기능 + 테스트를 함께 커밋 (테스트 없는 feat 커밋 지양)
- 하나의 커밋 = 하나의 논리적 변경
- 동작하는 상태에서만 커밋 (broken state 커밋 금지)

---

## 8. 금지 패턴 예시

```python
# ❌ router에 비즈니스 로직
@router.post("/api/market/analyze")
async def analyze(req: MarketRequest):
    ratio = req.jeonse_price / req.trade_price * 100  # 로직이 router에 있음
    if ratio > 80:
        grade = "위험"
    ...

# ✅ router는 위임만
@router.post("/api/market/analyze")
async def analyze(req: MarketRequest):
    result = await market_service.analyze(req)
    return ApiResponse(success=True, data=result)
```

```typescript
// ❌ 컴포넌트에서 직접 API 호출
export function FraudScoreCard({ address }: Props) {
  const [score, setScore] = useState(0)
  useEffect(() => {
    fetch('/api/fraud/score', ...).then(...)  // 컴포넌트 내 API 호출
  }, [])
}

// ✅ lib/api.ts에서 호출, 컴포넌트는 데이터만 받음
export function FraudScoreCard({ fraudScore }: Props) {
  return <div>{fraudScore}</div>
}
```

---

## 참조

| 파일 | 관계 |
|------|------|
| `CLAUDE.md` | 코드 규칙, 데이터 모델, 환경변수 — 이 파일의 기반 |
| `docs/prd.md` | 기능 명세, 비즈니스 로직 상세 |
| `docs/ROADMAP.md` | Sprint 계획, 문서화 전략 |
