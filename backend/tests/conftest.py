"""공통 테스트 픽스처 — 외부 API 미호출 원칙 적용"""

import json
import pytest
from fastapi.testclient import TestClient
from main import app

FIXTURES_DIR = "tests/fixtures"


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_rtms_trade_items():
    """RTMS 아파트 매매 API 응답 아이템 리스트"""
    with open(f"{FIXTURES_DIR}/rtms_apt_trade.json", encoding="utf-8") as f:
        data = json.load(f)
    return data["response"]["body"]["items"]["item"]


@pytest.fixture
def mock_rtms_rent_items():
    """RTMS 아파트 전세 API 응답 아이템 리스트"""
    with open(f"{FIXTURES_DIR}/rtms_apt_rent.json", encoding="utf-8") as f:
        data = json.load(f)
    return data["response"]["body"]["items"]["item"]


@pytest.fixture
def mock_juso():
    """도로명주소 API 응답 첫 번째 결과"""
    with open(f"{FIXTURES_DIR}/juso_response.json", encoding="utf-8") as f:
        data = json.load(f)
    return data["results"]["juso"][0]


@pytest.fixture
def mock_claude_response():
    """Claude API 등기부 파싱 응답 fixture"""
    with open(f"{FIXTURES_DIR}/claude_registry_response.json", encoding="utf-8") as f:
        return json.load(f)
