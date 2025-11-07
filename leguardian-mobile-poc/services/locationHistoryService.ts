import api from './api';

export interface LocationHistoryItem {
  id: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery_level: number | null;
  source_type: 'heartbeat' | 'arrived' | 'lost' | 'danger' | 'danger_update';
  recorded_at: string;
  created_at: string;
}

export const locationHistoryService = {
  /**
   * Get location history for a specific bracelet (last 30 locations)
   */
  async getBraceletLocationHistory(
    braceletId: number
  ): Promise<{ locations: LocationHistoryItem[]; total_locations: number }> {
    try {
      const response = await api.get(
        `/mobile/bracelets/${braceletId}/location-history`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get location history for bracelet ${braceletId}:`,
        error
      );
      return { locations: [], total_locations: 0 };
    }
  },
};
