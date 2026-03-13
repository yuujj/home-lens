# Sprint 2 — F001 시세 분석 구현

**기간**: 2026-03-14 ~ 2026-03-15
**담당 에이전트**: Alex (백엔드) → Chris·Sam 병렬
**목표**: 실제 주소 입력 → RTMS 시세 조회 → 전세가율 등급 표시 동작

---

## 목표 요약

| 항목 | 내용 |
|------|------|
| 핵심 기능 | `POST /api/address/normalize` + `POST /api/market/analyze` 동작 |
| UI | 전세가율 게이지 + 5단계 등급 표시 |
| 테스트 | 외부 API 미호출, fixture 기반 전세가율 단위 테스트 통과 |
| 커밋 목표 | Sprint 누적 20개 이상 |

---

## 1. Alex — 백엔드 시세 분석

### 1-1. 신규 파일

```
backend/
├── clients/
│   ├── juso_client.py       ← 도로명주소 API
│   └── rtms_client.py       ← RTMS 실거래가 API
├── services/
│   └── market_service.py    ← 시세 분석 비즈니스 로직
└── routers/
    ├── address.py            ← POST /api/address/normalize
    └── market.py             ← POST /api/market/analyze
```

### 1-2. `clients/juso_client.py`

**API 스펙**
```
# [API 기준] 도로명주소 개발자센터 (juso.go.kr) — 2025년 기준
# 응답 형식 변경 시 이 파일 수정 필요
GET https://business.juso.go.kr/addrlink/addrLinkApi.do
  파라미터: currentPage=1, countPerPage=1, keyword={주소}, confmKey={JUSO_API_KEY}, resultType=json
```

**구현 함수**
```python
async def search_address(keyword: str) -> dict | None:
    """
    주소 검색 → 첫 번째 결과 반환
    실패 시 None 반환 (예외 전파 금지)
    반환 필드: roadAddr, jibunAddr, admCd(법정동코드 10자리), siNm, sggNm, emdNm
    """

def extract_lawd_cd_5(adm_cd_10: str) -> str:
    """법정동코드 10자리 → 앞 5자리 추출 (RTMS API용)"""
    return adm_cd_10[:5]

def classify_metropolitan(sido: str) -> bool:
    """수도권 여부 판단"""
    METROPOLITAN = ["서울특별시", "경기도", "인천광역시"]
    return sido in METROPOLITAN
```

### 1-3. `clients/rtms_client.py`

**API 스펙**
```
# [API 기준] 국토부 실거래가 공개시스템 (RTMS) — 2025년 공공데이터포털 기준
# 아파트 매매: getRTMSDataSvcAptTradeDev
# 아파트 전세: getRTMSDataSvcAptRent
# 빌라(연립/다세대) 매매: getRTMSDataSvcRHTradeDev
# 빌라 전세: getRTMSDataSvcRHRent
# 단독/다가구 매매: getRTMSDataSvcSHTradeDev
# 오피스텔 매매: getRTMSDataSvcOffiTradeDev
BASE_URL = "http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc"
파라미터: LAWD_CD(5자리), DEAL_YMD(YYYYMM), serviceKey
```

**구현 함수**
```python
async def get_trade_prices(lawd_cd: str, deal_ymd: str, housing_type: str) -> list[dict]:
    """
    매매 실거래가 조회
    housing_type: "apt" | "rh" | "sh" | "offi"
    반환: 거래 목록 (빈 리스트 가능)
    실패 시 빈 리스트 반환 (예외 전파 금지)
    """

async def get_rent_prices(lawd_cd: str, deal_ymd: str, housing_type: str) -> list[dict]:
    """전세 실거래가 조회 — get_trade_prices와 동일 구조"""

def parse_rtms_price(price_str: str) -> int:
    """
    # RTMS API 가격 필드: "  85,000" 형식 (공백+쉼표)
    # → 정수 85000 (만원 단위)
    return int(price_str.strip().replace(",", "").replace(" ", ""))
    """
```

### 1-4. `services/market_service.py`

**비즈니스 로직 (핵심)**

