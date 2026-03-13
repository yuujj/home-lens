# Sprint 5 — 테스트 완성 + 배포 + 문서 마무리

**기간**: 2026-03-16 오후
**담당 에이전트**: Chris (CI/CD) + Jordan (문서) + Alex·Sam (버그 수정)
**목표**: GitHub Actions CI + Vercel/Railway 배포 URL + 문서 완성 + 커밋 35개 달성

---

## 목표 요약

| 항목 | 내용 |
|------|------|
| CI | GitHub Actions lint + test 자동 실행 (PR 시) |
| CD | main 머지 시 Vercel + Railway 자동 배포 |
| 배포 URL | Vercel 프론트 + Railway 백엔드 접속 가능 |
| 커밋 목표 | 최종 35개 이상 |

---

## 1. Chris — GitHub Actions CI/CD

### 1-1. `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [dev, main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Python 환경 설정
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: 의존성 설치
        run: |
          cd backend
          pip install -r requirements.txt

      - name: ruff 린트 검사
        run: |
          cd backend
          ruff check .

      - name: pytest 실행 (외부 API 미호출)
        run: |
          cd backend
          pytest tests/ -v --cov=services --cov=routers --cov-report=term-missing
        # 환경변수 없이도 완전 통과해야 함 (fixture 기반)

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Node.js 환경 설정
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: 의존성 설치
        run: |
          cd frontend
          npm ci

      - name: ESLint 검사
        run: |
          cd frontend
          npm run lint

      - name: TypeScript 타입 검사
        run: |
          cd frontend
          npx tsc --noEmit

      - name: vitest 실행
        run: |
          cd frontend
          npm run test -- --run
```

### 1-2. `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Railway 자동 배포는 Railway GitHub 연동으로 처리
      # 이 job은 배포 상태 확인용
      - name: 백엔드 배포 확인
        run: echo "Railway 자동 배포 트리거됨"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Vercel 자동 배포는 Vercel GitHub 연동으로 처리
      - name: 프론트엔드 배포 확인
        run: echo "Vercel 자동 배포 트리거됨"
```

### 1-3. 커버리지 최종 확인

```bash
cd backend
pytest --cov=services --cov=routers --cov=clients --cov-report=html

# 목표:
# 계산 함수 (calc_*): 90%↑
# 서비스 로직 (services/): 70%↑
# 전체: 60%↑
```

### 1-4. Chris 완료 기준
```bash
# PR 생성 시 GitHub Actions 자동 실행 ✅
# backend: ruff 0 errors + pytest all passed ✅
# frontend: lint 0 errors + tsc 0 errors ✅
```

---

## 2. Alex·Sam — 배포 설정

### 2-1. Railway 백엔드 배포

**`backend/Procfile`** (Railway용)
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Railway 환경변수 설정 (대시보드에서)**
```
ANTHROPIC_API_KEY=실제값
DATA_GO_KR_API_KEY=실제값
JUSO_API_KEY=실제값
CORS_ORIGINS=https://home-lens.vercel.app
CLAUDE_MODEL=claude-sonnet-4-6
```

**배포 확인**
```bash
curl https://{railway-url}/api/health
# → {"status": "ok", "service": "이 집 괜찮아? API"} ✅
```

### 2-2. Vercel 프론트엔드 배포

**Vercel 환경변수 설정 (대시보드에서)**
```
NEXT_PUBLIC_BACKEND_URL=https://{railway-url}
```

**`next.config.ts` 배포 설정 확인**
```typescript
// CORS, 리다이렉트 등 필요 시 추가
```

**배포 확인**
```bash
# https://home-lens.vercel.app 접속 → 서비스 정상 렌더링 ✅
# 실제 주소 입력 → 시세 분석 결과 ✅
# 등기부 텍스트 → 위험도 분석 결과 ✅
```

### 2-3. `CLAUDE.md` 배포 URL 업데이트 (Jordan)
```markdown
## 프로덕션 URL (배포 완료 후 추가)
- 프론트엔드: https://home-lens.vercel.app
- 백엔드 API: https://{railway-url}
- API 문서: https://{railway-url}/docs
```

---

## 3. Jordan — 최종 문서 마무리

### 3-1. `README.md` 작성 (루트)

```markdown
# 이 집 괜찮아? 🏠

> AI 기반 전세 안전 진단 서비스 — 전세사기 위험도 · 시세분석 · 정책대출 매칭

