import api from './api';

export interface BraceletEvent {
  id: number;
  bracelet_id: number;
  event_type: 'arrived' | 'lost' | 'danger';
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  battery_level: number;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  bracelet?: {
    id: number;
    unique_code: string;
    alias: string;
    status: string;
  };
}

export const eventService = {
  /**
   * Get all events for a specific bracelet
   */
  async getBraceletEvents(
    braceletId: number,
    page: number = 1,
    type?: 'arrived' | 'lost' | 'danger'
  ): Promise<{ data: BraceletEvent[]; pagination: any }> {
    const params: any = { page, per_page: 20 };
    if (type) {
      params.type = type;
    }
    const response = await api.get(`/mobile/bracelets/${braceletId}/events`, { params });
    return response.data;
  },

  /**
   * Get all unresolved events across all bracelets
   */
  async getUnresolvedEvents(): Promise<BraceletEvent[]> {
    const response = await api.get('/mobile/events/unresolved');
    return response.data.events || [];
  },

  /**
   * Get all events across all bracelets
   */
  async getAllEvents(page: number = 1): Promise<{ data: BraceletEvent[]; pagination: any }> {
    const response = await api.get('/mobile/events', { params: { page, per_page: 20 } });
    return response.data;
  },

  /**
   * Resolve an event (mark as handled)
   */
  async resolveEvent(eventId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/mobile/events/${eventId}/resolve`);
    return response.data;
  },

  /**
   * Send a vibration response to acknowledge event
   */
  async sendResponse(braceletId: number, eventId: number): Promise<{ command_id: number }> {
    const response = await api.post(
      `/mobile/bracelets/${braceletId}/respond-to-event`,
      { event_id: eventId }
    );
    return response.data;
  },
};
