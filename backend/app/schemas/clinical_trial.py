from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.schemas.user import UserResponse
from app.schemas.trial_protocol import ProtocolVersionResponse
from app.schemas.trial_milestone import MilestoneResponse
from app.schemas.trial_site import TrialSiteResponse


class ClinicalTrialBase(BaseModel):
    trial_id: str = Field(..., min_length=3, max_length=50, description="Unique human-readable identifier, e.g. AIIA-CT-2026-001")
    trial_title: str = Field(..., min_length=5, max_length=500)
    short_title: Optional[str] = Field(None, max_length=255)
    protocol_number: str = Field(..., min_length=2, max_length=100)
    protocol_version: str = Field(default="1.0", min_length=1, max_length=50)
    protocol_version_date: date

    # Study design
    study_type: str = Field(..., description="Interventional, Observational")
    study_phase: str = Field(..., description="Early Phase, Phase I, Phase II, Phase III, Phase IV, Not Applicable")
    study_design: str = Field(..., description="Parallel Group, Single Group, Randomized, Non-Randomized, Open Label, Blinded")

    # Sponsor & PI
    sponsor: str = Field(..., min_length=2, max_length=255)
    sponsor_type: str = Field(default="Institutional", description="Government, Academic, Institutional, Industry, Other")
    sponsor_contact: Optional[str] = None
    principal_investigator_id: int

    # Ayurveda clinical specifics
    disease_condition: str = Field(..., min_length=2, max_length=255)
    ayurveda_intervention: str = Field(..., min_length=2, max_length=255)
    intervention_type: str = Field(default="Herbal", description="Herbal, Herbo-mineral, Panchakarma, Rasayana, Diet/Lifestyle, Other")
    intervention_description: str = Field(..., min_length=5)
    dosage: Optional[str] = None
    route_of_administration: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    formulation_procedure: Optional[str] = None
    comparator: Optional[str] = None
    comparator_description: Optional[str] = None

    # Target & Timeline
    target_participants: int = Field(..., gt=0, description="Target participants must be greater than zero")
    planned_enrollment_start_date: Optional[date] = None
    start_date: date
    expected_completion_date: date
    actual_completion_date: Optional[date] = None

    # Criteria & Objectives
    inclusion_criteria: str = Field(..., min_length=5)
    exclusion_criteria: str = Field(..., min_length=5)
    primary_objective: str = Field(..., min_length=5)
    secondary_objectives: Optional[str] = None


class ClinicalTrialCreate(ClinicalTrialBase):
    @model_validator(mode="after")
    def validate_dates_and_targets(self):
        if self.expected_completion_date < self.start_date:
            raise ValueError("Expected completion date cannot be earlier than trial start date.")
        if self.target_participants <= 0:
            raise ValueError("Target participants count must be greater than 0.")
        return self


class ClinicalTrialUpdate(BaseModel):
    trial_title: Optional[str] = Field(None, min_length=5, max_length=500)
    short_title: Optional[str] = None
    protocol_number: Optional[str] = None
    protocol_version: Optional[str] = None
    protocol_version_date: Optional[date] = None
    study_type: Optional[str] = None
    study_phase: Optional[str] = None
    study_design: Optional[str] = None
    sponsor: Optional[str] = None
    sponsor_type: Optional[str] = None
    sponsor_contact: Optional[str] = None
    principal_investigator_id: Optional[int] = None
    disease_condition: Optional[str] = None
    ayurveda_intervention: Optional[str] = None
    intervention_type: Optional[str] = None
    intervention_description: Optional[str] = None
    dosage: Optional[str] = None
    route_of_administration: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    formulation_procedure: Optional[str] = None
    comparator: Optional[str] = None
    comparator_description: Optional[str] = None
    target_participants: Optional[int] = Field(None, gt=0)
    planned_enrollment_start_date: Optional[date] = None
    start_date: Optional[date] = None
    expected_completion_date: Optional[date] = None
    actual_completion_date: Optional[date] = None
    inclusion_criteria: Optional[str] = None
    exclusion_criteria: Optional[str] = None
    primary_objective: Optional[str] = None
    secondary_objectives: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.expected_completion_date:
            if self.expected_completion_date < self.start_date:
                raise ValueError("Expected completion date cannot be earlier than trial start date.")
        return self


class ClinicalTrialStatusUpdate(BaseModel):
    status: str = Field(..., description="Target trial status")
    notes: Optional[str] = Field(None, description="Rationale or audit notes for the status change")


class ClinicalTrialSummaryStats(BaseModel):
    total_trials: int
    draft_trials: int
    recruiting_trials: int
    active_trials: int
    completed_trials: int
    suspended_trials: int


class ClinicalTrialListItem(BaseModel):
    id: int
    trial_id: str
    trial_title: str
    short_title: Optional[str] = None
    protocol_number: str
    protocol_version: str
    study_type: str
    study_phase: str
    study_design: str
    sponsor: str
    principal_investigator_id: int
    principal_investigator: Optional[UserResponse] = None
    disease_condition: str
    ayurveda_intervention: str
    target_participants: int
    status: str
    start_date: date
    expected_completion_date: date
    site_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClinicalTrialDetailResponse(ClinicalTrialBase):
    id: int
    status: str
    is_archived: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    principal_investigator: Optional[UserResponse] = None
    protocol_versions: List[ProtocolVersionResponse] = []
    milestones: List[MilestoneResponse] = []
    sites: List[TrialSiteResponse] = []

    model_config = ConfigDict(from_attributes=True)