```python
# 유사 면적 필터
AREA_TOLERANCE = 0.10  # ±10%

def filter_similar_area(items: list[dict], target_m2: float) -> list[dict]:
    """전용면적 ±10% 이내 항목만 반환, 해제 건(해제여부='Y') 제거"""

def calc_median_price(prices: list[int]) -> int:
    """중간값 계산"""

def calc_weighted_average(prices: list[int]) -> int:
    """가중평균 (거래량 가중)"""

def determine_market_price(items: list[dict], target_m2: float) -> tuple[int | None, str]:
    """
    대표 시세 산출 + 신뢰도 반환
    - 10건↑: median → confidence="high"
    - 1~9건: 가중평균 → confidence="medium" + warnings 추가
    - 0건: None → confidence="none" (공시가격 fallback은 별도)
    """

def calc_jeonse_ratio(trade_price: int, jeonse_price: int) -> float:
    """전세가율 = 전세가 / 매매가 × 100, 소수점 1자리"""
    return round(jeonse_price / trade_price * 100, 1)

def grade_jeonse_ratio(ratio: float) -> str:
    """
    ~60%: "안전"
    60~70%: "양호"
    70~80%: "주의"
    80~90%: "위험"
    90%↑: "매우 위험"
    """

async def analyze_market(
    address: Address,
    housing_type: str,
    exclusive_area_m2: float,
    listed_jeonse_price: int,
) -> dict:
    """
    시세 분석 메인 함수
    1. 캐시 확인 (market_cache_key 사용)
    2. 최근 6개월 RTMS 조회 (매매 + 전세)
    3. 유사 면적 필터 + 대표값 산출
    4. 전세가율 + 등급 계산
    5. 빌라(rh) → warnings에 "시세 불투명 주의" 추가
    6. 다가구(sh) → warnings에 "선순위 임차인 합산 필요" 추가
    7. 캐시 저장 후 반환
    """
```

### 1-5. `routers/address.py`
```python
class AddressNormalizeRequest(BaseModel):
    raw_address: str

@router.post("/address/normalize")
async def normalize_address(req: AddressNormalizeRequest) -> ApiResponse[Address]:
    """도로명주소 API 호출 → Address 모델 반환"""
```

### 1-6. `routers/market.py`
```python
class MarketAnalyzeRequest(BaseModel):
    raw_address: str
    housing_type: str       # "apt" | "rh" | "sh" | "offi"
    exclusive_area_m2: float
    listed_jeonse_price: int

@router.post("/market/analyze")
async def analyze_market_endpoint(req: MarketAnalyzeRequest) -> ApiResponse[dict]:
    """시세 분석 — 주소 정규화 → RTMS 조회 → 전세가율 계산"""
```

### 1-7. Alex 완료 기준
```bash
# 실제 API 키 설정 후 로컬 테스트
curl -X POST http://localhost:8000/api/address/normalize \
  -H "Content-Type: application/json" \
  -d '{"raw_address": "서울시 강남구 역삼동 123"}'
# → Address 객체 반환 ✅

curl -X POST http://localhost:8000/api/market/analyze \
  -H "Content-Type: application/json" \
  -d '{"raw_address": "...", "housing_type": "apt", "exclusive_area_m2": 84.99, "listed_jeonse_price": 50000}'
# → jeonse_ratio, jeonse_grade 반환 ✅
```

---

## 2. Chris — 시세 분석 테스트

Alex 완료 직후 병렬 진행.

### 2-1. Fixture 파일 생성
```
backend/tests/fixtures/
├── rtms_apt_trade.json      ← 아파트 매매 API 응답 샘플
├── rtms_apt_rent.json       ← 아파트 전세 API 응답 샘플
└── juso_response.json       ← 도로명주소 API 응답 샘플
```

**fixture 형식 (실제 RTMS API 응답과 동일)**
```json
// rtms_apt_trade.json
{
  "response": {
    "body": {
      "items": {
        "item": [
          {
            "거래금액": " 85,000",
            "전용면적": "84.99",
            "해제여부": "",
            "년": "2025",
            "월": "1",
            "일": "15"
          }
        ]
      },
      "totalCount": 1
    }
  }
}
```

### 2-2. conftest.py 업데이트
```python
import json, pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_rtms_trade_response():
    with open("tests/fixtures/rtms_apt_trade.json") as f:
        return json.load(f)

@pytest.fixture
def mock_rtms_rent_response():
    with open("tests/fixtures/rtms_apt_rent.json") as f:
        return json.load(f)
```

### 2-3. 우선 구현 테스트 — `test_calc_market.py`

