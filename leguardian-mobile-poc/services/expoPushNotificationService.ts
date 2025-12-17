import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const expoPushNotificationService = {
  /**
   * Request notification permissions and get Expo Push Token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the token
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;

      console.log('Expo Push Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Send token to backend for storage
   */
  async sendTokenToBackend(token: string): Promise<boolean> {
    try {
      await api.post('/mobile/user/notification-token', {
        expo_push_token: token,
      });
      console.log('Expo push token sent to backend');
      return true;
    } catch (error) {
      console.error('Error sending push token to backend:', error);
      return false;
    }
  },

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(onNotification: (notification: Notifications.Notification) => void) {
    // Handle notifications when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received (foreground):', notification);
      onNotification(notification);
    });

    // Handle notification tap/response
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      const { notification } = response;
      const data = notification.request.content.data;

      // Handle navigation based on notification type
      if (data.type === 'zone_entry' || data.type === 'zone_exit') {
        // Navigate to map with bracelet selected
        // This will be handled by the app's notification routing
      } else if (data.type === 'emergency') {
        // Navigate to emergency screen
      }

      onNotification(notification);
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  },
};
