from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.participant import Participant
from app.models.participant_visit import ParticipantVisit
from app.models.clinical_trial import ClinicalTrial
from app.models.adverse_event import AdverseEvent


class FHIRService:
    """
    FHIR R4 Demonstration Mapping Service.
    Transforms internal CTMS models into HL7 FHIR Release 4 JSON resources for interoperability readiness.
    Uses synthetic, de-identified clinical trial data.
    """

    def get_patient(self, db: Session, participant_id: int) -> Dict[str, Any]:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        fhir_gender = "male" if p.sex.lower() == "male" else ("female" if p.sex.lower() == "female" else "other")
        birth_year = datetime.now().year - p.age

        return {
            "resourceType": "Patient",
            "id": p.participant_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": p.updated_at.isoformat(),
                "profile": ["http://hl7.org/fhir/StructureDefinition/Patient"]
            },
            "identifier": [
                {
                    "use": "usual",
                    "system": "http://aiia.gov.in/ctms/participant-id",
                    "value": p.participant_id
                },
                {
                    "use": "secondary",
                    "system": "http://aiia.gov.in/ctms/screening-number",
                    "value": p.screening_number
                }
            ],
            "active": p.status in ["Active", "Enrolled", "Randomized"],
            "gender": fhir_gender,
            "birthDate": f"{birth_year}-01-01",
            "extension": [
                {
                    "url": "http://aiia.gov.in/fhir/StructureDefinition/trial-id",
                    "valueString": p.trial.trial_id if p.trial else str(p.trial_id)
                },
                {
                    "url": "http://aiia.gov.in/fhir/StructureDefinition/treatment-group",
                    "valueString": p.treatment_group or "Unassigned"
                },
                {
                    "url": "http://aiia.gov.in/fhir/StructureDefinition/participant-status",
                    "valueString": p.status
                }
            ],
            "managingOrganization": {
                "reference": f"Organization/AIIA-SITE-{p.site_id}",
                "display": p.site.institution if p.site else "All India Institute of Ayurveda"
            }
        }

    def get_encounter(self, db: Session, visit_id: int) -> Dict[str, Any]:
        v = db.query(ParticipantVisit).filter(ParticipantVisit.id == visit_id).first()
        if not v:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit record not found")

        status_map = {
            "Scheduled": "planned",
            "Completed": "finished",
            "Missed": "cancelled",
            "Overdue": "arrived",
            "Cancelled": "cancelled"
        }

        return {
            "resourceType": "Encounter",
            "id": f"ENC-{v.id}",
            "meta": {
                "versionId": "1",
                "lastUpdated": v.updated_at.isoformat(),
                "profile": ["http://hl7.org/fhir/StructureDefinition/Encounter"]
            },
            "status": status_map.get(v.status, "unknown"),
            "class": {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "AMB",
                "display": "Ambulatory Clinical Research Visit"
            },
            "type": [
                {
                    "text": v.visit_name
                }
            ],
            "subject": {
                "reference": f"Patient/{v.participant.participant_id if v.participant else v.participant_id}",
                "display": f"Trial Subject #{v.participant_id}"
            },
            "period": {
                "start": str(v.actual_date or v.planned_date)
            },
            "serviceProvider": {
                "reference": f"Organization/AIIA-SITE-{v.site_id}",
                "display": v.site.site_name if v.site else "AIIA Clinical Trial Site"
            }
        }

    def get_condition(self, db: Session, trial_id: int) -> Dict[str, Any]:
        t = db.query(ClinicalTrial).filter(ClinicalTrial.id == trial_id).first()
        if not t:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trial not found")

        return {
            "resourceType": "Condition",
            "id": f"COND-{t.id}",
            "meta": {
                "versionId": "1",
                "profile": ["http://hl7.org/fhir/StructureDefinition/Condition"]
            },
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": "active"
                    }
                ]
            },
            "verificationStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": "confirmed"
                    }
                ]
            },
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                            "code": "encounter-diagnosis",
                            "display": "Clinical Trial Target Indication"
                        }
                    ]
                }
            ],
            "code": {
                "text": t.disease_condition
            },
            "note": [
                {
                    "text": f"Investigational disease condition evaluated in clinical trial {t.trial_id} ({t.trial_title})."
                }
            ]
        }

    def get_medication(self, db: Session, trial_id: int) -> Dict[str, Any]:
        t = db.query(ClinicalTrial).filter(ClinicalTrial.id == trial_id).first()
        if not t:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trial not found")

        return {
            "resourceType": "Medication",
            "id": f"MED-{t.id}",
            "meta": {
                "versionId": "1",
                "profile": ["http://hl7.org/fhir/StructureDefinition/Medication"]
            },
            "code": {
                "text": t.ayurveda_intervention
            },
            "status": "active",
            "form": {
                "text": t.intervention_type  # Herbal, Herbo-mineral, Panchakarma, etc.
            },
            "extension": [
                {
                    "url": "http://aiia.gov.in/fhir/StructureDefinition/dosage-regimen",
                    "valueString": t.dosage or "Standardized clinical protocol dose"
                },
                {
                    "url": "http://aiia.gov.in/fhir/StructureDefinition/route-of-administration",
                    "valueString": t.route_of_administration or "Oral"
                },
                {
                    "url": "http://aiia.gov.in/fhir/StructureDefinition/formulation-procedure",
                    "valueString": t.formulation_procedure or "Prepared per Ayurvedic Pharmacopoeia of India (API) standards"
                }
            ]
        }

    def get_observation(self, db: Session, participant_id: int) -> Dict[str, Any]:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        return {
            "resourceType": "Observation",
            "id": f"OBS-{p.id}-SCREEN",
            "meta": {
                "versionId": "1",
                "profile": ["http://hl7.org/fhir/StructureDefinition/Observation"]
            },
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                            "code": "exam",
                            "display": "Protocol Screening & Eligibility Evaluation"
                        }
                    ]
                }
            ],
            "code": {
                "text": "Trial Eligibility Screening Scorecard"
            },
            "subject": {
                "reference": f"Patient/{p.participant_id}"
            },
            "effectiveDateTime": str(p.screening_date),
            "valueString": p.eligibility_status,
            "component": [
                {
                    "code": {"text": "Age Evaluation"},
                    "valueQuantity": {"value": p.age, "unit": "years"}
                },
                {
                    "code": {"text": "Sex"},
                    "valueString": p.sex
                }
            ]
        }

    def get_consent(self, db: Session, participant_id: int) -> Dict[str, Any]:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

        is_consented = p.status not in ["Screened", "Ineligible"]

        return {
            "resourceType": "Consent",
            "id": f"CONSENT-{p.id}",
            "meta": {
                "versionId": "1",
                "profile": ["http://hl7.org/fhir/StructureDefinition/Consent"]
            },
            "status": "active" if is_consented else "draft",
            "scope": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/consentscope",
                        "code": "research",
                        "display": "Clinical Trial Research Consent"
                    }
                ]
            },
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/consentcategorycodes",
                            "code": "research",
                            "display": "Ayurveda Clinical Research Protocol Informed Consent"
                        }
                    ]
                }
            ],
            "patient": {
                "reference": f"Patient/{p.participant_id}"
            },
            "dateTime": str(p.enrollment_date or p.screening_date),
            "policy": [
                {
                    "authority": "http://ayush.gov.in",
                    "uri": "http://aiia.gov.in/policies/ethics-consent-v1.0"
                }
            ]
        }


fhir_service = FHIRService()
