from datetime import datetime, date
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.schemas.clinical_trial import ClinicalTrialSummaryStats
from app.schemas.participant import ParticipantSummaryStats
from app.schemas.adverse_event import SafetySummaryStats


class SiteEnrollmentMetric(BaseModel):
    site_id: int
    site_code: str
    site_name: str
    trial_id_str: str
    current_enrollment: int
    enrollment_target: int
    enrollment_percentage: float
    site_status: str


class TrialEnrollmentMetric(BaseModel):
    trial_id: int
    trial_id_str: str
    trial_title: str
    current_enrolled: int
    target_participants: int
    enrollment_percentage: float
    status: str


class StatusDistributionItem(BaseModel):
    status: str
    count: int


class SafetyTrendItem(BaseModel):
    month: str
    ae_count: int
    sae_count: int


class MilestoneItem(BaseModel):
    id: int
    trial_id_str: str
    milestone_name: str
    planned_date: date
    actual_date: Optional[date] = None
    status: str
    deadline_status: str  # Upcoming, Due Soon, Overdue, Completed


class DashboardAlertItem(BaseModel):
    id: str
    category: str  # RECRUITMENT, VISIT, ETHICS, CTRI, SAFETY, REGULATORY
    severity: str  # INFO, WARNING, CRITICAL
    title: str
    message: str
    entity_type: str
    entity_id: str
    timestamp: datetime
    action_url: Optional[str] = None


class DashboardMetricsResponse(BaseModel):
    trial_stats: ClinicalTrialSummaryStats
    participant_stats: ParticipantSummaryStats
    safety_stats: SafetySummaryStats
    total_sites: int
    activated_sites: int
    recruiting_sites: int
    suspended_sites: int
    overdue_visits_count: int
    upcoming_ethics_expiry_count: int
    regulatory_deadlines_count: int
    trial_enrollment_progress: List[TrialEnrollmentMetric]
    site_enrollment_breakdown: List[SiteEnrollmentMetric]
    participant_status_distribution: List[StatusDistributionItem]
    trial_status_distribution: List[StatusDistributionItem]
    safety_trends: List[SafetyTrendItem]
    milestones: List[MilestoneItem]
    generated_at: datetime
