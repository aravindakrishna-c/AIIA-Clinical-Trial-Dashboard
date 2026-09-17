from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.schemas.trial_site import TrialSiteResponse


class ParticipantBase(BaseModel):
    age: int = Field(..., ge=1, le=120)
    sex: str = Field(..., description="Male, Female, Other")
    screening_date: date


class ParticipantCreate(ParticipantBase):
    trial_id: int
    site_id: int
    screening_number: Optional[str] = None
    eligibility_details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class ParticipantScreeningEvaluation(BaseModel):
    eligibility_status: str = Field(..., description="Pending, Eligible, Ineligible")
    inclusion_answers: Dict[str, str] = Field(default_factory=dict)  # Met, Not Met, Unknown
    exclusion_answers: Dict[str, str] = Field(default_factory=dict)  # Present, Not Present, Unknown
    notes: Optional[str] = None


class ParticipantEnroll(BaseModel):
    enrollment_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None


class ParticipantRandomize(BaseModel):
    treatment_group: Optional[str] = None  # If not provided, assigned automatically Group A / B
    randomization_date: date = Field(default_factory=date.today)


class ParticipantWithdraw(BaseModel):
    withdrawal_date: date = Field(default_factory=date.today)
    withdrawal_reason: str = Field(..., min_length=3)


class ParticipantComplete(BaseModel):
    completion_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None


class ParticipantUpdate(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None
    notes: Optional[str] = None


class ParticipantListItem(BaseModel):
    id: int
    participant_id: str
    trial_id: int
    site_id: int
    screening_number: str
    age: int
    age_group: str
    sex: str
    screening_date: date
    eligibility_status: str
    enrollment_date: Optional[date] = None
    randomization_date: Optional[date] = None
    randomization_number: Optional[str] = None
    treatment_group: Optional[str] = None
    status: str
    participant_status: Optional[str] = None
    withdrawal_date: Optional[date] = None
    completion_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    site_name: Optional[str] = None
    site_code: Optional[str] = None
    trial_id_str: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def sync_status_fields(self):
        if self.participant_status is None and self.status:
            self.participant_status = self.status
        elif self.status is None and self.participant_status:
            self.status = self.participant_status
        return self


class ParticipantDetail(ParticipantListItem):
    eligibility_details: Optional[Dict[str, Any]] = None
    withdrawal_reason: Optional[str] = None
    notes: Optional[str] = None
    site: Optional[TrialSiteResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ParticipantSummaryStats(BaseModel):
    total_screened: int = 0
    eligible: int = 0
    ineligible: int = 0
    enrolled: int = 0
    randomized: int = 0
    active: int = 0
    completed: int = 0
    withdrawn: int = 0
    lost_to_followup: int = 0
