/**
 * Urge Surfing Screen
 * 
 * Mindfulness technique for riding out urges without acting on them.
 * Uses guided breathing and visualization to help users cope with cravings.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  useReducedMotion,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import Button from '@/components/common/Button';
import GlassCard from '@/components/common/GlassCard';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

// Stages of urge surfing
const STAGES = [
  {
    id: 'acknowledge',
    title: 'Acknowledge',
    instruction: 'Notice the urge without judgment. It\'s just a sensation.',
    duration: 15,
    icon: 'eye',
  },
  {
    id: 'observe',
    title: 'Observe',
    instruction: 'Where do you feel it in your body? Just observe, don\'t fight.',
    duration: 20,
    icon: 'body',
  },
  {
    id: 'breathe',
    title: 'Breathe',
    instruction: 'Breathe slowly. In for 4, hold for 4, out for 6.',
    duration: 30,
    icon: 'leaf',
  },
  {
    id: 'ride',
    title: 'Ride the Wave',
    instruction: 'The urge will peak and then subside. Ride it out like a wave.',
    duration: 45,
    icon: 'water',
  },
  {
    id: 'complete',
    title: 'Well Done',
    instruction: 'You surfed the urge. It has less power over you now.',
    duration: 0,
    icon: 'trophy',
  },
];

// Wave animation component
const WaveAnimation = ({ progress, reduceMotion }: { progress: number; reduceMotion: boolean }) => {
  const waveScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;

    waveScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    waveOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [reduceMotion]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
    opacity: waveOpacity.value,
  }));

  return (
    <View style={styles.waveContainer}>
      <Animated.View style={[styles.waveRing, styles.waveRing3, waveStyle]} />
      <Animated.View style={[styles.waveRing, styles.waveRing2, waveStyle]} />
      <Animated.View style={[styles.waveRing, styles.waveRing1]} />
      <LinearGradient
        colors={[colors.dark.pastelBlue, colors.dark.accentBlue]}
        style={styles.waveCenter}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <Ionicons name="water" size={48} color="#fff" />
      </LinearGradient>
    </View>
  );
};

export default function UrgeSurfingScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion() ?? false;
  const [currentStage, setCurrentStage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STAGES[0].duration);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stage = STAGES[currentStage];

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            // Move to next stage
            if (currentStage < STAGES.length - 1) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentStage((s) => s + 1);
              setTimeLeft(STAGES[currentStage + 1].duration);
            } else {
              setIsComplete(true);
              setIsActive(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return 0;
          }
          return t - 1;
        });
        setTotalTime((t) => t + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, currentStage, timeLeft]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(true);
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(false);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStage < STAGES.length - 1) {
      setCurrentStage((s) => s + 1);
      setTimeLeft(STAGES[currentStage + 1].duration);
    }
  };

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const progressPercent = STAGES[0].duration > 0
    ? ((currentStage / (STAGES.length - 1)) + (1 - timeLeft / STAGES[currentStage].duration) / (STAGES.length - 1)) * 100
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button">
          <Ionicons name="close" size={24} color={colors.dark.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Urge Surfing</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.content}>
        {!isComplete ? (
          <>
            {/* Wave animation */}
            <Animated.View entering={FadeIn.duration(400)}>
              <WaveAnimation progress={progressPercent} reduceMotion={reduceMotion} />
            </Animated.View>

            {/* Stage info */}
            <Animated.View
              key={stage.id}
              entering={FadeInUp.duration(400)}
              style={styles.stageContainer}
            >
              <View style={styles.stageIconContainer}>
                <Ionicons
                  name={stage.icon as any}
                  size={24}
                  color={colors.dark.pastelBlue}
                />
              </View>
              <Text style={styles.stageTitle}>{stage.title}</Text>
              <Text style={styles.stageInstruction}>{stage.instruction}</Text>

              {/* Timer */}
              {stage.duration > 0 && (
                <Text style={styles.timer}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </Text>
              )}
            </Animated.View>

            {/* Controls */}
            <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.xl }]}>
              {!isActive ? (
                <Button
                  label="Begin"
                  onPress={handleStart}
                  fullWidth
                  icon={<Ionicons name="play" size={20} color={colors.dark.background} />}
                />
              ) : (
                <View style={styles.activeControls}>
                  <Pressable onPress={handlePause} style={styles.pauseButton}>
                    <Ionicons name="pause" size={24} color={colors.dark.text} />
                  </Pressable>
                  <Pressable onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Skip</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </>
        ) : (
          /* Complete state */
          <Animated.View
            entering={FadeInUp.duration(500)}
            style={styles.completeContainer}
          >
            <LinearGradient
              colors={[colors.dark.success, colors.dark.success + 'CC']}
              style={styles.completeIcon}
            >
              <Ionicons name="trophy" size={48} color="#fff" />
            </LinearGradient>
            <Text style={styles.completeTitle}>Well Done!</Text>
            <Text style={styles.completeSubtitle}>
              You surfed the urge for {Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, '0')}
            </Text>
            <Text style={styles.completeMessage}>
              Remember: each time you surf an urge, it loses power. You're getting stronger.
            </Text>

            <Button
              label="Finish"
              onPress={handleFinish}
              fullWidth
              style={{ marginTop: spacing.xl }}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.dark.text,
  },
  progressContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.dark.pastelBlue,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  waveRing: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.dark.pastelBlue,
  },
  waveRing1: {
    width: 120,
    height: 120,
    opacity: 0.3,
  },
  waveRing2: {
    width: 160,
    height: 160,
    opacity: 0.2,
  },
  waveRing3: {
    width: 200,
    height: 200,
    opacity: 0.1,
  },
  waveCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageContainer: {
    alignItems: 'center',
    maxWidth: '90%',
  },
  stageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.pastelBlue + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stageTitle: {
    ...typography.h2,
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  stageInstruction: {
    ...typography.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  timer: {
    ...typography.h1,
    fontSize: 48,
    color: colors.dark.text,
    marginTop: spacing.lg,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: spacing.xl,
    right: spacing.xl,
  },
  activeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  pauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  completeContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  completeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completeTitle: {
    ...typography.h1,
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  completeSubtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
  },
  completeMessage: {
    ...typography.bodySmall,
    color: colors.dark.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
});
