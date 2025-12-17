import { useState, useCallback, useEffect } from 'react';
import { SafetyZone, CreateZoneRequest, UpdateZoneRequest } from '@/utils/types';
import { safetyZoneService } from '@/services/safetyZoneService';

interface UseSafetyZonesState {
  zones: SafetyZone[];
  loading: boolean;
  error: string | null;
}

export const useSafetyZones = (braceletId: number | null) => {
  const [state, setState] = useState<UseSafetyZonesState>({
    zones: [],
    loading: false,
    error: null,
  });

  // Fetch zones for the bracelet
  const fetchZones = useCallback(async () => {
    if (!braceletId) {
      setState({ zones: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const zones = await safetyZoneService.getZones(braceletId);
      setState({ zones, loading: false, error: null });
    } catch (error) {
      setState({
        zones: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch zones',
      });
    }
  }, [braceletId]);

  // Fetch zones on mount or when braceletId changes
  useEffect(() => {
    fetchZones();
  }, [braceletId, fetchZones]);

  // Create a new zone
  const createZone = useCallback(
    async (zone: CreateZoneRequest): Promise<SafetyZone | null> => {
      if (!braceletId) return null;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const newZone = await safetyZoneService.createZone(braceletId, zone);
        setState((prev) => ({
          ...prev,
          zones: [...prev.zones, newZone],
          loading: false,
        }));
        return newZone;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to create zone';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        return null;
      }
    },
    [braceletId]
  );

  // Update an existing zone
  const updateZone = useCallback(
    async (zoneId: number, zone: UpdateZoneRequest): Promise<SafetyZone | null> => {
      if (!braceletId) return null;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const updatedZone = await safetyZoneService.updateZone(braceletId, zoneId, zone);
        setState((prev) => ({
          ...prev,
          zones: prev.zones.map((z) => (z.id === zoneId ? updatedZone : z)),
          loading: false,
        }));
        return updatedZone;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to update zone';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        return null;
      }
    },
    [braceletId]
  );

  // Delete a zone
  const deleteZone = useCallback(
    async (zoneId: number): Promise<boolean> => {
      if (!braceletId) return false;

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await safetyZoneService.deleteZone(braceletId, zoneId);
        setState((prev) => ({
          ...prev,
          zones: prev.zones.filter((z) => z.id !== zoneId),
          loading: false,
        }));
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to delete zone';
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

  return {
    zones: state.zones,
    loading: state.loading,
    error: state.error,
    fetchZones,
    createZone,
    updateZone,
    deleteZone,
  };
};
