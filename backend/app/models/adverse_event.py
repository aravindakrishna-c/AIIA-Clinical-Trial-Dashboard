from datetime import datetime, timezone, date
from typing import Optional, TYPE_CHECKING, List
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.clinical_trial import ClinicalTrial
    from app.models.trial_site import TrialSite
    from app.models.participant import Participant
    from app.models.user import User


class AdverseEvent(Base):
    """
    Adverse Event (AE), Serious Adverse Event (SAE), and Adverse Drug Reaction (ADR) model.
    Complies with ICH E2A, WHO-UMC causality criteria, and CDISC SDTM (AE domain).
    Distinguishes clinical severity (intensity) from regulatory seriousness (criteria).
    """
    __tablename__ = "adverse_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    ae_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    trial_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clinical_trials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    site_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("trial_sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    event_term: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    event_description: Mapped[str] = mapped_column(Text, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Severity (Intensity: Mild / Moderate / Severe)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)  # Mild, Moderate, Severe
    
    # Seriousness (Regulatory Criteria)
    is_serious: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    seriousness_criteria: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)  # Death, Life-threatening, Hospitalization, Disability, Congenital Anomaly, Other

    # ADR & Intervention Correlation
    is_adr: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    suspected_intervention: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Causality (WHO-UMC)
    causality: Mapped[str] = mapped_column(
        String(50), default="Possible", nullable=False
    )  # Not Related, Unlikely, Possible, Probable, Very Likely

    # Action Taken & Clinical Outcome
    action_taken: Mapped[str] = mapped_column(
        String(100), default="No change", nullable=False
    )  # No change, Dose reduced, Dose interrupted, Intervention stopped, Additional treatment, Hospitalization, Other
    
    outcome: Mapped[str] = mapped_column(
        String(100), default="Recovering", nullable=False
    )  # Recovered, Recovering, Not recovered, Recovered with sequelae, Fatal, Unknown

    investigator_assessment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="Reported", nullable=False, index=True
    )  # Draft, Reported, Under Review, Confirmed, Closed

    @property
    def relationship_to_intervention(self) -> str:
        return self.causality

    @relationship_to_intervention.setter
    def relationship_to_intervention(self, val: str):
        self.causality = val

    @property
    def reviewer_id(self) -> Optional[int]:
        return self.reviewed_by

    @reviewer_id.setter
    def reviewer_id(self, val: Optional[int]):
        self.reviewed_by = val

    @property
    def investigator_notes(self) -> Optional[str]:
        return self.investigator_assessment

    @investigator_notes.setter
    def investigator_notes(self, val: Optional[str]):
        self.investigator_assessment = val

    reporter_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    trial: Mapped["ClinicalTrial"] = relationship("ClinicalTrial", back_populates="adverse_events")
    site: Mapped["TrialSite"] = relationship("TrialSite")
    participant: Mapped["Participant"] = relationship("Participant", back_populates="adverse_events")
    reporter: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reporter_id])
    reviewer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewed_by])
