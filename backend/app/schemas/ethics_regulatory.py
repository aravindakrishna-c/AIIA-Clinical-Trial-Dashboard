from datetime import datetime, date
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


# --- Ethics Submissions ---
class EthicsSubmissionBase(BaseModel):
    submission_id: Optional[str] = None
    protocol_version: str = Field(..., min_length=1, max_length=50)
    submission_date: date = Field(default_factory=date.today)
    comments: Optional[str] = None
    document_metadata: Optional[Dict[str, Any]] = None


class EthicsSubmissionCreate(EthicsSubmissionBase):
    trial_id: int


class EthicsDecisionUpdate(BaseModel):
    decision: str = Field(..., description="Approved, Changes Required, Rejected, Expired, Renewal Required")
    review_date: date = Field(default_factory=date.today)
    approval_number: Optional[str] = None
    approval_date: Optional[date] = None
    expiry_date: Optional[date] = None
    comments: Optional[str] = None


class EthicsSubmissionResponse(EthicsSubmissionBase):
    id: int
    submission_id: Optional[str] = None
    trial_id: int
    review_date: Optional[date] = None
    status: str
    decision: Optional[str] = None
    approval_number: Optional[str] = None
    approval_date: Optional[date] = None
    expiry_date: Optional[date] = None
    submitted_by: Optional[int] = None
    reviewed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- CTRI Tracking ---
class CTRIRegistrationUpdate(BaseModel):
    ctri_number: Optional[str] = None
    status: str = Field(..., description="Not Submitted, Draft, Submitted, Under Review, Registered, Update Required, Suspended, Closed")
    submission_date: Optional[date] = None
    registration_date: Optional[date] = None
    last_update_date: Optional[date] = None
    next_update_deadline: Optional[date] = None
    notes: Optional[str] = None
    responsible_person: Optional[str] = None


class CTRIRegistrationResponse(BaseModel):
    id: int
    trial_id: int
    ctri_number: Optional[str] = None
    status: str
    submission_date: Optional[date] = None
    registration_date: Optional[date] = None
    last_update_date: Optional[date] = None
    next_update_deadline: Optional[date] = None
    notes: Optional[str] = None
    responsible_person: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Regulatory Events ---
class RegulatoryEventCreate(BaseModel):
    trial_id: int
    event_type: str = Field(..., min_length=2, max_length=100)
    submission_date: Optional[date] = None
    due_date: date
    responsible_person: Optional[str] = None
    notes: Optional[str] = None


class RegulatoryEventUpdate(BaseModel):
    submission_date: Optional[date] = None
    due_date: Optional[date] = None
    completion_date: Optional[date] = None
    status: Optional[str] = None  # Pending, Submitted, Under Review, Completed, Delayed, Cancelled
    responsible_person: Optional[str] = None
    notes: Optional[str] = None


class RegulatoryEventResponse(BaseModel):
    id: int
    trial_id: int
    event_type: str
    submission_date: Optional[date] = None
    due_date: date
    completion_date: Optional[date] = None
    status: str
    responsible_person: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
