from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from app.services.audit_service import audit_service


class UserService:
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_users(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        role_id: Optional[int] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[User], int]:
        query = db.query(User)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.username.ilike(search_pattern),
                    User.full_name.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                )
            )
        if role_id is not None:
            query = query.filter(User.role_id == role_id)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        total = query.count()
        users = query.order_by(User.id.asc()).offset(skip).limit(limit).all()
        return users, total

    @staticmethod
    def create_user(db: Session, user_in: UserCreate, creator_id: Optional[int] = None) -> User:
        # Check uniqueness
        if UserService.get_user_by_username(db, user_in.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{user_in.username}' is already registered."
            )
        if UserService.get_user_by_email(db, user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{user_in.email}' is already registered."
            )

        # Validate role exists
        role = db.query(Role).filter(Role.id == user_in.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role with ID {user_in.role_id} does not exist."
            )

        # Hash password securely
        password_hash = get_password_hash(user_in.password)

        new_user = User(
            username=user_in.username,
            email=user_in.email,
            password_hash=password_hash,
            full_name=user_in.full_name,
            role_id=user_in.role_id,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Audit record
        audit_service.record_event(
            db=db,
            action="USER_CREATED",
            entity_type="USER",
            entity_id=str(new_user.id),
            description=f"User '{new_user.username}' ({new_user.full_name}) created with role '{role.name}'.",
            user_id=creator_id,
            metadata={"username": new_user.username, "role": role.name, "email": new_user.email}
        )

        return new_user

    @staticmethod
    def update_user_status(db: Session, user_id: int, is_active: bool, updater_id: Optional[int] = None) -> User:
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        old_status = user.is_active
        if old_status == is_active:
            return user

        user.is_active = is_active
        db.commit()
        db.refresh(user)

        action = "USER_ACTIVATED" if is_active else "USER_DEACTIVATED"
        status_text = "activated" if is_active else "deactivated"
        audit_service.record_event(
            db=db,
            action=action,
            entity_type="USER",
            entity_id=str(user.id),
            description=f"User '{user.username}' was {status_text}.",
            user_id=updater_id,
            metadata={"user_id": user.id, "username": user.username, "is_active": is_active}
        )
        return user

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate, updater_id: Optional[int] = None) -> User:
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        changes = []
        if user_update.full_name is not None and user_update.full_name != user.full_name:
            user.full_name = user_update.full_name
            changes.append("full_name")

        if user_update.email is not None and user_update.email != user.email:
            existing_email = UserService.get_user_by_email(db, user_update.email)
            if existing_email and existing_email.id != user.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
            user.email = user_update.email
            changes.append("email")

        if user_update.role_id is not None and user_update.role_id != user.role_id:
            role = db.query(Role).filter(Role.id == user_update.role_id).first()
            if not role:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role does not exist")
            old_role = user.role.name if user.role else str(user.role_id)
            user.role_id = user_update.role_id
            changes.append("role")
            audit_service.record_event(
                db=db,
                action="ROLE_CHANGED",
                entity_type="USER",
                entity_id=str(user.id),
                description=f"Role for user '{user.username}' changed from '{old_role}' to '{role.name}'.",
                user_id=updater_id,
                metadata={"old_role": old_role, "new_role": role.name}
            )

        if user_update.is_active is not None and user_update.is_active != user.is_active:
            UserService.update_user_status(db, user_id, user_update.is_active, updater_id)

        if changes:
            db.commit()
            db.refresh(user)
            audit_service.record_event(
                db=db,
                action="USER_UPDATED",
                entity_type="USER",
                entity_id=str(user.id),
                description=f"User '{user.username}' updated fields: {', '.join(changes)}.",
                user_id=updater_id,
                metadata={"changes": changes}
            )

        return user


user_service = UserService()
