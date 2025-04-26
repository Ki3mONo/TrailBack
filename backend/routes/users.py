from typing import List, Optional
from fastapi import APIRouter, Depends
from supabase import Client

from backend.db.supabase import get_db
from backend.schemas.user import UserOut
from backend.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserOut])
async def list_users(
    search: Optional[str] = None,
    current_user: Optional[str] = None,
    db: Client = Depends(get_db),
) -> List[UserOut]:
    return user_service.list_users(db, search, current_user)
