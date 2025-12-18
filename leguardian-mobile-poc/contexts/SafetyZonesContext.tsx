import React, { createContext, useContext, useState, ReactNode } from 'react';
import { safetyZoneService } from '../services/safetyZoneService';
import { CreateZoneRequest, UpdateZoneRequest, SafetyZone } from '../utils/types';

interface SafetyZonesContextType {
  zones: Record<number, SafetyZone[]>;
  loading: boolean;
  error: string | null;
  loadZones: (braceletId: number) => Promise<void>;
  createZone: (braceletId: number, zone: CreateZoneRequest) => Promise<SafetyZone | null>;
  updateZoneInContext: (braceletId: number, zoneId: number, zone: UpdateZoneRequest) => Promise<SafetyZone | null>;
  deleteZoneFromContext: (braceletId: number, zoneId: number) => Promise<boolean>;
}

const SafetyZonesContext = createContext<SafetyZonesContextType | undefined>(
  undefined
);

export function SafetyZonesProvider({ children }: { children: ReactNode }) {
  const [zones, setZones] = useState<Record<number, SafetyZone[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadZones = async (braceletId: number) => {
    // Retourner les zones en cache si déjà chargées
    if (zones[braceletId]) {
      return;
    }

    setLoading(true);
    try {
      const data = await safetyZoneService.getZones(braceletId);
      setZones((prev) => ({
        ...prev,
        [braceletId]: data,
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      console.error('Error loading zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const createZone = async (
    braceletId: number,
    zone: CreateZoneRequest
  ): Promise<SafetyZone | null> => {
    setLoading(true);
    try {
      const newZone = await safetyZoneService.createZone(braceletId, zone);
      setZones((prev) => ({
        ...prev,
        [braceletId]: [...(prev[braceletId] || []), newZone],
      }));
      setError(null);
      return newZone;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la création';
      setError(errorMsg);
      console.error('Error creating zone:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateZoneInContext = async (
    braceletId: number,
    zoneId: number,
    zone: UpdateZoneRequest
  ): Promise<SafetyZone | null> => {
    setLoading(true);
    try {
      const updatedZone = await safetyZoneService.updateZone(braceletId, zoneId, zone);
      setZones((prev) => ({
        ...prev,
        [braceletId]: (prev[braceletId] || []).map((z) =>
          z.id === zoneId ? updatedZone : z
        ),
      }));
      setError(null);
      return updatedZone;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMsg);
      console.error('Error updating zone:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteZoneFromContext = async (
    braceletId: number,
    zoneId: number
  ): Promise<boolean> => {
    setLoading(true);
    try {
      await safetyZoneService.deleteZone(braceletId, zoneId);
      setZones((prev) => ({
        ...prev,
        [braceletId]: (prev[braceletId] || []).filter((z) => z.id !== zoneId),
      }));
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMsg);
      console.error('Error deleting zone:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafetyZonesContext.Provider
      value={{
        zones,
        loading,
        error,
        loadZones,
        createZone,
        updateZoneInContext,
        deleteZoneFromContext,
      }}
    >
      {children}
    </SafetyZonesContext.Provider>
  );
}

export function useSafetyZonesContext() {
  const context = useContext(SafetyZonesContext);
  if (!context) {
    throw new Error(
      'useSafetyZonesContext must be used within SafetyZonesProvider'
    );
  }
  return context;
}
