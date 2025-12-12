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
import * as Haptics from 'expo-haptics';
import { Todo } from '@/types/database';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface TaskCardProps {
  task: Todo;
  onPress?: () => void;
  onToggleComplete?: () => void;
  index?: number;
}

const PRIORITY_CONFIG = {
  high: { 
    color: colors.dark.error, 
    label: 'High',
    icon: 'alert-circle' as const,
  },
  medium: { 
    color: colors.dark.warning, 
    label: 'Medium',
    icon: 'remove-circle' as const,
  },
  low: { 
    color: colors.dark.pastelBlue, 
    label: 'Low',
    icon: 'arrow-down-circle' as const,
  },
};

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onPress, 
  onToggleComplete,
  index = 0,
}) => {
  const scale = useSharedValue(1);
  const { title, description, due_date, completed, priority } = task;
  const priorityConfig = priority ? PRIORITY_CONFIG[priority] : null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleToggle = () => {
    if (onToggleComplete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggleComplete();
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dueDateStr = formatDueDate(due_date);
  const isOverdue = dueDateStr === 'Overdue' && !completed;

  return (
    <Animated.View
      entering={FadeIn.delay(index * 40).duration(250)}
      layout={Layout.springify()}
    >
      <AnimatedPressable 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          animatedStyle,
          completed && styles.cardCompleted,
        ]}
      >
        {/* Checkbox */}
        <Pressable 
          style={styles.checkboxContainer} 
          onPress={handleToggle}
          hitSlop={12}
        >
          <View style={[
            styles.checkbox,
            completed && styles.checkboxDone,
            priorityConfig && !completed && { borderColor: priorityConfig.color },
          ]}>
            {completed && (
              <Ionicons name="checkmark" size={14} color={colors.dark.background} />
            )}
          </View>
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          <Text 
            style={[styles.title, completed && styles.titleCompleted]} 
            numberOfLines={2}
          >
            {title}
          </Text>
          
          {description && !completed && (
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          )}
          
          {/* Meta Row */}
          <View style={styles.metaRow}>
            {dueDateStr && (
              <View style={[
                styles.dueBadge,
                isOverdue && styles.overdueBadge,
              ]}>
                <Ionicons 
                  name="calendar-outline" 
                  size={12} 
                  color={isOverdue ? colors.dark.error : colors.dark.textTertiary} 
                />
                <Text style={[
                  styles.dueText,
                  isOverdue && styles.overdueText,
                ]}>
                  {dueDateStr}
                </Text>
              </View>
            )}
            
            {priorityConfig && !completed && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '20' }]}>
                <Ionicons name={priorityConfig.icon} size={10} color={priorityConfig.color} />
                <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                  {priorityConfig.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        {onPress && (
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={colors.dark.textTertiary} 
          />
        )}
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: spacing.sm,
  },
  cardCompleted: {
    opacity: 0.7,
  },
  checkboxContainer: {
    padding: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.dark.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.dark.success,
    borderColor: colors.dark.success,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.styles.body,
    fontWeight: '500',
    color: colors.dark.text,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.dark.textTertiary,
  },
  description: {
    ...typography.styles.caption,
    color: colors.dark.textTertiary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overdueBadge: {
    // Additional styling for overdue
  },
  dueText: {
    ...typography.styles.caption,
    fontSize: 11,
    color: colors.dark.textTertiary,
  },
  overdueText: {
    color: colors.dark.error,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  priorityText: {
    ...typography.styles.caption,
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TaskCard;
export { TaskCard };