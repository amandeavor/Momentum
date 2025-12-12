import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HabitStreakProps {
  streakCount: number;
  habitName: string;
}

const HabitStreak: React.FC<HabitStreakProps> = ({ streakCount, habitName }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.habitName}>{habitName}</Text>
      <Text style={styles.streakCount}>{`Current Streak: ${streakCount}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginVertical: 8,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakCount: {
    fontSize: 16,
    color: '#555',
  },
});

export default HabitStreak;