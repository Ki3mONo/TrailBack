"""
TrailBack API - Backend serwis dla aplikacji TrailBack

Ten moduł implementuje REST API dla aplikacji TrailBack, umożliwiając zarządzanie
wspomnieniami i zdjęciami powiązanymi z lokalizacjami geograficznymi.
"""

import os
import logging
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request, status, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field, validator
from supabase import create_client, Client
from dotenv import load_dotenv
import uvicorn
from shapely import wkb
from datetime import datetime
from uuid import uuid4

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
    allow_origins=["*"],
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
    
class ProfileUpdate(BaseModel):
    full_name: str
    username: str

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


@app.get("/memories/shared", response_model=List[MemoryOut], tags=["Memories"])
async def get_shared_memories(user_id: str, db: Client = Depends(get_db)):
    try:
        response = db.table("memory_shares") \
            .select("memory_id") \
            .eq("shared_with", user_id) \
            .execute()

        memory_ids = [s["memory_id"] for s in response.data]
        if not memory_ids:
            return []

        memory_response = db.table("memories").select("*").in_("id", memory_ids).execute()
        memories = []

        for m in memory_response.data:
            location_wkb_hex = m.get("location")
            lat = lng = None

            if location_wkb_hex:
                try:
                    from shapely import wkb
                    point = wkb.loads(bytes.fromhex(location_wkb_hex))
                    lng = point.x
                    lat = point.y
                except Exception as e:
                    continue

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
        logger.error(f"Błąd przy pobieraniu udostępnionych wspomnień: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się pobrać udostępnionych wspomnień")


@app.get("/memories/{memory_id}/shares", tags=["Memories"])
async def get_memory_shares(memory_id: str, db: Client = Depends(get_db)):
    """
    Zwraca listę obiektów z shared_with i shared_by.
    """
    try:
        response = db.table("memory_shares") \
            .select("shared_with, shared_by") \
            .eq("memory_id", memory_id) \
            .execute()

        return response.data

    except Exception as e:
        logger.error(f"Błąd przy pobieraniu udostępnionych użytkowników: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się pobrać udostępnień")


@app.get("/photos", response_model=List[PhotoOut], tags=["Photos"])
async def get_photos(memory_id: str, db: Client = Depends(get_db)):
    response = db.table("photos").select("*").filter("memory_id", "eq", memory_id).execute()
    return response.data

@app.get("/friends", tags=["Friends"])
async def list_friends(user_id: str, db: Client = Depends(get_db)):
    response = db.table("friendships") \
        .select("*") \
        .or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}") \
        .execute()
    return response.data

@app.get("/users", tags=["Users"])
async def list_users(
    search: Optional[str] = None,
    current_user: str = "",
    db: Client = Depends(get_db)
):
    try:
        query = db.table("user_profiles_view").select("id, email, username, full_name, avatar_url")

        if search:
            query = query.filter("username", "ilike", f"%{search}%")

        response = query.execute()
        users = response.data or []

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
    user_id: str = Form(...),
    file: UploadFile = File(...),
    db: Client = Depends(get_db),
):
    try:
        contents = await file.read()
        ext = file.filename.rsplit(".", 1)[-1].lower()

        if ext not in ("jpg", "jpeg", "png"):
            raise HTTPException(400, "Dozwolone tylko JPG/PNG")

        bucket = "avatars"
        key = f"{user_id}/{uuid4().hex}.{ext}"

        upload_response = supabase.storage.from_(bucket).upload(key, contents, {
            "contentType": file.content_type
        })

        # Sprawdzenie błędu uploadu – tylko jeśli upload_response to dict lub zawiera status
        if not upload_response or getattr(upload_response, "status_code", 200) >= 400:
            raise HTTPException(500, "Błąd uploadu avatara")

        public_url = supabase.storage.from_(bucket).get_public_url(key)

        if not public_url:
            raise HTTPException(500, "Nie udało się uzyskać publicznego URL")

        db_response = (
            db.table("profiles")
            .update({"avatar_url": public_url})
            .eq("id", user_id)
            .execute()
        )

        # Sprawdzenie danych
        if not db_response or not db_response.data:
            raise HTTPException(500, "Nie udało się zaktualizować profilu")

        return db_response.data[0]

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas uploadu avatara: {str(e)}")



