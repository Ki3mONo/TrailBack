from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import uvicorn

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("Missing Supabase credentials in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI()

# CORS for frontend dev (adjust origin in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# Models
# ================================
class Memory(BaseModel):
    id: Optional[str]
    title: str
    description: Optional[str]
    lat: float
    lng: float
    created_by: Optional[str]  # From Supabase auth

class MemoryOut(Memory):
    created_at: Optional[str]

# ================================
# Endpoints
# ================================
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

@app.get("/")
def root():
    return {"status": "TrailBack API is running"}

# ================================
# Main entry point for Render
# ================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
