import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { eventService } from '../services/eventService';
import { useWebSocket } from './WebSocketContext';

interface NotificationContextType {
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode; isAuthenticated: boolean }> = ({
  children,
  isAuthenticated
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isConnected, subscribeToAllBracelets, unsubscribeFromAllBracelets } = useWebSocket();

  // Load initial unread count when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      unsubscribeFromAllBracelets();
      return;
    }

    // Load initial notifications from API
    const loadInitialNotifications = async () => {
      try {
        const data = await eventService.getAllEvents();
        const unresolved = (data.data || [])
          .filter((e) => !e.resolved)
          .filter((e) => e.event_type !== 'heartbeat');
        setUnreadCount(unresolved.length);
        console.log('[NotificationContext] Loaded initial notifications:', unresolved.length);
      } catch (error) {
        console.log('[NotificationContext] Error loading initial notifications:', error);
      }
    };

    loadInitialNotifications();

    // Subscribe to all bracelet updates to track new events
    // When a bracelet status changes (arrived/lost/danger), it means a new event was created
    if (isConnected) {
      console.log('[NotificationContext] WebSocket connected, subscribing to all bracelet updates');
      subscribeToAllBracelets((update) => {
        console.log('[NotificationContext] Received bracelet update via WebSocket:', update.bracelet.status);

        // When bracelet status changes to 'emergency' or 'lost', a new unresolved event was likely created
        // Reload the count from the API to stay accurate
        const reloadUnreadCount = async () => {
          try {
            const data = await eventService.getAllEvents();
            const unresolved = (data.data || [])
              .filter((e) => !e.resolved)
              .filter((e) => e.event_type !== 'heartbeat');
            setUnreadCount(unresolved.length);
            console.log('[NotificationContext] Updated unread count via WebSocket:', unresolved.length);
          } catch (error) {
            console.log('[NotificationContext] Error reloading unread count:', error);
          }
        };

        reloadUnreadCount();
      });
    }

    return () => {
      unsubscribeFromAllBracelets();
    };
  }, [isAuthenticated, isConnected, subscribeToAllBracelets, unsubscribeFromAllBracelets]);

  return (
    <NotificationContext.Provider value={{ unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
