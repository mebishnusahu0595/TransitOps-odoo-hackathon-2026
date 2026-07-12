import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "TransitOps ERP"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "b390af563d178e24c52db9a365f5fe7a8dc4e5482312b9213efc11a2f6412ab8")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    # Defaults to SQLite in workspace root to allow zero-config run out-of-the-box.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./transitops.db"
    )

settings = Settings()
