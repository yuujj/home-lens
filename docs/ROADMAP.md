# ROADMAP — "이 집 괜찮아?" 개발 로드맵

**기준일**: 2026-03-13
**참여 형태**: 1인 개인 참가
**목표 점수**: 배포 보너스 포함 100점 (기본 90점 + 보너스 10점)

---

## 점수 전략 요약

| 평가 항목 | 배점 | 목표 | 핵심 액션 |
|---------|------|------|---------|
| **AI-Native 문서화** | **30점** | **30점** | PRD + README + CLAUDE.md + AGENTS.md + Sprint 문서 + 커밋 30개 |
| 기술 구현력 | 30점 | **28점** | 3계층 분리 아키텍처 + TypeScript strict + Pydantic v2 |
| 검증 계획 | 15점 | **15점** | pytest + vitest + GitHub Actions CI/CD |
| 완성도 및 UX | 15점 | **13점** | 핵심 기능 3개 완전 동작 + 반응형 + shadcn/ui |
| 아이디어 및 활용 가치 | 10점 | **9점** | 실제 문제 + 기존 서비스 차별화표 |
| 배포 보너스 | +10점 | **+10점** | Vercel + Railway 배포 URL |

> **문서화(30점)가 최대 배점 + AI 컨텍스트(9점)는 AGENTS.md·Skill 파일 있으면 추가 점수 — 최우선 확보**
> **검증 계획(15점)이 평가 예시에서 5/15로 최대 실점** — 만점 목표

---

## AI-Native 문서화 30점 세부 전략

문서화는 배점 최대(30점)이며 "개발 없이 챙길 수 있는 점수"다. 아래 3개 하위 항목을 각각 만점 목표로 설정한다.

### 프로젝트 정의 12점 — 필수 산출물

| 산출물 | 위치 | 필수 포함 항목 | Sprint |
|--------|------|------------|--------|
| **README.md** | 루트 | 서비스 소개, 배포 URL, 아키텍처 다이어그램, 로컬 실행 가이드, 스크린샷 3개, 기술 스택 배지 | Sprint 5 |
| **PRD.md** | `docs/prd.md` | 문제 정의, 기존 서비스 차별화표, F001~F004 기능 명세, 비기능 요구사항, API 스펙 | ✅ 완료 |
| **ROADMAP.md** | `docs/ROADMAP.md` | Sprint 계획, 점수 전략, 체크리스트 | ✅ 완료 |

#### README.md 필수 섹션 (Sprint 5에서 작성)
```
1. 서비스 소개 — 한 줄 설명 + 핵심 기능 3개 bullet
2. 배포 URL — Vercel 프론트 / Railway 백엔드
3. 아키텍처 다이어그램 — 텍스트 또는 이미지 (프론트 ↔ 백 ↔ 공공API/Claude API)
4. 로컬 실행 가이드 — 백엔드(uvicorn) / 프론트(npm run dev) 각각 3줄 이내
5. 스크린샷 — 시세분석 결과 / 등기부 위험도 / 정책대출 목록
6. 기술 스택 배지 — Next.js / FastAPI / Claude AI / Vercel / Railway
7. 면책 고지
```

### AI 컨텍스트 9점 — CLAUDE.md + AGENTS.md + Skill

| 산출물 | 위치 | 역할 | Sprint |
|--------|------|------|--------|
| **CLAUDE.md** | 루트 | 코드 규칙, 아키텍처 원칙, 데이터 모델, 테스트 전략 | ✅ 완료 |
| **AGENTS.md** | 루트 | AI 에이전트 행동 명세 — 금지 행동, 파일별 역할, 작업 유형별 접근법 | Sprint 1 |
| **배포 URL 반영** | `CLAUDE.md` | Sprint 5 배포 후 `CLAUDE.md`에 프로덕션 URL 섹션 추가 | Sprint 5 |

> 전략 명세서 원문: *"Agent, Skill 파일이 있으면 추가 점수"* → AGENTS.md가 9점 만점의 핵심

### 개발 진행 기록 9점 — 커밋 + Sprint 문서

#### 커밋 30개 달성 계획 (Sprint별 분배)

