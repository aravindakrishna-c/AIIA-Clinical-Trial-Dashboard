from datetime import datetime, timezone, date
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, or_
from fastapi import HTTPException, status

from app.models.clinical_trial import ClinicalTrial
from app.models.trial_protocol_version import TrialProtocolVersion
from app.models.trial_milestone import TrialMilestone
from app.models.trial_site import TrialSite
from app.models.user import User
from app.schemas.clinical_trial import (
    ClinicalTrialCreate,
    ClinicalTrialUpdate,
    ClinicalTrialListItem,
    ClinicalTrialSummaryStats
)
from app.schemas.trial_site import TrialSiteCreate, TrialSiteUpdate
from app.schemas.trial_protocol import ProtocolVersionCreate
from app.schemas.trial_milestone import MilestoneCreate, MilestoneUpdate
from app.services.audit_service import audit_service


# Strict GCP & Institutional Workflow Transition Rules
VALID_TRIAL_TRANSITIONS: Dict[str, List[str]] = {
    "Draft": ["Ethics Review"],
    "Ethics Review": ["Ethics Approved", "Draft"],
    "Ethics Approved": ["CTRI Pending"],
    "CTRI Pending": ["Recruiting"],
    "Recruiting": ["Active", "Suspended"],
    "Active": ["Suspended", "Completed", "Terminated"],
    "Suspended": ["Active", "Terminated"],
    "Completed": ["Closed"],
    "Terminated": ["Closed"],
    "Closed": []
}

VALID_SITE_TRANSITIONS: Dict[str, List[str]] = {
    "Pending": ["Ethics Pending"],
    "Ethics Pending": ["Activated", "Pending"],
    "Activated": ["Recruiting", "Suspended"],
    "Recruiting": ["Suspended", "Closed"],
    "Suspended": ["Recruiting", "Closed"],
    "Closed": []
}


