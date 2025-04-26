from typing import List, Optional
from fastapi import UploadFile
from supabase import Client

from backend.schemas.user import ProfileOut, ProfileUpdate, UserOut

PROFILE_TABLE = "profiles"
USER_VIEW = "user_profiles_view"

def list_users(db: Client, search: Optional[str], current_user: Optional[str]) -> List[UserOut]:
    """List users optionally filtered by search query, excluding the current user."""
    query = db.table(USER_VIEW).select("id, email, username, full_name, avatar_url")
    if search:
        query = query.filter("username", "ilike", f"%{search}%")
    rows = query.execute().data or []
    if current_user:
        rows = [r for r in rows if r["id"] != current_user]
    return [UserOut(**r) for r in rows]

def get_profile(db: Client, user_id: str) -> ProfileOut:
    """Retrieve the profile information for a user."""
    resp = (
        db.table(PROFILE_TABLE)
        .select("id, username, full_name, avatar_url")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise ValueError("Profile not found")
    return ProfileOut(**resp.data)

def update_profile(db: Client, user_id: str, payload: ProfileUpdate) -> None:
    """Update the user's profile with provided fields."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not data:
        raise ValueError("Nothing to update")
    db.table(PROFILE_TABLE).update(data).eq("id", user_id).execute()

def upload_avatar(db: Client, user_id: str, file: UploadFile) -> ProfileOut:
    """Upload a new avatar for the user and update profile."""
    contents = file.file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png"):
        raise ValueError("Only JPG/PNG allowed")

    bucket = "avatars"
    key = f"{user_id}/{file.filename}"
    storage = db.storage.from_(bucket)
    resp = storage.upload(key, contents, {"contentType": file.content_type})
    if resp and getattr(resp, "status_code", 200) >= 400:
        raise RuntimeError("Upload failed")

    url = storage.get_public_url(key)
    if not url:
        raise RuntimeError("Cannot fetch public URL")

    db.table(PROFILE_TABLE).update({"avatar_url": url}).eq("id", user_id).execute()
    return get_profile(db, user_id)
