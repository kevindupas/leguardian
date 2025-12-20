import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

interface BraceletUpdate {
  bracelet: {
    id: number;
    unique_code: string;
    alias: string;
    status: 'active' | 'inactive' | 'emergency';
    battery_level: number;
    last_latitude: number | null;
    last_longitude: number | null;
    last_accuracy: number | null;
    last_location_update?: string | null;
    last_ping_at?: string | null;
  };
  changes: Record<string, any>;
  timestamp: string;
}

export default function useBraceletUpdates(
  braceletId: number,
  callback: (update: BraceletUpdate) => void
) {
  const [connected, setConnected] = useState(false);
  const echoRef = useRef<Echo<any> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref without recreating the effect
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const subscribe = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        console.warn('[useBraceletUpdates] No auth token, cannot subscribe');
        return;
      }

      // Create a new Echo instance
      const echo = new Echo({
        broadcaster: 'reverb',
        key: process.env.EXPO_PUBLIC_REVERB_APP_KEY as string,
        wsHost: process.env.EXPO_PUBLIC_REVERB_HOST as string,
        wsPort: parseInt(process.env.EXPO_PUBLIC_REVERB_PORT || '443', 10),
        wssPort: parseInt(process.env.EXPO_PUBLIC_REVERB_PORT || '443', 10),
        forceTLS: process.env.EXPO_PUBLIC_REVERB_SCHEME === 'https',
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: process.env.EXPO_PUBLIC_API_URL,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      });

      echoRef.current = echo;

      const channelName = `bracelet.${braceletId}`;

      echo.private(channelName).listen('bracelet.updated', (data: BraceletUpdate) => {
        console.log(`[useBraceletUpdates] Update event received for ${channelName}:`, data);
        callbackRef.current(data);
      });

      console.log(`[useBraceletUpdates] Subscribed to ${channelName}`);
      setConnected(true);
    } catch (error) {
      console.error('[useBraceletUpdates] Subscribe error:', error);
      setConnected(false);
    }
  }, [braceletId]);

  const unsubscribe = useCallback(() => {
    if (echoRef.current) {
      const channelName = `bracelet.${braceletId}`;
      try {
        echoRef.current.leave(channelName);
        echoRef.current.disconnect();
        echoRef.current = null;
        console.log(`[useBraceletUpdates] Unsubscribed from ${channelName}`);
      } catch (error) {
        console.error('[useBraceletUpdates] Unsubscribe error:', error);
      }
    }
    setConnected(false);
  }, [braceletId]);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return { connected };
}
