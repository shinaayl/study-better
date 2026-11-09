from fastapi import APIRouter, Request, Query, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import json

from agent.rag_query_engine import RAGQueryEngine

router = APIRouter(prefix="/api/chat", tags=["Chat & RAG Query"])
rag_engine = RAGQueryEngine()

class ChatQueryRequest(BaseModel):
    student_message: str = Field(..., description="Student prompt, past question, or concept query")
    course_id: Optional[str] = Field(None, description="Course identifier or course code (e.g., 'CSC 321', 'MTH 201')")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="List of prior message objects: [{'role': 'user'|'assistant', 'content': '...'}]"
    )
    stream: Optional[bool] = Field(True, description="Whether to stream the response via Server-Sent Events (SSE)")

@router.post("/query")
async def chat_query_post(req: ChatQueryRequest):
    """
    RAG Query Endpoint:
    1. Accepts student_message, course_id, and conversation_history.
    2. Embeds student_message using text-embedding-004.
    3. Retrieves top 5 most similar chunks from ChromaDB filtered by course_id.
    4. Streams real-time tokens generated via Gemini API (gemini-1.5-pro) along with sources.
    """
    if not req.student_message or not req.student_message.strip():
        raise HTTPException(status_code=400, detail="student_message cannot be empty.")

    if req.stream:
        # Return Server-Sent Events (SSE) streaming response
        return StreamingResponse(
            rag_engine.generate_streaming_response(
                student_message=req.student_message.strip(),
                course_id=req.course_id,
                conversation_history=req.conversation_history
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    if not req.stream:
        # Auto-detect course code from message or rely on agent memory
        if not req.course_id:
            detected_code = rag_engine.extract_course_code_from_text(req.student_message)
            course_meta = rag_engine.resolve_course(detected_code) if detected_code else None
            course_code = course_meta.get("course_code") if course_meta else detected_code
        else:
            course_meta = rag_engine.resolve_course(req.course_id)
            course_code = course_meta.get("course_code") if course_meta else (req.course_id if not req.course_id.startswith("all") else None)

        # 1. Query Intent Guard: Check if input is casual conversation, greeting, or meta-question
        if rag_engine.is_casual_or_greeting(req.student_message):
            # SKIP vector database retrieval entirely. Pass conversational prompt to Gemini.
            full_answer = ""
            if rag_engine.client:
                try:
                    prompt = rag_engine.build_conversational_greeting_prompt(
                        student_message=req.student_message.strip(),
                        course_meta=course_meta,
                        conversation_history=req.conversation_history
                    )
                    models_to_try = [rag_engine.model_name, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]
                    for m in models_to_try:
                        try:
                            res = rag_engine.client.models.generate_content(
                                model=m,
                                contents=prompt
                            )
                            if res and res.text:
                                full_answer = res.text.replace("*", "").strip()
                                break
                        except Exception:
                            continue
                except Exception as e:
                    print(f"[ChatRouter] Gemini greeting generation notice: {e}")

            if not full_answer:
                full_answer = rag_engine.generate_conversational_greeting_reply(req.student_message, course_meta)

            guardrail_res = rag_engine.guardrail_engine.audit_query_and_response(
                query=req.student_message.strip(),
                course_code=course_code,
                retrieved_chunks=[],
                response_text=full_answer
            )
            guardrail_res["hallucination_risk"] = "LOW_RISK"
            guardrail_res["guardrail_action"] = "ALLOWED"
            guardrail_res["faithfulness_score"] = 1.0

            return {
                "status": "success",
                "course": course_meta,
                "answer": full_answer,
                "sources": [],
                "guardrail": guardrail_res
            }

        # 2. Academic query: retrieve top chunks
        chunks = rag_engine.retrieve_top_chunks(
            student_message=req.student_message.strip(),
            course_id=course_code,
            top_k=5
        )

        if not chunks:
            explicit_code = rag_engine.extract_course_code_from_text(req.student_message)
            if explicit_code:
                refusal_text = (
                    f"I don't have information about that question for {explicit_code} in the verified course materials.\n\n"
                    "To maintain academic integrity and prevent misinformation, I only provide answers directly grounded in official past examination papers, lecture notes, and marking schemes uploaded by course lecturers. "
                    f"Once your lecturer uploads the materials or marking guide for {explicit_code}, I will be able to answer questions and break down solutions for it."
                )
                ret_course = course_meta
            else:
                refusal_text = (
                    "I don't have information about that in the verified course materials.\n\n"
                    "To maintain academic integrity and prevent misinformation, I only provide answers directly grounded in official past examination papers, lecture notes, and marking schemes uploaded by course lecturers. "
                    "Once a lecturer uploads the relevant lecture notes, syllabus materials, or marking schemes into Study Better, I will be able to answer questions and break down solutions on that topic."
                )
                ret_course = None

            guardrail_res = rag_engine.guardrail_engine.audit_query_and_response(
                query=req.student_message.strip(),
                course_code=explicit_code or None,
                retrieved_chunks=[],
                response_text=refusal_text
            )
            guardrail_res["hallucination_risk"] = "LOW_RISK"
            guardrail_res["guardrail_action"] = "REFUSAL_ENFORCED"
            guardrail_res["faithfulness_score"] = 1.0

            return {
                "status": "success",
                "course": ret_course,
                "answer": refusal_text,
                "sources": [],
                "guardrail": guardrail_res
            }

        # Auto-resolve course context from top retrieved chunk in agent memory if not set
        if not course_meta and chunks and chunks[0].get("course_code"):
            course_meta = rag_engine.resolve_course(chunks[0]["course_code"])
            course_code = course_meta.get("course_code") if course_meta else chunks[0]["course_code"]
        prompt = rag_engine.build_prompt(
            student_message=req.student_message.strip(),
            course_meta=course_meta,
            retrieved_chunks=chunks,
            conversation_history=req.conversation_history
        )

        full_answer = ""
        if rag_engine.client:
            for m in [rag_engine.model_name, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]:
                try:
                    res = rag_engine.client.models.generate_content(
                        model=m,
                        contents=prompt
                    )
                    if res and res.text:
                        full_answer = res.text
                        break
                except Exception as e:
                    print(f"[ChatRouter] Gemini sync attempt on {m} notice: {e}")

        if not full_answer:
            full_answer = rag_engine._synthesize_grounded_offline_response(
                query=req.student_message.strip(),
                course_meta=course_meta,
                chunks=chunks
            )

        # Audit with guardrail engine
        guardrail_res = rag_engine.guardrail_engine.audit_query_and_response(
            query=req.student_message.strip(),
            course_code=course_code,
            retrieved_chunks=chunks,
            response_text=full_answer
        )

        return {
            "status": "success",
            "course": course_meta,
            "answer": full_answer,
            "sources": [
                {
                    "chunk_id": c["chunk_id"],
                    "document_title": c["document_title"],
                    "source_filename": c["source_filename"],
                    "page_number": c["page_number"],
                    "doc_type": c["doc_type"],
                    "course_code": c["course_code"],
                    "academic_year": c["academic_year"],
                    "similarity": c["similarity"],
                    "citation": c["citation"],
                    "snippet": c["text"][:240] + ("..." if len(c["text"]) > 240 else "")
                }
                for c in chunks
            ],
            "guardrail": guardrail_res
        }

@router.get("/query")
async def chat_query_get(
    student_message: str = Query(..., description="Student query"),
    course_id: Optional[str] = Query(None, description="Course ID or Course Code")
):
    """GET endpoint supporting browser native EventSource SSE connections."""
    return StreamingResponse(
        rag_engine.generate_streaming_response(
            student_message=student_message.strip(),
            course_id=course_id,
            conversation_history=[]
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
