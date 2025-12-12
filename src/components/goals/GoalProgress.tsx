import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProgressBar from '@/components/common/ProgressBar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface GoalProgressProps {
  goalTitle: string;
  currentProgress: number;
  targetProgress: number;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ goalTitle, currentProgress, targetProgress }) => {
  const progressPercentage = targetProgress > 0 ? (currentProgress / targetProgress) * 100 : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{goalTitle}</Text>
      <ProgressBar progress={progressPercentage} />
      <Text style={styles.progressText}>
        {Math.round(currentProgress)} / {targetProgress}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginVertical: spacing.sm,
  },
  title: {
    ...typography.h4,
    color: colors.dark.text,
    marginBottom: spacing.sm,
  },
  progressText: {
    marginTop: spacing.sm,
    ...typography.caption,
    color: colors.dark.textSecondary,
  },
});

export default GoalProgress;