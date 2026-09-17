from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.services.cdisc_service import cdisc_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/export", tags=["CDISC Data Export & Interoperability"])


@router.get("/cdisc/{domain}")
def export_cdisc_domain(
    domain: str,
    trial_id: Optional[int] = Query(1, description="Clinical trial ID to export"),
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """
    Export CDISC SDTM/CDASH clinical dataset in CSV format.
    Supported domains: DM (Demographics), SV (Subject Visits), AE (Adverse Events), TS (Trial Summary), TV (Trial Visits).
    """
    csv_content = cdisc_service.export_domain_csv(db, domain=domain, trial_id=trial_id or 1)

    # Log audit event for data export (compliance tracking)
    audit_service.record_event(
        db=db,
        action="DATASET_EXPORTED",
        entity_type="CDISC_EXPORT",
        entity_id=domain.upper(),
        description=f"Exported CDISC {domain.upper()} dataset for trial #{trial_id}.",
        user_id=current_user.id,
        metadata={"domain": domain.upper(), "trial_id": trial_id}
    )

    filename = f"CDISC_{domain.upper()}_AIIA_Trial_{trial_id}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
