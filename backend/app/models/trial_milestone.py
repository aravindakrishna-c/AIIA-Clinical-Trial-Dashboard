from datetime import datetime, timezone, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.clinical_trial import ClinicalTrial
    from app.models.user import User


class TrialMilestone(Base):
    """
    Trial milestone tracking for operational and regulatory monitoring.
    """
    __tablename__ = "trial_milestones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    trial_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clinical_trials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    milestone_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    planned_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="Planned", nullable=False
    )  # Planned, In Progress, Completed, Delayed, Cancelled
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    trial: Mapped["ClinicalTrial"] = relationship("ClinicalTrial", back_populates="milestones")
    creator: Mapped[Optional["User"]] = relationship("User")
