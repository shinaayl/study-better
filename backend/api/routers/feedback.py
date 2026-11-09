import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from db.database import get_connection
from pipeline.vector_store import VectorStoreManager

router = APIRouter(prefix="/api", tags=["Quality Control & Lecturer Feedback"])

class FeedbackSubmitRequest(BaseModel):
    lecturer_email: str = Field(..., description="Email of the reviewer or student")
    lecturer_name: Optional[str] = Field("Academic Reviewer", description="Name of the reviewer")
    course_code: str = Field(..., description="Course code (e.g. CSC 321)")
    target_type: Optional[str] = Field("qa_answer", description="'qa_answer', 'evaluation_record', 'rubric_criteria'")
    target_id: Optional[str] = Field(None, description="Optional target ID or log ID")
    query_text: Optional[str] = Field("", description="Student query or past question text")
    ai_response: Optional[str] = Field("", description="AI generated answer being reviewed")
    rating: int = Field(5, ge=1, le=5, description="Quality rating from 1 to 5 stars")
    faithfulness_score: Optional[float] = Field(1.0, ge=0.0, le=1.0, description="Faithfulness / grounding score")
    is_hallucination: Optional[bool] = Field(False, description="Flag indicating if the response contained hallucinations")
    feedback_notes: Optional[str] = Field("", description="Lecturer feedback comments, critique, or rubric notes")
    corrected_answer: Optional[str] = Field(None, description="Lecturer's gold-standard corrected exemplar")
    status: Optional[str] = Field(None, description="'pending', 'approved', 'calibrated', 'flagged'")

class FeedbackStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="'approved', 'calibrated', 'flagged', 'rejected'")

class FeedbackCalibrateRequest(BaseModel):
    corrected_answer: str = Field(..., description="Lecturer gold-standard corrected exemplar")
    lecturer_email: Optional[str] = Field(None, description="Reviewer email")
    lecturer_name: Optional[str] = Field(None, description="Reviewer name")

def index_calibrated_exemplar_in_vector_store(
    feedback_id: str,
    course_code: str,
    query_text: str,
    corrected_answer: str,
    lecturer_name: str
):
    """
    Closes the Lecturer Feedback Loop:
    Embeds and indexes the lecturer's verified gold-standard solution into ChromaDB
    so future student queries on this topic retrieve the verified exemplar with top priority.
    """
    clean_course = (course_code or "CSC").strip().upper()
    exemplar_text = (
        f"Verified Lecturer Gold-Standard Solution for {clean_course}:\n"
        f"Examination Problem / Query:\n{query_text.strip()}\n\n"
        f"Lecturer Model Answer & Marking Rubric:\n{corrected_answer.strip()}"
    )

    chunk_id = f"calib-{feedback_id[:8]}"
    metadata = {
        "document_id": f"calibrated-{feedback_id}",
        "document_title": f"Lecturer Verified Solution ({clean_course})",
        "source_filename": f"lecturer_calibrated_{clean_course.replace(' ', '_')}.md",
        "page_number": 1,
        "doc_type": "lecturer_calibrated_exemplar",
        "course_code": clean_course,
        "academic_year": "Calibrated Exemplar",
        "citation": f"[{clean_course} · Verified Lecturer Exemplar · {lecturer_name}]"
    }

    try:
        vm = VectorStoreManager()
        vm.add_chunks(
            chunks=[exemplar_text],
            metadatas=[metadata],
            ids=[chunk_id]
        )
    except Exception as e:
        print(f"[FeedbackRouter] Warning: Vector store calibration indexing: {e}")

@router.post("/feedback/submit")
def submit_feedback(req: FeedbackSubmitRequest):
    """
    Submits feedback on an AI response, evaluation, or rubric.
    Supports rating (1-5), hallucination reporting, and lecturer calibration exemplars.
    """
    clean_course = req.course_code.strip().upper()
    feedback_id = str(uuid.uuid4())

    # Determine status if not explicitly given
    if req.status:
        status = req.status
    elif req.corrected_answer and req.corrected_answer.strip():
        status = "calibrated"
    elif req.is_hallucination or req.rating <= 2:
        status = "flagged"
    else:
        status = "approved"

    corrected = req.corrected_answer.strip() if req.corrected_answer else None

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO lecturer_feedback (
            feedback_id, lecturer_email, lecturer_name, course_code,
            target_type, target_id, query_text, ai_response, rating,
            faithfulness_score, is_hallucination, feedback_notes,
            corrected_answer, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (
            feedback_id,
            req.lecturer_email.strip(),
            (req.lecturer_name or "Academic Reviewer").strip(),
            clean_course,
            req.target_type or "qa_answer",
            req.target_id,
            (req.query_text or "").strip(),
            (req.ai_response or "").strip(),
            req.rating,
            float(req.faithfulness_score or 1.0),
            1 if req.is_hallucination else 0,
            (req.feedback_notes or "").strip(),
            corrected,
            status,
            datetime.now(timezone.utc).isoformat()
        )
    )
    conn.commit()
    conn.close()

    # If calibrated, index into vector store
    if status == "calibrated" and corrected:
        index_calibrated_exemplar_in_vector_store(
            feedback_id=feedback_id,
            course_code=clean_course,
            query_text=req.query_text or "General Concept",
            corrected_answer=corrected,
            lecturer_name=req.lecturer_name or "Lecturer"
        )

    return {
        "status": "success",
        "feedback_id": feedback_id,
        "record_status": status,
        "is_calibrated": status == "calibrated"
    }

