import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { useGoals } from '@/hooks/useGoals';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { DbGoal } from '@/types/database';

const GoalsScreen: React.FC = () => {
  const { goals, milestones, loading, refresh } = useGoals();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleGoalPress = useCallback((goalId: string) => {
    router.push(`/goals/${goalId}`);
  }, []);

  const handleAddGoal = () => {
    router.push('/goals/new' as any);
  };

  // Separate by status
  const activeGoals = goals.filter((g: DbGoal) => g.status === 'active');
  const completedGoals = goals.filter((g: DbGoal) => g.status === 'completed');

  // Calculate overall stats
  const totalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum: number, g: DbGoal) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  return (
    <View style={styles.container}>
      {/* Hero Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.pageTitle}>Goals</Text>
            <Text style={styles.pageSubtitle}>Dream big, achieve bigger</Text>
          </View>
          <Pressable onPress={handleAddGoal} style={styles.addIconButton}>
            <LinearGradient
              colors={[colors.dark.pastelPurple, colors.dark.pastelPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addIconGradient}
            >
              <Ionicons name="add" size={22} color={colors.dark.background} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.dark.text}
          />
        }
      >
        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['rgba(196,181,253,0.15)', 'rgba(255,179,199,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsGradient}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(143,207,255,0.2)' }]}>
                    <Ionicons name="flag" size={18} color={colors.dark.pastelBlue} />
                  </View>
                  <Text style={styles.statValue}>{activeGoals.length}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(166,227,161,0.2)' }]}>
                    <Ionicons name="trophy" size={18} color={colors.dark.pastelGreen} />
                  </View>
                  <Text style={styles.statValue}>{completedGoals.length}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(196,181,253,0.2)' }]}>
                    <Ionicons name="trending-up" size={18} color={colors.dark.pastelPurple} />
                  </View>
                  <Text style={styles.statValue}>{totalProgress}%</Text>
                  <Text style={styles.statLabel}>Avg Progress</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Goals</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{activeGoals.length}</Text>
              </View>
            </View>
            <View style={styles.goalsList}>
              {activeGoals.map((goal: DbGoal, index: number) => (
                <Animated.View
                  key={goal.id}
                  entering={FadeInRight.delay(index * 50).duration(400)}
                >
                  <GoalItem goal={goal} onPress={() => handleGoalPress(goal.id)} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed</Text>
              <Ionicons name="trophy" size={16} color={colors.dark.success} />
            </View>
            <View style={styles.goalsList}>
              {completedGoals.map((goal: DbGoal, index: number) => (
                <Animated.View
                  key={goal.id}
                  entering={FadeInRight.delay(index * 50).duration(400)}
                >
                  <GoalItem goal={goal} onPress={() => handleGoalPress(goal.id)} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Empty State */}
        {goals.length === 0 && !loading && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="flag"
                  size={48}
                  color={colors.dark.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptySubtitle}>
                Set ambitious goals and track your progress towards achieving them
              </Text>
              <Pressable style={styles.emptyButton} onPress={handleAddGoal}>
                <LinearGradient
                  colors={[colors.dark.pastelPurple, colors.dark.pastelPink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyButtonGradient}
                >
                  <Ionicons name="flag" size={20} color={colors.dark.background} />
                  <Text style={styles.emptyButtonText}>Create Goal</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {goals.length > 0 && (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={handleAddGoal}
        >
          <LinearGradient
            colors={[colors.dark.pastelPurple, colors.dark.pastelPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={colors.dark.background} />
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
};

// Goal Item Component
interface GoalItemProps {
  goal: DbGoal;
  onPress: () => void;
}

const GoalItem: React.FC<GoalItemProps> = ({ goal, onPress }) => {
  const isCompleted = goal.status === 'completed';
  const progressColor = isCompleted ? colors.dark.success : colors.dark.pastelPurple;

  return (
    <Pressable style={styles.goalItem} onPress={onPress}>
      <View style={styles.goalHeader}>
        <View style={[styles.goalIcon, { backgroundColor: (goal.color || colors.dark.pastelPurple) + '20' }]}>
          <Ionicons
            name="flag"
            size={20}
            color={goal.color || colors.dark.pastelPurple}
          />
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
          {goal.target_date && (
            <Text style={styles.goalDate}>
              Due {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
        <View style={styles.goalProgressBadge}>
          <Text style={[styles.goalProgressText, { color: progressColor }]}>
            {goal.progress}%
          </Text>
        </View>
      </View>
      <View style={styles.goalProgressBar}>
        <View
          style={[
            styles.goalProgressFill,
            { width: `${goal.progress}%`, backgroundColor: progressColor }
          ]}
        />
      </View>
    </Pressable>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.dark.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    ...typography.body,
    color: colors.dark.textSecondary,
    marginTop: 4,
  },
  addIconButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  statsCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.dark.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark.text,
  },
  countBadge: {
    backgroundColor: 'rgba(196,181,253,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  countText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.dark.pastelPurple,
  },
  goalsList: {
    gap: spacing.sm,
  },
  goalItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
  },
  goalDate: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginTop: 2,
  },
  goalProgressBadge: {
    backgroundColor: 'rgba(196,181,253,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  goalProgressText: {
    ...typography.caption,
    fontWeight: '600',
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.dark.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.dark.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  emptyButtonText: {
    ...typography.body,
    color: colors.dark.background,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: colors.dark.pastelPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GoalsScreen;
