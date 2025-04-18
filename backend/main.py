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

# 🔓 CORS (zmień origin w produkcji)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Możesz zmienić to na konkretną domenę w produkcji, np. ["https://yourfrontenddomain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# MODELE
# ================================
class Memory(BaseModel):
    id: Optional[str]
    title: str
    description: Optional[str]
    lat: float
    lng: float
    created_by: Optional[str]

class MemoryOut(Memory):
    created_at: Optional[str]

class Photo(BaseModel):
    memory_id: str
    url: str
    uploaded_by: str

# ================================
# ENDPOINTY
# ================================

@app.get("/")
def root():
    return {"status": "TrailBack API is running"}

# --- Memories ---
@app.get("/memories", response_model=List[MemoryOut])
def get_memories(user_id: str):
    response = supabase.table("memories").select("*", count="exact").filter("created_by", "eq", user_id).execute()
    if response.error:
        raise HTTPException(status_code=500, detail=response.error.message)
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


@app.post("/memories", response_model=MemoryOut)
def create_memory(memory: Memory):
    try:
        point = f"POINT({memory.lng} {memory.lat})"
        response = supabase.table("memories").insert({
            "title": memory.title,
            "description": memory.description,
            "location": point,
            "created_by": memory.created_by
        }).execute()
        
        if response.error:
            raise HTTPException(status_code=500, detail=response.error.message)
        
        data = response.data[0]
        return {
            "id": data["id"],
            "title": data["title"],
            "description": data.get("description"),
            "lat": memory.lat,
            "lng": memory.lng,
            "created_at": data["created_at"],
            "created_by": data["created_by"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Photos ---
@app.post("/photos")
def add_photo(photo: Photo):
    try:
        # Ustawienie wartości 'uploaded_by' jako auth.uid() przez Trigger w bazie danych
        response = supabase.table("photos").insert({
            "memory_id": photo.memory_id,  # Id wspomnienia, do którego przypisujemy zdjęcie
            "url": photo.url,  # URL zdjęcia
            "uploaded_by": photo.uploaded_by  # Id użytkownika (można ustawić przez Trigger)
        }).execute()

        if response.error:
            raise HTTPException(status_code=500, detail=response.error.message)

        return {"status": "photo saved", "photo": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/photos")
def get_photos(memory_id: str):
    try:
        response = supabase.table("photos").select("*").filter("memory_id", "eq", memory_id).execute()
        if response.error:
            raise HTTPException(status_code=500, detail=response.error.message)
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# Run app (for Render)
# ================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
