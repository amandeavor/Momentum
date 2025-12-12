/**
 * Breathing Exercise Screen
 * 
 * Guided breathing exercises to calm the mind and reduce stress.
 * Features multiple breathing patterns and visual guides.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeInUp,
  useReducedMotion,
  cancelAnimation,
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

// Breathing patterns
const BREATHING_PATTERNS = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal duration for all phases. Calming and focusing.',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    color: colors.dark.pastelBlue,
  },
  {
    id: 'relaxing',
    name: '4-7-8 Relaxing',
    description: 'Longer exhale for deep relaxation.',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    color: colors.dark.pastelPurple,
  },
  {
    id: 'energizing',
    name: 'Energizing',
    description: 'Quick breaths to increase alertness.',
    inhale: 3,
    holdIn: 0,
    exhale: 3,
    holdOut: 0,
    color: colors.dark.pastelPeach,
  },
];

type Phase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Breathe In',
  holdIn: 'Hold',
  exhale: 'Breathe Out',
  holdOut: 'Hold',
};

// Animated breathing circle
const BreathingCircle = ({
  phase,
  progress,
  size,
  color,
  reduceMotion,
}: {
  phase: Phase;
  progress: number;
  size: number;
  color: string;
  reduceMotion: boolean;
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;

    // Map phase to scale
    const targetScale = phase === 'inhale' || phase === 'holdIn' ? 1.3 : 1;
    const duration = phase === 'inhale' || phase === 'exhale' ? 1000 : 200;

    scale.value = withTiming(targetScale, {
      duration,
      easing: Easing.inOut(Easing.ease),
    });
  }, [phase, reduceMotion]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.circleContainer, { width: size, height: size }]}>
      {/* Outer glow */}
      <View style={[styles.circleGlow, { backgroundColor: color }]} />

      {/* Outer ring */}
      <View style={[styles.circleRing, { borderColor: color + '40' }]} />

      {/* Main circle */}
      <Animated.View style={circleStyle}>
        <LinearGradient
          colors={[color, color + 'CC']}
          style={[styles.circleInner, { width: size * 0.6, height: size * 0.6 }]}
        >
          <Ionicons name="leaf" size={48} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion() ?? false;
  const [selectedPattern, setSelectedPattern] = useState(BREATHING_PATTERNS[0]);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale');
  const [phaseTime, setPhaseTime] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getPhases = (): { phase: Phase; duration: number }[] => {
    const phases: { phase: Phase; duration: number }[] = [];
    if (selectedPattern.inhale > 0) phases.push({ phase: 'inhale', duration: selectedPattern.inhale });
    if (selectedPattern.holdIn > 0) phases.push({ phase: 'holdIn', duration: selectedPattern.holdIn });
    if (selectedPattern.exhale > 0) phases.push({ phase: 'exhale', duration: selectedPattern.exhale });
    if (selectedPattern.holdOut > 0) phases.push({ phase: 'holdOut', duration: selectedPattern.holdOut });
    return phases;
  };

  const [phaseIndex, setPhaseIndex] = useState(0);
  const phases = getPhases();

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setPhaseTime((t) => {
          const currentPhaseDuration = phases[phaseIndex].duration;
          if (t >= currentPhaseDuration - 1) {
            // Move to next phase
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const nextIndex = (phaseIndex + 1) % phases.length;
            setPhaseIndex(nextIndex);
            setCurrentPhase(phases[nextIndex].phase);
            
            if (nextIndex === 0) {
              setCyclesCompleted((c) => c + 1);
            }
            return 0;
          }
          return t + 1;
        });
        setTotalTime((t) => t + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, phaseIndex, phases]);

  // Reset when pattern changes
  useEffect(() => {
    setPhaseIndex(0);
    setCurrentPhase('inhale');
    setPhaseTime(0);
    setCyclesCompleted(0);
    setTotalTime(0);
    setIsActive(false);
  }, [selectedPattern]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(true);
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(false);
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhaseIndex(0);
    setCurrentPhase('inhale');
    setPhaseTime(0);
    setCyclesCompleted(0);
    setTotalTime(0);
    setIsActive(false);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const currentPhaseDuration = phases[phaseIndex]?.duration || 1;
  const progress = phaseTime / currentPhaseDuration;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button">
          <Ionicons name="close" size={24} color={colors.dark.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Breathing</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Pattern selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.patternSelector}
      >
        {BREATHING_PATTERNS.map((pattern) => (
          <Pressable
            key={pattern.id}
            style={[
              styles.patternCard,
              selectedPattern.id === pattern.id && styles.patternCardActive,
              { borderColor: selectedPattern.id === pattern.id ? pattern.color : 'transparent' },
            ]}
            onPress={() => setSelectedPattern(pattern)}
          >
            <View style={[styles.patternDot, { backgroundColor: pattern.color }]} />
            <Text style={styles.patternName}>{pattern.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {/* Breathing circle */}
        <BreathingCircle
          phase={currentPhase}
          progress={progress}
          size={240}
          color={selectedPattern.color}
          reduceMotion={reduceMotion}
        />

        {/* Phase label */}
        <Animated.View
          key={currentPhase}
          entering={FadeIn.duration(200)}
          style={styles.phaseContainer}
        >
          <Text style={styles.phaseLabel}>{PHASE_LABELS[currentPhase]}</Text>
          <Text style={styles.phaseTimer}>
            {currentPhaseDuration - phaseTime}
          </Text>
        </Animated.View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{cyclesCompleted}</Text>
            <Text style={styles.statLabel}>Cycles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, '0')}
            </Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        {/* Pattern info */}
        <GlassCard padding="sm" style={styles.patternInfo}>
          <Text style={styles.patternInfoTitle}>{selectedPattern.name}</Text>
          <Text style={styles.patternInfoDesc}>{selectedPattern.description}</Text>
          <Text style={styles.patternInfoPattern}>
            {selectedPattern.inhale > 0 && `In: ${selectedPattern.inhale}s`}
            {selectedPattern.holdIn > 0 && ` → Hold: ${selectedPattern.holdIn}s`}
            {selectedPattern.exhale > 0 && ` → Out: ${selectedPattern.exhale}s`}
            {selectedPattern.holdOut > 0 && ` → Hold: ${selectedPattern.holdOut}s`}
          </Text>
        </GlassCard>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.xl }]}>
        {!isActive ? (
          <View style={styles.controlsRow}>
            {totalTime > 0 && (
              <Pressable onPress={handleReset} style={styles.resetButton}>
                <Ionicons name="refresh" size={24} color={colors.dark.textSecondary} />
              </Pressable>
            )}
            <Button
              label={totalTime > 0 ? 'Resume' : 'Start'}
              onPress={handleStart}
              style={{ flex: 1 }}
              icon={<Ionicons name="play" size={20} color={colors.dark.background} />}
            />
          </View>
        ) : (
          <Pressable onPress={handlePause} style={styles.pauseButton}>
            <Ionicons name="pause" size={32} color={colors.dark.text} />
          </Pressable>
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
  patternSelector: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  patternCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.dark.surface,
    borderRadius: radii.full,
    borderWidth: 2,
  },
  patternCardActive: {
    backgroundColor: colors.dark.elevated,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  patternName: {
    ...typography.caption,
    color: colors.dark.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  circleGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 999,
    opacity: 0.2,
  },
  circleRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
  },
  circleInner: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  phaseLabel: {
    ...typography.h2,
    color: colors.dark.text,
  },
  phaseTimer: {
    ...typography.h1,
    fontSize: 56,
    color: colors.dark.text,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    ...typography.h3,
    color: colors.dark.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.dark.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternInfo: {
    width: '100%',
    alignItems: 'center',
  },
  patternInfoTitle: {
    ...typography.bodySmall,
    color: colors.dark.text,
    fontWeight: '600',
  },
  patternInfoDesc: {
    ...typography.caption,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  patternInfoPattern: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginTop: spacing.xs,
  },
  controls: {
    paddingHorizontal: spacing.xl,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resetButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