@router.get("/feedback/list")
def list_feedback(
    course_code: Optional[str] = Query(None, description="Filter by course code"),
    status: Optional[str] = Query(None, description="'all', 'flagged', 'pending', 'approved', 'calibrated'"),
    is_hallucination: Optional[bool] = Query(None, description="Filter by hallucination flag"),
    target_type: Optional[str] = Query(None, description="Filter by target type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Retrieves list of lecturer and student feedback entries."""
    conn = get_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if course_code and course_code.strip():
        conditions.append("UPPER(course_code) = ?")
        params.append(course_code.strip().upper())

    if status and status.strip() and status != "all":
        conditions.append("status = ?")
        params.append(status.strip().lower())

    if is_hallucination is not None:
        conditions.append("is_hallucination = ?")
        params.append(1 if is_hallucination else 0)

    if target_type and target_type.strip():
        conditions.append("target_type = ?")
        params.append(target_type.strip())

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    cursor.execute(f"SELECT COUNT(*) as total FROM lecturer_feedback {where_clause};", tuple(params))
    total_count = cursor.fetchone()["total"]

    query = f"""
        SELECT * FROM lecturer_feedback
        {where_clause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
    """
    cursor.execute(query, tuple(params + [limit, offset]))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    # Convert is_hallucination integer to boolean
    for r in rows:
        r["is_hallucination"] = bool(r.get("is_hallucination"))

    return {
        "total_count": total_count,
        "feedback": rows
    }

@router.post("/feedback/{feedback_id}/status")
def update_feedback_status(feedback_id: str, req: FeedbackStatusUpdateRequest):
    """Updates feedback status ('approved', 'calibrated', 'flagged', 'rejected')."""
    valid_statuses = {"approved", "calibrated", "flagged", "rejected", "pending"}
    st = req.status.strip().lower()
    if st not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE lecturer_feedback SET status = ? WHERE feedback_id = ?;", (st, feedback_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Feedback record not found")
    conn.commit()
    conn.close()

    return {"status": "success", "feedback_id": feedback_id, "updated_status": st}

@router.post("/feedback/{feedback_id}/calibrate")
def calibrate_feedback(feedback_id: str, req: FeedbackCalibrateRequest):
    """
    Lecturer Calibration Endpoint:
    Accepts the lecturer's corrected answer, sets status to 'calibrated',
    and embeds the exemplar into the institutional knowledge base.
    """
    if not req.corrected_answer or not req.corrected_answer.strip():
        raise HTTPException(status_code=400, detail="corrected_answer cannot be empty.")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lecturer_feedback WHERE feedback_id = ?;", (feedback_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Feedback record not found.")

    record = dict(row)
    course_code = record.get("course_code") or "CSC"
    query_text = record.get("query_text") or "General Concept"
    lecturer_name = req.lecturer_name or record.get("lecturer_name") or "Department Lecturer"

    cursor.execute(
        """
        UPDATE lecturer_feedback 
        SET corrected_answer = ?, status = 'calibrated',
            lecturer_name = COALESCE(?, lecturer_name),
            lecturer_email = COALESCE(?, lecturer_email)
        WHERE feedback_id = ?;
        """,
        (req.corrected_answer.strip(), req.lecturer_name, req.lecturer_email, feedback_id)
    )
    conn.commit()
    conn.close()

    # Embed and index into vector store
    index_calibrated_exemplar_in_vector_store(
        feedback_id=feedback_id,
        course_code=course_code,
        query_text=query_text,
        corrected_answer=req.corrected_answer.strip(),
        lecturer_name=lecturer_name
    )

    return {
        "status": "success",
        "message": f"Successfully calibrated exemplar for {course_code} into knowledge base.",
        "feedback_id": feedback_id,
        "calibrated_status": "calibrated"
    }

