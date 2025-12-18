import api from './api';
import { NotificationPermissions } from '../utils/types';

export interface SharedGuardian {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'shared';
  permissions: {
    can_edit: boolean;
    can_view_location: boolean;
    can_view_events: boolean;
    can_send_commands: boolean;
  };
  shared_at: string;
  accepted_at: string | null;
}

export interface SharingInvitation {
  bracelet_id: number;
  bracelet_name: string;
  bracelet_alias: string;
  shared_by: string;
  permissions: {
    can_edit: boolean;
    can_view_location: boolean;
    can_view_events: boolean;
    can_send_commands: boolean;
  };
  shared_at: string;
}

export const braceletSharingService = {
  async getSharedGuardians(braceletId: number): Promise<SharedGuardian[]> {
    const response = await api.get(`/mobile/bracelets/${braceletId}/shared-guardians`);
    return response.data;
  },

  async shareWithGuardian(
    braceletId: number,
    email: string,
    permissions?: {
      can_edit?: boolean;
      can_view_location?: boolean;
      can_view_events?: boolean;
      can_send_commands?: boolean;
    }
  ): Promise<{ message: string; shared_with: string }> {
    const response = await api.post(`/mobile/bracelets/${braceletId}/share`, {
      email,
      ...permissions,
    });
    return response.data;
  },

  async updatePermissions(
    braceletId: number,
    guardianId: number,
    permissions: {
      can_edit?: boolean;
      can_view_location?: boolean;
      can_view_events?: boolean;
      can_send_commands?: boolean;
    }
  ): Promise<{ message: string }> {
    const response = await api.put(
      `/mobile/bracelets/${braceletId}/shared-guardians/${guardianId}`,
      permissions
    );
    return response.data;
  },

  async revokeAccess(braceletId: number, guardianId: number): Promise<{ message: string }> {
    const response = await api.delete(
      `/mobile/bracelets/${braceletId}/shared-guardians/${guardianId}`
    );
    return response.data;
  },

  async getPendingInvitations(): Promise<SharingInvitation[]> {
    const response = await api.get('/mobile/sharing-invitations');
    return response.data;
  },

  async acceptInvitation(braceletId: number): Promise<{ message: string }> {
    const response = await api.post(
      `/mobile/bracelets/${braceletId}/sharing-invitations/accept`
    );
    return response.data;
  },

  async declineInvitation(braceletId: number): Promise<{ message: string }> {
    const response = await api.post(
      `/mobile/bracelets/${braceletId}/sharing-invitations/decline`
    );
    return response.data;
  },

  async getNotificationPermissions(
    braceletId: number,
    guardianId: number
  ): Promise<NotificationPermissions> {
    const response = await api.get(
      `/mobile/bracelets/${braceletId}/shared-guardians/${guardianId}/notifications`
    );
    return response.data;
  },

  async updateNotificationPermissions(
    braceletId: number,
    guardianId: number,
    permissions: NotificationPermissions
  ): Promise<{ message: string; data: NotificationPermissions }> {
    const response = await api.put(
      `/mobile/bracelets/${braceletId}/shared-guardians/${guardianId}/notifications`,
      permissions
    );
    return response.data;
  },
};
