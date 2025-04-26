from datetime import datetime, timezone
from sqlmodel import Field
from backend.models.base import Base

class Photo(Base, table=True):
    """Model representing a photo attached to a memory."""

    memory_id: str = Field(foreign_key="memory.id", index=True)
    url: str
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
