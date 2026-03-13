# 한국 부동산 시세 분석 — 도메인 리서치

## Context

전세 사기 예방 체크리스트 앱의 핵심 기능인 **전세가율 자동 계산** 및 **시세 기반 위험도 판단**을 구현하기 위해 부동산 시세 데이터 소스, 공공 API 스펙, 시세 추정 로직을 체계적으로 정리한다.

---

## 1. 부동산 시세 데이터 소스 비교

### 1-1. 데이터 소스 종류 및 특징

| 소스 | 제공 기관 | 데이터 유형 | 갱신 주기 | 접근 방법 | 신뢰도 |
|------|----------|------------|---------|----------|--------|
| **실거래가 (RTMS)** | 국토교통부 | 실제 계약 신고가 | 거래 후 30일 이내 신고 | 공공데이터포털 API (무료) | ★★★★★ |
| **공동주택 공시가격** | 국토교통부/한국부동산원 | 공시 기준가 (매년 1월 1일) | 연 1회 (4월 공시) | 공공데이터포털 API (무료) | ★★★★☆ |
| **개별공시지가** | 국토교통부/시군구 | 토지 단위 공시가 | 연 1회 (5월 공시) | 공공데이터포털 API (무료) | ★★★★☆ |
| **KB시세** | KB국민은행 | 중개업소 호가 기반 시세 | 주 1회 | 비공개 (스크래핑/유료 서비스) | ★★★★☆ |
| **한국부동산원(R-ONE) 시세** | 한국부동산원 | 표본 조사 기반 지수 | 주 1회 / 월 1회 | R-ONE API (무료, 인증키 필요) | ★★★★☆ |
| **네이버부동산 호가** | 네이버 | 중개사 등록 매물 호가 | 실시간 | 비공개 | ★★★☆☆ |
| **부동산플래닛 AI 추정가** | 부동산플래닛 | AI 기반 추정가 | 실시간 | 유료 API | ★★★☆☆ |

### 1-2. 소스별 한계 및 적합 용도

| 소스 | 한계 | 적합 용도 |
|------|------|----------|
| 실거래가 | 신고까지 최대 30일 지연, 소형 빌라·단독은 거래량 희소 | 매매가/전세가 직접 산출 (아파트 최적) |
| 공동주택 공시가격 | 시세 대비 50~80% 수준 (현실화율 미도달), 연 1회 갱신 | 보증보험 가입 기준 확인, 시세 역산 fallback |
| 개별공시지가 | 건물가치 미포함(토지만), 현실화율 65~75% | 단독/다가구 토지가치 추정 |
| KB시세 | 공개 API 없음, 호가 기반 (실거래 아님) | 참고 시세 (직접 접근 불가) |
| R-ONE 시세 | 지수/등락률 중심, 개별 매물 시세 아님 | 지역별 트렌드·등락률 파악 |

---

## 2. 공공데이터포털 API 상세 스펙

### 2-1. 인증키 발급 방법

