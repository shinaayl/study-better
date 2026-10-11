import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import agent, courses, evaluation, analytics
from backend.db.database import init_db

app = FastAPI(
    title="CourseGPT API",
    description="Course-Aware AI Study Agent for Computer Science Students at the University of Ibadan",
    version="1.0.0"
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
app.include_router(agent.router)
app.include_router(courses.router)
app.include_router(evaluation.router)
app.include_router(analytics.router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": "CourseGPT",
        "institution": "University of Ibadan",
        "department": "Computer Science"
    }

@app.get("/api/info")
def system_info():
    return {
        "title": "CourseGPT: Course-Aware AI Study Agent",
        "version": "1.0.0",
        "session_coverage": "2019/2020 - 2023/2024 (5 Sessions)",
        "features": [
            "ReAct Reasoning Agent Loop",
            "Dense RAG ChromaDB Retrieval",
            "Automated Rubric Evaluation Engine",
            "Mock Examination Generator",
            "Topic Recurrence Heatmap & Overdue Predictor",
            "Weak Area Diagnostic Tracker"
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
