# Sprint 3 — F002 AI 등기부 분석 + 전세 사기 스코어링

**기간**: 2026-03-15 ~ 2026-03-16
**담당 에이전트**: Alex (백엔드) → Chris·Sam 병렬
**목표**: 등기부등본 텍스트 붙여넣기 → Claude AI 해석 → 위험도 점수 + 플래그 표시

---

## 목표 요약

| 항목 | 내용 |
|------|------|
| 핵심 기능 | `POST /api/registry/parse` + `POST /api/fraud/score` 동작 |
| UI | 위험도 점수 게이지 + 위험 플래그 목록 + 체크리스트 |
| 테스트 | Claude API mock, 스코어 조합 단위 테스트 통과 |
| 커밋 목표 | Sprint 누적 25개 이상 |

---

## 1. Alex — 백엔드 등기부 분석 + 스코어링

### 1-1. 신규 파일

```
backend/
├── clients/
│   └── claude_client.py       ← Anthropic SDK 래퍼
├── services/
│   ├── registry_service.py    ← 등기부 파싱 로직
│   └── fraud_service.py       ← 스코어링 비즈니스 로직
└── routers/
    └── fraud.py               ← POST /api/registry/parse, /api/fraud/score
```

### 1-2. `clients/claude_client.py`

```python
# [API 기준] Anthropic SDK — claude-sonnet-4-6 모델
# tool_use 방식으로 구조화 JSON 출력 강제
# 토큰 비용 최소화: 갑구(소유권)·을구(저당권) 섹션 분리 파싱

import anthropic
from core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

REGISTRY_PARSE_TOOL = {
    "name": "parse_registry",
    "description": "등기부등본 텍스트에서 위험 정보를 추출한다",
    "input_schema": {
        "type": "object",
        "properties": {
            "senior_mortgage_amount": {"type": "integer", "description": "선순위 근저당 채권최고액 합계 (만원)"},
            "has_attachment": {"type": "boolean", "description": "가압류 존재 여부"},
            "has_provisional_attachment": {"type": "boolean", "description": "가처분 존재 여부"},
            "has_auction": {"type": "boolean", "description": "경매개시결정 여부"},
            "has_trust": {"type": "boolean", "description": "신탁등기 여부"},
            "has_lease_registration": {"type": "boolean", "description": "임차권등기 여부"},
            "has_seizure": {"type": "boolean", "description": "압류 여부"},
            "has_provisional_registration": {"type": "boolean", "description": "가등기 여부"},
            "owner_acquired_recently": {"type": "boolean", "description": "최근 6개월 내 소유권 취득 여부"},
            "is_corporate_owner": {"type": "boolean", "description": "법인 소유 여부"},
        },
        "required": ["senior_mortgage_amount", "has_attachment", "has_auction", "has_trust", "has_lease_registration"]
    }
}

async def parse_registry_text(registry_text: str) -> dict:
    """
    등기부등본 원문 → 구조화 dict 반환
    실패 시 기본값 dict 반환 (예외 전파 금지)
    프롬프트에 면책 문구 포함: "AI 해석은 참고용이며 전문가 확인이 필요합니다"
    """
```

### 1-3. `services/registry_service.py`

```python
async def parse_registry(registry_text: str) -> dict:
    """
    Claude API 호출 → 등기부 구조화 데이터 반환
    입력 텍스트 전처리 (공백 정규화, 최대 토큰 제한 대비 truncation)
    """
```

### 1-4. `services/fraud_service.py` (핵심)

**스코어링 로직**

```python
# [정책 기준] 전세 사기 위험도 스코어링 — domain-research.md 기반
# 총점 0~100, 높을수록 위험

def calc_jeonse_ratio_score(jeonse_ratio: float) -> int:
    """
    전세가율 점수 (0~30)
    ~60%: 0점 / 60~70%: 10점 / 70~80%: 20점 / 80%↑: 30점
    """

def calc_mortgage_ratio_score(
    trade_price: int,
    jeonse_price: int,
    senior_mortgage: int
) -> int:
    """
    근저당비율 점수 (0~30)
    실효비율 = (근저당채권최고액 + 전세금) / 매매가
    ~70%: 0점 / 70~80%: 15점 / 80%↑: 30점
    """

def calc_registry_keyword_score(registry_data: dict) -> tuple[int, list[str]]:
    """
    등기 위험키워드 점수 (0~20) + 플래그 목록 반환
    가압류: +10 / 가처분·경매: +20 / 신탁: +10
    임차권등기: +15 / 압류: +15 / 가등기: +8
    최대 20점 cap
    """

def calc_landlord_score(registry_data: dict) -> tuple[int, list[str]]:
    """
    임대인 신뢰도 점수 (0~20) + 플래그 목록 반환
    최근 6개월 취득: +5 / 법인 소유: +5
    (체납 이력: +10 → 사용자가 직접 확인해야 하므로 체크리스트 항목으로 안내)
    """

def grade_fraud_score(score: int) -> str:
    """
    0~30: "안전"
    31~50: "주의"
    51~70: "위험"
    71~100: "매우 위험"
    """

def generate_checklist(registry_data: dict, fraud_score: int) -> list[dict]:
    """
    미완료 체크리스트 자동 생성
    항목 예시:
    - {"item": "납세증명서(국세) 요청", "completed": False, "priority": "필수"}
    - {"item": "전입세대 확인서 열람", "completed": False, "priority": "필수"}
    - {"item": "전세보증금반환보증 가입 가능 여부 확인", "completed": False, "priority": "권장"}
    신탁 있으면: {"item": "신탁원부 열람 + 신탁회사 임대 동의서 확보", "priority": "필수"}
    """

async def calculate_fraud_score(
    property_info: PropertyInfo,
    registry_data: dict,
) -> dict:
    """
    메인 스코어링 함수
    1. 전세가율 점수 (market_trade_price 필요 → 없으면 0점 처리)
    2. 근저당비율 점수
    3. 등기 키워드 점수
    4. 임대인 신뢰도 점수
    5. 총점 합산 (100 cap)
    6. 등급 판정
    7. 플래그 목록 취합
    8. 체크리스트 생성
    """
```

