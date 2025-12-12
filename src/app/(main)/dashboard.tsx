/**
 * Dashboard - Electric Minimal Aesthetic
 * 
 * A vibrant, sophisticated interface with:
 * - Deep, multi-layered background mesh
 * - "Electric" Focus Hero card with gradient borders
 * - Richer Bento cards with glassmorphism
 * - Floating stats with subtle glows
 */
import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ProgressRing from '@/components/common/ProgressRing';
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
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Todo } from '@/types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

const getDateString = (): string => {
  const date = new Date();
  return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
};

// Bento Grid Card with Richer Glass
const BentoCard = ({
  children,
  style,
  onPress,
  title,
  icon,
  accent = false,
  height,
  colSpan = 1,
}: {
  children?: React.ReactNode;
  style?: any;
  onPress?: () => void;
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: boolean;
  height?: number;
  colSpan?: 1 | 2;
}) => {
  // Surface Gradient: Richer glass effect
  const surfaceGradient = ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'];

  // Accent Gradient: Pearl/Metallic for active states
  const accentGradient = ['#FFFFFF', '#E0E0E0'];

  const content = (
    <View style={[
      styles.bentoCardContainer,
      height ? { height } : undefined,
      colSpan === 2 ? { width: '100%' } : { flex: 1 },
      style
    ]}>
      <LinearGradient
        colors={accent ? accentGradient as any : surfaceGradient as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.bentoContent}>
        {(title || icon) && (
          <View style={styles.bentoHeader}>
            {icon && (
              <View style={[
                styles.iconContainer,
                accent ? { backgroundColor: 'rgba(0,0,0,0.1)' } : { backgroundColor: 'rgba(255,255,255,0.05)' }
              ]}>
                <Ionicons
                  name={icon}
                  size={18}
                  color={accent ? colors.dark.background : colors.dark.textSecondary}
                />
              </View>
            )}
            {title && (
              <Text style={[
                styles.bentoTitle,
                accent && styles.bentoTitleAccent
              ]}>{title}</Text>
            )}
          </View>
        )}
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          colSpan === 2 ? { width: '100%' } : { flex: 1 },
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
};

// Stat Item (Transparent with Glow)
const StatItem = ({ value, label }: { value: string | number; label: string }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Task Item Component
const TaskItem = ({
  title,
  completed,
  priority,
  index,
}: {
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low' | null;
  index: number;
}) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.taskItem}
    >
      <View style={[styles.taskCheckbox, completed && styles.taskCheckboxDone]}>
        {completed && <Ionicons name="checkmark" size={10} color="#000" />}
      </View>
      <Text style={[styles.taskTitle, completed && styles.taskTitleDone]} numberOfLines={1}>
        {title}
      </Text>
    </Animated.View>
  );
};

const Dashboard = () => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { todaysTodos, stats, refresh } = useTasks();
  const focusMinutes = useAppSelector(selectTodaysFocusMinutes);
  const focusSessions = useAppSelector(selectTodaysSessions);
  const todaysJournal = useAppSelector(selectTodaysEntry);
  const journalStreak = useAppSelector(selectGlobalStreak);
  const streaksEnabled = useAppSelector(selectStreaksEnabled);
  const notesEnabled = useAppSelector(selectNotesEnabled);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = (profile?.display_name || profile?.username || 'there').split(' ')[0];
  const greeting = useMemo(() => getGreeting(), []);
  const dateString = useMemo(() => getDateString(), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Navigation handlers
  const handleFocus = () => router.push('/(main)/focus');
  const handleTasks = () => router.push('/(main)/tasks');
  const handleJournal = () => router.push('/(main)/journal');
  const handleHabits = () => router.push('/(main)/habits');
  const handleAnalytics = () => router.push('/(main)/analytics');
  const handleSchedule = () => router.push('/(main)/schedule' as any);
  const handleSettings = () => router.push('/(main)/settings');
  const handleNotes = () => router.push('/(main)/notes');

  const remainingTasks = stats.todayTotal - stats.todayCompleted;

  return (
    <View style={styles.container}>
      {/* Multi-Layer Background Mesh */}
      <View style={StyleSheet.absoluteFill}>
        {/* Top-Left Deep Blue Glow */}
        <LinearGradient
          colors={['rgba(59,130,246,0.15)', 'transparent']}
          style={[styles.backgroundMesh, { top: 0, left: 0, width: '100%', height: '60%' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Bottom-Right Purple Glow */}
        <LinearGradient
          colors={['transparent', 'rgba(147,51,234,0.1)']}
          style={[styles.backgroundMesh, { bottom: 0, right: 0, width: '100%', height: '50%' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
                onPress={() => router.push('/streak')}
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

        {/* Floating Stats */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsRow}>
          <StatItem value={stats.todayCompleted} label="Completed" />
          <View style={styles.statDivider} />
          <StatItem value={`${focusMinutes}m`} label="Focus" />
          <View style={styles.statDivider} />
          <StatItem value={journalStreak} label="Streak" />
        </Animated.View>

        {/* Primary Action - Electric Focus Hero */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <Pressable
            onPress={handleFocus}
            style={({ pressed }) => [
              styles.focusHero,
              pressed && { transform: [{ scale: 0.99 }] }
            ]}
          >
            {/* Electric Gradient Border */}
            <LinearGradient
              colors={['rgba(59,130,246,0.5)', 'rgba(147,51,234,0.3)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {/* Inner Content Mask */}
            <View style={styles.focusHeroInner}>
              {/* Deep Inner Gradient */}
              <LinearGradient
                colors={['rgba(15,23,42,0.95)', 'rgba(15,23,42,0.8)']}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.focusHeroContent}>
                <View>
                  <Text style={styles.focusHeroTitle}>Deep Focus</Text>
                  <Text style={styles.focusHeroSubtitle}>
                    {focusMinutes > 0 ? `${focusMinutes}m completed today` : 'Start your first session'}
                  </Text>
                </View>
                <View style={styles.playButton}>
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="play" size={20} color="#fff" />
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

  // Header
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

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statValue: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(255,255,255,0.1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textTertiary,
    letterSpacing: 0.1,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: spacing.lg,
  },

  // Section
  section: {
    marginBottom: spacing.lg,
  },

  // Focus Hero
  focusHero: {
    height: 100,
    borderRadius: radii.xl,
    overflow: 'hidden',
    padding: 1, // For border
  },
  focusHeroInner: {
    flex: 1,
    borderRadius: radii.xl - 1,
    overflow: 'hidden',
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
    overflow: 'hidden',
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // Bento Grid
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
  bentoCardContainer: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  bentoContent: {
    flex: 1,
    padding: spacing.md,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.textSecondary,
    letterSpacing: 0.1,
  },
  bentoTitleAccent: {
    color: colors.dark.background,
  },

  // Task List in Bento
  taskList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  taskCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.dark.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxDone: {
    backgroundColor: colors.dark.text,
    borderColor: colors.dark.text,
  },
  taskTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.text,
    flex: 1,
    letterSpacing: -0.2,
  },
  taskTitleDone: {
    color: colors.dark.textTertiary,
    textDecorationLine: 'line-through',
    opacity: 0.5,
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

  // Mini Stat
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

  // Card Label
  cardLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.text,
    marginTop: 'auto',
    letterSpacing: 0.1,
  },
});

export default Dashboard;
