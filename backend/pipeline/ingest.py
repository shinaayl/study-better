import os
import uuid
import json
import logging
from pathlib import Path
from backend.config import DATA_DIR
from backend.db.database import get_connection, init_db
from backend.pipeline.doc_parser import parse_examination_document
from backend.pipeline.vector_store import VectorStoreManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def run_ingestion():
    logging.info("Starting knowledge base ingestion pipeline...")
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    vector_mgr = VectorStoreManager()

    files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith(('.docx', '.doc'))])
    logging.info(f"Discovered {len(files)} examination and marking scheme files.")

    total_chunks = 0
    total_questions = 0
    total_criteria = 0

    vector_docs = []
    vector_metas = []
    vector_ids = []

    for filename in files:
        file_path = os.path.join(DATA_DIR, filename)
        try:
            parsed = parse_examination_document(file_path)
            course_code = parsed["course_code"]
            session_year = parsed["session"]
            doc_type = parsed["document_type"]

            # 1. Upsert Course
            course_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, course_code))
            cursor.execute("""
            INSERT INTO courses (course_id, course_code, course_title, department, level, semester, credit_units)
            VALUES (?, ?, ?, 'Computer Science', ?, ?, ?)
            ON CONFLICT(course_code) DO UPDATE SET
                course_title=excluded.course_title,
                level=excluded.level,
                semester=excluded.semester;
            """, (course_id, course_code, parsed["course_title"], parsed["level"], parsed["semester"], parsed["credit_units"]))

            # 2. Upsert Session
            session_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{course_id}-{session_year}"))
            cursor.execute("""
            INSERT OR IGNORE INTO sessions (session_id, course_id, academic_year, semester, exam_date, lecturer_names)
            VALUES (?, ?, ?, ?, ?, ?);
            """, (session_id, course_id, session_year, parsed["semester"], "2023-08-15", "CSC Department Faculty"))

            # 3. Insert Examination Document
            doc_id = str(uuid.uuid4())
            cursor.execute("""
            INSERT INTO examination_documents (document_id, session_id, document_type, source_filename, file_size_bytes)
            VALUES (?, ?, ?, ?, ?);
            """, (doc_id, session_id, doc_type, filename, parsed["file_size"]))

            # 4. Insert Chunks & Vector Bridge
            for c in parsed["chunks"]:
                chunk_id = str(uuid.uuid4())
                embedding_id = f"vec_{chunk_id}"
                cursor.execute("""
                INSERT INTO document_chunks (chunk_id, document_id, chunk_index, chunk_text, token_count, embedding_id)
                VALUES (?, ?, ?, ?, ?, ?);
                """, (chunk_id, doc_id, c["chunk_index"], c["chunk_text"], c["token_count"], embedding_id))

                vector_docs.append(c["chunk_text"])
                vector_metas.append({
                    "course_code": course_code,
                    "academic_year": session_year,
                    "document_type": doc_type,
                    "source_filename": filename,
                    "document_id": doc_id,
                    "chunk_id": chunk_id
                })
                vector_ids.append(embedding_id)
                total_chunks += 1

            # 5. Insert Past Questions & Criteria
            for q in parsed["questions"]:
                question_id = str(uuid.uuid4())
                cursor.execute("""
                INSERT INTO past_questions (question_id, document_id, session_id, course_id, question_number, question_text, total_marks, topic_tag, bloom_level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (question_id, doc_id, session_id, course_id, q["question_number"], q["question_text"], q["total_marks"], q["topic_tag"], q["bloom_level"]))
                total_questions += 1

                for crit in q.get("criteria", []):
                    crit_id = str(uuid.uuid4())
                    cursor.execute("""
                    INSERT INTO marking_scheme_criteria (criteria_id, question_id, criterion_step, allocated_marks, required_keywords, deduction_rule)
                    VALUES (?, ?, ?, ?, ?, ?);
                    """, (crit_id, question_id, crit["criterion_step"], crit["allocated_marks"], json.dumps(crit["required_keywords"]), crit["deduction_rule"]))
                    total_criteria += 1

            conn.commit()
            logging.info(f"Processed: {filename} -> {course_code} ({len(parsed['chunks'])} chunks, {len(parsed['questions'])} questions)")

        except Exception as e:
            logging.error(f"Failed to ingest {filename}: {e}", exc_info=True)

    # Ingest vectors in batch into ChromaDB
    if vector_docs:
        logging.info(f"Inserting {len(vector_docs)} chunks into ChromaDB vector index...")
        vector_mgr.add_chunks(vector_docs, vector_metas, vector_ids)

    # 6. Aggregate Topic Frequencies & Overdue Probabilities
    cursor.execute("""
    SELECT course_id, topic_tag, COUNT(*) as cnt
    FROM past_questions
    GROUP BY course_id, topic_tag;
    """)
    topic_rows = cursor.fetchall()

    for row in topic_rows:
        cid = row["course_id"]
        topic = row["topic_tag"]
        cnt = row["cnt"]
        topic_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{cid}-{topic}"))

        # Overdue probability heuristic grounded in historical frequency:
        # High count = frequent core exam topic.
        prob = min(0.95, max(0.20, round(0.40 + (cnt * 0.12), 2)))

        cursor.execute("""
        INSERT OR REPLACE INTO topic_frequencies (topic_id, course_id, topic_name, sessions_examined, last_session_appeared, overdue_probability)
        VALUES (?, ?, ?, ?, '2022/2023', ?);
        """, (topic_id, cid, topic, cnt, prob))

    conn.commit()
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
