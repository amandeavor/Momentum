import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Habit } from '@/types/habit';

interface HabitCheckInProps {
    habit: Habit;
    onCheckIn: (habitId: string) => void;
}

const HabitCheckIn: React.FC<HabitCheckInProps> = ({ habit, onCheckIn }) => {
    const handleCheckIn = (): void => {
        onCheckIn(habit.id);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.habitName}>{habit.title}</Text>
            <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
                <Text style={styles.buttonText}>Check In</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    habitName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    checkInButton: {
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default HabitCheckIn;