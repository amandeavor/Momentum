/**
 * Habits Screen
 * 
 * Displays the user's active habits in a grid layout.
 * Optimized for performance using FlatList and memoized components.
 * 
 * Features:
 * - Grid layout (two columns)
 * - Create/Edit/Delete habit
 * - Daily check-in
 * - Streak display
 * 
 * @module HabitsScreen
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  FlatList,
  ListRenderItem
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useHabits } from '@/hooks/useHabits';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { DbHabit } from '@/types/database';
import Input from '@/components/common/Input';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - (spacing.lg * 2) - COLUMN_GAP) / 2;

/**
 * Props for the individual Habit Card component.
 */
interface HabitCardProps {
  habit: DbHabit;
  isCompleted: boolean;
  onCheckIn: () => void;
  onLongPress: () => void;
  index: number;
}

/**
 * Renders a single habit card with gradient background and status.
 * Memoized to prevent unnecessary re-renders.
 */
const HabitCard = React.memo(({ habit, isCompleted, onCheckIn, onLongPress, index }: HabitCardProps) => {
  const habitColor = habit.color || colors.dark.pastelBlue;

  // Premium Gradient for Completed State (Rich & Deep)
  const completedGradient = useMemo(() => ['rgba(16,185,129,0.2)', 'rgba(5,150,105,0.1)'], []);

  // Subtle Gradient for Incomplete State
  const incompleteGradient = useMemo(() => ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'], []);

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).duration(400)}
      style={{ width: CARD_WIDTH, marginBottom: COLUMN_GAP }}
    >
      <Pressable
        style={[
          styles.habitCard,
          isCompleted && styles.habitCardCompleted,
          !isCompleted && { borderColor: 'rgba(255,255,255,0.08)' }
        ]}
        onPress={onCheckIn}
        onLongPress={onLongPress}
        delayLongPress={500}
      >
        {/* Gradient Background */}
        <LinearGradient
          colors={isCompleted ? completedGradient as any : incompleteGradient as any}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Icon */}
        <View style={[
          styles.habitIcon,
          {
            backgroundColor: isCompleted ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
          }
        ]}>
          <Ionicons
            name={(habit.icon as any) || 'flash'}
            size={24}
            color={isCompleted ? '#fff' : habitColor}
          />
        </View>

        <View style={styles.habitInfo}>
          <Text style={[styles.habitTitle, isCompleted && styles.habitTitleCompleted]} numberOfLines={2}>
            {habit.title}
          </Text>

          <View style={styles.streakContainer}>
            <Ionicons
              name="flame"
              size={12}
              color={isCompleted ? '#fff' : '#f59e0b'}
            />
            <Text style={[styles.streakText, isCompleted && styles.streakTextCompleted]}>
              {habit.streak_count}
            </Text>
          </View>
        </View>

        {/* Checkmark Overlay (Subtle) */}
        {isCompleted && (
          <View style={styles.checkOverlay}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

/**
 * HabitsScreen Component
 */
const HabitsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { habits, completions, checkIn, removeHabit, editHabit } = useHabits();

  // Edit State
  const [editingHabit, setEditingHabit] = useState<DbHabit | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const activeHabits = useMemo(() => {
    return habits.filter(h => !h.is_archived);
  }, [habits]);

  const isCompletedToday = useCallback((habitId: string) => {
    return completions.some(
      c => c.habit_id === habitId && c.completed_at.startsWith(today)
    );
  }, [completions, today]);

  const handleCheckIn = useCallback(async (habitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await checkIn(habitId);
  }, [checkIn]);

  const handleAddHabit = useCallback(() => {
    router.push('/(main)/habits/habits-list');
  }, []);

  const handleLongPress = useCallback((habit: DbHabit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setEditingHabit(habit);
    setEditTitle(habit.title);
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = async () => {
    if (!editingHabit || !editTitle.trim()) return;

    setSaving(true);
    try {
      await editHabit(
        editingHabit.id,
        { title: editTitle.trim() }
      );
      setShowEditModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to update habit:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHabit = () => {
    if (!editingHabit) return;

    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeHabit(editingHabit.id);
              setShowEditModal(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Failed to delete habit:', error);
            }
          },
        },
      ]
    );
  };

  // Render item for FlatList
  const renderItem: ListRenderItem<DbHabit> = useCallback(({ item, index }) => (
    <HabitCard
      habit={item}
      index={index}
      isCompleted={isCompletedToday(item.id)}
      onCheckIn={() => handleCheckIn(item.id)}
      onLongPress={() => handleLongPress(item)}
    />
  ), [isCompletedToday, handleCheckIn, handleLongPress]);

  return (
    <View style={styles.container}>
      {/* Deep Green Background Glow */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(16,185,129,0.08)', 'transparent']}
          style={[styles.backgroundMesh, { height: '50%' }]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Hero Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <View>
          <Text style={styles.pageTitle}>Habits</Text>
          <Text style={styles.hintText}>Long press to edit</Text>
        </View>
        <Pressable onPress={() => router.push('/(main)/habits/habits-list')} style={styles.listButton}>
          <Ionicons name="list" size={24} color={colors.dark.text} />
        </Pressable>
      </View>

      {activeHabits.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emptyContainer}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="repeat" size={32} color={colors.dark.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtitle}>
              Start building positive routines
            </Text>
            <Pressable style={styles.emptyButton} onPress={handleAddHabit}>
              <Text style={styles.emptyButtonText}>Create Habit</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <FlatList
          data={activeHabits}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 }
          ]}
          columnWrapperStyle={{ gap: COLUMN_GAP }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowEditModal(false)} hitSlop={12}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Edit Habit</Text>
            <View style={styles.modalRightActions}>
              <Pressable onPress={handleDeleteHabit} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={22} color={colors.dark.error} />
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                disabled={!editTitle.trim() || saving}
                hitSlop={12}
              >
                <Text style={[
                  styles.modalSave,
                  (!editTitle.trim() || saving) && styles.modalSaveDisabled
                ]}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.modalContent}>
            <Input
              label="Habit Title"
              value={editTitle}
              onChangeText={setEditTitle}
              autoFocus
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0d',
  },
  backgroundMesh: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: colors.dark.text,
    letterSpacing: -1.2,
    marginBottom: 6,
    lineHeight: 44,
  },
  hintText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.dark.textTertiary,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  listButton: {
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  habitCard: {
    height: 140,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  habitCardCompleted: {
    borderColor: 'rgba(16,185,129,0.3)',
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitInfo: {
    gap: 4,
  },
  habitTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.text,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  habitTitleCompleted: {
    color: '#fff',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.textTertiary,
    letterSpacing: -0.1,
  },
  streakTextCompleted: {
    color: 'rgba(255,255,255,0.8)',
  },
  checkOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.text,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.dark.textTertiary,
    marginBottom: spacing.lg,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: colors.dark.text,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.background,
  },
  // Modal Styles
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
  modalRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deleteButton: {
    padding: 4,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.dark.textSecondary,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.text,
  },
  modalSave: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.dark.primary,
  },
  modalSaveDisabled: {
    color: colors.dark.textTertiary,
  },
  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});

export default HabitsScreen;