# ================================
# POST: Dodaj użytkownika do wspomnienia (memory_share)
# ================================
@app.post("/memories/{memory_id}/share-user", tags=["Memories"])
async def share_memory_with_user(memory_id: str, shared_with: str, shared_by: str, db: Client = Depends(get_db)):
    try:
        # Sprawdź czy właściciel
        ownership = db.table("memories").select("id").eq("id", memory_id).eq("created_by", shared_by).execute().data
        if not ownership:
            raise HTTPException(403, "Tylko właściciel może udostępniać")

        db.table("memory_shares").insert({
            "memory_id": memory_id,
            "shared_with": shared_with,
            "shared_by": shared_by,
            "shared_at": datetime.utcnow().isoformat()
        }).execute()
        return {"message": "Użytkownik dodany do wspomnienia"}
    except Exception as e:
        logger.error(f"Błąd przy udostępnianiu wspomnienia: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się udostępnić wspomnienia")
    
@app.post("/memories/{memory_id}/upload-photo")
async def upload_memory_photo(memory_id: str, user_id: str, file: UploadFile = File(...), db: Client = Depends(get_db)):
    try:
        contents = await file.read()
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ("jpg", "jpeg", "png"):
            raise HTTPException(400, "Dozwolone tylko JPG/PNG")

        bucket = "photos"
        key = f"{memory_id}/{uuid4().hex}.{ext}"

        upload_response = supabase.storage.from_(bucket).upload(key, contents, {
            "contentType": file.content_type
        })

        if hasattr(upload_response, "error") and upload_response.error:
            raise HTTPException(500, "Błąd uploadu pliku")

        public_url = supabase.storage.from_("photos").get_public_url(key)

        if not public_url:
            raise HTTPException(500, "Nie można pobrać URL zdjęcia")

        db.table("photos").insert({
            "memory_id": memory_id,
            "url": public_url,
            "uploaded_by": user_id
        }).execute()

        return {"message": "Zdjęcie dodane", "url": public_url}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas uploadu zdjęcia: {str(e)}")

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
    
@app.put("/profile", tags=["Users"])
async def update_profile(
    user_id: str = Form(...),
    profile: ProfileUpdate = ...,
    db: Client = Depends(get_db),
):
    try:
        response = (
            db.table("profiles")
            .update({
                "full_name": profile.full_name,
                "username": profile.username,
            })
            .eq("id", user_id)
            .single()
            .execute()
        )
        if response.error:
            raise HTTPException(500, detail="Błąd aktualizacji profilu")
        return response.data
    except Exception as e:
        raise HTTPException(500, detail="Nie udało się zapisać zmian")

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