| Sprint | 예상 커밋 수 | 주요 커밋 예시 |
|--------|-----------|------------|
| Sprint 0 | 3개 | `docs: PRD 작성`, `docs: CLAUDE.md 작성`, `docs: ROADMAP 작성` |
| Sprint 1 | 8개 | `chore: 프로젝트 초기화`, `feat: 백엔드 Pydantic 모델 정의`, `feat: /api/health 구현`, `chore: CORS 설정`, `feat: 프론트엔드 기본 레이아웃`, `test: pytest conftest 설정`, `chore: GitHub Actions CI 초안`, `docs: AGENTS.md 작성` |
| Sprint 2 | 7개 | `feat: 도로명주소 API 클라이언트`, `feat: RTMS 실거래가 클라이언트`, `feat: 시세 분석 서비스 로직`, `feat: /api/market/analyze 라우터`, `feat: 시세 분석 UI 컴포넌트`, `test: 전세가율 계산 단위 테스트`, `test: RTMS 가격 파싱 테스트` |
| Sprint 3 | 7개 | `feat: Claude API 클라이언트`, `feat: 등기부 파싱 서비스`, `feat: 사기 스코어링 서비스`, `feat: /api/fraud/score 라우터`, `feat: 위험도 UI 컴포넌트`, `test: 사기 스코어 단위 테스트`, `test: Claude mock fixture 추가` |
| Sprint 4 | 5개 | `feat: 정책 대출 자격 판단 엔진`, `feat: /api/loan/eligible 라우터`, `feat: /api/analyze/full 통합 라우터`, `feat: 3탭 통합 대시보드 UI`, `test: 대출 자격 필터 단위 테스트` |
| Sprint 5 | 5개 | `test: GitHub Actions CI 워크플로우`, `deploy: Railway 백엔드 배포 설정`, `deploy: Vercel 프론트 배포 설정`, `docs: README.md 작성`, `docs: Sprint 문서 최종 정리` |
| **합계** | **35개** | 목표 30개 초과 달성 |

#### Sprint 문서 표준 형식 (`docs/sprint/sprint-{N}.md`)
```markdown
# Sprint N — {제목}

**기간**: YYYY-MM-DD ~ YYYY-MM-DD
**목표**: 한 줄 요약

## 완료 기능
- [ ] 항목 (커밋 해시 링크)

## 발생 이슈 및 해결
| 이슈 | 원인 | 해결 방법 |

## 테스트 결과
- 테스트 파일 수 / 통과율 / 커버리지

## 다음 Sprint 계획
- 이어서 할 작업
```

---

## 전체 타임라인

```
3/13 (금)  ██████░░░░░░░░░░░░░░  Sprint 0 완료 (기획)
           ████████████░░░░░░░░  Sprint 1 시작 (골격)
3/14 (토)  ░░░░░░░░████████████  Sprint 1 완료 + Sprint 2 시작 (시세 분석)
3/15 (일)  ████████████████░░░░  Sprint 2 완료 + Sprint 3 시작 (등기부)
3/16 (월)  ░░░░████████████████  Sprint 3 완료 + Sprint 4 (대출 + 통합)
           ████████████░░░░░░░░  Sprint 5 (테스트 + 배포 + 문서 마무리)
```

---

## Sprint 0 — 기획 및 설계 ✅ 완료

**기간**: ~2026-03-13
**목표**: 개발 시작 전 모든 설계 확정

### 완료 항목
- [x] 도메인 리서치 3개 (`domain-research.md`, `domain-research-market-analysis.md`, `domain-research-policy-loan.md`)
- [x] 통합 설계 (`domain-synthesis.md`) — 데이터 모델, API 구조, 아키텍처 다이어그램
- [x] PRD (`docs/prd.md`) — 기능 명세 F001~F004, 사용자 플로우, 기술 스택
- [x] CLAUDE.md — 코드 규칙, 아키텍처 원칙, 테스트 전략
- [x] ROADMAP.md (본 문서)

### 완료 기준
- PRD의 F001~F004 기능 명세 확정 ✅
- 데이터 모델 5개 확정 (Address, PropertyInfo, UserProfile, AnalysisResult, LoanResult) ✅
- API 엔드포인트 7개 확정 ✅

---

## Sprint 1 — 프로젝트 초기화 + API 골격

**기간**: 2026-03-13 ~ 2026-03-14
**목표**: 로컬 실행 가능한 기본 골격 구성, `/api/health` 응답 확인

### 작업 항목

#### 공통
- [ ] GitHub 레포 생성 + 브랜치 전략 설정 (`main`, `dev`, `feat/*`)
- [ ] 디렉토리 구조 초기화
- [ ] `.env.example` 작성 (필수 3개 + 선택 3개 + 서비스 설정)
- [ ] `.gitignore` 설정 (`.env`, `__pycache__`, `.next`, `node_modules`)

