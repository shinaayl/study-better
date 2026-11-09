import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent
for _p in (str(_PROJECT_ROOT), str(_BACKEND_DIR)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from backend.api.main import app
