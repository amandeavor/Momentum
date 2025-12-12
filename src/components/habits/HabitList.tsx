import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import HabitCard from './HabitCard';
import { DbHabit, HabitCompletion } from '@/types/database';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface HabitListProps {
  habits: DbHabit[];
  completions?: HabitCompletion[];
  onHabitPress: (habitId: string) => void;
}

const HabitList: React.FC<HabitListProps> = ({ habits, completions = [], onHabitPress }) => {
  const isCompletedToday = (habitId: string) => 
    completions.some(c => c.habit_id === habitId);

  const renderItem = ({ item }: { item: DbHabit }) => (
    <HabitCard 
      habit={item} 
      onPress={() => onHabitPress(item.id)} 
      isCompletedToday={isCompletedToday(item.id)}
    />
  );

  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No habits yet</Text>
        <Text style={styles.emptySubtext}>Create your first habit to start tracking</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={habits}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.dark.textSecondary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.dark.textTertiary,
    marginTop: spacing.xs,
  },
});

export default HabitList;