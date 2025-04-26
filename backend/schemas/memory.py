from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class MemoryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    created_by: str
    created_at: datetime

    @field_validator("title", mode="before")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tytuł nie może być pusty")
        return v

class MemoryOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    lat: float
    lng: float
    created_by: str
    created_at: datetime

class MemoryShare(BaseModel):
    memory_id: str
    shared_with: str
    shared_by: str
    shared_at: datetime

class MemoryShareOut(BaseModel):
    shared_with: str
    shared_by: str
