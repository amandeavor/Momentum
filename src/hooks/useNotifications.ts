import { useEffect, useCallback, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  scheduleNotification as scheduleNotif,
  cancelNotification,
  requestPermissions,
} from '@/services/notifications';

interface UseNotificationsReturn {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  scheduleNotification: (title: string, body: string, trigger: Date | number) => Promise<string | null>;
  cancelScheduledNotification: (id: string) => Promise<void>;
}

const useNotifications = (): UseNotificationsReturn => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Check permission on mount
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    checkPermission();

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    trigger: Date | number
  ): Promise<string | null> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }
    
    try {
      const id = await scheduleNotif(title, body, trigger);
      return id;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }, [hasPermission, requestPermission]);

  const cancelScheduledNotification = useCallback(async (id: string): Promise<void> => {
    try {
      await cancelNotification(id);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }, []);

  return {
    hasPermission,
    requestPermission,
    scheduleNotification,
    cancelScheduledNotification,
  };
};

export default useNotifications;