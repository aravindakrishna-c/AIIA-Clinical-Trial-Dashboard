import api from './api';

export const interopService = {
  async getFhirResource(resourceType: string, id: number): Promise<any> {
    const res = await api.get(`/fhir/${resourceType}/${id}`);
    return res.data;
  },

  async downloadCdiscDomain(domain: string, trialId: number = 1): Promise<void> {
    const res = await api.get(`/export/cdisc/${domain}`, {
      params: { trial_id: trialId },
      responseType: 'blob'
    });

    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CDISC_${domain.toUpperCase()}_Trial_${trialId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
