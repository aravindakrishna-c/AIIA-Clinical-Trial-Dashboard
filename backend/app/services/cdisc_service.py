import csv
import io
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.clinical_trial import ClinicalTrial
from app.models.trial_site import TrialSite
from app.models.participant import Participant
from app.models.participant_visit import ParticipantVisit
from app.models.adverse_event import AdverseEvent


class CDISCService:
    """
    CDISC-Ready Dataset Export Service.
    Generates standard CDISC SDTM/CDASH tabular datasets in CSV format
    for clinical research data interchange and regulatory submissions.
    """

    def export_domain_csv(self, db: Session, domain: str, trial_id: int = 1) -> str:
        domain = domain.upper()
        output = io.StringIO()
        writer = csv.writer(output)

        trial = db.query(ClinicalTrial).filter(ClinicalTrial.id == trial_id).first()
        if not trial:
            trial = db.query(ClinicalTrial).first()
        study_id = trial.trial_id if trial else "AIIA-CT-2026-001"

        if domain == "DM":
            # Demographics Domain
            writer.writerow([
                "STUDYID", "DOMAIN", "USUBJID", "SUBJID", "SITEID", "AGE", "AGEU", "SEX", "ARM", "ACTARM", "RFSTDTC", "RFENDTC"
            ])
            participants = db.query(Participant).filter(Participant.trial_id == trial.id).all() if trial else db.query(Participant).all()
            for p in participants:
                site_code = p.site.site_code if p.site else f"SITE-{p.site_id}"
                arm_text = p.treatment_group or "Not Assigned"
                rfstdtc = str(p.enrollment_date or p.screening_date)
                rfendtc = str(p.completion_date or p.withdrawal_date or "")
                writer.writerow([
                    study_id, "DM", p.participant_id, p.screening_number, site_code, p.age, "YEARS", p.sex, arm_text, arm_text, rfstdtc, rfendtc
                ])

        elif domain == "SV":
            # Subject Visits Domain
            writer.writerow([
                "STUDYID", "DOMAIN", "USUBJID", "VISITNUM", "VISIT", "SVSTDTC", "SVENDTC", "SVSTATUS"
            ])
            visits = db.query(ParticipantVisit).filter(ParticipantVisit.trial_id == trial.id).all() if trial else db.query(ParticipantVisit).all()
            for v in visits:
                usubjid = v.participant.participant_id if v.participant else f"SUBJ-{v.participant_id}"
                svdate = str(v.actual_date or v.planned_date)
                writer.writerow([
                    study_id, "SV", usubjid, v.visit_number, v.visit_name, svdate, svdate, v.status
                ])

        elif domain == "AE":
            # Adverse Events Domain
            writer.writerow([
                "STUDYID", "DOMAIN", "USUBJID", "AETERM", "AEDECOD", "AESTDTC", "AEENDTC", "AESEV", "AESER", "AEREL", "AEOUT"
            ])
            aes = db.query(AdverseEvent).filter(AdverseEvent.trial_id == trial.id).all() if trial else db.query(AdverseEvent).all()
            for ae in aes:
                usubjid = ae.participant.participant_id if ae.participant else f"SUBJ-{ae.participant_id}"
                aeser = "Y" if ae.is_serious else "N"
                writer.writerow([
                    study_id, "AE", usubjid, ae.event_term, ae.event_term, str(ae.start_date), str(ae.end_date or ""), ae.severity.upper(), aeser, ae.causality.upper(), ae.outcome.upper()
                ])

        elif domain == "TS":
            # Trial Summary Domain
            writer.writerow(["STUDYID", "DOMAIN", "TSPARMCD", "TSPARM", "TSVAL"])
            if trial:
                writer.writerow([study_id, "TS", "TITLE", "Trial Title", trial.trial_title])
                writer.writerow([study_id, "TS", "PHASE", "Trial Phase", trial.study_phase])
                writer.writerow([study_id, "TS", "SPONSOR", "Clinical Study Sponsor", trial.sponsor])
                writer.writerow([study_id, "TS", "INDICATION", "Indication/Condition", trial.disease_condition])
                writer.writerow([study_id, "TS", "TRT", "Ayurvedic Investigational Treatment", trial.ayurveda_intervention])
                writer.writerow([study_id, "TS", "DESIGN", "Study Design", trial.study_design])
                writer.writerow([study_id, "TS", "PLANSUB", "Planned Subject Count", str(trial.target_participants)])

        elif domain == "TV":
            # Trial Visits Domain
            writer.writerow(["STUDYID", "DOMAIN", "VISITNUM", "VISIT", "ARMCD"])
            from app.services.participant_service import STANDARD_VISIT_TEMPLATES
            for tmpl in STANDARD_VISIT_TEMPLATES:
                writer.writerow([study_id, "TV", tmpl["number"], tmpl["name"], "ALL"])

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported CDISC domain '{domain}'. Supported domains: DM, SV, AE, TS, TV."
            )

        return output.getvalue()


cdisc_service = CDISCService()
