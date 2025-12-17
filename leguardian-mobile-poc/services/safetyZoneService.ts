import api from './api';
import { SafetyZone, CreateZoneRequest, UpdateZoneRequest } from '@/utils/types';

export const safetyZoneService = {
  async getZones(braceletId: number): Promise<SafetyZone[]> {
    const response = await api.get(`/mobile/bracelets/${braceletId}/zones`);
    return response.data;
  },

  async getZone(braceletId: number, zoneId: number): Promise<SafetyZone> {
    const response = await api.get(`/mobile/bracelets/${braceletId}/zones/${zoneId}`);
    return response.data;
  },

  async createZone(braceletId: number, zone: CreateZoneRequest): Promise<SafetyZone> {
    const response = await api.post(`/mobile/bracelets/${braceletId}/zones`, zone);
    return response.data;
  },

  async updateZone(braceletId: number, zoneId: number, zone: UpdateZoneRequest): Promise<SafetyZone> {
    const response = await api.put(`/mobile/bracelets/${braceletId}/zones/${zoneId}`, zone);
    return response.data;
  },

  async deleteZone(braceletId: number, zoneId: number): Promise<void> {
    await api.delete(`/mobile/bracelets/${braceletId}/zones/${zoneId}`);
  },
};
