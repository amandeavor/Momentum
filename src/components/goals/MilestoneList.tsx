import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface MilestoneListProps {
  milestones: Milestone[];
}

const MilestoneList: React.FC<MilestoneListProps> = ({ milestones }) => {
  if (milestones.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: Milestone }) => (
    <View style={styles.milestoneContainer}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} 
          size={20} 
          color={item.completed ? colors.dark.pastelGreen : colors.dark.textTertiary} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, item.completed && styles.completedTitle]}>
          {item.title}
        </Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Milestones</Text>
      <FlatList
        data={milestones}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.dark.text,
    marginBottom: spacing.sm,
  },
  milestoneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  iconContainer: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '500',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: colors.dark.textSecondary,
  },
  description: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    marginTop: 2,
  },
});

export default MilestoneList;