import api from './api';
import type { DashboardMetricsResponse, DashboardAlertItem } from '../types';

export const dashboardService = {
  async getMetrics(trial_id?: number, site_id?: number): Promise<DashboardMetricsResponse> {
    const res = await api.get<DashboardMetricsResponse>('/dashboard/metrics', {
      params: {
        ...(trial_id ? { trial_id } : {}),
        ...(site_id ? { site_id } : {})
      }
    });
    return res.data;
  },

  async getAlerts(): Promise<DashboardAlertItem[]> {
    const res = await api.get<DashboardAlertItem[]>('/dashboard/alerts');
    return res.data;
  }
};
