/**
 * Dashboard Screen - Electric Minimal Aesthetic
 * 
 * The main hub of the application. Displays a high-level overview of the user's day,
 * including focus time, active tasks, streaks, and quick navigation to core features.
 * 
 * @module Dashboard
 */
import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks & State
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/store';
import {
  selectTodaysFocusMinutes,
  selectTodaysSessions,
  selectTodaysEntry,
} from '@/store/selectors';
import { selectGlobalStreak } from '@/store/slices/analyticsSlice';
import { selectStreaksEnabled, selectNotesEnabled } from '@/store/slices/capabilitiesSlice';

// Components
import ProgressRing from '@/components/common/ProgressRing'; // Kept if needed, though unused in this specific view currently
import BentoCard from '@/components/dashboard/BentoCard';
import StatItem from '@/components/dashboard/StatItem';
import TaskItem from '@/components/dashboard/TaskItem';

// Theme
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/**
 * Returns a greeting based on the current hour of the day.
 * @returns {string} One of "Good morning", "Good afternoon", "Good evening", or "Good night".
 */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

/**
 * Returns the current date formatted as "DAY, MONTH DATE".
 * @returns {string} Formatted date string (e.g., "FRIDAY, DEC 12").
 */
const getDateString = (): string => {
  const date = new Date();
  return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
};

/**
 * Dashboard Component
 * 
 * Renders the primary user interface with a bento-grid layout.
 * Optimized for performance using memoized selectors and callbacks.
 */
