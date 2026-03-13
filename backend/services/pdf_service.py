"""PDF 텍스트 추출 서비스 — PyMuPDF(fitz) 사용"""

import io

import fitz  # PyMuPDF

MAX_PDF_SIZE = 10 * 1024 * 1024  # 10MB


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    PDF 바이트 데이터 → 전 페이지 텍스트 추출
    예: extract_text_from_pdf(b"...") → "등기부등본 전문..."
    """
    doc = fitz.open(stream=io.BytesIO(pdf_bytes), filetype="pdf")
    texts: list[str] = []
    for page in doc:
        texts.append(page.get_text())
    doc.close()
    return "\n".join(texts)