1. [공공데이터포털](https://www.data.go.kr) 회원가입
2. 원하는 API 검색 → [활용신청] 클릭 → 활용목적 기입 후 신청
3. 승인 소요 시간: 일반적으로 1~2시간 (일부 API 최대 24시간)
4. 마이페이지 → 인증키 확인 (Encoding/Decoding 두 가지 제공)
5. **계정 유형별 호출 제한**:
   - 개발계정: 일 1,000회
   - 운영계정: 일 1,000,000회 (1백만 회)

### 2-2. 아파트 매매 실거래가 API

**서비스명**: `getRTMSDataSvcAptTradeDev`
**데이터 ID**: 15126469

```
엔드포인트:
GET http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev
```

**요청 파라미터**:

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `serviceKey` | String | Y | 공공데이터포털 인증키 (URL 인코딩) | `abc123...` |
| `LAWD_CD` | String | Y | 법정동 코드 앞 5자리 (시군구 코드) | `11110` (서울 종로구) |
| `DEAL_YMD` | String | Y | 계약 연월 (YYYYMM) | `202401` |
| `pageNo` | Integer | N | 페이지 번호 (기본값: 1) | `1` |
| `numOfRows` | Integer | N | 한 페이지 결과 수 (기본값: 10, 최대: 9999) | `100` |

**응답 구조 (XML)**:

```xml
<response>
  <header>
    <resultCode>000</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <거래금액>  85,000</거래금액>       <!-- 만원 단위, 공백 포함 주의 -->
        <건축년도>2005</건축년도>
        <년>2024</년>
        <도로명>세종대로</도로명>
        <도로명건물본번호코드>00001</도로명건물본번호코드>
        <도로명건물부번호코드>00000</도로명건물부번호코드>
        <도로명시군구코드>11110</도로명시군구코드>
        <도로명일련번호코드>01</도로명일련번호코드>
        <도로명지상지하코드>0</도로명지상지하코드>
        <도로명코드>4100135</도로명코드>
        <동>XX동</동>
        <동코드>11110123</동코드>
        <등기일자>2024-02-15</등기일자>
        <아파트>XX아파트</아파트>
        <월>1</월>
        <일>15</일>
        <일련번호>11110-1234</일련번호>
        <전용면적>84.99</전용면적>          <!-- m² -->
        <지번>123</지번>
        <지역코드>11110</지역코드>
        <층>10</층>
        <해제사유발생일/>
        <해제여부>N</해제여부>
      </item>
    </items>
    <numOfRows>10</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>1203</totalCount>
  </body>
</response>
```

**주요 응답 필드 정리**:

| 필드명 | 설명 | 단위/형식 |
|--------|------|---------|
| `거래금액` | 실제 계약 금액 | 만원 (문자열, 공백·쉼표 포함) |
| `전용면적` | 전용 면적 | m² (소수점) |
| `층` | 해당 층 | 정수 |
| `건축년도` | 준공 연도 | 4자리 연도 |
| `아파트` | 단지명 | 문자열 |
| `해제여부` | 계약 해제 여부 | Y/N |
| `해제사유발생일` | 해제 일자 | YYYY-MM-DD |

> **구현 주의**: `거래금액` 필드는 `"  85,000"` 형태로 공백과 쉼표가 포함되어 있음. 파싱 시 반드시 strip + replace(',', '') 처리 필요.
> `해제여부 = 'Y'`인 건은 취소된 거래이므로 시세 계산에서 **반드시 제외**.

### 2-3. 아파트 전월세 실거래가 API

**서비스명**: `getRTMSDataSvcAptRent`
**데이터 ID**: 15126474

```
엔드포인트:
GET http://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent
```

**요청 파라미터**: 매매 API와 동일 (`LAWD_CD`, `DEAL_YMD`, `serviceKey`, `pageNo`, `numOfRows`)

**응답 추가 필드** (매매 대비 차이):

| 필드명 | 설명 |
|--------|------|
| `보증금액` | 전세/월세 보증금 (만원) |
| `월세금액` | 월세 금액 (만원, 전세=0) |
| `계약구분` | 신규/갱신 구분 |
| `계약기간` | 계약 기간 (예: 24~26) |
| `갱신요구권사용` | 계약갱신청구권 사용 여부 |

> **전세/월세 구분**: `월세금액 == 0` 이면 전세, `월세금액 > 0` 이면 월세

### 2-4. 연립다세대 실거래가 API

**매매**: `getRTMSDataSvcRHTradeDev`
```
GET http://apis.data.go.kr/1613000/RTMSDataSvcRHTradeDev/getRTMSDataSvcRHTradeDev
```

**전월세**: `getRTMSDataSvcRHRent`
```
GET http://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent
```

**아파트 API 대비 차이점**: 단지명 필드 없음, 법정동 주소 기반 필터링 필요

### 2-5. 단독/다가구 실거래가 API

**매매**: `getRTMSDataSvcSHTradeDev`
```
GET http://apis.data.go.kr/1613000/RTMSDataSvcSHTradeDev/getRTMSDataSvcSHTradeDev
```

**전월세**: `getRTMSDataSvcSHRent`
```
GET http://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent
```

**아파트 API 대비 차이점**: 대지면적·건물면적 제공, 전용면적 개념 불명확, 토지+건물 통합 거래가

### 2-6. 오피스텔 실거래가 API

**매매**: `getRTMSDataSvcOffiTrade`
```
GET http://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade
```

**전월세**: `getRTMSDataSvcOffiRent`
```
GET http://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent
```

### 2-7. 전체 API 목록 요약

| 주택 유형 | 거래 구분 | 서비스명 | 데이터 ID |
|----------|---------|---------|---------|
| 아파트 | 매매 | `getRTMSDataSvcAptTradeDev` | 15126469 |
| 아파트 | 전월세 | `getRTMSDataSvcAptRent` | 15126474 |
| 연립다세대 | 매매 | `getRTMSDataSvcRHTradeDev` | - |
| 연립다세대 | 전월세 | `getRTMSDataSvcRHRent` | - |
| 단독/다가구 | 매매 | `getRTMSDataSvcSHTradeDev` | - |
| 단독/다가구 | 전월세 | `getRTMSDataSvcSHRent` | - |
| 오피스텔 | 매매 | `getRTMSDataSvcOffiTrade` | - |
| 오피스텔 | 전월세 | `getRTMSDataSvcOffiRent` | - |

**기본 엔드포인트 베이스**: `http://apis.data.go.kr/1613000/{서비스명}/{서비스명}`

### 2-8. 공동주택 공시가격 API

**서비스명**: `getApartHousingPriceInfo` (한국부동산원 제공)

```
엔드포인트:
GET http://apis.data.go.kr/1611000/ApartHousingPriceInfoService/getApartHousingPriceInfo
```

**요청 파라미터**:

| 파라미터 | 필수 | 설명 | 예시 |
|---------|------|------|------|
| `serviceKey` | Y | 인증키 | - |
| `ldongCode` | Y | 법정동 코드 10자리 | `1111010100` |
| `stdrYear` | Y | 기준 연도 | `2024` |
| `pageNo` | N | 페이지 번호 | `1` |
| `numOfRows` | N | 결과 수 | `100` |

**응답 주요 필드**:

| 필드명 | 설명 |
|--------|------|
| `pblntfPc` | 공시가격 (원 단위) |
| `kaptNm` | 단지명 |
| `dongNm` | 동명 |
| `hoNm` | 호수 |
| `exclusiveArea` | 전용면적 (m²) |
| `stdrYear` | 공시기준연도 |

### 2-9. 법정동 코드 조회 API

```
엔드포인트:
GET http://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `serviceKey` | Y | 인증키 |
| `pageNo` | N | 페이지 번호 |
| `numOfRows` | N | 결과 수 |
| `type` | N | 응답 형식 (xml/json) |
| `locatadd_nm` | N | 지역명 검색어 (예: "서울특별시 종로구") |

### 2-10. 도로명주소 검색 API (주소 → 법정동 코드 변환)

```
엔드포인트:
GET https://business.juso.go.kr/addrlink/addrLinkApi.do
```

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `confmKey` | Y | 도로명주소 API 별도 인증키 (juso.go.kr 발급) |
| `currentPage` | Y | 현재 페이지 |
| `countPerPage` | Y | 페이지당 결과 수 |
| `keyword` | Y | 검색 주소 문자열 |
| `resultType` | N | json / xml |

**응답에서 추출 가능한 코드**:
- `admCd`: 행정동 코드 (10자리)
- `rnMgtSn`: 도로명 코드
- `bdMgtSn`: 건물 관리 번호

---

## 3. 시세 추정 로직

### 3-1. 실거래가 기반 현재 시세 추정

```
[기본 원칙]
1. 최근 6개월 거래 데이터 수집
2. 해제 건(해제여부='Y') 제거
3. 동일 면적 구간 필터링
4. 이상치 제거 후 중간값(median) 산출

[면적 구간 필터링 기준]
조회 대상 면적의 ±10% 범위 내 거래만 포함
예) 84m² 물건 → 75.6m² ~ 92.4m² 구간 거래 사용

