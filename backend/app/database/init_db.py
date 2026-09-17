from datetime import datetime, timezone, date, timedelta
from sqlalchemy.orm import Session
from app.database.session import engine, SessionLocal
from app.models.base import Base
from app.models.role import Role
from app.models.permission import Permission
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.clinical_trial import ClinicalTrial
from app.models.trial_protocol_version import TrialProtocolVersion
from app.models.trial_milestone import TrialMilestone
from app.models.trial_site import TrialSite
from app.models.participant import Participant
from app.models.participant_visit import ParticipantVisit
from app.models.ethics_submission import EthicsSubmission
from app.models.ctri_regulatory import CTRIRegistration, RegulatoryEvent
from app.models.adverse_event import AdverseEvent
from app.core.security import get_password_hash
from app.services.audit_service import audit_service


ROLES_DATA = [
    {
        "name": "ADMIN",
        "description": "System Administrator with full access to user management, system settings, and audit logs."
    },
    {
        "name": "PRINCIPAL_INVESTIGATOR",
        "description": "Lead medical researcher overseeing trial protocols, clinical integrity, and regulatory filings."
    },
    {
        "name": "STUDY_COORDINATOR",
        "description": "Site coordinator managing daily trial operations, participant schedules, and documentation."
    },
    {
        "name": "CLINICAL_TRIAL_MONITOR",
        "description": "Independent CRA/monitor verifying GCP compliance, data accuracy, and trial site adherence."
    },
    {
        "name": "ETHICS_COMMITTEE",
        "description": "Institutional Ethics Committee (IEC) reviewer approving trial protocols and amendments."
    },
    {
        "name": "PHARMACOVIGILANCE_OFFICER",
        "description": "Drug safety specialist tracking adverse events, ADRs, and pharmacovigilance reports."
    },
    {
        "name": "REGULATOR",
        "description": "Auditor from regulatory bodies (e.g., CDSCO, Ministry of Ayush) reviewing compliance."
    }
]

PERMISSIONS_DATA = [
    {"name": "VIEW_DASHBOARD", "description": "Access role-specific dashboard workspaces"},
    {"name": "MANAGE_USERS", "description": "Create, update, activate and deactivate users"},
    {"name": "VIEW_AUDIT_LOG", "description": "View system-wide immutable audit trail"},
    # Phase 2 Clinical Trials & Site Management Permissions
    {"name": "trial.view", "description": "View clinical trials, protocol information, and sites"},
    {"name": "trial.create", "description": "Draft and register new clinical trial protocols"},
    {"name": "trial.edit", "description": "Modify permitted clinical trial operational information"},
    {"name": "trial.status.update", "description": "Transition clinical trial lifecycle status"},
    {"name": "trial.site.view", "description": "View multi-center trial sites and enrollment targets"},
    {"name": "trial.site.create", "description": "Register new investigational trial sites"},
    {"name": "trial.site.edit", "description": "Manage trial site demographics and site status"},
    {"name": "trial.milestone.view", "description": "View trial timeline and milestone progress"},
    {"name": "trial.milestone.manage", "description": "Create and update operational trial milestones"},
    {"name": "trial.protocol.view", "description": "View historical protocol versions and amendments"},
    {"name": "trial.protocol.manage", "description": "Create protocol amendments and version updates"},
    # Phase 3 Participant Lifecycle Permissions
    {"name": "participant.view", "description": "View participant records, screening status, and clinical visits"},
    {"name": "participant.create", "description": "Register and screen prospective trial participants"},
    {"name": "participant.screen", "description": "Evaluate protocol inclusion/exclusion criteria scorecard"},
    {"name": "participant.enroll", "description": "Enroll validated eligible participants into trial sites"},
    {"name": "participant.randomize", "description": "Perform server-side randomization to treatment arms"},
    {"name": "participant.visit", "description": "Record, schedule, and complete clinical visits"},
    {"name": "participant.withdraw", "description": "Record participant withdrawal with clinical rationale"},
    {"name": "participant.complete", "description": "Record study completion for participants"},
    # Phase 4 Ethics, CTRI & Regulatory Permissions
    {"name": "ethics.view", "description": "View Institutional Ethics Committee submissions and status"},
    {"name": "ethics.create", "description": "Draft new protocol ethics review submissions"},
    {"name": "ethics.submit", "description": "Submit ethics dossiers to Institutional Ethics Committee"},
    {"name": "ethics.review", "description": "Conduct IEC ethical review and record deliberations"},
    {"name": "ethics.approve", "description": "Grant or reject ethics committee approvals with validity dates"},
    {"name": "regulatory.manage", "description": "Manage CTRI registration and statutory compliance deadlines"},
    # Phase 5 Safety & Pharmacovigilance Permissions
    {"name": "safety.view", "description": "View Adverse Events, SAEs, ADRs, and pharmacovigilance reports"},
    {"name": "safety.create", "description": "Report adverse events, clinical reactions, and SAE notifications"},
    {"name": "safety.review", "description": "Perform clinical causality assessment and medical reviews"},
    {"name": "safety.close", "description": "Formally close resolved safety events"},
    # Phase 6 & 7 Dashboard, Audit, Interoperability Permissions
    {"name": "dashboard.view", "description": "View real-time centralized clinical monitoring dashboard"},
    {"name": "audit.view", "description": "Inspect tamper-evident 21 CFR Part 11 compliant audit trail"},
    {"name": "interop.fhir", "description": "Access HL7 FHIR Release 4 interoperability endpoints"},
    {"name": "interop.export", "description": "Generate CDISC SDTM/CDASH research datasets for download"}
]

DEMO_PASSWORD = "Password@AIIA2026!"

DEMO_USERS = [
    {
        "username": "admin",
        "email": "admin@aiia.gov.in",
        "full_name": "AIIA System Administrator",
        "role_name": "ADMIN",
        "password": DEMO_PASSWORD
    },
    {
        "username": "investigator",
        "email": "dr.sharma@aiia.gov.in",
        "full_name": "Dr. Rajesh Sharma (Principal Investigator)",
        "role_name": "PRINCIPAL_INVESTIGATOR",
        "password": DEMO_PASSWORD
    },
    {
        "username": "coordinator",
        "email": "coordinator.priya@aiia.gov.in",
        "full_name": "Priya Verma (Study Coordinator)",
        "role_name": "STUDY_COORDINATOR",
        "password": DEMO_PASSWORD
    },
    {
        "username": "monitor",
        "email": "monitor.gupta@aiia.gov.in",
        "full_name": "Anil Gupta (Clinical Trial Monitor)",
        "role_name": "CLINICAL_TRIAL_MONITOR",
        "password": DEMO_PASSWORD
    },
    {
        "username": "ethics",
        "email": "iec.chair@aiia.gov.in",
        "full_name": "Prof. Meenakshi Sundaram (Ethics Committee)",
        "role_name": "ETHICS_COMMITTEE",
        "password": DEMO_PASSWORD
    },
    {
        "username": "pharmacovigilance",
        "email": "pv.safety@aiia.gov.in",
        "full_name": "Dr. Sunita Rao (Pharmacovigilance Officer)",
        "role_name": "PHARMACOVIGILANCE_OFFICER",
        "password": DEMO_PASSWORD
    },
    {
        "username": "regulator",
        "email": "inspector.ayush@gov.in",
        "full_name": "R. K. Nair (Ayush / CDSCO Inspector)",
        "role_name": "REGULATOR",
        "password": DEMO_PASSWORD
    }
]