### 1-5. `routers/fraud.py`

```python
class RegistryParseRequest(BaseModel):
    registry_text: str      # 등기부등본 원문 텍스트

class FraudScoreRequest(BaseModel):
    property_info: PropertyInfo
    registry_text: str

@router.post("/registry/parse")
async def parse_registry(req: RegistryParseRequest) -> ApiResponse[dict]:
    """등기부등본 텍스트 → Claude 해석 → 구조화 데이터"""

@router.post("/fraud/score")
async def score_fraud(req: FraudScoreRequest) -> ApiResponse[dict]:
    """등기부 파싱 + 스코어링 통합 실행"""
```

### 1-6. Alex 완료 기준
```bash
# 실제 등기부등본 텍스트로 테스트
curl -X POST http://localhost:8000/api/registry/parse \
  -d '{"registry_text": "... 등기부 텍스트 ..."}'
# → senior_mortgage_amount, has_attachment 등 반환 ✅

curl -X POST http://localhost:8000/api/fraud/score \
  -d '{"property_info": {...}, "registry_text": "..."}'
# → fraud_score(0~100), fraud_grade, fraud_flags, checklist_items 반환 ✅
```

---

## 2. Chris — 스코어링 테스트

### 2-1. Fixture 파일 추가
```
backend/tests/fixtures/
└── claude_registry_response.json   ← Claude API tool_use 응답 샘플
```

```json
// claude_registry_response.json
{
  "senior_mortgage_amount": 12000,
  "has_attachment": false,
  "has_provisional_attachment": false,
  "has_auction": false,
  "has_trust": false,
  "has_lease_registration": false,
  "has_seizure": false,
  "has_provisional_registration": false,
  "owner_acquired_recently": false,
  "is_corporate_owner": false
}
```

### 2-2. 우선 구현 테스트 — `test_calc_fraud.py`

```python
# 테스트 1: 전세가율 점수 경계값
def test_calc_jeonse_ratio_score():
    assert calc_jeonse_ratio_score(59.9) == 0    # 안전
    assert calc_jeonse_ratio_score(60.0) == 10   # 주의 시작
    assert calc_jeonse_ratio_score(70.0) == 20   # 위험 시작
    assert calc_jeonse_ratio_score(80.0) == 30   # 매우위험

# 테스트 2: 근저당비율 점수
def test_calc_mortgage_ratio_score():
    # 매매가 10000, 전세 5000, 근저당 1000 → 실효비율 60% → 0점
    assert calc_mortgage_ratio_score(10000, 5000, 1000) == 0
    # 실효비율 75% → 15점
    assert calc_mortgage_ratio_score(10000, 5000, 2500) == 15
    # 실효비율 85% → 30점
    assert calc_mortgage_ratio_score(10000, 5000, 4000) == 30

# 테스트 3: 등기 키워드 점수 조합
def test_calc_registry_keyword_score():
    # 가압류만 있는 경우
    data = {"has_attachment": True, "has_auction": False, "has_trust": False,
            "has_lease_registration": False, "has_seizure": False, "has_provisional_registration": False}
    score, flags = calc_registry_keyword_score(data)
    assert score == 10
    assert "가압류" in flags[0]

    # 경매 있는 경우 (최대 20점 cap)
    data["has_auction"] = True
    data["has_trust"] = True
    score, flags = calc_registry_keyword_score(data)
    assert score == 20  # cap

# 테스트 4: 전체 스코어 통합 (fixture 기반)
@pytest.mark.asyncio
async def test_calculate_fraud_score_safe(monkeypatch, mock_claude_response):
    monkeypatch.setattr(claude_client, "parse_registry_text", AsyncMock(return_value=mock_claude_response))
    result = await calculate_fraud_score(mock_property_info, mock_claude_response)
    assert 0 <= result["fraud_score"] <= 100
    assert result["fraud_grade"] in ["안전", "주의", "위험", "매우 위험"]

# 테스트 5: 경계 케이스 — 0점 (완전 안전)
def test_fraud_score_zero():
    # 전세가율 50%, 근저당 없음, 위험 키워드 없음
    score = calc_jeonse_ratio_score(50.0) + calc_mortgage_ratio_score(10000, 5000, 0)
    assert score == 0

# 테스트 6: 등급 판정
def test_grade_fraud_score():
    assert grade_fraud_score(30) == "안전"
    assert grade_fraud_score(31) == "주의"
    assert grade_fraud_score(51) == "위험"
    assert grade_fraud_score(71) == "매우 위험"
    assert grade_fraud_score(100) == "매우 위험"
```

