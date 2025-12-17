import { useState, useEffect, useCallback, useRef } from 'react';
import { braceletCustomizationService, BraceletCustomization } from '../services/BraceletCustomizationService';

interface UseBraceletCustomizationReturn {
  customization: BraceletCustomization | null;
  isLoading: boolean;
  color: string;
  photoUri?: string;
  updateColor: (color: string) => Promise<void>;
  updatePhoto: (uri: string) => Promise<void>;
  removePhoto: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useBraceletCustomization(braceletId: number): UseBraceletCustomizationReturn {
  const [customization, setCustomization] = useState<BraceletCustomization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshCounterRef = useRef(0);

  const loadCustomization = useCallback(async () => {
    const data = await braceletCustomizationService.getCustomization(braceletId);
    if (!data) {
      setCustomization({ braceletId, color: '#2196F3', updatedAt: Date.now() });
    } else {
      setCustomization(data);
    }
    setIsLoading(false);
  }, [braceletId]);

  useEffect(() => {
    loadCustomization();
  }, [braceletId, loadCustomization]);

  const updateColor = useCallback(async (color: string) => {
    try {
      await braceletCustomizationService.saveCustomization(braceletId, { color });
      const updated = await braceletCustomizationService.getCustomization(braceletId);
      setCustomization(updated);
    } catch (error) {
      console.error('Error updating color:', error);
      throw error;
    }
  }, [braceletId]);

  const updatePhoto = useCallback(async (uri: string) => {
    try {
      await braceletCustomizationService.saveCustomization(braceletId, { photoUri: uri });
      const updated = await braceletCustomizationService.getCustomization(braceletId);
      setCustomization(updated);
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    }
  }, [braceletId]);

  const removePhoto = useCallback(async () => {
    try {
      await braceletCustomizationService.saveCustomization(braceletId, { photoUri: undefined });
      const updated = await braceletCustomizationService.getCustomization(braceletId);
      setCustomization(updated);
    } catch (error) {
      console.error('Error removing photo:', error);
      throw error;
    }
  }, [braceletId]);

  const refresh = useCallback(async () => {
    await loadCustomization();
  }, [loadCustomization]);

  return {
    customization,
    isLoading,
    color: customization?.color || '#2196F3',
    photoUri: customization?.photoUri,
    updateColor,
    updatePhoto,
    removePhoto,
    refresh,
  };
}