[중간값 vs 평균값 선택 기준]
- 거래량 충분 (N >= 10): 중간값(median) 사용 → 극단치 영향 최소화
- 거래량 부족 (N < 10): 가중 평균 사용 (최근 거래일수록 높은 가중치)
- 거래량 없음 (N = 0): 공시가격 역산 fallback 적용
```

### 3-2. 면적 단위 환산 및 평당가 계산

```python
# m² → 평 환산
def sqm_to_pyeong(sqm: float) -> float:
    return sqm / 3.3058

# 평당 매매가 계산
def price_per_pyeong(total_price_manwon: int, area_sqm: float) -> float:
    pyeong = sqm_to_pyeong(area_sqm)
    return total_price_manwon / pyeong

# m²당 매매가 계산
def price_per_sqm(total_price_manwon: int, area_sqm: float) -> float:
    return total_price_manwon / area_sqm

# 예시
# 매매가 85,000만원, 전용면적 84.99m²
# → 84.99 / 3.3058 = 25.71평
# → 평당가 = 85,000 / 25.71 = 3,307만원/평
# → m²당가 = 85,000 / 84.99 = 1,000만원/m²
```

### 3-3. 유사 면적 단위환산 시세 추정

```
[동일 단지 내 다른 면적 추정]
대상 면적의 m²당 평균 시세 × 목표 면적 = 추정 시세

예시)
- 같은 단지 84m² 거래: 85,000만원 → m²당 1,000만원
- 59m² 추정 시세: 1,000 × 59 = 59,000만원

[주의]
면적이 크게 다르면(예: 40m² vs 120m²) m²당 단가가 다를 수 있음
→ 면적 구간을 소형(~60m²), 중형(60~85m²), 대형(85m²~)으로 분리해 각각의 m²당 단가 사용 권장
```

### 3-4. 거래 없을 때 Fallback: 공시가격 역산

```
[공동주택(아파트·연립·다세대) — 공동주택 공시가격 역산]
추정 매매 시세 = 공동주택 공시가격 ÷ 현실화율

현실화율 기준 (2026년, 4년 연속 동결 확정):
  - 공동주택 전체 평균: 69.0%
  - 단독주택: 53.6%
  → 추정 시세 = 공시가격 ÷ 0.690 (공동주택)
  → 추정 시세 = 공시가격 ÷ 0.536 (단독주택)

