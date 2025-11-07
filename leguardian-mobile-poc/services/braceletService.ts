import api from './api';

export interface Bracelet {
  id: number;
  unique_code: string;
  alias: string;
  name: string;
  status: 'active' | 'inactive' | 'emergency';
  battery_level: number;
  last_latitude: number | null;
  last_longitude: number | null;
  last_accuracy: number | null;
  created_at: string;
  updated_at: string;
}

export interface BraceletEvent {
  id: number;
  bracelet_id: number;
  event_type: 'arrived' | 'lost' | 'danger';
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  created_at: string;
}

export const braceletService = {
  async getBracelets(): Promise<Bracelet[]> {
    const response = await api.get('/mobile/bracelets');
    return response.data.bracelets;
  },

  async registerBracelet(uniqueCode: string, alias?: string): Promise<Bracelet> {
    const payload: { unique_code: string; alias?: string } = {
      unique_code: uniqueCode,
    };
    if (alias) {
      payload.alias = alias;
    }
    const response = await api.post('/mobile/bracelets/register', payload);
    return response.data.bracelet;
  },

  async updateBracelet(id: number, data: { alias: string }): Promise<Bracelet> {
    const response = await api.put(`/mobile/bracelets/${id}`, data);
    return response.data.bracelet;
  },

  async getBraceletEvents(id: number, page: number = 1): Promise<BraceletEvent[]> {
    const response = await api.get(`/mobile/bracelets/${id}/events`, {
      params: { page, per_page: 20 },
    });
    return response.data.data || response.data;
  },

  async vibrateBracelet(id: number, pattern: 'short' | 'medium' | 'sos'): Promise<{ command_id: number }> {
    const response = await api.post(`/mobile/bracelets/${id}/vibrate`, { pattern });
    return response.data;
  },

  async resolveEmergency(id: number): Promise<{ success: boolean }> {
    const response = await api.post(`/mobile/bracelets/${id}/resolve-emergency`);
    return response.data;
  },

  async deleteBracelet(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/mobile/bracelets/${id}`);
    return response.data;
  },
};
