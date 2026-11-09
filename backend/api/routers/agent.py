from fastapi import APIRouter
from agent.agent import CourseAwareAgent 
from agent.tools import AgentTools
from api.schemas import AgentQueryRequest, MockExamRequest

router = APIRouter(prefix="/api/agent", tags=["Agent"])
agent = CourseAwareAgent()
tools = AgentTools()

@router.post("/chat")
def chat_with_agent(req: AgentQueryRequest):
    response = agent.run(
        query=req.query,
        course_code=req.course_code,
        student_id=req.student_id or "ui-cs-demo-matric-230880"
    )
    return response

@router.post("/mock-exam")
def generate_mock_exam(req: MockExamRequest):
    return tools.generate_mock_exam(
        course_code=req.course_code,
        num_questions=req.num_questions
    )
