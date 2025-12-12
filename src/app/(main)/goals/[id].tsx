import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGoals } from '@/hooks/useGoals';
import { DbGoal } from '@/types/database';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import ProgressBar from '@/components/common/ProgressBar';
import Button from '@/components/common/Button';

const GoalDetail: React.FC = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { goals, milestones, loading, toggleMilestoneComplete } = useGoals();
    const goal = goals.find((g: DbGoal) => g.id === id);
    const goalMilestones = milestones.filter(m => m.goal_id === id);

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (!goal) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
                        <Ionicons name="arrow-back" size={24} color={colors.dark.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Goal not found</Text>
                    <Button label="Go Back" onPress={() => router.back()} variant="secondary" />
                </View>
            </View>
        );
    }

    const statusColors: Record<string, string> = {
        active: colors.dark.pastelBlue,
        completed: colors.dark.success,
        paused: colors.dark.warning,
        abandoned: colors.dark.textMuted,
    };

    return (
        <ScrollView 
            style={[styles.container, { paddingTop: insets.top }]} 
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
                    <Ionicons name="arrow-back" size={24} color={colors.dark.text} />
                </TouchableOpacity>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[goal.status] || colors.dark.pastelBlue }]}>
                    <Text style={styles.statusText}>{goal.status.toUpperCase()}</Text>
                </View>
            </View>

            <Text style={styles.title}>{goal.title}</Text>
            {goal.description && (
                <Text style={styles.description}>{goal.description}</Text>
            )}

            <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                    <Text style={styles.sectionLabel}>Progress</Text>
                    <Text style={styles.progressPercent}>{goal.progress}%</Text>
                </View>
                <ProgressBar progress={goal.progress} />
            </View>

            {/* Milestones */}
            {goalMilestones.length > 0 && (
                <View style={styles.milestonesSection}>
                    <Text style={styles.sectionLabel}>Milestones</Text>
                    {goalMilestones.map(milestone => (
                        <TouchableOpacity
                            key={milestone.id}
                            style={styles.milestoneRow}
                            onPress={() => toggleMilestoneComplete(milestone.id)}
                        >
                            <Ionicons 
                                name={milestone.achieved ? 'checkmark-circle' : 'ellipse-outline'} 
                                size={22} 
                                color={milestone.achieved ? colors.dark.success : colors.dark.textTertiary} 
                            />
                            <Text style={[
                                styles.milestoneText,
                                milestone.achieved && styles.milestoneCompleted
                            ]}>
                                {milestone.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {goal.target_date && (
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.dark.textTertiary} />
                    <Text style={styles.infoLabel}>Target Date</Text>
                    <Text style={styles.infoValue}>
                        {new Date(goal.target_date).toLocaleDateString()}
                    </Text>
                </View>
            )}

            {goal.category && (
                <View style={styles.infoRow}>
                    <Ionicons name="folder-outline" size={18} color={colors.dark.textTertiary} />
                    <Text style={styles.infoLabel}>Category</Text>
                    <Text style={styles.infoValue}>{goal.category}</Text>
                </View>
            )}

            <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={colors.dark.textTertiary} />
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                    {new Date(goal.created_at).toLocaleDateString()}
                </Text>
            </View>
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
    backIcon: {
        padding: spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.dark.textInverse,
        letterSpacing: 0.5,
    },
    title: {
        ...typography.h1,
        color: colors.dark.text,
        marginBottom: spacing.xs,
    },
    description: {
        ...typography.body,
        color: colors.dark.textSecondary,
        lineHeight: 24,
        marginBottom: spacing.lg,
    },
    progressSection: {
        backgroundColor: colors.dark.surface,
        padding: spacing.md,
        borderRadius: 16,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.dark.border,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionLabel: {
        ...typography.label,
        color: colors.dark.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    progressPercent: {
        ...typography.h3,
        color: colors.dark.success,
    },
    milestonesSection: {
        marginBottom: spacing.lg,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.dark.surface,
        borderRadius: 12,
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: colors.dark.border,
    },
    milestoneText: {
        ...typography.body,
        color: colors.dark.text,
        marginLeft: spacing.sm,
        flex: 1,
    },
    milestoneCompleted: {
        textDecorationLine: 'line-through',
        color: colors.dark.textSecondary,
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
    },
    loadingText: {
        ...typography.body,
        color: colors.dark.textTertiary,
        textAlign: 'center',
        marginTop: spacing.xl,
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

export default GoalDetail;