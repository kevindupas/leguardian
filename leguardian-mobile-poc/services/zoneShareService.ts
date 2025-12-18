import { apiClient } from './apiClient';

export interface ZonePermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface SharedGuardian {
  id: number;
  name: string;
  email: string;
  permissions: ZonePermissions;
}

export interface ZoneShare {
  zone_id: number;
  guardian_id: number;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

class ZoneShareService {
  /**
   * Share a zone with specific guardians and their permissions
   */
  async shareZone(
    braceletId: number,
    zoneId: number,
    guardianId: number,
    permissions: ZonePermissions
  ): Promise<ZoneShare> {
    const response = await apiClient.post(
      `/api/mobile/bracelets/${braceletId}/zones/${zoneId}/share`,
      {
        guardian_id: guardianId,
        ...permissions,
      }
    );
    return response.data;
  }

  /**
   * Get all guardians who have access to a specific zone
   */
  async getSharedGuardians(
    braceletId: number,
    zoneId: number
  ): Promise<SharedGuardian[]> {
    const response = await apiClient.get(
      `/api/mobile/bracelets/${braceletId}/zones/${zoneId}/shared-guardians`
    );
    return response.data;
  }

  /**
   * Update permissions for a guardian on a zone
   */
  async updateZonePermissions(
    braceletId: number,
    zoneId: number,
    guardianId: number,
    permissions: ZonePermissions
  ): Promise<ZoneShare> {
    const response = await apiClient.put(
      `/api/mobile/bracelets/${braceletId}/zones/${zoneId}/shared-guardians/${guardianId}`,
      permissions
    );
    return response.data;
  }

  /**
   * Revoke access to a zone from a guardian
   */
  async revokeZoneAccess(
    braceletId: number,
    zoneId: number,
    guardianId: number
  ): Promise<boolean> {
    await apiClient.delete(
      `/api/mobile/bracelets/${braceletId}/zones/${zoneId}/shared-guardians/${guardianId}`
    );
    return true;
  }
}

export const zoneShareService = new ZoneShareService();
