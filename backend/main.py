"""
TrailBack API - Backend serwis dla aplikacji TrailBack

Ten moduł implementuje REST API dla aplikacji TrailBack, umożliwiając zarządzanie
wspomnieniami i zdjęciami powiązanymi z lokalizacjami geograficznymi.
"""

import os
import logging
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field, validator
from supabase import create_client, Client
from dotenv import load_dotenv
import uvicorn
from shapely import wkb
from datetime import datetime

# ================================
# Konfiguracja loggera
# ================================
logger = logging.getLogger("trailback")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

# ================================
# Konfiguracja Supabase
# ================================
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]
ENV = os.getenv("ENV", "development")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("Missing Supabase credentials in environment variables")
    raise Exception("Missing Supabase credentials in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ================================
# FastAPI Init
# ================================
app = FastAPI(
    title="TrailBack API",
    description="API dla aplikacji TrailBack do przechowywania wspomnień powiązanych z lokalizacjami",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,  # jeśli używasz cookies/tokenów
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================
# MODELE
# ================================
class MemoryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    created_by: str
    created_at: datetime

    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Tytuł nie może być pusty')
        return v

class MemoryOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    lat: float
    lng: float
    created_at: Optional[str]
    created_by: str

class PhotoCreate(BaseModel):
    memory_id: str
    url: str
    uploaded_by: str

class PhotoOut(BaseModel):
    id: str
    memory_id: str
    url: str
    uploaded_by: str
    uploaded_at: Optional[str]
    
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileOut(BaseModel):
    id: str
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

# ================================
# Obsługa błędów
# ================================
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Wystąpił nieoczekiwany błąd."},
    )

# ================================
# Zależności
# ================================
def get_db():
    return supabase

# ================================
# GET ENDPOINTS
# ================================
@app.get("/", status_code=200)
def root():
    return {"status": "TrailBack API is running", "version": "1.0.0"}

@app.get("/memories", response_model=List[MemoryOut], tags=["Memories"])
async def get_memories(user_id: str, db: Client = Depends(get_db)):
    try:
        response = db.table("memories").select("*").filter("created_by", "eq", user_id).execute()
        memories = []

        for m in response.data:
            location_wkb_hex = m.get("location")
            lat = lng = None

            if location_wkb_hex:
                try:
                    point = wkb.loads(bytes.fromhex(location_wkb_hex))
                    lng = point.x
                    lat = point.y
                except Exception as e:
                    logger.warning(f"Nie udało się sparsować WKB: {location_wkb_hex} ({e})")

            if lat is None or lng is None:
                continue

            memories.append({
                "id": m["id"],
                "title": m["title"],
                "description": m.get("description"),
                "lat": lat,
                "lng": lng,
                "created_at": m.get("created_at"),
                "created_by": m["created_by"]
            })

        return memories

    except Exception as e:
        logger.error(f"Błąd przy pobieraniu wspomnień: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się pobrać wspomnień")



@app.get("/photos", response_model=List[PhotoOut], tags=["Photos"])
async def get_photos(memory_id: str, db: Client = Depends(get_db)):
    response = db.table("photos").select("*").filter("memory_id", "eq", memory_id).execute()
    return response.data

@app.get("/friends", tags=["Friends"])
async def list_friends(user_id: str, db: Client = Depends(get_db)):
    response = db.table("friendships") \
        .select("*") \
        .or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}") \
        .filter("status", "eq", "accepted") \
        .execute()
    return response.data

@app.get("/users", tags=["Users"])
async def list_users(
    search: Optional[str] = None,
    current_user: str = "",
    db: Client = Depends(get_db)
):
    try:
        query = db.table("profiles").select("id, username, full_name, avatar_url")

        if search:
            query = query.filter("username", "ilike", f"%{search}%")

        response = query.execute()
        users = response.data or []

        # Ukryj samego siebie
        filtered_users = [u for u in users if u["id"] != current_user]

        return filtered_users
    except Exception as e:
        logger.error(f"Error listing users: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się pobrać listy użytkowników")

