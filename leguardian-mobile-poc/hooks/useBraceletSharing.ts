import { useState, useCallback, useEffect } from 'react';
import {
  braceletSharingService,
  type SharedGuardian,
  type SharingInvitation,
} from '@/services/braceletSharingService';

interface UseBraceletSharingState {
  sharedGuardians: SharedGuardian[];
  pendingInvitations: SharingInvitation[];
  loading: boolean;
  error: string | null;
}

export const useBraceletSharing = (braceletId: number | null) => {
  const [state, setState] = useState<UseBraceletSharingState>({
    sharedGuardians: [],
    pendingInvitations: [],
    loading: false,
    error: null,
  });

  // Fetch shared guardians
  const fetchSharedGuardians = useCallback(async () => {
    if (!braceletId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const guardians = await braceletSharingService.getSharedGuardians(braceletId);
      setState((prev) => ({
        ...prev,
        sharedGuardians: guardians,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch shared guardians',
      }));
    }
  }, [braceletId]);

  // Fetch pending invitations
  const fetchPendingInvitations = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const invitations = await braceletSharingService.getPendingInvitations();
      setState((prev) => ({
        ...prev,
        pendingInvitations: invitations,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invitations',
      }));
    }
  }, []);

  // Share bracelet with guardian
  const shareWithGuardian = useCallback(
    async (
      email: string,
      permissions?: {
        can_edit?: boolean;
        can_view_location?: boolean;
        can_view_events?: boolean;
        can_send_commands?: boolean;
      }
    ) => {
      if (!braceletId) return false;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        console.log('[useBraceletSharing] Calling shareWithGuardian for bracelet:', braceletId, 'email:', email);
        await braceletSharingService.shareWithGuardian(braceletId, email, permissions);
        console.log('[useBraceletSharing] Share request succeeded, refreshing list');
        // Refresh the list
        await fetchSharedGuardians();
        setState((prev) => ({ ...prev, loading: false }));
        return true;
      } catch (error: any) {
        const errorMsg = error.response?.data?.error
          || error.response?.data?.message
          || (error instanceof Error ? error.message : 'Failed to share bracelet');
        console.error('[useBraceletSharing] Share failed with error:', errorMsg);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        return false;
      }
    },
    [braceletId, fetchSharedGuardians]
  );

  // Update permissions for a guardian
  const updatePermissions = useCallback(
    async (
      guardianId: number,
      permissions: {
        can_edit?: boolean;
        can_view_location?: boolean;
        can_view_events?: boolean;
        can_send_commands?: boolean;
      }
    ) => {
      if (!braceletId) return false;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await braceletSharingService.updatePermissions(braceletId, guardianId, permissions);
        // Update local state
        setState((prev) => ({
          ...prev,
          sharedGuardians: prev.sharedGuardians.map((g) =>
            g.id === guardianId ? { ...g, permissions: { ...g.permissions, ...permissions } } : g
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
        return false;
      }
    },
    [braceletId]
  );

  // Revoke access
  const revokeAccess = useCallback(
    async (guardianId: number) => {
      if (!braceletId) return false;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await braceletSharingService.revokeAccess(braceletId, guardianId);
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
        return false;
      }
    },
    [braceletId]
  );

  // Accept invitation
  const acceptInvitation = useCallback(async (invitedBraceletId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await braceletSharingService.acceptInvitation(invitedBraceletId);
      // Remove from pending
      setState((prev) => ({
        ...prev,
        pendingInvitations: prev.pendingInvitations.filter(
          (i) => i.bracelet_id !== invitedBraceletId
        ),
        loading: false,
      }));
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to accept invitation';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
      return false;
    }
  }, []);

  // Decline invitation
  const declineInvitation = useCallback(async (invitedBraceletId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await braceletSharingService.declineInvitation(invitedBraceletId);
      // Remove from pending
      setState((prev) => ({
        ...prev,
        pendingInvitations: prev.pendingInvitations.filter(
          (i) => i.bracelet_id !== invitedBraceletId
        ),
        loading: false,
      }));
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to decline invitation';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
      return false;
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (braceletId) {
      fetchSharedGuardians();
    }
    fetchPendingInvitations();
  }, [braceletId, fetchSharedGuardians, fetchPendingInvitations]);

  return {
    sharedGuardians: state.sharedGuardians,
    pendingInvitations: state.pendingInvitations,
    loading: state.loading,
    error: state.error,
    shareWithGuardian,
    updatePermissions,
    revokeAccess,
    acceptInvitation,
    declineInvitation,
    fetchSharedGuardians,
    fetchPendingInvitations,
  };
};
