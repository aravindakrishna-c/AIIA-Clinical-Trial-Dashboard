from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.adverse_event import (
    AdverseEventCreate,
    AdverseEventUpdate,
    AdverseEventReview,
    AdverseEventResponse,
    SafetySummaryStats
)
from app.services.safety_service import safety_service

router = APIRouter(tags=["AE, SAE, ADR & Pharmacovigilance"])


@router.get("/safety/summary", response_model=SafetySummaryStats)
def get_safety_summary(
    trial_id: Optional[int] = Query(None, description="Filter by clinical trial ID"),
    current_user: User = Depends(require_permission("safety.view")),
    db: Session = Depends(get_db)
):
    """Retrieve aggregate counts of Adverse Events, Serious AEs, and ADRs."""
    return safety_service.get_summary_stats(db, trial_id=trial_id)


@router.get("/safety", response_model=List[AdverseEventResponse])
def list_adverse_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    trial_id: Optional[int] = Query(None, description="Filter by trial ID"),
    site_id: Optional[int] = Query(None, description="Filter by site ID"),
    participant_id: Optional[int] = Query(None, description="Filter by participant ID"),
    is_serious: Optional[bool] = Query(None, description="Filter for Serious Adverse Events (SAE)"),
    severity: Optional[str] = Query(None, description="Filter by severity (Mild, Moderate, Severe)"),
    status: Optional[str] = Query(None, description="Filter by status (Draft, Reported, Under Review, Confirmed, Closed)"),
    current_user: User = Depends(require_permission("safety.view")),
    db: Session = Depends(get_db)
):
    """List safety events with clinical severity and regulatory seriousness filters."""
    return safety_service.list_adverse_events(
        db=db,
        skip=skip,
        limit=limit,
        trial_id=trial_id,
        site_id=site_id,
        participant_id=participant_id,
        is_serious=is_serious,
        severity=severity,
        status_filter=status
    )


@router.post("/safety", response_model=AdverseEventResponse, status_code=status.HTTP_201_CREATED)
def report_adverse_event(
    payload: AdverseEventCreate,
    current_user: User = Depends(require_permission("safety.create")),
    db: Session = Depends(get_db)
):
    """Report an Adverse Event (AE), Serious Adverse Event (SAE), or ADR."""
    ae = safety_service.create_adverse_event(db, payload, current_user)
    return safety_service.get_adverse_event(db, ae.id)


@router.get("/safety/{ae_id}", response_model=AdverseEventResponse)
def get_adverse_event_details(
    ae_id: int,
    current_user: User = Depends(require_permission("safety.view")),
    db: Session = Depends(get_db)
):
    """Retrieve detailed pharmacovigilance dossier for a safety event."""
    return safety_service.get_adverse_event(db, ae_id)


@router.post("/safety/{ae_id}/review", response_model=AdverseEventResponse)
def review_adverse_event(
    ae_id: int,
    payload: AdverseEventReview,
    current_user: User = Depends(require_permission("safety.review")),
    db: Session = Depends(get_db)
):
    """Perform medical/investigator safety review, causality determination, or closure."""
    return safety_service.review_adverse_event(db, ae_id, payload, current_user)
