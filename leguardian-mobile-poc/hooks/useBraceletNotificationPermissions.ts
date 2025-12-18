import { useState, useCallback, useEffect } from 'react';
import { NotificationPermissions } from '../utils/types';
import { braceletSharingService } from '../services/braceletSharingService';

interface UseBraceletNotificationPermissionsState {
  permissions: NotificationPermissions | null;
  loading: boolean;
  error: string | null;
}

// Default permissions for new guardians
const DEFAULT_PERMISSIONS: NotificationPermissions = {
  enabled: true,
  types: {
    zone_entry: true,
    zone_exit: true,
    emergency: true,
    low_battery: false,
  },
  schedule: {
    enabled: false,
    start_hour: 8,
    end_hour: 20,
    allowed_days: [0, 1, 2, 3, 4, 5, 6], // All days
  },
};

export const useBraceletNotificationPermissions = (
  braceletId: number | null,
  guardianId: number | null
) => {
  const [state, setState] = useState<UseBraceletNotificationPermissionsState>({
    permissions: DEFAULT_PERMISSIONS,
    loading: false,
    error: null,
  });

  // Fetch notification permissions for a guardian
  const fetchPermissions = useCallback(async () => {
    if (!braceletId || !guardianId) {
      setState({ permissions: DEFAULT_PERMISSIONS, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const permissions = await braceletSharingService.getNotificationPermissions(
        braceletId,
        guardianId
      );
      setState({ permissions, loading: false, error: null });
    } catch (error) {
      // If API fails, use default permissions
      console.warn('Failed to fetch permissions, using defaults:', error);
      setState({
        permissions: DEFAULT_PERMISSIONS,
        loading: false,
        error: null,
      });
    }
  }, [braceletId, guardianId]);

  // Auto-fetch permissions when braceletId or guardianId changes
  useEffect(() => {
    if (braceletId && guardianId) {
      fetchPermissions();
    }
  }, [braceletId, guardianId]);

  // Update notification permissions
  const updatePermissions = useCallback(
    async (permissions: NotificationPermissions): Promise<boolean> => {
      if (!braceletId || !guardianId) return false;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await braceletSharingService.updateNotificationPermissions(
          braceletId,
          guardianId,
          permissions
        );
        setState({ permissions: result.data, loading: false, error: null });
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to update permissions';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        return false;
      }
    },
    [braceletId, guardianId]
  );

  return {
    permissions: state.permissions,
    loading: state.loading,
    error: state.error,
    fetchPermissions,
    updatePermissions,
  };
};
