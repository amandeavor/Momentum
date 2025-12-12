/**
 * New Goal Screen
 * 
 * Create a new goal with milestones.
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { useGoals } from '@/hooks/useGoals';
import GlassCard from '@/components/common/GlassCard';

interface MilestoneInput {
    id: string;
    title: string;
}

const CATEGORIES = [
    { id: 'health', label: 'Health', icon: 'fitness-outline' as const, color: '#10b981' },
    { id: 'career', label: 'Career', icon: 'briefcase-outline' as const, color: '#3b82f6' },
    { id: 'learning', label: 'Learning', icon: 'book-outline' as const, color: '#8b5cf6' },
    { id: 'finance', label: 'Finance', icon: 'wallet-outline' as const, color: '#f59e0b' },
    { id: 'personal', label: 'Personal', icon: 'person-outline' as const, color: '#ec4899' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as const, color: '#6b7280' },
];

export default function NewGoalScreen() {
    const insets = useSafeAreaInsets();
    const { addGoal, loading } = useGoals();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetDate, setTargetDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
    const [selectedCategory, setSelectedCategory] = useState<string>('personal');
    const [milestones, setMilestones] = useState<MilestoneInput[]>([]);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleAddMilestone = () => {
        if (!newMilestoneTitle.trim()) return;
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMilestones([
            ...milestones,
            { id: Date.now().toString(), title: newMilestoneTitle.trim() },
        ]);
        setNewMilestoneTitle('');
    };

    const handleRemoveMilestone = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMilestones(milestones.filter(m => m.id !== id));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a goal title');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await addGoal({
                title: title.trim(),
                description: description.trim() || undefined,
                target_date: targetDate.toISOString(),
                progress: 0,
                status: 'active',
                category: selectedCategory,
            });
            router.back();
        } catch (error) {
            console.error('Error saving goal:', error);
            Alert.alert('Error', 'Failed to save goal. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getDaysRemaining = () => {
        const diff = targetDate.getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Pressable onPress={handleCancel} hitSlop={12}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Text style={styles.headerTitle}>New Goal</Text>
                <Pressable
                    onPress={handleSave}
                    disabled={!title.trim() || saving}
                    hitSlop={12}
                >
                    <Text style={[
                        styles.saveText,
                        (!title.trim() || saving) && styles.saveTextDisabled
                    ]}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <View style={styles.section}>
                    <Text style={styles.label}>What's your goal?</Text>
                    <TextInput
                        style={styles.titleInput}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g., Run a marathon"
                        placeholderTextColor={colors.dark.textTertiary}
                        autoFocus
                        maxLength={100}
                    />
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.label}>Description (optional)</Text>
                    <TextInput
                        style={styles.descriptionInput}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Why is this goal important to you?"
                        placeholderTextColor={colors.dark.textTertiary}
                        multiline
                        numberOfLines={3}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                </View>

                {/* Category */}
                <View style={styles.section}>
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.categoriesGrid}>
                        {CATEGORIES.map((category) => (
                            <Pressable
                                key={category.id}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === category.id && {
                                        backgroundColor: `${category.color}20`,
                                        borderColor: category.color,
                                    },
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedCategory(category.id);
                                }}
                            >
                                <Ionicons
                                    name={category.icon}
                                    size={18}
                                    color={selectedCategory === category.id ? category.color : colors.dark.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.categoryText,
                                        selectedCategory === category.id && { color: category.color },
                                    ]}
                                >
                                    {category.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Target Date */}
                <View style={styles.section}>
                    <Text style={styles.label}>Target Date</Text>
                    <Pressable
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <View style={styles.dateInfo}>
                            <Ionicons name="calendar-outline" size={20} color={colors.dark.primary} />
                            <Text style={styles.dateText}>{formatDate(targetDate)}</Text>
                        </View>
                        <View style={styles.dateBadge}>
                            <Text style={styles.dateBadgeText}>
                                {getDaysRemaining()} days
                            </Text>
                        </View>
                    </Pressable>

                    {showDatePicker && (
                        <DateTimePicker
                            value={targetDate}
                            mode="date"
                            display="spinner"
                            minimumDate={new Date()}
                            onChange={(event, date) => {
                                setShowDatePicker(Platform.OS === 'ios');
                                if (date) setTargetDate(date);
                            }}
                            textColor={colors.dark.text}
                        />
                    )}
                </View>

                {/* Milestones */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.label}>Milestones</Text>
                        <Text style={styles.milestoneCount}>
                            {milestones.length} added
                        </Text>
                    </View>
                    <Text style={styles.helperText}>
                        Break your goal into smaller, achievable steps
                    </Text>

                    {/* Add milestone input */}
                    <View style={styles.milestoneInputRow}>
                        <TextInput
                            style={styles.milestoneInput}
                            value={newMilestoneTitle}
                            onChangeText={setNewMilestoneTitle}
                            placeholder="Add a milestone..."
                            placeholderTextColor={colors.dark.textTertiary}
                            onSubmitEditing={handleAddMilestone}
                            returnKeyType="done"
                            maxLength={100}
                        />
                        <Pressable
                            style={[
                                styles.addMilestoneButton,
                                !newMilestoneTitle.trim() && styles.addMilestoneButtonDisabled,
                            ]}
                            onPress={handleAddMilestone}
                            disabled={!newMilestoneTitle.trim()}
                        >
                            <Ionicons
                                name="add"
                                size={20}
                                color={newMilestoneTitle.trim() ? '#fff' : colors.dark.textTertiary}
                            />
                        </Pressable>
                    </View>

                    {/* Milestones list */}
                    {milestones.length > 0 && (
                        <View style={styles.milestonesList}>
                            {milestones.map((milestone, index) => (
                                <View key={milestone.id} style={styles.milestoneItem}>
                                    <View style={styles.milestoneNumber}>
                                        <Text style={styles.milestoneNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.milestoneTitle} numberOfLines={2}>
                                        {milestone.title}
                                    </Text>
                                    <Pressable
                                        style={styles.removeMilestone}
                                        onPress={() => handleRemoveMilestone(milestone.id)}
                                        hitSlop={8}
                                    >
                                        <Ionicons name="close" size={16} color={colors.dark.textTertiary} />
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    )}

                    {milestones.length === 0 && (
                        <View style={styles.emptyMilestones}>
                            <Ionicons name="flag-outline" size={32} color={colors.dark.textTertiary} />
                            <Text style={styles.emptyMilestonesText}>
                                No milestones yet
                            </Text>
                        </View>
                    )}
                </View>

                {/* Tips */}
                <GlassCard style={styles.tipsCard}>
                    <View style={styles.tipsHeader}>
                        <Ionicons name="bulb-outline" size={18} color={colors.dark.primary} />
                        <Text style={styles.tipsTitle}>Tips for effective goals</Text>
                    </View>
                    <Text style={styles.tipText}>• Be specific and measurable</Text>
                    <Text style={styles.tipText}>• Set a realistic timeline</Text>
                    <Text style={styles.tipText}>• Break into 3-5 milestones</Text>
                    <Text style={styles.tipText}>• Review progress weekly</Text>
                </GlassCard>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.dark.border,
    },
    cancelText: {
        ...typography.body,
        color: colors.dark.textSecondary,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.dark.text,
    },
    saveText: {
        ...typography.body,
        color: colors.dark.text,
        fontWeight: '600',
    },
    saveTextDisabled: {
        color: colors.dark.textTertiary,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        ...typography.bodySmall,
        color: colors.dark.textSecondary,
        fontWeight: '600',
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    helperText: {
        ...typography.caption,
        color: colors.dark.textTertiary,
        marginBottom: spacing.md,
    },
    titleInput: {
        ...typography.h2,
        color: colors.dark.text,
        padding: spacing.md,
        backgroundColor: colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.dark.border,
    },
    descriptionInput: {
        ...typography.body,
        color: colors.dark.text,
        padding: spacing.md,
        backgroundColor: colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.dark.border,
        minHeight: 100,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        backgroundColor: colors.dark.surface,
        borderWidth: 1,
        borderColor: colors.dark.border,
    },
    categoryText: {
        ...typography.bodySmall,
        color: colors.dark.textSecondary,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.dark.border,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    dateText: {
        ...typography.body,
        color: colors.dark.text,
    },
    dateBadge: {
        backgroundColor: `${colors.dark.primary}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    dateBadgeText: {
        ...typography.caption,
        color: colors.dark.primary,
        fontWeight: '600',
    },
    milestoneCount: {
        ...typography.caption,
        color: colors.dark.textTertiary,
        marginBottom: spacing.sm,
    },
    milestoneInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    milestoneInput: {
        flex: 1,
        ...typography.body,
        color: colors.dark.text,
        padding: spacing.md,
        backgroundColor: colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.dark.border,
    },
    addMilestoneButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addMilestoneButtonDisabled: {
        backgroundColor: colors.dark.surface,
    },
    milestonesList: {
        gap: spacing.sm,
    },
    milestoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.dark.border,
        gap: spacing.sm,
    },
    milestoneNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: `${colors.dark.primary}20`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    milestoneNumberText: {
        ...typography.caption,
        color: colors.dark.primary,
        fontWeight: '700',
    },
    milestoneTitle: {
        flex: 1,
        ...typography.body,
        color: colors.dark.text,
    },
    removeMilestone: {
        padding: spacing.xs,
    },
    emptyMilestones: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        backgroundColor: colors.dark.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.dark.border,
        borderStyle: 'dashed',
    },
    emptyMilestonesText: {
        ...typography.bodySmall,
        color: colors.dark.textTertiary,
        marginTop: spacing.sm,
    },
    tipsCard: {
        padding: spacing.lg,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    tipsTitle: {
        ...typography.bodySmall,
        color: colors.dark.text,
        fontWeight: '600',
    },
    tipText: {
        ...typography.caption,
        color: colors.dark.textSecondary,
        marginBottom: spacing.xs,
    },
});
