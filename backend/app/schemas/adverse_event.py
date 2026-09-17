from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class AdverseEventBase(BaseModel):
    event_term: str = Field(..., min_length=2, max_length=255)
    event_description: str = Field(..., min_length=5)
    start_date: date
    end_date: Optional[date] = None
    severity: str = Field(..., description="Mild, Moderate, Severe")
    is_serious: bool = False
    seriousness_criteria: Optional[List[str]] = None
    is_adr: bool = False
    suspected_intervention: Optional[str] = None
    causality: str = Field(default="Possible", description="Not Related, Unlikely, Possible, Probable, Very Likely")
    action_taken: str = Field(default="No change")
    outcome: str = Field(default="Recovering")
    investigator_assessment: Optional[str] = None


class AdverseEventCreate(AdverseEventBase):
    trial_id: int
    site_id: int
    participant_id: int


class AdverseEventUpdate(BaseModel):
    event_term: Optional[str] = None
    event_description: Optional[str] = None
    end_date: Optional[date] = None
    severity: Optional[str] = None
    is_serious: Optional[bool] = None
    seriousness_criteria: Optional[List[str]] = None
    is_adr: Optional[bool] = None
    suspected_intervention: Optional[str] = None
    causality: Optional[str] = None
    action_taken: Optional[str] = None
    outcome: Optional[str] = None
    investigator_assessment: Optional[str] = None
    status: Optional[str] = None


class AdverseEventReview(BaseModel):
    status: str = Field(..., description="Confirmed, Under Review, Closed")
    causality: Optional[str] = None
    relationship_to_intervention: Optional[str] = None
    outcome: Optional[str] = None
    investigator_assessment: Optional[str] = None
    investigator_notes: Optional[str] = None


class AdverseEventResponse(AdverseEventBase):
    id: int
    ae_id: str
    trial_id: int
    site_id: int
    participant_id: int
    status: str
    reporter_id: Optional[int] = None
    reviewed_by: Optional[int] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    participant_id_str: Optional[str] = None
    trial_id_str: Optional[str] = None
    site_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SafetySummaryStats(BaseModel):
    total_ae: int = 0
    total_sae: int = 0
    total_adr: int = 0
    open_events: int = 0
    under_review: int = 0
    resolved_events: int = 0
