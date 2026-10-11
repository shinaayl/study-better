from fastapi import APIRouter, HTTPException
from backend.db.database import get_connection

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.get("")
def list_courses():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.course_id, c.course_code, c.course_title, c.department, c.level, c.semester, c.credit_units,
           COUNT(DISTINCT q.question_id) as questions_count,
           COUNT(DISTINCT s.session_id) as sessions_count
    FROM courses c
    LEFT JOIN past_questions q ON c.course_id = q.course_id
    LEFT JOIN sessions s ON c.course_id = s.course_id
    GROUP BY c.course_id
    ORDER BY c.level ASC, c.course_code ASC;
    """)
    courses = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"courses": courses}

@router.get("/{course_code}/questions")
def get_course_questions(course_code: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT q.question_id, q.question_number, q.question_text, q.total_marks, q.topic_tag, q.bloom_level,
           s.academic_year, ed.document_type, ed.source_filename
    FROM past_questions q
    JOIN courses c ON q.course_id = c.course_id
    JOIN sessions s ON q.session_id = s.session_id
    JOIN examination_documents ed ON q.document_id = ed.document_id
    WHERE c.course_code = ?
    ORDER BY s.academic_year DESC, q.question_number ASC;
    """, (course_code.upper().strip(),))
    questions = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"course_code": course_code.upper().strip(), "questions": questions}

@router.get("/question/{question_id}")
def get_question_details(question_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT q.*, c.course_code, c.course_title, s.academic_year
    FROM past_questions q
    JOIN courses c ON q.course_id = c.course_id
    JOIN sessions s ON q.session_id = s.session_id
    WHERE q.question_id = ?;
    """, (question_id,))
    q_row = cursor.fetchone()
    if not q_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Question not found")
        
    cursor.execute("""
    SELECT * FROM marking_scheme_criteria WHERE question_id = ?;
    """, (question_id,))
    criteria = [dict(r) for r in cursor.fetchall()]
    conn.close()

    result = dict(q_row)
    result["criteria"] = criteria
    return result
