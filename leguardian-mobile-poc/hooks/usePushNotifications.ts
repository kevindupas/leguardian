import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { expoPushNotificationService } from '@/services/expoPushNotificationService';

/**
 * Custom hook to setup push notifications on app startup
 * Handles registration, token storage, and listener setup
 */
export const usePushNotifications = (
  onNotificationReceived?: (notification: Notifications.Notification) => void
) => {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    const setupPushNotifications = async () => {
      const token = await expoPushNotificationService.registerForPushNotifications();

      if (token) {
        // Send token to backend
        await expoPushNotificationService.sendTokenToBackend(token);
      }

      // Setup listeners
      if (onNotificationReceived) {
        // Listen for incoming notifications
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          onNotificationReceived(notification);
        });

        // Listen for notification responses (user tapped notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          const notification = response.notification;
          onNotificationReceived(notification);

          // Optional: Navigate based on notification data
          const data = notification.request.content.data;
          if (data.bracelet_id) {
            // Could emit an event or navigate here
            console.log('Navigate to bracelet:', data.bracelet_id);
          }
        });
      }
    };

    setupPushNotifications();

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [onNotificationReceived]);
};
