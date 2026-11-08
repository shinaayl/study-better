from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import backend.config as cfg

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdateRequest(BaseModel):
    institution: Optional[str] = None
    department: Optional[str] = None
    gemini_key: Optional[str] = None
    openai_key: Optional[str] = None

@router.get("")
def get_system_settings():
    return cfg.get_settings()

@router.post("")
def update_system_settings(req: SettingsUpdateRequest):
    cfg.update_settings(
        institution=req.institution,
        department=req.department,
        gemini_key=req.gemini_key,
        openai_key=req.openai_key
    )
    return {
        "status": "success",
        "message": "Settings updated successfully",
        "settings": cfg.get_settings()
    }
