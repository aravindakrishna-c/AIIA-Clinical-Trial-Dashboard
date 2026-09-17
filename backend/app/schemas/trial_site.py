from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse


class TrialSiteBase(BaseModel):
    site_code: str = Field(..., min_length=2, max_length=50, description="Unique site code within trial, e.g. AIIA-001")
    site_name: str = Field(..., min_length=2, max_length=255)
    institution: str = Field(..., min_length=2, max_length=255)
    location: str = Field(..., min_length=2)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    country: str = Field(default="India", min_length=2, max_length=100)
    site_investigator_id: Optional[int] = None
    activation_date: Optional[date] = None
    site_status: str = Field(
        default="Pending",
        description="Pending, Ethics Pending, Activated, Recruiting, Suspended, Closed"
    )
    enrollment_target: int = Field(..., gt=0, description="Enrollment target must be greater than 0")


class TrialSiteCreate(TrialSiteBase):
    pass


class TrialSiteUpdate(BaseModel):
    site_name: Optional[str] = Field(None, min_length=2, max_length=255)
    institution: Optional[str] = Field(None, min_length=2, max_length=255)
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    site_investigator_id: Optional[int] = None
    activation_date: Optional[date] = None
    enrollment_target: Optional[int] = Field(None, gt=0)


class TrialSiteStatusUpdate(BaseModel):
    site_status: str = Field(..., description="Target site status")
    notes: Optional[str] = None


class TrialSiteResponse(TrialSiteBase):
    id: int
    trial_id: int
    current_enrollment: int
    created_at: datetime
    updated_at: datetime
    site_investigator: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
