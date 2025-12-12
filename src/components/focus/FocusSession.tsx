import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

import ProgressRing from '@/components/common/ProgressRing';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  startSession,
  completeSession,
  cancelSession,
  tick,
  pause,
  resume,
  reset,
  selectPomodoroStatus,
  selectRemainingSeconds,
  selectActiveSession,
  selectIsBreak,
  selectProgress,
  POMODORO_PRESETS,
  PomodoroPreset,
} from '@/store/slices/pomodoroSlice';
import { selectHapticLevel } from '@/store/slices/settingsSlice';

interface FocusSessionProps {
  workDuration?: number;
  breakDuration?: number;
  preset?: PomodoroPreset;
  linkedTodoId?: string;
  onSessionComplete?: () => void;
  onSessionCancel?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Focus rating modal component
interface FocusRatingModalProps {
  visible: boolean;
  onSubmit: (rating: number, notes?: string) => void;
  onSkip: () => void;
}

const FocusRatingModal: React.FC<FocusRatingModalProps> = ({ visible, onSubmit, onSkip }) => {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, notes.trim() || undefined);
      setRating(0);
      setNotes('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal
      accessibilityLabel="Rate your focus session"
    >
      <View style={styles.ratingOverlay}>
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={styles.ratingCard}
        >
          <Text style={styles.ratingTitle}>How was your focus?</Text>
          <Text style={styles.ratingSubtitle}>
            Rate your focus quality to track your productivity
          </Text>

          <View
            style={styles.starsRow}
            accessibilityRole="radiogroup"
            accessibilityLabel="Focus rating from 1 to 5 stars"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRating(star);
                }}
                style={styles.starButton}
                accessibilityRole="radio"
                accessibilityState={{ checked: rating >= star }}
                accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
              >
                <Ionicons
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={36}
                  color={rating >= star ? colors.dark.warning : colors.dark.textTertiary}
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.ratingActions}>
            <Pressable
              onPress={onSkip}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Skip rating"
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
              disabled={rating === 0}
              accessibilityRole="button"
              accessibilityLabel="Submit rating"
              accessibilityState={{ disabled: rating === 0 }}
            >
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const FocusSession: React.FC<FocusSessionProps> = ({
  workDuration = 25,
  breakDuration = 5,
  preset = 'classic',
  linkedTodoId,
  onSessionComplete,
  onSessionCancel,
}) => {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectPomodoroStatus);
  const remainingSeconds = useAppSelector(selectRemainingSeconds);
  const activeSession = useAppSelector(selectActiveSession);
  const isBreak = useAppSelector(selectIsBreak);
  const progress = useAppSelector(selectProgress);
  const hapticLevel = useAppSelector(selectHapticLevel);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [whiteNoiseEnabled, setWhiteNoiseEnabled] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const buttonScale = useSharedValue(1);
  const timerPulse = useSharedValue(1);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  // Haptic helper
  const triggerHaptic = useCallback(
    (style: Haptics.ImpactFeedbackStyle) => {
      if (hapticLevel !== 'off') {
        Haptics.impactAsync(
          hapticLevel === 'full' ? style : Haptics.ImpactFeedbackStyle.Light
        );
      }
    },
    [hapticLevel]
  );

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        dispatch(tick());
      }, 1000) as any;
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, dispatch]);

  // Handle timer completion
  useEffect(() => {
    if (remainingSeconds === 0 && isRunning) {
      dispatch(pause());
      if (isBreak) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        dispatch(reset());
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSessionsCompleted((prev) => prev + 1);
        setShowRatingModal(true);
        stopWhiteNoise();
      }
    }
  }, [remainingSeconds, isRunning, isBreak, dispatch]);

  // Pulse animation when running
  useEffect(() => {
    if (isRunning) {
      timerPulse.value = withSequence(
        withTiming(1.02, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );
    }
  }, [remainingSeconds, isRunning, timerPulse]);

  // White noise controls
  const startWhiteNoise = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      // Using a placeholder - in production, load actual white noise file
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/audio/white-noise.mp3'),
        { isLooping: true, volume: 0.5 }
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.warn('White noise not available:', error);
    }
  };

  const stopWhiteNoise = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const toggleWhiteNoise = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (whiteNoiseEnabled) {
      await stopWhiteNoise();
    } else if (isRunning) {
      await startWhiteNoise();
    }
    setWhiteNoiseEnabled(!whiteNoiseEnabled);
  };

  // Session controls
  const handleStart = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await dispatch(
        startSession({
          todoId: linkedTodoId,
          durationMinutes: workDuration,
          breakMinutes: breakDuration,
        })
      ).unwrap();
      if (whiteNoiseEnabled) {
        await startWhiteNoise();
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handlePauseResume = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (isRunning) {
      dispatch(pause());
      if (whiteNoiseEnabled) stopWhiteNoise();
    } else if (isPaused) {
      dispatch(resume());
      if (whiteNoiseEnabled) startWhiteNoise();
    }
  };

  const handleReset = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    await stopWhiteNoise();
    if (activeSession) {
      const elapsedSeconds = isBreak ? 0 : Math.max(0, Math.min(workDuration * 60, (workDuration * 60) - remainingSeconds));
      const elapsedMinutes = Math.max(0, Math.floor(elapsedSeconds / 60));
      await dispatch(cancelSession({ sessionId: activeSession.id, elapsedMinutes }));
    }
    dispatch(reset());
    onSessionCancel?.();
  };

  const handleRatingSubmit = async (rating: number, notes?: string) => {
    if (activeSession) {
      await dispatch(
        completeSession({
          sessionId: activeSession.id,
          actualMinutes: workDuration,
          rating,
          notes,
        })
      );
    }
    setShowRatingModal(false);
    onSessionComplete?.();
    dispatch(reset());
  };

  const handleRatingSkip = async () => {
    if (activeSession) {
      await dispatch(
        completeSession({
          sessionId: activeSession.id,
          actualMinutes: workDuration,
        })
      );
    }
    setShowRatingModal(false);
    onSessionComplete?.();
    dispatch(reset());
  };

  // Animations
  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulse.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const progressColor = isBreak ? colors.dark.pastelGreen : colors.dark.primary;
  const statusText = isBreak ? 'Break Time' : isRunning ? 'Focus Time' : isPaused ? 'Paused' : 'Ready';

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`Focus timer. ${statusText}. ${timeDisplay} remaining`}
    >
      {/* Status badge */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(300)}
        style={[
          styles.statusBadge,
          { backgroundColor: isBreak ? colors.dark.pastelGreen + '20' : colors.dark.elevated },
        ]}
        accessibilityRole="text"
        accessibilityLabel={`Status: ${statusText}`}
      >
        <Ionicons
          name={isBreak ? 'cafe' : isRunning ? 'flash' : 'time'}
          size={16}
          color={isBreak ? colors.dark.pastelGreen : colors.dark.text}
        />
        <Text style={[styles.statusText, { color: isBreak ? colors.dark.pastelGreen : colors.dark.text }]}>
          {statusText}
        </Text>
      </Animated.View>

      {/* Timer ring */}
      <Animated.View style={[styles.timerContainer, timerAnimatedStyle]}>
        <ProgressRing
          progress={progress}
          size={240}
          strokeWidth={10}
          progressColor={progressColor}
        >
          <View style={styles.timerContent}>
            <Text
              style={styles.timeText}
              accessibilityRole="timer"
              accessibilityLabel={`${minutes} minutes and ${seconds} seconds remaining`}
            >
              {timeDisplay}
            </Text>
            <Text style={styles.sessionText}>
              Session {sessionsCompleted + 1}
            </Text>
          </View>
        </ProgressRing>
      </Animated.View>

      {/* White noise toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          onPress={toggleWhiteNoise}
          style={[styles.toggleButton, whiteNoiseEnabled && styles.toggleButtonActive]}
          accessibilityRole="switch"
          accessibilityState={{ checked: whiteNoiseEnabled }}
          accessibilityLabel="White noise"
          accessibilityHint="Toggle background white noise during focus sessions"
        >
          <Ionicons
            name={whiteNoiseEnabled ? 'volume-high' : 'volume-mute'}
            size={18}
            color={whiteNoiseEnabled ? colors.dark.background : colors.dark.textSecondary}
          />
          <Text
            style={[
              styles.toggleText,
              whiteNoiseEnabled && styles.toggleTextActive,
            ]}
          >
            White Noise
          </Text>
        </Pressable>
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
          accessibilityRole="button"
          accessibilityLabel="Reset timer"
          accessibilityHint="Stops and resets the current focus session"
        >
          <Ionicons name="refresh" size={22} color={colors.dark.textSecondary} />
        </Pressable>

        <AnimatedPressable
          onPress={isIdle ? handleStart : handlePauseResume}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          style={[styles.playButton, buttonAnimatedStyle]}
          accessibilityRole="button"
          accessibilityLabel={isIdle ? 'Start focus session' : isRunning ? 'Pause' : 'Resume'}
          accessibilityHint={isIdle ? 'Begins a new focus session' : 'Toggle timer pause state'}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={32}
            color={colors.dark.background}
            style={!isRunning && !isPaused && styles.playIcon}
          />
        </AnimatedPressable>

        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            dispatch(reset());
          }}
          style={styles.secondaryButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip to next phase"
          accessibilityHint="Skip current focus or break period"
        >
          <Ionicons name="play-skip-forward" size={22} color={colors.dark.textSecondary} />
        </Pressable>
      </Animated.View>

      {/* Sessions completed indicators */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(300)}
        style={styles.sessionsContainer}
        accessibilityRole="text"
        accessibilityLabel={`${sessionsCompleted % 4} of 4 sessions completed in this cycle`}
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
                    index < sessionsCompleted % 4
                      ? colors.dark.success
                      : colors.dark.elevated,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      {/* Focus Rating Modal */}
      <FocusRatingModal
        visible={showRatingModal}
        onSubmit={handleRatingSubmit}
        onSkip={handleRatingSkip}
      />
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
    fontSize: 56,
    fontWeight: '200',
    color: colors.dark.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  sessionText: {
    ...typography.styles.caption,
    color: colors.dark.textTertiary,
    marginTop: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: colors.dark.text,
    borderColor: colors.dark.text,
  },
  toggleText: {
    ...typography.styles.caption,
    color: colors.dark.textSecondary,
  },
  toggleTextActive: {
    color: colors.dark.background,
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
    minWidth: spacing.minTouchTarget,
    minHeight: spacing.minTouchTarget,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    minWidth: spacing.minTouchTarget,
    minHeight: spacing.minTouchTarget,
  },
  playIcon: {
    marginLeft: 4,
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
  // Rating modal styles
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  ratingCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  ratingTitle: {
    ...typography.styles.h2,
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  ratingSubtitle: {
    ...typography.styles.bodySmall,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  starButton: {
    padding: spacing.xs,
    minWidth: spacing.minTouchTarget,
    minHeight: spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  skipButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.dark.elevated,
    minHeight: spacing.buttonHeight,
    justifyContent: 'center',
  },
  skipText: {
    ...typography.styles.body,
    color: colors.dark.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.dark.primary,
    minHeight: spacing.buttonHeight,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...typography.styles.body,
    color: colors.dark.background,
    fontWeight: '600',
  },
});

export default FocusSession;