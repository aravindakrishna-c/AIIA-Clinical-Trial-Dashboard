from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    description: str
    timestamp: datetime
    metadata_json: Optional[Dict[str, Any]] = None
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
