from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
import os


class SupabaseService:
    _client: Client = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._client is None:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
            
            cls._client = create_client(
                supabase_url,
                supabase_key,
                options=ClientOptions(
                    auto_refresh_token=False,
                    persist_session=False,
                )
            )
        return cls._client

    @classmethod
    def get_table(cls, table_name: str):
        return cls.get_client().table(table_name)


supabase_client = SupabaseService()