def init_db(db: Session) -> None:
    # 1. Create tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # 2. Seed Permissions
    permissions_map = {}
    for p_data in PERMISSIONS_DATA:
        perm = db.query(Permission).filter(Permission.name == p_data["name"]).first()
        if not perm:
            perm = Permission(name=p_data["name"], description=p_data["description"])
            db.add(perm)
            db.flush()
        permissions_map[perm.name] = perm

    # 3. Seed Roles & Assign Permissions
    roles_map = {}
    for r_data in ROLES_DATA:
        role = db.query(Role).filter(Role.name == r_data["name"]).first()
        if not role:
            role = Role(name=r_data["name"], description=r_data["description"])
            db.add(role)
            db.flush()

        # Permissions assignment
        if role.name == "ADMIN":
            role.permissions = list(permissions_map.values())
        elif role.name == "PRINCIPAL_INVESTIGATOR":
            role.permissions = [
                permissions_map["VIEW_DASHBOARD"],
                permissions_map["dashboard.view"],
                permissions_map["trial.view"],
                permissions_map["trial.create"],
                permissions_map["trial.edit"],
                permissions_map["trial.status.update"],
                permissions_map["trial.site.view"],
                permissions_map["trial.site.create"],
                permissions_map["trial.site.edit"],
                permissions_map["trial.milestone.view"],
                permissions_map["trial.milestone.manage"],
                permissions_map["trial.protocol.view"],
                permissions_map["trial.protocol.manage"],
                permissions_map["participant.view"],
                permissions_map["participant.create"],
                permissions_map["participant.screen"],
                permissions_map["participant.enroll"],
                permissions_map["participant.randomize"],
                permissions_map["participant.visit"],
                permissions_map["participant.withdraw"],
                permissions_map["participant.complete"],
                permissions_map["ethics.view"],
                permissions_map["ethics.create"],
                permissions_map["ethics.submit"],
                permissions_map["regulatory.manage"],
                permissions_map["safety.view"],
                permissions_map["safety.create"],
                permissions_map["safety.review"],
                permissions_map["interop.fhir"],
                permissions_map["interop.export"]
            ]
        elif role.name == "STUDY_COORDINATOR":
            role.permissions = [
                permissions_map["VIEW_DASHBOARD"],
                permissions_map["dashboard.view"],
                permissions_map["trial.view"],
                permissions_map["trial.edit"],
                permissions_map["trial.site.view"],
                permissions_map["trial.site.create"],
                permissions_map["trial.site.edit"],
                permissions_map["trial.milestone.view"],
                permissions_map["trial.milestone.manage"],
                permissions_map["trial.protocol.view"],
                permissions_map["participant.view"],
                permissions_map["participant.create"],
                permissions_map["participant.screen"],
                permissions_map["participant.enroll"],
                permissions_map["participant.randomize"],
                permissions_map["participant.visit"],
                permissions_map["participant.withdraw"],
                permissions_map["participant.complete"],
                permissions_map["ethics.view"],
                permissions_map["ethics.create"],
                permissions_map["safety.view"],
                permissions_map["safety.create"]
            ]
        elif role.name == "CLINICAL_TRIAL_MONITOR":
            role.permissions = [
                permissions_map["VIEW_DASHBOARD"],
                permissions_map["dashboard.view"],
                permissions_map["VIEW_AUDIT_LOG"],
                permissions_map["audit.view"],
                permissions_map["trial.view"],
                permissions_map["trial.site.view"],
                permissions_map["trial.milestone.view"],
                permissions_map["trial.protocol.view"],
                permissions_map["participant.view"],
                permissions_map["ethics.view"],
                permissions_map["safety.view"]
            ]
        elif role.name == "ETHICS_COMMITTEE":
            role.permissions = [
                permissions_map["VIEW_DASHBOARD"],
                permissions_map["dashboard.view"],
                permissions_map["trial.view"],
                permissions_map["trial.protocol.view"],
                permissions_map["trial.milestone.view"],
                permissions_map["ethics.view"],
                permissions_map["ethics.review"],
                permissions_map["ethics.approve"]
            ]
        elif role.name == "PHARMACOVIGILANCE_OFFICER":
            role.permissions = [
                permissions_map["VIEW_DASHBOARD"],
                permissions_map["dashboard.view"],
                permissions_map["trial.view"],
                permissions_map["trial.site.view"],
                permissions_map["trial.protocol.view"],
                permissions_map["participant.view"],
                permissions_map["safety.view"],
                permissions_map["safety.create"],
                permissions_map["safety.review"],
                permissions_map["safety.close"]
            ]
        elif role.name == "REGULATOR":
            role.permissions = [
                permissions_map["VIEW_DASHBOARD"],
                permissions_map["dashboard.view"],
                permissions_map["VIEW_AUDIT_LOG"],
                permissions_map["audit.view"],
                permissions_map["trial.view"],
                permissions_map["trial.site.view"],
                permissions_map["trial.protocol.view"],
                permissions_map["trial.milestone.view"],
                permissions_map["participant.view"],
                permissions_map["ethics.view"],
                permissions_map["regulatory.manage"],
                permissions_map["safety.view"],
                permissions_map["interop.fhir"],
                permissions_map["interop.export"]
            ]
        else:
            role.permissions = [permissions_map["VIEW_DASHBOARD"]]

        roles_map[role.name] = role

    db.commit()

    # 4. Seed Demo Users
    user_map = {}
    for u_data in DEMO_USERS:
        existing_user = db.query(User).filter(User.username == u_data["username"]).first()
        if not existing_user:
            role = roles_map[u_data["role_name"]]
            hashed_pwd = get_password_hash(u_data["password"])
            existing_user = User(
                username=u_data["username"],
                email=u_data["email"],
                full_name=u_data["full_name"],
                password_hash=hashed_pwd,
                role_id=role.id,
                is_active=True
            )
            db.add(existing_user)
            db.flush()

            audit_service.record_event(
                db=db,
                action="USER_CREATED",
                entity_type="SYSTEM_SEED",
                entity_id=str(existing_user.id),
                description=f"Seeded demo account '{existing_user.username}' with role '{role.name}'.",
                user_id=None,
                metadata={"username": existing_user.username, "role": role.name, "seed": True}
            )
        user_map[existing_user.username] = existing_user

    db.commit()

    # 5. Seed Synthetic Clinical Trials (Phase 2)
    pi_user = user_map.get("investigator")
    admin_user = user_map.get("admin")
    coordinator_user = user_map.get("coordinator")

    if pi_user and admin_user:
        seed_trials_data = [
            {
                "trial_id": "AIIA-CT-2026-001",
                "trial_title": "Evaluation of an Ayurvedic Intervention for Type 2 Diabetes Management (Madhumeha)",
                "short_title": "Ayurveda T2D Glycemic Trial",
                "protocol_number": "AIIA/IEC/2026/042",
                "protocol_version": "1.1",
                "protocol_version_date": date(2026, 2, 15),
                "study_type": "Interventional",
                "study_phase": "Phase II",
                "study_design": "Parallel Group, Randomized, Double-Blind",
                "sponsor": "All India Institute of Ayurveda (AIIA)",
                "sponsor_type": "Government",
                "sponsor_contact": "clinical.research@aiia.gov.in / +91-11-29948482",
                "principal_investigator_id": pi_user.id,
                "disease_condition": "Type 2 Diabetes Mellitus (Madhumeha)",
                "ayurveda_intervention": "Standardized Nishamalaki & Mehamudgara Vati",
                "intervention_type": "Herbal",
                "intervention_description": "Standardized aqueous extract of Haridra (Curcuma longa) and Amalaki (Phyllanthus emblica) combined with Mehamudgara Vati.",
                "dosage": "500 mg twice daily with lukewarm water",
                "route_of_administration": "Oral",
                "frequency": "Twice daily (after principal meals)",
                "duration": "24 weeks",
                "formulation_procedure": "Classical Ghana Vati preparation standardized for curcuminoids (>95%) and tannins (>40%).",
                "comparator": "Placebo (Microcrystalline Cellulose Vati)",
                "comparator_description": "Identical looking, smelling, and weight-matched placebo tablets.",
                "target_participants": 120,
                "planned_enrollment_start_date": date(2026, 3, 1),
                "start_date": date(2026, 3, 1),
                "expected_completion_date": date(2026, 12, 31),
                "inclusion_criteria": "1. Age 30-65 years (both sexes)\n2. Diagnosed T2DM (HbA1c between 7.0% and 9.5%)\n3. Stable metformin dosage for >= 3 months\n4. Willing to provide informed consent and comply with study protocol",
                "exclusion_criteria": "1. Type 1 diabetes or secondary diabetes\n2. Severe diabetic ketoacidosis history\n3. Renal impairment (eGFR < 45 mL/min/1.73m2) or hepatic dysfunction (ALT/AST > 3x ULN)\n4. Pregnant, lactating, or planning pregnancy during study period",
                "primary_objective": "To evaluate the efficacy of Nishamalaki & Mehamudgara Vati in achieving reduction of HbA1c from baseline to 24 weeks compared to placebo.",
                "secondary_objectives": "1. Fasting and Postprandial Blood Glucose reduction\n2. Lipid profile modulation (Total Cholesterol, Triglycerides, HDL)\n3. HOMA-IR and beta-cell insulin sensitivity indices\n4. Safety and tolerability profile across 24 weeks",
                "status": "Recruiting",
                "protocols": [
                    {
                        "version_number": "1.0",
                        "version_date": date(2026, 1, 10),
                        "change_summary": "Initial clinical trial protocol formulation and submission to IEC.",
                        "status": "Superseded"
                    },
                    {
                        "version_number": "1.1",
                        "version_date": date(2026, 2, 15),
                        "change_summary": "Inclusion criteria clarification regarding concurrent stable Metformin therapy as requested by Ethics Committee.",
                        "status": "Current"
                    }
                ],
                "milestones": [
                    {"name": "Protocol Finalization", "planned": date(2026, 1, 15), "actual": date(2026, 1, 14), "status": "Completed"},
                    {"name": "Ethics Committee Approval", "planned": date(2026, 2, 10), "actual": date(2026, 2, 12), "status": "Completed"},
                    {"name": "CTRI Clinical Registration", "planned": date(2026, 2, 25), "actual": date(2026, 2, 24), "status": "Completed"},
                    {"name": "Trial Site Activation", "planned": date(2026, 3, 1), "actual": date(2026, 3, 1), "status": "Completed"},
                    {"name": "Participant Enrollment Target (50%)", "planned": date(2026, 6, 30), "actual": None, "status": "In Progress"},
                    {"name": "Final Participant Visit & Data Lock", "planned": date(2026, 11, 30), "actual": None, "status": "Planned"}
                ],
                "sites": [
                    {
                        "site_code": "AIIA-001",
                        "site_name": "AIIA Main Hospital Clinical Research Facility",
                        "institution": "All India Institute of Ayurveda",
                        "location": "Gautampuri, Mathura Road, Sarita Vihar",
                        "city": "New Delhi",
                        "state": "Delhi",
                        "country": "India",
                        "site_investigator_id": pi_user.id,
                        "activation_date": date(2026, 3, 1),
                        "site_status": "Recruiting",
                        "enrollment_target": 60,
                        "current_enrollment": 18
                    },
                    {
                        "site_code": "AIIA-002",
                        "site_name": "IPGTRA Advanced Ayurveda Research Unit",
                        "institution": "Institute of Teaching & Research in Ayurveda",
                        "location": "Opposite B-Division Police Station, Gurudwara Road",
                        "city": "Jamnagar",
                        "state": "Gujarat",
                        "country": "India",
                        "site_investigator_id": coordinator_user.id if coordinator_user else pi_user.id,
                        "activation_date": date(2026, 3, 5),
                        "site_status": "Activated",
                        "enrollment_target": 60,
                        "current_enrollment": 0
                    }
                ]
            },
            {
                "trial_id": "AIIA-CT-2026-002",
                "trial_title": "Clinical Efficacy and Neurocognitive Safety of Standardized Brahmi Ghrita in Mild Cognitive Impairment (Smritibhransha)",
                "short_title": "Brahmi Ghrita Cognitive Trial",
                "protocol_number": "AIIA/IEC/2026/058",
                "protocol_version": "1.0",
                "protocol_version_date": date(2026, 1, 20),
                "study_type": "Interventional",
                "study_phase": "Phase II",
                "study_design": "Parallel Group, Randomized, Open Label",
                "sponsor": "Ministry of Ayush & AIIA",
                "sponsor_type": "Government",
                "sponsor_contact": "ayush.neurotrials@gov.in",
                "principal_investigator_id": pi_user.id,
                "disease_condition": "Mild Cognitive Impairment (Smritibhransha)",
                "ayurveda_intervention": "Standardized Brahmi Ghrita (Bacopa monnieri processed medicated ghee)",
                "intervention_type": "Medicated Ghee (Ghrita)",
                "intervention_description": "Cow milk ghee processed with fresh Brahmi swarasa, Shankhpushpi, and Vacha according to Sharangadhara Samhita.",
                "dosage": "10 ml twice daily with warm milk",
                "route_of_administration": "Oral",
                "frequency": "Twice daily on empty stomach",
                "duration": "16 weeks",
                "formulation_procedure": "Sneha Kalpana standardized for bacoside A and B concentrations.",
                "comparator": "Active Comparator (Standard Piracetam 800 mg)",
                "comparator_description": "Standard nootropic pharmaceutical arm.",
                "target_participants": 80,
                "planned_enrollment_start_date": date(2026, 2, 1),
                "start_date": date(2026, 2, 1),
                "expected_completion_date": date(2026, 10, 31),
                "inclusion_criteria": "1. Adults aged 55-75 years\n2. Montreal Cognitive Assessment (MoCA) score 18-25\n3. Subjective memory decline confirmed by reliable informant\n4. Normal activities of daily living (ADL)",
                "exclusion_criteria": "1. Diagnosed dementia (Alzheimer's, Vascular, Lewy Body)\n2. Major depressive disorder or psychiatric condition\n3. Severe cardiovascular disease or uncontrolled hypertension\n4. Known allergy to cow milk or herbal constituents",
                "primary_objective": "To measure change in MoCA neurocognitive test scores from baseline to week 16 between Brahmi Ghrita and active comparator.",
                "secondary_objectives": "1. P300 auditory event-related potential latency\n2. Rey Auditory Verbal Learning Test (RAVLT) scores\n3. Quality of Life in Alzheimer's Disease (QoL-AD) score",
                "status": "Active",
                "protocols": [
                    {
                        "version_number": "1.0",
                        "version_date": date(2026, 1, 20),
                        "change_summary": "Original approved protocol.",
                        "status": "Current"
                    }
                ],
                "milestones": [
                    {"name": "Ethics Submission", "planned": date(2026, 1, 10), "actual": date(2026, 1, 10), "status": "Completed"},
                    {"name": "Ethics Approval", "planned": date(2026, 1, 25), "actual": date(2026, 1, 22), "status": "Completed"},
                    {"name": "Site Readiness Inspection", "planned": date(2026, 2, 1), "actual": date(2026, 2, 1), "status": "Completed"},
                    {"name": "Recruitment Target Complete", "planned": date(2026, 7, 15), "actual": None, "status": "In Progress"}
                ],
                "sites": [
                    {
                        "site_code": "SITE-101",
                        "site_name": "National Institute of Ayurveda Hospital",
                        "institution": "National Institute of Ayurveda (Deemed to be University)",
                        "location": "Jorawar Singh Gate, Amer Road",
                        "city": "Jaipur",
                        "state": "Rajasthan",
                        "country": "India",
                        "site_investigator_id": pi_user.id,
                        "activation_date": date(2026, 2, 1),
                        "site_status": "Activated",
                        "enrollment_target": 40,
                        "current_enrollment": 12
                    },
                    {
                        "site_code": "SITE-102",
                        "site_name": "AIIA Neuro-Care Center",
                        "institution": "All India Institute of Ayurveda",
                        "location": "Mathura Road, Sarita Vihar",
                        "city": "New Delhi",
                        "state": "Delhi",
                        "country": "India",
                        "site_investigator_id": pi_user.id,
                        "activation_date": date(2026, 2, 5),
                        "site_status": "Activated",
                        "enrollment_target": 40,
                        "current_enrollment": 15
                    }
                ]
            },
            {
                "trial_id": "AIIA-CT-2026-003",
                "trial_title": "Standardized Guduchi and Haridra in Rheumatoid Arthritis (Amavata): A Multi-Center Randomized Comparative Trial",
                "short_title": "Guduchi-Haridra in Amavata",
                "protocol_number": "AIIA/IEC/2026/089",
                "protocol_version": "1.0",
                "protocol_version_date": date(2026, 2, 28),
                "study_type": "Interventional",
                "study_phase": "Phase III",
                "study_design": "Parallel Group, Randomized, Active-Controlled",
                "sponsor": "Central Council for Research in Ayurvedic Sciences (CCRAS)",
                "sponsor_type": "Institutional",
                "sponsor_contact": "dg-ccras@nic.in",
                "principal_investigator_id": pi_user.id,
                "disease_condition": "Rheumatoid Arthritis (Amavata)",
                "ayurveda_intervention": "Standardized Guduchi Ghana Vati and Haridra Khanda",
                "intervention_type": "Herbo-mineral",
                "intervention_description": "Tinospora cordifolia standardized water extract and Curcuma longa granule formulation.",
                "dosage": "1000 mg Guduchi + 5 g Haridra Khanda twice daily",
                "route_of_administration": "Oral",
                "frequency": "Twice daily with lukewarm water",
                "duration": "24 weeks",
                "formulation_procedure": "Manufactured in GMP-certified pharmacy following Ayurvedic Pharmacopoeia of India (API) monographs.",
                "comparator": "Standard DMARD (Methotrexate 15 mg/week + Folic Acid)",
                "comparator_description": "Active standard clinical comparator arm.",
                "target_participants": 200,
                "planned_enrollment_start_date": date(2026, 4, 15),
                "start_date": date(2026, 4, 15),
                "expected_completion_date": date(2027, 4, 14),
                "inclusion_criteria": "1. Adults 18-70 years meeting 2010 ACR/EULAR Rheumatoid Arthritis criteria\n2. Active disease (DAS28-ESR > 3.2)\n3. Positive Rheumatoid Factor (RF) or Anti-CCP",
                "exclusion_criteria": "1. Joint deformity requiring immediate surgical intervention\n2. Severe extra-articular manifestations (vasculitis, pericarditis)\n3. Concomitant biologic DMARD therapy in preceding 6 months",
                "primary_objective": "Proportion of participants achieving ACR20 clinical response at 24 weeks.",
                "secondary_objectives": "1. ACR50 and ACR70 response rates\n2. Reduction in DAS28-CRP and visual analog scale (VAS) pain score\n3. HAQ-DI disability score change",
                "status": "Ethics Approved",
                "protocols": [
                    {
                        "version_number": "1.0",
                        "version_date": date(2026, 2, 28),
                        "change_summary": "Original protocol submitted and cleared by Institutional Ethics Committee.",
                        "status": "Current"
                    }
                ],
                "milestones": [
                    {"name": "Multi-Center Protocol Harmonization", "planned": date(2026, 2, 1), "actual": date(2026, 2, 10), "status": "Completed"},
                    {"name": "Ethics Clearance", "planned": date(2026, 2, 28), "actual": date(2026, 3, 2), "status": "Completed"},
                    {"name": "CTRI Registry Listing", "planned": date(2026, 3, 20), "actual": None, "status": "In Progress"},
                    {"name": "First Patient In (FPI)", "planned": date(2026, 4, 15), "actual": None, "status": "Planned"}
                ],
                "sites": [
                    {
                        "site_code": "CCRAS-001",
                        "site_name": "Central Ayurveda Research Institute (CARI)",
                        "institution": "CCRAS Ministry of Ayush",
                        "location": "Road No. 66, Punjabi Bagh",
                        "city": "New Delhi",
                        "state": "Delhi",
                        "country": "India",
                        "site_investigator_id": pi_user.id,
                        "activation_date": None,
                        "site_status": "Pending",
                        "enrollment_target": 100,
                        "current_enrollment": 0
                    },
                    {
                        "site_code": "CCRAS-002",
                        "site_name": "Regional Ayurveda Research Institute",
                        "institution": "CCRAS Ministry of Ayush",
                        "location": "Nehru Enclave, Gomti Nagar",
                        "city": "Lucknow",
                        "state": "Uttar Pradesh",
                        "country": "India",
                        "site_investigator_id": pi_user.id,
                        "activation_date": None,
                        "site_status": "Pending",
                        "enrollment_target": 100,
                        "current_enrollment": 0
                    }
                ]
            },
            {
                "trial_id": "AIIA-CT-2026-004",
                "trial_title": "Therapeutic Evaluation of Classical Virechana Karma in Chronic Plaque Psoriasis (Kitibha Kushtha)",
                "short_title": "Virechana Karma in Psoriasis",
                "protocol_number": "AIIA/IEC/2026/112",
                "protocol_version": "1.0",
                "protocol_version_date": date(2026, 3, 10),
                "study_type": "Interventional",
                "study_phase": "Phase I",
                "study_design": "Single Group, Open Label",
                "sponsor": "All India Institute of Ayurveda",
                "sponsor_type": "Institutional",
                "sponsor_contact": "panchakarma.aiia@gov.in",
                "principal_investigator_id": pi_user.id,
                "disease_condition": "Chronic Plaque Psoriasis (Kitibha Kushtha)",
                "ayurveda_intervention": "Classical Virechana (Panchakarma Purgation) with Mahatiktaka Ghrita",
                "intervention_type": "Panchakarma",
                "intervention_description": "Deepana-Pachana with Chitrakadi Vati, Snehapana with increasing doses of Mahatiktaka Ghrita, Sarvanga Abhyanga-Swedana, followed by Virechana with Trivrit Avaleha.",
                "dosage": "Classical protocol based on Koshta and Agnibala",
                "route_of_administration": "Oral & External Panchakarma procedure",
                "frequency": "One classical Sodhana cycle (15-21 days)",
                "duration": "12 weeks total observation",
                "formulation_procedure": "Standardized classical in-patient Panchakarma protocol under continuous clinical monitoring.",
                "comparator": "Baseline Comparison (Pre-Post)",
                "comparator_description": "Within-subject baseline response comparator.",
                "target_participants": 50,
                "planned_enrollment_start_date": date(2026, 5, 1),
                "start_date": date(2026, 5, 1),
                "expected_completion_date": date(2026, 12, 15),
                "inclusion_criteria": "1. Diagnosed plaque psoriasis with BSA 3-10%\n2. Age 18-60 years\n3. Fit for Sodhana therapy as per Ayurvedic criteria",
                "exclusion_criteria": "1. Psoriatic erythroderma or generalized pustular psoriasis\n2. Unfit for Sodhana (Garbhini, Bala, Vriddha, Krisha, etc.)\n3. Serious systemic cardiovascular or renal pathology",
                "primary_objective": "Percentage reduction in Psoriasis Area and Severity Index (PASI) score at week 12.",
                "secondary_objectives": "1. Dermatology Life Quality Index (DLQI) change\n2. Serum inflammatory biomarker changes (IL-17, TNF-alpha)",
                "status": "Draft",
                "protocols": [
                    {
                        "version_number": "1.0",
                        "version_date": date(2026, 3, 10),
                        "change_summary": "Initial draft protocol developed by Department of Panchakarma.",
                        "status": "Current"
                    }
                ],
                "milestones": [
                    {"name": "Draft Protocol Review", "planned": date(2026, 3, 15), "actual": date(2026, 3, 12), "status": "Completed"},
                    {"name": "Scientific Advisory Board Presentation", "planned": date(2026, 3, 25), "actual": None, "status": "Planned"},
                    {"name": "Institutional Ethics Committee Submission", "planned": date(2026, 4, 10), "actual": None, "status": "Planned"}
                ],
                "sites": [
                    {
                        "site_code": "AIIA-PK-01",
                        "site_name": "AIIA Department of Panchakarma In-Patient Facility",
                        "institution": "All India Institute of Ayurveda",
                        "location": "Mathura Road, Sarita Vihar",
                        "city": "New Delhi",
                        "state": "Delhi",
                        "country": "India",
                        "site_investigator_id": pi_user.id,
                        "activation_date": None,
                        "site_status": "Pending",
                        "enrollment_target": 50,
                        "current_enrollment": 0
                    }
                ]
            }
        ]

        seeded_trials = 0
        for trial_data in seed_trials_data:
            existing = db.query(ClinicalTrial).filter(ClinicalTrial.trial_id == trial_data["trial_id"]).first()
            if not existing:
                protocols_to_add = trial_data.pop("protocols", [])
                milestones_to_add = trial_data.pop("milestones", [])
                sites_to_add = trial_data.pop("sites", [])

                trial = ClinicalTrial(
                    **trial_data,
                    is_archived=False,
                    created_by=admin_user.id
                )
                db.add(trial)
                db.flush()

                # Add protocols
                for p in protocols_to_add:
                    p_obj = TrialProtocolVersion(
                        trial_id=trial.id,
                        version_number=p["version_number"],
                        version_date=p["version_date"],
                        change_summary=p["change_summary"],
                        status=p["status"],
                        created_by=admin_user.id
                    )
                    db.add(p_obj)

                # Add milestones
                for m in milestones_to_add:
                    m_obj = TrialMilestone(
                        trial_id=trial.id,
                        milestone_name=m["name"],
                        planned_date=m["planned"],
                        actual_date=m.get("actual"),
                        status=m["status"],
                        created_by=admin_user.id
                    )
                    db.add(m_obj)

                # Add sites
                for s in sites_to_add:
                    s_obj = TrialSite(
                        trial_id=trial.id,
                        site_code=s["site_code"],
                        site_name=s["site_name"],
                        institution=s["institution"],
                        location=s["location"],
                        city=s["city"],
                        state=s["state"],
                        country=s["country"],
                        site_investigator_id=s["site_investigator_id"],
                        activation_date=s.get("activation_date"),
                        site_status=s["site_status"],
                        enrollment_target=s["enrollment_target"],
                        current_enrollment=s.get("current_enrollment", 0)
                    )
                    db.add(s_obj)

                db.flush()

                # Audit event for trial creation
                audit_service.record_event(
                    db=db,
                    action="TRIAL_CREATED",
                    entity_type="CLINICAL_TRIAL",
                    entity_id=trial.trial_id,
                    description=f"Seeded synthetic clinical trial '{trial.trial_id}': {trial.trial_title} ({trial.status})",
                    user_id=admin_user.id,
                    metadata={"trial_id": trial.trial_id, "status": trial.status, "seed": True}
                )
                seeded_trials += 1

        db.commit()
        if seeded_trials > 0:
            print(f"Seeded {seeded_trials} realistic Ayurveda clinical trials with protocols, milestones, and sites.")

    # 6. Seed Phases 3 to 7: Participants, Visits, Regulatory, Ethics, Safety
    seed_phase3_to_7_data(db, user_map)

    print("Database initialization & Phase 1-7 verification complete!")


