from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    username: str = Field(..., description="Username or email address")
    password: str = Field(..., description="Account password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    permissions: List[str] = []


class UserProfileResponse(BaseModel):
    user: UserResponse
    role_name: str
    permissions: List[str] = []


class LogoutResponse(BaseModel):
    message: str = "Successfully logged out"
