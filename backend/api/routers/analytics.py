from typing import Optional
from fastapi import APIRouter
from backend.agent.tools import AgentTools

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
tools = AgentTools()

@router.get("/heatmap")
def get_topic_heatmap(course_code: Optional[str] = None):
    return tools.show_topic_heatmap(course_code=course_code)

@router.get("/weak-areas/{student_id}")
def get_student_weak_areas(student_id: str, course_code: Optional[str] = None):
    return tools.flag_weak_areas(student_id=student_id, course_code=course_code)
