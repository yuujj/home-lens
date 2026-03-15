# HomeLens 🏠

> AI 기반 전세 안전 진단 서비스 — 전세사기 위험도 · 시세분석 · 정책대출 매칭

[![CI](https://github.com/yuujj/home-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/yuujj/home-lens/actions/workflows/ci.yml)

## 서비스 URL
- **프론트엔드**: https://home-lens.vercel.app
- **API 문서**: https://home-lens-api.up.railway.app/docs

## 핵심 기능

| 기능 | 설명 |
|------|------|
| **AI 등기부 분석** | 등기부등본 텍스트 → Claude AI 자동 해석 → 위험도 점수(0~100) + 위험 플래그 |
| **전세가율 진단** | 주소 입력 → 공공 실거래가(RTMS) → 5단계 등급(안전/양호/주의/위험/매우위험) |
| **정책 대출 매칭** | 소득·나이 입력 → 버팀목·디딤돌·보금자리론 7개 상품 자격·한도·금리 즉시 제시 |

## 아키텍처

```
사용자 브라우저
    │
    ▼
Next.js 15 (Vercel)
    │  NEXT_PUBLIC_BACKEND_URL
    ▼
FastAPI (Railway)
    ├── routers/       ← HTTP 요청·응답
    ├── services/      ← 비즈니스 로직
    │   ├── market_service.py   (전세가율 계산)
    │   ├── fraud_service.py    (사기 스코어링)
    │   └── loan_service.py     (정책 대출 자격)
    └── clients/       ← 외부 API 추상화
        ├── juso_client.py      (도로명주소 API)
        ├── rtms_client.py      (RTMS 실거래가)
        └── claude_client.py    (Anthropic AI)
```

## 로컬 실행

### 백엔드

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
copy .env.example .env    # API 키 입력
uvicorn main:app --reload
```

### 프론트엔드

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

### 환경변수 설정

`backend/.env.example`과 `frontend/.env.example`을 복사하여 사용합니다.

**백엔드 필수 변수**

| 변수 | 설명 | 발급처 |
|------|------|--------|
| `ANTHROPIC_API_KEY` | Claude AI API 키 (등기부 분석) | [console.anthropic.com](https://console.anthropic.com/) |
| `DATA_GO_KR_API_KEY` | 공공데이터포털 인증키 (RTMS 실거래가) | [data.go.kr](https://www.data.go.kr/) |
| `JUSO_API_KEY` | 도로명주소 API 인증키 | [juso.go.kr](https://www.juso.go.kr/) |

**프론트엔드 필수 변수**

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_BACKEND_URL` | 백엔드 API URL (로컬: `http://localhost:8000`) |

> 선택 변수 및 서비스 설정은 각 `.env.example` 파일의 주석을 참고하세요.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 15 · TypeScript · TailwindCSS v4 |
| 백엔드 | FastAPI · Pydantic v2 · httpx · anthropic SDK |
| AI | Claude claude-haiku-4-5 (등기부 분석) |
| 배포 | Vercel (프론트) · Railway (백엔드) |
| CI | GitHub Actions (lint + test on PR) |
| 테스트 | pytest 23개 (백엔드) · Vitest 3개 (프론트) |

## 테스트 실행

```bash
# 백엔드 (가상환경 활성화 후)
cd backend
pytest tests/ -v --cov=services --cov=clients

# 프론트엔드
cd frontend
npx tsc --noEmit && npm run lint
```

## 면책 고지

본 서비스는 참고용 정보 제공을 목적으로 하며, 법적·금융 자문이 아닙니다.
실제 계약 전 전문가 상담 및 공문서 직접 확인을 권장합니다.
정책 대출 조건은 국토교통부 고시 기준(nhuf.molit.go.kr)을 반드시 확인하세요.
