from datetime import datetime, timezone, date
from typing import Optional, List, TYPE_CHECKING, Dict, Any
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.clinical_trial import ClinicalTrial
    from app.models.trial_site import TrialSite
    from app.models.user import User
    from app.models.participant_visit import ParticipantVisit
    from app.models.adverse_event import AdverseEvent


class Participant(Base):
    """
    De-identified clinical trial participant model.
    Complies with ICH-GCP, CDISC SDTM (DM domain), and privacy guidelines.
    Never stores direct PII (names, national IDs). Uses synthetic IDs like AIIA-CT001-P001.
    """
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    trial_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clinical_trials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    site_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("trial_sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    screening_number: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    
    # Demographics (de-identified)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    age_group: Mapped[str] = mapped_column(String(20), nullable=False)  # 18-35, 36-50, 51-65, 65+
    sex: Mapped[str] = mapped_column(String(20), nullable=False)  # Male, Female, Other
    
    # Screening & Eligibility
    screening_date: Mapped[date] = mapped_column(Date, nullable=False)
    eligibility_status: Mapped[str] = mapped_column(
        String(50), default="Pending", nullable=False, index=True
    )  # Pending, Eligible, Ineligible
    eligibility_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Enrollment & Randomization
    enrollment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    randomization_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    randomization_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    treatment_group: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Group A — Ayurveda Intervention, Group B — Comparator/Control
    
    # Lifecycle Status
    status: Mapped[str] = mapped_column(
        String(50), default="Screened", nullable=False, index=True
    )  # Screened, Eligible, Ineligible, Enrolled, Randomized, Active, Withdrawn, Completed, Lost to Follow-up
    
    @property
    def participant_status(self) -> str:
        return self.status

    @participant_status.setter
    def participant_status(self, value: str):
        self.status = value

    withdrawal_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    completion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    withdrawal_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    trial: Mapped["ClinicalTrial"] = relationship("ClinicalTrial", back_populates="participants")
    site: Mapped["TrialSite"] = relationship("TrialSite", back_populates="participants")
    creator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by])
    visits: Mapped[List["ParticipantVisit"]] = relationship(
        "ParticipantVisit", back_populates="participant", cascade="all, delete-orphan", order_by="ParticipantVisit.visit_number.asc()"
    )
    adverse_events: Mapped[List["AdverseEvent"]] = relationship(
        "AdverseEvent", back_populates="participant", cascade="all, delete-orphan", order_by="desc(AdverseEvent.start_date)"
    )
