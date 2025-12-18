import { useState, useCallback } from 'react';
import { NotificationPermissions } from '../utils/types';
import { braceletSharingService } from '../services/braceletSharingService';

interface UseBraceletNotificationPermissionsState {
  permissions: NotificationPermissions | null;
  loading: boolean;
  error: string | null;
}

export const useBraceletNotificationPermissions = (
  braceletId: number | null,
  guardianId: number | null
) => {
  const [state, setState] = useState<UseBraceletNotificationPermissionsState>({
    permissions: null,
    loading: false,
    error: null,
  });

  // Fetch notification permissions for a guardian
  const fetchPermissions = useCallback(async () => {
    if (!braceletId || !guardianId) {
      setState({ permissions: null, loading: false, error: null });
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
      setState({
        permissions: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch permissions',
      });
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
