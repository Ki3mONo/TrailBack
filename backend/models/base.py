import uuid
from sqlmodel import SQLModel, Field

def pk() -> str:
    return uuid.uuid4().hex

class Base(SQLModel):
    id: str = Field(default_factory=pk, primary_key=True, index=True)
