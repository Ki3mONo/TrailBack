from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field
from backend.models.base import Base

class Memory(Base, table=True):
    """Model representing a memory entry."""

    title: str = Field(max_length=100)
    description: Optional[str] = Field(default=None, max_length=2000)
    location: str
    created_by: str = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
