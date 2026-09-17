from datetime import datetime, timezone, date, timedelta
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from fastapi import HTTPException, status

from app.models.ethics_submission import EthicsSubmission
from app.models.ctri_regulatory import CTRIRegistration, RegulatoryEvent
from app.models.clinical_trial import ClinicalTrial
from app.models.user import User
from app.schemas.ethics_regulatory import (
    EthicsSubmissionCreate,
    EthicsDecisionUpdate,
    CTRIRegistrationUpdate,
    RegulatoryEventCreate,
    RegulatoryEventUpdate
)
from app.services.audit_service import audit_service


class RegulatoryService:
    # --- Ethics ---
    def list_ethics_submissions(self, db: Session, trial_id: Optional[int] = None) -> List[EthicsSubmission]:
        query = db.query(EthicsSubmission)
        if trial_id:
            query = query.filter(EthicsSubmission.trial_id == trial_id)
        return query.order_by(desc(EthicsSubmission.submission_date)).all()

    def create_ethics_submission(
        self,
        db: Session,
        payload: EthicsSubmissionCreate,
        current_user: User
    ) -> EthicsSubmission:
        trial = db.query(ClinicalTrial).filter(ClinicalTrial.id == payload.trial_id).first()
        if not trial:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trial not found")

        sub = EthicsSubmission(
            trial_id=trial.id,
            protocol_version=payload.protocol_version,
            submission_date=payload.submission_date,
            status="Submitted",
            comments=payload.comments,
            document_metadata=payload.document_metadata or {},
            submitted_by=current_user.id
        )
        db.add(sub)
        
        # Advance trial status to Ethics Review if in Draft
        if trial.status == "Draft":
            trial.status = "Ethics Review"

        db.commit()
        db.refresh(sub)

        audit_service.record_event(
            db=db,
            action="ETHICS_SUBMITTED",
            entity_type="ETHICS_SUBMISSION",
            entity_id=str(sub.id),
            description=f"Submitted protocol v{sub.protocol_version} of trial '{trial.trial_id}' for Institutional Ethics Review.",
            user_id=current_user.id,
            metadata={"trial_id": trial.trial_id, "submission_id": sub.id, "protocol_version": sub.protocol_version}
        )
        return sub

    def record_ethics_decision(
        self,
        db: Session,
        submission_id: int,
        decision_data: EthicsDecisionUpdate,
        current_user: User
    ) -> EthicsSubmission:
        sub = db.query(EthicsSubmission).filter(EthicsSubmission.id == submission_id).first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ethics submission not found")

        trial = db.query(ClinicalTrial).filter(ClinicalTrial.id == sub.trial_id).first()

        sub.decision = decision_data.decision
        sub.review_date = decision_data.review_date
        sub.status = decision_data.decision
        sub.approval_number = decision_data.approval_number
        sub.approval_date = decision_data.approval_date
        sub.expiry_date = decision_data.expiry_date
        if decision_data.comments:
            sub.comments = f"{sub.comments}\n[Review]: {decision_data.comments}" if sub.comments else decision_data.comments
        sub.reviewed_by = current_user.id

        # Update trial status if approved
        if decision_data.decision == "Approved" and trial:
            if trial.status in ["Draft", "Ethics Review"]:
                trial.status = "Ethics Approved"

        db.commit()
        db.refresh(sub)

        audit_service.record_event(
            db=db,
            action="ETHICS_DECISION_RECORDED",
            entity_type="ETHICS_SUBMISSION",
            entity_id=str(sub.id),
            description=f"Ethics decision '{decision_data.decision}' recorded for trial '{trial.trial_id if trial else ''}'. Approval #{decision_data.approval_number or 'N/A'}.",
            user_id=current_user.id,
            metadata={"decision": decision_data.decision, "approval_number": decision_data.approval_number}
        )
        return sub

    # --- CTRI ---
    def get_ctri_registration(self, db: Session, trial_id: int) -> Optional[CTRIRegistration]:
        return db.query(CTRIRegistration).filter(CTRIRegistration.trial_id == trial_id).first()

    def update_ctri_registration(
        self,
        db: Session,
        trial_id: int,
        payload: CTRIRegistrationUpdate,
        current_user: User
    ) -> CTRIRegistration:
        trial = db.query(ClinicalTrial).filter(ClinicalTrial.id == trial_id).first()
        if not trial:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trial not found")

        ctri = db.query(CTRIRegistration).filter(CTRIRegistration.trial_id == trial_id).first()
        if not ctri:
            ctri = CTRIRegistration(trial_id=trial_id, status=payload.status)
            db.add(ctri)

        if payload.ctri_number:
            ctri.ctri_number = payload.ctri_number
        ctri.status = payload.status
        if payload.submission_date:
            ctri.submission_date = payload.submission_date
        if payload.registration_date:
            ctri.registration_date = payload.registration_date
        if payload.last_update_date:
            ctri.last_update_date = payload.last_update_date
        if payload.next_update_deadline:
            ctri.next_update_deadline = payload.next_update_deadline
        if payload.notes:
            ctri.notes = payload.notes
        if payload.responsible_person:
            ctri.responsible_person = payload.responsible_person

        # If CTRI is registered, trial can progress to Recruiting
        if payload.status == "Registered" and trial.status == "CTRI Pending":
            trial.status = "Recruiting"

        db.commit()
        db.refresh(ctri)

        audit_service.record_event(
            db=db,
            action="CTRI_STATUS_UPDATED",
            entity_type="CTRI",
            entity_id=ctri.ctri_number or str(ctri.id),
            description=f"CTRI status updated to '{payload.status}' for trial '{trial.trial_id}'. Number: '{ctri.ctri_number or 'Pending'}'.",
            user_id=current_user.id,
            metadata={"status": payload.status, "ctri_number": ctri.ctri_number}
        )
        return ctri

    # --- Regulatory Events ---
    def list_regulatory_events(self, db: Session, trial_id: Optional[int] = None) -> List[RegulatoryEvent]:
        query = db.query(RegulatoryEvent)
        if trial_id:
            query = query.filter(RegulatoryEvent.trial_id == trial_id)
        return query.order_by(RegulatoryEvent.due_date.asc()).all()

    def create_regulatory_event(
        self,
        db: Session,
        payload: RegulatoryEventCreate,
        current_user: User
    ) -> RegulatoryEvent:
        event = RegulatoryEvent(
            trial_id=payload.trial_id,
            event_type=payload.event_type,
            submission_date=payload.submission_date,
            due_date=payload.due_date,
            responsible_person=payload.responsible_person,
            notes=payload.notes,
            status="Pending"
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        audit_service.record_event(
            db=db,
            action="REGULATORY_EVENT_CREATED",
            entity_type="REGULATORY_EVENT",
            entity_id=str(event.id),
            description=f"Created statutory regulatory filing requirement '{event.event_type}' due on {event.due_date}.",
            user_id=current_user.id,
            metadata={"event_type": event.event_type, "due_date": str(event.due_date)}
        )
        return event

    def update_regulatory_event(
        self,
        db: Session,
        event_id: int,
        payload: RegulatoryEventUpdate,
        current_user: User
    ) -> RegulatoryEvent:
        event = db.query(RegulatoryEvent).filter(RegulatoryEvent.id == event_id).first()
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regulatory event not found")

        if payload.submission_date is not None:
            event.submission_date = payload.submission_date
        if payload.due_date is not None:
            event.due_date = payload.due_date
        if payload.completion_date is not None:
            event.completion_date = payload.completion_date
        if payload.status is not None:
            event.status = payload.status
        if payload.responsible_person is not None:
            event.responsible_person = payload.responsible_person
        if payload.notes is not None:
            event.notes = payload.notes

        db.commit()
        db.refresh(event)

        audit_service.record_event(
            db=db,
            action="REGULATORY_EVENT_UPDATED",
            entity_type="REGULATORY_EVENT",
            entity_id=str(event.id),
            description=f"Updated regulatory event '{event.event_type}' status to '{event.status}'.",
            user_id=current_user.id,
            metadata={"status": event.status}
        )
        return event


regulatory_service = RegulatoryService()
