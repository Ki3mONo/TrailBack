from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from supabase import Client

from backend.db.supabase import get_db
from backend.schemas.friend import FriendOut
from backend.schemas.response import MessageResponse
from backend.services import friend_service

router = APIRouter(prefix="/friends", tags=["Friends"])

@router.get("/", response_model=List[FriendOut])
async def list_friends(user_id: str, db: Client = Depends(get_db)) -> List[FriendOut]:
    return friend_service.list_friends(db, user_id)

@router.post("/request", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_friend_request(user_id: str, friend_id: str, db: Client = Depends(get_db)) -> MessageResponse:
    friend_service.send_request(db, user_id, friend_id)
    return MessageResponse(message="Zaproszenie wysłane")

@router.post("/accept", response_model=MessageResponse)
async def accept_friend_request(user_id: str, friend_id: str, db: Client = Depends(get_db)) -> MessageResponse:
    friend_service.accept_request(db, user_id, friend_id)
    return MessageResponse(message="Zaproszenie zaakceptowane")

@router.delete("/remove", response_model=MessageResponse)
async def remove_friend(user_id: str, friend_id: str, db: Client = Depends(get_db)) -> MessageResponse:
    friend_service.remove_friend(db, user_id, friend_id)
    return MessageResponse(message="Znajomy usunięty")
