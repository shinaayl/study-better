import os
import uuid
import json
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from backend.config import DATA_DIR
from backend.db.database import get_connection, init_db
from backend.pipeline.doc_parser import parse_examination_document
from backend.pipeline.vector_store import VectorStoreManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def ingest_parsed_document(parsed: Dict[str, Any], conn, vector_mgr: VectorStoreManager) -> Dict[str, Any]:
    cursor = conn.cursor()
    course_code = parsed["course_code"]
    session_year = parsed["session"]
    doc_type = parsed["document_type"]
    filename = parsed.get("filename", f"{course_code}_document")
    department = parsed.get("department", "Computer Science")

    # 1. Upsert Course
    course_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, course_code))
    cursor.execute("""
    INSERT INTO courses (course_id, course_code, course_title, department, level, semester, credit_units)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(course_code) DO UPDATE SET
        course_title=excluded.course_title,
        department=excluded.department,
        level=excluded.level,
        semester=excluded.semester;
    """, (course_id, course_code, parsed["course_title"], department, parsed["level"], parsed["semester"], parsed["credit_units"]))

    # 2. Upsert Session
    session_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{course_id}-{session_year}"))
    cursor.execute("""
    INSERT OR IGNORE INTO sessions (session_id, course_id, academic_year, semester, exam_date, lecturer_names)
    VALUES (?, ?, ?, ?, ?, ?);
    """, (session_id, course_id, session_year, parsed["semester"], "2023-08-15", f"{department} Faculty"))

    # 3. Insert Examination Document
    doc_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO examination_documents (document_id, session_id, document_type, source_filename, file_size_bytes)
    VALUES (?, ?, ?, ?, ?);
    """, (doc_id, session_id, doc_type, filename, parsed["file_size"]))

    # 3b. Also register in standard documents table
    doc_type_mapping = {
        "past_examination_paper": "past_question",
        "past_question": "past_question",
        "marking_scheme": "marking_scheme",
        "lecture_notes": "lecture_note",
        "lecture_note": "lecture_note",
        "syllabus_guide": "handout",
        "handout": "handout"
    }
    canonical_type = doc_type_mapping.get(doc_type, "past_question")
    try:
        cursor.execute("""
        INSERT OR REPLACE INTO documents (id, course_id, title, file_url, doc_type)
        VALUES (?, ?, ?, ?, ?);
        """, (doc_id, course_id, filename, f"/uploads/{filename}", canonical_type))
    except Exception:
        pass

    # 4. Insert Chunks & Vector Bridge with Page Awareness
    vector_docs = []
    vector_metas = []
    vector_ids = []

    for c in parsed["chunks"]:
        chunk_id = str(uuid.uuid4())
        embedding_id = f"vec_{chunk_id}"
        page_num = c.get("page_number", 1)
        cursor.execute("""
        INSERT INTO document_chunks (chunk_id, document_id, chunk_index, chunk_text, token_count, embedding_id, page_number)
        VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (chunk_id, doc_id, c["chunk_index"], c["chunk_text"], c["token_count"], embedding_id, page_num))

        vector_docs.append(c["chunk_text"])
        vector_metas.append({
            "course_id": course_id,
            "course_code": course_code,
            "department": department,
            "academic_year": session_year,
            "document_type": doc_type,
            "doc_type": canonical_type,
            "document_title": filename,
            "source_filename": filename,
            "document_id": doc_id,
            "chunk_id": chunk_id,
            "page_number": page_num,
            "chunk_index": c["chunk_index"]
        })
        vector_ids.append(embedding_id)

    # 5. Insert Past Questions & Criteria
    questions_count = 0
    criteria_count = 0
    for q in parsed["questions"]:
        question_id = str(uuid.uuid4())
        cursor.execute("""
        INSERT INTO past_questions (question_id, document_id, session_id, course_id, question_number, question_text, total_marks, topic_tag, bloom_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (question_id, doc_id, session_id, course_id, q["question_number"], q["question_text"], q["total_marks"], q["topic_tag"], q["bloom_level"]))
        questions_count += 1

        for crit in q.get("criteria", []):
            crit_id = str(uuid.uuid4())
            cursor.execute("""
            INSERT INTO marking_scheme_criteria (criteria_id, question_id, criterion_step, allocated_marks, required_keywords, deduction_rule)
            VALUES (?, ?, ?, ?, ?, ?);
            """, (crit_id, question_id, crit["criterion_step"], crit["allocated_marks"], json.dumps(crit["required_keywords"]), crit["deduction_rule"]))
            criteria_count += 1

    # Ingest vectors into Vector Database with Google Gemini text-embedding-004
    if vector_docs:
        from backend.pipeline.embeddings import compute_gemini_embeddings
        gemini_embeddings = compute_gemini_embeddings(vector_docs)
        vector_mgr.add_chunks(vector_docs, vector_metas, vector_ids, embeddings=gemini_embeddings)

        # Optional PostgreSQL pgvector sync
        try:
            from backend.pipeline.pgvector_manager import get_pgvector_manager
            pg_mgr = get_pgvector_manager()
            if pg_mgr.is_available():
                pg_chunks = []
                for idx, c in enumerate(parsed["chunks"]):
                    pg_chunks.append({
                        "course_id": course_id,
                        "document_id": doc_id,
                        "document_title": filename,
                        "doc_type": canonical_type,
                        "page_number": c.get("page_number", 1),
                        "chunk_index": c["chunk_index"],
                        "chunk_text": c["chunk_text"],
                        "token_count": c["token_count"],
                        "embedding": gemini_embeddings[idx] if idx < len(gemini_embeddings) else None
                    })
                pg_mgr.insert_chunks(pg_chunks)
        except Exception as e:
            logging.debug(f"pgvector sync skipped: {e}")

    # 6. Aggregate Topic Frequencies & Overdue Probabilities
    cursor.execute("""
    SELECT course_id, topic_tag, COUNT(*) as cnt
    FROM past_questions
    WHERE course_id = ?
    GROUP BY course_id, topic_tag;
    """, (course_id,))
    topic_rows = cursor.fetchall()

    for row in topic_rows:
        cid = row["course_id"]
        topic = row["topic_tag"]
        cnt = row["cnt"]
        topic_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{cid}-{topic}"))
        prob = min(0.95, max(0.20, round(0.40 + (cnt * 0.12), 2)))
        cursor.execute("""
        INSERT OR REPLACE INTO topic_frequencies (topic_id, course_id, topic_name, sessions_examined, last_session_appeared, overdue_probability)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (topic_id, cid, topic, cnt, session_year, prob))

    conn.commit()

    return {
        "course_id": course_id,
        "course_code": course_code,
        "course_title": parsed["course_title"],
        "department": department,
        "document_id": doc_id,
        "document_type": doc_type,
        "source_filename": filename,
        "chunks_count": len(parsed["chunks"]),
        "questions_count": questions_count,
        "criteria_count": criteria_count
    }

