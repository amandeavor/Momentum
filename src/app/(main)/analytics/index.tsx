import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import ProductivityChart from '../../../components/analytics/ProductivityChart';
import StreakHeatmap from '../../../components/analytics/StreakHeatmap';
import ProgressRing from '@/components/common/ProgressRing';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchFocusStats } from '@/store/slices/pomodoroSlice';
import { selectJournalStreak, selectTodosStats, selectWeeklyFocusData } from '@/store/selectors';
import {
  selectAnalyticsInsights,
  selectGlobalStreak,
  selectPeakFocusHour,
  fetchActivityHistory,
} from '@/store/slices/analyticsSlice';

const AnalyticsScreen = () => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const todayFocusMinutes = useAppSelector(state => state.pomodoro.todayFocusMinutes);
  const weekFocusMinutes = useAppSelector(state => state.pomodoro.weekFocusMinutes);
  const weeklyFocusData = useAppSelector(selectWeeklyFocusData);
  const todosStats = useAppSelector(selectTodosStats);
  const journalCount = useAppSelector(state => state.journal.entries.length);
  const journalStreak = useAppSelector(selectJournalStreak);
  const insight = useAppSelector(selectAnalyticsInsights);
  const globalStreak = useAppSelector(selectGlobalStreak);
  const peakFocusHour = useAppSelector(selectPeakFocusHour);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchFocusStats());
      dispatch(fetchActivityHistory());

      // Keep Analytics fresh while user stays on this tab.
      const id = setInterval(() => {
        dispatch(fetchFocusStats());
        dispatch(fetchActivityHistory());
      }, 15000);

      return () => clearInterval(id);
    }, [dispatch])
  );

  // Source of truth: computed stats from Supabase + incremental updates on completion.
  const totalPomodoroMinutes = todayFocusMinutes;

  // Calculate total lifetime stats
  const totalSessions = useAppSelector(state => state.pomodoro.todaySessions?.length || 0);

  const weeklyGoalMinutes = 600; // 10 hours weekly goal
  const weekProgress = weekFocusMinutes > 0 ? Math.min(weekFocusMinutes / weeklyGoalMinutes, 1) : 0;
  const taskCompletionRate = todosStats.total > 0 ? todosStats.completionRate : 0;

  const focusHours = Math.floor(weekFocusMinutes / 60);
  const focusMins = weekFocusMinutes % 60;

  const todayHours = Math.floor(todayFocusMinutes / 60);
  const todayMins = todayFocusMinutes % 60;

  // Format time display helper
  const formatTime = (minutes: number) => {
    if (minutes === 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    return `${m}m`;
  };

  return (
    <View style={styles.container}>
      {/* Hero Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.pageTitle}>Analytics</Text>
        <Text style={styles.pageSubtitle}>Track your productivity journey</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Summary Card */}
        <Animated.View entering={FadeInDown.delay(50).duration(500)}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(96,165,250,0.15)', 'rgba(96,165,250,0.05)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroMain}>
                  <Text style={styles.heroValue}>{formatTime(totalPomodoroMinutes)}</Text>
                  <Text style={styles.heroLabel}>focused today</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStats}>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="flame" size={16} color={colors.dark.pastelOrange} />
                    <Text style={styles.heroStatValue}>{globalStreak}</Text>
                    <Text style={styles.heroStatLabel}>streak</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.dark.pastelGreen} />
                    <Text style={styles.heroStatValue}>{todosStats.completed}</Text>
                    <Text style={styles.heroStatLabel}>tasks</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="book" size={16} color={colors.dark.pastelPeach} />
                    <Text style={styles.heroStatValue}>{journalCount}</Text>
                    <Text style={styles.heroStatLabel}>entries</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Highlights */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.bentoGrid}>
            <View style={styles.bentoCard}>
              <LinearGradient
                colors={[colors.dark.whiteAlpha06, colors.dark.whiteAlpha12]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bentoGradient}
              >
                <View style={styles.bentoHeader}>
                  <View style={styles.bentoIconRing}>
                    <ProgressRing
                      progress={weekProgress}
                      size={48}
                      strokeWidth={5}
                      showLabel={false}
                    >
                      <View style={styles.ringContent}>
                        <Ionicons name="timer" size={16} color={colors.dark.pastelBlue} />
                      </View>
                    </ProgressRing>
                  </View>
                  <View style={styles.bentoBadge}>
                    <Text style={styles.bentoBadgeText}>{Math.round(weekProgress * 100)}%</Text>
                  </View>
                </View>

                <View style={styles.bentoBody}>
                  <Text style={styles.bentoLabel}>This week</Text>
                  <Text style={styles.bentoValue}>
                    {weekFocusMinutes === 0 ? '0m' : focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`}
                  </Text>
                  <Text style={styles.bentoHint}>of 10h goal</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.bentoCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)', 'rgba(180,200,220,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bentoGradient}
              >
                <View style={styles.bentoHeader}>
                  <View style={styles.bentoIconRing}>
                    <ProgressRing
                      progress={taskCompletionRate}
                      size={48}
                      strokeWidth={5}
                      showLabel={false}
                      progressColor={colors.dark.pastelGreen}
                    >
                      <View style={styles.ringContent}>
                        <Ionicons name="checkmark-done" size={16} color={colors.dark.pastelGreen} />
                      </View>
                    </ProgressRing>
                  </View>
                  <View style={styles.bentoBadge}>
                    <Text style={styles.bentoBadgeText}>{todosStats.completed}/{todosStats.total}</Text>
                  </View>
                </View>

                <View style={styles.bentoBody}>
                  <Text style={styles.bentoLabel}>Tasks</Text>
                  <Text style={styles.bentoValue}>
                    {todosStats.total === 0 ? '0%' : `${Math.round(taskCompletionRate * 100)}%`}
                  </Text>
                  <Text style={styles.bentoHint}>Completed</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Quick stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={styles.bentoGrid}>
            <View style={styles.bentoCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)', 'rgba(200,180,220,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bentoGradient}
              >
                <View style={styles.bentoHeader}>
                  <View style={[styles.bentoIconCircle, { backgroundColor: colors.dark.pastelPurple + '26' }]}>
                    <Ionicons name="timer-outline" size={18} color={colors.dark.pastelPurple} />
                  </View>
                </View>

                <View style={styles.bentoBody}>
                  <Text style={styles.bentoLabel}>Pomodoro</Text>
                  <Text style={styles.bentoValue}>{totalPomodoroMinutes}m</Text>
                  <Text style={styles.bentoHint}>Total minutes</Text>
                </View>
              </LinearGradient>
            </View>
            <View style={styles.bentoCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)', 'rgba(220,200,180,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bentoGradient}
              >
                <View style={styles.bentoHeader}>
                  <View style={[styles.bentoIconCircle, { backgroundColor: colors.dark.pastelPeach + '26' }]}>
                    <Ionicons name="book" size={18} color={colors.dark.pastelPeach} />
                  </View>
                </View>

                <View style={styles.bentoBody}>
                  <Text style={styles.bentoLabel}>Journal</Text>
                  <Text style={styles.bentoValue}>{journalCount}</Text>
                  <Text style={styles.bentoHint}>Entries</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <View style={styles.bentoGrid}>
            <View style={styles.bentoCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)', 'rgba(180,220,200,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bentoGradient}
              >
                <View style={styles.bentoHeader}>
                  <View style={[styles.bentoIconCircle, { backgroundColor: colors.dark.pastelGreen + '26' }]}>
                    <Ionicons name="today" size={18} color={colors.dark.pastelGreen} />
                  </View>
                </View>

                <View style={styles.bentoBody}>
                  <Text style={styles.bentoLabel}>Today</Text>
                  <Text style={styles.bentoValue}>
                    {todayFocusMinutes === 0 ? '0m' : todayHours > 0 ? `${todayHours}h ${todayMins}m` : `${todayMins}m`}
                  </Text>
                  <Text style={styles.bentoHint}>Focus time</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.bentoCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)', 'rgba(220,200,160,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bentoGradient}
              >
                <View style={styles.bentoHeader}>
                  <View style={[styles.bentoIconCircle, { backgroundColor: colors.dark.pastelOrange + '26' }]}>
                    <Ionicons name="flame" size={18} color={colors.dark.pastelOrange} />
                  </View>
                </View>

                <View style={styles.bentoBody}>
                  <Text style={styles.bentoLabel}>Streak</Text>
                  <Text style={styles.bentoValue}>{globalStreak}</Text>
                  <Text style={styles.bentoHint}>Days</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View style={styles.bentoGrid}>
            <View style={styles.bentoCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)', 'rgba(220,210,160,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bentoGradient}
              >
                <View style={styles.bentoHeader}>
                  <View style={[styles.bentoIconCircle, { backgroundColor: colors.dark.pastelYellow + '26' }]}>
                    <Ionicons name="flash" size={18} color={colors.dark.pastelYellow} />
                  </View>
                </View>

                <View style={styles.bentoBody}>
                  <Text style={styles.bentoLabel}>Peak hour</Text>
                  <Text style={styles.bentoValue}>{peakFocusHour ?? '—'}</Text>
                  <Text style={styles.bentoHint}>Best time</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.bentoCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)', 'rgba(180,200,220,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bentoGradient}
              >
                <View style={styles.bentoHeader}>
                  <View style={[styles.bentoIconCircle, { backgroundColor: colors.dark.pastelBlue + '26' }]}>
                    <Ionicons name="create" size={18} color={colors.dark.pastelBlue} />
                  </View>
                </View>

                <View style={styles.bentoBody}>
                  <Text style={styles.bentoLabel}>Journal streak</Text>
                  <Text style={styles.bentoValue}>{journalStreak}</Text>
                  <Text style={styles.bentoHint}>Days</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Productivity Chart */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <Text style={styles.sectionHeader}>Weekly Focus</Text>
          <ProductivityChart data={weeklyFocusData?.length > 0 ? weeklyFocusData : [
            { day: 'Mon', minutes: 0 },
            { day: 'Tue', minutes: 0 },
            { day: 'Wed', minutes: 0 },
            { day: 'Thu', minutes: 0 },
            { day: 'Fri', minutes: 0 },
            { day: 'Sat', minutes: 0 },
            { day: 'Sun', minutes: 0 },
          ]} />
        </Animated.View>

        {/* Activity Heatmap */}
        <Animated.View entering={FadeInDown.delay(450).duration(500)}>
          <Text style={styles.sectionHeader}>Activity Log</Text>
          <StreakHeatmap />
        </Animated.View>

        {/* Insights */}
        <Animated.View entering={FadeInDown.delay(550).duration(500)}>
          <View style={styles.insightCard}>
            <LinearGradient
              colors={[
                insight?.color ? `${insight.color}15` : 'rgba(166,227,161,0.1)',
                insight?.color ? `${insight.color}05` : 'rgba(166,227,161,0.02)'
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.insightGradient,
                { borderColor: insight?.color ? `${insight.color}20` : 'rgba(255,255,255,0.08)' }
              ]}
            >
              <View style={[
                styles.insightIcon,
                { backgroundColor: insight?.color ? `${insight.color}25` : 'rgba(166,227,161,0.2)' }
              ]}>
                <Ionicons
                  name={insight?.icon as any || "trending-up"}
                  size={22}
                  color={insight?.color || colors.dark.pastelGreen}
                />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight?.title}</Text>
                <Text style={styles.insightText}>
                  {insight?.message}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    ...typography.styles.h1,
    fontSize: 40,
    lineHeight: 44,
    color: colors.dark.text,
    letterSpacing: -1.2,
    marginBottom: 6,
  },
  pageSubtitle: {
    ...typography.styles.bodySmall,
    color: colors.dark.textTertiary,
    letterSpacing: -0.2,
    marginTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
  },
  heroGradient: {
    padding: spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroMain: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroValue: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    letterSpacing: -1,
  },
  heroLabel: {
    ...typography.styles.body,
    color: colors.dark.textTertiary,
    marginTop: spacing.xs,
  },
  heroDivider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.lg,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  heroStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  heroStatValue: {
    ...typography.styles.h3,
    color: colors.dark.text,
  },
  heroStatLabel: {
    ...typography.styles.caption,
    color: colors.dark.textTertiary,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bentoCard: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  bentoGradient: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
    minHeight: 136,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bentoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoIconRing: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoBadge: {
    backgroundColor: colors.dark.whiteAlpha06,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  bentoBadgeText: {
    ...typography.styles.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.dark.textSecondary,
  },
  bentoBody: {
    gap: 4,
  },
  bentoLabel: {
    ...typography.styles.caption,
    fontSize: 11,
    color: colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  bentoValue: {
    ...typography.styles.h2,
    fontSize: 28,
    lineHeight: 32,
    color: colors.dark.text,
    marginTop: 2,
  },
  bentoHint: {
    ...typography.styles.caption,
    fontSize: 12,
    color: colors.dark.textTertiary,
    opacity: 0.7,
  },
  bentoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  ringContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    ...typography.styles.h3,
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    opacity: 0.6,
  },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  calendarCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
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
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(166,227,161,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.styles.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  insightText: {
    ...typography.styles.body,
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark.textTertiary,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
});

export default AnalyticsScreen;
