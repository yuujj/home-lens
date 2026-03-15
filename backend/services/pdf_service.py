"""PDF 텍스트 추출 서비스 — PyMuPDF(fitz) 사용"""

import io

import fitz  # PyMuPDF

MAX_PDF_SIZE = 10 * 1024 * 1024  # 10MB
# PDF 매직 바이트 시그니처
_PDF_MAGIC = b"%PDF"


def is_valid_pdf(pdf_bytes: bytes) -> bool:
    """
    PDF 파일 형식 검증 (매직 바이트 확인)
    예: is_valid_pdf(b"%PDF-1.4...") → True
        is_valid_pdf(b"not a pdf") → False
    """
    return pdf_bytes[:4] == _PDF_MAGIC


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    PDF 바이트 데이터 → 전 페이지 텍스트 추출
    예: extract_text_from_pdf(b"%PDF...") → "등기부등본 전문..."
    오류: 유효하지 않은 PDF → ValueError 발생
    """
    if not is_valid_pdf(pdf_bytes):
        raise ValueError("유효하지 않은 PDF 파일입니다 (PDF 시그니처 없음)")
    if len(pdf_bytes) > MAX_PDF_SIZE:
        raise ValueError(f"파일 크기 초과: {len(pdf_bytes)} bytes > {MAX_PDF_SIZE} bytes")

    doc = fitz.open(stream=io.BytesIO(pdf_bytes), filetype="pdf")
    texts: list[str] = []
    try:
        for page in doc:
            texts.append(page.get_text())
    finally:
        doc.close()
    return "\n".join(texts)