[예시]
공동주택 공시가격 2억 → 추정 시세 = 2억 ÷ 0.690 ≈ 2.9억
단독주택 공시가격 2억 → 추정 시세 = 2억 ÷ 0.536 ≈ 3.7억

> **2026.3 업데이트**: 공시가격 현실화율 4년 연속 동결 확정. 공동주택 69.0% (기존과 동일), 단독주택 53.6% (기존 약 54%에서 소폭 수정). 공동주택 분류 기준(아파트·연립·다세대)은 변동 없음.

[중요 한계]
- 현실화율은 매년 변경됨 (정책 결정 사항)
- 단순 역산은 오차 범위가 ±20~30% 이상일 수 있음
- 앱에서 반드시 "추정치" 임을 명시하고 면책 고지 필요
```

### 3-5. 전세가 추정 (전세 거래 없을 때)

```
[전세가율 지역 평균 활용]
추정 전세가 = 추정 매매가 × 지역 평균 전세가율

서울 평균 전세가율 (2023~2024 기준): 약 50~60%
경기도: 약 60~70%
지방 광역시: 약 65~75%
지방 소도시: 약 70~80%

[예시]
서울 아파트 매매 추정가 8억, 서울 평균 전세가율 55%
→ 추정 전세가 = 8억 × 0.55 = 4.4억

[주의] 이 방법은 개별 물건의 전세가를 추정하는 최후 수단이며,
실거래 전세가가 있으면 반드시 실거래가 우선 사용
```

---

## 4. 주택 유형별 데이터 특성 및 처리 방법

### 4-1. 아파트

| 항목 | 내용 |
|------|------|
| 데이터 풍부도 | ★★★★★ |
| 특징 | 단지(아파트명) + 동 + 전용면적으로 동일 물건 구분 가능 |
| 시세 추정 정확도 | 높음 (동일 단지·면적 거래 빈번) |
| API 필드 | `아파트`, `동`, `전용면적`, `층`, `건축년도` |
| 동일 물건 필터 조건 | `아파트명 = X AND 전용면적 ≈ Y (±10%)` |
| 한계 | 신축 단지는 거래 이력 없음 → 분양가 참고 |

### 4-2. 빌라/연립다세대

| 항목 | 내용 |
|------|------|
| 데이터 풍부도 | ★★☆☆☆ |
| 특징 | 건물명·단지 개념 약함, 지번 주소 기반 |
| 시세 추정 정확도 | 낮음 (동일 건물 거래 드묾) |
| API 필드 | `연립다세대`, `지번`, `전용면적`, `층` |
| 동일 물건 필터 조건 | `법정동 + 지번 + 전용면적 ≈ Y` 또는 `반경 500m 내 유사 면적` |
| 한계 | 시세 공백 빈번 → 공시가격 역산 fallback 필수 |
| 주의 | 전세 사기 고위험군 → 시세 불투명성 자체가 위험 신호로 표시 필요 |

**앱 구현 판단 로직**:
```
if 최근 12개월 동일 법정동 + 유사 면적 거래 >= 3건:
    실거래 평균 사용
elif 공동주택 공시가격 존재:
    공시가격 ÷ 0.69 (추정치 명시)
else:
    "시세 데이터 부족 — 직접 시세 조회 필요" 경고 출력
```

### 4-3. 단독/다가구

| 항목 | 내용 |
|------|------|
| 데이터 풍부도 | ★★☆☆☆ |
| 특징 | 토지+건물 통합 거래가, 대지면적·건물면적 별도 |
| 시세 추정 | 토지가치(개별공시지가 × 대지면적) + 건물가치(잔존가액) |
| API 필드 | `대지면적`, `건물면적`, `거래금액` |
| 한계 | 다가구는 일부 호실만 전세 → 건물 전체 매매가 ≠ 전세 담보 가치 |

**다가구 위험도 계산 특이사항**:
```
[다가구 전체 보증금 합산 필요]
단순 전세가율 = 내 보증금 / 매매가 는 오류

올바른 계산:
위험도 비율 = (선순위 채권 + 선순위 임차인 보증금 합계 + 내 보증금) / 매매가 × 100

→ 확정일자 부여현황에서 선순위 임차인 보증금 파악 필수
→ API로 자동화 불가 (직접 서류 확인 안내 필요)
```

### 4-4. 오피스텔

| 항목 | 내용 |
|------|------|
| 데이터 풍부도 | ★★★☆☆ |
| 특징 | 법적 업무시설이지만 주거용으로 사용 시 주임법 적용 |
| 주거용/업무용 구분 | 전입신고+실거주 여부로 구분, API에서 직접 구분 불가 |
| 시세 추정 | 오피스텔 전용 실거래 API 사용 (`getRTMSDataSvcOffiTrade`) |
| 한계 | 아파트보다 시세 변동성 크고 환금성 낮음 |
| 앱 처리 | 주거용 오피스텔은 주임법 적용 → 보증보험 가입 확인 필수 안내 |

---

## 5. 전세가율 자동 계산 파이프라인

### 5-1. 전체 플로우

```
[입력] 사용자 주소 입력
    ↓
