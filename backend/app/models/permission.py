from datetime import datetime, timezone
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.role import Role

# Association table for Many-to-Many between Roles and Permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
)


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    roles: Mapped[List["Role"]] = relationship(
        "Role",
        secondary=role_permissions,
        back_populates="permissions"
    )