### 2-3. Chris 완료 기준
```bash
pytest tests/test_calc_fraud.py -v  # → 6 passed ✅
# Claude API 실제 호출 없음 확인 (mock만 사용)
```

---

## 3. Sam — 위험도 UI

### 3-1. 신규 컴포넌트

```
frontend/src/components/
├── RegistryTextInput.tsx    ← 등기부 텍스트 입력 영역
├── FraudScoreGauge.tsx      ← 위험도 점수 게이지 (0~100)
├── FraudFlagList.tsx        ← 위험 플래그 목록
└── ChecklistPanel.tsx       ← 미완료 체크리스트
```

### 3-2. `RegistryTextInput.tsx`
```typescript
interface Props {
  onSubmit: (text: string) => void
  isLoading: boolean
}
// textarea (붙여넣기용, 최소 높이 200px)
// 입력 가이드: "인터넷등기소(iros.go.kr)에서 등기부등본 전체 내용을 복사하여 붙여넣으세요"
// 글자수 표시
```

### 3-3. `FraudScoreGauge.tsx`
```typescript
interface Props {
  score: number       // 0~100
  grade: FraudGrade   // "안전" | "주의" | "위험" | "매우 위험"
}
// 점수 게이지 + 등급 텍스트 + 색상 (색맹 대응: 텍스트 병행)
// 0~30: 초록 / 31~50: 노랑 / 51~70: 주황 / 71~100: 빨강
```

### 3-4. `ChecklistPanel.tsx`
```typescript
interface ChecklistItem {
  item: string
  completed: boolean
  priority: "필수" | "권장"
}
interface Props {
  items: ChecklistItem[]
}
// 미완료 항목 하이라이트 (빨간 배지)
// 우선순위별 정렬 (필수 먼저)
```

### 3-5. `app/result/page.tsx` 업데이트
- 탭 2 추가: "사기 위험도" — FraudScoreGauge + FraudFlagList + ChecklistPanel
- RegistryTextInput → 분석 → 탭 2 결과 표시 흐름 연결

### 3-6. `lib/api.ts` 업데이트
```typescript
export async function parseRegistry(registryText: string): Promise<RegistryParseResponse>
export async function scoreFraud(data: FraudScoreRequest): Promise<FraudScoreResponse>
```

### 3-7. Sam 완료 기준
```bash
# 실제 등기부 텍스트 붙여넣기 → 위험도 점수 + 플래그 표시 ✅
npm run lint && npx tsc --noEmit  # → 0 errors ✅
```

---

## 4. Jordan — Sprint 3 커밋 계획 (7개)

| # | 커밋 메시지 |
|---|------------|
| 16 | `feat: Claude API 클라이언트 구현 (등기부 파싱 tool_use)` |
| 17 | `feat: 등기부 파싱 서비스 구현` |
| 18 | `feat: 전세 사기 스코어링 서비스 구현 (4개 점수 항목)` |
| 19 | `feat: POST /api/registry/parse, /api/fraud/score 라우터 구현` |
| 20 | `test: Claude API fixture 및 스코어링 단위 테스트 6개 추가` |
| 21 | `feat: 등기부 텍스트 입력 및 위험도 게이지 UI 구현` |
| 22 | `feat: 체크리스트 패널 및 위험 플래그 목록 UI 구현` |

---

## 5. Sprint 3 완료 기준 체크리스트

- [ ] `POST /api/registry/parse` — 텍스트 입력 → 구조화 데이터 반환
- [ ] `POST /api/fraud/score` — 위험도 점수(0~100) + 등급 + 플래그 반환
- [ ] 가압류·신탁 키워드 탐지 > 80% (fixture 기반 검증)
- [ ] `pytest tests/test_calc_fraud.py` → 6 passed (Claude API 실제 미호출)
- [ ] 위험도 게이지 UI 4단계 색상 + 텍스트 등급 병행
- [ ] 체크리스트 미완료 항목 하이라이트 표시
- [ ] Sprint 누적 커밋 25개 이상
