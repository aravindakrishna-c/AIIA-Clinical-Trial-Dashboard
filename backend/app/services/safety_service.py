from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from fastapi import HTTPException, status

from app.models.adverse_event import AdverseEvent
from app.models.clinical_trial import ClinicalTrial
from app.models.trial_site import TrialSite
from app.models.participant import Participant
from app.models.user import User
from app.schemas.adverse_event import (
    AdverseEventCreate,
    AdverseEventUpdate,
    AdverseEventReview,
    AdverseEventResponse,
    SafetySummaryStats
)
from app.services.audit_service import audit_service


class SafetyService:
    def _generate_ae_id(self, db: Session) -> str:
        year = date.today().year
        count = db.query(AdverseEvent).count() + 1
        return f"AE-{year}-{count:04d}"

    def get_summary_stats(self, db: Session, trial_id: Optional[int] = None) -> SafetySummaryStats:
        query = db.query(AdverseEvent)
        if trial_id:
            query = query.filter(AdverseEvent.trial_id == trial_id)

        all_events = query.all()
        return SafetySummaryStats(
            total_ae=len(all_events),
            total_sae=sum(1 for e in all_events if e.is_serious),
            total_adr=sum(1 for e in all_events if e.is_adr),
            open_events=sum(1 for e in all_events if e.status in ["Reported", "Draft"]),
            under_review=sum(1 for e in all_events if e.status == "Under Review"),
            resolved_events=sum(1 for e in all_events if e.status == "Closed")
        )

    def list_adverse_events(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        trial_id: Optional[int] = None,
        site_id: Optional[int] = None,
        participant_id: Optional[int] = None,
        is_serious: Optional[bool] = None,
        severity: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[AdverseEventResponse]:
        query = db.query(AdverseEvent).options(
            joinedload(AdverseEvent.trial),
            joinedload(AdverseEvent.site),
            joinedload(AdverseEvent.participant)
        )

        if trial_id:
            query = query.filter(AdverseEvent.trial_id == trial_id)
        if site_id:
            query = query.filter(AdverseEvent.site_id == site_id)
        if participant_id:
            query = query.filter(AdverseEvent.participant_id == participant_id)
        if is_serious is not None:
            query = query.filter(AdverseEvent.is_serious == is_serious)
        if severity:
            query = query.filter(AdverseEvent.severity == severity)
        if status_filter:
            query = query.filter(AdverseEvent.status == status_filter)

        results = query.order_by(desc(AdverseEvent.id)).offset(skip).limit(limit).all()

        items = []
        for e in results:
            items.append(
                AdverseEventResponse(
                    id=e.id,
                    ae_id=e.ae_id,
                    trial_id=e.trial_id,
                    site_id=e.site_id,
                    participant_id=e.participant_id,
                    event_term=e.event_term,
                    event_description=e.event_description,
                    start_date=e.start_date,
                    end_date=e.end_date,
                    severity=e.severity,
                    is_serious=e.is_serious,
                    seriousness_criteria=e.seriousness_criteria,
                    is_adr=e.is_adr,
                    suspected_intervention=e.suspected_intervention,
                    causality=e.causality,
                    action_taken=e.action_taken,
                    outcome=e.outcome,
                    investigator_assessment=e.investigator_assessment,
                    status=e.status,
                    reporter_id=e.reporter_id,
                    reviewed_by=e.reviewed_by,
                    closed_at=e.closed_at,
                    created_at=e.created_at,
                    updated_at=e.updated_at,
                    participant_id_str=e.participant.participant_id if e.participant else None,
                    trial_id_str=e.trial.trial_id if e.trial else None,
                    site_name=e.site.site_name if e.site else None
                )
            )
        return items

    def get_adverse_event(self, db: Session, ae_id: int) -> AdverseEventResponse:
        e = db.query(AdverseEvent).options(
            joinedload(AdverseEvent.trial),
            joinedload(AdverseEvent.site),
            joinedload(AdverseEvent.participant)
        ).filter(AdverseEvent.id == ae_id).first()

        if not e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adverse event not found")

        return AdverseEventResponse(
            id=e.id,
            ae_id=e.ae_id,
            trial_id=e.trial_id,
            site_id=e.site_id,
            participant_id=e.participant_id,
            event_term=e.event_term,
            event_description=e.event_description,
            start_date=e.start_date,
            end_date=e.end_date,
            severity=e.severity,
            is_serious=e.is_serious,
            seriousness_criteria=e.seriousness_criteria,
            is_adr=e.is_adr,
            suspected_intervention=e.suspected_intervention,
            causality=e.causality,
            action_taken=e.action_taken,
            outcome=e.outcome,
            investigator_assessment=e.investigator_assessment,
            status=e.status,
            reporter_id=e.reporter_id,
            reviewed_by=e.reviewed_by,
            closed_at=e.closed_at,
            created_at=e.created_at,
            updated_at=e.updated_at,
            participant_id_str=e.participant.participant_id if e.participant else None,
            trial_id_str=e.trial.trial_id if e.trial else None,
            site_name=e.site.site_name if e.site else None
        )

    def create_adverse_event(
        self,
        db: Session,
        payload: AdverseEventCreate,
        current_user: User
    ) -> AdverseEvent:
        participant = db.query(Participant).filter(Participant.id == payload.participant_id).first()
        if not participant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        ae_code = self._generate_ae_id(db)

        ae = AdverseEvent(
            ae_id=ae_code,
            trial_id=payload.trial_id,
            site_id=payload.site_id,
            participant_id=payload.participant_id,
            event_term=payload.event_term,
            event_description=payload.event_description,
            start_date=payload.start_date,
            end_date=payload.end_date,
            severity=payload.severity,
            is_serious=payload.is_serious,
            seriousness_criteria=payload.seriousness_criteria if payload.is_serious else [],
            is_adr=payload.is_adr,
            suspected_intervention=payload.suspected_intervention,
            causality=payload.causality,
            action_taken=payload.action_taken,
            outcome=payload.outcome,
            investigator_assessment=payload.investigator_assessment,
            status="Reported",
            reporter_id=current_user.id
        )
        db.add(ae)
        db.commit()
        db.refresh(ae)

        event_type_label = "Serious Adverse Event (SAE)" if ae.is_serious else "Adverse Event (AE)"
        audit_service.record_event(
            db=db,
            action="SAFETY_EVENT_REPORTED",
            entity_type="SAFETY",
            entity_id=ae.ae_id,
            description=f"Reported {event_type_label} '{ae.event_term}' ({ae.severity}) for participant '{participant.participant_id}'.",
            user_id=current_user.id,
            metadata={
                "ae_id": ae.ae_id,
                "is_serious": ae.is_serious,
                "is_adr": ae.is_adr,
                "severity": ae.severity,
                "causality": ae.causality
            }
        )
        return ae

    def review_adverse_event(
        self,
        db: Session,
        ae_id: int,
        review_data: AdverseEventReview,
        current_user: User
    ) -> AdverseEvent:
        ae = db.query(AdverseEvent).filter(AdverseEvent.id == ae_id).first()
        if not ae:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adverse event not found")

        old_status = ae.status
        ae.status = review_data.status
        if review_data.outcome:
            ae.outcome = review_data.outcome
        causality_val = review_data.causality or review_data.relationship_to_intervention
        if causality_val:
            ae.causality = causality_val
        assessment_val = review_data.investigator_assessment or review_data.investigator_notes
        if assessment_val:
            ae.investigator_assessment = f"{ae.investigator_assessment}\n[Review]: {assessment_val}" if ae.investigator_assessment else assessment_val
        ae.reviewed_by = current_user.id
        if review_data.status == "Closed":
            ae.closed_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(ae)

        audit_service.record_event(
            db=db,
            action="SAFETY_EVENT_REVIEWED",
            entity_type="SAFETY",
            entity_id=ae.ae_id,
            description=f"Safety event '{ae.ae_id}' status updated from '{old_status}' to '{ae.status}'. Causality: '{ae.causality}'.",
            user_id=current_user.id,
            metadata={"status": ae.status, "causality": ae.causality}
        )
        return ae


safety_service = SafetyService()
