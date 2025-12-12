import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

interface BreathingExerciseProps {
  onComplete?: () => void;
  onClose?: () => void;
  cycles?: number;
  inhaleTime?: number;
  holdTime?: number;
  exhaleTime?: number;
  restTime?: number;
}

const PHASE_LABELS: Record<BreathingPhase, string> = {
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  rest: 'Rest',
};

const PHASE_COLORS: Record<BreathingPhase, string> = {
  inhale: colors.dark.pastelBlue,
  hold: colors.dark.pastelPurple,
  exhale: colors.dark.pastelGreen,
  rest: colors.dark.textSecondary,
};

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  onComplete,
  onClose,
  cycles = 3,
  inhaleTime = 4,
  holdTime = 4,
  exhaleTime = 4,
  restTime = 2,
}) => {
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [currentCycle, setCurrentCycle] = useState(1);
  const [countdown, setCountdown] = useState(inhaleTime);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const circleScale = useSharedValue(0.6);
  const opacity = useSharedValue(0.5);

  const getPhaseDuration = useCallback((p: BreathingPhase) => {
    switch (p) {
      case 'inhale': return inhaleTime;
      case 'hold': return holdTime;
      case 'exhale': return exhaleTime;
      case 'rest': return restTime;
    }
  }, [inhaleTime, holdTime, exhaleTime, restTime]);

  const getNextPhase = useCallback((currentPhase: BreathingPhase): BreathingPhase => {
    switch (currentPhase) {
      case 'inhale': return 'hold';
      case 'hold': return 'exhale';
      case 'exhale': return 'rest';
      case 'rest': return 'inhale';
    }
  }, []);

  const animateCircle = useCallback((p: BreathingPhase) => {
    const duration = getPhaseDuration(p) * 1000;
    
    switch (p) {
      case 'inhale':
        circleScale.value = withTiming(1, { duration, easing: Easing.inOut(Easing.ease) });
        opacity.value = withTiming(1, { duration, easing: Easing.inOut(Easing.ease) });
        break;
      case 'hold':
        // Keep expanded
        break;
      case 'exhale':
        circleScale.value = withTiming(0.6, { duration, easing: Easing.inOut(Easing.ease) });
        opacity.value = withTiming(0.5, { duration, easing: Easing.inOut(Easing.ease) });
        break;
      case 'rest':
        // Keep contracted
        break;
    }
  }, [getPhaseDuration, circleScale, opacity]);

  useEffect(() => {
    if (!isActive || isComplete) return;

    const phaseDuration = getPhaseDuration(phase);
    animateCircle(phase);
    setCountdown(phaseDuration);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const phaseTimeout = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const nextPhase = getNextPhase(phase);
      
      if (nextPhase === 'inhale') {
        // Completed a cycle
        if (currentCycle >= cycles) {
          setIsComplete(true);
          setIsActive(false);
          onComplete?.();
          return;
        }
        setCurrentCycle((prev) => prev + 1);
      }
      
      setPhase(nextPhase);
    }, phaseDuration * 1000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(phaseTimeout);
    };
  }, [phase, isActive, isComplete, currentCycle, cycles, getPhaseDuration, animateCircle, getNextPhase, onComplete]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(true);
    setPhase('inhale');
    setCurrentCycle(1);
    setIsComplete(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setCurrentCycle(1);
    setCountdown(inhaleTime);
    setIsComplete(false);
    circleScale.value = 0.6;
    opacity.value = 0.5;
  };

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Breathing Exercise</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.dark.text} />
          </Pressable>
        )}
      </View>

      {/* Circle Animation */}
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.breathCircle,
            { backgroundColor: PHASE_COLORS[phase] },
            animatedCircleStyle,
          ]}
        />
        <View style={styles.circleContent}>
          {isComplete ? (
            <>
              <Ionicons name="checkmark-circle" size={48} color={colors.dark.success} />
              <Text style={styles.phaseLabel}>Complete!</Text>
            </>
          ) : isActive ? (
            <>
              <Text style={styles.countdown}>{countdown}</Text>
              <Text style={[styles.phaseLabel, { color: PHASE_COLORS[phase] }]}>
                {PHASE_LABELS[phase]}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="fitness" size={48} color={colors.dark.textSecondary} />
              <Text style={styles.phaseLabel}>Ready</Text>
            </>
          )}
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.cycleText}>
          Cycle {currentCycle} of {cycles}
        </Text>
        <View style={styles.progressDots}>
          {Array.from({ length: cycles }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < currentCycle && styles.progressDotFilled,
                i === currentCycle - 1 && isActive && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {isComplete
            ? 'Great job! Take a moment to notice how you feel.'
            : isActive
            ? 'Focus on your breath. Let thoughts pass by.'
            : 'This exercise uses 4-4-4-2 box breathing to help calm your mind.'}
        </Text>
      </View>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        {isComplete ? (
          <Pressable style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Do Another</Text>
          </Pressable>
        ) : isActive ? (
          <Pressable style={[styles.button, styles.buttonSecondary]} onPress={handleReset}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Stop</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.button} onPress={handleStart}>
            <Text style={styles.buttonText}>Start Breathing</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.dark.text,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: spacing.xs,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    marginBottom: spacing.xl,
  },
  breathCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    position: 'absolute',
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    fontSize: 56,
    fontWeight: '200',
    color: colors.dark.text,
  },
  phaseLabel: {
    ...typography.h3,
    color: colors.dark.textSecondary,
    marginTop: spacing.xs,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cycleText: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginBottom: spacing.sm,
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.dark.surface,
  },
  progressDotFilled: {
    backgroundColor: colors.dark.success,
  },
  progressDotActive: {
    backgroundColor: colors.dark.pastelBlue,
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  instructionText: {
    ...typography.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  button: {
    backgroundColor: colors.dark.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.full,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.dark.surface,
  },
  buttonText: {
    ...typography.body,
    color: colors.dark.background,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.dark.text,
  },
});

export default BreathingExercise;
