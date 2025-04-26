from typing import List, Dict, Tuple

from fastapi import APIRouter, Depends, File, UploadFile, status, HTTPException
from supabase import Client

from backend.db.supabase import get_db
from backend.schemas.photo import PhotoCreate, PhotoOut
from backend.schemas.response import MessageResponse
from backend.services import photo_service

router = APIRouter(prefix="/photos", tags=["Photos"])

@router.get("/", response_model=List[PhotoOut])
async def list_photos(memory_id: str, db: Client = Depends(get_db)) -> List[PhotoOut]:
    return photo_service.list_photos(db, memory_id)

@router.post("/", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
async def add_photo(payload: PhotoCreate, db: Client = Depends(get_db)) -> PhotoOut:
    return photo_service.create_photo(db, payload)

@router.post("/{memory_id}/upload", status_code=status.HTTP_201_CREATED)
async def upload_photo(
    memory_id: str,
    user_id: str,
    file: UploadFile = File(...),
    db: Client = Depends(get_db),
) -> dict:
    url, record = photo_service.upload_photo(db, memory_id, user_id, file)
    return {"url": url, "record": record}

@router.delete("/{photo_id}", response_model=MessageResponse)
async def delete_photo(
    photo_id: str,
    user_id: str,
    db: Client = Depends(get_db)
) -> MessageResponse:
    try:
        photo_service.delete_photo(db, photo_id, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return MessageResponse(message="Zdjęcie usunięte")
