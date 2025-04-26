from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List, Union
import json

class Settings(BaseSettings):
    env: str = "development"
    supabase_url: AnyHttpUrl
    supabase_service_role_key: str
    database_url: str
    allowed_origins: Union[str, List[str]] = []

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }

    @property
    def parsed_allowed_origins(self) -> List[str]:
        if isinstance(self.allowed_origins, str):
            try:
                origins = json.loads(self.allowed_origins)
                if isinstance(origins, list):
                    return origins
            except Exception:
                pass
        return self.allowed_origins or []

settings = Settings()
