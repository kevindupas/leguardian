import React, { createContext, useContext, useState, useEffect } from 'react';
import { eventService } from '../services/eventService';

interface NotificationContextType {
  unreadCount: number;
  refetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refetchNotifications = async () => {
    try {
      const data = await eventService.getAllEvents();
      const unresolved = (data.data || [])
        .filter((e) => !e.resolved)
        .filter((e) => e.event_type !== 'heartbeat'); // Exclude heartbeat from notification count
      setUnreadCount(unresolved.length);
    } catch (error) {
      console.log('[NotificationContext] Error fetching notifications:', error);
    }
  };

  // Poll for unread notifications every 5 seconds
  useEffect(() => {
    refetchNotifications();

    const pollInterval = setInterval(() => {
      refetchNotifications();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refetchNotifications }}>
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
