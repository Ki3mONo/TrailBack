from uuid import uuid4
from supabase import Client

def upload_file(db: Client, bucket: str, directory: str, filename: str, content: bytes, mime: str) -> str:
    """Upload a file to Supabase storage and return its public URL."""
    key = f"{directory}/{uuid4().hex}.{filename.rsplit('.', 1)[-1].lower()}"
    db.storage.from_(bucket).upload(key, content, {"contentType": mime})
    return db.storage.from_(bucket).get_public_url(key)

def delete_file(db: Client, bucket: str, public_url: str) -> None:
    """Delete a file from Supabase storage based on its public URL."""
    key = "/".join(public_url.split("/")[-2:])
    db.storage.from_(bucket).remove([key])
