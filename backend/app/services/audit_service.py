from datetime import datetime, timezone
from typing import Optional, Any, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.audit_log import AuditLog


class AuditService:
    @staticmethod
    def record_event(
        db: Session,
        action: str,
        entity_type: str,
        description: str,
        user_id: Optional[int] = None,
        entity_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Record an immutable audit event in compliance with clinical GCP & 21 CFR Part 11 standards.
        Normal operations cannot alter or delete these records.
        """
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            timestamp=datetime.now(timezone.utc),
            metadata_json=metadata or {}
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

    @staticmethod
    def get_audit_logs(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        action: Optional[str] = None,
        user_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> tuple[List[AuditLog], int]:
        """Fetch audit trail logs with filtering options."""
        query = db.query(AuditLog)
        
        if action:
            query = query.filter(AuditLog.action == action)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (AuditLog.description.ilike(search_filter)) |
                (AuditLog.action.ilike(search_filter)) |
                (AuditLog.entity_type.ilike(search_filter))
            )
            
        total = query.count()
        logs = query.order_by(desc(AuditLog.timestamp)).offset(skip).limit(limit).all()
        return logs, total


audit_service = AuditService()
