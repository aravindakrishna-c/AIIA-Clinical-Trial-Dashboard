from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.clinical_trial import (
    ClinicalTrialCreate,
    ClinicalTrialUpdate,
    ClinicalTrialStatusUpdate,
    ClinicalTrialListItem,
    ClinicalTrialDetailResponse,
    ClinicalTrialSummaryStats
)
from app.schemas.trial_protocol import ProtocolVersionCreate, ProtocolVersionResponse
from app.schemas.trial_milestone import MilestoneCreate, MilestoneUpdate, MilestoneResponse
from app.schemas.trial_site import (
    TrialSiteCreate,
    TrialSiteUpdate,
    TrialSiteStatusUpdate,
    TrialSiteResponse
)
from app.schemas.audit_log import AuditLogResponse
from app.services.trial_service import trial_service

router = APIRouter(tags=["Clinical Trials & Site Management"])


# ==========================================
# 1. Summary & Listing Endpoints
# ==========================================

@router.get("/trials/summary", response_model=ClinicalTrialSummaryStats)
def get_trials_summary(
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """
    Get live aggregate counts of clinical trials directly calculated from the database.
    Required permission: trial.view
    """
    return trial_service.get_summary_stats(db)


@router.get("/trials", response_model=List[ClinicalTrialListItem])
def list_trials(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by Trial ID, title, disease, PI, or protocol #"),
    status: Optional[str] = Query(None, description="Filter by trial status"),
    study_type: Optional[str] = Query(None, description="Filter by study type (Interventional, Observational)"),
    study_phase: Optional[str] = Query(None, description="Filter by study phase"),
    sponsor: Optional[str] = Query(None, description="Filter by sponsor name"),
    pi_id: Optional[int] = Query(None, description="Filter by Principal Investigator user ID"),
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """
    List clinical trials with multi-facet filtering, instant search, and pagination.
    Required permission: trial.view
    """
    trials, _ = trial_service.get_trials(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status_filter=status,
        study_type=study_type,
        study_phase=study_phase,
        sponsor=sponsor,
        pi_id=pi_id
    )
    return trials


# ==========================================
# 2. Trial Details & CRUD
# ==========================================

@router.post("/trials", response_model=ClinicalTrialDetailResponse, status_code=status.HTTP_201_CREATED)
def create_clinical_trial(
    trial_in: ClinicalTrialCreate,
    current_user: User = Depends(require_permission("trial.create")),
    db: Session = Depends(get_db)
):
    """
    Register a new clinical trial protocol in Draft status.
    Initializes version 1.0 in protocol history and logs regulatory audit event.
    Required permission: trial.create
    """
    return trial_service.create_trial(
        db=db,
        trial_in=trial_in,
        creator_id=current_user.id
    )


@router.get("/trials/{trial_id}", response_model=ClinicalTrialDetailResponse)
def get_trial_details(
    trial_id: str,
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """
    Fetch complete details of a clinical trial including protocol history, milestones, and sites.
    Can query by numeric ID or string trial_id (e.g. AIIA-CT-2026-001).
    Required permission: trial.view
    """
    return trial_service.get_trial_by_id_or_code(db, trial_id)


@router.put("/trials/{trial_id}", response_model=ClinicalTrialDetailResponse)
def update_clinical_trial(
    trial_id: str,
    trial_update: ClinicalTrialUpdate,
    current_user: User = Depends(require_permission("trial.edit")),
    db: Session = Depends(get_db)
):
    """
    Update permitted trial details. Records immutable audit log with diff metadata.
    Required permission: trial.edit
    """
    return trial_service.update_trial(
        db=db,
        trial_id_or_code=trial_id,
        trial_update=trial_update,
        updater_id=current_user.id
    )


@router.patch("/trials/{trial_id}/status", response_model=ClinicalTrialDetailResponse)
def update_trial_status(
    trial_id: str,
    status_update: ClinicalTrialStatusUpdate,
    current_user: User = Depends(require_permission("trial.status.update")),
    db: Session = Depends(get_db)
):
    """
    Validate and execute a formal status transition according to GCP trial lifecycle rules.
    Required permission: trial.status.update
    """
    return trial_service.update_trial_status(
        db=db,
        trial_id_or_code=trial_id,
        target_status=status_update.status,
        updater_id=current_user.id,
        notes=status_update.notes
    )


# ==========================================
# 3. Protocol Versions
# ==========================================

@router.get("/trials/{trial_id}/protocols", response_model=List[ProtocolVersionResponse])
def get_trial_protocol_versions(
    trial_id: str,
    current_user: User = Depends(require_permission("trial.protocol.view")),
    db: Session = Depends(get_db)
):
    """
    Retrieve protocol version history for a trial.
    Required permission: trial.protocol.view
    """
    return trial_service.get_protocol_versions(db, trial_id)


@router.post("/trials/{trial_id}/protocols", response_model=ProtocolVersionResponse, status_code=status.HTTP_201_CREATED)
def create_trial_protocol_version(
    trial_id: str,
    protocol_in: ProtocolVersionCreate,
    current_user: User = Depends(require_permission("trial.protocol.manage")),
    db: Session = Depends(get_db)
):
    """
    Add a new protocol version amendment. Automatically supersedes prior current version.
    Required permission: trial.protocol.manage
    """
    return trial_service.add_protocol_version(
        db=db,
        trial_id_or_code=trial_id,
        protocol_in=protocol_in,
        creator_id=current_user.id
    )


# ==========================================
# 4. Trial Milestones
# ==========================================

@router.get("/trials/{trial_id}/milestones", response_model=List[MilestoneResponse])
def get_trial_milestones(
    trial_id: str,
    current_user: User = Depends(require_permission("trial.milestone.view")),
    db: Session = Depends(get_db)
):
    """
    List chronological operational milestones for a trial.
    Required permission: trial.milestone.view
    """
    return trial_service.get_milestones(db, trial_id)


@router.post("/trials/{trial_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_trial_milestone(
    trial_id: str,
    milestone_in: MilestoneCreate,
    current_user: User = Depends(require_permission("trial.milestone.manage")),
    db: Session = Depends(get_db)
):
    """
    Create a new operational or regulatory milestone for a trial.
    Required permission: trial.milestone.manage
    """
    return trial_service.add_milestone(
        db=db,
        trial_id_or_code=trial_id,
        milestone_in=milestone_in,
        creator_id=current_user.id
    )


@router.put("/milestones/{milestone_id}", response_model=MilestoneResponse)
@router.put("/trials/{trial_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_trial_milestone(
    milestone_id: int,
    milestone_update: MilestoneUpdate,
    trial_id: Optional[str] = None,
    current_user: User = Depends(require_permission("trial.milestone.manage")),
    db: Session = Depends(get_db)
):
    """
    Update milestone status, dates, or details.
    Required permission: trial.milestone.manage
    """
    return trial_service.update_milestone(
        db=db,
        milestone_id=milestone_id,
        milestone_update=milestone_update,
        updater_id=current_user.id
    )


# ==========================================
# 5. Trial Sites Management
# ==========================================

@router.get("/trials/{trial_id}/sites", response_model=List[TrialSiteResponse])
def get_trial_sites(
    trial_id: str,
    current_user: User = Depends(require_permission("trial.site.view")),
    db: Session = Depends(get_db)
):
    """
    List all investigational sites registered for a trial.
    Required permission: trial.site.view
    """
    return trial_service.get_trial_sites(db, trial_id)


@router.post("/trials/{trial_id}/sites", response_model=TrialSiteResponse, status_code=status.HTTP_201_CREATED)
def add_trial_site(
    trial_id: str,
    site_in: TrialSiteCreate,
    current_user: User = Depends(require_permission("trial.site.create")),
    db: Session = Depends(get_db)
):
    """
    Register a new investigational site under a clinical trial.
    Required permission: trial.site.create
    """
    return trial_service.add_site(
        db=db,
        trial_id_or_code=trial_id,
        site_in=site_in,
        creator_id=current_user.id
    )


@router.put("/sites/{site_id}", response_model=TrialSiteResponse)
@router.put("/trials/{trial_id}/sites/{site_id}", response_model=TrialSiteResponse)
def update_trial_site(
    site_id: int,
    site_update: TrialSiteUpdate,
    trial_id: Optional[str] = None,
    current_user: User = Depends(require_permission("trial.site.edit")),
    db: Session = Depends(get_db)
):
    """
    Update site demographics, targets, or site investigator.
    Required permission: trial.site.edit
    """
    return trial_service.update_site(
        db=db,
        site_id=site_id,
        site_update=site_update,
        updater_id=current_user.id
    )


@router.patch("/sites/{site_id}/status", response_model=TrialSiteResponse)
@router.patch("/trials/{trial_id}/sites/{site_id}/status", response_model=TrialSiteResponse)
def update_trial_site_status(
    site_id: int,
    status_update: TrialSiteStatusUpdate,
    trial_id: Optional[str] = None,
    current_user: User = Depends(require_permission("trial.site.edit")),
    db: Session = Depends(get_db)
):
    """
    Validate and transition investigational site activation/recruitment status.
    Required permission: trial.site.edit
    """
    return trial_service.update_site_status(
        db=db,
        site_id=site_id,
        target_status=status_update.site_status,
        updater_id=current_user.id,
        notes=status_update.notes
    )


# ==========================================
# 6. Trial Audit Activity
# ==========================================

@router.get("/trials/{trial_id}/audit-trail", response_model=List[AuditLogResponse])
@router.get("/trials/{trial_id}/audit-logs", response_model=List[AuditLogResponse])
def get_trial_audit_trail(
    trial_id: str,
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """
    Retrieve audit trail events strictly related to this clinical trial, its sites, milestones, and protocols.
    Required permission: trial.view
    """
    trial = trial_service.get_trial_by_id_or_code(db, trial_id)
    search_pattern = f"%{trial.trial_id}%"

    logs = db.query(AuditLog).filter(
        (AuditLog.entity_id.ilike(search_pattern)) |
        (AuditLog.description.ilike(search_pattern))
    ).order_by(desc(AuditLog.timestamp)).limit(100).all()

    return logs
