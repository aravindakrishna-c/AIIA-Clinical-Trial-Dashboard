from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.schemas.role import RoleResponse


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase):
    role_id: int
    password: str = Field(..., min_length=8, description="Temporary password for initial login")


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserResponse(UserBase):
    id: int
    role_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    role: Optional[RoleResponse] = None

    model_config = ConfigDict(from_attributes=True)