@router.get("/guardrails/logs")
def list_guardrail_logs(
    course_code: Optional[str] = Query(None, description="Filter by course code"),
    hallucination_risk: Optional[str] = Query(None, description="'LOW_RISK', 'MODERATE_RISK', 'HIGH_RISK'"),
    guardrail_action: Optional[str] = Query(None, description="'ALLOWED', 'CITATION_ATTACHED', 'REFUSAL_ENFORCED', 'FLAGGED'"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Retrieves guardrail verification audit logs."""
    conn = get_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if course_code and course_code.strip():
        conditions.append("UPPER(course_code) = ?")
        params.append(course_code.strip().upper())

    if hallucination_risk and hallucination_risk.strip():
        conditions.append("hallucination_risk = ?")
        params.append(hallucination_risk.strip().upper())

    if guardrail_action and guardrail_action.strip():
        conditions.append("guardrail_action = ?")
        params.append(guardrail_action.strip().upper())

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    cursor.execute(f"SELECT COUNT(*) as total FROM guardrail_logs {where_clause};", tuple(params))
    total_count = cursor.fetchone()["total"]

    query = f"""
        SELECT * FROM guardrail_logs
        {where_clause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
    """
    cursor.execute(query, tuple(params + [limit, offset]))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "total_count": total_count,
        "logs": rows
    }

@router.get("/guardrails/metrics")
def get_guardrail_metrics():
    """
    Aggregates Quality Control & Anti-Hallucination Guardrail metrics
    for lecturer and administrator dashboards.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Total guardrail logs
    cursor.execute("SELECT COUNT(*) as total, AVG(faithfulness_score) as avg_faith, AVG(max_similarity) as avg_sim FROM guardrail_logs;")
    g_row = cursor.fetchone()
    total_audits = g_row["total"] or 0
    avg_faithfulness = round(float(g_row["avg_faith"] or 0.0), 4)
    avg_similarity = round(float(g_row["avg_sim"] or 0.0), 4)

    # 2. Risk breakdown
    cursor.execute("SELECT hallucination_risk, COUNT(*) as count FROM guardrail_logs GROUP BY hallucination_risk;")
    risk_breakdown = {r["hallucination_risk"]: r["count"] for r in cursor.fetchall()}

    # 3. Guardrail actions breakdown
    cursor.execute("SELECT guardrail_action, COUNT(*) as count FROM guardrail_logs GROUP BY guardrail_action;")
    actions_breakdown = {r["guardrail_action"]: r["count"] for r in cursor.fetchall()}

    # 4. Hallucination prevention rate
    # Percentage of audits that were safe (LOW_RISK, or safe refusals, or allowed with citations)
    safe_actions_count = actions_breakdown.get("ALLOWED", 0) + actions_breakdown.get("CITATION_ATTACHED", 0) + actions_breakdown.get("REFUSAL_ENFORCED", 0)
    prevention_rate = round((safe_actions_count / total_audits * 100.0) if total_audits > 0 else 100.0, 1)

    # 5. Feedback metrics
    cursor.execute("SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM lecturer_feedback;")
    f_row = cursor.fetchone()
    total_feedback = f_row["total"] or 0
    avg_rating = round(float(f_row["avg_rating"] or 5.0), 2)

    cursor.execute("SELECT COUNT(*) as flagged FROM lecturer_feedback WHERE is_hallucination = 1;")
    flagged_hallucinations = cursor.fetchone()["flagged"] or 0

    cursor.execute("SELECT COUNT(*) as calibrated FROM lecturer_feedback WHERE status = 'calibrated';")
    calibrated_exemplars = cursor.fetchone()["calibrated"] or 0

    conn.close()

    return {
        "status": "healthy",
        "total_audits": total_audits,
        "hallucination_prevention_rate": prevention_rate,
        "avg_faithfulness_score": avg_faithfulness,
        "avg_similarity": avg_similarity,
        "risk_breakdown": {
            "LOW_RISK": risk_breakdown.get("LOW_RISK", 0),
            "MODERATE_RISK": risk_breakdown.get("MODERATE_RISK", 0),
            "HIGH_RISK": risk_breakdown.get("HIGH_RISK", 0)
        },
        "actions_breakdown": {
            "ALLOWED": actions_breakdown.get("ALLOWED", 0),
            "CITATION_ATTACHED": actions_breakdown.get("CITATION_ATTACHED", 0),
            "REFUSAL_ENFORCED": actions_breakdown.get("REFUSAL_ENFORCED", 0),
            "FLAGGED": actions_breakdown.get("FLAGGED", 0)
        },
        "feedback_summary": {
            "total_feedback": total_feedback,
            "avg_rating": avg_rating,
            "flagged_hallucinations": flagged_hallucinations,
            "calibrated_exemplars": calibrated_exemplars
        }
    }
