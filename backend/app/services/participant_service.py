from datetime import datetime, timezone, date, timedelta
from typing import Optional, List, Tuple, Dict, Any
import random
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, or_
from fastapi import HTTPException, status

from app.models.participant import Participant
from app.models.participant_visit import ParticipantVisit
from app.models.clinical_trial import ClinicalTrial
from app.models.trial_site import TrialSite
from app.models.user import User
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantUpdate,
    ParticipantScreeningEvaluation,
    ParticipantEnroll,
    ParticipantRandomize,
    ParticipantWithdraw,
    ParticipantComplete,
    ParticipantListItem,
    ParticipantDetail,
    ParticipantSummaryStats
)
from app.schemas.participant_visit import VisitCreate, VisitUpdate, VisitComplete
from app.services.audit_service import audit_service


STANDARD_VISIT_TEMPLATES = [
    {"name": "Screening Visit", "number": 1, "offset_days": 0},
    {"name": "Baseline Visit", "number": 2, "offset_days": 7},
    {"name": "Week 2 Follow-Up", "number": 3, "offset_days": 21},
    {"name": "Week 4 Clinical Assessment", "number": 4, "offset_days": 35},
    {"name": "Week 8 Interim Evaluation", "number": 5, "offset_days": 63},
    {"name": "Final Study Visit", "number": 6, "offset_days": 119},
]


