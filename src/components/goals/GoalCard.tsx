import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { DbGoal } from '@/types/database';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GoalCardProps {
  goal: DbGoal;
  onPress?: () => void;
  index?: number;
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: colors.dark.pastelBlue, icon: 'rocket-outline' as const },
  completed: { label: 'Completed', color: colors.dark.success, icon: 'trophy-outline' as const },
  paused: { label: 'Paused', color: colors.dark.warning, icon: 'pause-outline' as const },
  abandoned: { label: 'Abandoned', color: colors.dark.textTertiary, icon: 'close-outline' as const },
};

const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress, index = 0 }) => {
  const scale = useSharedValue(1);
  const progress = goal.progress || 0;
  const statusConfig = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getTimeRemaining = () => {
    if (!goal.target_date) return null;
    const target = new Date(goal.target_date);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    if (diffDays < 7) return `${diffDays} days left`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks left`;
    return `${Math.ceil(diffDays / 30)} months left`;
  };

  const goalColor = goal.color || colors.dark.pastelPurple;
  const timeRemaining = getTimeRemaining();

  return (
    <Animated.View
      entering={FadeIn.delay(index * 60).duration(300)}
      layout={Layout.springify()}
    >
      <AnimatedPressable 
        style={[styles.card, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: goalColor + '20' }]}>
            <Ionicons 
              name="flag" 
              size={18} 
              color={goalColor} 
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{goal.title}</Text>
            {goal.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{goal.category}</Text>
              </View>
            )}
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={colors.dark.textTertiary} 
          />
        </View>

        {/* Description */}
        {goal.description && (
          <Text style={styles.description} numberOfLines={2}>
            {goal.description}
          </Text>
        )}

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${Math.min(progress, 100)}%`, backgroundColor: goalColor }
              ]} 
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          
          {timeRemaining && goal.status === 'active' && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={12} color={colors.dark.textTertiary} />
              <Text style={styles.timeText}>{timeRemaining}</Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.styles.body,
    fontWeight: '600',
    color: colors.dark.text,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.dark.elevated,
    borderRadius: radii.sm,
  },
  categoryText: {
    ...typography.styles.caption,
    fontSize: 10,
    color: colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    ...typography.styles.bodySmall,
    color: colors.dark.textSecondary,
    marginTop: spacing.sm,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.styles.caption,
    color: colors.dark.textTertiary,
  },
  progressPercent: {
    ...typography.styles.caption,
    color: colors.dark.text,
    fontWeight: '600',
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.dark.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusText: {
    ...typography.styles.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    ...typography.styles.caption,
    color: colors.dark.textTertiary,
  },
});

export default GoalCard;