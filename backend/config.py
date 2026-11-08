import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
DATA_DIR = BASE_DIR / "final year pj data"
PERSIST_DIR = BACKEND_DIR / "data"

PERSIST_DIR.mkdir(parents=True, exist_ok=True)

SQLITE_DB_PATH = PERSIST_DIR / "study_agent.db"
CHROMA_DB_PATH = PERSIST_DIR / "chroma_db"

# Branding & Institutional Defaults
APP_NAME = os.getenv("APP_NAME", "Study Better")
DEFAULT_INSTITUTION = os.getenv("DEFAULT_INSTITUTION", "Higher Institutions & Universities")
DEFAULT_DEPARTMENT = os.getenv("DEFAULT_DEPARTMENT", "Universal Multi-Department Framework")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Google OAuth 2.0 & JWT Security
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
JWT_SECRET = os.getenv("JWT_SECRET", "academic-study-rag-super-secret-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001"
DEFAULT_LLM_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-3.5-flash")

# System parameters
MAX_RETRIEVAL_CHUNKS = 5
SIMILARITY_THRESHOLD = 0.25
MAX_AGENT_ITERATIONS = 5
DEFAULT_STUDENT_ID = "ui-cs-demo-matric-230880"

def get_settings():
    return {
        "app_name": APP_NAME,
        "institution": DEFAULT_INSTITUTION,
        "department": DEFAULT_DEPARTMENT,
        "llm_provider": "gemini" if GEMINI_API_KEY else ("openai" if OPENAI_API_KEY else "offline"),
        "has_gemini_key": bool(GEMINI_API_KEY),
        "has_openai_key": bool(OPENAI_API_KEY),
        "google_client_id": GOOGLE_CLIENT_ID,
        "has_google_client_id": bool(GOOGLE_CLIENT_ID),
        "model": DEFAULT_LLM_MODEL
    }

def update_settings(institution: str = None, department: str = None, gemini_key: str = None, openai_key: str = None, google_client_id: str = None):
    global DEFAULT_INSTITUTION, DEFAULT_DEPARTMENT, GEMINI_API_KEY, OPENAI_API_KEY, GOOGLE_CLIENT_ID
    if institution is not None:
        DEFAULT_INSTITUTION = institution.strip()
    if department is not None:
        DEFAULT_DEPARTMENT = department.strip()
    if gemini_key is not None:
        GEMINI_API_KEY = gemini_key.strip()
    if openai_key is not None:
        OPENAI_API_KEY = openai_key.strip()
    if google_client_id is not None:
        GOOGLE_CLIENT_ID = google_client_id.strip()