#### 백엔드 (FastAPI)
- [ ] 프로젝트 초기화: `backend/` 디렉토리, `requirements.txt`, `main.py`
- [ ] 3계층 구조 폴더 생성: `routers/`, `services/`, `clients/`
- [ ] Pydantic v2 데이터 모델 작성 (`models/`: Address, PropertyInfo, UserProfile, AnalysisResult, LoanResult, ApiResponse)
- [ ] `GET /api/health` 구현
- [ ] CORS 미들웨어 설정
- [ ] ruff lint 설정 (`pyproject.toml`)

#### 프론트엔드 (Next.js)
- [ ] `create-next-app` — TypeScript strict, TailwindCSS v4, App Router
- [ ] shadcn/ui 설치 및 기본 설정
- [ ] 기본 레이아웃 컴포넌트 (`Header`, `Footer`, 면책 고지 바)
- [ ] `lib/api.ts` — 백엔드 호출 기본 함수
- [ ] ESLint + Prettier 설정
- [ ] `types/` 디렉토리 — TypeScript 타입 정의

#### 테스트 기반
- [ ] `backend/tests/conftest.py` — 공통 fixture 설정
- [ ] `backend/tests/fixtures/` 디렉토리 생성 (공공 API 응답 fixture JSON)
- [ ] `pytest.ini` 또는 `pyproject.toml` 테스트 설정
- [ ] vitest 설정 (`vitest.config.ts`)

### 완료 기준
- `uvicorn main:app --reload` 실행 → `GET /api/health` 200 응답
- `npm run dev` 실행 → 기본 레이아웃 화면 렌더링
- `pytest` 실행 → 테스트 파일 인식 (0 tests collected OK)
- **커밋 목표**: 8개 이상

---

## Sprint 2 — F001 시세 분석 구현

**기간**: 2026-03-14 ~ 2026-03-15
**목표**: 실제 주소 입력 → RTMS 시세 조회 → 전세가율 등급 표시 동작

### 작업 항목

#### 백엔드
- [ ] `clients/juso_client.py` — 도로명주소 API 호출 (법정동코드 추출)
- [ ] `clients/rtms_client.py` — RTMS 매매·전세 실거래가 API 호출
- [ ] `services/market_service.py` — 시세 분석 비즈니스 로직
  - 유사 면적 필터 (±10%)
  - 해제 건 제거
  - 중간값(median) / 가중평균 / 공시가격 fallback
  - 전세가율 계산 + 5단계 등급 판정
  - 인메모리 캐시 (TTL: `CACHE_TTL_SECONDS`)
- [ ] `routers/market.py` — `POST /api/address/normalize`, `POST /api/market/analyze`
- [ ] 빌라(rh) 경고, 다가구(sh) 경고 처리

#### 프론트엔드
- [ ] 주소 입력 폼 컴포넌트 (도로명주소 자동완성)
- [ ] 주택 유형 선택 + 전용면적 + 전세보증금 입력 폼
- [ ] `lib/api.ts` — `/api/address/normalize`, `/api/market/analyze` 호출
- [ ] 전세가율 게이지 컴포넌트 (색상 5단계)
- [ ] 데이터 신뢰도 배지 컴포넌트
- [ ] 로딩 상태 + 에러 상태 처리

#### 테스트 (우선 구현 테스트 포함)
- [ ] `tests/fixtures/rtms_apt_trade.json` — RTMS 매매 응답 fixture
- [ ] `tests/fixtures/rtms_apt_rent.json` — RTMS 전세 응답 fixture
- [ ] `tests/fixtures/juso_response.json` — 도로명주소 API 응답 fixture
- [ ] `test_calc_jeonse_ratio` — 전세가율 계산 (경계값: 60/70/80/90%)
- [ ] `test_parse_rtms_price` — 가격 파싱 (`"  85,000"` → `85000`)
- [ ] `test_market_service_with_fixture` — fixture 기반 통합 테스트

### 완료 기준
- 실제 서울 주소 입력 → 5초 이내 전세가율 + 등급 표시
- RTMS 거래 없는 경우 공시가격 fallback 동작
- `pytest tests/` 통과 (외부 API 호출 없이)
- **커밋 목표**: Sprint 누적 20개 이상

---

## Sprint 3 — F002 AI 등기부 분석 + 사기 위험도 스코어링

