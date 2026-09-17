from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_service import audit_service
from app.core.dependencies import require_role
from app.models.user import User

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=List[AuditLogResponse])
def get_audit_trail(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    action: Optional[str] = Query(None, description="Filter by event action"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    search: Optional[str] = Query(None, description="Search across descriptions or actions"),
    current_user: User = Depends(require_role("ADMIN", "REGULATOR")),
    db: Session = Depends(get_db)
):
    """
    Retrieve read-only immutable audit records.
    Restricted to ADMINISTRATOR and REGULATOR roles.
    Modifying or deleting audit entries is not supported.
    """
    logs, _ = audit_service.get_audit_logs(
        db=db,
        skip=skip,
        limit=limit,
        action=action,
        user_id=user_id,
        search=search
    )
    return logs
