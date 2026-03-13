"""PDF 업로드 엔드포인트 + 텍스트 추출 테스트"""

import io
import pytest
from fastapi.testclient import TestClient


# ─── pdf_service 단위 테스트 ──────────────────────────────────────────────────

def test_extract_text_imports():
    """pdf_service 임포트 가능 여부 확인"""
    from services.pdf_service import extract_text_from_pdf, MAX_PDF_SIZE
    assert MAX_PDF_SIZE == 10 * 1024 * 1024


def test_extract_text_from_valid_pdf():
    """유효한 PDF 바이트 → 텍스트 추출 성공"""
    try:
        import fitz
    except ImportError:
        pytest.skip("PyMuPDF not installed")

    from services.pdf_service import extract_text_from_pdf

    # 최소 PDF 생성 (fitz 사용) — 기본 폰트가 한글 미지원이므로 ASCII로 테스트
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "registry test content homelens")
    pdf_bytes = doc.tobytes()
    doc.close()

    result = extract_text_from_pdf(pdf_bytes)
    assert "registry" in result


def test_extract_text_from_corrupt_pdf():
    """손상된 PDF 바이트 → 예외 발생"""
    try:
        import fitz
    except ImportError:
        pytest.skip("PyMuPDF not installed")

    from services.pdf_service import extract_text_from_pdf

    with pytest.raises(Exception):
        extract_text_from_pdf(b"not a pdf")


# ─── API 엔드포인트 통합 테스트 ───────────────────────────────────────────────

@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_upload_pdf_rejects_non_pdf(client: TestClient):
    """비PDF 파일 업로드 → 400 반환"""
    fake_file = io.BytesIO(b"not a pdf content")
    response = client.post(
        "/api/registry/upload-pdf",
        files={"file": ("document.txt", fake_file, "text/plain")},
    )
    assert response.status_code == 400


def test_upload_pdf_rejects_oversized(client: TestClient):
    """10MB 초과 파일 → 413 반환"""
    big_content = b"x" * (10 * 1024 * 1024 + 1)
    big_file = io.BytesIO(big_content)
    response = client.post(
        "/api/registry/upload-pdf",
        files={"file": ("big.pdf", big_file, "application/pdf")},
    )
    assert response.status_code == 413


def test_upload_pdf_valid(client: TestClient):
    """유효한 PDF → 200 + text 필드 반환"""
    try:
        import fitz
    except ImportError:
        pytest.skip("PyMuPDF not installed")

    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "registry homelens test")
    pdf_bytes = doc.tobytes()
    doc.close()

    pdf_file = io.BytesIO(pdf_bytes)
    response = client.post(
        "/api/registry/upload-pdf",
        files={"file": ("registry.pdf", pdf_file, "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "text" in data["data"]
