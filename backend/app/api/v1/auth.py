from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse, LogoutResponse
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user, get_client_ip
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user credentials (username or email).
    Returns signed JWT access token and basic user details.
    Records LOGIN_SUCCESS or LOGIN_FAILED in the immutable audit log.
    """
    client_ip = get_client_ip(request)
    user, token = auth_service.authenticate_user(
        db=db,
        username_or_email=login_data.username,
        password=login_data.password,
        ip_address=client_ip
    )
    permissions = [p.name for p in user.role.permissions] if user.role else []
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user,
        permissions=permissions
    )


@router.post("/logout", response_model=LogoutResponse)
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log out currently authenticated user.
    Records LOGOUT event in audit logs.
    """
    client_ip = get_client_ip(request)
    auth_service.record_logout(db=db, user=current_user, ip_address=client_ip)
    return LogoutResponse(message="Successfully logged out.")


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Return currently authenticated user profile, assigned role, and permissions.
    """
    role_name = current_user.role.name if current_user.role else "UNKNOWN"
    permissions = [p.name for p in current_user.role.permissions] if current_user.role else []
    return UserProfileResponse(
        user=current_user,
        role_name=role_name,
        permissions=permissions
    )
