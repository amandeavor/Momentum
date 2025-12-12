/**
 * Analytics Screen
 * 
 * Displays productivity overview:
 * - Today's focus time
 * - Weekly focus chart
 * - Activity streak heatmap
 * - Key insights
 */
import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import ProductivityChart from '../../../components/analytics/ProductivityChart';
import StreakHeatmap from '../../../components/analytics/StreakHeatmap';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchFocusStats } from '@/store/slices/pomodoroSlice';
import { selectWeeklyFocusData } from '@/store/selectors';
import {
  selectAnalyticsInsights,
  selectGlobalStreak,
  fetchActivityHistory,
  fetchStreakData,
} from '@/store/slices/analyticsSlice';

// StatCard component
const StatCard = ({ icon, value, label, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}) => (
  <View style={styles.statCard}>
    <LinearGradient
      colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statGradient}
    >
      <View style={[styles.statIconCircle, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </View>
);

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  // Selectors
  const weeklyFocusData = useAppSelector(selectWeeklyFocusData);
  const currentStreak = useAppSelector(selectGlobalStreak);
  const insights = useAppSelector(selectAnalyticsInsights);
  const insight = Array.isArray(insights) ? insights[0] : insights;

  const todayFocusMinutes = useAppSelector(state => state.pomodoro.todayFocusMinutes ?? 0);
  const weekFocusMinutes = useAppSelector(state => state.pomodoro.weekFocusMinutes ?? 0);

  // Fetch data on focus
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchFocusStats());
      dispatch(fetchActivityHistory());
      dispatch(fetchStreakData());

      const id = setInterval(() => {
        dispatch(fetchFocusStats());
        dispatch(fetchActivityHistory());
        dispatch(fetchStreakData());
      }, 30000);

      return () => clearInterval(id);
    }, [dispatch])
  );

  // Computed values
  const todayStats = useMemo(() => {
    const hours = Math.floor(todayFocusMinutes / 60);
    const mins = todayFocusMinutes % 60;
    const timeDisplay = todayFocusMinutes === 0 ? '0m' : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return { timeDisplay };
  }, [todayFocusMinutes]);

  const weeklyStats = useMemo(() => {
    const hours = Math.floor(weekFocusMinutes / 60);
    const mins = weekFocusMinutes % 60;
    const timeDisplay = weekFocusMinutes === 0 ? '0m' : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return { timeDisplay };
  }, [weekFocusMinutes]);

  // Build chart data from real weekly data
  const chartData = useMemo(() => {
    if (weeklyFocusData && weeklyFocusData.length > 0) {
      return weeklyFocusData;
    }
    // Fallback with current day highlighted
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    return days.map((day, index) => ({
      day,
      minutes: 0,
    }));
  }, [weeklyFocusData]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(400)}
        style={styles.header}
      >
        <Text style={styles.pageTitle}>Analytics</Text>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card - Today's Focus (Centered, no icon) */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(96,165,250,0.15)', 'rgba(96,165,250,0.05)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroValue}>{todayStats.timeDisplay}</Text>
                <Text style={styles.heroLabel}>focused today</Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.statsRow}>
            <StatCard
              icon="flame"
              value={currentStreak ?? 0}
              label="day streak"
              color={colors.dark.pastelOrange}
            />
            <View style={styles.weekCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.weekGradient}
              >
                <View style={styles.weekHeader}>
                  <View style={[styles.statIconCircle, { backgroundColor: 'rgba(192,132,252,0.2)' }]}>
                    <Ionicons name="calendar" size={18} color={colors.dark.pastelPurple} />
                  </View>
                  <View style={styles.weekInfo}>
                    <Text style={styles.weekValue}>{weeklyStats.timeDisplay}</Text>
                    <Text style={styles.weekLabel}>this week</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Weekly Focus Chart */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Weekly Focus</Text>
            <ProductivityChart data={chartData} />
          </View>
        </Animated.View>

        {/* Activity Heatmap */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Activity Log</Text>
            <StreakHeatmap />
          </View>
        </Animated.View>

        {/* Extra space at bottom */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.dark.text,
    letterSpacing: -1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  // Hero - no progress ring, just icon + text
  heroCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.15)',
  },
  heroGradient: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.dark.text,
    letterSpacing: -1.5,
  },
  heroLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.dark.textTertiary,
    marginTop: 2,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.dark.textTertiary,
  },
  weekCard: {
    flex: 1.5,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  weekGradient: {
    padding: spacing.lg,
    justifyContent: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  weekInfo: {
    flex: 1,
  },
  weekValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.dark.text,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.dark.textTertiary,
    marginTop: 2,
  },
  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  // Insight
  insightCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  insightGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark.text,
    marginBottom: 2,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.dark.textTertiary,
    lineHeight: 16,
  },
});
