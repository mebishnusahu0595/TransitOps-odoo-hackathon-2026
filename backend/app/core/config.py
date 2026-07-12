import os
import secrets
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "TransitOps ERP"
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_hex(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    # Defaults to SQLite in workspace root to allow zero-config run out-of-the-box.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./transitops.db"
    )

settings = Settings()
