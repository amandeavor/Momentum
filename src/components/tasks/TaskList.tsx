import React from 'react';
import { FlatList, View, StyleSheet, Text } from 'react-native';
import TaskCard from './TaskCard';
import { Todo } from '@/types/database';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface TaskListProps {
  tasks: Todo[];
  onTaskPress: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  emptyMessage?: string;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onTaskPress, 
  onToggleComplete,
  emptyMessage = 'No tasks yet',
}) => {
  const renderItem = ({ item, index }: { item: Todo; index: number }) => (
    <TaskCard 
      task={item} 
      onPress={() => onTaskPress(item.id)} 
      onToggleComplete={onToggleComplete ? () => onToggleComplete(item.id) : undefined}
      index={index}
    />
  );

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.styles.body,
    color: colors.dark.textTertiary,
  },
});

export default TaskList;