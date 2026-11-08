import re
import os
from typing import List, Dict, Any, Optional

def extract_pages_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text per page from a PDF file using pypdf.
    Returns a list of dicts: [{"page_number": 1, "text": "..."}, ...]
    """
    pages = []
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        for idx, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text() or ""
            cleaned = page_text.strip()
            if cleaned:
                pages.append({
                    "page_number": idx,
                    "text": cleaned
                })
    except Exception as e:
        print(f"[PDF Extraction Error] {file_path}: {e}")
    
    # If no pages extracted, fallback to raw extraction
    if not pages:
        pages.append({"page_number": 1, "text": "Empty or unparseable PDF content."})
    return pages

def extract_pages_from_docx(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text from a DOCX file, segmenting into logical pages
    (by explicit page breaks or ~500-word logical page boundaries).
    """
    pages = []
    try:
        import docx
        doc = docx.Document(file_path)
        
        current_page_num = 1
        current_page_text = []
        word_count = 0

        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
            
            # Check for page break in paragraph runs
            has_page_break = any(
                "lastRenderedPageBreak" in run._element.xml or "w:br" in run._element.xml and 'type="page"' in run._element.xml
                for run in p.runs
            )

            current_page_text.append(text)
            word_count += len(text.split())

            # Split on explicit page break or when exceeding 500 words per logical page
            if has_page_break or word_count >= 500:
                pages.append({
                    "page_number": current_page_num,
                    "text": "\n\n".join(current_page_text)
                })
                current_page_num += 1
                current_page_text = []
                word_count = 0

        # Append any remaining text
        if current_page_text:
            pages.append({
                "page_number": current_page_num,
                "text": "\n\n".join(current_page_text)
            })

        # Process tables if present and append to current pages
        for table in doc.tables:
            table_rows = []
            for row in table.rows:
                cells = [c.text.strip().replace("\n", " ") for c in row.cells if c.text.strip()]
                if cells:
                    table_rows.append(" | ".join(cells))
            if table_rows:
                table_str = "\n".join(table_rows)
                if pages:
                    pages[-1]["text"] += f"\n\n[Table Data]:\n{table_str}"
                else:
                    pages.append({"page_number": 1, "text": table_str})

    except Exception as e:
        print(f"[DOCX Extraction Error] {file_path}: {e}")

    if not pages:
        pages.append({"page_number": 1, "text": "Empty or unparseable DOCX content."})
    return pages

def extract_pages_from_txt(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text from TXT or MD files, detecting page breaks (e.g. '--- Page X ---' or form-feed \x0c)
    or segmenting into 500-word logical pages.
    """
    pages = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        # Split on form feed or page delimiter if present
        raw_pages = re.split(r"(?:\x0c|\n-{3,}\s*(?:Page\s*\d+|[Pp]age\s*\d+)?\s*-{3,}|\f)", content)
        if len(raw_pages) > 1:
            for idx, p in enumerate(raw_pages, start=1):
                t = p.strip()
                if t:
                    pages.append({"page_number": idx, "text": t})
        else:
            words = content.split()
            page_size = 500
            for idx, i in enumerate(range(0, len(words), page_size), start=1):
                page_words = words[i:i + page_size]
                pages.append({
                    "page_number": idx,
                    "text": " ".join(page_words)
                })
    except Exception as e:
        print(f"[TXT Extraction Error] {file_path}: {e}")

    if not pages:
        pages.append({"page_number": 1, "text": "Empty text file."})
    return pages

def extract_pages(file_path: str) -> List[Dict[str, Any]]:
    """
    Main entry point for multi-format page text extraction.
    Supports .pdf, .docx, .doc, .txt, .md.
    """
    fn = file_path.lower()
    if fn.endswith(".pdf"):
        return extract_pages_from_pdf(file_path)
    elif fn.endswith(".docx") or fn.endswith(".doc"):
        return extract_pages_from_docx(file_path)
    else:
        return extract_pages_from_txt(file_path)

def chunk_text_overlapping(
    pages: List[Dict[str, Any]],
    chunk_size: int = 800,
    overlap: int = 150,
    metadata_base: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Chunks document pages into overlapping segments of exact token/word boundaries.
    Parameters:
      - chunk_size: 800 tokens
      - overlap: 150 tokens
    
    Every chunk contains complete metadata:
      - course_id
      - document_title
      - doc_type ('marking_scheme' | 'past_question' | 'lecture_note' | 'handout')
      - page_number
      - chunk_index
      - token_count
    """
    meta_base = metadata_base or {}
    course_id = meta_base.get("course_id", meta_base.get("course_code", "GENERAL"))
    doc_title = meta_base.get("document_title", meta_base.get("source_filename", "Course Document"))
    doc_type = meta_base.get("doc_type", meta_base.get("document_type", "past_question"))

    chunks = []
    chunk_index = 0

    for page in pages:
        page_num = page.get("page_number", 1)
        text = page.get("text", "").strip()
        if not text:
            continue

        words = text.split()
        if not words:
            continue

        # If page fits within chunk_size, create a single chunk
        if len(words) <= chunk_size:
            chunk_text = " ".join(words)
            chunks.append({
                "chunk_index": chunk_index,
                "chunk_text": chunk_text,
                "token_count": len(words),
                "page_number": page_num,
                "course_id": course_id,
                "document_title": doc_title,
                "doc_type": doc_type,
                "year": meta_base.get("year", meta_base.get("session", "2023/2024")),
                "department": meta_base.get("department", "General Studies")
            })
            chunk_index += 1
        else:
            # Sliding window of 800 tokens with 150 token overlap
            start = 0
            step = chunk_size - overlap
            while start < len(words):
                window_words = words[start:start + chunk_size]
                chunk_text = " ".join(window_words)
                chunks.append({
                    "chunk_index": chunk_index,
                    "chunk_text": chunk_text,
                    "token_count": len(window_words),
                    "page_number": page_num,
                    "course_id": course_id,
                    "document_title": doc_title,
                    "doc_type": doc_type,
                    "year": meta_base.get("year", meta_base.get("session", "2023/2024")),
                    "department": meta_base.get("department", "General Studies")
                })
                chunk_index += 1
                start += step

    return chunks
