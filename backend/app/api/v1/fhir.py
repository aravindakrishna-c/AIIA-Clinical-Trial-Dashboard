from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.services.fhir_service import fhir_service

router = APIRouter(prefix="/fhir", tags=["FHIR Interoperability (HL7 FHIR R4)"])


@router.get("/Patient/{participant_id}")
def get_fhir_patient(
    participant_id: int,
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """Generate HL7 FHIR Release 4 compliant Patient resource JSON for trial participant."""
    return fhir_service.get_patient(db, participant_id)


@router.get("/Encounter/{visit_id}")
def get_fhir_encounter(
    visit_id: int,
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """Generate HL7 FHIR Release 4 Encounter resource JSON for trial clinical visit."""
    return fhir_service.get_encounter(db, visit_id)


@router.get("/Condition/{trial_id}")
def get_fhir_condition(
    trial_id: int,
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """Generate HL7 FHIR Release 4 Condition resource JSON for study disease indication."""
    return fhir_service.get_condition(db, trial_id)


@router.get("/Medication/{trial_id}")
def get_fhir_medication(
    trial_id: int,
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """Generate HL7 FHIR Release 4 Medication resource JSON for Ayurveda study intervention."""
    return fhir_service.get_medication(db, trial_id)


@router.get("/Observation/{participant_id}")
def get_fhir_observation(
    participant_id: int,
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """Generate HL7 FHIR Release 4 Observation resource JSON for screening evaluation scorecard."""
    return fhir_service.get_observation(db, participant_id)


@router.get("/Consent/{participant_id}")
def get_fhir_consent(
    participant_id: int,
    current_user: User = Depends(require_permission("trial.view")),
    db: Session = Depends(get_db)
):
    """Generate HL7 FHIR Release 4 Consent resource JSON for protocol informed consent."""
    return fhir_service.get_consent(db, participant_id)
