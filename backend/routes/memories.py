from datetime import datetime
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File
from supabase import Client

from backend.db.supabase import get_db
from backend.schemas.memory import MemoryCreate, MemoryOut, MemoryShareOut
from backend.schemas.response import MessageResponse
from backend.services import memory_service
from backend.services.photo_service import upload_photo_to_memory

router = APIRouter(prefix="/memories", tags=["Memories"])

@router.get("/", response_model=List[MemoryOut])
async def list_memories(user_id: str, db: Client = Depends(get_db)) -> List[MemoryOut]:
    return memory_service.list_memories(db, user_id)

@router.get("/shared", response_model=List[MemoryOut])
async def list_shared_memories(user_id: str, db: Client = Depends(get_db)) -> List[MemoryOut]:
    return memory_service.list_shared_memories(db, user_id)

@router.get("/{memory_id}/shares", response_model=List[MemoryShareOut])
async def get_shares(memory_id: str, db: Client = Depends(get_db)) -> List[MemoryShareOut]:
    return memory_service.get_shares(db, memory_id)

@router.post("/", response_model=MemoryOut, status_code=status.HTTP_201_CREATED)
async def create_memory(payload: MemoryCreate, db: Client = Depends(get_db)) -> MemoryOut:
    return memory_service.create_memory(db, payload)

@router.post("/{memory_id}/upload-photo", status_code=status.HTTP_201_CREATED)
async def upload_memory_photo(
    memory_id: str,
    user_id: str,
    file: UploadFile = File(...),
    db: Client = Depends(get_db),
) -> dict:
    try:
        url, _ = upload_photo_to_memory(db, memory_id, user_id, file)
        return {"url": url}
    except Exception:
        raise HTTPException(status_code=500, detail="Nie udało się dodać zdjęcia")

@router.put("/{memory_id}/edit", response_model=MessageResponse)
async def edit_memory(
    memory_id: str,
    payload: Dict[str, Any] = Body(...),
    user_id: str = "",
    db: Client = Depends(get_db),
) -> MessageResponse:
    try:
        memory_service.edit_memory(db, memory_id, payload, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return MessageResponse(message="Wspomnienie zaktualizowane")

@router.delete("/{memory_id}", response_model=MessageResponse)
async def delete_memory(memory_id: str, user_id: str, db: Client = Depends(get_db)) -> MessageResponse:
    try:
        memory_service.delete_memory(db, memory_id, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return MessageResponse(message="Wspomnienie usunięte")

@router.post("/{memory_id}/share-user", response_model=MessageResponse)
async def share_memory_with_user(
    memory_id: str,
    shared_with: str,
    shared_by: str,
    db: Client = Depends(get_db),
) -> MessageResponse:
    try:
        memory_service.share_memory_with_user(db, memory_id, shared_with, shared_by)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return MessageResponse(message="Użytkownik dodany do wspomnienia")

@router.delete("/{memory_id}/share-user/{shared_with}", response_model=MessageResponse)
async def unshare_memory(memory_id: str, shared_with: str, db: Client = Depends(get_db)) -> MessageResponse:
    memory_service.unshare_memory(db, memory_id, shared_with)
    return MessageResponse(message="Udostępnienie usunięte")
