from functools import lru_cache
from supabase import Client, create_client
from backend.core.config import settings

@lru_cache()
def get_supabase() -> Client:
    return create_client(str(settings.supabase_url), settings.supabase_service_role_key)

def get_db() -> Client:
    return get_supabase()