@app.get("/photos/{photo_id}", response_model=PhotoOut, tags=["Photos"])
async def get_photo(photo_id: str, db: Client = Depends(get_db)):
    try:
        response = db.table("photos").select("*").eq("id", photo_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Zdjęcie nie istnieje")

        return response.data[0]

    except Exception as e:
        logger.error(f"Błąd przy pobieraniu zdjęcia o ID {photo_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się pobrać zdjęcia")
    
@app.get("/profile", response_model=ProfileOut, tags=["Users"])
async def get_profile(user_id: str, db: Client = Depends(get_db)):
    resp = (
        db.table("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", user_id)
          .single()
          .execute()
    )
    if not resp.data:
        raise HTTPException(404, "Profile not found")
    return resp.data


# ================================
# POST ENDPOINTS
# ================================
@app.post("/memories", response_model=MemoryOut, status_code=201, tags=["Memories"])
async def create_memory(memory: MemoryCreate, db: Client = Depends(get_db)):
    try:
        location_point = f"POINT({memory.lng} {memory.lat})"

        response = db.table("memories").insert({
            "title": memory.title.strip(),
            "description": memory.description.strip() if memory.description else None,
            "location": location_point,
            "created_by": memory.created_by,
            "created_at": memory.created_at.isoformat()
        }).execute()

        record = response.data[0]

        return {
            "id": record["id"],
            "title": record["title"],
            "description": record.get("description"),
            "lat": memory.lat,
            "lng": memory.lng,
            "created_at": record["created_at"],
            "created_by": record["created_by"]
        }

    except Exception as e:
        logger.error("Błąd podczas zapisu wspomnienia", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się zapisać wspomnienia")


@app.post("/photos", response_model=PhotoOut, status_code=201, tags=["Photos"])
async def add_photo(photo: PhotoCreate, db: Client = Depends(get_db)):
    memory_check = db.table("memories").select("id").filter("id", "eq", photo.memory_id).execute()
    if not memory_check.data:
        raise HTTPException(status_code=404, detail="Podane wspomnienie nie istnieje")
    response = db.table("photos").insert({
        "memory_id": photo.memory_id,
        "url": photo.url,
        "uploaded_by": photo.uploaded_by
    }).execute()
    return response.data[0]

@app.post("/memories/share", tags=["Memories"])
async def share_memory(memory_id: str, shared_with: str, shared_by: str, db: Client = Depends(get_db)):
    db.table("memory_shares").insert({
        "memory_id": memory_id,
        "shared_with": shared_with,
        "shared_by": shared_by
    }).execute()
    return {"message": "Wspomnienie udostępnione"}

@app.post("/friends/request", tags=["Friends"])
async def send_friend_request(user_id: str, friend_id: str, db: Client = Depends(get_db)):
    db.table("friendships").insert({
        "user_id": user_id,
        "friend_id": friend_id,
        "status": "pending"
    }).execute()
    return {"message": "Zaproszenie wysłane"}

@app.post("/friends/accept", tags=["Friends"])
async def accept_friend_request(user_id: str, friend_id: str, db: Client = Depends(get_db)):
    db.table("friendships") \
        .update({"status": "accepted"}) \
        .match({"user_id": friend_id, "friend_id": user_id, "status": "pending"}) \
        .execute()
    return {"message": "Zaproszenie zaakceptowane"}



@app.post("/profile/avatar", response_model=ProfileOut, tags=["Users"])
async def upload_avatar(
    user_id: str,
    file: UploadFile = File(...),
    db: Client = Depends(get_db),
):
    contents = await file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png"):
        raise HTTPException(400, "Only JPG/PNG allowed")

    bucket = "avatars"
    key = f"{user_id}/{uuid4().hex}.{ext}"
    upload = supabase.storage.from_(bucket).upload(key, contents, {
        "contentType": file.content_type
    })
    if upload.error:
        logger.error("Upload error:", upload.error)
        raise HTTPException(500, "Failed to upload avatar")

    url_data = supabase.storage.from_(bucket).getPublicUrl(key)
    public_url = url_data.data.get("publicUrl")
    if not public_url:
        raise HTTPException(500, "Failed to get avatar URL")

    resp = (
        db.table("profiles")
          .update({"avatar_url": public_url})
          .eq("id", user_id)
          .single()
          .execute()
    )
    if resp.error:
        logger.error("DB update error:", resp.error)
        raise HTTPException(500, "Failed to update avatar_url in profile")
    return resp.data

# ================================
# PUT ENDPOINTS
# ================================
@app.put("/memories/{memory_id}/edit", tags=["Memories"])
async def edit_memory(memory_id: str, data: dict, user_id: str, db: Client = Depends(get_db)):
    ownership = db.table("memories").select("id").filter("id", "eq", memory_id).filter("created_by", "eq", user_id).execute().data
    shared = db.table("memory_shares").select("memory_id").filter("memory_id", "eq", memory_id).filter("shared_with", "eq", user_id).execute().data
    if not ownership and not shared:
        raise HTTPException(status_code=403, detail="Brak uprawnień")
    db.table("memories").update(data).filter("id", "eq", memory_id).execute()
    return {"message": "Zaktualizowano wspomnienie"}

@app.put("/profile", tags=["Users"])
async def update_profile(
    user_id: str,
    data: ProfileUpdate,
    db: Client = Depends(get_db)
):
    try:
        update_data = {k: v for k, v in data.dict().items() if v is not None}

        if not update_data:
            raise HTTPException(status_code=400, detail="Brak danych do aktualizacji")

        db.table("profiles").update(update_data).eq("id", user_id).execute()
        return {"message": "Profil zaktualizowany"}
    except Exception as e:
        logger.error(f"Błąd aktualizacji profilu: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się zaktualizować profilu")

# ================================
# DELETE ENDPOINTS
# ================================
@app.delete("/photos/{photo_id}", tags=["Photos"])
async def delete_photo(photo_id: str, user_id: str, db: Client = Depends(get_db)):
    photo = db.table("photos").select("memory_id").filter("id", "eq", photo_id).execute().data[0]
    memory_id = photo["memory_id"]
    is_owner = db.table("memories").select("id").filter("id", "eq", memory_id).filter("created_by", "eq", user_id).execute().data
    is_shared = db.table("memory_shares").select("memory_id").filter("memory_id", "eq", memory_id).filter("shared_with", "eq", user_id).execute().data
    if not is_owner and not is_shared:
        raise HTTPException(status_code=403, detail="Brak dostępu")
    db.table("photos").delete().filter("id", "eq", photo_id).execute()
    return {"message": "Zdjęcie usunięte"}

# ================================
# OpenAPI + Start serwera
# ================================
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="TrailBack API",
        version="1.0.0",
        description="API dla aplikacji TrailBack do przechowywania wspomnień powiązanych z lokalizacjami",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    log_level = "info" if ENV == "production" else "debug"
    logger.info(f"Starting TrailBack API on port {port} in {ENV} environment")
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level=log_level, reload=ENV != "production")
