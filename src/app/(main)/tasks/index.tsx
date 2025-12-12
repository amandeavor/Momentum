/**
 * Tasks Screen - Todo Management
 * 
 * The main interface for managing user tasks.
 * Optimized for performance using partial list updates and memoized handlers.
 * 
 * Features:
 * - Filter by Today/All/Completed
 * - Create/Edit/Delete tasks
 * - Priority management
 * - Offline support via Redux
 * 
 * @module TasksScreen
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Input from '@/components/common/Input';
import { useTasks } from '@/hooks/useTasks';
import { spacing, radii } from '@/theme/spacing';
import type { Todo } from '@/types/database';

/**
 * Filter options for the task list.
 */
type FilterType = 'all' | 'today' | 'completed';

/**
 * Priority levels for tasks.
 */
type PriorityType = 'high' | 'medium' | 'low' | undefined;

/**
 * Configuration for priority options in the modal.
 */
const PRIORITY_OPTIONS: { label: string; value: 'high' | 'medium' | 'low'; color: string }[] = [
  { label: 'High', value: 'high', color: '#fff' },
  { label: 'Medium', value: 'medium', color: '#999' },
  { label: 'Low', value: 'low', color: '#666' },
];

/**
 * Task Item Component
 * 
 * Renders a single task card with glassmorphism effect.
 * Memoized via React.memo (implicit if extraction needed) for list performance.
 */
const TaskItem = React.memo(({
  task,
  onToggle,
  onPress,
  index,
}: {
  task: Todo;
  onToggle: () => void;
  onPress: () => void;
  index: number;
}) => {
  const priorityColor = task.priority
    ? {
      high: '#fff',
      medium: '#999',
      low: '#666',
    }[task.priority]
    : null;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(400)}
      style={styles.taskItemWrapper}
    >
      <Pressable style={styles.taskItemContainer} onPress={onPress}>
        <BlurView intensity={60} tint="dark" style={styles.taskItemBlur}>
          <View style={styles.taskItemContent}>
            <Pressable onPress={onToggle} hitSlop={8}>
              <View style={styles.taskCheckbox}>
                {task.completed ? (
                  <View style={styles.checkboxDone}>
                    <Ionicons name="checkmark" size={14} color="#000" />
                  </View>
                ) : (
                  <View style={styles.checkbox} />
                )}
              </View>
            </Pressable>

            <View style={styles.taskContent}>
              <Text
                style={[styles.taskTitle, task.completed && styles.taskTitleDone]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              {task.description && (
                <Text style={styles.taskDescription} numberOfLines={1}>
                  {task.description}
                </Text>
              )}
            </View>

            {priorityColor && !task.completed && (
              <View style={[styles.taskPriority, { backgroundColor: priorityColor }]} />
            )}
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
});

/**
 * TasksScreen Component
 * 
 * Main container for the todo list feature.
 * Uses FlatList for efficient rendering of large lists.
 */
const TasksScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    todos,
    todaysTodos,
    completedTodos,
    loading,
    createTodo,
    updateTodo,
    toggleComplete,
    removeTodo,
    refresh,
  } = useTasks();

  // Local UI State
  const [filter, setFilter] = useState<FilterType>('today');
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [editingTask, setEditingTask] = useState<Todo | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    priority: undefined as PriorityType,
  });
  const [saving, setSaving] = useState(false);

  /**
   * Handles pull-to-refresh action.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  /**
   * Opens the modal for creating a new task.
   */
  const openCreateModal = useCallback(() => {
    setEditingTask(null);
    setTaskForm({ title: '', priority: undefined });
    setShowModal(true);
  }, []);

  /**
   * Opens the modal for editing an existing task.
   */
  const openEditModal = useCallback((task: Todo) => {
    setEditingTask(task);
    setTaskForm({ title: task.title, priority: task.priority });
    setShowModal(true);
  }, []);

  /**
   * Saves the task (create or update) to the backend.
   */
  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return;

    setSaving(true);
    try {
      if (editingTask) {
        await updateTodo(
          editingTask.id,
          {
            title: taskForm.title.trim(),
            priority: taskForm.priority,
          }
        );
      } else {
        const today = new Date().toISOString().split('T')[0];
        await createTodo({
          title: taskForm.title.trim(),
          priority: taskForm.priority,
          due_date: today,
        });
      }
      setShowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to save task:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Deletes the currently editing task after confirmation.
   */
  const handleDeleteTask = () => {
    if (!editingTask) return;

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTodo(editingTask.id);
              setShowModal(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Failed to delete task:', error);
            }
          },
        },
      ]
    );
  };

  /**
   * Toggles completion status with haptic feedback.
   */
  const handleToggleComplete = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleComplete(id);
  }, [toggleComplete]);

  // Derived State based on filter
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'today':
        return todaysTodos;
      case 'completed':
        return completedTodos;
      default:
        return todos;
    }
  }, [filter, todaysTodos, completedTodos, todos]);

  // Separate tasks for section headers if showing all
  const { incompleteTasks, doneTasks } = useMemo(() => {
    return {
      incompleteTasks: filteredTasks.filter((t) => !t.completed),
      doneTasks: filteredTasks.filter((t) => t.completed),
    };
  }, [filteredTasks]);

  // Combined data for FlatList to handle sections roughly
  // For simplicity in this view, we'll render a single list. 
  // If 'all' or 'today' is selected, we show incomplete first.
  // If 'completed' is selected, we just show completed.
  const displayData = useMemo(() => {
    if (filter === 'completed') return filteredTasks;
    // Show incomplete, then a header for completed if any
    return [...incompleteTasks, ...doneTasks];
  }, [filter, filteredTasks, incompleteTasks, doneTasks]);

  /**
   * Render function for FlatList items.
   */
  const renderItem: ListRenderItem<Todo> = useCallback(({ item, index }) => (
    <TaskItem
      task={item}
      index={index}
      onToggle={() => handleToggleComplete(item.id)}
      onPress={() => openEditModal(item)}
    />
  ), [handleToggleComplete, openEditModal]);

  return (
    <View style={styles.container}>
      {/* List Container */}
      <FlatList
        data={displayData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + 120
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.pageTitle}>Tasks</Text>
              <Text style={styles.pageSubtitle}>
                {incompleteTasks.length} remaining
              </Text>
            </View>

            {/* Filter Pills */}
            <View style={styles.filters}>
              {(['today', 'all', 'completed'] as FilterType[]).map((f) => (
                <Pressable
                  key={f}
                  style={[styles.filterPill, filter === f && styles.filterPillActive]}
                  onPress={() => setFilter(f)}
                >
                  <BlurView
                    intensity={filter === f ? 80 : 40}
                    tint="dark"
                    style={styles.filterBlur}
                  >
                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </BlurView>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.emptyContainer}>
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="checkbox-outline"
                  size={32}
                  color="rgba(255,255,255,0.3)"
                />
              </View>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'completed'
                  ? 'Complete some tasks to see them here'
                  : 'Tap + to add a task'}
              </Text>
            </View>
          </Animated.View>
        }
      />

      {/* Floating Add Button */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={openCreateModal}
      >
        <Ionicons name="add" size={28} color="#000" />
      </Pressable>

      {/* Task Modal (Create/Edit) */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowModal(false)} hitSlop={12}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </Text>
            <View style={styles.modalRightActions}>
              {editingTask && (
                <Pressable onPress={handleDeleteTask} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                </Pressable>
              )}
              <Pressable
                onPress={handleSaveTask}
                disabled={!taskForm.title.trim() || saving}
                hitSlop={12}
              >
                <Text style={[
                  styles.modalSave,
                  (!taskForm.title.trim() || saving) && styles.modalSaveDisabled
                ]}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.modalContent}>
            <Input
              label="What needs to be done?"
              placeholder="Enter task title"
              value={taskForm.title}
              onChangeText={(text) =>
                setTaskForm((prev) => ({ ...prev, title: text }))
              }
              autoFocus={!editingTask}
              activeBorderColor="#fff"
              inactiveBorderColor="rgba(255,255,255,0.1)"
              inputStyle={{ color: '#fff' }}
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <Text style={styles.priorityLabel}>Priority</Text>
            <View style={styles.priorityOptions}>
              {PRIORITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.priorityOption,
                    taskForm.priority === option.value && styles.priorityOptionSelected,
                  ]}
                  onPress={() =>
                    setTaskForm((prev) => ({
                      ...prev,
                      priority: prev.priority === option.value ? undefined : option.value,
                    }))
                  }
                >
                  <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
                  <Text style={[
                    styles.priorityText,
                    taskForm.priority === option.value && styles.priorityTextSelected
                  ]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContent: {
    paddingTop: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1.5,
    marginBottom: 8,
    lineHeight: 46,
  },
  pageSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.3,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  filterPill: {
    borderRadius: radii.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterPillActive: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  filterBlur: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.1,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // List Item Styles
  taskItemWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  taskItemContainer: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  taskItemBlur: {
    overflow: 'hidden',
  },
  taskItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
  },
  taskCheckbox: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  checkboxDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
    letterSpacing: -0.3,
    fontWeight: '500',
  },
  taskTitleDone: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'line-through',
  },
  taskDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  taskPriority: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },

  // Empty State
  emptyContainer: {
    paddingTop: spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 1.5,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 22,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    fontSize: 17,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.4,
  },
  modalSave: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
  },
  modalSaveDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priorityOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.2,
  },
  priorityTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TasksScreen;
