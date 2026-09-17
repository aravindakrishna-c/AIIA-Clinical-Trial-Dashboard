import api from './api';
import type {
  EthicsSubmission,
  EthicsSubmissionCreatePayload,
  EthicsDecisionPayload,
  CTRIRegistration,
  RegulatoryEvent
} from '../types';

export const regulatoryService = {
  // Ethics Submissions
  async getEthicsSubmissions(trial_id?: number): Promise<EthicsSubmission[]> {
    const res = await api.get<EthicsSubmission[]>('/ethics', {
      params: trial_id ? { trial_id } : {}
    });
    return res.data;
  },

  async createEthicsSubmission(payload: EthicsSubmissionCreatePayload): Promise<EthicsSubmission> {
    const res = await api.post<EthicsSubmission>('/ethics', payload);
    return res.data;
  },

  async recordEthicsDecision(
    submissionId: number,
    payload: EthicsDecisionPayload
  ): Promise<EthicsSubmission> {
    const res = await api.post<EthicsSubmission>(`/ethics/${submissionId}/decision`, payload);
    return res.data;
  },

  // CTRI Tracking
  async getCTRIRegistration(trialId: number): Promise<CTRIRegistration | null> {
    const res = await api.get<CTRIRegistration | null>(`/ctri/${trialId}`);
    return res.data;
  },

  async updateCTRIRegistration(trialId: number, payload: Partial<CTRIRegistration>): Promise<CTRIRegistration> {
    const res = await api.put<CTRIRegistration>(`/ctri/${trialId}`, payload);
    return res.data;
  },

  // Regulatory Events
  async getRegulatoryEvents(trial_id?: number): Promise<RegulatoryEvent[]> {
    const res = await api.get<RegulatoryEvent[]>('/regulatory/events', {
      params: trial_id ? { trial_id } : {}
    });
    return res.data;
  },

  async createRegulatoryEvent(payload: {
    trial_id: number;
    event_type: string;
    due_date: string;
    responsible_person?: string;
    notes?: string;
  }): Promise<RegulatoryEvent> {
    const res = await api.post<RegulatoryEvent>('/regulatory/events', payload);
    return res.data;
  },

  async updateRegulatoryEvent(
    eventId: number,
    payload: { status?: string; completion_date?: string; notes?: string }
  ): Promise<RegulatoryEvent> {
    const res = await api.patch<RegulatoryEvent>(`/regulatory/${eventId}`, payload);
    return res.data;
  }
};
