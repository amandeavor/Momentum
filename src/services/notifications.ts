// Notifications Service using expo-notifications
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BEDTIME_NOTIFICATION_KEY = '@momentum_bedtime_notification';
const SCHEDULED_NOTIFICATIONS_KEY = '@momentum_scheduled_notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

export const scheduleNotification = async (
  title: string,
  body: string,
  trigger: Date | number
): Promise<string> => {
  const triggerSeconds = typeof trigger === 'number' 
    ? trigger 
    : Math.max(1, Math.floor((trigger.getTime() - Date.now()) / 1000));

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
    },
  });
  
  return id;
};

/**
 * Schedule a daily notification at a specific time
 */
export const scheduleDailyNotification = async (
  title: string,
  body: string,
  hour: number,
  minute: number,
  identifier?: string
): Promise<string> => {
  // Cancel existing notification with same identifier if provided
  if (identifier) {
    await cancelNotification(identifier);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { type: 'daily', identifier },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    identifier,
  });
  
  // Store the scheduled notification info
  const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
  const notifications = stored ? JSON.parse(stored) : {};
  notifications[identifier || id] = { id, hour, minute, title, body };
  await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  
  return id;
};

/**
 * Schedule bedtime notifications
 * Schedules two notifications at bedtime:
 * 1. Journal reminder
 * 2. Timeblock planning reminder
 */
export const scheduleBedtimeNotifications = async (
  bedtimeHour: number,
  bedtimeMinute: number
): Promise<{ journalId: string; timeblockId: string }> => {
  // Request permissions first
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    throw new Error('Notification permissions not granted');
  }

  // Cancel existing bedtime notifications
  await cancelBedtimeNotifications();

  // Schedule journal reminder (at bedtime)
  const journalId = await scheduleDailyNotification(
    '📔 Journal Time',
    'Take a moment to reflect on your day. What went well? What could be better?',
    bedtimeHour,
    bedtimeMinute,
    'bedtime-journal'
  );

  // Schedule timeblock reminder (5 minutes after bedtime)
  let timeblockMinute = bedtimeMinute + 5;
  let timeblockHour = bedtimeHour;
  if (timeblockMinute >= 60) {
    timeblockMinute -= 60;
    timeblockHour = (timeblockHour + 1) % 24;
  }

  const timeblockId = await scheduleDailyNotification(
    '📅 Plan Tomorrow',
    'Set your timeblocks for tomorrow. What\'s your one priority?',
    timeblockHour,
    timeblockMinute,
    'bedtime-timeblock'
  );

  // Store bedtime notification info
  await AsyncStorage.setItem(BEDTIME_NOTIFICATION_KEY, JSON.stringify({
    journalId,
    timeblockId,
    hour: bedtimeHour,
    minute: bedtimeMinute,
    enabled: true,
  }));

  return { journalId, timeblockId };
};

/**
 * Cancel bedtime notifications
 */
export const cancelBedtimeNotifications = async (): Promise<void> => {
  try {
    await cancelNotification('bedtime-journal');
    await cancelNotification('bedtime-timeblock');
    await AsyncStorage.removeItem(BEDTIME_NOTIFICATION_KEY);
  } catch (error) {
    console.warn('Failed to cancel bedtime notifications:', error);
  }
};

/**
 * Get bedtime notification settings
 */
export const getBedtimeNotificationSettings = async (): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
} | null> => {
  try {
    const stored = await AsyncStorage.getItem(BEDTIME_NOTIFICATION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to get bedtime notification settings:', error);
  }
  return null;
};

/**
 * Schedule a focus session reminder
 */
export const scheduleFocusReminder = async (
  minutesFromNow: number,
  sessionName?: string
): Promise<string> => {
  const title = '⏰ Focus Session Reminder';
  const body = sessionName 
    ? `Time to start your "${sessionName}" focus session!`
    : 'Time to start your focus session!';
    
  return scheduleNotification(title, body, minutesFromNow * 60);
};

/**
 * Schedule a break reminder (for pomodoro breaks)
 */
export const scheduleBreakReminder = async (
  secondsFromNow: number,
  breakType: 'short' | 'long' = 'short'
): Promise<string> => {
  const title = breakType === 'long' ? '☕ Long Break Time!' : '💨 Quick Break!';
  const body = breakType === 'long' 
    ? 'Take a 15-20 minute break. Stretch, hydrate, and relax.'
    : 'Take a 5 minute break. Stand up and stretch!';
    
  return scheduleNotification(title, body, secondsFromNow);
};

/**
 * Schedule a habit reminder
 */
export const scheduleHabitReminder = async (
  habitName: string,
  hour: number,
  minute: number,
  identifier: string
): Promise<string> => {
  return scheduleDailyNotification(
    `🔔 ${habitName}`,
    `Time to work on your habit: ${habitName}`,
    hour,
    minute,
    `habit-${identifier}`
  );
};

export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    // Ignore errors for notifications that don't exist
  }
};

export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
};

export const getPendingNotifications = async () => {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications;
};

export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};

/**
 * Set up notification channels for Android
 */
export const setupNotificationChannels = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bedtime', {
      name: 'Bedtime Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('focus', {
      name: 'Focus Sessions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
};

export default {
  requestPermissions,
  scheduleNotification,
  scheduleDailyNotification,
  scheduleBedtimeNotifications,
  cancelBedtimeNotifications,
  getBedtimeNotificationSettings,
  scheduleFocusReminder,
  scheduleBreakReminder,
  scheduleHabitReminder,
  cancelNotification,
  cancelAllNotifications,
  getPendingNotifications,
  setBadgeCount,
  setupNotificationChannels,
};