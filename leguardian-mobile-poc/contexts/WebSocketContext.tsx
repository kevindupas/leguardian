import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface BraceletUpdate {
  bracelet: {
    id: number;
    unique_code: string;
    alias: string;
    status: 'active' | 'lost' | 'emergency' | 'inactive';
    battery_level: number;
    last_latitude: number | null;
    last_longitude: number | null;
    last_accuracy: number | null;
    last_location_update: string | null;
    last_ping_at: string | null;
  };
  changes: Record<string, any>;
  timestamp: string;
}

interface EchoListenResponse {
  subscribed: (cb: () => void) => EchoListenResponse;
  error: (cb: (error: any) => void) => EchoListenResponse;
}

interface Echo {
  ws: WebSocket;
  private: (channel: string) => {
    listen: (eventName: string, callback: (data: any) => void) => EchoListenResponse;
  };
  leave: (channel: string) => void;
}

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToBracelet: (braceletId: number, callback: (update: BraceletUpdate) => void) => void;
  unsubscribeFromBracelet: (braceletId: number) => void;
  subscribeToAllBracelets: (callback: (update: BraceletUpdate) => void) => void;
  unsubscribeFromAllBracelets: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

let echoInstance: Echo | null = null;

export const WebSocketProvider: React.FC<{ children: React.ReactNode; isAuthenticated?: boolean }> = ({ children, isAuthenticated = false }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const subscriptionsRef = useRef<Map<string, any>>(new Map());
  const callbacksRef = useRef<Map<string, (update: any) => void>>(new Map());
  const allBraceletsCallbackRef = useRef<((update: BraceletUpdate) => void) | null>(null);
  const socketIdRef = useRef<string>('');

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    try {
      setIsConnecting(true);
      console.log('[WebSocket] Starting connection...');

      // Get auth token
      const authToken = await AsyncStorage.getItem('auth_token');
      console.log('[WebSocket] Token retrieved:', authToken ? 'YES' : 'NO');
      if (!authToken) {
        console.log('[WebSocket] No auth token available');
        setIsConnecting(false);
        return;
      }

      console.log('[WebSocket] Opening WebSocket connection to Reverb...');

      const scheme = process.env.EXPO_PUBLIC_REVERB_SCHEME === 'https' ? 'wss' : 'ws';
      const host = process.env.EXPO_PUBLIC_REVERB_HOST;
      const port = process.env.EXPO_PUBLIC_REVERB_PORT;
      const key = process.env.EXPO_PUBLIC_REVERB_APP_KEY;

      // Build WebSocket URL - NO auth token here, it goes in subscribe message
      const wsUrl = `${scheme}://${host}:${port}/app/${key}?protocol=7&client=js&version=7.0.0&flash=false`;

      console.log('[WebSocket] Connecting to Reverb with auth...');

      const ws = new WebSocket(wsUrl);

      // Create the echo instance immediately
      echoInstance = {
        ws,
        private: (channel: string) => {
          console.log('[WebSocket] Subscribing to private channel:', channel);

          // Request channel authentication from backend via API
          const requestChannelAuth = async () => {
            try {
              console.log('[WebSocket] Requesting channel auth from backend for:', channel);
              const response = await api.post('/broadcasting/auth', {
                channel_name: channel,
                socket_id: socketIdRef.current,
              });
              console.log('[WebSocket] Channel auth response:', response.data);
              return response.data;
            } catch (error) {
              console.error('[WebSocket] Failed to get channel auth:', error);
              return null;
            }
          };

          // Subscribe to the channel with proper authentication
          const subscribeToChannel = async () => {
            const auth = await requestChannelAuth();
            if (!auth) {
              console.error('[WebSocket] No auth received, cannot subscribe to', channel);
              return;
            }

            const subMessage = {
              event: 'pusher:subscribe',
              data: {
                channel: channel,
                auth: auth.auth,  // Send the HMAC signature from backend
              },
            };
            console.log('[WebSocket] Sending subscribe message with proper auth for:', channel);
            ws.send(JSON.stringify(subMessage));
          };

          // Start subscription immediately
          subscribeToChannel();

          return {
            listen: (eventName: string, callback: (data: any) => void) => {
              console.log(`[WebSocket] Registering listener for ${eventName}`);
              const braceletId = parseInt(channel.split('.')[1]);
              // Store BOTH the braceletId AND the eventName so we can match them when events arrive
              callbacksRef.current.set(`${braceletId}:${eventName}`, callback);
              return {
                subscribed: (cb: () => void) => { cb(); return { error: () => {} }; },
                error: (cb: (error: any) => void) => { return {}; },
              };
            },
          };
        },
        leave: (channel: string) => {
          console.log('[WebSocket] Leaving channel:', channel);
          const unsubMessage = {
            event: 'pusher:unsubscribe',
            data: {
              channel: channel,
            },
          };
          ws.send(JSON.stringify(unsubMessage));
        },
      } as any;

      console.log('[WebSocket] Echo instance created and stored');

      ws.onopen = () => {
        console.log('[WebSocket] ✓ WebSocket connected to Reverb');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] ====== RAW MESSAGE FULL ======');
          console.log('[WebSocket] Event:', data.event, '| Channel:', data.channel);
          console.log('[WebSocket] Full Data:', JSON.stringify(data, null, 2));

          // Handle connection confirmation
          if (data.event === 'pusher:connection_established' || data.event === 'pusher_internal:connection_established') {
            console.log('[WebSocket] ✓ Connection established by Reverb');

            // Extract socket_id from the response
            try {
              const connData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
              if (connData.socket_id) {
                socketIdRef.current = connData.socket_id;
                console.log('[WebSocket] Socket ID stored:', socketIdRef.current);
              }
            } catch (e) {
              console.error('[WebSocket] Failed to parse connection data:', e);
            }

            setIsConnected(true);
            setIsConnecting(false);
            return;
          }

          // Handle auth errors
          if (data.event === 'pusher:error') {
            console.error('[WebSocket] ✗ Pusher error:', data.data?.message || data.data);
            return;
          }

          // Handle subscription confirmations
          if (data.event === 'pusher_internal:subscription_succeeded') {
            console.log('[WebSocket] ✓ Subscription succeeded for channel:', data.channel);
            return;
          }

          // Handle ping - must respond with pong to keep connection alive
          if (data.event === 'pusher:ping') {
            console.log('[WebSocket] Received ping, sending pong...');
            // Send pong - Pusher protocol: { "event": "pusher:pong", "data": {} }
            const pongMessage = JSON.stringify({ event: 'pusher:pong', data: {} });
            console.log('[WebSocket] Sending pong message:', pongMessage);
            ws.send(pongMessage);
            return;
          }

          // Handle actual bracelet updates - try multiple event name formats
          const eventName = data.event;
          const channel = data.channel;

          console.log('[WebSocket] Event criteria check - eventName:', eventName, 'channel:', channel);

          if (eventName === 'bracelet.updated' && channel && channel.startsWith('bracelet.')) {
            console.log('[WebSocket] ✓ EVENT: Bracelet update detected:', eventName, 'on', channel);
            const braceletIdMatch = channel.match(/bracelet\.(\d+)/);
            if (braceletIdMatch) {
              const braceletId = parseInt(braceletIdMatch[1]);
              const callbackKey = `${braceletId}:${eventName}`;
              const callback = callbacksRef.current.get(callbackKey);
              console.log(`[WebSocket] Looking for callback with key "${callbackKey}", found:`, !!callback);
              if (callback && data.data) {
                console.log('[WebSocket] ✓ Calling listener callback for bracelet', braceletId);
                const update = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
                callback(update);
              }
            }
          } else {
            console.log('[WebSocket] Message does not match event criteria - skipping');
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] ✗ WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
      };
    } catch (error) {
      console.error('[WebSocket] ✗ Failed to connect:', error);
      setIsConnecting(false);
      echoInstance = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnecting...');

    if (echoInstance) {
      subscriptionsRef.current.forEach((sub) => {
        if (echoInstance && sub.channel) {
          try {
            echoInstance.leave(sub.channel);
          } catch (e) {
            console.log('[WebSocket] Error leaving channel:', e);
          }
        }
      });
      subscriptionsRef.current.clear();
      echoInstance = null;
    }

    callbacksRef.current.clear();
    allBraceletsCallbackRef.current = null;
    setIsConnected(false);
  }, []);

  const subscribeToBracelet = useCallback(
    (braceletId: number, callback: (update: BraceletUpdate) => void) => {
      console.log(`[WebSocket] subscribeToBracelet(${braceletId}) - echoInstance: ${echoInstance ? 'OK' : 'NULL'}, isConnected: ${isConnected}`);

      if (!echoInstance) {
        console.warn(`[WebSocket] ✗ Echo not initialized, cannot subscribe to bracelet ${braceletId}`);
        return;
      }

      if (!isConnected) {
        console.warn(`[WebSocket] ✗ Not connected, cannot subscribe to bracelet ${braceletId}`);
        return;
      }

      const channelName = `bracelet.${braceletId}`;
      const eventName = `bracelet.updated`;

      console.log(`[WebSocket] Subscribing to channel: ${channelName}, event: ${eventName}`);

      try {
        // Subscribe via the Echo-like API
        const subscription = echoInstance
          .private(channelName)
          .listen(eventName, (data: BraceletUpdate) => {
            console.log(`[WebSocket] ✓ EVENT RECEIVED for ${eventName} on ${channelName}:`, data);

            // Call the specific bracelet callback passed to subscribeToBracelet
            console.log(`[WebSocket] ✓ Invoking subscribeToBracelet callback for bracelet ${braceletId}`);
            callback(data);

            // Call the all bracelets callback if set
            if (allBraceletsCallbackRef.current) {
              allBraceletsCallbackRef.current(data);
            }
          })
          .subscribed(() => {
            console.log(`[WebSocket] ✓ Successfully subscribed to ${channelName}`);
          })
          .error((error: any) => {
            console.error(`[WebSocket] ✗ Channel error on ${channelName}:`, error);
          });

        subscriptionsRef.current.set(channelName, { channel: channelName, subscription });
        console.log(`[WebSocket] ✓ Subscription set for ${channelName}`);
      } catch (err) {
        console.error(`[WebSocket] ✗ Subscription error for ${channelName}:`, err);
      }
    },
    [isConnected]
  );

  const unsubscribeFromBracelet = useCallback((braceletId: number) => {
    if (!echoInstance) return;

    const channelName = `bracelet.${braceletId}`;
    const eventName = 'bracelet.updated';
    try {
      echoInstance.leave(channelName);
      subscriptionsRef.current.delete(channelName);
      callbacksRef.current.delete(`${braceletId}:${eventName}`);
      console.log(`[WebSocket] Unsubscribed from ${channelName}`);
    } catch (e) {
      console.log('[WebSocket] Error unsubscribing:', e);
    }
  }, []);

  const subscribeToAllBracelets = useCallback((callback: (update: BraceletUpdate) => void) => {
    allBraceletsCallbackRef.current = callback;
  }, []);

  const unsubscribeFromAllBracelets = useCallback(() => {
    allBraceletsCallbackRef.current = null;
  }, []);

  // Auto-connect when component mounts and when isAuthenticated changes
  useEffect(() => {
    console.log('[WebSocket] Auth state changed, isAuthenticated:', isAuthenticated);

    if (isAuthenticated) {
      console.log('[WebSocket] User authenticated, calling connect()');
      connect();
    } else {
      console.log('[WebSocket] User not authenticated, calling disconnect()');
      disconnect();
    }

    return () => {
      console.log('[WebSocket] Cleanup effect');
    };
  }, [isAuthenticated]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        isConnecting,
        connect,
        disconnect,
        subscribeToBracelet,
        unsubscribeFromBracelet,
        subscribeToAllBracelets,
        unsubscribeFromAllBracelets,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};
