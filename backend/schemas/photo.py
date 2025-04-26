from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class PhotoCreate(BaseModel):
    memory_id: str
    url: str
    uploaded_by: str

class PhotoOut(BaseModel):
    id: str
    memory_id: str
    url: str
    uploaded_by: str
    uploaded_at: datetime
