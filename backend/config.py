import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
DATA_DIR = BASE_DIR / "final year pj data"
PERSIST_DIR = BACKEND_DIR / "data"

PERSIST_DIR.mkdir(parents=True, exist_ok=True)

SQLITE_DB_PATH = PERSIST_DIR / "coursegpt.db"
CHROMA_DB_PATH = PERSIST_DIR / "chroma_db"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

DEFAULT_EMBEDDING_MODEL = "all-MiniLM-L6-v2"
DEFAULT_LLM_MODEL = "gemini-2.5-flash"

# System parameters
MAX_RETRIEVAL_CHUNKS = 5
SIMILARITY_THRESHOLD = 0.25
MAX_AGENT_ITERATIONS = 5
DEFAULT_STUDENT_ID = "ui-cs-demo-matric-230880"
