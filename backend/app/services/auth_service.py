from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.core.security import verify_password, create_access_token
from app.services.audit_service import audit_service


class AuthService:
    @staticmethod
    def authenticate_user(
        db: Session,
        username_or_email: str,
        password: str,
        ip_address: Optional[str] = None
    ) -> Tuple[User, str]:
        # Look up by username or email
        user = db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()

        if not user or not verify_password(password, user.password_hash):
            # Record failed login attempt
            audit_service.record_event(
                db=db,
                action="LOGIN_FAILED",
                entity_type="AUTH",
                entity_id=str(user.id) if user else None,
                description=f"Failed login attempt for identifier '{username_or_email}'.",
                user_id=user.id if user else None,
                metadata={"identifier": username_or_email, "ip": ip_address}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password.",
                headers={"WWW-Authenticate": "Bearer"}
            )

        if not user.is_active:
            audit_service.record_event(
                db=db,
                action="LOGIN_FAILED",
                entity_type="AUTH",
                entity_id=str(user.id),
                description=f"Login blocked for deactivated account '{user.username}'.",
                user_id=user.id,
                metadata={"reason": "account_deactivated", "ip": ip_address}
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact your system administrator."
            )

        # Update last login timestamp
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

        role_name = user.role.name if user.role else "USER"
        token = create_access_token(subject=user.id, role=role_name)

        # Audit success
        audit_service.record_event(
            db=db,
            action="LOGIN_SUCCESS",
            entity_type="AUTH",
            entity_id=str(user.id),
            description=f"User '{user.username}' successfully authenticated as '{role_name}'.",
            user_id=user.id,
            metadata={"role": role_name, "ip": ip_address}
        )

        return user, token

    @staticmethod
    def record_logout(db: Session, user: User, ip_address: Optional[str] = None):
        audit_service.record_event(
            db=db,
            action="LOGOUT",
            entity_type="AUTH",
            entity_id=str(user.id),
            description=f"User '{user.username}' logged out.",
            user_id=user.id,
            metadata={"ip": ip_address}
        )


auth_service = AuthService()
