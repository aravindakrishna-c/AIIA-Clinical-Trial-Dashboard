from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class VisitBase(BaseModel):
    visit_name: str = Field(..., min_length=2, max_length=100)
    visit_number: int = Field(..., ge=1)
    planned_date: date
    notes: Optional[str] = None


class VisitCreate(VisitBase):
    actual_date: Optional[date] = None
    status: str = Field(default="Scheduled")


class VisitUpdate(BaseModel):
    visit_name: Optional[str] = None
    planned_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class VisitComplete(BaseModel):
    actual_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None
    visit_status: Optional[str] = None
    status: Optional[str] = None


class VisitResponse(VisitBase):
    id: int
    trial_id: int
    site_id: int
    participant_id: int
    actual_date: Optional[date] = None
    status: str  # Scheduled, Completed, Missed, Overdue, Cancelled
    visit_status: Optional[str] = None
    completed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def sync_visit_status(self):
        if self.visit_status is None and self.status:
            self.visit_status = self.status
        elif self.status is None and self.visit_status:
            self.status = self.visit_status
        return self