const Dashboard = () => {
  const insets = useSafeAreaInsets();

  // Auth & Profile
  const { profile } = useAuth();

  // Tasks Data
  const { todaysTodos, stats, refresh } = useTasks();

  // Redux Selectors (Memoized internally by Redux, but good to be aware of)
  const focusMinutes = useAppSelector(selectTodaysFocusMinutes);
  const todaysJournal = useAppSelector(selectTodaysEntry);
  const journalStreak = useAppSelector(selectGlobalStreak);
  const notesEnabled = useAppSelector(selectNotesEnabled);

  const [refreshing, setRefreshing] = useState(false);

  // Derived State
  const firstName = useMemo(() =>
    (profile?.display_name || profile?.username || 'there').split(' ')[0],
    [profile]);

  const greeting = useMemo(() => getGreeting(), []);
  const dateString = useMemo(() => getDateString(), []);
  const remainingTasks = useMemo(() =>
    stats.todayTotal - stats.todayCompleted,
    [stats]);

  /**
   * Handles the pull-to-refresh action.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Navigation Handlers (Memoized to prevent prop recreation for child components)
  const handleFocus = useCallback(() => router.push('/(main)/focus'), []);
  const handleTasks = useCallback(() => router.push('/(main)/tasks'), []);
  const handleJournal = useCallback(() => router.push('/(main)/journal'), []);
  const handleHabits = useCallback(() => router.push('/(main)/habits'), []);
  const handleAnalytics = useCallback(() => router.push('/(main)/analytics'), []);
  const handleSchedule = useCallback(() => router.push('/(main)/schedule' as any), []);
  const handleSettings = useCallback(() => router.push('/(main)/settings'), []);
  const handleNotes = useCallback(() => router.push('/(main)/notes'), []);
  const handleStreak = useCallback(() => router.push('/streak'), []);

  return (
    <View style={styles.container}>
      {/* Background - Minimalist Deep Depth */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#0f1115', '#0b0b0d']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.dark.textTertiary}
          />
        }
      >
        {/* Header Section */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.dateText}>{dateString}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={handleStreak}
                style={[
                  styles.settingsBtn,
                  {
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderRadius: 12,
                    padding: 6,
                    shadowColor: '#f59e0b',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 12,
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                  }
                ]}
              >
                <Ionicons name="flame" size={20} color="#f59e0b" />
              </Pressable>
              <Pressable onPress={handleSettings} style={styles.settingsBtn}>
                <Ionicons name="settings-outline" size={20} color={colors.dark.textSecondary} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.nameText}>{firstName}.</Text>

          <Text style={styles.subtitleText}>
            {remainingTasks > 0
              ? `You have ${remainingTasks} tasks remaining today.`
              : "You're all caught up for today."}
          </Text>
        </Animated.View>

        {/* Floating Stats Row */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsRow}>
          <StatItem value={stats.todayCompleted} label="Completed" />
          <View style={styles.statDivider} />
          <StatItem value={`${focusMinutes}m`} label="Focus" />
          <View style={styles.statDivider} />
          <StatItem value={journalStreak} label="Streak" />
        </Animated.View>

        {/* Primary Action - Professional Focus Hero */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <Pressable
            onPress={handleFocus}
            style={({ pressed }) => [
              styles.focusHero,
              pressed && { transform: [{ scale: 0.99 }] }
            ]}
          >
            <View style={styles.focusHeroInner}>
              <View style={styles.focusHeroContent}>
                <View>
                  <Text style={styles.focusHeroTitle}>Deep Focus</Text>
                  <Text style={styles.focusHeroSubtitle}>
                    {focusMinutes > 0 ? `${focusMinutes}m completed today` : 'Start your first session'}
                  </Text>
                </View>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={20} color={colors.dark.text} />
                </View>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Bento Grid */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.bentoGrid}>
          {/* Row 1: Tasks (Large) + Journal */}
          <View style={styles.bentoRow}>
            <BentoCard
              title="Tasks"
              icon="checkbox-outline"
              onPress={handleTasks}
              style={{ flex: 1.5 }}
              height={todaysTodos.length > 3 ? 240 : 180}
            >
              <View style={styles.taskList}>
                {todaysTodos.slice(0, 5).map((todo, i) => (
                  <TaskItem
                    key={todo.id}
                    {...todo}
                    index={i}
                  />
                ))}
                {todaysTodos.length > 5 && (
                  <Text style={styles.moreTasksText}>
                    + {todaysTodos.length - 5} more tasks
                  </Text>
                )}
                {todaysTodos.length === 0 && (
                  <Text style={styles.emptyText}>No tasks yet</Text>
                )}
              </View>
            </BentoCard>

            <View style={styles.bentoCol}>
              <BentoCard
                title="Journal"
                icon="book-outline"
                onPress={handleJournal}
                accent={!todaysJournal}
                height={86}
              >
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, !todaysJournal && { color: colors.dark.background }]}>
                    {todaysJournal ? 'Done' : 'Write'}
                  </Text>
                </View>
              </BentoCard>

              <BentoCard
                title="Habits"
                icon="flame-outline"
                onPress={handleHabits}
                height={86}
              />
            </View>
          </View>

          {/* Row 2: Analytics + Schedule + Notes */}
          <View style={styles.bentoRow}>
            <BentoCard
              icon="stats-chart-outline"
              onPress={handleAnalytics}
              height={100}
            >
              <Text style={styles.cardLabel}>Analytics</Text>
            </BentoCard>

            <BentoCard
              icon="calendar-outline"
              onPress={handleSchedule}
              height={100}
            >
              <Text style={styles.cardLabel}>Schedule</Text>
            </BentoCard>

            {notesEnabled && (
              <BentoCard
                icon="document-text-outline"
                onPress={handleNotes}
                height={100}
              >
                <Text style={styles.cardLabel}>Notes</Text>
              </BentoCard>
            )}
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d', // Deep black
  },
  backgroundMesh: {
    position: 'absolute',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // Header Styles
  header: {
    marginBottom: spacing.xl,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  settingsBtn: {
    padding: 4,
  },
  greetingText: {
    fontSize: 44,
    fontFamily: 'Inter_300Light',
    color: colors.dark.textSecondary,
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  nameText: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    letterSpacing: -1.5,
    lineHeight: 50,
    marginBottom: spacing.md,
  },
  subtitleText: {
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
    color: colors.dark.textTertiary,
    letterSpacing: -0.3,
    lineHeight: 26,
  },

  // Stats Styles
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: spacing.lg,
  },

  // Focus Section Styles
  section: {
    marginBottom: spacing.lg,
  },
  focusHero: {
    height: 100,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  focusHeroInner: {
    flex: 1,
    justifyContent: 'center',
  },
  focusHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  focusHeroTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    marginBottom: 6,
    letterSpacing: -0.7,
  },
  focusHeroSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textTertiary,
    letterSpacing: -0.2,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Bento Grid Layout Styles
  bentoGrid: {
    gap: spacing.md,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bentoCol: {
    flex: 1,
    gap: spacing.md,
  },

  // Task List Styles (Specific to Dashboard view)
  taskList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    fontStyle: 'italic',
  },
  moreTasksText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textTertiary,
    marginTop: 4,
    opacity: 0.8,
  },

  // Mini Stat (Journal/Habit cards)
  miniStat: {
    flex: 1,
    justifyContent: 'center',
  },
  miniStatValue: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    letterSpacing: -0.3,
  },

  // General Card Label
  cardLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.text,
    marginTop: 'auto',
    letterSpacing: 0.1,
  },
});

export default Dashboard;