[Step 1] 주소 → 법정동 코드 변환
    ↓
[Step 2] 주택 유형 판별
    ↓
[Step 3] 매매 실거래가 API 호출 (최근 6개월, 해당 법정동)
[Step 4] 전세 실거래가 API 호출 (최근 6개월, 해당 법정동)
    ↓
[Step 5] 유사 매물 필터링
    ↓
[Step 6] 매매가·전세가 대표값 산출
    ↓
[Step 7] 전세가율 계산
    ↓
[Step 8] 등급 판정 및 결과 출력
```

### 5-2. Step 1: 주소 → 법정동 코드 변환

```python
import requests

def get_lawd_cd(address: str, juso_api_key: str) -> dict:
    """
    도로명주소 API로 주소 검색 → 법정동 코드 추출
    반환: {'lawd_cd_5': '11110', 'lawd_cd_10': '1111010100', 'address': '...'}
    """
    url = "https://business.juso.go.kr/addrlink/addrLinkApi.do"
    params = {
        "confmKey": juso_api_key,
        "currentPage": 1,
        "countPerPage": 5,
        "keyword": address,
        "resultType": "json"
    }
    resp = requests.get(url, params=params)
    results = resp.json()["results"]["juso"]

    if not results:
        raise ValueError(f"주소를 찾을 수 없음: {address}")

    best = results[0]
    # admCd: 행정동 코드 10자리 (법정동 코드와 유사하나 다를 수 있음)
    # RTMS API는 법정동 코드 앞 5자리(시군구) 사용
    lawd_cd_10 = best.get("admCd", "")
    lawd_cd_5 = lawd_cd_10[:5]

    return {
        "lawd_cd_5": lawd_cd_5,   # RTMS API용
        "lawd_cd_10": lawd_cd_10, # 공시가격 API용
        "road_addr": best.get("roadAddr", ""),
        "jibun_addr": best.get("jibunAddr", "")
    }
```

### 5-3. Step 2: 주택 유형 판별 로직

```python
def detect_housing_type(address: str, building_info: dict = None) -> str:
    """
    주소 문자열 또는 건축물대장 정보에서 주택 유형 추론
    반환: 'apt' | 'rh' | 'sh' | 'offi'
    """
    addr_lower = address.lower()

    # 키워드 기반 1차 판별
    if any(k in address for k in ['아파트', 'APT', '래미안', '힐스테이트', '자이', 'e편한세상']):
        return 'apt'
    if any(k in address for k in ['오피스텔']):
        return 'offi'
    if any(k in address for k in ['빌라', '연립', '다세대']):
        return 'rh'
    if any(k in address for k in ['단독', '다가구']):
        return 'sh'

    # 건축물대장 주용도 기반 2차 판별 (API 호출 시)
    if building_info:
        mainPurpsCdNm = building_info.get('mainPurpsCdNm', '')
        if '아파트' in mainPurpsCdNm:
            return 'apt'
        elif '연립' in mainPurpsCdNm or '다세대' in mainPurpsCdNm:
            return 'rh'
        elif '단독' in mainPurpsCdNm or '다가구' in mainPurpsCdNm:
            return 'sh'
        elif '오피스텔' in mainPurpsCdNm:
            return 'offi'

    return 'unknown'
```

### 5-4. Step 3~4: 실거래가 API 호출

```python
import requests
from datetime import datetime, timedelta

API_TYPE_MAP = {
    'apt':  ('RTMSDataSvcAptTradeDev', 'getRTMSDataSvcAptTradeDev',
             'RTMSDataSvcAptRent',     'getRTMSDataSvcAptRent'),
    'rh':   ('RTMSDataSvcRHTradeDev',  'getRTMSDataSvcRHTradeDev',
             'RTMSDataSvcRHRent',      'getRTMSDataSvcRHRent'),
    'sh':   ('RTMSDataSvcSHTradeDev',  'getRTMSDataSvcSHTradeDev',
             'RTMSDataSvcSHRent',      'getRTMSDataSvcSHRent'),
    'offi': ('RTMSDataSvcOffiTrade',   'getRTMSDataSvcOffiTrade',
             'RTMSDataSvcOffiRent',    'getRTMSDataSvcOffiRent'),
}

BASE_URL = "http://apis.data.go.kr/1613000"

