from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
from typing import List

class Settings(BaseSettings):
    env: str = "development"
    supabase_url: AnyHttpUrl
    supabase_service_role_key: str
    database_url: str
    allowed_origins: List[AnyHttpUrl] = []

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def assemble_allowed_origins(cls, v):
        """Parse allowed_origins JSON string from environment."""
        if isinstance(v, str):
            import json
            try:
                origins = json.loads(v)
                if isinstance(origins, list):
                    return origins
            except json.JSONDecodeError:
                pass
        return v

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }

settings = Settings()
