import api from './api';
import type {
  ParticipantListItem,
  ParticipantDetail,
  ParticipantSummaryStats,
  ParticipantVisit,
  ScreeningPayload,
  EligibilityEvaluationPayload,
  EnrollPayload,
  RandomizePayload,
  WithdrawPayload,
  CompletePayload,
  AuditLog
} from '../types';

export interface ParticipantFilterParams {
  skip?: number;
  limit?: number;
  trial_id?: number;
  site_id?: number;
  status?: string;
  eligibility_status?: string;
  treatment_group?: string;
  search?: string;
}

export const participantService = {
  async getSummary(trial_id?: number): Promise<ParticipantSummaryStats> {
    const res = await api.get<ParticipantSummaryStats>('/participants/summary', {
      params: trial_id ? { trial_id } : {}
    });
    return res.data;
  },

  async listParticipants(params: ParticipantFilterParams = {}): Promise<ParticipantListItem[]> {
    const res = await api.get<ParticipantListItem[]>('/participants', { params });
    return res.data;
  },

  async getParticipant(participantId: number): Promise<ParticipantDetail> {
    const res = await api.get<ParticipantDetail>(`/participants/${participantId}`);
    return res.data;
  },

  async screenParticipant(payload: ScreeningPayload): Promise<ParticipantDetail> {
    const res = await api.post<ParticipantDetail>('/participants/screen', payload);
    return res.data;
  },

  async evaluateEligibility(
    participantId: number,
    payload: EligibilityEvaluationPayload
  ): Promise<ParticipantDetail> {
    const res = await api.post<ParticipantDetail>(`/participants/${participantId}/evaluate`, payload);
    return res.data;
  },

  async enrollParticipant(participantId: number, payload: EnrollPayload = {}): Promise<ParticipantDetail> {
    const res = await api.post<ParticipantDetail>(`/participants/${participantId}/enroll`, payload);
    return res.data;
  },

  async randomizeParticipant(participantId: number, payload: RandomizePayload = {}): Promise<ParticipantDetail> {
    const res = await api.post<ParticipantDetail>(`/participants/${participantId}/randomize`, payload);
    return res.data;
  },

  async withdrawParticipant(participantId: number, payload: WithdrawPayload): Promise<ParticipantDetail> {
    const res = await api.post<ParticipantDetail>(`/participants/${participantId}/withdraw`, payload);
    return res.data;
  },

  async completeParticipant(participantId: number, payload: CompletePayload = {}): Promise<ParticipantDetail> {
    const res = await api.post<ParticipantDetail>(`/participants/${participantId}/complete`, payload);
    return res.data;
  },

  async getVisits(participantId: number): Promise<ParticipantVisit[]> {
    const res = await api.get<ParticipantVisit[]>(`/participants/${participantId}/visits`);
    return res.data;
  },

  async completeVisit(
    visitId: number,
    payload: { actual_date?: string; notes?: string; status?: string }
  ): Promise<ParticipantVisit> {
    const res = await api.post<ParticipantVisit>(`/visits/${visitId}/complete`, payload);
    return res.data;
  },

  async getParticipantAuditLogs(participantIdStr: string): Promise<AuditLog[]> {
    const res = await api.get<AuditLog[]>('/audit-logs', {
      params: { entity_type: 'PARTICIPANT', entity_id: participantIdStr }
    });
    return res.data;
  }
};
