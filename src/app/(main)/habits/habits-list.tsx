import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Modal } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Input from '@/components/common/Input';
import { useHabits } from '@/hooks/useHabits';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { DbHabit } from '@/types/database';

const HABIT_COLORS = [
    { color: colors.dark.pastelBlue, gradient: ['#8fcfff', '#6bb8f0'] },
    { color: colors.dark.pastelGreen, gradient: ['#a6e3a1', '#7dd67a'] },
    { color: colors.dark.pastelPurple, gradient: ['#c4b5fd', '#a78bfa'] },
    { color: colors.dark.pastelPeach, gradient: ['#fcd5b5', '#f5c094'] },
    { color: colors.dark.pastelPink, gradient: ['#ffb3c7', '#f99cb3'] },
    { color: colors.dark.warning, gradient: ['#ffd93d', '#f0c929'] },
];

const HABIT_ICONS = [
    'fitness', 'water', 'book', 'walk', 'bed', 'musical-notes',
    'restaurant', 'leaf', 'heart', 'sunny', 'moon', 'flash',
];

const HabitsListScreen: React.FC = () => {
    const { habits, completions, loading, checkIn, refresh, addHabit } = useHabits();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [showNewHabit, setShowNewHabit] = useState(false);
    const [newHabit, setNewHabit] = useState<{
        title: string;
        color: string;
        icon: string;
    }>({
        title: '',
        color: colors.dark.pastelBlue,
        icon: 'flash',
    });
    const [saving, setSaving] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const isCompletedToday = useCallback((habitId: string) => {
        return completions.some(
            c => c.habit_id === habitId && c.completed_at.startsWith(today)
        );
    }, [completions, today]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const handleCheckIn = useCallback(async (habitId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await checkIn(habitId);
    }, [checkIn]);

    const handleAddHabit = () => {
        setShowNewHabit(true);
    };

    const handleSaveHabit = async () => {
        if (!newHabit.title.trim()) return;

        setSaving(true);
        try {
            await addHabit({
                title: newHabit.title.trim(),
                color: newHabit.color,
                icon: newHabit.icon,
                frequency: 'daily',
            });
            setNewHabit({ title: '', color: colors.dark.pastelBlue, icon: 'flash' });
            setShowNewHabit(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to create habit:', error);
        } finally {
            setSaving(false);
        }
    };

    // Separate active and archived habits
    const activeHabits = habits.filter(h => !h.is_archived);
    const todayCompleted = activeHabits.filter(h => isCompletedToday(h.id)).length;
    const totalActive = activeHabits.length;
    const progress = totalActive > 0 ? (todayCompleted / totalActive) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* Hero Header */}
            <View style={[styles.header, { paddingTop: spacing.md }]}>
                <View style={styles.headerContent}>
                    <Text style={styles.pageTitle}>Habits</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Pressable onPress={() => router.back()} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.dark.text} />
                        </Pressable>
                    </View>
                </View>

                {/* Progress Card */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                    <View style={styles.progressCard}>
                        <LinearGradient
                            colors={['rgba(166,227,161,0.15)', 'rgba(143,207,255,0.08)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.progressGradient}
                        >
                            <View style={styles.progressHeader}>
                                <View>
                                    <Text style={styles.progressLabel}>Today's Habits</Text>
                                    <Text style={styles.progressStats}>
                                        {todayCompleted} of {totalActive} completed
                                    </Text>
                                </View>
                                <View style={styles.progressRing}>
                                    {todayCompleted === totalActive && totalActive > 0 ? (
                                        <Ionicons name="checkmark" size={24} color={colors.dark.pastelGreen} />
                                    ) : (
                                        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: `${progress}%` }]} />
                            </View>
                            <Text style={styles.progressSubtext}>
                                {totalActive === 0
                                    ? 'Create your first habit to get started'
                                    : todayCompleted === totalActive
                                        ? 'All habits completed for today!'
                                        : `${totalActive - todayCompleted} habits remaining`}
                            </Text>
                        </LinearGradient>
                    </View>
                </Animated.View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 120 },
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.dark.text}
                    />
                }
            >
                {/* Habits List */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Your Habits</Text>
                        <Text style={styles.sectionCount}>{totalActive} active</Text>
                    </View>

                    {activeHabits.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons
                                    name="trending-up"
                                    size={48}
                                    color={colors.dark.textTertiary}
                                />
                            </View>
                            <Text style={styles.emptyTitle}>No habits yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Build consistent routines by tracking your daily habits
                            </Text>
                            <Pressable style={styles.emptyButton} onPress={handleAddHabit}>
                                <LinearGradient
                                    colors={[colors.dark.pastelGreen, '#6bcf9e']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.emptyButtonGradient}
                                >
                                    <Ionicons name="add" size={20} color={colors.dark.background} />
                                    <Text style={styles.emptyButtonText}>Create Habit</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.habitsList}>
                            {activeHabits.map((habit: DbHabit, index: number) => (
                                <Animated.View
                                    key={habit.id}
                                    entering={FadeInRight.delay(index * 50).duration(400)}
                                >
                                    <HabitItem
                                        habit={habit}
                                        isCompleted={isCompletedToday(habit.id)}
                                        onCheckIn={() => handleCheckIn(habit.id)}
                                    />
                                </Animated.View>
                            ))}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Floating Add Button */}
            {activeHabits.length > 0 && (
                <Pressable
                    style={[styles.fab, { bottom: insets.bottom + 24 }]}
                    onPress={handleAddHabit}
                >
                    <LinearGradient
                        colors={[colors.dark.pastelGreen, '#6bcf9e']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.fabGradient}
                    >
                        <Ionicons name="add" size={28} color={colors.dark.background} />
                    </LinearGradient>
                </Pressable>
            )}

            {/* New Habit Modal */}
            <Modal
                visible={showNewHabit}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowNewHabit(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Pressable onPress={() => setShowNewHabit(false)} hitSlop={12}>
                            <Text style={styles.modalCancel}>Cancel</Text>
                        </Pressable>
                        <Text style={styles.modalTitle}>New Habit</Text>
                        <Pressable
                            onPress={handleSaveHabit}
                            disabled={!newHabit.title.trim() || saving}
                            hitSlop={12}
                        >
                            <Text style={[
                                styles.modalSave,
                                (!newHabit.title.trim() || saving) && styles.modalSaveDisabled
                            ]}>
                                {saving ? 'Saving...' : 'Create'}
                            </Text>
                        </Pressable>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <Input
                            label="Habit Name"
                            placeholder="e.g., Drink 8 glasses of water"
                            value={newHabit.title}
                            onChangeText={(text) =>
                                setNewHabit((prev) => ({ ...prev, title: text }))
                            }
                            autoFocus
                        />

                        <Text style={styles.pickerLabel}>Color</Text>
                        <View style={styles.colorPicker}>
                            {HABIT_COLORS.map((item, index) => (
                                <Pressable
                                    key={index}
                                    style={styles.colorOption}
                                    onPress={() => setNewHabit((prev) => ({ ...prev, color: item.color }))}
                                >
                                    <LinearGradient
                                        colors={item.gradient as [string, string]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[
                                            styles.colorGradient,
                                            newHabit.color === item.color && styles.colorOptionSelected,
                                        ]}
                                    >
                                        {newHabit.color === item.color && (
                                            <Ionicons name="checkmark" size={20} color={colors.dark.background} />
                                        )}
                                    </LinearGradient>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={styles.pickerLabel}>Icon</Text>
                        <View style={styles.iconPicker}>
                            {HABIT_ICONS.map((icon) => (
                                <Pressable
                                    key={icon}
                                    style={[
                                        styles.iconOption,
                                        newHabit.icon === icon && styles.iconOptionSelected,
                                    ]}
                                    onPress={() => setNewHabit((prev) => ({ ...prev, icon }))}
                                >
                                    <Ionicons
                                        name={icon as any}
                                        size={22}
                                        color={newHabit.icon === icon ? colors.dark.text : colors.dark.textSecondary}
                                    />
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

// Habit Item Component
interface HabitItemProps {
    habit: DbHabit;
    isCompleted: boolean;
    onCheckIn: () => void;
}

const HabitItem: React.FC<HabitItemProps> = ({ habit, isCompleted, onCheckIn }) => {
    const habitColor = habit.color || colors.dark.pastelBlue;

    return (
        <Pressable
            style={[styles.habitItem, isCompleted && styles.habitItemCompleted]}
            onPress={onCheckIn}
        >
            <View style={[styles.habitIcon, { backgroundColor: habitColor + '20' }]}>
                <Ionicons
                    name={(habit.icon as any) || 'flash'}
                    size={22}
                    color={habitColor}
                />
            </View>
            <View style={styles.habitContent}>
                <Text style={[styles.habitTitle, isCompleted && styles.habitTitleCompleted]}>
                    {habit.title}
                </Text>
                {habit.description && (
                    <Text style={styles.habitDescription}>{habit.description}</Text>
                )}
            </View>
            <View style={[styles.habitCheckbox, isCompleted && { backgroundColor: colors.dark.success }]}>
                {isCompleted && (
                    <Ionicons name="checkmark" size={16} color={colors.dark.background} />
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark.background,
        paddingTop: 16,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    pageTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: colors.dark.text,
        letterSpacing: -0.5,
    },
    addIconButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    addIconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.dark.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressCard: {
        borderRadius: radii.xl,
        overflow: 'hidden',
    },
    progressGradient: {
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    progressLabel: {
        ...typography.bodySmall,
        color: colors.dark.textSecondary,
        marginBottom: 4,
    },
    progressStats: {
        ...typography.h3,
        color: colors.dark.text,
    },
    progressRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(166,227,161,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.dark.pastelGreen,
    },
    progressPercent: {
        ...typography.bodySmall,
        fontWeight: '700',
        color: colors.dark.text,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.dark.pastelGreen,
        borderRadius: 3,
    },
    progressSubtext: {
        ...typography.caption,
        color: colors.dark.textTertiary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.dark.text,
    },
    sectionCount: {
        ...typography.caption,
        color: colors.dark.textTertiary,
    },
    habitsList: {
        gap: spacing.xs,
    },
    habitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    habitItemCompleted: {
        backgroundColor: 'rgba(166,227,161,0.08)',
        borderColor: 'rgba(166,227,161,0.15)',
    },
    habitIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    habitContent: {
        flex: 1,
    },
    habitTitle: {
        ...typography.body,
        color: colors.dark.text,
        fontWeight: '500',
    },
    habitTitleCompleted: {
        color: colors.dark.textSecondary,
    },
    habitDescription: {
        ...typography.caption,
        color: colors.dark.textTertiary,
        marginTop: 2,
    },
    habitCheckbox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.dark.textTertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
    },
    emptyIconContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.dark.text,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        ...typography.body,
        color: colors.dark.textTertiary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    emptyButton: {
        borderRadius: radii.full,
        overflow: 'hidden',
    },
    emptyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.full,
    },
    emptyButtonText: {
        ...typography.body,
        color: colors.dark.background,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: spacing.lg,
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: colors.dark.pastelGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: colors.dark.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    modalCancel: {
        ...typography.body,
        color: colors.dark.textSecondary,
    },
    modalTitle: {
        ...typography.h3,
        color: colors.dark.text,
    },
    modalSave: {
        ...typography.body,
        color: colors.dark.pastelGreen,
        fontWeight: '600',
    },
    modalSaveDisabled: {
        color: colors.dark.textTertiary,
    },
    modalContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    pickerLabel: {
        ...typography.caption,
        color: colors.dark.textSecondary,
        marginTop: spacing.xl,
        marginBottom: spacing.sm,
    },
    colorPicker: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    colorOption: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    colorGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: colors.dark.text,
    },
    iconPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    iconOption: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    iconOptionSelected: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: colors.dark.text,
        borderWidth: 2,
    },
});

export default HabitsListScreen;
