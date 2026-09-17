from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MilestoneBase(BaseModel):
    milestone_name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    planned_date: date
    actual_date: Optional[date] = None
    status: str = Field(
        default="Planned",
        description="Planned, In Progress, Completed, Delayed, Cancelled"
    )


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    milestone_name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    planned_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: Optional[str] = None


class MilestoneResponse(MilestoneBase):
    id: int
    trial_id: int
    created_by: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
