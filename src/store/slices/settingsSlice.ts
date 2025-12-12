import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '@/theme';

// Haptic feedback levels
export type HapticLevel = 'full' | 'reduced' | 'off';

// Timeblock view style
export type TimeblockViewStyle = 'calendar' | 'list';

// Notification settings
interface NotificationSettings {
  enabled: boolean;
  pomodoroAlerts: boolean;
  bedtimeReminder: boolean;
  streakReminder: boolean;
  todoReminders: boolean;
  friendEncouragements: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string;   // HH:MM format
}

// App settings state
interface SettingsState {
  // Appearance
  theme: ThemeMode;

  // Accessibility
  reducedMotion: boolean;
  hapticLevel: HapticLevel;
  largeText: boolean;
  highContrast: boolean;

  // Notifications
  notifications: NotificationSettings;

  // Pomodoro defaults (flat)
  defaultFocusMinutes: number;
  defaultBreakMinutes: number;
  autoStartBreak: boolean;
  autoStartNextPomodoro: boolean;

  // Pomodoro nested for convenience (computed getter would be ideal, but we'll duplicate)
  pomodoro: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
    autoStartBreaks: boolean;
    autoStartFocus: boolean;
  };

  // Sound & Audio
  soundEnabled: boolean;
  whiteNoiseEnabled: boolean;
  whiteNoiseFile: string | null;

  // Privacy
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;

  // Onboarding
  onboardingCompleted: boolean;
  bedtimeSet: boolean;

  // User bedtime
  bedtime: string;

  // Schedule view preference
  timeblockViewStyle: TimeblockViewStyle;

  // App info
  lastAppVersion: string | null;
}

const initialState: SettingsState = {
  // Appearance - dark by default
  theme: 'dark',

  // Accessibility
  reducedMotion: false,
  hapticLevel: 'full',
  largeText: false,
  highContrast: false,

  // Notifications
  notifications: {
    enabled: true,
    pomodoroAlerts: true,
    bedtimeReminder: true,
    streakReminder: true,
    todoReminders: true,
    friendEncouragements: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  },

  // Pomodoro defaults (flat)
  defaultFocusMinutes: 25,
  defaultBreakMinutes: 5,
  autoStartBreak: false,
  autoStartNextPomodoro: false,

  // Pomodoro nested
  pomodoro: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
  },

  // Sound & Audio
  soundEnabled: true,
  whiteNoiseEnabled: false,
  whiteNoiseFile: null,

  // Privacy
  analyticsEnabled: true,
  crashReportingEnabled: true,

  // Onboarding
  onboardingCompleted: false,
  bedtimeSet: false,

  // User bedtime
  bedtime: '22:00',

  // Schedule view preference
  timeblockViewStyle: 'list',

  // App info
  lastAppVersion: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Appearance
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },

    // Accessibility
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
    setHapticLevel(state, action: PayloadAction<HapticLevel>) {
      state.hapticLevel = action.payload;
    },
    setLargeText(state, action: PayloadAction<boolean>) {
      state.largeText = action.payload;
    },
    setHighContrast(state, action: PayloadAction<boolean>) {
      state.highContrast = action.payload;
    },

    // Notifications
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notifications.enabled = action.payload;
    },
    updateNotificationSettings(state, action: PayloadAction<Partial<NotificationSettings>>) {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    toggleNotificationType(state, action: PayloadAction<keyof Omit<NotificationSettings, 'enabled' | 'quietHoursStart' | 'quietHoursEnd'>>) {
      const key = action.payload;
      state.notifications[key] = !state.notifications[key];
    },

    // Pomodoro defaults
    setDefaultPomodoro(state, action: PayloadAction<{ focus: number; break: number }>) {
      state.defaultFocusMinutes = action.payload.focus;
      state.defaultBreakMinutes = action.payload.break;
      state.pomodoro.focusDuration = action.payload.focus;
      state.pomodoro.shortBreakDuration = action.payload.break;
    },
    setAutoStartBreak(state, action: PayloadAction<boolean>) {
      state.autoStartBreak = action.payload;
      state.pomodoro.autoStartBreaks = action.payload;
    },
    setAutoStartNextPomodoro(state, action: PayloadAction<boolean>) {
      state.autoStartNextPomodoro = action.payload;
      state.pomodoro.autoStartFocus = action.payload;
    },

    // Pomodoro nested setters
    setPomodoroFocusDuration(state, action: PayloadAction<number>) {
      state.pomodoro.focusDuration = action.payload;
      state.defaultFocusMinutes = action.payload;
    },
    setPomodoroShortBreakDuration(state, action: PayloadAction<number>) {
      state.pomodoro.shortBreakDuration = action.payload;
      state.defaultBreakMinutes = action.payload;
    },
    setPomodoroLongBreakDuration(state, action: PayloadAction<number>) {
      state.pomodoro.longBreakDuration = action.payload;
    },
    setPomodoroAutoStartBreaks(state, action: PayloadAction<boolean>) {
      state.pomodoro.autoStartBreaks = action.payload;
      state.autoStartBreak = action.payload;
    },
    setPomodoroAutoStartFocus(state, action: PayloadAction<boolean>) {
      state.pomodoro.autoStartFocus = action.payload;
      state.autoStartNextPomodoro = action.payload;
    },

    // User bedtime
    setBedtime(state, action: PayloadAction<string>) {
      state.bedtime = action.payload;
      state.bedtimeSet = true;
    },

    // Schedule view preference
    setTimeblockViewStyle(state, action: PayloadAction<TimeblockViewStyle>) {
      state.timeblockViewStyle = action.payload;
    },

    // Sound & Audio
    setSoundEnabled(state, action: PayloadAction<boolean>) {
      state.soundEnabled = action.payload;
    },
    setWhiteNoiseEnabled(state, action: PayloadAction<boolean>) {
      state.whiteNoiseEnabled = action.payload;
    },
    setWhiteNoiseFile(state, action: PayloadAction<string | null>) {
      state.whiteNoiseFile = action.payload;
    },

    // Privacy
    setAnalyticsEnabled(state, action: PayloadAction<boolean>) {
      state.analyticsEnabled = action.payload;
    },
    setCrashReportingEnabled(state, action: PayloadAction<boolean>) {
      state.crashReportingEnabled = action.payload;
    },

    // Onboarding
    completeOnboarding(state) {
      state.onboardingCompleted = true;
    },
    setBedtimeConfigured(state, action: PayloadAction<boolean>) {
      state.bedtimeSet = action.payload;
    },
    resetOnboarding(state) {
      state.onboardingCompleted = false;
      state.bedtimeSet = false;
    },

    // App version
    setLastAppVersion(state, action: PayloadAction<string>) {
      state.lastAppVersion = action.payload;
    },

    // Reset all settings
    resetSettings() {
      return initialState;
    },
  },
});

