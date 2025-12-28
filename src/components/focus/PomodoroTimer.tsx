import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import ProgressRing from '@/components/common/ProgressRing';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, radii } from '@/theme/spacing';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  startSession,
  completeSession,
  cancelSession,
  fetchFocusStats,
  syncTimer,
  selectLastUpdateTime,
  selectPomodoroStatus,
  selectRemainingSeconds,
  selectIsBreak,
} from '@/store/slices/pomodoroSlice';
import { recordActivity } from '@/store/slices/analyticsSlice';
import { selectActiveSession } from '@/store/selectors';
import useFocusTimer from '@/hooks/useFocusTimer';

interface PomodoroTimerProps {
  workDuration?: number; // minutes
  breakDuration?: number; // minutes
  longBreakDuration?: number; // minutes
  completedSets?: number;
  onSessionComplete?: () => void;
  onBreakComplete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  workDuration = 25,
  breakDuration = 5,
  longBreakDuration = 15,
  completedSets = 0,
  onSessionComplete,
  onBreakComplete,
}) => {
  const dispatch = useAppDispatch();
  const activeSession = useAppSelector(selectActiveSession);
  const savedStatus = useAppSelector(selectPomodoroStatus);
  const savedRemaining = useAppSelector(selectRemainingSeconds);
  const savedIsBreak = useAppSelector(selectIsBreak);
  const lastUpdateTime = useAppSelector(selectLastUpdateTime);

  // Initialize isBreak from Redux if available
  const [isBreak, setIsBreak] = useState(savedIsBreak);
  const [localSessionsCompleted, setLocalSessionsCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Update local isBreak if Redux changes (e.g. on reset)
  useEffect(() => {
    if (savedStatus === 'idle') {
      setIsBreak(savedIsBreak);
    }
  }, [savedIsBreak, savedStatus]);

  // Use prop if provided, otherwise local
  const currentSets = completedSets > 0 ? completedSets : localSessionsCompleted;

  const workSeconds = workDuration * 60;
  const isLongBreak = currentSets > 0 && currentSets % 4 === 0;
  const activeBreakDuration = isLongBreak ? longBreakDuration : breakDuration;
  const breakSeconds = activeBreakDuration * 60;

  // Initialize timer with drift correction logic
  const getInitialTime = () => {
    // If we have an active session OR we are in a break, try to resume
    const shouldResume = (activeSession || savedIsBreak) && (savedStatus === 'running' || savedStatus === 'paused');

    if (shouldResume) {
       if (savedStatus === 'running' && lastUpdateTime) {
         const elapsedSinceLastUpdate = Math.floor((Date.now() - lastUpdateTime) / 1000);
         const correctedRemaining = Math.max(0, savedRemaining - elapsedSinceLastUpdate);
         return correctedRemaining;
       }
       return savedRemaining;
    }

    return workSeconds;
  };

  const {
    timeLeft: timeRemaining,
    isActive: isRunning,
    startTimer,
    stopTimer,
    setTime,
  } = useFocusTimer(getInitialTime());

  // Auto-start if we resumed a running session
  useEffect(() => {
    const shouldResume = (activeSession || savedIsBreak) && savedStatus === 'running';
    if (shouldResume && !isRunning && timeRemaining > 0) {
       startTimer();
    }
  }, []);

  // Ref to track latest time without triggering effect re-runs
  const timeRemainingRef = useRef(timeRemaining);
  const isRunningRef = useRef(isRunning);
  const isBreakRef = useRef(isBreak);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
    isRunningRef.current = isRunning;
    isBreakRef.current = isBreak;
  }, [timeRemaining, isRunning, isBreak]);

  // Sync with Redux periodically
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        // Use ref to get latest time without restarting interval
        dispatch(syncTimer({
          remainingSeconds: timeRemainingRef.current,
          status: 'running',
          isBreak: isBreakRef.current
        }));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isRunning, dispatch]);

  // Sync on unmount only if actually running
  useEffect(() => {
    return () => {
      // Only sync if it was running at the moment of unmount
      if (isRunningRef.current) {
        dispatch(syncTimer({
          remainingSeconds: timeRemainingRef.current,
          status: 'running',
          isBreak: isBreakRef.current
        }));
      }
    };
  }, [dispatch]);

  const playButtonScale = useSharedValue(1);

  const playButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: playButtonScale.value }],
    };
  });

  const totalSeconds = isBreak ? breakSeconds : workSeconds;
  const progress = totalSeconds > 0 ? (totalSeconds - timeRemaining) / totalSeconds : 0;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calculate elapsed minutes for the current session
  // Uses remaining time for accuracy (avoids drift from app backgrounding)
  const getElapsedMinutes = useCallback(() => {
    const elapsed = totalSeconds - timeRemaining;
    return Math.max(0, Math.floor(elapsed / 60));
  }, [totalSeconds, timeRemaining]);

  // Handle timer completion
  useEffect(() => {
    if (timeRemaining === 0 && isRunning) {
      stopTimer();
      // Sync one last time to ensure Redux knows it's 0
      dispatch(syncTimer({ remainingSeconds: 0, status: 'idle' }));

      if (isBreak) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onBreakComplete?.();
        setIsBreak(false);
        setTime(workSeconds);
        sessionStartTimeRef.current = null;
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Complete the session in Redux with actual minutes
        if (activeSession?.id) {
          dispatch(completeSession({
            sessionId: activeSession.id,
            actualMinutes: workDuration,
          })).then(() => {
            dispatch(fetchFocusStats());
            // Record activity for streak tracking
            dispatch(recordActivity());
          });
        }

        // Calculate next break duration
        const nextSets = currentSets + 1;
        const shouldUseLongBreak = nextSets > 0 && nextSets % 4 === 0;
        const nextBreakSeconds = (shouldUseLongBreak ? longBreakDuration : breakDuration) * 60;

        onSessionComplete?.();
        setLocalSessionsCompleted(prev => prev + 1);
        setIsBreak(true);
        setTime(nextBreakSeconds);
        sessionStartTimeRef.current = null;
      }
    }
  }, [timeRemaining, isRunning, isBreak, currentSets, longBreakDuration, breakDuration, activeSession, workDuration, dispatch]);

  // Update timer when settings change (only if not running)
  useEffect(() => {
    if (!isRunning && !isBreak) {
      setTime(workSeconds);
    }
  }, [workDuration, workSeconds, isRunning, isBreak, setTime]);

  const handlePlayPause = useCallback(async () => {
    if (isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isRunning) {
      // Just pause the timer, don't cancel the session
      stopTimer();
      dispatch(syncTimer({ remainingSeconds: timeRemaining, status: 'paused', isBreak }));
    } else {
      // Starting a new session
      if (!isBreak && !activeSession) {
        setIsLoading(true);
        try {
          await dispatch(startSession({
            durationMinutes: workDuration,
            breakMinutes: breakDuration,
          })).unwrap();
          sessionStartTimeRef.current = Date.now();
          startTimer();
          dispatch(syncTimer({ remainingSeconds: workSeconds, status: 'running', isBreak: false }));
        } catch (error) {
          console.error('Failed to start session:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (!isBreak && activeSession) {
        // Resume existing session
        sessionStartTimeRef.current = Date.now();
        startTimer();
        dispatch(syncTimer({ remainingSeconds: timeRemaining, status: 'running', isBreak: false }));
      } else {
        // Break mode
        startTimer();
        dispatch(syncTimer({ remainingSeconds: timeRemaining, status: 'running', isBreak: true }));
      }
    }
  }, [isRunning, isBreak, activeSession, workDuration, breakDuration, startTimer, stopTimer, getElapsedMinutes, dispatch, isLoading, timeRemaining, workSeconds]);

  const handleReset = useCallback(async () => {
    if (isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopTimer();

    // Cancel active session with elapsed time
    if (activeSession?.id && !isBreak) {
      setIsLoading(true);
      try {
        const elapsedMinutes = getElapsedMinutes();
        await dispatch(cancelSession({
          sessionId: activeSession.id,
          elapsedMinutes,
        }));
        dispatch(fetchFocusStats());
      } finally {
        setIsLoading(false);
      }
    }

    setIsBreak(false);
    setTime(workSeconds);
    sessionStartTimeRef.current = null;
  }, [workSeconds, setTime, stopTimer, activeSession, isBreak, getElapsedMinutes, dispatch, isLoading]);

  const skipToBreak = useCallback(async () => {
    if (isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopTimer();

    if (!isBreak) {
      setIsLoading(true);
      try {
        // Skip focus -> go to break, complete the session with elapsed time
        if (activeSession?.id) {
          const elapsedMinutes = getElapsedMinutes();
          if (elapsedMinutes > 0) {
            await dispatch(completeSession({
              sessionId: activeSession.id,
              actualMinutes: elapsedMinutes,
            }));
          } else {
            await dispatch(cancelSession({
              sessionId: activeSession.id,
              elapsedMinutes: 0,
            }));
          }
          dispatch(fetchFocusStats());
        }

        // Calculate next break duration
        const nextSets = currentSets + 1;
        const shouldUseLongBreak = nextSets > 0 && nextSets % 4 === 0;
        const nextBreakSeconds = (shouldUseLongBreak ? longBreakDuration : breakDuration) * 60;

        onSessionComplete?.();
        setLocalSessionsCompleted(prev => prev + 1);
        setIsBreak(true);
        setTime(nextBreakSeconds);
        sessionStartTimeRef.current = null;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Skip break -> go to focus
      setIsBreak(false);
      setTime(workSeconds);
      onBreakComplete?.();
    }
  }, [isBreak, activeSession, getElapsedMinutes, dispatch, currentSets, longBreakDuration, breakDuration, onSessionComplete, setTime, workSeconds, onBreakComplete, isLoading]);

  const playButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  const handlePlayPressIn = () => {
    playButtonScale.value = withTiming(0.94, {
      duration: 110,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handlePlayPressOut = () => {
    playButtonScale.value = withTiming(1, {
      duration: 140,
      easing: Easing.out(Easing.cubic),
    });
  };

  const progressColor = isBreak ? colors.dark.pastelGreen : colors.dark.primary;
  const statusText = isBreak ? 'Break Time' : 'Focus Time';

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Status badge */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(300)}
        style={[
          styles.statusBadge,
          { backgroundColor: isBreak ? colors.dark.pastelGreen + '20' : colors.dark.elevated },
        ]}
      >
        <Ionicons
          name={isBreak ? 'cafe' : 'flash'}
          size={16}
          color={isBreak ? colors.dark.pastelGreen : colors.dark.text}
        />
        <Text style={[styles.statusText, { color: isBreak ? colors.dark.pastelGreen : colors.dark.text }]}>
          {statusText}
        </Text>
      </Animated.View>

      {/* Timer ring */}
      <View style={styles.timerContainer}>
        <ProgressRing
          progress={progress}
          size={260}
          strokeWidth={8}
          progressColor={progressColor}
        >
          <View style={styles.timerContent}>
            <Text style={styles.timeText}>{timeDisplay}</Text>
            <Text style={styles.sessionText}>
              Session {currentSets + 1}
            </Text>
          </View>
        </ProgressRing>
      </View>

      {/* Controls */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(300)}
        style={styles.controls}
      >
        <Pressable
          onPress={handleReset}
          style={styles.secondaryButton}
          hitSlop={12}
        >
          <Ionicons name="refresh" size={22} color={colors.dark.textSecondary} />
        </Pressable>

        <AnimatedPressable
          style={[styles.playButton, playButtonStyle]}
          onPress={handlePlayPause}
          onPressIn={() => (playButtonScale.value = 0.95)}
          onPressOut={() => (playButtonScale.value = 1)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.background} />
          ) : (
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={32}
              color={colors.background}
              style={{ marginLeft: isRunning ? 0 : 4 }}
            />
          )}
        </AnimatedPressable>

        <Pressable
          onPress={skipToBreak}
          style={styles.secondaryButton}
          hitSlop={12}
        >
          <Ionicons name="play-skip-forward" size={22} color={colors.dark.textSecondary} />
        </Pressable>
      </Animated.View>

      {/* Sessions completed indicators */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(300)}
        style={styles.sessionsContainer}
      >
        <Text style={styles.sessionsLabel}>Sessions today</Text>
        <View style={styles.sessionDots}>
          {[...Array(4)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.sessionDot,
                {
                  backgroundColor:
                    index < currentSets % 4
                      ? colors.dark.success
                      : colors.dark.elevated,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  statusText: {
    ...typography.styles.bodySmall,
    fontWeight: '600',
  },
  timerContainer: {
    marginVertical: spacing.lg,
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 64,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.dark.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  sessionText: {
    ...typography.styles.caption,
    color: colors.dark.textTertiary,
    marginTop: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  secondaryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 4, // Optical centering for play icon
  },
  sessionsContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sessionsLabel: {
    ...typography.styles.caption,
    color: colors.dark.textTertiary,
  },
  sessionDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default PomodoroTimer;
