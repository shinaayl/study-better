import os
import shutil
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from backend.db.database import get_connection
from backend.pipeline.ingest import ingest_document_file
from backend.config import PERSIST_DIR
from backend.api.routers.auth import get_current_user, require_role

router = APIRouter(prefix="/api/courses", tags=["Courses"])

UPLOAD_DIR = PERSIST_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class CourseCreateRequest(BaseModel):
    course_code: str
    course_title: str
    department: Optional[str] = "Computer Science"
    level: Optional[int] = 300
    semester: Optional[str] = "First Semester"
    credit_units: Optional[int] = 3

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
    ORDER BY c.department ASC, c.level ASC, c.course_code ASC;
    """)
    courses = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"courses": courses}

@router.get("/stats")
def get_knowledge_base_stats():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM courses;")
    total_courses = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT department) FROM courses;")
    total_departments = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM past_questions;")
    total_questions = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM marking_scheme_criteria;")
    total_criteria = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM examination_documents;")
    total_documents = cursor.fetchone()[0]

    cursor.execute("""
    SELECT department, COUNT(*) as courses_count, SUM(credit_units) as total_units
    FROM courses
    GROUP BY department
    ORDER BY courses_count DESC;
    """)
    departments = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "total_courses": total_courses,
        "total_departments": total_departments,
        "total_questions": total_questions,
        "total_criteria": total_criteria,
        "total_documents": total_documents,
        "departments": departments
    }

@router.get("/documents")
def list_ingested_documents():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT ed.document_id, ed.source_filename, ed.source_filename as file_name, ed.document_type, ed.file_size_bytes, ed.ingested_at,
           c.course_code, c.course_title, c.department, s.academic_year as session,
           COUNT(DISTINCT q.question_id) as questions_count,
           COUNT(DISTINCT crit.criteria_id) as criteria_count,
           COUNT(DISTINCT ch.chunk_id) as chunks_count
    FROM examination_documents ed
    JOIN sessions s ON ed.session_id = s.session_id
    JOIN courses c ON s.course_id = c.course_id
    LEFT JOIN past_questions q ON ed.document_id = q.document_id
    LEFT JOIN marking_scheme_criteria crit ON q.question_id = crit.question_id
    LEFT JOIN document_chunks ch ON ed.document_id = ch.document_id
    GROUP BY ed.document_id
    ORDER BY ed.ingested_at DESC;
    """)
    docs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"documents": docs}

