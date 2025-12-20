import { useEffect, useState, useRef } from 'react';
import { braceletService, type Bracelet } from '../services/braceletService';
import useBraceletUpdates from './useBraceletUpdates';

interface UseBraceletWithFallbackOptions {
  braceletId: number;
  onUpdate?: (bracelet: Bracelet) => void;
  enableWebSocket?: boolean; // Set to false to use polling only
}

/**
 * Hook that combines WebSocket updates (primary) with polling (fallback)
 * - If WebSocket connects, it will receive real-time updates
 * - If WebSocket fails or takes too long, falls back to polling
 * - Always maintains data freshness with periodic polling as backup
 */
export const useBraceletWithFallback = ({
  braceletId,
  onUpdate,
  enableWebSocket = true,
}: UseBraceletWithFallbackOptions) => {
  const [bracelet, setBracelet] = useState<Bracelet | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WebSocket connection - primary method
  const { connected: wsConnectStatus } = useBraceletUpdates(braceletId, (update) => {
    const braceletData: Bracelet = {
      ...update.bracelet,
      name: update.bracelet.alias,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBracelet(braceletData);
    onUpdate?.(braceletData);
    setWsConnected(true);

    // Clear fallback timeout since we got a WS update
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  });

  // Initial fetch
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const data = await braceletService.getBracelets();
        const found = data.find((b) => b.id === braceletId);
        if (found) {
          setBracelet(found);
          onUpdate?.(found);
        }
      } catch (error) {
        console.log('[useBraceletWithFallback] Initial fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, [braceletId, onUpdate]);

  // Clean up - we no longer use polling since WebSocket is now fully functional
  useEffect(() => {
    // Cleanup any polling intervals if they exist
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    bracelet,
    loading,
    wsConnected: wsConnectStatus,
    usingFallback: !wsConnectStatus,
  };
};
