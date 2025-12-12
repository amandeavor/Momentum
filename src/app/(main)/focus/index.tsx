/**
 * Focus Screen - Deep Work Timer
 * 
 * The core productivity interface of Momentum.
 * Features:
 * - Pomodoro timer with work/break cycles
 * - Custom duration settings
 * - Session tracking and history
 * - Immersive "Zen" mode with minimal distractions
 * 
 * @module FocusScreen
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

// Components
import PomodoroTimer from '@/components/focus/PomodoroTimer';
import TimerSettingsModal from '@/components/focus/TimerSettingsModal';

// Redux & State
import { useAppSelector, useAppDispatch } from '@/store';
import {
  selectActiveSession,
  selectTodaysSessions,
  selectTodaysFocusMinutes,
  selectPomodoroSettings,
  selectSetsCompleted,
} from '@/store/selectors';
import { startSession } from '@/store/slices/pomodoroSlice';
import {
  setPomodoroFocusDuration,
  setPomodoroShortBreakDuration,
  setPomodoroLongBreakDuration
} from '@/store/slices/settingsSlice';
import type { PomodoroSession } from '@/types/database';

// Theme
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';

/**
 * Type definition for different session modes.
 */
type SessionType = 'focus' | 'short_break' | 'long_break';

/**
 * Configuration object for a session option card.
 */
interface SessionOption {
  type: SessionType;
  label: string;
  duration: number;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
}

/**
 * FocusScreen Component
 * 
 * Renders the Pomodoro timer interface and session history.
 * Optimized to prevent crashes on Android by avoiding complex entry animations.
 */
const FocusScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  // Selectors
  const activeSession = useAppSelector(selectActiveSession);
  const todaysSessions = useAppSelector(selectTodaysSessions);
  const focusMinutes = useAppSelector(selectTodaysFocusMinutes);
  const settings = useAppSelector(selectPomodoroSettings);
  const setsCompletedRaw = useAppSelector(selectSetsCompleted);

  // Ensure setsCompleted is a valid number
  const setsCompleted = Number.isFinite(Number(setsCompletedRaw)) ? Number(setsCompletedRaw) : 0;

  // Local State
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    focusDuration: settings.focusDuration,
    shortBreakDuration: settings.shortBreakDuration,
    longBreakDuration: settings.longBreakDuration,
  });

  // Memoized Session Options to prevent recreation on every render
  const sessionOptions = useMemo<SessionOption[]>(() => [
    {
      type: 'focus',
      label: 'Focus',
      duration: settings.focusDuration,
      icon: 'flash',
      gradient: [colors.dark.accentBlueMuted + '33', colors.dark.accentBlue + '1A'],
    },
    {
      type: 'short_break',
      label: 'Short Break',
      duration: settings.shortBreakDuration,
      icon: 'cafe',
      gradient: [colors.dark.success + '33', colors.dark.success + '1A'],
    },
    {
      type: 'long_break',
      label: 'Long Break',
      duration: settings.longBreakDuration,
      icon: 'leaf',
      gradient: [colors.dark.warning + '33', colors.dark.warning + '1A'],
    },
  ], [settings.focusDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  /**
   * Starts a new session based on the selected option.
   */
  const handleSelectSession = useCallback((option: SessionOption) => {
    if (!activeSession) {
      dispatch(
        startSession({
          durationMinutes: option.duration,
          breakMinutes: option.type === 'focus' ? settings.shortBreakDuration : 0,
        })
      );
    }
  }, [activeSession, dispatch, settings.shortBreakDuration]);

  /**
   * Persists changes made in the settings modal to the Redux store.
   */
  const handleSaveSettings = useCallback(() => {
    dispatch(setPomodoroFocusDuration(tempSettings.focusDuration));
    dispatch(setPomodoroShortBreakDuration(tempSettings.shortBreakDuration));
    dispatch(setPomodoroLongBreakDuration(tempSettings.longBreakDuration));
    setShowSettings(false);
  }, [dispatch, tempSettings]);

  /**
   * Updates temporary state for settings adjustments.
   * Clamped between 1 and 120 minutes.
   */
  const adjustDuration = useCallback((key: 'focusDuration' | 'shortBreakDuration' | 'longBreakDuration', delta: number) => {
    setTempSettings(prev => ({
      ...prev,
      [key]: Math.max(1, Math.min(120, prev[key] + delta)),
    }));
  }, []);

  // Derived calculations for progress
  const focusGoalMinutes = 120;
  const focusProgress = Math.min(focusMinutes / focusGoalMinutes, 1);
  const focusHours = Math.floor(focusMinutes / 60);
  const focusMins = focusMinutes % 60;

  return (
    <View style={styles.container}>
      {/* Deep Blue Background Glow */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(30,58,138,0.15)', 'transparent']}
          style={[styles.backgroundMesh, { height: '60%' }]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Hero Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <View>
          <Text style={styles.pageTitle}>Focus</Text>
          <Text style={styles.pageSubtitle}>Deep work, zero distractions</Text>
        </View>
        <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={20} color={colors.dark.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Section - Glowing Ring */}
        <Animated.View style={styles.timerSection}>
          <View style={styles.timerGlowContainer}>
            <PomodoroTimer
              workDuration={settings.focusDuration}
              breakDuration={settings.shortBreakDuration}
              longBreakDuration={settings.longBreakDuration}
              completedSets={setsCompleted}
            />
          </View>
        </Animated.View>

        {/* Session Types - Vibrant Glass Cards */}
        {!activeSession && (
          <Animated.View>
            <Text style={styles.sectionHeader}>Start Session</Text>
            <View style={styles.sessionGrid}>
              {/* Focus Card (Large) */}
              <Pressable
                style={[styles.sessionCard, styles.focusCard]}
                onPress={() => handleSelectSession(sessionOptions[0])}
              >
                <LinearGradient
                  colors={sessionOptions[0].gradient as any}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.sessionIconContainer}>
                  <Ionicons name="flash" size={24} color={colors.dark.onAccentBlue} />
                </View>
                <View>
                  <Text style={styles.sessionLabel}>Focus</Text>
                  <Text style={styles.sessionDuration}>{settings.focusDuration} min</Text>
                </View>
                <View style={styles.playIcon}>
                  <Ionicons name="play" size={16} color={colors.dark.background} />
                </View>
              </Pressable>

              {/* Break Cards (Stacked) */}
              <View style={styles.breakCardsColumn}>
                {sessionOptions.slice(1).map((option) => (
                  <Pressable
                    key={option.type}
                    style={styles.breakCard}
                    onPress={() => handleSelectSession(option)}
                  >
                    <LinearGradient
                      colors={option.gradient as any}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View style={styles.breakContent}>
                      <Ionicons name={option.icon} size={18} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.breakLabel}>{option.label}</Text>
                    </View>
                    <Text style={styles.breakDuration}>{option.duration}m</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Floating Stats */}
        <Animated.View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todaysSessions.length}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`}
            </Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(focusProgress * 100)}%</Text>
            <Text style={styles.statLabel}>Goal</Text>
          </View>
        </Animated.View>

        {/* Recent Sessions List */}
        {todaysSessions.length > 0 && (
          <Animated.View>
            <Text style={styles.sectionHeader}>Recent</Text>
            <View style={styles.sessionsList}>
              {todaysSessions.slice(0, 5).map((session: PomodoroSession, index: number) => (
                <View key={session.id || index} style={styles.sessionItem}>
                  <View style={styles.sessionItemLeft}>
                    <View style={styles.sessionDot} />
                    <Text style={styles.sessionItemTime}>
                      {new Date(session.started_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.sessionItemDuration}>
                    {session.duration_minutes} min
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Settings Modal */}
      <TimerSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        tempSettings={tempSettings}
        onAdjust={adjustDuration}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d',
  },
  backgroundMesh: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    letterSpacing: -1.2,
    marginBottom: 6,
    lineHeight: 44,
  },
  pageSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textTertiary,
    letterSpacing: -0.2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  timerGlowContainer: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  sessionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    height: 160,
  },
  sessionCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  focusCard: {
    flex: 1.2,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  sessionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionLabel: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.text,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  sessionDuration: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: -0.1,
  },
  playIcon: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dark.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakCardsColumn: {
    flex: 1,
    gap: spacing.md,
  },
  breakCard: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: -0.1,
  },
  breakDuration: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textTertiary,
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sessionsList: {
    gap: spacing.xs,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  sessionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dark.textTertiary,
  },
  sessionItemTime: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textSecondary,
    letterSpacing: -0.2,
  },
  sessionItemDuration: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.textTertiary,
    letterSpacing: -0.1,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    opacity: 0.6,
  },
});

export default FocusScreen;
