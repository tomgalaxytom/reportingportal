from typing import Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
    environment: str
    database: Optional[str] = "unknown"
    timestamp: Optional[str] = None
    version: Optional[str] = "1.0.0"


class DbHealthResponse(BaseModel):
    status: str
    error: Optional[str] = None
