import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
  FadeInDown,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectGlobalStreak } from '@/store/slices/analyticsSlice';
import { fetchActivityHistory } from '@/store/slices/analyticsSlice';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StreakDashboardCard() {
  const dispatch = useAppDispatch();
  const streak = useAppSelector(selectGlobalStreak) || 0;

  useEffect(() => {
    dispatch(fetchActivityHistory());
  }, [dispatch]);
  const journalEntries = useAppSelector(state => state.journal?.entries || []);
  const pomodoroSessions = useAppSelector(state => state.pomodoro?.sessions || []);
  const habitCompletions = useAppSelector(state => state.habits?.completions || []);

  const bestStreak = Math.max(streak, 5);

  const reduceMotion = useReducedMotion() ?? false;

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);
  const flameTranslateY = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      glowOpacity.value = 0.5;
      flameTranslateY.value = 0;
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    flameTranslateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [reduceMotion]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: flameTranslateY.value }
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value * 1.2 }],
  }));

  const weeklyProgress = useMemo(() => {
    const days: { day: string; isCompleted: boolean; isToday: boolean; isFuture: boolean; isLast: boolean }[] = [];
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 (Sun) - 6 (Sat)

    // Generate days for the current week (Sun - Sat)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (currentDayIndex - i));
      const dateStr = date.toISOString().split('T')[0];

      const isToday = i === currentDayIndex;
      const isFuture = i > currentDayIndex;

      const journalCount = journalEntries.filter(e => e.created_at?.startsWith(dateStr)).length;
      const focusCount = pomodoroSessions.filter(s => s.completed && s.started_at?.startsWith(dateStr)).length;
      const habitCount = habitCompletions.filter(h => h.completed_at?.startsWith?.(dateStr) || h.completed_at?.split('T')[0] === dateStr).length;

      const total = journalCount + focusCount + habitCount;

      days.push({
        day: WEEKDAYS[i],
        isCompleted: total > 0,
        isToday,
        isFuture,
        isLast: i === 6
      });
    }
    return days;
  }, [habitCompletions, journalEntries, pomodoroSessions]);

  const completedDaysCount = weeklyProgress.filter(d => d.isCompleted).length;
  const isPerfectWeek = completedDaysCount === 7;
  const progressPercentage = (completedDaysCount / 7) * 100;

  return (
    <Animated.View entering={FadeInDown.duration(600)} style={styles.container}>
      {/* Background - matches app's dark aesthetic */}
      <View style={styles.content}>
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.heroSection}>
          <Animated.View style={animatedIconStyle}>
            <Ionicons name="flame" size={80} color="#f59e0b" />
          </Animated.View>

          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak!</Text>
        </Animated.View>

        {/* Weekly Progress Card */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.cardContainer}>
          {/* Days Row */}
          <View style={styles.daysRow}>
            {weeklyProgress.map((item, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text style={styles.dayLabel}>{item.day}</Text>
                <View style={styles.dayCircleContainer}>
                  {/* Progress Bar Background (only between items) */}
                  {index < 6 && (
                    <View style={[
                      styles.progressBar,
                      (item.isCompleted && weeklyProgress[index + 1].isCompleted) && styles.progressBarFilled
                    ]} />
                  )}

                  <View
                    style={[
                      styles.dayCircle,
                      item.isCompleted && styles.dayCircleCompleted,
                      item.isToday && !item.isCompleted && styles.dayCircleToday,
                    ]}
                  >
                    {item.isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#1a0b05" />
                    ) : item.isLast ? (
                      <Ionicons name="star-outline" size={14} color="#555" />
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Footer Message */}
          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>
              {isPerfectWeek
                ? "Perfect week achieved! 🎉"
                : completedDaysCount === 0
                ? "Start your streak today! 💪"
                : completedDaysCount >= 5
                ? `Almost there! ${7 - completedDaysCount} more day${7 - completedDaysCount > 1 ? 's' : ''} to go!`
                : `${completedDaysCount} of 7 days completed`}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  streakCount: {
    fontSize: 64,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 72,
    marginTop: spacing.sm,
  },
  streakLabel: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: '#f59e0b',
  },

  // Card
  cardContainer: {
    width: '100%',
    backgroundColor: '#1a1d21', // Dark card background
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  dayCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2c3036',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dayCircleCompleted: {
    backgroundColor: '#f59e0b',
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#2c3036',
  },
  progressBar: {
    position: 'absolute',
    top: 14, // Center vertically relative to circle (32/2 - 2)
    left: '50%',
    right: '-50%',
    height: 4,
    backgroundColor: '#2c3036',
    zIndex: 1,
  },
  progressBarFilled: {
    backgroundColor: '#f59e0b',
  },

  // Footer
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#f59e0b', // Orange text
  },
});
