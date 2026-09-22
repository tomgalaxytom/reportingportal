from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    officer_email: str
    password: str


class UserResponse(BaseModel):
    id: int
    district_name: Optional[str] = None
    officer_email: str
    role: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    status: str
    user: UserResponse
    token: Optional[str] = None