def ingest_document_file(file_path: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    init_db()
    conn = get_connection()
    vector_mgr = VectorStoreManager()
    parsed = parse_examination_document(file_path, metadata_override=metadata)
    stats = ingest_parsed_document(parsed, conn, vector_mgr)
    conn.close()
    return stats

def run_ingestion():
    logging.info("Starting knowledge base ingestion pipeline...")
    init_db()
    conn = get_connection()
    vector_mgr = VectorStoreManager()

    files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith(('.docx', '.doc'))])
    logging.info(f"Discovered {len(files)} examination and marking scheme files.")

    total_chunks = 0
    total_questions = 0
    total_criteria = 0

    for filename in files:
        file_path = os.path.join(DATA_DIR, filename)
        try:
            parsed = parse_examination_document(file_path)
            stats = ingest_parsed_document(parsed, conn, vector_mgr)
            total_chunks += stats["chunks_count"]
            total_questions += stats["questions_count"]
            total_criteria += stats["criteria_count"]
            logging.info(f"Processed: {filename} -> {stats['course_code']} ({stats['chunks_count']} chunks, {stats['questions_count']} questions)")
        except Exception as e:
            logging.error(f"Failed to ingest {filename}: {e}", exc_info=True)

    conn.close()
    logging.info("=" * 60)
    logging.info(f"Ingestion Complete! Ingested:")
    logging.info(f"  Total Chunks: {total_chunks}")
    logging.info(f"  Total Questions: {total_questions}")
    logging.info(f"  Total Marking Criteria: {total_criteria}")
    logging.info(f"  Vector Store Count: {vector_mgr.count()}")
    logging.info("=" * 60)

if __name__ == "__main__":
    run_ingestion()
