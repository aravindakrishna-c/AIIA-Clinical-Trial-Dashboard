from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING, Any
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(Base):
    """
    Append-only immutable audit log table for regulatory compliance (GCP / 21 CFR Part 11).
    Audit records cannot be edited or deleted through any application endpoints.
    """
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column("metadata", JSON, nullable=True)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs", lazy="joined")
