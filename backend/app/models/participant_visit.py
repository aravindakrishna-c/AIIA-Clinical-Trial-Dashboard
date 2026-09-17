from datetime import datetime, timezone, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.participant import Participant
    from app.models.clinical_trial import ClinicalTrial
    from app.models.trial_site import TrialSite
    from app.models.user import User


class ParticipantVisit(Base):
    """
    Clinical visit tracking model aligned with CDISC SDTM (SV domain).
    Tracks scheduled, completed, missed, overdue, and cancelled visits.
    """
    __tablename__ = "participant_visits"
    __table_args__ = (
        UniqueConstraint("participant_id", "visit_number", name="uq_participant_visit_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    trial_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clinical_trials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    site_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("trial_sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    visit_name: Mapped[str] = mapped_column(String(100), nullable=False)  # Screening Visit, Baseline, Week 2, Week 4, etc.
    visit_number: Mapped[int] = mapped_column(Integer, nullable=False)
    planned_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    actual_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    status: Mapped[str] = mapped_column(
        String(50), default="Scheduled", nullable=False, index=True
    )  # Scheduled, Completed, Missed, Overdue, Cancelled
    
    @property
    def visit_status(self) -> str:
        return self.status

    @visit_status.setter
    def visit_status(self, value: str):
        self.status = value
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_by: Mapped[Optional[int]] = mapped_column(
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

    participant: Mapped["Participant"] = relationship("Participant", back_populates="visits")
    trial: Mapped["ClinicalTrial"] = relationship("ClinicalTrial")
    site: Mapped["TrialSite"] = relationship("TrialSite")
    completer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[completed_by])
