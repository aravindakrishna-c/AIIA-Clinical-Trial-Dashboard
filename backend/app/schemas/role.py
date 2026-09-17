from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None


class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    permissions: List[PermissionResponse] = []

    model_config = ConfigDict(from_attributes=True)
