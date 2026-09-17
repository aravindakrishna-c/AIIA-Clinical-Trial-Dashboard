from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProtocolVersionBase(BaseModel):
    version_number: str = Field(..., min_length=1, max_length=50, description="e.g. 1.0, 1.1, 2.0")
    version_date: date
    change_summary: str = Field(..., min_length=3, description="Summary of protocol amendments/clarifications")
    document_reference: Optional[str] = Field(None, max_length=255)


class ProtocolVersionCreate(ProtocolVersionBase):
    pass


class ProtocolVersionResponse(ProtocolVersionBase):
    id: int
    trial_id: int
    status: str
    created_by: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