def fetch_transactions(lawd_cd: str, housing_type: str, service_key: str,
                       months: int = 6) -> dict:
    """
    최근 N개월 매매·전세 실거래 데이터 수집
    반환: {'trade': [...], 'rent': [...]}
    """
    trade_svc, trade_op, rent_svc, rent_op = API_TYPE_MAP[housing_type]

    # 최근 N개월 YYYYMM 목록 생성
    today = datetime.today()
    ym_list = []
    for i in range(months):
        dt = today - timedelta(days=30 * i)
        ym_list.append(dt.strftime('%Y%m'))

    trade_items, rent_items = [], []

    for ym in ym_list:
        for svc, op, container in [
            (trade_svc, trade_op, trade_items),
            (rent_svc,  rent_op,  rent_items)
        ]:
            url = f"{BASE_URL}/{svc}/{op}"
            params = {
                "serviceKey": service_key,
                "LAWD_CD": lawd_cd,
                "DEAL_YMD": ym,
                "numOfRows": 9999,
                "pageNo": 1
            }
            resp = requests.get(url, params=params, timeout=10)
            # XML 파싱 (xmltodict 등 사용)
            items = parse_xml_items(resp.text)
            container.extend(items)

    return {"trade": trade_items, "rent": rent_items}
```

### 5-5. Step 5: 유사 매물 필터링 로직

```python
def filter_similar(items: list, target_area: float,
                   area_tolerance: float = 0.10) -> list:
    """
    전용면적 ±10% 범위 필터링 + 해제 건 제거
    """
    low  = target_area * (1 - area_tolerance)
    high = target_area * (1 + area_tolerance)

    filtered = []
    for item in items:
        # 해제 건 제거
        if item.get('해제여부', 'N') == 'Y':
            continue
        area = float(item.get('전용면적', 0))
        if low <= area <= high:
            filtered.append(item)

    return filtered
```

### 5-6. Step 6~7: 대표값 산출 및 전세가율 계산

```python
import statistics

def parse_price(price_str: str) -> int:
    """'  85,000' → 85000 (만원)"""
    return int(price_str.strip().replace(',', ''))

def calc_representative_price(items: list, price_field: str) -> float | None:
    """중간값(median) 산출. 데이터 부족 시 None 반환"""
    prices = [parse_price(item[price_field]) for item in items
              if price_field in item]
    if not prices:
        return None
    if len(prices) >= 10:
        return statistics.median(prices)
    else:
        # 최신순 정렬 후 가중평균 (최근 3건 더 높은 가중치)
        prices_sorted = sorted(prices, reverse=True)
        if len(prices_sorted) >= 3:
            return (prices_sorted[0]*3 + prices_sorted[1]*2 + prices_sorted[2]) / 6
        return statistics.mean(prices)

def calc_jeonse_ratio(trade_price: float, rent_price: float) -> float:
    """전세가율 = 전세가 / 매매가 × 100"""
    if trade_price <= 0:
        raise ValueError("매매가가 0 이하")
    return (rent_price / trade_price) * 100
```

### 5-7. Step 8: 전세가율 등급 판정

```python
def grade_jeonse_ratio(ratio: float, has_mortgage: bool = False) -> dict:
    """
    전세가율 등급 판정
    has_mortgage: 선순위 근저당 존재 시 기준 강화
    """
    # 근저당 있을 때 기준 10%p 강화
    threshold_offset = -10 if has_mortgage else 0

    thresholds = [
        (60 + threshold_offset, '안전',    '초록', '보증금 회수 가능성 높음'),
        (70 + threshold_offset, '양호',    '연두', '일반적으로 안전한 수준'),
        (80 + threshold_offset, '주의',    '노랑', '시세 하락 시 손실 가능'),
        (90 + threshold_offset, '위험',    '주황', '깡통전세 가능성 높음'),
    ]

    for threshold, grade, color, msg in thresholds:
        if ratio <= threshold:
            return {"ratio": ratio, "grade": grade, "color": color, "message": msg}

    return {"ratio": ratio, "grade": "매우 위험", "color": "빨강",
            "message": "깡통전세 거의 확실 — 계약 강력 비권장"}
```

---

## 6. 지역별 시세 트렌드 분석

### 6-1. 시계열 데이터 구성 방법

```python
def build_price_timeseries(lawd_cd: str, housing_type: str,
                            service_key: str, months: int = 24) -> list:
    """
    최근 24개월 월별 평균 매매가 시계열 데이터 생성
    반환: [{'ym': '202401', 'avg_price': 85000, 'count': 12}, ...]
    """
    result = []
    today = datetime.today()

    for i in range(months):
        dt = today - timedelta(days=30 * i)
        ym = dt.strftime('%Y%m')
        items = fetch_single_month(lawd_cd, housing_type, service_key, ym)
        if items:
            prices = [parse_price(item['거래금액']) for item in items
                      if item.get('해제여부', 'N') == 'N']
            if prices:
                result.append({
                    'ym': ym,
                    'avg_price': statistics.median(prices),
                    'count': len(prices)
                })

    return sorted(result, key=lambda x: x['ym'])