@router.post("/upload")
async def upload_course_document(
    file: UploadFile = File(...),
    department: Optional[str] = Form(None),
    course_code: Optional[str] = Form(None),
    course_title: Optional[str] = Form(None),
    level: Optional[int] = Form(None),
    semester: Optional[str] = Form(None),
    session: Optional[str] = Form(None),
    year: Optional[str] = Form(None),
    document_type: Optional[str] = Form(None),
    doc_type: Optional[str] = Form(None),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    # RBAC Route Guard: Only lecturers and admins can ingest course materials
    if current_user and current_user.get("role") == "student":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Only departmental lecturers and examiners have authorization to upload syllabus, past questions, and marking schemes."
        )

    try:
        # Save uploaded file
        clean_filename = file.filename.replace(" ", "_")
        dest_path = UPLOAD_DIR / f"{uuid.uuid4().hex[:8]}_{clean_filename}"
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        metadata_override = {}
        if department:
            metadata_override["department"] = department.strip()
        if course_code:
            metadata_override["course_code"] = course_code.strip().upper()
        if course_title:
            metadata_override["course_title"] = course_title.strip()
        if level:
            metadata_override["level"] = int(level)
        if semester:
            metadata_override["semester"] = semester.strip()
        effective_session = (year or session or "").strip()
        if effective_session:
            metadata_override["session"] = effective_session
            metadata_override["year"] = effective_session
        effective_doc_type = (doc_type or document_type or "").strip()
        if effective_doc_type:
            metadata_override["document_type"] = effective_doc_type
            metadata_override["doc_type"] = effective_doc_type

        # Execute ingestion
        stats = ingest_document_file(str(dest_path), metadata=metadata_override)

        # Standardize document type for Document model
        doc_type_mapping = {
            "past_examination_paper": "past_question",
            "past_question": "past_question",
            "marking_scheme": "marking_scheme",
            "lecture_notes": "lecture_note",
            "lecture_note": "lecture_note",
            "syllabus_guide": "handout",
            "handout": "handout"
        }
        canonical_doc_type = doc_type_mapping.get(document_type or "past_examination_paper", "past_question")

        # Persist Document model record into SQLite
        doc_id = str(uuid.uuid4())
        conn = get_connection()
        cursor = conn.cursor()
        
        # Resolve course_id
        cursor.execute("SELECT course_id FROM courses WHERE course_code = ?;", (stats["course_code"],))
        c_row = cursor.fetchone()
        resolved_cid = c_row["course_id"] if c_row else stats["course_code"]

        cursor.execute("""
            INSERT INTO documents (id, course_id, title, file_url, doc_type)
            VALUES (?, ?, ?, ?, ?);
        """, (doc_id, resolved_cid, file.filename, f"/uploads/{clean_filename}", canonical_doc_type))

        if current_user and current_user.get("user_id"):
            cursor.execute("""
                UPDATE courses SET lecturer_id = ? 
                WHERE course_code = ? AND (lecturer_id IS NULL OR lecturer_id = '');
            """, (current_user["user_id"], stats["course_code"]))

        conn.commit()
        conn.close()

        return {
            "status": "success",
            "message": f"Successfully ingested {file.filename} into {stats['course_code']}",
            "document": {
                "id": doc_id,
                "course_id": resolved_cid,
                "title": file.filename,
                "doc_type": canonical_doc_type,
                "file_url": f"/uploads/{clean_filename}"
            },
            "ingestion_stats": stats
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.post("/create")
def create_course(course: CourseCreateRequest):
    conn = get_connection()
    cursor = conn.cursor()
    code = course.course_code.strip().upper()
    course_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, code))

    try:
        cursor.execute("""
        INSERT INTO courses (course_id, course_code, course_title, department, level, semester, credit_units)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(course_code) DO UPDATE SET
            course_title=excluded.course_title,
            department=excluded.department,
            level=excluded.level,
            semester=excluded.semester,
            credit_units=excluded.credit_units;
        """, (course_id, code, course.course_title, course.department, course.level, course.semester, course.credit_units))
        conn.commit()
    finally:
        conn.close()

    return {"status": "success", "course_id": course_id, "course_code": code}

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
    WHERE UPPER(c.course_code) = ?
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
    result["marking_scheme"] = criteria
    result["question"] = dict(q_row)
    return result

@router.delete("/{course_code}")
def delete_course(course_code: str):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM courses WHERE UPPER(course_code) = ?;", (course_code.upper().strip(),))
        deleted = cursor.rowcount
        conn.commit()
    finally:
        conn.close()

    if deleted == 0:
        raise HTTPException(status_code=404, detail=f"Course {course_code} not found")
    return {"status": "success", "message": f"Deleted course {course_code}"}

@router.get("/documents/{document_id}/chunks")
def get_document_chunks(document_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT chunk_id, chunk_index, chunk_text, token_count, embedding_id, COALESCE(page_number, 1) as page_number
    FROM document_chunks
    WHERE document_id = ?
    ORDER BY chunk_index ASC;
    """, (document_id,))
    chunks = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("""
    SELECT question_id, question_number, question_text, total_marks, topic_tag, bloom_level
    FROM past_questions
    WHERE document_id = ?
    ORDER BY question_number ASC;
    """, (document_id,))
    questions = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    return {
        "document_id": document_id,
        "total_chunks": len(chunks),
        "total_questions": len(questions),
        "chunks": chunks,
        "questions": questions
    }

@router.delete("/documents/{document_id}")
def delete_document(document_id: str, current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    if current_user and current_user.get("role") == "student":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Only departmental lecturers and examiners can delete documents."
        )
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT embedding_id FROM document_chunks WHERE document_id = ?;", (document_id,))
    embedding_ids = [r[0] for r in cursor.fetchall()]
    
    cursor.execute("DELETE FROM examination_documents WHERE document_id = ?;", (document_id,))
    cursor.execute("DELETE FROM documents WHERE id = ?;", (document_id,))
    conn.commit()
    conn.close()
    
    if embedding_ids:
        try:
            from backend.pipeline.vector_store import VectorStoreManager
            vm = VectorStoreManager()
            vm.collection.delete(ids=embedding_ids)
        except Exception as e:
            print(f"Chroma chunk delete error: {e}")
            
    return {
        "status": "success",
        "message": f"Successfully deleted document and purged {len(embedding_ids)} vector chunks from memory."
    }

