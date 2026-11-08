import sqlite3
from typing import Generator
from backend.config import SQLITE_DB_PATH

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(SQLITE_DB_PATH, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 0. User Profiles (Any Lecturer or Student from any Department & Institution)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        institution TEXT NOT NULL,
        level TEXT,
        title TEXT,
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 1. Courses
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS courses (
        course_id TEXT PRIMARY KEY,
        course_code TEXT NOT NULL UNIQUE,
        course_title TEXT NOT NULL,
        department TEXT NOT NULL DEFAULT 'General Studies',
        level INTEGER NOT NULL,
        semester TEXT NOT NULL,
        credit_units INTEGER NOT NULL DEFAULT 3,
        lecturer_id TEXT,
        FOREIGN KEY (lecturer_id) REFERENCES users (user_id) ON DELETE SET NULL
    );
    """)

    try:
        cursor.execute("ALTER TABLE courses ADD COLUMN lecturer_id TEXT REFERENCES users(user_id);")
    except Exception:
        pass

    # 1b. Documents (Official Past Questions, Marking Schemes, Lecture Notes, Handouts)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        file_url TEXT NOT NULL,
        doc_type TEXT NOT NULL, -- 'marking_scheme' | 'past_question' | 'lecture_note' | 'handout'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE CASCADE
    );
    """)

    # 2. Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        semester TEXT NOT NULL,
        exam_date TEXT,
        lecturer_names TEXT,
        FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE CASCADE
    );
    """)

    # 3. Examination Documents
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS examination_documents (
        document_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        document_type TEXT NOT NULL,
        source_filename TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE
    );
    """)

    # 4. Document Chunks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS document_chunks (
        chunk_id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        token_count INTEGER NOT NULL,
        embedding_id TEXT NOT NULL,
        page_number INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (document_id) REFERENCES examination_documents (document_id) ON DELETE CASCADE
    );
    """)

    try:
        cursor.execute("ALTER TABLE document_chunks ADD COLUMN page_number INTEGER DEFAULT 1;")
    except Exception:
        pass

    # 5. Past Questions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS past_questions (
        question_id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        question_number TEXT NOT NULL,
        question_text TEXT NOT NULL,
        total_marks REAL NOT NULL DEFAULT 10.0,
        topic_tag TEXT NOT NULL,
        bloom_level TEXT NOT NULL DEFAULT 'Application',
        FOREIGN KEY (document_id) REFERENCES examination_documents (document_id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE CASCADE
    );
    """)

    # 6. Marking Scheme Criteria
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS marking_scheme_criteria (
        criteria_id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        criterion_step TEXT NOT NULL,
        allocated_marks REAL NOT NULL,
        required_keywords TEXT NOT NULL, -- JSON array string
        deduction_rule TEXT,
        FOREIGN KEY (question_id) REFERENCES past_questions (question_id) ON DELETE CASCADE
    );
    """)

    # 7. Student Profiles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_profiles (
        student_id TEXT PRIMARY KEY,
        matric_number TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        current_level INTEGER NOT NULL DEFAULT 400,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 8. Evaluation Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evaluation_records (
        evaluation_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        submitted_answer TEXT NOT NULL,
        awarded_marks REAL NOT NULL,
        percentage_score REAL NOT NULL,
        qualitative_feedback TEXT NOT NULL,
        criteria_breakdown TEXT, -- JSON array of criteria results
        evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student_profiles (student_id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES past_questions (question_id) ON DELETE CASCADE
    );
    """)

    # 9. Topic Frequencies
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS topic_frequencies (
        topic_id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        topic_name TEXT NOT NULL,
        sessions_examined INTEGER NOT NULL DEFAULT 1,
        last_session_appeared TEXT NOT NULL,
        overdue_probability REAL NOT NULL DEFAULT 0.5,
        FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE CASCADE
    );
    """)

    # 10. Lecturer Feedback Loop & Calibration Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lecturer_feedback (
        feedback_id TEXT PRIMARY KEY,
        lecturer_email TEXT NOT NULL,
        lecturer_name TEXT,
        course_code TEXT NOT NULL,
        target_type TEXT NOT NULL, -- 'qa_answer', 'evaluation_record', 'rubric_criteria'
        target_id TEXT,
        query_text TEXT,
        ai_response TEXT,
        rating INTEGER NOT NULL DEFAULT 5, -- 1-5 stars
        faithfulness_score REAL DEFAULT 1.0,
        is_hallucination BOOLEAN DEFAULT 0,
        feedback_notes TEXT,
        corrected_answer TEXT, -- Lecturer's gold-standard exemplar
        status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'calibrated', 'flagged'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 11. Anti-Hallucination Guardrail Logs & Audit Trail Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS guardrail_logs (
        log_id TEXT PRIMARY KEY,
        query_text TEXT NOT NULL,
        course_code TEXT,
        retrieved_chunks_count INTEGER NOT NULL,
        max_similarity REAL NOT NULL,
        faithfulness_score REAL NOT NULL,
        hallucination_risk TEXT NOT NULL, -- 'LOW_RISK', 'MODERATE_RISK', 'HIGH_RISK'
        guardrail_action TEXT NOT NULL, -- 'ALLOWED', 'CITATION_ATTACHED', 'REFUSAL_ENFORCED', 'FLAGGED'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Ensure default student exists for frictionless user evaluation
    cursor.execute("""
    INSERT OR IGNORE INTO student_profiles (student_id, matric_number, full_name, email, current_level)
    VALUES ('ui-cs-demo-matric-230880', '230880', 'UI Computer Science Student', 'student@cs.ui.edu.ng', 400);
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database tables initialized successfully.")