[![CI](https://github.com/yuujj/home-lens/actions/workflows/ci.yml/badge.svg)]()

## 서비스 URL
- **프론트엔드**: https://home-lens.vercel.app
- **API 문서**: https://{railway-url}/docs

## 핵심 기능
1. **AI 등기부 분석** — 등기부등본 텍스트 → Claude AI 자동 해석 → 위험도 점수
2. **전세가율 진단** — 주소 입력 → 공공 실거래가 → 5단계 등급
3. **정책 대출 매칭** — 소득·나이 입력 → 7개 정책 대출 자격·한도·금리 즉시 제시

## 아키텍처
[텍스트 다이어그램 포함]

## 로컬 실행
### 백엔드
\`\`\`bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # API 키 입력
uvicorn main:app --reload
\`\`\`

### 프론트엔드
\`\`\`bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
\`\`\`

## 기술 스택
Next.js 15 · TypeScript · TailwindCSS · FastAPI · Pydantic v2 · Claude AI · Vercel · Railway

## 면책 고지
본 서비스는 참고용 정보 제공을 목적으로 하며, 법적·금융 자문이 아닙니다.
```

### 3-2. Sprint 문서 최종 업데이트

각 `docs/sprint/sprint-{N}.md`에 실제 완료 항목 체크:
- 완료된 항목 `- [x]` 로 업데이트
- 실제 발생한 이슈 + 해결 방법 기록
- 테스트 결과 (통과 수, 커버리지) 기록

### 3-3. 최종 커밋 이력 점검

```bash
git log --oneline | wc -l  # → 35개 이상 ✅
git log --oneline | head -20  # 커밋 메시지 형식 확인
```

커밋 메시지 형식 불일치 항목 있으면 수정 (rebase 금지 — 새 fix 커밋으로 처리).

---

## 4. Sprint 5 커밋 계획 (5개)

| # | 커밋 메시지 |
|---|------------|
| 28 | `test: GitHub Actions CI 워크플로우 구성 (lint + test 자동화)` |
| 29 | `deploy: Railway 백엔드 배포 설정 (Procfile, 환경변수)` |
| 30 | `deploy: Vercel 프론트엔드 배포 설정` |
| 31 | `docs: README.md 작성 (아키텍처 다이어그램, 스크린샷, 배포 URL)` |
| 32 | `docs: Sprint 1~5 진행 기록 완성, CLAUDE.md 배포 URL 업데이트` |

> Sprint 1~4에서 33~35번 추가 커밋이 발생할 경우 자연스럽게 35개 달성

---

## 5. 최종 제출 체크리스트

### 문서화 30점
- [ ] `docs/prd.md` — F001~F004 기능 명세 완성
- [ ] `CLAUDE.md` — 10개 섹션 + 배포 URL 포함
- [ ] `AGENTS.md` — 4명 에이전트 팀 구성 명세
- [ ] `README.md` — 아키텍처 다이어그램 + 배포 URL + 스크린샷
- [ ] `docs/sprint/sprint-{1~5}.md` — 실제 완료 항목 체크
- [ ] 커밋 35개 이상, `feat/fix/test/docs/deploy` 형식

### 기술 구현력 30점
- [ ] `routers/` → `services/` → `clients/` 3계층 분리
- [ ] TypeScript strict + Pydantic v2
- [ ] `ApiResponse[T]` 일관된 응답 구조
- [ ] 300줄/50줄 제한 준수

### 완성도 15점
- [ ] F001 시세 분석 실제 동작
- [ ] F002 등기부 AI 분석 실제 동작
- [ ] F003 정책 대출 자격 판단 실제 동작
- [ ] 모바일/데스크탑 반응형
- [ ] `DisclaimerBanner` 모든 결과 화면 하단

### 검증 15점
- [ ] `pytest` — 우선 테스트 5개 + 추가 테스트 통과
- [ ] services 커버리지 70%↑
- [ ] GitHub Actions CI — PR 시 자동 실행
- [ ] `ci.yml` + `deploy.yml` 워크플로우 존재

### 아이디어 10점
- [ ] `docs/prd.md` 기존 서비스 차별화 비교표
- [ ] "2분 안에 전세사기 위험도 진단" 핵심 가치

### 배포 보너스 +10점
- [ ] `https://home-lens.vercel.app` 접속 가능
- [ ] `https://{railway-url}/api/health` 200 응답
- [ ] 실제 주소로 E2E 전체 플로우 동작 확인
