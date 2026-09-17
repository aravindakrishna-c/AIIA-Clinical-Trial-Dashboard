from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.schemas.dashboard_kpi import DashboardMetricsResponse, DashboardAlertItem
from app.services.dashboard_service import dashboard_service

router = APIRouter(tags=["Real-Time Dashboard, KPIs & Alerts"])


@router.get("/dashboard/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    trial_id: Optional[int] = Query(None, description="Filter metrics by trial ID"),
    site_id: Optional[int] = Query(None, description="Filter metrics by site ID"),
    current_user: User = Depends(require_permission("VIEW_DASHBOARD")),
    db: Session = Depends(get_db)
):
    """
    Get live, real-time clinical trial KPIs, dynamic enrollment rates,
    distribution charts, and milestone timeline calculated directly from PostgreSQL.
    """
    return dashboard_service.get_realtime_metrics(db, current_user, trial_id=trial_id, site_id=site_id)


@router.get("/dashboard/alerts", response_model=List[DashboardAlertItem])
def get_dashboard_alerts(
    current_user: User = Depends(require_permission("VIEW_DASHBOARD")),
    db: Session = Depends(get_db)
):
    """
    Get live operational alerts (recruitment pace lag, overdue visits,
    expiring ethics approvals, open SAEs, regulatory deadlines).
    """
    return dashboard_service.get_realtime_alerts(db, current_user)
