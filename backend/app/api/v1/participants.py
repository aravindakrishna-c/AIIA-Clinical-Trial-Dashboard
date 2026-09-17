from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantScreeningEvaluation,
    ParticipantEnroll,
    ParticipantRandomize,
    ParticipantWithdraw,
    ParticipantComplete,
    ParticipantListItem,
    ParticipantDetail,
    ParticipantSummaryStats
)
from app.schemas.participant_visit import VisitResponse, VisitComplete
from app.services.participant_service import participant_service

router = APIRouter(tags=["Participant Lifecycle Management"])


@router.get("/participants/summary", response_model=ParticipantSummaryStats)
def get_participants_summary(
    trial_id: Optional[int] = Query(None, description="Filter by trial ID"),
    current_user: User = Depends(require_permission("participant.view")),
    db: Session = Depends(get_db)
):
    """Get dynamic aggregate counts of participants across lifecycle stages."""
    return participant_service.get_summary_stats(db, trial_id=trial_id)


@router.get("/participants", response_model=List[ParticipantListItem])
def list_participants(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    trial_id: Optional[int] = Query(None, description="Filter by clinical trial ID"),
    site_id: Optional[int] = Query(None, description="Filter by trial site ID"),
    status: Optional[str] = Query(None, description="Filter by lifecycle status"),
    eligibility_status: Optional[str] = Query(None, description="Filter by eligibility"),
    treatment_group: Optional[str] = Query(None, description="Filter by assigned group"),
    search: Optional[str] = Query(None, description="Search by Participant ID or Screening #"),
    current_user: User = Depends(require_permission("participant.view")),
    db: Session = Depends(get_db)
):
    """List clinical trial participants with advanced filtering."""
    return participant_service.list_participants(
        db=db,
        skip=skip,
        limit=limit,
        trial_id=trial_id,
        site_id=site_id,
        status_filter=status,
        eligibility_filter=eligibility_status,
        treatment_group=treatment_group,
        search=search
    )


@router.post("/participants/screen", response_model=ParticipantDetail, status_code=status.HTTP_201_CREATED)
def screen_new_participant(
    payload: ParticipantCreate,
    current_user: User = Depends(require_permission("participant.screen")),
    db: Session = Depends(get_db)
):
    """Initiate participant screening for a clinical study site."""
    p = participant_service.screen_participant(db, payload, current_user)
    return participant_service.get_participant(db, p.id)


@router.get("/participants/{participant_id}", response_model=ParticipantDetail)
def get_participant_profile(
    participant_id: int,
    current_user: User = Depends(require_permission("participant.view")),
    db: Session = Depends(get_db)
):
    """Retrieve full participant profile including screening checklist and trial/site details."""
    return participant_service.get_participant(db, participant_id)


@router.post("/participants/{participant_id}/evaluate", response_model=ParticipantDetail)
def evaluate_participant_eligibility(
    participant_id: int,
    payload: ParticipantScreeningEvaluation,
    current_user: User = Depends(require_permission("participant.screen")),
    db: Session = Depends(get_db)
):
    """Evaluate protocol inclusion/exclusion criteria scorecard and set eligibility decision."""
    participant_service.evaluate_eligibility(db, participant_id, payload, current_user)
    return participant_service.get_participant(db, participant_id)


@router.post("/participants/{participant_id}/enroll", response_model=ParticipantDetail)
def enroll_eligible_participant(
    participant_id: int,
    payload: ParticipantEnroll,
    current_user: User = Depends(require_permission("participant.enroll")),
    db: Session = Depends(get_db)
):
    """Enroll verified eligible participant into trial and generate protocol visit schedule."""
    participant_service.enroll_participant(db, participant_id, payload, current_user)
    return participant_service.get_participant(db, participant_id)


@router.post("/participants/{participant_id}/randomize", response_model=ParticipantDetail)
def randomize_participant(
    participant_id: int,
    payload: ParticipantRandomize,
    current_user: User = Depends(require_permission("participant.randomize")),
    db: Session = Depends(get_db)
):
    """Perform server-side randomization into Group A or Group B and transition to Active status."""
    participant_service.randomize_participant(db, participant_id, payload, current_user)
    return participant_service.get_participant(db, participant_id)


@router.post("/participants/{participant_id}/withdraw", response_model=ParticipantDetail)
def withdraw_participant(
    participant_id: int,
    payload: ParticipantWithdraw,
    current_user: User = Depends(require_permission("participant.withdraw")),
    db: Session = Depends(get_db)
):
    """Record participant study withdrawal with clinical reason and cancel pending visits."""
    participant_service.withdraw_participant(db, participant_id, payload, current_user)
    return participant_service.get_participant(db, participant_id)


@router.post("/participants/{participant_id}/complete", response_model=ParticipantDetail)
def complete_participant(
    participant_id: int,
    payload: ParticipantComplete,
    current_user: User = Depends(require_permission("participant.complete")),
    db: Session = Depends(get_db)
):
    """Record participant completion of all trial protocol visits."""
    participant_service.complete_participant(db, participant_id, payload, current_user)
    return participant_service.get_participant(db, participant_id)


# --- Clinical Visits ---
@router.get("/participants/{participant_id}/visits", response_model=List[VisitResponse])
def list_participant_visits(
    participant_id: int,
    current_user: User = Depends(require_permission("participant.view")),
    db: Session = Depends(get_db)
):
    """Get all scheduled and completed clinical visits for participant."""
    return participant_service.get_visits(db, participant_id)


@router.post("/visits/{visit_id}/complete", response_model=VisitResponse)
def complete_clinical_visit(
    visit_id: int,
    payload: VisitComplete,
    current_user: User = Depends(require_permission("participant.visit")),
    db: Session = Depends(get_db)
):
    """Record actual visit completion timestamp and clinical notes."""
    return participant_service.complete_visit(db, visit_id, payload, current_user)


@router.put("/participants/{participant_id}/visits/{visit_id}", response_model=VisitResponse)
def update_participant_visit(
    participant_id: int,
    visit_id: int,
    payload: VisitComplete,
    current_user: User = Depends(require_permission("participant.visit")),
    db: Session = Depends(get_db)
):
    """Update or record participant clinical visit completion."""
    return participant_service.complete_visit(db, visit_id, payload, current_user)
