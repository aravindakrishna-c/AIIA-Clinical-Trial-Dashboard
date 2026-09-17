from datetime import datetime, timezone, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.clinical_trial import ClinicalTrial
    from app.models.user import User
    from app.models.participant import Participant


class TrialSite(Base):
    """
    Multi-center trial site model for clinical trial locations.
    """
    __tablename__ = "trial_sites"
    __table_args__ = (
        UniqueConstraint("trial_id", "site_code", name="uq_trial_site_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    trial_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clinical_trials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    site_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    site_name: Mapped[str] = mapped_column(String(255), nullable=False)
    institution: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    site_investigator_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    activation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    site_status: Mapped[str] = mapped_column(
        String(50), default="Pending", nullable=False, index=True
    )  # Pending, Ethics Pending, Activated, Recruiting, Suspended, Closed
    enrollment_target: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    current_enrollment: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    trial: Mapped["ClinicalTrial"] = relationship("ClinicalTrial", back_populates="sites")
    site_investigator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[site_investigator_id])
    participants: Mapped[List["Participant"]] = relationship("Participant", back_populates="site")
