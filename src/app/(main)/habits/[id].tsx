import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '@/hooks/useHabits';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import type { DbHabit } from '@/types/database';

const HabitDetail: React.FC = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { habits, completions, checkInHabit, loading } = useHabits();
    const habit = habits.find((h: DbHabit) => h.id === id);
    const isCompletedToday = completions.some(c => c.habit_id === id);

    const handleCheckIn = async () => {
        if (id) {
            await checkInHabit(id);
        }
    };

    if (!habit) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.dark.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Habit not found</Text>
                    <Button label="Go Back" onPress={() => router.back()} variant="secondary" />
                </View>
            </View>
        );
    }

    return (
        <ScrollView 
            style={[styles.container, { paddingTop: insets.top }]}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.dark.text} />
                </TouchableOpacity>
                <View style={[styles.colorDot, { backgroundColor: habit.color || colors.dark.pastelBlue }]} />
            </View>

            <Text style={styles.title}>{habit.title}</Text>
            {habit.description && (
                <Text style={styles.description}>{habit.description}</Text>
            )}

            {/* Streak Card */}
            <Card variant="surface" padding="lg" style={styles.streakCard}>
                <View style={styles.streakRow}>
                    <View style={styles.streakItem}>
                        <Ionicons name="flame" size={28} color={habit.streak_count > 0 ? colors.dark.pastelOrange : colors.dark.textTertiary} />
                        <Text style={styles.streakValue}>{habit.streak_count}</Text>
                        <Text style={styles.streakLabel}>Current Streak</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.streakItem}>
                        <Ionicons name="trophy" size={28} color={colors.dark.pastelYellow} />
                        <Text style={styles.streakValue}>{habit.best_streak}</Text>
                        <Text style={styles.streakLabel}>Best Streak</Text>
                    </View>
                </View>
            </Card>

            {/* Info Section */}
            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Ionicons name="repeat" size={20} color={colors.dark.textTertiary} />
                    <Text style={styles.infoLabel}>Frequency</Text>
                    <Text style={styles.infoValue}>{habit.frequency}</Text>
                </View>
                {habit.reminder_time && (
                    <View style={styles.infoRow}>
                        <Ionicons name="alarm-outline" size={20} color={colors.dark.textTertiary} />
                        <Text style={styles.infoLabel}>Reminder</Text>
                        <Text style={styles.infoValue}>{habit.reminder_time}</Text>
                    </View>
                )}
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.dark.textTertiary} />
                    <Text style={styles.infoLabel}>Created</Text>
                    <Text style={styles.infoValue}>
                        {new Date(habit.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            {/* Check-in Button */}
            <Button
                label={isCompletedToday ? "Completed Today ✓" : "Check In"}
                onPress={handleCheckIn}
                disabled={isCompletedToday}
                loading={loading}
                fullWidth
                style={styles.checkInButton}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark.background,
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    title: {
        ...typography.h1,
        color: colors.dark.text,
        marginBottom: spacing.xs,
    },
    description: {
        ...typography.body,
        color: colors.dark.textSecondary,
        marginBottom: spacing.lg,
    },
    streakCard: {
        marginBottom: spacing.lg,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakItem: {
        flex: 1,
        alignItems: 'center',
    },
    streakValue: {
        ...typography.h1,
        color: colors.dark.text,
        marginTop: spacing.xs,
    },
    streakLabel: {
        ...typography.caption,
        color: colors.dark.textTertiary,
        marginTop: spacing.xxs,
    },
    divider: {
        width: 1,
        height: 60,
        backgroundColor: colors.dark.border,
    },
    infoSection: {
        marginBottom: spacing.lg,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.dark.border,
    },
    infoLabel: {
        ...typography.body,
        color: colors.dark.textSecondary,
        marginLeft: spacing.sm,
        flex: 1,
    },
    infoValue: {
        ...typography.body,
        color: colors.dark.text,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    checkInButton: {
        marginTop: spacing.md,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    emptyText: {
        ...typography.h3,
        color: colors.dark.textSecondary,
    },
});

export default HabitDetail;