class ParticipantService:
    def _get_age_group(self, age: int) -> str:
        if age < 36:
            return "18-35"
        elif age < 51:
            return "36-50"
        elif age < 66:
            return "51-65"
        return "65+"

    def _generate_participant_id(self, db: Session, trial: ClinicalTrial) -> str:
        count = db.query(Participant).filter(Participant.trial_id == trial.id).count() + 1
        clean_code = trial.trial_id.replace("AIIA-CT-", "CT").replace("-", "")
        return f"AIIA-{clean_code}-P{count:03d}"

    def get_summary_stats(self, db: Session, trial_id: Optional[int] = None) -> ParticipantSummaryStats:
        query = db.query(Participant)
        if trial_id:
            query = query.filter(Participant.trial_id == trial_id)

        all_participants = query.all()
        stats = ParticipantSummaryStats(
            total_screened=len(all_participants),
            eligible=sum(1 for p in all_participants if p.eligibility_status == "Eligible"),
            ineligible=sum(1 for p in all_participants if p.eligibility_status == "Ineligible"),
            enrolled=sum(1 for p in all_participants if p.status in ["Enrolled", "Randomized", "Active", "Completed", "Withdrawn"]),
            randomized=sum(1 for p in all_participants if p.randomization_date is not None),
            active=sum(1 for p in all_participants if p.status == "Active"),
            completed=sum(1 for p in all_participants if p.status == "Completed"),
            withdrawn=sum(1 for p in all_participants if p.status == "Withdrawn"),
            lost_to_followup=sum(1 for p in all_participants if p.status == "Lost to Follow-up")
        )
        return stats

    def list_participants(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        trial_id: Optional[int] = None,
        site_id: Optional[int] = None,
        status_filter: Optional[str] = None,
        eligibility_filter: Optional[str] = None,
        treatment_group: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[ParticipantListItem]:
        query = db.query(Participant).options(
            joinedload(Participant.trial),
            joinedload(Participant.site)
        )

        if trial_id:
            query = query.filter(Participant.trial_id == trial_id)
        if site_id:
            query = query.filter(Participant.site_id == site_id)
        if status_filter:
            query = query.filter(Participant.status == status_filter)
        if eligibility_filter:
            query = query.filter(Participant.eligibility_status == eligibility_filter)
        if treatment_group:
            query = query.filter(Participant.treatment_group == treatment_group)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Participant.participant_id.ilike(pattern),
                    Participant.screening_number.ilike(pattern)
                )
            )

        results = query.order_by(desc(Participant.id)).offset(skip).limit(limit).all()

        items = []
        for p in results:
            items.append(
                ParticipantListItem(
                    id=p.id,
                    participant_id=p.participant_id,
                    trial_id=p.trial_id,
                    site_id=p.site_id,
                    screening_number=p.screening_number,
                    age=p.age,
                    age_group=p.age_group,
                    sex=p.sex,
                    screening_date=p.screening_date,
                    eligibility_status=p.eligibility_status,
                    enrollment_date=p.enrollment_date,
                    randomization_date=p.randomization_date,
                    randomization_number=p.randomization_number,
                    treatment_group=p.treatment_group,
                    status=p.status,
                    withdrawal_date=p.withdrawal_date,
                    completion_date=p.completion_date,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    site_name=p.site.site_name if p.site else None,
                    site_code=p.site.site_code if p.site else None,
                    trial_id_str=p.trial.trial_id if p.trial else None
                )
            )
        return items

    def get_participant(self, db: Session, participant_id: int) -> ParticipantDetail:
        p = db.query(Participant).options(
            joinedload(Participant.trial),
            joinedload(Participant.site)
        ).filter(Participant.id == participant_id).first()

        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        return ParticipantDetail(
            id=p.id,
            participant_id=p.participant_id,
            trial_id=p.trial_id,
            site_id=p.site_id,
            screening_number=p.screening_number,
            age=p.age,
            age_group=p.age_group,
            sex=p.sex,
            screening_date=p.screening_date,
            eligibility_status=p.eligibility_status,
            eligibility_details=p.eligibility_details,
            enrollment_date=p.enrollment_date,
            randomization_date=p.randomization_date,
            randomization_number=p.randomization_number,
            treatment_group=p.treatment_group,
            status=p.status,
            withdrawal_date=p.withdrawal_date,
            completion_date=p.completion_date,
            withdrawal_reason=p.withdrawal_reason,
            notes=p.notes,
            created_at=p.created_at,
            updated_at=p.updated_at,
            site_name=p.site.site_name if p.site else None,
            site_code=p.site.site_code if p.site else None,
            trial_id_str=p.trial.trial_id if p.trial else None,
            site=p.site
        )

    def screen_participant(
        self,
        db: Session,
        payload: ParticipantCreate,
        current_user: User
    ) -> Participant:
        trial = db.query(ClinicalTrial).filter(ClinicalTrial.id == payload.trial_id).first()
        if not trial:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinical trial not found")
        if trial.status in ["Closed", "Terminated"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot screen participants for a {trial.status} clinical trial."
            )

        site = db.query(TrialSite).filter(TrialSite.id == payload.site_id, TrialSite.trial_id == trial.id).first()
        if not site:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trial site not found for this study")

        participant_id_str = self._generate_participant_id(db, trial)
        scr_num = payload.screening_number or f"SCR-{site.site_code}-{random.randint(1000, 9999)}"

        participant = Participant(
            participant_id=participant_id_str,
            trial_id=trial.id,
            site_id=site.id,
            screening_number=scr_num,
            age=payload.age,
            age_group=self._get_age_group(payload.age),
            sex=payload.sex,
            screening_date=payload.screening_date,
            eligibility_status="Pending",
            eligibility_details=payload.eligibility_details or {},
            status="Screened",
            notes=payload.notes,
            created_by=current_user.id
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)

        audit_service.record_event(
            db=db,
            action="PARTICIPANT_SCREENED",
            entity_type="PARTICIPANT",
            entity_id=participant.participant_id,
            description=f"Screened new participant '{participant.participant_id}' ({scr_num}) for trial '{trial.trial_id}' at site '{site.site_code}'.",
            user_id=current_user.id,
            metadata={"trial_id": trial.trial_id, "site_id": site.site_code, "age": payload.age, "sex": payload.sex}
        )
        return participant

    def evaluate_eligibility(
        self,
        db: Session,
        participant_id: int,
        evaluation: ParticipantScreeningEvaluation,
        current_user: User
    ) -> Participant:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        old_status = p.eligibility_status
        p.eligibility_status = evaluation.eligibility_status
        p.eligibility_details = {
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "evaluated_by": current_user.username,
            "inclusion_answers": evaluation.inclusion_answers,
            "exclusion_answers": evaluation.exclusion_answers,
            "notes": evaluation.notes
        }

        if evaluation.eligibility_status == "Eligible":
            p.status = "Eligible"
        elif evaluation.eligibility_status == "Ineligible":
            p.status = "Ineligible"

        db.commit()
        db.refresh(p)

        audit_service.record_event(
            db=db,
            action="ELIGIBILITY_EVALUATED",
            entity_type="PARTICIPANT",
            entity_id=p.participant_id,
            description=f"Participant '{p.participant_id}' eligibility updated from '{old_status}' to '{p.eligibility_status}'.",
            user_id=current_user.id,
            metadata={"old_status": old_status, "new_status": p.eligibility_status}
        )
        return p

    def enroll_participant(
        self,
        db: Session,
        participant_id: int,
        payload: ParticipantEnroll,
        current_user: User
    ) -> Participant:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        if p.eligibility_status != "Eligible":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot enroll participant with status '{p.eligibility_status}'. Must be evaluated as 'Eligible' first."
            )

        if p.enrollment_date is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Participant '{p.participant_id}' is already enrolled on {p.enrollment_date}."
            )

        trial = db.query(ClinicalTrial).filter(ClinicalTrial.id == p.trial_id).first()
        if trial.status in ["Closed", "Terminated"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot enroll participant in a {trial.status} clinical trial."
            )

        # Update participant
        p.enrollment_date = payload.enrollment_date
        p.status = "Enrolled"
        if payload.notes:
            p.notes = f"{p.notes}\n[Enrollment]: {payload.notes}" if p.notes else payload.notes

        # Update site enrollment tally
        site = db.query(TrialSite).filter(TrialSite.id == p.site_id).first()
        if site:
            site.current_enrollment += 1

        # Automatically schedule clinical protocol visits
        base_date = payload.enrollment_date
        for tmpl in STANDARD_VISIT_TEMPLATES:
            existing_visit = db.query(ParticipantVisit).filter(
                ParticipantVisit.participant_id == p.id,
                ParticipantVisit.visit_number == tmpl["number"]
            ).first()
            if not existing_visit:
                planned = base_date + timedelta(days=tmpl["offset_days"])
                v = ParticipantVisit(
                    trial_id=p.trial_id,
                    site_id=p.site_id,
                    participant_id=p.id,
                    visit_name=tmpl["name"],
                    visit_number=tmpl["number"],
                    planned_date=planned,
                    status="Scheduled"
                )
                db.add(v)

        db.commit()
        db.refresh(p)

        audit_service.record_event(
            db=db,
            action="PARTICIPANT_ENROLLED",
            entity_type="PARTICIPANT",
            entity_id=p.participant_id,
            description=f"Participant '{p.participant_id}' successfully enrolled in trial '{trial.trial_id}' at site '{site.site_code}'. Standard visit schedule generated.",
            user_id=current_user.id,
            metadata={"enrollment_date": str(payload.enrollment_date), "trial_id": trial.trial_id}
        )
        return p

    def randomize_participant(
        self,
        db: Session,
        participant_id: int,
        payload: ParticipantRandomize,
        current_user: User
    ) -> Participant:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        if p.status not in ["Enrolled", "Eligible"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Participant must be in 'Enrolled' status to be randomized. Current status: '{p.status}'."
            )

        if p.randomization_date is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Participant is already randomized to '{p.treatment_group}' ({p.randomization_number})."
            )

        # Assign treatment group (Group A — Ayurveda Intervention / Group B — Comparator/Control)
        if payload.treatment_group:
            assigned_group = payload.treatment_group
        else:
            # Server-side balanced randomization
            group_a_count = db.query(Participant).filter(
                Participant.trial_id == p.trial_id,
                Participant.treatment_group.like("%Group A%")
            ).count()
            group_b_count = db.query(Participant).filter(
                Participant.trial_id == p.trial_id,
                Participant.treatment_group.like("%Group B%")
            ).count()

            if group_a_count <= group_b_count:
                assigned_group = "Group A — Ayurveda Intervention"
            else:
                assigned_group = "Group B — Comparator/Control"

        rnd_num = f"RND-{p.participant_id}-{random.randint(100, 999)}"

        p.randomization_date = payload.randomization_date
        p.randomization_number = rnd_num
        p.treatment_group = assigned_group
        p.status = "Randomized"  # Prompt 3.8: Change status to Randomized

        db.commit()
        db.refresh(p)

        audit_service.record_event(
            db=db,
            action="PARTICIPANT_RANDOMIZED",
            entity_type="PARTICIPANT",
            entity_id=p.participant_id,
            description=f"Participant '{p.participant_id}' randomized into '{assigned_group}' with assignment number '{rnd_num}'. Status updated to Active.",
            user_id=current_user.id,
            metadata={"randomization_number": rnd_num, "treatment_group": assigned_group}
        )
        return p

    def withdraw_participant(
        self,
        db: Session,
        participant_id: int,
        payload: ParticipantWithdraw,
        current_user: User
    ) -> Participant:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        old_status = p.status
        p.status = "Withdrawn"
        p.withdrawal_date = payload.withdrawal_date
        p.withdrawal_reason = payload.withdrawal_reason

        # Cancel remaining scheduled visits
        db.query(ParticipantVisit).filter(
            ParticipantVisit.participant_id == p.id,
            ParticipantVisit.status == "Scheduled"
        ).update({"status": "Cancelled", "notes": f"Cancelled due to participant withdrawal: {payload.withdrawal_reason}"})

        db.commit()
        db.refresh(p)

        audit_service.record_event(
            db=db,
            action="PARTICIPANT_WITHDRAWN",
            entity_type="PARTICIPANT",
            entity_id=p.participant_id,
            description=f"Participant '{p.participant_id}' withdrawn from study. Reason: '{payload.withdrawal_reason}'.",
            user_id=current_user.id,
            metadata={"old_status": old_status, "reason": payload.withdrawal_reason}
        )
        return p

    def complete_participant(
        self,
        db: Session,
        participant_id: int,
        payload: ParticipantComplete,
        current_user: User
    ) -> Participant:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        p.status = "Completed"
        p.completion_date = payload.completion_date
        if payload.notes:
            p.notes = f"{p.notes}\n[Completion]: {payload.notes}" if p.notes else payload.notes

        db.commit()
        db.refresh(p)

        audit_service.record_event(
            db=db,
            action="PARTICIPANT_COMPLETED",
            entity_type="PARTICIPANT",
            entity_id=p.participant_id,
            description=f"Participant '{p.participant_id}' completed all trial protocol requirements.",
            user_id=current_user.id,
            metadata={"completion_date": str(payload.completion_date)}
        )
        return p

    # --- Visits ---
    def get_visits(self, db: Session, participant_id: int) -> List[ParticipantVisit]:
        today = date.today()
        visits = db.query(ParticipantVisit).filter(
            ParticipantVisit.participant_id == participant_id
        ).order_by(ParticipantVisit.visit_number.asc()).all()

        # Check for overdue visits dynamically
        changed = False
        for v in visits:
            if v.status == "Scheduled" and v.planned_date < today:
                v.status = "Overdue"
                changed = True
        if changed:
            db.commit()

        return visits

    def complete_visit(
        self,
        db: Session,
        visit_id: int,
        payload: VisitComplete,
        current_user: User
    ) -> ParticipantVisit:
        v = db.query(ParticipantVisit).filter(ParticipantVisit.id == visit_id).first()
        if not v:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit record not found")

        v.status = "Completed"
        v.actual_date = payload.actual_date
        v.completed_by = current_user.id
        if payload.notes:
            v.notes = f"{v.notes}\n[Completed]: {payload.notes}" if v.notes else payload.notes

        db.commit()
        db.refresh(v)

        audit_service.record_event(
            db=db,
            action="VISIT_COMPLETED",
            entity_type="VISIT",
            entity_id=str(v.id),
            description=f"Visit #{v.visit_number} ({v.visit_name}) completed for participant on {payload.actual_date}.",
            user_id=current_user.id,
            metadata={"visit_id": v.id, "participant_id": v.participant_id, "actual_date": str(payload.actual_date)}
        )
        return v


participant_service = ParticipantService()
