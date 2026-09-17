import api from './api';
import type {
  AdverseEvent,
  AdverseEventCreatePayload,
  AdverseEventReviewPayload,
  SafetySummaryStats,
  AuditLog
} from '../types';

export interface SafetyFilterParams {
  skip?: number;
  limit?: number;
  trial_id?: number;
  site_id?: number;
  participant_id?: number;
  is_serious?: boolean;
  severity?: string;
  status?: string;
}

export const safetyService = {
  async getSummary(trial_id?: number): Promise<SafetySummaryStats> {
    const res = await api.get<SafetySummaryStats>('/safety/summary', {
      params: trial_id ? { trial_id } : {}
    });
    return res.data;
  },

  async listEvents(params: SafetyFilterParams = {}): Promise<AdverseEvent[]> {
    const res = await api.get<AdverseEvent[]>('/safety', { params });
    return res.data;
  },

  async getEvent(eventId: number): Promise<AdverseEvent> {
    const res = await api.get<AdverseEvent>(`/safety/${eventId}`);
    return res.data;
  },

  async reportEvent(payload: AdverseEventCreatePayload): Promise<AdverseEvent> {
    const res = await api.post<AdverseEvent>('/safety', payload);
    return res.data;
  },

  async reviewEvent(eventId: number, payload: AdverseEventReviewPayload): Promise<AdverseEvent> {
    const res = await api.post<AdverseEvent>(`/safety/${eventId}/review`, payload);
    return res.data;
  },

  async getSafetyAuditLogs(aeIdStr: string): Promise<AuditLog[]> {
    const res = await api.get<AuditLog[]>('/audit-logs', {
      params: { entity_type: 'SAFETY', entity_id: aeIdStr }
    });
    return res.data;
  }
};
