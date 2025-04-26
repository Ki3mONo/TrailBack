from datetime import datetime
from typing import List, Dict, Any
from supabase import Client

from backend.schemas.memory import MemoryCreate, MemoryOut, MemoryShareOut
from backend.utils.geo import wkb_point_to_lat_lng
from backend.utils.storage import delete_file

BUCKET_PHOTOS = "photos"

def list_memories(db: Client, user_id: str) -> List[MemoryOut]:
    """List all memories created by a given user."""
    rows = db.table("memories").select("*").eq("created_by", user_id).execute().data
    return _parse_memories(rows)

def list_shared_memories(db: Client, user_id: str) -> List[MemoryOut]:
    """List all memories shared with a given user."""
    ids = [s["memory_id"] for s in db.table("memory_shares").select("memory_id").eq("shared_with", user_id).execute().data]
    if not ids:
        return []
    rows = db.table("memories").select("*").in_("id", ids).execute().data
    return _parse_memories(rows)

def create_memory(db: Client, data: MemoryCreate) -> MemoryOut:
    """Create a new memory record."""
    location_point = f"POINT({data.lng} {data.lat})"
    row = db.table("memories").insert({
        "title": data.title.strip(),
        "description": data.description.strip() if data.description else None,
        "location": location_point,
        "created_by": data.created_by,
        "created_at": data.created_at.isoformat(),
    }).execute().data[0]
    return MemoryOut(**row, lat=data.lat, lng=data.lng)

def edit_memory(db: Client, memory_id: str, payload: Dict[str, Any], user_id: str) -> None:
    """Edit an existing memory if the user is the owner."""
    memory = (
        db.table("memories")
        .select("created_by")
        .eq("id", memory_id)
        .single()
        .execute()
        .data
    )
    if not memory:
        raise ValueError("Wspomnienie nie istnieje")
    if memory["created_by"] != user_id:
        raise ValueError("Tylko właściciel może edytować wspomnienie")
    db.table("memories").update(payload).eq("id", memory_id).execute()

def share_memory_with_user(db: Client, memory_id: str, shared_with: str, shared_by: str) -> None:
    """Share a memory with another user (only owner can share)."""
    ownership = (
        db.table("memories")
        .select("id")
        .eq("id", memory_id)
        .eq("created_by", shared_by)
        .execute()
        .data
    )
    if not ownership:
        raise ValueError("Tylko właściciel może udostępniać wspomnienie")
    db.table("memory_shares").insert({
        "memory_id": memory_id,
        "shared_with": shared_with,
        "shared_by": shared_by,
        "shared_at": datetime.utcnow().isoformat(),
    }).execute()

def unshare_memory(db: Client, memory_id: str, shared_with: str) -> None:
    """Remove memory sharing from a user."""
    db.table("memory_shares").delete().eq("memory_id", memory_id).eq("shared_with", shared_with).execute()

def get_shares(db: Client, memory_id: str) -> List[MemoryShareOut]:
    """List all users with whom the memory is shared."""
    rows = db.table("memory_shares").select("shared_with, shared_by").eq("memory_id", memory_id).execute().data
    return [MemoryShareOut(**r) for r in rows]

def delete_memory(db: Client, memory_id: str, user_id: str) -> None:
    """Delete a memory with all related photos and shares if the user is the owner."""
    memory = (
        db.table("memories")
        .select("created_by")
        .eq("id", memory_id)
        .single()
        .execute()
        .data
    )
    if not memory:
        raise ValueError("Wspomnienie nie istnieje.")
    if memory["created_by"] != user_id:
        raise ValueError("Tylko właściciel może usunąć wspomnienie.")

    photos = db.table("photos").select("id", "url").eq("memory_id", memory_id).execute().data
    for photo in photos:
        delete_file(db, BUCKET_PHOTOS, photo["url"])
        db.table("photos").delete().eq("id", photo["id"]).execute()

    db.table("memory_shares").delete().eq("memory_id", memory_id).execute()
    db.table("memories").delete().eq("id", memory_id).execute()

def _parse_memories(rows: List[dict]) -> List[MemoryOut]:
    """Helper to parse memory rows into MemoryOut models."""
    out: List[MemoryOut] = []
    for row in rows:
        coords = wkb_point_to_lat_lng(row.get("location"))
        if not coords:
            continue
        lat, lng = coords
        out.append(MemoryOut(**row, lat=lat, lng=lng))
    return out
