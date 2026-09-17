from datetime import datetime, timezone, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.trial_protocol_version import TrialProtocolVersion
    from app.models.trial_milestone import TrialMilestone
    from app.models.trial_site import TrialSite
    from app.models.participant import Participant
    from app.models.ethics_submission import EthicsSubmission
    from app.models.ctri_regulatory import CTRIRegistration, RegulatoryEvent
    from app.models.adverse_event import AdverseEvent


class ClinicalTrial(Base):
    """
    Core Clinical Trial model representing Ayurveda clinical trials under AIIA & Ministry of Ayush.
    Complies with CDSCO, CTRI, and GCP trial metadata standards.
    """
    __tablename__ = "clinical_trials"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    trial_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    trial_title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    short_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    protocol_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    protocol_version: Mapped[str] = mapped_column(String(50), default="1.0", nullable=False)
    protocol_version_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Study categorization
    study_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Interventional, Observational
    study_phase: Mapped[str] = mapped_column(String(50), nullable=False)  # Early Phase, Phase I, Phase II, Phase III, Phase IV, Not Applicable
    study_design: Mapped[str] = mapped_column(String(100), nullable=False)  # Parallel Group, Single Group, Randomized, Non-Randomized, Open Label, Blinded

    # Sponsor & Investigator
    sponsor: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sponsor_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Government, Academic, Institutional, Industry, Other
    sponsor_contact: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    principal_investigator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )

    # Clinical & Ayurveda specifics
    disease_condition: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    ayurveda_intervention: Mapped[str] = mapped_column(String(255), nullable=False)
    intervention_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Herbal, Herbo-mineral, Panchakarma, Rasayana, Diet/Lifestyle, Other
    intervention_description: Mapped[str] = mapped_column(Text, nullable=False)
    dosage: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    route_of_administration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    frequency: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    duration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    formulation_procedure: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    comparator: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comparator_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Target & Timeline
    target_participants: Mapped[int] = mapped_column(Integer, nullable=False)
    planned_enrollment_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_completion_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_completion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Criteria & Objectives
    inclusion_criteria: Mapped[str] = mapped_column(Text, nullable=False)
    exclusion_criteria: Mapped[str] = mapped_column(Text, nullable=False)
    primary_objective: Mapped[str] = mapped_column(Text, nullable=False)
    secondary_objectives: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status & Audit
    status: Mapped[str] = mapped_column(
        String(50),
        default="Draft",
        nullable=False,
        index=True
    )  # Draft, Ethics Review, Ethics Approved, CTRI Pending, Recruiting, Active, Suspended, Completed, Terminated, Closed
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
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
    principal_investigator: Mapped["User"] = relationship("User", foreign_keys=[principal_investigator_id], lazy="joined")
    creator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by])
    protocol_versions: Mapped[List["TrialProtocolVersion"]] = relationship(
        "TrialProtocolVersion", back_populates="trial", cascade="all, delete-orphan", order_by="desc(TrialProtocolVersion.created_at)"
    )
    milestones: Mapped[List["TrialMilestone"]] = relationship(
        "TrialMilestone", back_populates="trial", cascade="all, delete-orphan", order_by="TrialMilestone.planned_date.asc()"
    )
    sites: Mapped[List["TrialSite"]] = relationship(
        "TrialSite", back_populates="trial", cascade="all, delete-orphan", order_by="TrialSite.id.asc()"
    )
    participants: Mapped[List["Participant"]] = relationship(
        "Participant", back_populates="trial", cascade="all, delete-orphan", order_by="Participant.id.asc()"
    )
    ethics_submissions: Mapped[List["EthicsSubmission"]] = relationship(
        "EthicsSubmission", back_populates="trial", cascade="all, delete-orphan", order_by="desc(EthicsSubmission.submission_date)"
    )
    ctri_registration: Mapped[Optional["CTRIRegistration"]] = relationship(
        "CTRIRegistration", back_populates="trial", uselist=False, cascade="all, delete-orphan"
    )
    regulatory_events: Mapped[List["RegulatoryEvent"]] = relationship(
        "RegulatoryEvent", back_populates="trial", cascade="all, delete-orphan", order_by="RegulatoryEvent.due_date.asc()"
    )
    adverse_events: Mapped[List["AdverseEvent"]] = relationship(
        "AdverseEvent", back_populates="trial", cascade="all, delete-orphan", order_by="desc(AdverseEvent.start_date)"
    )
