import json
from fastapi import APIRouter
from agent.tools import AgentTools
from api.schemas import EvaluationSubmitRequest
from db.database import get_connection

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation"])
tools = AgentTools()

@router.post("/submit")
def submit_student_answer(req: EvaluationSubmitRequest):
    result = tools.score_student_answer(
        student_answer=req.student_answer,
        question_id=req.question_id,
        question_text=req.question_text,
        student_id=req.student_id or "ui-cs-demo-matric-230880"
    )
    return result

@router.get("/history/{student_id}")
def get_evaluation_history(student_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT er.*, q.question_number, q.question_text, q.topic_tag, c.course_code, c.course_title
    FROM evaluation_records er
    JOIN past_questions q ON er.question_id = q.question_id
    JOIN courses c ON q.course_id = c.course_id
    WHERE er.student_id = ?
    ORDER BY er.evaluated_at DESC;
    """, (student_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    # Parse criteria_breakdown JSON
    for r in rows:
        if r.get("criteria_breakdown"):
            try:
                r["criteria_breakdown"] = json.loads(r["criteria_breakdown"])
            except Exception:
                pass
                
    return {"history": rows}
