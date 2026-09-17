export type RoleName =
  | 'ADMIN'
  | 'PRINCIPAL_INVESTIGATOR'
  | 'STUDY_COORDINATOR'
  | 'CLINICAL_TRIAL_MONITOR'
  | 'ETHICS_COMMITTEE'
  | 'PHARMACOVIGILANCE_OFFICER'
  | 'REGULATOR';

export type TrialStatus =
  | 'Draft'
  | 'Ethics Review'
  | 'Ethics Approved'
  | 'CTRI Pending'
  | 'Recruiting'
  | 'Active'
  | 'Suspended'
  | 'Completed'
  | 'Terminated'
  | 'Closed';

export type SiteStatus =
  | 'Pending'
  | 'Ethics Pending'
  | 'Activated'
  | 'Recruiting'
  | 'Suspended'
  | 'Closed';

export type MilestoneStatus =
  | 'Planned'
  | 'In Progress'
  | 'Completed'
  | 'Delayed'
  | 'Cancelled';

export interface Permission {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Role {
  id: number;
  name: RoleName;
  description?: string;
  created_at: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  role?: Role;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description: string;
  timestamp: string;
  metadata?: Record<string, any> | null;
  metadata_json?: Record<string, any> | null;
  user?: User | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  permissions: string[];
}

export interface UserProfileResponse {
  user: User;
  role_name: RoleName;
  permissions: string[];
}

// ==========================================
// Phase 2: Clinical Trial Management Types
// ==========================================

export interface TrialProtocolVersion {
  id: number;
  trial_id: number;
  version_number: string;
  version_date: string;
  change_summary: string;
  document_reference?: string | null;
  status: 'Current' | 'Superseded' | 'Draft';
  created_by?: number | null;
  created_at: string;
}

export interface TrialMilestone {
  id: number;
  trial_id: number;
  milestone_name: string;
  description?: string | null;
  planned_date: string;
  actual_date?: string | null;
  status: MilestoneStatus;
  created_by?: number | null;
  created_at: string;
}

export interface TrialSite {
  id: number;
  trial_id: number;
  site_code: string;
  site_name: string;
  institution: string;
  location: string;
  city: string;
  state: string;
  country: string;
  site_investigator_id?: number | null;
  site_investigator?: User | null;
  activation_date?: string | null;
  site_status: SiteStatus;
  enrollment_target: number;
  current_enrollment: number;
  created_at: string;
  updated_at: string;
}

export interface ClinicalTrialListItem {
  id: number;
  trial_id: string;
  trial_title: string;
  short_title?: string | null;
  protocol_number: string;
  protocol_version: string;
  study_type: string;
  study_phase: string;
  study_design: string;
  sponsor: string;
  principal_investigator_id: number;
  principal_investigator?: User | null;
  disease_condition: string;
  ayurveda_intervention: string;
  target_participants: number;
  status: TrialStatus;
  start_date: string;
  expected_completion_date: string;
  site_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClinicalTrial {
  id: number;
  trial_id: string;
  trial_title: string;
  short_title?: string | null;
  protocol_number: string;
  protocol_version: string;
  protocol_version_date: string;
  study_type: string;
  study_phase: string;
  study_design: string;
  sponsor: string;
  sponsor_type: string;
  sponsor_contact?: string | null;
  principal_investigator_id: number;
  principal_investigator?: User | null;
  disease_condition: string;
  ayurveda_intervention: string;
  intervention_type: string;
  intervention_description: string;
  dosage?: string | null;
  route_of_administration?: string | null;
  frequency?: string | null;
  duration?: string | null;
  formulation_procedure?: string | null;
  comparator?: string | null;
  comparator_description?: string | null;
  target_participants: number;
  planned_enrollment_start_date?: string | null;
  start_date: string;
  expected_completion_date: string;
  actual_completion_date?: string | null;
  inclusion_criteria: string;
  exclusion_criteria: string;
  primary_objective: string;
  secondary_objectives?: string | null;
  status: TrialStatus;
  is_archived: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  protocol_versions: TrialProtocolVersion[];
  milestones: TrialMilestone[];
  sites: TrialSite[];
}

export interface ClinicalTrialSummaryStats {
  total_trials: number;
  draft_trials: number;
  recruiting_trials: number;
  active_trials: number;
  completed_trials: number;
  suspended_trials: number;
}

export interface CreateTrialPayload {
  trial_id: string;
  trial_title: string;
  short_title?: string;
  protocol_number: string;
  protocol_version: string;
  protocol_version_date: string;
  study_type: string;
  study_phase: string;
  study_design: string;
  sponsor: string;
  sponsor_type: string;
  sponsor_contact?: string;
  principal_investigator_id: number;
  disease_condition: string;
  ayurveda_intervention: string;
  intervention_type: string;
  intervention_description: string;
  dosage?: string;
  route_of_administration?: string;
  frequency?: string;
  duration?: string;
  formulation_procedure?: string;
  comparator?: string;
  comparator_description?: string;
  target_participants: number;
  planned_enrollment_start_date?: string;
  start_date: string;
  expected_completion_date: string;
  inclusion_criteria: string;
  exclusion_criteria: string;
  primary_objective: string;
  secondary_objectives?: string;
}

export interface UpdateTrialPayload extends Partial<CreateTrialPayload> {
  actual_completion_date?: string;
}

// ==========================================
// Phase 3: Participant Lifecycle Types
// ==========================================

export type ParticipantStatus =
  | 'Screened'
  | 'Eligible'
  | 'Ineligible'
  | 'Enrolled'
  | 'Randomized'
  | 'Active'
  | 'Withdrawn'
  | 'Completed'
  | 'Lost to Follow-up';

export type EligibilityStatus = 'Pending' | 'Eligible' | 'Ineligible';

export type VisitStatus = 'Scheduled' | 'Completed' | 'Missed' | 'Overdue' | 'Cancelled';

export interface ParticipantListItem {
  id: number;
  participant_id: string;
  trial_id: number;
  site_id: number;
  screening_number: string;
  age: number;
  age_group: string;
  sex: string;
  screening_date: string;
  eligibility_status: EligibilityStatus;
  enrollment_date?: string | null;
  randomization_date?: string | null;
  randomization_number?: string | null;
  treatment_group?: string | null;
  status: ParticipantStatus;
  participant_status?: ParticipantStatus;
  withdrawal_date?: string | null;
  completion_date?: string | null;
  created_at: string;
  updated_at: string;
  site_name?: string | null;
  site_code?: string | null;
  trial_id_str?: string | null;
}

export interface ParticipantDetail extends ParticipantListItem {
  eligibility_details?: Record<string, any> | null;
  withdrawal_reason?: string | null;
  notes?: string | null;
  site?: TrialSite | null;
}

export interface ParticipantSummaryStats {
  total_screened: number;
  eligible: number;
  ineligible: number;
  enrolled: number;
  randomized: number;
  active: number;
  completed: number;
  withdrawn: number;
  lost_to_followup: number;
}

export interface ParticipantVisit {
  id: number;
  trial_id: number;
  site_id: number;
  participant_id: number;
  visit_name: string;
  visit_number: number;
  planned_date: string;
  actual_date?: string | null;
  status: VisitStatus;
  visit_status?: VisitStatus;
  notes?: string | null;
  completed_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ScreeningPayload {
  trial_id: number;
  site_id: number;
  age: number;
  sex: string;
  screening_date?: string;
  inclusion_criteria_eval?: Record<string, any>;
  exclusion_criteria_eval?: Record<string, any>;
  notes?: string;
}

export interface EligibilityEvaluationPayload {
  eligibility_status: EligibilityStatus;
  inclusion_answers?: Record<string, any>;
  exclusion_answers?: Record<string, any>;
  notes?: string;
}

export interface EnrollPayload {
  enrollment_date?: string;
  notes?: string;
}

export interface RandomizePayload {
  treatment_group?: string;
  randomization_date?: string;
}

export interface WithdrawPayload {
  withdrawal_date?: string;
  withdrawal_reason: string;
}

export interface CompletePayload {
  completion_date?: string;
  notes?: string;
}

// ==========================================
// Phase 4: Ethics & Regulatory Management Types
// ==========================================

export type EthicsStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Changes Required'
  | 'Approved'
  | 'Rejected'
  | 'Expired'
  | 'Renewal Required';

export type CTRIStatus =
  | 'Not Submitted'
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Registered'
  | 'Update Required'
  | 'Suspended'
  | 'Closed';

export type RegulatoryDeadlineStatus = 'Upcoming' | 'Due Soon' | 'Overdue' | 'Completed';

export interface EthicsSubmission {
  id: number;
  submission_id?: string | null;
  trial_id: number;
  protocol_version: string;
  submission_date: string;
  review_date?: string | null;
  status: EthicsStatus;
  decision?: string | null;
  approval_number?: string | null;
  approval_date?: string | null;
  expiry_date?: string | null;
  comments?: string | null;
  document_metadata?: Record<string, any> | null;
  submitted_by?: number | null;
  reviewed_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EthicsSubmissionCreatePayload {
  trial_id: number;
  protocol_version: string;
  submission_date?: string;
  comments?: string;
  document_metadata?: Record<string, any>;
}

export interface EthicsDecisionPayload {
  decision: string;
  review_date?: string;
  approval_number?: string;
  approval_date?: string;
  expiry_date?: string;
  comments?: string;
}

export interface CTRIRegistration {
  id: number;
  trial_id: number;
  ctri_number?: string | null;
  status: CTRIStatus;
  submission_date?: string | null;
  registration_date?: string | null;
  last_update_date?: string | null;
  next_update_deadline?: string | null;
  notes?: string | null;
  responsible_person?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegulatoryEvent {
  id: number;
  trial_id: number;
  event_type: string;
  submission_date?: string | null;
  due_date: string;
  completion_date?: string | null;
  status: string;
  responsible_person?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Phase 5: Adverse Events & Pharmacovigilance
// ==========================================

export type AESeverity = 'Mild' | 'Moderate' | 'Severe';
export type AECausality = 'Not Related' | 'Unlikely' | 'Possible' | 'Probable' | 'Very Likely';
export type AEActionTaken = 'No change' | 'Dose reduced' | 'Dose interrupted' | 'Intervention stopped' | 'Additional treatment' | 'Hospitalization' | 'Other';
export type AEOutcome = 'Recovered' | 'Recovering' | 'Not recovered' | 'Recovered with sequelae' | 'Fatal' | 'Unknown';
export type AEStatus = 'Draft' | 'Reported' | 'Under Review' | 'Confirmed' | 'Closed';

export interface AdverseEvent {
  id: number;
  ae_id: string;
  trial_id: number;
  site_id: number;
  participant_id: number;
  event_term: string;
  event_description: string;
  start_date: string;
  end_date?: string | null;
  severity: AESeverity;
  is_serious: boolean;
  seriousness_criteria?: string[] | null;
  is_adr: boolean;
  suspected_intervention?: string | null;
  causality: AECausality;
  action_taken: AEActionTaken;
  outcome: AEOutcome;
  investigator_assessment?: string | null;
  status: AEStatus;
  reporter_id?: number | null;
  reviewed_by?: number | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  participant_id_str?: string | null;
  trial_id_str?: string | null;
  site_name?: string | null;
}

export interface AdverseEventCreatePayload {
  trial_id: number;
  site_id: number;
  participant_id: number;
  event_term: string;
  event_description: string;
  start_date: string;
  end_date?: string;
  severity: AESeverity;
  is_serious?: boolean;
  seriousness_criteria?: string[];
  is_adr?: boolean;
  suspected_intervention?: string;
  causality?: AECausality;
  action_taken?: AEActionTaken;
  outcome?: AEOutcome;
  investigator_assessment?: string;
}

export interface AdverseEventReviewPayload {
  status: AEStatus;
  causality?: AECausality;
  outcome?: AEOutcome;
  investigator_assessment?: string;
}

export interface SafetySummaryStats {
  total_ae: number;
  total_sae: number;
  total_adr: number;
  open_events: number;
  events_under_review: number;
  resolved_events: number;
}

// ==========================================
// Phase 6: Real-Time Dashboard & KPI Types
// ==========================================

export interface SiteEnrollmentMetric {
  site_id: number;
  site_code: string;
  site_name: string;
  trial_id_str: string;
  current_enrollment: number;
  enrollment_target: number;
  enrollment_percentage: number;
  site_status: string;
}

export interface TrialEnrollmentMetric {
  trial_id: number;
  trial_id_str: string;
  trial_title: string;
  current_enrolled: number;
  target_participants: number;
  enrollment_percentage: number;
  status: string;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
}

export interface SafetyTrendItem {
  month: string;
  ae_count: number;
  sae_count: number;
}

export interface MilestoneItem {
  id: number;
  trial_id_str: string;
  milestone_name: string;
  planned_date: string;
  actual_date?: string | null;
  status: string;
  deadline_status: string;
}

export interface DashboardAlertItem {
  id: string;
  category: 'RECRUITMENT' | 'VISIT' | 'ETHICS' | 'CTRI' | 'SAFETY' | 'REGULATORY';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  action_url?: string | null;
}

export interface DashboardMetricsResponse {
  trial_stats: ClinicalTrialSummaryStats;
  participant_stats: ParticipantSummaryStats;
  safety_stats: SafetySummaryStats;
  total_sites: number;
  activated_sites: number;
  recruiting_sites: number;
  suspended_sites: number;
  overdue_visits_count: number;
  upcoming_ethics_expiry_count: number;
  regulatory_deadlines_count: number;
  trial_enrollment_progress: TrialEnrollmentMetric[];
  site_enrollment_breakdown: SiteEnrollmentMetric[];
  participant_status_distribution: StatusDistributionItem[];
  trial_status_distribution: StatusDistributionItem[];
  safety_trend: SafetyTrendItem[];
  milestones: MilestoneItem[];
}
