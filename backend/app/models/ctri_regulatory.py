from datetime import datetime, timezone, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.clinical_trial import ClinicalTrial


class CTRIRegistration(Base):
    """
    Clinical Trials Registry - India (CTRI) tracking record.
    Maintains statutory registration IDs, registration milestones, and update deadlines.
    """
    __tablename__ = "ctri_registrations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    trial_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clinical_trials.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    ctri_number: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    status: Mapped[str] = mapped_column(
        String(50), default="Not Submitted", nullable=False, index=True
    )  # Not Submitted, Draft, Submitted, Under Review, Registered, Update Required, Suspended, Closed
    
    submission_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    registration_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_update_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_update_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responsible_person: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    trial: Mapped["ClinicalTrial"] = relationship("ClinicalTrial", back_populates="ctri_registration")


class RegulatoryEvent(Base):
    """
    Statutory regulatory milestones and submissions (CDSCO, Ministry of Ayush, Inspections).
    Tracks regulatory deadlines (Upcoming, Due Soon, Overdue, Completed).
    """
    __tablename__ = "regulatory_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    trial_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clinical_trials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Annual Progress Report, Protocol Amendment Filing, Safety PSUR Submission, Site Inspection, Trial Closeout Report
    submission_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    completion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    status: Mapped[str] = mapped_column(
        String(50), default="Pending", nullable=False, index=True
    )  # Pending, Submitted, Under Review, Completed, Delayed, Cancelled
    
    responsible_person: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    trial: Mapped["ClinicalTrial"] = relationship("ClinicalTrial", back_populates="regulatory_events")
