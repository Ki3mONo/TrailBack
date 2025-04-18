from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import uvicorn

# ================================
# Konfiguracja Supabase
# ================================
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("Missing Supabase credentials in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ================================
# FastAPI Init
# ================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Zmień na domenę frontendową w produkcji!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# MODELE
# ================================
class MemoryCreate(BaseModel):
    title: str
    description: Optional[str]
    lat: float
    lng: float
    created_by: str

class MemoryOut(MemoryCreate):
    id: str
    created_at: Optional[str]

class PhotoCreate(BaseModel):
    memory_id: str
    url: str
    uploaded_by: str

class PhotoOut(PhotoCreate):
    id: str
    uploaded_at: Optional[str]

# ================================
# ENDPOINTY
# ================================

@app.get("/")
def root():
    return {"status": "TrailBack API is running"}

# --- Memories ---
@app.get("/memories", response_model=List[MemoryOut])
def get_memories(user_id: str):
    try:
        response = supabase.table("memories").select("*").filter("created_by", "eq", user_id).execute()
        return [
            {
                "id": m["id"],
                "title": m["title"],
                "description": m.get("description"),
                "lat": m["location"]["coordinates"][1],
                "lng": m["location"]["coordinates"][0],
                "created_at": m["created_at"],
                "created_by": m["created_by"]
            }
            for m in response.data
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/memories", response_model=MemoryOut)
def create_memory(memory: MemoryCreate):
    try:
        point = f"POINT({memory.lng} {memory.lat})"
        response = supabase.table("memories").insert({
            "title": memory.title,
            "description": memory.description,
            "location": point,
            "created_by": memory.created_by
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
        raise HTTPException(status_code=500, detail=str(e))

# --- Photos ---
@app.post("/photos", response_model=PhotoOut)
def add_photo(photo: PhotoCreate):
    try:
        response = supabase.table("photos").insert({
            "memory_id": photo.memory_id,
            "url": photo.url,
            "uploaded_by": photo.uploaded_by
        }).execute()

        record = response.data[0]

        return {
            "id": record["id"],
            "memory_id": record["memory_id"],
            "url": record["url"],
            "uploaded_by": record["uploaded_by"],
            "uploaded_at": record["uploaded_at"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/photos", response_model=List[PhotoOut])
def get_photos(memory_id: str):
    try:
        response = supabase.table("photos").select("*").filter("memory_id", "eq", memory_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# Run app (for Render or local)
# ================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