```

### 6-2. 상승/하락 판단 기준

| 지표 | 계산 방법 | 판단 기준 |
|------|---------|---------|
| 단기 변동률 (3개월) | `(최근 3개월 평균 - 이전 3개월 평균) / 이전 3개월 평균 × 100` | +3% 이상: 상승 / -3% 이하: 하락 |
| 중기 변동률 (6개월) | 동일 방법 6개월 기준 | +5% 이상: 강세 / -5% 이하: 약세 |
| 거래량 트렌드 | 최근 3개월 거래량 vs 이전 3개월 거래량 비교 | 거래량 -50% 이상 감소 = 급격한 위험 신호 |

```python
def calc_price_trend(timeseries: list, short_months: int = 3) -> dict:
    """3개월 가격 트렌드 계산"""
    if len(timeseries) < short_months * 2:
        return {"trend": "데이터 부족", "change_pct": None}

    recent   = timeseries[-short_months:]
    previous = timeseries[-(short_months * 2):-short_months]

    avg_recent   = statistics.mean([d['avg_price'] for d in recent])
    avg_previous = statistics.mean([d['avg_price'] for d in previous])

    change_pct = (avg_recent - avg_previous) / avg_previous * 100

    if change_pct >= 3:
        trend = "상승"
    elif change_pct <= -3:
        trend = "하락"
    else:
        trend = "보합"

    return {"trend": trend, "change_pct": round(change_pct, 2)}
```

### 6-3. 위험 지역 판단 지표

| 지표 | 위험 기준 | 데이터 소스 |
|------|---------|-----------|
| 전세가율 지역 평균 | 75% 이상 | 실거래가 API 집계 |
| 가격 하락률 (6개월) | -10% 이상 | 실거래가 시계열 |
| 거래량 급감 | 전년 동기 대비 -50% | 실거래가 API 카운트 |
| 미분양 증가 | 해당 지역 미분양 물량 급증 | 국토부 미분양 현황 API |
| 신축 빌라 밀집 | 최근 3년 내 사용승인 비율 높음 | 건축물대장 API |

---

## 7. API 제약 및 우회 방안

### 7-1. 공개 API로 접근 가능한 데이터

| 데이터 | API | 비용 |
|--------|-----|------|
| 아파트/빌라/단독/오피스텔 실거래가 | 공공데이터포털 RTMS | 무료 |
| 공동주택 공시가격 | 공공데이터포털 | 무료 |
| 개별공시지가 | 공공데이터포털 | 무료 |
| 법정동 코드 | 공공데이터포털 | 무료 |
| 도로명주소 검색 | juso.go.kr | 무료 |
| R-ONE 가격동향 지수 | 한국부동산원 R-ONE API | 무료 (인증키 필요) |
| 건축물대장 | 공공데이터포털 | 무료 |

### 7-2. 공개 API 없는 데이터 및 대안

| 데이터 | 이유 | 대안 방법 |
|--------|------|---------|
| **KB시세** | KB국민은행 비공개 (내부 시스템) | ① KB부동산 데이터허브(data.kbland.kr) 통계 페이지 활용 (시각 자료, 직접 API 없음) ② PublicDataReader 라이브러리 (주택가격동향조사 통계) ③ 유료 스크래핑 서비스 (법적 위험 존재) |
| **네이버 부동산 호가** | robots.txt 제한, 이용약관 금지 | 실거래가 API 대체 사용 권장 |
| **등기부등본** | 대법원 인터넷등기소 — 건당 700원 유료, 공개 API 없음 | 앱에서 사용자가 직접 열람 후 텍스트 붙여넣기 → AI 해석 방식 |
| **전입세대 확인서** | 개인정보 보호, 직접 발급 필요 | 앱에서 체크리스트 안내 제공 |
| **HUG 보증보험 가입 가능 여부** | HUG 내부 심사 로직 | 가입 조건 기준(공시가격 비율 126% 이하 등) 체크 후 "가입 가능 예상/불가" 안내 |

### 7-3. R-ONE API 활용 방법

> ⚠️ **2026.3 업데이트**: R-ONE API가 2025.9.10 전면 개편됨. 기존 엔드포인트가 변경되었을 수 있으므로, 구현 전 R-ONE 공식 포털에서 최신 스펙 반드시 재확인 필요. 아래 엔드포인트는 개편 이전 기준으로 실제와 다를 수 있음.

```
엔드포인트 베이스:
https://www.reb.or.kr/r-one/portal/openapi/

인증키 발급:
1. R-ONE 사이트(reb.or.kr/r-one) 회원가입
2. Open API 메뉴 → 인증키 발급 신청
3. 미인증 시 'sample' 키로 10건만 조회 가능

주요 제공 데이터:
- 주간 아파트 가격 변동률 (전국/시도/시군구)
- 월간 주택 매매·전세 가격 지수
- 전세가율 통계 (시도별)
- 오피스텔 가격 동향

