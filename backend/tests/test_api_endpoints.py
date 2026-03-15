"""API 통합 테스트 — TestClient 기반, 외부 API 미호출 (fixture + mock)"""

from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

# ─── 공통 fixture ──────────────────────────────────────────────────────────────

LOAN_REQUEST_BODY = {
    "user_profile": {
        "annual_income": 3500,
        "is_dual_income": False,
        "net_asset": 10000,
        "age": 29,
        "is_married": False,
        "marriage_years": 0,
        "num_children": 0,
        "has_newborn_2yr": False,
        "housing_ownership": "none",
        "is_disabled": False,
        "is_single_parent": False,
        "is_multicultural": False,
        "subscription_years": 3,
        "subscription_count": 36,
        "loan_purpose": "jeonse",
    },
    "property_info": {
        "address": {
            "raw_input": "서울시 강남구 역삼동",
            "road_addr": "서울특별시 강남구 테헤란로 152",
            "jibun_addr": "서울특별시 강남구 역삼동 737",
            "lawd_cd_5": "11680",
            "lawd_cd_10": "1168010700",
            "sido": "서울특별시",
            "sigungu": "강남구",
            "dong": "역삼동",
            "is_metropolitan": True,
            "regulation_zone": "투기지역",
        },
        "housing_type": "apt",
        "exclusive_area_m2": 59.99,
        "floor": 5,
        "built_year": 2015,
        "listed_jeonse_price": 18000,
        "listed_trade_price": None,
        "market_trade_price": 85000,
        "market_jeonse_price": 52000,
        "market_data_confidence": "high",
        "senior_mortgage_amount": 0,
        "has_attachment": False,
        "has_provisional_attachment": False,
        "has_auction": False,
        "has_trust": False,
        "has_lease_registration": False,
    },
}

FRAUD_REQUEST_BODY = {
    "property_info": LOAN_REQUEST_BODY["property_info"],
    "registry_text": "갑구 소유권 이전 2020년 01월 01일 홍길동 을구 근저당권 설정 채권최고액 금 일억이천만원",
}


# ─── 1. 헬스체크 ───────────────────────────────────────────────────────────────


def test_health_check():
    """GET /api/health → 200, status=ok"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "HomeLens API"


# ─── 2. 정책 대출 자격 판단 ────────────────────────────────────────────────────


def test_loan_eligible_returns_200():
    """POST /api/loan/eligible → 200, eligible/ineligible 포함 (외부 API 없음)"""
    response = client.post("/api/loan/eligible", json=LOAN_REQUEST_BODY)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "eligible" in body["data"]
    assert "ineligible" in body["data"]
    assert isinstance(body["data"]["eligible"], list)
    assert isinstance(body["data"]["ineligible"], list)


def test_loan_eligible_youth_contains_youth_product():
    """청년 조건(29세, 연소득 3500만, 전세 1.8억) → 청년전용 버팀목 포함"""
    response = client.post("/api/loan/eligible", json=LOAN_REQUEST_BODY)
    assert response.status_code == 200
    eligible = response.json()["data"]["eligible"]
    names = [p["product_name"] for p in eligible]
    assert "청년전용 버팀목전세대출" in names


def test_loan_eligible_missing_field_returns_422():
    """필수 필드(user_profile) 누락 → 422 Unprocessable Entity"""
    response = client.post("/api/loan/eligible", json={"property_info": LOAN_REQUEST_BODY["property_info"]})
    assert response.status_code == 422


# ─── 3. 시세 분석 (외부 API mock) ─────────────────────────────────────────────


def test_market_analyze_with_mocked_external_apis(mock_rtms_trade_items, mock_rtms_rent_items):
    """POST /api/market/analyze → juso + rtms mock 기반 200 응답"""
    from clients import juso_client, rtms_client

    mock_juso_result = {
        "roadAddr": "서울특별시 강남구 테헤란로 152",
        "jibunAddr": "서울특별시 강남구 역삼동 737",
        "admCd": "1168010700",
        "siNm": "서울특별시",
        "sggNm": "강남구",
        "emdNm": "역삼동",
    }

    with (
        patch.object(juso_client, "search_address", new=AsyncMock(return_value=mock_juso_result)),
        patch.object(rtms_client, "get_trade_prices", new=AsyncMock(return_value=mock_rtms_trade_items)),
        patch.object(rtms_client, "get_rent_prices", new=AsyncMock(return_value=mock_rtms_rent_items)),
    ):
        response = client.post(
            "/api/market/analyze",
            json={
                "raw_address": "서울시 강남구 역삼동",
                "housing_type": "apt",
                "exclusive_area_m2": 84.99,
                "listed_jeonse_price": 50000,
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "jeonse_ratio" in body["data"] or body["data"] is not None


def test_market_analyze_address_not_found():
    """juso API가 결과 없음 반환 → success=False, 주소 오류 메시지"""
    from clients import juso_client

    with patch.object(juso_client, "search_address", new=AsyncMock(return_value=None)):
        response = client.post(
            "/api/market/analyze",
            json={
                "raw_address": "존재하지않는주소99999",
                "housing_type": "apt",
                "exclusive_area_m2": 84.99,
                "listed_jeonse_price": 50000,
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is False
    assert "주소" in body["error"]


# ─── 4. 사기 위험도 스코어링 (Claude mock) ─────────────────────────────────────


def test_fraud_score_with_mocked_claude(mock_claude_response):
    """POST /api/fraud/score → Claude mock 기반 200, fraud_score 포함"""
    from services import registry_service

    with patch.object(
        registry_service,
        "parse_registry",
        new=AsyncMock(return_value=mock_claude_response),
    ):
        response = client.post("/api/fraud/score", json=FRAUD_REQUEST_BODY)

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert "fraudScore" in data or "fraud_score" in data
    assert "fraudGrade" in data or "fraud_grade" in data


def test_fraud_score_missing_registry_text():
    """registry_text 필드 누락 → 422"""
    response = client.post(
        "/api/fraud/score",
        json={"property_info": LOAN_REQUEST_BODY["property_info"]},
    )
    assert response.status_code == 422


# ─── 5. 입력 유효성 검사 통합 ──────────────────────────────────────────────────


def test_loan_eligible_invalid_income_type():
    """annual_income에 문자열 전달 (타입 오류) → 422"""
    body = {
        "user_profile": {**LOAN_REQUEST_BODY["user_profile"], "annual_income": "not_a_number"},
        "property_info": LOAN_REQUEST_BODY["property_info"],
    }
    response = client.post("/api/loan/eligible", json=body)
    assert response.status_code == 422
