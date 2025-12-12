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
import { DbHabit } from '@/types/database';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HabitCardProps {
  habit: DbHabit;
  onPress: () => void;
  onCheckIn?: () => void;
  isCompletedToday?: boolean;
  index?: number;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  onPress, 
  onCheckIn,
  isCompletedToday = false,
  index = 0,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleCheckIn = () => {
    if (onCheckIn && !isCompletedToday) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCheckIn();
    }
  };

  const habitColor = habit.color || colors.dark.pastelBlue;

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
        {/* Left color accent */}
        <View style={[styles.colorAccent, { backgroundColor: habitColor }]} />
        
        <View style={styles.content}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleSection}>
              {habit.icon && (
                <View style={[styles.iconContainer, { backgroundColor: habitColor + '20' }]}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                </View>
              )}
              <View style={styles.titleContainer}>
                <Text 
                  style={[styles.title, isCompletedToday && styles.completedTitle]} 
                  numberOfLines={1}
                >
                  {habit.title}
                </Text>
                <Text style={styles.frequency}>
                  {FREQUENCY_LABELS[habit.frequency] || habit.frequency}
                </Text>
              </View>
            </View>
            
            {/* Check-in Button */}
            <Pressable 
              style={[
                styles.checkButton,
                isCompletedToday && styles.checkButtonDone
              ]}
              onPress={handleCheckIn}
              hitSlop={8}
            >
              <Ionicons 
                name={isCompletedToday ? 'checkmark' : 'add'} 
                size={20} 
                color={isCompletedToday ? colors.dark.background : colors.dark.text} 
              />
            </Pressable>
          </View>
          
          {/* Description */}
          {habit.description && (
            <Text style={styles.description} numberOfLines={1}>
              {habit.description}
            </Text>
          )}
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.streakBadge}>
              <Ionicons 
                name="flame" 
                size={14} 
                color={habit.streak_count > 0 ? colors.dark.warning : colors.dark.textTertiary} 
              />
              <Text style={[
                styles.streakText,
                habit.streak_count > 0 && styles.activeStreak
              ]}>
                {habit.streak_count} {habit.streak_count === 1 ? 'day' : 'days'}
              </Text>
            </View>
            
            {habit.best_streak > 0 && (
              <View style={styles.bestStreak}>
                <Ionicons name="trophy-outline" size={12} color={colors.dark.pastelYellow} />
                <Text style={styles.bestStreakText}>Best: {habit.best_streak}</Text>
              </View>
            )}
            
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={colors.dark.textTertiary} 
            />
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
  },
  colorAccent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIcon: {
    fontSize: 18,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.styles.body,
    fontWeight: '600',
    color: colors.dark.text,
  },
  completedTitle: {
    color: colors.dark.textSecondary,
  },
  frequency: {
    ...typography.styles.caption,
    color: colors.dark.textTertiary,
    marginTop: 2,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark.elevated,
    borderWidth: 2,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDone: {
    backgroundColor: colors.dark.success,
    borderColor: colors.dark.success,
  },
  description: {
    ...typography.styles.caption,
    color: colors.dark.textSecondary,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    gap: spacing.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    ...typography.styles.caption,
    color: colors.dark.textTertiary,
    fontWeight: '500',
  },
  activeStreak: {
    color: colors.dark.warning,
  },
  bestStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  bestStreakText: {
    ...typography.styles.caption,
    color: colors.dark.pastelYellow,
  },
});

export default HabitCard;