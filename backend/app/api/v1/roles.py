from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.role import RoleResponse, PermissionResponse
from app.models.role import Role
from app.models.permission import Permission
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/roles", tags=["Roles & Permissions"])


@router.get("", response_model=List[RoleResponse])
def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all defined roles and their assigned permissions."""
    return db.query(Role).order_by(Role.id.asc()).all()


@router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all available permissions in the system."""
    return db.query(Permission).order_by(Permission.id.asc()).all()
