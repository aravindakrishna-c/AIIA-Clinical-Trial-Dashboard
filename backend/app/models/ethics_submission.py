from datetime import datetime, timezone, date
from typing import Optional, TYPE_CHECKING, Dict, Any
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.clinical_trial import ClinicalTrial
    from app.models.user import User


class EthicsSubmission(Base):
    """
    Institutional Ethics Committee (IEC / IRB) review submission model.
    Tracks approval workflows, validity dates, renewal requirements, and documentation.
    """
    __tablename__ = "ethics_submissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    submission_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, unique=True, index=True)
    trial_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clinical_trials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    protocol_version: Mapped[str] = mapped_column(String(50), nullable=False)
    submission_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    review_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    status: Mapped[str] = mapped_column(
        String(50), default="Draft", nullable=False, index=True
    )  # Draft, Submitted, Under Review, Changes Required, Approved, Rejected, Expired, Renewal Required
    
    decision: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    approval_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    approval_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    document_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    submitted_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_by: Mapped[Optional[int]] = mapped_column(
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

    trial: Mapped["ClinicalTrial"] = relationship("ClinicalTrial", back_populates="ethics_submissions")
    submitter: Mapped[Optional["User"]] = relationship("User", foreign_keys=[submitted_by])
    reviewer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewed_by])