export const {
  setTheme,
  setReducedMotion,
  setHapticLevel,
  setLargeText,
  setHighContrast,
  setNotificationsEnabled,
  updateNotificationSettings,
  toggleNotificationType,
  setDefaultPomodoro,
  setAutoStartBreak,
  setAutoStartNextPomodoro,
  setPomodoroFocusDuration,
  setPomodoroShortBreakDuration,
  setPomodoroLongBreakDuration,
  setPomodoroAutoStartBreaks,
  setPomodoroAutoStartFocus,
  setBedtime,
  setTimeblockViewStyle,
  setSoundEnabled,
  setWhiteNoiseEnabled,
  setWhiteNoiseFile,
  setAnalyticsEnabled,
  setCrashReportingEnabled,
  completeOnboarding,
  setBedtimeConfigured,
  resetOnboarding,
  setLastAppVersion,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Selectors
import { RootState } from '../index';

export const selectSettings = (state: RootState) => state.settings;
export const selectTheme = (state: RootState) => state.settings.theme;
export const selectReducedMotion = (state: RootState) => state.settings.reducedMotion;
export const selectHapticLevel = (state: RootState) => state.settings.hapticLevel;
export const selectNotifications = (state: RootState) => state.settings.notifications;
export const selectOnboardingCompleted = (state: RootState) => state.settings.onboardingCompleted;
export const selectBedtimeSet = (state: RootState) => state.settings.bedtimeSet;
export const selectBedtime = (state: RootState) => state.settings.bedtime;
export const selectPomodoro = (state: RootState) => state.settings.pomodoro;
export const selectPomodoroDefaults = (state: RootState) => ({
  focus: state.settings.defaultFocusMinutes,
  break: state.settings.defaultBreakMinutes,
});
export const selectSoundEnabled = (state: RootState) => state.settings.soundEnabled;
export const selectTimeblockViewStyle = (state: RootState) => state.settings.timeblockViewStyle;