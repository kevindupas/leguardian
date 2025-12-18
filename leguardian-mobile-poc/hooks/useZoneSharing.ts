import { useState, useCallback } from 'react';
import { zoneShareService, ZonePermissions, SharedGuardian } from '../services/zoneShareService';

interface UseZoneSharingState {
  sharedGuardians: SharedGuardian[];
  loading: boolean;
  error: string | null;
}

export const useZoneSharing = (braceletId: number | null, zoneId: number | null) => {
  const [state, setState] = useState<UseZoneSharingState>({
    sharedGuardians: [],
    loading: false,
    error: null,
  });

  /**
   * Load all guardians who have access to this zone
   */
  const loadSharedGuardians = useCallback(async () => {
    if (!braceletId || !zoneId) {
      setState({ sharedGuardians: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const guardians = await zoneShareService.getSharedGuardians(braceletId, zoneId);
      setState({ sharedGuardians: guardians, loading: false, error: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load shared guardians';
      setState({
        sharedGuardians: [],
        loading: false,
        error: errorMsg,
      });
      console.error('Error loading shared guardians:', error);
    }
  }, [braceletId, zoneId]);

  /**
   * Share a zone with a guardian
   */
  const shareWithGuardian = useCallback(
    async (guardianId: number, permissions: ZonePermissions): Promise<boolean> => {
      if (!braceletId || !zoneId) return false;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await zoneShareService.shareZone(
          braceletId,
          zoneId,
          guardianId,
          permissions
        );

        // Add to local state
        setState((prev) => ({
          ...prev,
          sharedGuardians: [
            ...prev.sharedGuardians,
            {
              id: guardianId,
              name: '', // Will be filled by the calling component
              email: '', // Will be filled by the calling component
              permissions: result,
            },
          ],
          loading: false,
        }));
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to share zone';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        console.error('Error sharing zone:', error);
        return false;
      }
    },
    [braceletId, zoneId]
  );

  /**
   * Update permissions for a guardian on this zone
   */
  const updatePermissions = useCallback(
    async (guardianId: number, permissions: ZonePermissions): Promise<boolean> => {
      if (!braceletId || !zoneId) return false;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await zoneShareService.updateZonePermissions(
          braceletId,
          zoneId,
          guardianId,
          permissions
        );

        // Update local state
        setState((prev) => ({
          ...prev,
          sharedGuardians: prev.sharedGuardians.map((g) =>
            g.id === guardianId ? { ...g, permissions } : g
          ),
          loading: false,
        }));
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to update permissions';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        console.error('Error updating permissions:', error);
        return false;
      }
    },
    [braceletId, zoneId]
  );

  /**
   * Revoke access to this zone from a guardian
   */
  const revokeAccess = useCallback(
    async (guardianId: number): Promise<boolean> => {
      if (!braceletId || !zoneId) return false;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await zoneShareService.revokeZoneAccess(braceletId, zoneId, guardianId);

        // Remove from local state
        setState((prev) => ({
          ...prev,
          sharedGuardians: prev.sharedGuardians.filter((g) => g.id !== guardianId),
          loading: false,
        }));
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to revoke access';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        console.error('Error revoking access:', error);
        return false;
      }
    },
    [braceletId, zoneId]
  );

  return {
    sharedGuardians: state.sharedGuardians,
    loading: state.loading,
    error: state.error,
    loadSharedGuardians,
    shareWithGuardian,
    updatePermissions,
    revokeAccess,
  };
};