**기간**: 2026-03-15 ~ 2026-03-16
**목표**: 등기부등본 텍스트 붙여넣기 → Claude 해석 → 위험도 점수 + 플래그 표시

### 작업 항목

#### 백엔드
- [ ] `clients/claude_client.py` — Anthropic SDK 래퍼
  - 등기부등본 텍스트 → 구조화 JSON 출력 (tool_use 활용)
  - 토큰 비용 최소화 (갑구/을구 섹션 분리)
  - 에러 처리 (API 타임아웃, 토큰 초과)
- [ ] `services/registry_service.py` — 등기부 파싱 서비스
- [ ] `services/fraud_service.py` — 스코어링 비즈니스 로직
  - 전세가율 점수 (0~30)
  - 근저당비율 점수 (0~30)
  - 등기 위험키워드 점수 (0~20)
  - 임대인 신뢰도 점수 (0~20)
  - 총점 → 등급 판정 + 체크리스트 생성
- [ ] `routers/fraud.py` — `POST /api/registry/parse`, `POST /api/fraud/score`

#### 프론트엔드
- [ ] 등기부등본 텍스트 입력 textarea 컴포넌트 (붙여넣기 가이드 포함)
- [ ] 위험도 점수 게이지 컴포넌트 (0~100, 4단계 색상)
- [ ] 위험 플래그 목록 컴포넌트
- [ ] 체크리스트 컴포넌트 (미완료 항목 하이라이트)
- [ ] 등기부 해석 요약 카드 컴포넌트

#### 테스트 (우선 구현 테스트 포함)
- [ ] `tests/fixtures/claude_registry_response.json` — Claude API 응답 fixture
- [ ] `test_calc_fraud_score` — 가압류·신탁·전세가율 조합별 스코어 검증
- [ ] `test_registry_parse_with_fixture` — Claude 클라이언트 mock 기반 테스트
- [ ] `test_fraud_score_edge_cases` — 경계값 (0점, 100점) 테스트

### 완료 기준
- 실제 등기부등본 텍스트 입력 → 위험도 점수 + 위험 플래그 표시
- 가압류·신탁 키워드 탐지율 > 80% (fixture 기반 검증)
- Claude API mock으로 `pytest` 통과
- **커밋 목표**: Sprint 누적 25개 이상

---

## Sprint 4 — F003 정책 대출 자격 판단 + F004 통합 대시보드

**기간**: 2026-03-16 (오전)
**목표**: 7개 정책 대출 자격 판단 + 3탭 통합 결과 화면 완성

### 작업 항목

#### 백엔드
- [ ] `services/loan_service.py` — 정책 대출 자격 판단 엔진
  - 7개 상품 자격 필터 (소득·자산·연령·주택가격·특수조건)
  - 한도 계산: `MIN(가격 × LTV, DTI 한도, 상품 최대 한도)`
  - 금리 계산: 기본 금리 + 우대금리 합산
  - `calc_monthly_payment` — 원리금균등상환 계산
  - 결과 정렬 (금리 낮은 순)
- [ ] `routers/loan.py` — `POST /api/loan/eligible`
- [ ] `routers/analyze.py` — `POST /api/analyze/full` (F001+F002+F003 배치 통합)

#### 프론트엔드
- [ ] 사용자 프로필 입력 폼 (연소득·나이·혼인·자녀·순자산)
- [ ] 정책 대출 상품 카드 컴포넌트 (금리·한도·월상환액·주의사항)
- [ ] 자격 미충족 상품 불가 사유 표시
- [ ] **3탭 통합 대시보드** (`시세 분석` / `사기 위험도` / `정책 대출`)
- [ ] 종합 위험도 점수 헤더 (0~100 게이지)
- [ ] 면책 고지 하단 고정 배너

#### 테스트 (우선 구현 테스트 포함)
- [ ] `test_loan_eligibility_filter` — 소득·연령·주택가격별 상품 필터 검증
- [ ] `test_calc_monthly_payment` — 원리금균등상환 (0% 금리 엣지케이스 포함)
- [ ] `test_full_analyze_integration` — 통합 API fixture 기반 테스트

### 완료 기준
- 소득 3500만원 / 만 29세 / 전세 1.8억 입력 → 청년전용 버팀목 1.44억 한도 출력
- 3탭 대시보드 완전 동작
- **커밋 목표**: Sprint 누적 30개 이상

---

## Sprint 5 — 테스트 + 배포 + 문서 마무리

