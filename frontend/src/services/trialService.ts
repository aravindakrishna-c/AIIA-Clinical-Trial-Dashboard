import api from './api';
import type {
  ClinicalTrial,
  ClinicalTrialListItem,
  ClinicalTrialSummaryStats,
  CreateTrialPayload,
  UpdateTrialPayload,
  TrialStatus,
  SiteStatus,
  MilestoneStatus,
  TrialProtocolVersion,
  TrialMilestone,
  TrialSite,
  AuditLog
} from '../types';

export interface TrialFilterParams {
  skip?: number;
  limit?: number;
  search?: string;
  status?: string;
  study_type?: string;
  study_phase?: string;
  sponsor?: string;
  pi_id?: number;
}

export const trialService = {
  // Summary metrics
  async getSummary(): Promise<ClinicalTrialSummaryStats> {
    const res = await api.get<ClinicalTrialSummaryStats>('/trials/summary');
    return res.data;
  },

  // Trial list with filters
  async getTrials(params: TrialFilterParams = {}): Promise<ClinicalTrialListItem[]> {
    const res = await api.get<ClinicalTrialListItem[]>('/trials', { params });
    return res.data;
  },

  // Trial details
  async getTrial(trialIdOrCode: string): Promise<ClinicalTrial> {
    const res = await api.get<ClinicalTrial>(`/trials/${trialIdOrCode}`);
    return res.data;
  },

  // Create trial
  async createTrial(payload: CreateTrialPayload): Promise<ClinicalTrial> {
    const res = await api.post<ClinicalTrial>('/trials', payload);
    return res.data;
  },

  // Update trial
  async updateTrial(trialIdOrCode: string, payload: UpdateTrialPayload): Promise<ClinicalTrial> {
    const res = await api.put<ClinicalTrial>(`/trials/${trialIdOrCode}`, payload);
    return res.data;
  },

  // Status transition
  async updateTrialStatus(trialIdOrCode: string, status: TrialStatus, notes?: string): Promise<ClinicalTrial> {
    const res = await api.patch<ClinicalTrial>(`/trials/${trialIdOrCode}/status`, {
      status,
      notes
    });
    return res.data;
  },

  // Protocol versions
  async getProtocols(trialIdOrCode: string): Promise<TrialProtocolVersion[]> {
    const res = await api.get<TrialProtocolVersion[]>(`/trials/${trialIdOrCode}/protocols`);
    return res.data;
  },

  async createProtocolVersion(
    trialIdOrCode: string,
    payload: {
      version_number: string;
      version_date: string;
      change_summary: string;
      document_reference?: string;
    }
  ): Promise<TrialProtocolVersion> {
    const res = await api.post<TrialProtocolVersion>(`/trials/${trialIdOrCode}/protocols`, payload);
    return res.data;
  },

  // Milestones
  async getMilestones(trialIdOrCode: string): Promise<TrialMilestone[]> {
    const res = await api.get<TrialMilestone[]>(`/trials/${trialIdOrCode}/milestones`);
    return res.data;
  },

  async createMilestone(
    trialIdOrCode: string,
    payload: {
      milestone_name: string;
      description?: string;
      planned_date: string;
      actual_date?: string;
      status: MilestoneStatus;
    }
  ): Promise<TrialMilestone> {
    const res = await api.post<TrialMilestone>(`/trials/${trialIdOrCode}/milestones`, payload);
    return res.data;
  },

  async updateMilestone(
    milestoneId: number,
    payload: {
      milestone_name?: string;
      description?: string;
      planned_date?: string;
      actual_date?: string;
      status?: MilestoneStatus;
    }
  ): Promise<TrialMilestone> {
    const res = await api.put<TrialMilestone>(`/milestones/${milestoneId}`, payload);
    return res.data;
  },

  // Sites
  async getSites(trialIdOrCode: string): Promise<TrialSite[]> {
    const res = await api.get<TrialSite[]>(`/trials/${trialIdOrCode}/sites`);
    return res.data;
  },

  async createSite(
    trialIdOrCode: string,
    payload: {
      site_code: string;
      site_name: string;
      institution: string;
      location: string;
      city: string;
      state: string;
      country?: string;
      site_investigator_id?: number;
      activation_date?: string;
      site_status?: SiteStatus;
      enrollment_target: number;
    }
  ): Promise<TrialSite> {
    const res = await api.post<TrialSite>(`/trials/${trialIdOrCode}/sites`, payload);
    return res.data;
  },

  async updateSite(
    siteId: number,
    payload: {
      site_name?: string;
      institution?: string;
      location?: string;
      city?: string;
      state?: string;
      country?: string;
      site_investigator_id?: number;
      activation_date?: string;
      enrollment_target?: number;
    }
  ): Promise<TrialSite> {
    const res = await api.put<TrialSite>(`/sites/${siteId}`, payload);
    return res.data;
  },

  async updateSiteStatus(
    siteId: number,
    siteStatus: SiteStatus,
    notes?: string
  ): Promise<TrialSite> {
    const res = await api.patch<TrialSite>(`/sites/${siteId}/status`, {
      site_status: siteStatus,
      notes
    });
    return res.data;
  },

  // Trial-specific audit logs
  async getTrialAuditTrail(trialIdOrCode: string): Promise<AuditLog[]> {
    const res = await api.get<AuditLog[]>(`/trials/${trialIdOrCode}/audit-trail`);
    return res.data;
  }
};
