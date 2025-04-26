from fastapi import APIRouter, Depends, UploadFile, File, Form
from supabase import Client

from backend.db.supabase import get_db
from backend.schemas.user import ProfileOut, ProfileUpdate
from backend.schemas.response import MessageResponse
from backend.services import user_service

router = APIRouter(tags=["Profile"])

@router.get("/profile", response_model=ProfileOut)
async def get_profile(user_id: str, db: Client = Depends(get_db)) -> ProfileOut:
    return user_service.get_profile(db, user_id)

@router.put("/profile", response_model=MessageResponse)
async def update_profile(
    user_id: str,
    payload: ProfileUpdate,
    db: Client = Depends(get_db),
) -> MessageResponse:
    user_service.update_profile(db, user_id, payload)
    return MessageResponse(message="Profil zaktualizowany")

@router.post("/profile/avatar", response_model=ProfileOut)
async def upload_avatar(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    db: Client = Depends(get_db),
) -> ProfileOut:
    return user_service.upload_avatar(db, user_id, file)