```python
# 테스트 1: 전세가율 계산 경계값
def test_calc_jeonse_ratio_boundary():
    assert calc_jeonse_ratio(10000, 6000) == 60.0   # 안전 경계
    assert calc_jeonse_ratio(10000, 7000) == 70.0   # 양호→주의
    assert calc_jeonse_ratio(10000, 8000) == 80.0   # 주의→위험
    assert calc_jeonse_ratio(10000, 9000) == 90.0   # 위험→매우위험

# 테스트 2: 전세가율 등급 판정
def test_grade_jeonse_ratio():
    assert grade_jeonse_ratio(59.9) == "안전"
    assert grade_jeonse_ratio(65.0) == "양호"
    assert grade_jeonse_ratio(75.0) == "주의"
    assert grade_jeonse_ratio(85.0) == "위험"
    assert grade_jeonse_ratio(90.1) == "매우 위험"

# 테스트 3: RTMS 가격 파싱
def test_parse_rtms_price():
    assert parse_rtms_price("  85,000") == 85000
    assert parse_rtms_price("130,000") == 130000
    assert parse_rtms_price(" 5,500") == 5500

# 테스트 4: 유사 면적 필터
def test_filter_similar_area():
    items = [
        {"전용면적": "84.99"},   # 타겟: 84.99 → 포함
        {"전용면적": "59.99"},   # 차이 30% → 제외
        {"전용면적": "90.00"},   # 차이 6% → 포함
        {"전용면적": "84.99", "해제여부": "Y"},  # 해제 → 제외
    ]
    result = filter_similar_area(items, 84.99)
    assert len(result) == 2

# 테스트 5: 시세 분석 서비스 (fixture 기반)
@pytest.mark.asyncio
async def test_market_service_with_fixture(monkeypatch, mock_rtms_trade_response, mock_rtms_rent_response):
    monkeypatch.setattr(rtms_client, "get_trade_prices", AsyncMock(return_value=mock_rtms_trade_response))
    monkeypatch.setattr(rtms_client, "get_rent_prices", AsyncMock(return_value=mock_rtms_rent_response))
    # 실제 API 미호출 검증
    result = await market_service.analyze_market(mock_address, "apt", 84.99, 50000)
    assert result["jeonse_ratio"] is not None
    assert result["jeonse_grade"] in ["안전", "양호", "주의", "위험", "매우 위험"]
```

### 2-4. Chris 완료 기준
```bash
pytest tests/test_calc_market.py -v  # → 5 passed ✅
pytest --cov=services --cov-report=term  # → services 커버리지 확인
```

---

## 3. Sam — 시세 분석 UI

Alex 완료 직후 Chris와 병렬 진행.

### 3-1. 신규 컴포넌트

```
frontend/src/components/
├── JeonseRatioGauge.tsx     ← 전세가율 게이지 + 등급 배지
├── MarketPriceCard.tsx      ← 추정 매매가 / 전세가 표시
├── ConfidenceBadge.tsx      ← 데이터 신뢰도 배지
└── LoadingSpinner.tsx       ← 로딩 상태
```

### 3-2. `JeonseRatioGauge.tsx`
```typescript
interface Props {
  ratio: number           // 전세가율 (%)
  grade: JeonseGrade      // "안전" | "양호" | "주의" | "위험" | "매우 위험"
}

// 색상 매핑 (색상 + 텍스트 병행 표시 필수 — 색맹 대응)
const GRADE_COLOR: Record<JeonseGrade, string> = {
  "안전": "bg-green-500",
  "양호": "bg-lime-400",
  "주의": "bg-yellow-400",
  "위험": "bg-orange-500",
  "매우 위험": "bg-red-600",
}
```

### 3-3. `app/result/page.tsx` (신규)
```typescript
// 결과 대시보드 페이지 (탭 1만 구현 — 탭 2·3은 Sprint 3·4에서 추가)
// 탭 1: 시세 분석 — JeonseRatioGauge + MarketPriceCard + ConfidenceBadge
// DisclaimerBanner 하단 고정 필수
```

### 3-4. `lib/api.ts` 업데이트
```typescript
// analyzeMarket 함수 실제 구현
export async function analyzeMarket(data: MarketAnalyzeRequest): Promise<MarketAnalyzeResponse> {
  return apiFetch<MarketAnalyzeResponse>("/api/market/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}
```

### 3-5. Sam 완료 기준
```bash
npm run lint   # → 0 errors ✅
npx tsc --noEmit  # → 0 type errors ✅
# 실제 동작: 주소 입력 → 분석 → 결과 화면 전세가율 표시 ✅
```

---

## 4. Jordan — Sprint 2 커밋 계획 (7개)

| # | 커밋 메시지 |
|---|------------|
| 9 | `feat: 도로명주소 API 클라이언트 구현` |
| 10 | `feat: RTMS 실거래가 API 클라이언트 구현` |
| 11 | `feat: 시세 분석 서비스 로직 구현 (전세가율·등급·캐시)` |
| 12 | `feat: POST /api/address/normalize, /api/market/analyze 라우터 구현` |
| 13 | `test: RTMS fixture 생성 및 전세가율 단위 테스트 5개 추가` |
| 14 | `feat: 전세가율 게이지 UI 컴포넌트 구현` |
| 15 | `feat: 시세 분석 결과 화면 구현 (탭 1)` |

---

## 5. Sprint 2 완료 기준 체크리스트

- [ ] `POST /api/address/normalize` — 실제 주소 입력 → Address 반환
- [ ] `POST /api/market/analyze` — 5초 이내 jeonse_ratio + jeonse_grade 반환
- [ ] RTMS 거래 없는 경우 confidence="none" 처리 (앱 오류 없음)
- [ ] 빌라(rh) 입력 시 warnings에 "시세 불투명 주의" 포함
- [ ] `pytest tests/test_calc_market.py` → 5 passed (외부 API 호출 없음)
- [ ] 전세가율 게이지 UI 5단계 색상 + 텍스트 등급 병행 표시
- [ ] Sprint 누적 커밋 20개 이상