class TrialService:
    def get_summary_stats(self, db: Session) -> ClinicalTrialSummaryStats:
        """Calculate dynamic clinical trial aggregate counts directly from PostgreSQL."""
        base_query = db.query(ClinicalTrial).filter(ClinicalTrial.is_archived.is_(False))
        total_trials = base_query.count()
        draft_trials = base_query.filter(ClinicalTrial.status == "Draft").count()
        recruiting_trials = base_query.filter(ClinicalTrial.status == "Recruiting").count()
        active_trials = base_query.filter(ClinicalTrial.status == "Active").count()
        completed_trials = base_query.filter(ClinicalTrial.status == "Completed").count()
        suspended_trials = base_query.filter(ClinicalTrial.status == "Suspended").count()

        return ClinicalTrialSummaryStats(
            total_trials=total_trials,
            draft_trials=draft_trials,
            recruiting_trials=recruiting_trials,
            active_trials=active_trials,
            completed_trials=completed_trials,
            suspended_trials=suspended_trials
        )

    def get_trials(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        study_type: Optional[str] = None,
        study_phase: Optional[str] = None,
        sponsor: Optional[str] = None,
        pi_id: Optional[int] = None
    ) -> Tuple[List[ClinicalTrialListItem], int]:
        """Fetch filtered trials list with site counts for dashboard display."""
        query = db.query(ClinicalTrial).options(
            joinedload(ClinicalTrial.principal_investigator),
            joinedload(ClinicalTrial.sites)
        ).filter(ClinicalTrial.is_archived.is_(False))

        if status_filter:
            query = query.filter(ClinicalTrial.status == status_filter)
        if study_type:
            query = query.filter(ClinicalTrial.study_type == study_type)
        if study_phase:
            query = query.filter(ClinicalTrial.study_phase == study_phase)
        if sponsor:
            query = query.filter(ClinicalTrial.sponsor.ilike(f"%{sponsor}%"))
        if pi_id:
            query = query.filter(ClinicalTrial.principal_investigator_id == pi_id)

        if search:
            search_pattern = f"%{search}%"
            query = query.join(ClinicalTrial.principal_investigator).filter(
                or_(
                    ClinicalTrial.trial_id.ilike(search_pattern),
                    ClinicalTrial.trial_title.ilike(search_pattern),
                    ClinicalTrial.protocol_number.ilike(search_pattern),
                    ClinicalTrial.disease_condition.ilike(search_pattern),
                    User.full_name.ilike(search_pattern)
                )
            )

        total = query.count()
        trials = query.order_by(desc(ClinicalTrial.created_at)).offset(skip).limit(limit).all()

        items = []
        for t in trials:
            item = ClinicalTrialListItem(
                id=t.id,
                trial_id=t.trial_id,
                trial_title=t.trial_title,
                short_title=t.short_title,
                protocol_number=t.protocol_number,
                protocol_version=t.protocol_version,
                study_type=t.study_type,
                study_phase=t.study_phase,
                study_design=t.study_design,
                sponsor=t.sponsor,
                principal_investigator_id=t.principal_investigator_id,
                principal_investigator=t.principal_investigator,
                disease_condition=t.disease_condition,
                ayurveda_intervention=t.ayurveda_intervention,
                target_participants=t.target_participants,
                status=t.status,
                start_date=t.start_date,
                expected_completion_date=t.expected_completion_date,
                site_count=len(t.sites) if t.sites else 0,
                created_at=t.created_at,
                updated_at=t.updated_at
            )
            items.append(item)

        return items, total

    def get_trial_by_id_or_code(self, db: Session, identifier: str) -> ClinicalTrial:
        """Fetch trial by numeric database ID or string trial_id."""
        query = db.query(ClinicalTrial).options(
            joinedload(ClinicalTrial.principal_investigator),
            joinedload(ClinicalTrial.protocol_versions),
            joinedload(ClinicalTrial.milestones),
            joinedload(ClinicalTrial.sites).joinedload(TrialSite.site_investigator)
        ).filter(ClinicalTrial.is_archived.is_(False))

        if identifier.isdigit():
            trial = query.filter(ClinicalTrial.id == int(identifier)).first()
        else:
            trial = query.filter(ClinicalTrial.trial_id == identifier).first()

        if not trial:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Clinical trial '{identifier}' not found."
            )
        return trial

    def create_trial(
        self,
        db: Session,
        trial_in: ClinicalTrialCreate,
        creator_id: int
    ) -> ClinicalTrial:
        """Register a new clinical trial record with validation, initial protocol version, and audit logging."""
        # Check uniqueness of trial_id
        if db.query(ClinicalTrial).filter(ClinicalTrial.trial_id == trial_in.trial_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Trial ID '{trial_in.trial_id}' already exists in the system."
            )

        # Check uniqueness of protocol_number
        if db.query(ClinicalTrial).filter(ClinicalTrial.protocol_number == trial_in.protocol_number).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Protocol number '{trial_in.protocol_number}' already registered under another trial."
            )

        # Validate PI user exists
        pi = db.query(User).filter(User.id == trial_in.principal_investigator_id).first()
        if not pi:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Principal Investigator user ID {trial_in.principal_investigator_id} does not exist."
            )

        trial_data = trial_in.model_dump()
        new_trial = ClinicalTrial(
            **trial_data,
            status="Draft",
            is_archived=False,
            created_by=creator_id
        )
        db.add(new_trial)
        db.flush()

        # Create initial protocol version
        initial_protocol = TrialProtocolVersion(
            trial_id=new_trial.id,
            version_number=trial_in.protocol_version,
            version_date=trial_in.protocol_version_date,
            change_summary="Initial trial protocol registration",
            status="Current",
            created_by=creator_id
        )
        db.add(initial_protocol)
        db.commit()
        db.refresh(new_trial)

        # Audit event
        audit_service.record_event(
            db=db,
            action="TRIAL_CREATED",
            entity_type="CLINICAL_TRIAL",
            entity_id=new_trial.trial_id,
            description=f"Created clinical trial '{new_trial.trial_id}' - {new_trial.trial_title} (Status: Draft)",
            user_id=creator_id,
            metadata={
                "trial_id": new_trial.trial_id,
                "protocol_number": new_trial.protocol_number,
                "study_phase": new_trial.study_phase,
                "target_participants": new_trial.target_participants,
                "principal_investigator": pi.full_name
            }
        )

        return self.get_trial_by_id_or_code(db, str(new_trial.id))

    def update_trial(
        self,
        db: Session,
        trial_id_or_code: str,
        trial_update: ClinicalTrialUpdate,
        updater_id: int
    ) -> ClinicalTrial:
        """Update permitted trial information with audit trail."""
        trial = self.get_trial_by_id_or_code(db, trial_id_or_code)

        update_dict = trial_update.model_dump(exclude_unset=True)
        if not update_dict:
            return trial

        # If updating PI, ensure user exists
        if "principal_investigator_id" in update_dict:
            pi = db.query(User).filter(User.id == update_dict["principal_investigator_id"]).first()
            if not pi:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Investigator ID {update_dict['principal_investigator_id']} does not exist."
                )

        # If updating protocol number, ensure uniqueness
        if "protocol_number" in update_dict and update_dict["protocol_number"] != trial.protocol_number:
            existing = db.query(ClinicalTrial).filter(
                ClinicalTrial.protocol_number == update_dict["protocol_number"],
                ClinicalTrial.id != trial.id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Protocol number '{update_dict['protocol_number']}' already registered."
                )

        changes = {}
        for key, value in update_dict.items():
            old_val = getattr(trial, key)
            if old_val != value:
                changes[key] = {"old": str(old_val), "new": str(value)}
                setattr(trial, key, value)

        trial.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(trial)

        # Record audit log
        if changes:
            audit_service.record_event(
                db=db,
                action="TRIAL_UPDATED",
                entity_type="CLINICAL_TRIAL",
                entity_id=trial.trial_id,
                description=f"Updated details for clinical trial '{trial.trial_id}'",
                user_id=updater_id,
                metadata={"trial_id": trial.trial_id, "changes": changes}
            )

        return self.get_trial_by_id_or_code(db, str(trial.id))

    def update_trial_status(
        self,
        db: Session,
        trial_id_or_code: str,
        target_status: str,
        updater_id: int,
        notes: Optional[str] = None
    ) -> ClinicalTrial:
        """Validate and execute a clinical trial status workflow transition."""
        trial = self.get_trial_by_id_or_code(db, trial_id_or_code)
        current_status = trial.status

        if current_status == target_status:
            return trial

        allowed_targets = VALID_TRIAL_TRANSITIONS.get(current_status, [])
        if target_status not in allowed_targets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid workflow transition from '{current_status}' to '{target_status}'. "
                    f"Allowed transitions from '{current_status}': {allowed_targets or ['None (Final state)']}"
                )
            )

        trial.status = target_status
        trial.updated_at = datetime.now(timezone.utc)
        if target_status == "Completed" and not trial.actual_completion_date:
            trial.actual_completion_date = date.today()

        db.commit()
        db.refresh(trial)

        audit_service.record_event(
            db=db,
            action="TRIAL_STATUS_CHANGED",
            entity_type="CLINICAL_TRIAL",
            entity_id=trial.trial_id,
            description=f"Changed status of trial '{trial.trial_id}' from '{current_status}' to '{target_status}'. Notes: {notes or 'N/A'}",
            user_id=updater_id,
            metadata={
                "trial_id": trial.trial_id,
                "previous_status": current_status,
                "new_status": target_status,
                "notes": notes
            }
        )

        return self.get_trial_by_id_or_code(db, str(trial.id))

    # --- Protocol Versions ---
    def add_protocol_version(
        self,
        db: Session,
        trial_id_or_code: str,
        protocol_in: ProtocolVersionCreate,
        creator_id: int
    ) -> TrialProtocolVersion:
        """Add a new protocol version, marking previous active versions as Superseded."""
        trial = self.get_trial_by_id_or_code(db, trial_id_or_code)

        # Mark existing current versions as Superseded
        for existing_ver in trial.protocol_versions:
            if existing_ver.status == "Current":
                existing_ver.status = "Superseded"

        new_version = TrialProtocolVersion(
            trial_id=trial.id,
            version_number=protocol_in.version_number,
            version_date=protocol_in.version_date,
            change_summary=protocol_in.change_summary,
            document_reference=protocol_in.document_reference,
            status="Current",
            created_by=creator_id
        )
        db.add(new_version)

        # Update trial active version metadata
        trial.protocol_version = protocol_in.version_number
        trial.protocol_version_date = protocol_in.version_date
        trial.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(new_version)

        audit_service.record_event(
            db=db,
            action="PROTOCOL_VERSION_CREATED",
            entity_type="TRIAL_PROTOCOL",
            entity_id=f"{trial.trial_id}-v{protocol_in.version_number}",
            description=f"Registered Protocol Version {protocol_in.version_number} for trial '{trial.trial_id}': {protocol_in.change_summary}",
            user_id=creator_id,
            metadata={
                "trial_id": trial.trial_id,
                "version_number": protocol_in.version_number,
                "change_summary": protocol_in.change_summary
            }
        )

        return new_version

    def get_protocol_versions(self, db: Session, trial_id_or_code: str) -> List[TrialProtocolVersion]:
        trial = self.get_trial_by_id_or_code(db, trial_id_or_code)
        return db.query(TrialProtocolVersion).filter(
            TrialProtocolVersion.trial_id == trial.id
        ).order_by(desc(TrialProtocolVersion.created_at)).all()

    # --- Milestones ---
    def add_milestone(
        self,
        db: Session,
        trial_id_or_code: str,
        milestone_in: MilestoneCreate,
        creator_id: int
    ) -> TrialMilestone:
        """Create a trial milestone."""
        trial = self.get_trial_by_id_or_code(db, trial_id_or_code)

        milestone = TrialMilestone(
            trial_id=trial.id,
            milestone_name=milestone_in.milestone_name,
            description=milestone_in.description,
            planned_date=milestone_in.planned_date,
            actual_date=milestone_in.actual_date,
            status=milestone_in.status,
            created_by=creator_id
        )
        db.add(milestone)
        db.commit()
        db.refresh(milestone)

        audit_service.record_event(
            db=db,
            action="MILESTONE_CREATED",
            entity_type="TRIAL_MILESTONE",
            entity_id=str(milestone.id),
            description=f"Added milestone '{milestone.milestone_name}' for trial '{trial.trial_id}'",
            user_id=creator_id,
            metadata={"trial_id": trial.trial_id, "milestone_name": milestone.milestone_name, "planned_date": str(milestone.planned_date)}
        )

        return milestone

    def update_milestone(
        self,
        db: Session,
        milestone_id: int,
        milestone_update: MilestoneUpdate,
        updater_id: int
    ) -> TrialMilestone:
        """Update milestone details or progress."""
        milestone = db.query(TrialMilestone).filter(TrialMilestone.id == milestone_id).first()
        if not milestone:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Milestone {milestone_id} not found.")

        update_dict = milestone_update.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(milestone, key, val)

        db.commit()
        db.refresh(milestone)

        audit_service.record_event(
            db=db,
            action="MILESTONE_UPDATED",
            entity_type="TRIAL_MILESTONE",
            entity_id=str(milestone.id),
            description=f"Updated milestone '{milestone.milestone_name}' status: {milestone.status}",
            user_id=updater_id,
            metadata={"milestone_id": milestone.id, "status": milestone.status}
        )
        return milestone

    def get_milestones(self, db: Session, trial_id_or_code: str) -> List[TrialMilestone]:
        trial = self.get_trial_by_id_or_code(db, trial_id_or_code)
        return db.query(TrialMilestone).filter(
            TrialMilestone.trial_id == trial.id
        ).order_by(TrialMilestone.planned_date.asc()).all()

    # --- Sites Management ---
    def add_site(
        self,
        db: Session,
        trial_id_or_code: str,
        site_in: TrialSiteCreate,
        creator_id: int
    ) -> TrialSite:
        """Add a clinical trial site to a trial."""
        trial = self.get_trial_by_id_or_code(db, trial_id_or_code)

        # Unique site_code per trial
        existing_site = db.query(TrialSite).filter(
            TrialSite.trial_id == trial.id,
            TrialSite.site_code == site_in.site_code
        ).first()
        if existing_site:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Site code '{site_in.site_code}' already registered under trial '{trial.trial_id}'."
            )

        # Validate site investigator if provided
        if site_in.site_investigator_id:
            inv = db.query(User).filter(User.id == site_in.site_investigator_id).first()
            if not inv:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Site investigator ID {site_in.site_investigator_id} does not exist."
                )

        new_site = TrialSite(
            trial_id=trial.id,
            site_code=site_in.site_code,
            site_name=site_in.site_name,
            institution=site_in.institution,
            location=site_in.location,
            city=site_in.city,
            state=site_in.state,
            country=site_in.country,
            site_investigator_id=site_in.site_investigator_id,
            activation_date=site_in.activation_date,
            site_status=site_in.site_status,
            enrollment_target=site_in.enrollment_target,
            current_enrollment=0
        )
        db.add(new_site)
        db.commit()
        db.refresh(new_site)

        audit_service.record_event(
            db=db,
            action="SITE_CREATED",
            entity_type="TRIAL_SITE",
            entity_id=f"{trial.trial_id}-{new_site.site_code}",
            description=f"Added site '{new_site.site_code}' ({new_site.site_name}) to trial '{trial.trial_id}'. Target: {new_site.enrollment_target}",
            user_id=creator_id,
            metadata={
                "trial_id": trial.trial_id,
                "site_code": new_site.site_code,
                "institution": new_site.institution,
                "enrollment_target": new_site.enrollment_target
            }
        )

        return new_site

    def update_site(
        self,
        db: Session,
        site_id: int,
        site_update: TrialSiteUpdate,
        updater_id: int
    ) -> TrialSite:
        """Update site information."""
        site = db.query(TrialSite).filter(TrialSite.id == site_id).first()
        if not site:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Site {site_id} not found.")

        update_dict = site_update.model_dump(exclude_unset=True)
        if "site_investigator_id" in update_dict and update_dict["site_investigator_id"]:
            inv = db.query(User).filter(User.id == update_dict["site_investigator_id"]).first()
            if not inv:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Site investigator ID {update_dict['site_investigator_id']} does not exist."
                )

        for key, val in update_dict.items():
            setattr(site, key, val)

        site.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(site)

        audit_service.record_event(
            db=db,
            action="SITE_UPDATED",
            entity_type="TRIAL_SITE",
            entity_id=str(site.id),
            description=f"Updated details for site '{site.site_code}' ({site.site_name})",
            user_id=updater_id,
            metadata={"site_id": site.id, "site_code": site.site_code}
        )
        return site

    def update_site_status(
        self,
        db: Session,
        site_id: int,
        target_status: str,
        updater_id: int,
        notes: Optional[str] = None
    ) -> TrialSite:
        """Validate and transition site status."""
        site = db.query(TrialSite).filter(TrialSite.id == site_id).first()
        if not site:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Site {site_id} not found.")

        current_status = site.site_status
        if current_status == target_status:
            return site

        allowed_targets = VALID_SITE_TRANSITIONS.get(current_status, [])
        if target_status not in allowed_targets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid site status transition from '{current_status}' to '{target_status}'. "
                    f"Allowed transitions from '{current_status}': {allowed_targets or ['None']}"
                )
            )

        site.site_status = target_status
        site.updated_at = datetime.now(timezone.utc)
        if target_status == "Activated" and not site.activation_date:
            site.activation_date = date.today()

        db.commit()
        db.refresh(site)

        audit_service.record_event(
            db=db,
            action="SITE_STATUS_CHANGED",
            entity_type="TRIAL_SITE",
            entity_id=str(site.id),
            description=f"Changed site '{site.site_code}' status from '{current_status}' to '{target_status}'. Notes: {notes or 'N/A'}",
            user_id=updater_id,
            metadata={
                "site_id": site.id,
                "site_code": site.site_code,
                "previous_status": current_status,
                "new_status": target_status,
                "notes": notes
            }
        )

        return site

    def get_trial_sites(self, db: Session, trial_id_or_code: str) -> List[TrialSite]:
        trial = self.get_trial_by_id_or_code(db, trial_id_or_code)
        return db.query(TrialSite).options(
            joinedload(TrialSite.site_investigator)
        ).filter(TrialSite.trial_id == trial.id).order_by(TrialSite.site_code.asc()).all()


trial_service = TrialService()
