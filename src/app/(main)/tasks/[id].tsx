import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTasks } from '../../../hooks/useTasks';
import type { Todo } from '@/types/database';

const TaskDetail = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { todos } = useTasks();
    const task = todos.find((t: Todo) => t.id === id);

    if (!task) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Task not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.description}>{task.description}</Text>
            <Text style={styles.dueDate}>Due: {task.due_date}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 16,
        marginVertical: 10,
    },
    dueDate: {
        fontSize: 14,
        color: 'gray',
    },
});

export default TaskDetail;