from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.ethics_regulatory import (
    EthicsSubmissionCreate,
    EthicsDecisionUpdate,
    EthicsSubmissionResponse,
    CTRIRegistrationUpdate,
    CTRIRegistrationResponse,
    RegulatoryEventCreate,
    RegulatoryEventUpdate,
    RegulatoryEventResponse
)
from app.services.regulatory_service import regulatory_service

router = APIRouter(tags=["Ethics, CTRI & Regulatory Management"])


# --- Ethics Submissions ---
@router.get("/ethics", response_model=List[EthicsSubmissionResponse])
def list_ethics_submissions(
    trial_id: Optional[int] = Query(None, description="Filter by clinical trial ID"),
    current_user: User = Depends(require_permission("ethics.view")),
    db: Session = Depends(get_db)
):
    """Retrieve all Institutional Ethics Committee submissions."""
    return regulatory_service.list_ethics_submissions(db, trial_id=trial_id)


@router.post("/ethics", response_model=EthicsSubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_ethics_submission(
    payload: EthicsSubmissionCreate,
    current_user: User = Depends(require_permission("ethics.submit")),
    db: Session = Depends(get_db)
):
    """Submit trial protocol amendment/document for IEC ethical review."""
    return regulatory_service.create_ethics_submission(db, payload, current_user)


@router.post("/ethics/{submission_id}/decision", response_model=EthicsSubmissionResponse)
def record_ethics_decision(
    submission_id: int,
    payload: EthicsDecisionUpdate,
    current_user: User = Depends(require_permission("ethics.review")),
    db: Session = Depends(get_db)
):
    """Record Institutional Ethics Committee decision (Approved, Changes Required, Rejected)."""
    return regulatory_service.record_ethics_decision(db, submission_id, payload, current_user)


# --- CTRI Tracking ---
@router.get("/ctri/{trial_id}", response_model=Optional[CTRIRegistrationResponse])
def get_ctri_registration(
    trial_id: int,
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """Get CTRI statutory registration dossier for trial."""
    return regulatory_service.get_ctri_registration(db, trial_id)


@router.put("/ctri/{trial_id}", response_model=CTRIRegistrationResponse)
def update_ctri_registration(
    trial_id: int,
    payload: CTRIRegistrationUpdate,
    current_user: User = Depends(require_permission("trial.edit")),
    db: Session = Depends(get_db)
):
    """Update CTRI registration number, status, and reporting milestones."""
    return regulatory_service.update_ctri_registration(db, trial_id, payload, current_user)


# --- Regulatory Events ---
@router.get("/regulatory", response_model=List[RegulatoryEventResponse])
@router.get("/regulatory/events", response_model=List[RegulatoryEventResponse])
def list_regulatory_events(
    trial_id: Optional[int] = Query(None, description="Filter by clinical trial ID"),
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """Retrieve statutory regulatory submission and inspection milestones."""
    return regulatory_service.list_regulatory_events(db, trial_id=trial_id)


@router.post("/regulatory", response_model=RegulatoryEventResponse, status_code=status.HTTP_201_CREATED)
@router.post("/regulatory/events", response_model=RegulatoryEventResponse, status_code=status.HTTP_201_CREATED)
def create_regulatory_event(
    payload: RegulatoryEventCreate,
    current_user: User = Depends(require_permission("trial.edit")),
    db: Session = Depends(get_db)
):
    """Register new regulatory filing requirement or CDSCO/Ayush inspection."""
    return regulatory_service.create_regulatory_event(db, payload, current_user)


@router.patch("/regulatory/{event_id}", response_model=RegulatoryEventResponse)
def update_regulatory_event(
    event_id: int,
    payload: RegulatoryEventUpdate,
    current_user: User = Depends(require_permission("trial.edit")),
    db: Session = Depends(get_db)
):
    """Update regulatory event progress, completion date, or filing status."""
    return regulatory_service.update_regulatory_event(db, event_id, payload, current_user)
