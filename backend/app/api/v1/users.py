from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserStatusUpdate
from app.services.user_service import user_service
from app.core.dependencies import require_role
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users Management"])


@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by username, full name, or email"),
    role_id: Optional[int] = Query(None, description="Filter by role ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_admin: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """
    List registered users with optional search and filtering.
    Restricted to ADMINISTRATOR role.
    """
    users, _ = user_service.get_users(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        role_id=role_id,
        is_active=is_active
    )
    return users


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    current_admin: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Register a new user account with temporary password and designated role.
    Password is immediately hashed with Argon2/bcrypt.
    Restricted to ADMINISTRATOR role.
    """
    return user_service.create_user(
        db=db,
        user_in=user_in,
        creator_id=current_admin.id
    )


@router.patch("/{user_id}/status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    current_admin: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Activate or deactivate a user account.
    Restricted to ADMINISTRATOR role.
    """
    return user_service.update_user_status(
        db=db,
        user_id=user_id,
        is_active=status_update.is_active,
        updater_id=current_admin.id
    )


@router.put("/{user_id}", response_model=UserResponse)
def update_user_details(
    user_id: int,
    user_update: UserUpdate,
    current_admin: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Update user profile or assigned role.
    Restricted to ADMINISTRATOR role.
    """
    return user_service.update_user(
        db=db,
        user_id=user_id,
        user_update=user_update,
        updater_id=current_admin.id
    )