def seed_phase3_to_7_data(db: Session, user_map: dict):
    admin_user = user_map.get("admin")
    pi_user = user_map.get("investigator")
    coordinator_user = user_map.get("coordinator")
    ethics_user = user_map.get("ethics")
    pv_user = user_map.get("pharmacovigilance")

    trial1 = db.query(ClinicalTrial).filter(ClinicalTrial.trial_id == "AIIA-CT-2026-001").first()
    trial2 = db.query(ClinicalTrial).filter(ClinicalTrial.trial_id == "AIIA-CT-2026-002").first()
    trial3 = db.query(ClinicalTrial).filter(ClinicalTrial.trial_id == "AIIA-CT-2026-003").first()

    if not trial1:
        return

    site1 = db.query(TrialSite).filter(TrialSite.trial_id == trial1.id).first()
    site2 = db.query(TrialSite).filter(TrialSite.trial_id == trial1.id, TrialSite.id != site1.id).first() if site1 else None

    # 1. Seed Ethics Submissions
    if db.query(EthicsSubmission).count() == 0:
        sub1 = EthicsSubmission(
            submission_id="IEC-SUB-2026-001",
            trial_id=trial1.id,
            protocol_version="1.0",
            submission_date=date(2026, 1, 5),
            review_date=date(2026, 1, 15),
            decision="Approved",
            approval_number="AIIA/IEC/2026/042",
            approval_date=date(2026, 1, 15),
            expiry_date=date(2027, 1, 14),
            comments="Unanimously approved by Institutional Ethics Committee after review of preclinical safety data and Shallaki standardization certificates.",
            status="Approved",
            submitted_by=pi_user.id if pi_user else None,
            reviewed_by=ethics_user.id if ethics_user else None
        )
        db.add(sub1)

        if trial2:
            sub2 = EthicsSubmission(
                submission_id="IEC-SUB-2025-014",
                trial_id=trial2.id,
                protocol_version="2.0",
                submission_date=date(2025, 11, 10),
                review_date=date(2025, 11, 20),
                decision="Approved",
                approval_number="AIIA/IEC/2025/118",
                approval_date=date(2025, 11, 20),
                expiry_date=date(2026, 11, 19),
                comments="Ethics clearance renewed for multicenter Phase III trial.",
                status="Approved",
                submitted_by=pi_user.id if pi_user else None,
                reviewed_by=ethics_user.id if ethics_user else None
            )
            db.add(sub2)

        if trial3:
            sub3 = EthicsSubmission(
                submission_id="IEC-SUB-2026-009",
                trial_id=trial3.id,
                protocol_version="1.0",
                submission_date=date(2026, 3, 1),
                review_date=None,
                decision=None,
                approval_number=None,
                approval_date=None,
                expiry_date=None,
                comments="Initial submission pending expedited IEC quorum review.",
                status="Under Review",
                submitted_by=pi_user.id if pi_user else None,
                reviewed_by=None
            )
            db.add(sub3)

        db.flush()

    # 2. Seed CTRI Registrations
    if db.query(CTRIRegistration).count() == 0:
        ctri1 = CTRIRegistration(
            trial_id=trial1.id,
            ctri_number="CTRI/2026/01/061234",
            status="Registered",
            submission_date=date(2026, 1, 10),
            registration_date=date(2026, 1, 22),
            last_update_date=date(2026, 2, 1),
            next_update_deadline=date(2026, 7, 22),
            notes="Formal trial registration granted on clinical trials registry of India.",
            responsible_person="Dr. Rajesh Sharma"
        )
        db.add(ctri1)

        if trial2:
            ctri2 = CTRIRegistration(
                trial_id=trial2.id,
                ctri_number="CTRI/2025/12/058912",
                status="Registered",
                submission_date=date(2025, 11, 25),
                registration_date=date(2025, 12, 10),
                last_update_date=date(2026, 1, 15),
                next_update_deadline=date(2026, 6, 10),
                notes="Active CTRI record with regular interim recruitments logged.",
                responsible_person="Dr. Rajesh Sharma"
            )
            db.add(ctri2)

        if trial3:
            ctri3 = CTRIRegistration(
                trial_id=trial3.id,
                ctri_number="CTRI/2026/03/067890",
                status="Submitted",
                submission_date=date(2026, 3, 5),
                registration_date=None,
                last_update_date=date(2026, 3, 5),
                next_update_deadline=date(2026, 4, 5),
                notes="CTRI submission acknowledged, awaiting query letter.",
                responsible_person="Dr. Rajesh Sharma"
            )
            db.add(ctri3)

        db.flush()

    # 3. Seed Regulatory Events
    if db.query(RegulatoryEvent).count() == 0:
        reg_events = [
            RegulatoryEvent(
                trial_id=trial1.id,
                event_type="Ethics Annual Review",
                submission_date=None,
                due_date=date(2026, 12, 15),
                completion_date=None,
                status="Pending",
                responsible_person="Priya Verma",
                notes="Submit annual continuing review packet to AIIA IEC 30 days before expiry."
            ),
            RegulatoryEvent(
                trial_id=trial1.id,
                event_type="Quarterly Safety Update Report (DSUR)",
                submission_date=date(2026, 3, 1),
                due_date=date(2026, 3, 15),
                completion_date=date(2026, 3, 2),
                status="Completed",
                responsible_person="Dr. Sunita Rao",
                notes="Q1 DSUR submitted to Ayush GCP cell."
            ),
            RegulatoryEvent(
                trial_id=trial1.id,
                event_type="Trial Protocol Amendment v1.1 Filing",
                submission_date=date(2026, 3, 10),
                due_date=date(2026, 3, 25),
                completion_date=None,
                status="Under Review",
                responsible_person="Dr. Rajesh Sharma",
                notes="Filing regarding additional non-invasive ultrasound cartilage imaging biomarker."
            )
        ]
        for rev in reg_events:
            db.add(rev)
        db.flush()

    # 4. Seed Synthetic Participants & Clinical Visits
    if db.query(Participant).count() == 0 and site1:
        participants_data = [
            {
                "participant_id": "AIIA-CT001-P001",
                "screening_number": "SCR-2026-001",
                "site_id": site1.id,
                "age": 52,
                "age_group": "45-64",
                "sex": "Female",
                "screening_date": date(2026, 1, 25),
                "eligibility_status": "Eligible",
                "enrollment_date": date(2026, 1, 28),
                "randomization_date": date(2026, 1, 28),
                "randomization_number": "RND-001-A",
                "treatment_group": "Group A",
                "participant_status": "Active",
                "visits": [
                    ("Screening Visit", 1, date(2026, 1, 25), date(2026, 1, 25), "Completed"),
                    ("Baseline Visit", 2, date(2026, 1, 28), date(2026, 1, 28), "Completed"),
                    ("Week 2 Evaluation", 3, date(2026, 2, 11), date(2026, 2, 11), "Completed"),
                    ("Week 4 Evaluation", 4, date(2026, 2, 25), date(2026, 2, 25), "Completed"),
                    ("Week 8 Evaluation", 5, date(2026, 3, 25), None, "Scheduled")
                ]
            },
            {
                "participant_id": "AIIA-CT001-P002",
                "screening_number": "SCR-2026-002",
                "site_id": site1.id,
                "age": 64,
                "age_group": "45-64",
                "sex": "Male",
                "screening_date": date(2026, 1, 26),
                "eligibility_status": "Eligible",
                "enrollment_date": date(2026, 1, 29),
                "randomization_date": date(2026, 1, 29),
                "randomization_number": "RND-002-B",
                "treatment_group": "Group B",
                "participant_status": "Active",
                "visits": [
                    ("Screening Visit", 1, date(2026, 1, 26), date(2026, 1, 26), "Completed"),
                    ("Baseline Visit", 2, date(2026, 1, 29), date(2026, 1, 29), "Completed"),
                    ("Week 2 Evaluation", 3, date(2026, 2, 12), date(2026, 2, 12), "Completed"),
                    ("Week 4 Evaluation", 4, date(2026, 2, 26), None, "Overdue"),
                    ("Week 8 Evaluation", 5, date(2026, 3, 26), None, "Scheduled")
                ]
            },
            {
                "participant_id": "AIIA-CT001-P003",
                "screening_number": "SCR-2026-003",
                "site_id": site1.id,
                "age": 48,
                "age_group": "45-64",
                "sex": "Female",
                "screening_date": date(2026, 1, 27),
                "eligibility_status": "Eligible",
                "enrollment_date": date(2026, 1, 30),
                "randomization_date": date(2026, 1, 30),
                "randomization_number": "RND-003-A",
                "treatment_group": "Group A",
                "participant_status": "Completed",
                "completion_date": date(2026, 3, 10),
                "visits": [
                    ("Screening Visit", 1, date(2026, 1, 27), date(2026, 1, 27), "Completed"),
                    ("Baseline Visit", 2, date(2026, 1, 30), date(2026, 1, 30), "Completed"),
                    ("Week 2 Evaluation", 3, date(2026, 2, 13), date(2026, 2, 13), "Completed"),
                    ("Week 4 Evaluation", 4, date(2026, 2, 27), date(2026, 2, 27), "Completed"),
                    ("Week 8 Evaluation", 5, date(2026, 3, 10), date(2026, 3, 10), "Completed")
                ]
            },
            {
                "participant_id": "AIIA-CT001-P004",
                "screening_number": "SCR-2026-004",
                "site_id": site1.id,
                "age": 71,
                "age_group": "65+",
                "sex": "Male",
                "screening_date": date(2026, 2, 1),
                "eligibility_status": "Eligible",
                "enrollment_date": date(2026, 2, 3),
                "randomization_date": date(2026, 2, 3),
                "randomization_number": "RND-004-B",
                "treatment_group": "Group B",
                "participant_status": "Withdrawn",
                "withdrawal_date": date(2026, 2, 18),
                "withdrawal_reason": "Relocated out of state; unable to attend physical clinic visits.",
                "visits": [
                    ("Screening Visit", 1, date(2026, 2, 1), date(2026, 2, 1), "Completed"),
                    ("Baseline Visit", 2, date(2026, 2, 3), date(2026, 2, 3), "Completed"),
                    ("Week 2 Evaluation", 3, date(2026, 2, 17), None, "Missed")
                ]
            },
            {
                "participant_id": "AIIA-CT001-P005",
                "screening_number": "SCR-2026-005",
                "site_id": site1.id,
                "age": 39,
                "age_group": "18-44",
                "sex": "Female",
                "screening_date": date(2026, 2, 5),
                "eligibility_status": "Ineligible",
                "enrollment_date": None,
                "randomization_date": None,
                "treatment_group": None,
                "participant_status": "Ineligible",
                "notes": "Kellgren-Lawrence Grade 1 (Protocol requires Grade 2 or 3).",
                "visits": [
                    ("Screening Visit", 1, date(2026, 2, 5), date(2026, 2, 5), "Completed")
                ]
            },
            {
                "participant_id": "AIIA-CT001-P006",
                "screening_number": "SCR-2026-006",
                "site_id": site1.id,
                "age": 58,
                "age_group": "45-64",
                "sex": "Male",
                "screening_date": date(2026, 2, 8),
                "eligibility_status": "Eligible",
                "enrollment_date": date(2026, 2, 10),
                "randomization_date": None,
                "treatment_group": None,
                "participant_status": "Enrolled",
                "visits": [
                    ("Screening Visit", 1, date(2026, 2, 8), date(2026, 2, 8), "Completed"),
                    ("Baseline Visit", 2, date(2026, 2, 15), None, "Scheduled")
                ]
            },
            {
                "participant_id": "AIIA-CT001-P007",
                "screening_number": "SCR-2026-007",
                "site_id": site1.id,
                "age": 44,
                "age_group": "18-44",
                "sex": "Female",
                "screening_date": date(2026, 2, 12),
                "eligibility_status": "Pending",
                "enrollment_date": None,
                "randomization_date": None,
                "treatment_group": None,
                "participant_status": "Screened",
                "visits": [
                    ("Screening Visit", 1, date(2026, 2, 12), date(2026, 2, 12), "Completed")
                ]
            }
        ]

        if site2:
            participants_data.extend([
                {
                    "participant_id": "AIIA-CT001-P008",
                    "screening_number": "SCR-2026-008",
                    "site_id": site2.id,
                    "age": 61,
                    "age_group": "45-64",
                    "sex": "Male",
                    "screening_date": date(2026, 2, 1),
                    "eligibility_status": "Eligible",
                    "enrollment_date": date(2026, 2, 4),
                    "randomization_date": date(2026, 2, 4),
                    "randomization_number": "RND-005-A",
                    "treatment_group": "Group A",
                    "participant_status": "Active",
                    "visits": [
                        ("Screening Visit", 1, date(2026, 2, 1), date(2026, 2, 1), "Completed"),
                        ("Baseline Visit", 2, date(2026, 2, 4), date(2026, 2, 4), "Completed"),
                        ("Week 2 Evaluation", 3, date(2026, 2, 18), date(2026, 2, 18), "Completed"),
                        ("Week 4 Evaluation", 4, date(2026, 3, 4), date(2026, 3, 4), "Completed")
                    ]
                },
                {
                    "participant_id": "AIIA-CT001-P009",
                    "screening_number": "SCR-2026-009",
                    "site_id": site2.id,
                    "age": 55,
                    "age_group": "45-64",
                    "sex": "Female",
                    "screening_date": date(2026, 2, 3),
                    "eligibility_status": "Eligible",
                    "enrollment_date": date(2026, 2, 6),
                    "randomization_date": date(2026, 2, 6),
                    "randomization_number": "RND-006-B",
                    "treatment_group": "Group B",
                    "participant_status": "Active",
                    "visits": [
                        ("Screening Visit", 1, date(2026, 2, 3), date(2026, 2, 3), "Completed"),
                        ("Baseline Visit", 2, date(2026, 2, 6), date(2026, 2, 6), "Completed"),
                        ("Week 2 Evaluation", 3, date(2026, 2, 20), None, "Completed")
                    ]
                }
            ])

        for p_info in participants_data:
            visits = p_info.pop("visits", [])
            p_status = p_info.pop("participant_status", "Screened")
            part = Participant(
                trial_id=trial1.id,
                status=p_status,
                created_by=coordinator_user.id if coordinator_user else admin_user.id,
                **p_info
            )
            db.add(part)
            db.flush()

            for v_title, v_num, p_date, a_date, v_stat in visits:
                vis = ParticipantVisit(
                    participant_id=part.id,
                    trial_id=trial1.id,
                    site_id=part.site_id,
                    visit_name=v_title,
                    visit_number=v_num,
                    planned_date=p_date,
                    actual_date=a_date,
                    status=v_stat,
                    completed_by=coordinator_user.id if a_date and coordinator_user else None
                )
                db.add(vis)
        db.flush()

        # Update site enrollment counts
        enrolled_site1 = db.query(Participant).filter(
            Participant.site_id == site1.id,
            Participant.status.in_(["Enrolled", "Randomized", "Active", "Completed", "Withdrawn"])
        ).count()
        site1.current_enrollment = enrolled_site1

        if site2:
            enrolled_site2 = db.query(Participant).filter(
                Participant.site_id == site2.id,
                Participant.status.in_(["Enrolled", "Randomized", "Active", "Completed", "Withdrawn"])
            ).count()
            site2.current_enrollment = enrolled_site2

        db.flush()

    # 5. Seed Adverse Events & SAEs (Phase 5)
    if db.query(AdverseEvent).count() == 0 and site1:
        p1 = db.query(Participant).filter(Participant.participant_id == "AIIA-CT001-P001").first()
        p2 = db.query(Participant).filter(Participant.participant_id == "AIIA-CT001-P002").first()

        if p1 and p2:
            ae1 = AdverseEvent(
                ae_id="AE-2026-001",
                trial_id=trial1.id,
                site_id=site1.id,
                participant_id=p1.id,
                event_description="Mild epigastric discomfort 45 minutes following post-prandial administration of Shallaki capsule.",
                event_term="Epigastric discomfort / Dyspepsia",
                start_date=date(2026, 2, 5),
                end_date=date(2026, 2, 8),
                severity="Mild",
                is_serious=False,
                is_adr=True,
                suspected_intervention="Shallaki (Boswellia serrata) capsule",
                causality="Possible",
                action_taken="Dose reduced",
                outcome="Recovered",
                reporter_id=coordinator_user.id if coordinator_user else admin_user.id,
                reviewed_by=pv_user.id if pv_user else None,
                status="Closed",
                investigator_assessment="Resolved spontaneously after taking medicine strictly with warm water and meals."
            )
            db.add(ae1)

            ae2 = AdverseEvent(
                ae_id="SAE-2026-001",
                trial_id=trial1.id,
                site_id=site1.id,
                participant_id=p2.id,
                event_description="Acute urticarial rash on forearms and mild facial edema following 14 days of investigational compound.",
                event_term="Generalized Urticaria / Allergic Exanthem",
                start_date=date(2026, 2, 14),
                end_date=date(2026, 2, 16),
                severity="Severe",
                is_serious=True,
                seriousness_criteria=["Hospitalization"],
                is_adr=True,
                suspected_intervention="Shallaki (Boswellia serrata) capsule",
                causality="Probable",
                action_taken="Intervention stopped",
                outcome="Recovered",
                reporter_id=coordinator_user.id if coordinator_user else admin_user.id,
                reviewed_by=pv_user.id if pv_user else None,
                status="Under Review",
                investigator_assessment="Subject admitted overnight for observation and parenteral antihistamines; fully resolved without sequelae."
            )
            db.add(ae2)
            db.flush()

    db.commit()
    print("Phase 3-7 Synthetic data seeded: Participants, Clinical Visits, Ethics, CTRI, Regulatory Deadlines, and Safety/SAEs.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
