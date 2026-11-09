import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import agent, courses, evaluation, analytics, settings, auth, chat, feedback
from db.database import init_db
import config as cfg

app = FastAPI(
    title="Study Better API",
    description="Study Better: Universal Multi-Department Course-Aware Revision & Rubric Evaluation Framework",
    version="2.0.0"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(chat.router)
app.include_router(agent.router)
app.include_router(courses.router)
app.include_router(evaluation.router)
app.include_router(analytics.router)
app.include_router(settings.router)
app.include_router(auth.router)
app.include_router(feedback.router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": cfg.APP_NAME,
        "institution": cfg.DEFAULT_INSTITUTION,
        "department": cfg.DEFAULT_DEPARTMENT
    }

@app.get("/api/info")
def system_info():
    return {
        "title": f"{cfg.APP_NAME}: Multi-Department Course-Aware Revision Framework",
        "version": "2.0.0",
        "institution": cfg.DEFAULT_INSTITUTION,
        "features": [
            "ReAct Reasoning Agent Loop with Conversational Awareness",
            "Dense RAG ChromaDB Retrieval with Strict Anti-Hallucination Guardrails",
            "Universal Multi-Department Knowledge Base & Document Ingestion",
            "Automated Rubric Evaluation Engine with Keyword Diagnostics",
            "Authentic Mock Examination Generator",
            "Topic Recurrence Heatmap & Overdue Statistical Predictor",
            "Student Diagnostic & Weak Area Performance Tracker"
        ]
    }

from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/") or full_path == "api" or full_path == "health":
            return {"error": "Not found"}
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=True)
