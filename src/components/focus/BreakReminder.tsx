import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BreakReminder = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.reminderText}>Time for a break!</Text>
            <Text style={styles.instructionText}>Take a few minutes to relax and recharge.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    reminderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    instructionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

export default BreakReminder;