**기간**: 2026-03-16 (오후)
**목표**: GitHub Actions CI + Vercel/Railway 배포 URL + 문서 완성

### 작업 항목

#### 테스트 & 커버리지
- [ ] 계산 함수 커버리지 90% 확인 (`pytest --cov`)
- [ ] 서비스 로직 커버리지 70% 확인
- [ ] 전체 커버리지 60% 확인
- [ ] vitest 프론트엔드 컴포넌트 테스트

#### GitHub Actions CI
- [ ] `.github/workflows/ci.yml` 작성
  ```yaml
  on: [pull_request]
  jobs:
    backend:
      - ruff check backend/
      - pytest backend/tests/ (API 키 불필요)
    frontend:
      - npm run lint
      - npm run test
  ```
- [ ] `.github/workflows/deploy.yml` 작성
  - `main` 머지 시 Vercel 자동 배포 트리거
  - `main` 머지 시 Railway 자동 배포 트리거

#### 배포
- [ ] Vercel 연결 + 환경변수 설정 (`BACKEND_URL` 등)
- [ ] Railway 연결 + 환경변수 설정 (`ANTHROPIC_API_KEY` 등)
- [ ] 배포 URL 접속 확인 (실제 주소로 E2E 동작 검증)

#### 문서 마무리
- [ ] `README.md` 작성 (프로젝트 소개, 설치 방법, 아키텍처 다이어그램, 스크린샷, 배포 URL)
- [ ] `docs/sprint/sprint-1.md` ~ `sprint-3.md` 작성 (완료 기능, 이슈, 다음 계획)
- [ ] `CLAUDE.md` 배포 URL 섹션 업데이트
- [ ] 커밋 이력 점검 (30개 이상, 설명적 메시지 확인)

### 완료 기준
- GitHub Actions CI — PR 시 lint + test 자동 통과 ✅
- Vercel 프론트 배포 URL 접속 가능 ✅
- Railway 백엔드 배포 URL `/api/health` 200 응답 ✅
- **최종 커밋**: 30개 이상 ✅

---

## 제출 전 최종 체크리스트

### 문서화 (30점)
- [ ] `docs/prd.md` — 문제 정의, 기능 명세 F001~F004 완성
- [ ] `CLAUDE.md` — 10개 섹션 완성, 배포 URL 포함
- [ ] 커밋 30개 이상, `feat/fix/test/docs/` 형식
- [ ] `docs/sprint/sprint-{1,2,3}.md` 존재

### 기술 구현력 (30점)
- [ ] `routers/` → `services/` → `clients/` 3계층 분리
- [ ] TypeScript strict + Pydantic v2 사용
- [ ] `requirements.txt` + `package.json` 의존성 명시
- [ ] 일관된 `ApiResponse[T]` 에러 처리 패턴

### 완성도 (15점)
- [ ] F001 시세 분석 동작 (실제 주소 입력 → 전세가율)
- [ ] F002 등기부 분석 동작 (텍스트 → 위험도 점수)
- [ ] F003 대출 판단 동작 (소득 입력 → 상품 목록)
- [ ] 반응형 (모바일/데스크탑)
- [ ] 면책 고지 모든 결과 화면 하단 표시

### 검증 (15점)
- [ ] `pytest` — 단위 + 통합 테스트, 외부 API 미호출
- [ ] 커버리지 리포트 생성 설정
- [ ] GitHub Actions CI — PR 시 자동 실행
- [ ] GitHub Actions CD — main 머지 시 자동 배포

### 아이디어 (10점)
- [ ] 기존 서비스 차별화 비교표 (`docs/prd.md` 섹션 1-2)
- [ ] "2분 안에 전세사기 위험도 진단" 핵심 가치 명시

### 배포 보너스 (+10점)
- [ ] Vercel 프론트 URL 제출
- [ ] Railway 백엔드 URL 제출

---

## 참조 문서

| 파일 | 용도 |
|------|------|
| `docs/prd.md` | 기능 명세, 비즈니스 로직, 출력 스펙 |
| `CLAUDE.md` | 코드 규칙, 데이터 모델, 테스트 원칙 |
| `docs/domain-synthesis.md` | 아키텍처 다이어그램, 공유 유틸리티 함수 |
| `docs/domain-research-policy-loan.md` | 대출 상품 자격 조건 테이블, 계산 예시 |
| `docs/domain-research.md` | 전세 사기 스코어링 로직 상세 |
| `해커톤_참가_전략_명세서.md` | 평가 기준 분석, 점수 전략 |