활용 예:
지역 전세가율 평균 조회 → 개별 물건 전세가율과 비교하여
"이 지역 평균(60%) 대비 해당 물건(82%) — 위험" 분석 제공
```

### 7-4. PublicDataReader 라이브러리 활용 (Python)

```python
# pip install PublicDataReader
from PublicDataReader import TransactionPrice

api = TransactionPrice(service_key="YOUR_KEY")

# 아파트 매매 조회
df = api.get_data(
    property_type="아파트",
    trade_type="매매",
    sigungu_code="11110",   # 서울 종로구
    start_year_month="202401",
    end_year_month="202406"
)

# KB부동산 주택가격동향 조회
from PublicDataReader import Kbland
kb = Kbland()
price_trend = kb.get_housing_price_trend()
```

---

## 8. 앱 구현 시 핵심 판단 로직 요약

### 8-1. 시세 데이터 조회 의사결정 트리

```
주소 입력
  │
  ├─ [아파트] → RTMS 아파트 API (최근 6개월)
  │    ├─ 거래 10건+ → median 사용
  │    ├─ 거래 1~9건 → 가중평균 사용 + "데이터 적음" 경고
  │    └─ 거래 없음 → 공시가격 ÷ 0.69 (추정치 표시)
  │
  ├─ [연립다세대] → RTMS 연립다세대 API (최근 12개월)
  │    ├─ 거래 3건+ → median 사용 + "빌라 주의" 경고
  │    ├─ 거래 1~2건 → 가중평균 + "데이터 매우 부족" 경고
  │    └─ 거래 없음 → 공시가격 ÷ 0.69 + "시세 불투명 — 고위험" 경고
  │
  ├─ [단독/다가구] → RTMS 단독 API (최근 12개월)
  │    ├─ 토지가 = 개별공시지가 × 대지면적
  │    ├─ 건물가 = 재조달원가 × (1 - 경과연수/내용연수)
  │    └─ 추정 매매가 = 토지가 + 건물가
  │
  └─ [오피스텔] → RTMS 오피스텔 API (최근 6개월)
       └─ 주거용 여부 확인 안내 추가
```

### 8-2. 전세가율 기반 종합 위험도 판정

```
전세가율 < 60%:           안전   (초록)
60% ≤ 전세가율 < 70%:    양호   (연두)
70% ≤ 전세가율 < 80%:    주의   (노랑)  — "시세 하락 시 손실 위험"
80% ≤ 전세가율 < 90%:    위험   (주황)  — "깡통전세 가능성 높음"
전세가율 ≥ 90%:           매우 위험 (빨강) — "계약 강력 비권장"

[근저당 있을 때 기준 강화]
실효 전세가율 = (전세보증금 + 선순위 채권최고액/1.2) / 매매가 × 100
→ 위 기준 동일하게 적용
```

### 8-3. 시세 데이터 신뢰도 표시 규칙

| 상황 | 신뢰도 표시 | 앱 UI |
|------|-----------|-------|
| 최근 6개월 10건+ 실거래 | 높음 | 시세 수치 정상 표시 |
| 최근 6개월 3~9건 | 중간 | "주의: 거래량 적음" 배지 |
| 최근 12개월 1~2건 | 낮음 | "시세 참고용" + 노랑 경고 |
| 공시가격 역산 | 추정치 | "추정 시세" 레이블 + 면책 고지 |
| 데이터 전혀 없음 | 없음 | "시세 불투명 (고위험 신호)" 빨강 경고 |

---

## 9. 데이터 소스 참고 URL

| 항목 | URL |
|------|-----|
| 공공데이터포털 (API 신청) | https://www.data.go.kr |
| 국토부 실거래가 공개시스템 | https://rt.molit.go.kr |
| 아파트 매매 API | https://www.data.go.kr/data/15126469/openapi.do |
| 아파트 전월세 API | https://www.data.go.kr/data/15126474/openapi.do |
| 법정동코드 파일 데이터 | https://www.data.go.kr/data/15063424/fileData.do |
| 도로명주소 검색 API | https://www.data.go.kr/data/15057017/openapi.do |
| R-ONE 부동산통계 API | https://www.reb.or.kr/r-one/portal/openapi/openApiIntroPage.do |
| 부동산 공시가격 알리미 | https://www.realtyprice.kr |
| KB부동산 데이터허브 | https://data.kbland.kr |
| PublicDataReader (Python) | https://github.com/WooilJeong/PublicDataReader |

---

> **면책 고지**: 본 문서의 API 엔드포인트 및 파라미터는 2025~2026년 3월 기준이며, 공공데이터포털 정책 변경에 따라 수정될 수 있습니다. 구현 전 공공데이터포털 공식 문서를 반드시 재확인하세요. RTMS 실거래가 API 엔드포인트는 2026.3 기준 변경 없음 확인. R-ONE API는 2025.9.10 전면 개편됨 — §7-3 주의사항 참고.
