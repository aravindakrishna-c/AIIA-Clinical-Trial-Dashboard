from datetime import datetime, timezone, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.clinical_trial import ClinicalTrial
    from app.models.user import User


class TrialProtocolVersion(Base):
    """
    Protocol version tracking for clinical trials.
    Supports GCP regulatory version control without modifying or erasing historical versions.
    """
    __tablename__ = "trial_protocol_versions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    trial_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clinical_trials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[str] = mapped_column(String(50), nullable=False)
    version_date: Mapped[date] = mapped_column(Date, nullable=False)
    change_summary: Mapped[str] = mapped_column(Text, nullable=False)
    document_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Current", nullable=False)  # Current, Superseded, Draft
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    trial: Mapped["ClinicalTrial"] = relationship("ClinicalTrial", back_populates="protocol_versions")
    creator: Mapped[Optional["User"]] = relationship("User")
