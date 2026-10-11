from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class AgentQueryRequest(BaseModel):
    query: str = Field(..., description="Student natural language prompt or past question query")
    course_code: Optional[str] = Field(None, description="Course code filter e.g. CSC 321")
    student_id: Optional[str] = Field("ui-cs-demo-matric-230880", description="Student identifier")

class EvaluationSubmitRequest(BaseModel):
    student_answer: str = Field(..., description="Student draft answer text to evaluate")
    question_id: Optional[str] = Field(None, description="Specific past question ID")
    question_text: Optional[str] = Field(None, description="Question prompt if ID is unavailable")
    course_code: Optional[str] = Field(None, description="Course code")
    student_id: Optional[str] = Field("ui-cs-demo-matric-230880", description="Student matric identifier")

class MockExamRequest(BaseModel):
    course_code: str = Field(..., description="Course code e.g. CSC 321, CSC 231")
    num_questions: int = Field(3, description="Number of past paper questions to assemble")

class CourseResponse(BaseModel):
    course_id: str
    course_code: str
    course_title: str
    department: str
    level: int
    semester: str
    credit_units: int