@app.delete("/friends/remove")
async def remove_friend(user_id: str, friend_id: str):
    try:
        # Delete the friendship where user_id and friend_id match
        response = supabase.table("friendships").delete().match({
            "user_id": user_id,
            "friend_id": friend_id
        }).execute()

        # Also delete the reverse friendship if it exists
        supabase.table("friendships").delete().match({
            "user_id": friend_id,
            "friend_id": user_id
        }).execute()

        return {"message": "Friendship removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ================================
# DELETE: Usuwanie wspomnienia + zdjęć + plików z bucketu
# ================================
@app.delete("/memories/{memory_id}", tags=["Memories"])
async def delete_memory(memory_id: str, user_id: str, db: Client = Depends(get_db)):
    try:
        # Sprawdź czy user to właściciel
        ownership = db.table("memories") \
            .select("id") \
            .eq("id", memory_id) \
            .eq("created_by", user_id) \
            .execute().data

        if not ownership:
            raise HTTPException(status_code=403, detail="Brak uprawnień do usunięcia")

        # Pobierz zdjęcia
        photos = db.table("photos") \
            .select("id, url") \
            .eq("memory_id", memory_id) \
            .execute().data

        # Usuń zdjęcia z bucketu
        for photo in photos:
            url = photo["url"]
            key = "/".join(url.split("/")[-2:])  # assumes /bucket/key format
            supabase.storage.from_("photos").remove([key])

        # Usuń zdjęcia z bazy
        db.table("photos").delete().eq("memory_id", memory_id).execute()

        # Usuń memory
        db.table("memories").delete().eq("id", memory_id).execute()
        return {"message": "Wspomnienie oraz powiązane zdjęcia zostały usunięte"}
    except Exception as e:
        logger.error(f"Błąd usuwania wspomnienia: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Błąd usuwania wspomnienia")

# ================================
# DELETE: Usuwanie zdjęcia z memories (tylko plik i rekord, nie memory)
# ================================
@app.delete("/memories/{memory_id}/photo/{photo_id}", tags=["Photos"])
async def delete_memory_photo(memory_id: str, photo_id: str, user_id: str, db: Client = Depends(get_db)):
    try:
        photo = db.table("photos").select("url, uploaded_by").eq("id", photo_id).single().execute().data
        if not photo:
            raise HTTPException(404, "Zdjęcie nie istnieje")

        # Sprawdź uprawnienia
        owner_check = db.table("memories").select("id").eq("id", memory_id).eq("created_by", user_id).execute().data
        shared_check = db.table("memory_shares").select("memory_id").eq("memory_id", memory_id).eq("shared_with", user_id).execute().data
        if not owner_check and not shared_check:
            raise HTTPException(403, "Brak dostępu do zdjęcia")

        # Usuń z bucketu
        key = "/".join(photo["url"].split("/")[-2:])
        supabase.storage.from_("photos").remove([key])

        # Usuń z bazy
        db.table("photos").delete().eq("id", photo_id).execute()
        return {"message": "Zdjęcie zostało usunięte"}
    except Exception as e:
        logger.error(f"Błąd usuwania zdjęcia: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się usunąć zdjęcia")
# ================================
# DELETE: Usuń użytkownika ze wspomnienia
# ================================
@app.delete("/memories/{memory_id}/share-user/{shared_with}", tags=["Memories"])
async def unshare_memory_with_user(memory_id: str, shared_with: str, user_id: str, db: Client = Depends(get_db)):
    try:
        # Tylko właściciel może cofnąć udostępnienie
        ownership = db.table("memories").select("id").eq("id", memory_id).eq("created_by", user_id).execute().data
        if not ownership:
            raise HTTPException(403, "Brak uprawnień do cofnięcia udostępnienia")

        db.table("memory_shares").delete().eq("memory_id", memory_id).eq("shared_with", shared_with).execute()
        return {"message": "Dostęp użytkownika do wspomnienia został cofnięty"}
    except Exception as e:
        logger.error(f"Błąd przy cofnięciu udostępnienia: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się cofnąć dostępu")

@app.delete("/memories/{memory_id}/share-user/{shared_with}", tags=["Memories"])
async def unshare_memory_with_user(memory_id: str, shared_with: str, user_id: str, db: Client = Depends(get_db)):
    """
    Pozwala właścicielowi wspomnienia cofnąć udostępnienie danemu użytkownikowi.
    """
    try:
        # Sprawdź, czy current user to właściciel wspomnienia
        ownership = db.table("memories").select("id") \
            .eq("id", memory_id).eq("created_by", user_id).execute().data
        if not ownership:
            raise HTTPException(status_code=403, detail="Tylko właściciel może cofnąć udostępnienie.")

        # Usuń wpis z memory_shares
        db.table("memory_shares") \
            .delete() \
            .eq("memory_id", memory_id) \
            .eq("shared_with", shared_with) \
            .execute()

        return {"message": "Udostępnienie cofnięte"}

    except Exception as e:
        logger.error(f"Błąd przy cofnięciu udostępnienia: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Nie udało się cofnąć udostępnienia")


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
