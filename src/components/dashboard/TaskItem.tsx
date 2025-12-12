import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

/**
 * Props for the TaskItem component.
 */
interface TaskItemProps {
    /** The title of the task. */
    title: string;
    /** Whether the task is completed. */
    completed: boolean;
    /** The priority level of the task (unused visually in this minimal view but valid data). */
    priority: 'high' | 'medium' | 'low' | null;
    /** The index of the item in the list, used for animation delay. */
    index: number;
}

/**
 * TaskItem Component
 * 
 * A minimal representation of a task for the Dashboard list.
 * features an entry animation based on its index.
 * 
 * @component
 */
const TaskItem = ({
    title,
    completed,
    priority,
    index,
}: TaskItemProps) => {
    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).duration(300)}
            style={styles.taskItem}
        >
            {/* Checkbox visual indicator */}
            <View style={[styles.taskCheckbox, completed && styles.taskCheckboxDone]}>
                {completed && <Ionicons name="checkmark" size={10} color="#000" />}
            </View>

            {/* Task Title */}
            <Text style={[styles.taskTitle, completed && styles.taskTitleDone]} numberOfLines={1}>
                {title}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // converted from spacing.sm (approx)
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
});

export default memo(TaskItem);
