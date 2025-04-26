from sqlmodel import Field
from backend.models.base import Base
from typing import Optional

class User(Base, table=True):
    """Model representing a registered user."""

    username: Optional[str] = Field(default=None, index=True)
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
