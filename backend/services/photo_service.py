from typing import List, Tuple
from fastapi import UploadFile
from supabase import Client

from backend.schemas.photo import PhotoCreate, PhotoOut
from backend.utils.storage import upload_file, delete_file

BUCKET = "photos"

def list_photos(db: Client, memory_id: str) -> List[PhotoOut]:
    """Return all photos related to a given memory."""
    rows = db.table("photos").select("*").eq("memory_id", memory_id).execute().data
    return [PhotoOut(**r) for r in rows]

def create_photo(db: Client, data: PhotoCreate) -> PhotoOut:
    """Insert a photo record into the database."""
    row = db.table("photos").insert(data.model_dump()).execute().data[0]
    return PhotoOut(**row)

def upload_photo_to_memory(db: Client, memory_id: str, user_id: str, file: UploadFile) -> Tuple[str, PhotoOut]:
    """Upload a photo file to storage and create a related photo record."""
    url = upload_file(db, BUCKET, memory_id, file.filename, file.file.read(), file.content_type)
    record = create_photo(db, PhotoCreate(memory_id=memory_id, url=url, uploaded_by=user_id))
    return url, record

def delete_photo(db: Client, photo_id: str, user_id: str) -> None:
    """Delete a photo if the user has permission."""
    photo = db.table("photos").select("url, memory_id, uploaded_by").eq("id", photo_id).single().execute().data
    if not photo:
        raise ValueError("Zdjęcie nie istnieje")

    memory_id = photo["memory_id"]
    uploaded_by = photo["uploaded_by"]

    memory = db.table("memories").select("created_by").eq("id", memory_id).single().execute().data
    if not memory:
        raise ValueError("Wspomnienie nie istnieje")

    memory_owner = memory["created_by"]

    shares = db.table("memory_shares").select("*").eq("memory_id", memory_id).eq("shared_with", user_id).execute().data

    if user_id == memory_owner or user_id == uploaded_by:
        pass
    elif shares:
        raise ValueError("Nie możesz usuwać cudzych zdjęć z udostępnionego wspomnienia.")
    else:
        raise ValueError("Brak uprawnień.")

    delete_file(db, BUCKET, photo["url"])
    db.table("photos").delete().eq("id", photo_id).execute()
