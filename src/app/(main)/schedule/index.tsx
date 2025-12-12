import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import Header from '@/components/navigation/Header';
import GlassCard from '@/components/common/GlassCard';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import TimePickerModal from '@/components/common/TimePickerModal';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectTimeblockViewStyle, setTimeblockViewStyle } from '@/store/slices/settingsSlice';
import {
  fetchTimeblocks,
  createTimeblock,
  updateTimeblock,
  deleteTimeblock,
  moveTimeblock,
  optimisticMoveTimeblock,
  selectTimeblocks,
  selectTimeblocksLoading,
  selectSelectedDate,
} from '@/store/slices/timeblocksSlice';
import { selectAllTodos } from '@/store/slices/tasksSlice';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Timeblock } from '@/types/database';

const HOUR_HEIGHT = 60; // pixels per hour
const BLOCK_COLORS = [
  '#FFFFFF', // White
  '#E5E5E5', // Light Grey
  '#CCCCCC', // Medium Grey
  '#999999', // Dark Grey
  '#666666', // Darker Grey
  '#333333', // Charcoal
];
const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// Helper functions
const formatTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const snapToGrid = (minutes: number, gridSize: number = 15) => {
  return Math.round(minutes / gridSize) * gridSize;
};

// Draggable timeblock component for calendar view
interface DraggableBlockProps {
  block: Timeblock;
  onMove: (id: string, startTime: string, endTime: string) => void;
  onLongPress: () => void;
  onPress: () => void;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block, onMove, onLongPress, onPress }) => {
  const startMinutes = timeToMinutes(block.start_time);
  const endMinutes = timeToMinutes(block.end_time);
  const duration = endMinutes - startMinutes;

  const adjustedTop = (startMinutes - START_HOUR * 60) / 60 * HOUR_HEIGHT;
  const height = Math.max(duration / 60 * HOUR_HEIGHT, 30);

  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const startY = useSharedValue(0);

  const handleDragEnd = useCallback((offsetY: number) => {
    const deltaMinutes = snapToGrid(offsetY / HOUR_HEIGHT * 60);
    const newStartMinutes = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - duration, startMinutes + deltaMinutes));
    const newEndMinutes = newStartMinutes + duration;

    if (newStartMinutes !== startMinutes) {
      onMove(block.id, minutesToTime(newStartMinutes), minutesToTime(newEndMinutes));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [block.id, startMinutes, duration, onMove]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startY.value = translateY.value;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      translateY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(handleDragEnd)(translateY.value);
      translateY.value = withSpring(0);
    })
    .minDistance(10);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: isDragging.value ? 0.8 : 1,
    zIndex: isDragging.value ? 100 : 1,
  }));

  if (adjustedTop < 0 || adjustedTop > (END_HOUR - START_HOUR) * HOUR_HEIGHT) return null;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.calendarBlock,
          { top: adjustedTop, height },
          animatedStyle,
        ]}
      >
        <Pressable
          onLongPress={onLongPress}
          onPress={onPress}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.calendarBlockGradient,
              { backgroundColor: block.color, opacity: 0.2 }
            ]}
          >
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: block.color, opacity: 1 }} />
            <Text style={[styles.calendarBlockTitle, { color: '#fff', marginLeft: 8 }]} numberOfLines={1}>
              {block.title}
            </Text>
            {height > 40 && (
              <Text style={[styles.calendarBlockTime, { color: 'rgba(255,255,255,0.7)', marginLeft: 8 }]}>
                {formatTime(block.start_time)}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};

const ScheduleScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  // Redux state
  const savedViewStyle = useAppSelector(selectTimeblockViewStyle);
  const timeblocks = useAppSelector(selectTimeblocks);
  const loading = useAppSelector(selectTimeblocksLoading);
  const selectedDate = useAppSelector(selectSelectedDate);
  const tasks = useAppSelector(selectAllTodos);

  // Local state
  const [viewStyle, setViewStyleLocal] = useState<'list' | 'calendar'>(savedViewStyle || 'list');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Timeblock | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [newBlock, setNewBlock] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    color: BLOCK_COLORS[0],
    priority: 'medium' as 'low' | 'medium' | 'high',
    linkedTaskId: null as string | null,
  });

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Fetch timeblocks on mount
  useEffect(() => {
    dispatch(fetchTimeblocks(selectedDate));
  }, [dispatch, selectedDate]);

  // Sync view style with settings
  useEffect(() => {
    if (savedViewStyle) {
      setViewStyleLocal(savedViewStyle);
    }
  }, [savedViewStyle]);

  const handleViewStyleChange = (style: 'list' | 'calendar') => {
    setViewStyleLocal(style);
    dispatch(setTimeblockViewStyle(style));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchTimeblocks(selectedDate));
    setRefreshing(false);
  }, [dispatch, selectedDate]);

  const handleAddBlock = async () => {
    if (!newBlock.title.trim()) return;

    try {
      await dispatch(createTimeblock({
        title: newBlock.title,
        date: selectedDate,
        start_time: newBlock.startTime,
        end_time: newBlock.endTime,
        color: newBlock.color,
        priority: newBlock.priority,
      })).unwrap();

      setNewBlock({
        title: '',
        startTime: '09:00',
        endTime: '10:00',
        color: BLOCK_COLORS[0],
        priority: 'medium',
        linkedTaskId: null,
      });
      setShowAddModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert('Error', 'Failed to create timeblock');
    }
  };

  const handleUpdateBlock = async () => {
    if (!editingBlock || !newBlock.title.trim()) return;

    try {
      await dispatch(updateTimeblock({
        id: editingBlock.id,
        updates: {
          title: newBlock.title,
          start_time: newBlock.startTime,
          end_time: newBlock.endTime,
          color: newBlock.color,
          priority: newBlock.priority,
        },
      })).unwrap();

      setShowEditModal(false);
      setEditingBlock(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert('Error', 'Failed to update timeblock');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    Alert.alert(
      'Delete Timeblock',
      'Are you sure you want to delete this timeblock?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTimeblock(id)).unwrap();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete timeblock');
            }
          },
        },
      ]
    );
  };

  const handleMoveBlock = async (id: string, startTime: string, endTime: string) => {
    // Optimistic update
    dispatch(optimisticMoveTimeblock({ id, startTime, endTime }));

    try {
      await dispatch(moveTimeblock({ id, startTime, endTime })).unwrap();
    } catch (err) {
      // Refresh to revert optimistic update
      dispatch(fetchTimeblocks(selectedDate));
      Alert.alert('Error', 'Failed to move timeblock');
    }
  };

  const handleEditBlock = (block: Timeblock) => {
    setEditingBlock(block);
    setNewBlock({
      title: block.title,
      startTime: block.start_time,
      endTime: block.end_time,
      color: block.color,
      priority: block.priority,
      linkedTaskId: null,
    });
    setShowEditModal(true);
  };

  // Current time indicator position
  const now = new Date();
  const currentTimeTop = ((now.getHours() * 60 + now.getMinutes()) - START_HOUR * 60) / 60 * HOUR_HEIGHT;

  // Filter timeblocks for today
  const todaysBlocks = timeblocks.filter(tb => tb.date === selectedDate);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Header
          title="Schedule"
          showBack
          onBack={() => router.back()}
          rightAction={
            <Pressable onPress={() => setShowAddModal(true)} hitSlop={12}>
              <Ionicons name="add" size={24} color={colors.dark.text} />
            </Pressable>
          }
        />

        {/* Date & View Toggle */}
        <View style={styles.dateHeader}>
          <View>
            <Text style={styles.dayName}>{dayName}</Text>
            <Text style={styles.dateStr}>{dateStr}</Text>
          </View>
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.viewButton, viewStyle === 'list' && styles.viewButtonActive]}
              onPress={() => handleViewStyleChange('list')}
            >
              <Ionicons
                name="list"
                size={18}
                color={viewStyle === 'list' ? colors.dark.text : colors.dark.textTertiary}
              />
            </Pressable>
            <Pressable
              style={[styles.viewButton, viewStyle === 'calendar' && styles.viewButtonActive]}
              onPress={() => handleViewStyleChange('calendar')}
            >
              <Ionicons
                name="grid"
                size={18}
                color={viewStyle === 'calendar' ? colors.dark.text : colors.dark.textTertiary}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || loading}
              onRefresh={onRefresh}
              tintColor={colors.dark.text}
            />
          }
        >
          {viewStyle === 'list' ? (
            // LIST VIEW
            <View style={styles.listView}>
              {todaysBlocks.length === 0 ? (
                <GlassCard padding="lg">
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={44} color={colors.dark.textTertiary} />
                    <Text style={styles.emptyTitle}>No timeblocks</Text>
                    <Text style={styles.emptySubtitle}>
                      Plan your day by adding timeblocks
                    </Text>
                    <Button
                      label="Add Timeblock"
                      variant="secondary"
                      onPress={() => setShowAddModal(true)}
                      style={styles.emptyButton}
                    />
                  </View>
                </GlassCard>
              ) : (
                todaysBlocks.map((block, index) => (
                  <Animated.View
                    key={block.id}
                    entering={FadeInDown.delay(index * 50).duration(300)}
                  >
                    <Pressable
                      onPress={() => handleEditBlock(block)}
                      onLongPress={() => handleDeleteBlock(block.id)}
                      style={styles.listItem}
                    >
                      <View style={[styles.listItemBar, { backgroundColor: block.color }]} />
                      <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>{block.title}</Text>
                        <Text style={styles.listItemTime}>
                          {formatTime(block.start_time)} - {formatTime(block.end_time)}
                        </Text>
                      </View>
                      <View style={[styles.priorityBadge, {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: block.priority === 'high' ? '#fff' : 'rgba(255,255,255,0.2)'
                      }]}>
                        <Text style={[styles.priorityText, {
                          color: '#fff'
                        }]}>{block.priority}</Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))
              )}
            </View>
          ) : (
            // CALENDAR VIEW with Drag & Drop
            <View style={styles.calendarView}>
              <View style={styles.timeColumn}>
                {HOURS.map((hour) => (
                  <View key={hour} style={styles.timeSlot}>
                    <Text style={styles.timeLabel}>
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.blocksColumn}>
                {/* Hour lines */}
                {HOURS.map((hour) => (
                  <View key={hour} style={styles.hourLine} />
                ))}

                {/* Current time indicator */}
                {now.getHours() >= START_HOUR && now.getHours() <= END_HOUR && (
                  <View style={[styles.currentTimeIndicator, { top: currentTimeTop }]}>
                    <View style={styles.currentTimeDot} />
                    <View style={styles.currentTimeLine} />
                  </View>
                )}

                {/* Draggable Timeblocks */}
                {todaysBlocks.map((block) => (
                  <DraggableBlock
                    key={block.id}
                    block={block}
                    onMove={handleMoveBlock}
                    onLongPress={() => handleDeleteBlock(block.id)}
                    onPress={() => handleEditBlock(block)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Floating Add Button */}
        <Pressable style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={26} color={colors.dark.background} />
        </Pressable>

        {/* Add Timeblock Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={12}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>New Timeblock</Text>
              <Pressable
                onPress={handleAddBlock}
                disabled={!newBlock.title.trim()}
                hitSlop={12}
              >
                <Text style={[
                  styles.modalSave,
                  !newBlock.title.trim() && styles.modalSaveDisabled
                ]}>Save</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <Input
                label="Title"
                placeholder="What are you working on?"
                value={newBlock.title}
                onChangeText={(text) => setNewBlock(prev => ({ ...prev, title: text }))}
                autoFocus
              />

              <View style={styles.timeRow}>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.timeButtonLabel}>Start</Text>
                  <Text style={styles.timeButtonValue}>{formatTime(newBlock.startTime)}</Text>
                </Pressable>
                <Ionicons name="arrow-forward" size={20} color={colors.dark.textTertiary} />
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.timeButtonLabel}>End</Text>
                  <Text style={styles.timeButtonValue}>{formatTime(newBlock.endTime)}</Text>
                </Pressable>
              </View>

              {/* Link to Task */}
              <Text style={styles.pickerLabel}>Link to Task (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taskScroller}>
                <Pressable
                  style={[
                    styles.taskChip,
                    !newBlock.linkedTaskId && styles.taskChipSelected,
                  ]}
                  onPress={() => setNewBlock(prev => ({ ...prev, linkedTaskId: null }))}
                >
                  <Text style={[
                    styles.taskChipText,
                    !newBlock.linkedTaskId && styles.taskChipTextSelected,
                  ]}>None</Text>
                </Pressable>
                {tasks.slice(0, 10).map((task) => (
                  <Pressable
                    key={task.id}
                    style={[
                      styles.taskChip,
                      newBlock.linkedTaskId === task.id && styles.taskChipSelected,
                    ]}
                    onPress={() => setNewBlock(prev => ({ ...prev, linkedTaskId: task.id, title: prev.title || task.title }))}
                  >
                    <Text style={[
                      styles.taskChipText,
                      newBlock.linkedTaskId === task.id && styles.taskChipTextSelected,
                    ]} numberOfLines={1}>{task.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.pickerLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {BLOCK_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newBlock.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewBlock(prev => ({ ...prev, color }))}
                  >
                    {newBlock.color === color && (
                      <Ionicons name="checkmark" size={18} color={colors.dark.background} />
                    )}
                  </Pressable>
                ))}
              </View>

              <Text style={styles.pickerLabel}>Priority</Text>
              <View style={styles.priorityPicker}>
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <Pressable
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newBlock.priority === priority && styles.priorityOptionSelected,
                    ]}
                    onPress={() => setNewBlock(prev => ({ ...prev, priority }))}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      newBlock.priority === priority && styles.priorityOptionTextSelected,
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Edit Timeblock Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowEditModal(false)} hitSlop={12}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Edit Timeblock</Text>
              <Pressable
                onPress={handleUpdateBlock}
                disabled={!newBlock.title.trim()}
                hitSlop={12}
              >
                <Text style={[
                  styles.modalSave,
                  !newBlock.title.trim() && styles.modalSaveDisabled
                ]}>Save</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <Input
                label="Title"
                placeholder="What are you working on?"
                value={newBlock.title}
                onChangeText={(text) => setNewBlock(prev => ({ ...prev, title: text }))}
              />

              <View style={styles.timeRow}>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.timeButtonLabel}>Start</Text>
                  <Text style={styles.timeButtonValue}>{formatTime(newBlock.startTime)}</Text>
                </Pressable>
                <Ionicons name="arrow-forward" size={20} color={colors.dark.textTertiary} />
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.timeButtonLabel}>End</Text>
                  <Text style={styles.timeButtonValue}>{formatTime(newBlock.endTime)}</Text>
                </Pressable>
              </View>

              <Text style={styles.pickerLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {BLOCK_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newBlock.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewBlock(prev => ({ ...prev, color }))}
                  >
                    {newBlock.color === color && (
                      <Ionicons name="checkmark" size={18} color={colors.dark.background} />
                    )}
                  </Pressable>
                ))}
              </View>

              <Text style={styles.pickerLabel}>Priority</Text>
              <View style={styles.priorityPicker}>
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <Pressable
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newBlock.priority === priority && styles.priorityOptionSelected,
                    ]}
                    onPress={() => setNewBlock(prev => ({ ...prev, priority }))}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      newBlock.priority === priority && styles.priorityOptionTextSelected,
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {editingBlock && (
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => {
                    setShowEditModal(false);
                    handleDeleteBlock(editingBlock.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.dark.error} />
                  <Text style={styles.deleteButtonText}>Delete Timeblock</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Time Pickers */}
        <TimePickerModal
          visible={showStartPicker}
          onClose={() => setShowStartPicker(false)}
          value={newBlock.startTime}
          onSave={(time) => setNewBlock(prev => ({ ...prev, startTime: time }))}
          title="Start Time"
        />
        <TimePickerModal
          visible={showEndPicker}
          onClose={() => setShowEndPicker(false)}
          value={newBlock.endTime}
          onSave={(time) => setNewBlock(prev => ({ ...prev, endTime: time }))}
          title="End Time"
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dayName: {
    ...typography.h3,
    color: colors.dark.text,
  },
  dateStr: {
    ...typography.caption,
    color: colors.dark.textSecondary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surface,
    borderRadius: radii.md,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.dark.elevated,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  // List view styles
  listView: {
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  listItemBar: {
    width: 4,
    height: '100%',
  },
  listItemContent: {
    flex: 1,
    padding: spacing.md,
  },
  listItemTitle: {
    ...typography.body,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 2,
  },
  listItemTime: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priorityText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  // Calendar view styles
  calendarView: {
    flexDirection: 'row',
    minHeight: (END_HOUR - START_HOUR) * HOUR_HEIGHT,
  },
  timeColumn: {
    width: 50,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  timeLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textAlign: 'right',
    paddingRight: 8,
  },
  blocksColumn: {
    flex: 1,
    position: 'relative',
  },
  hourLine: {
    height: HOUR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginLeft: -4,
  },
  currentTimeLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#fff',
  },
  calendarBlock: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  calendarBlockGradient: {
    flex: 1,
    padding: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  calendarBlockTitle: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  calendarBlockTime: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
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
  modalCancel: {
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
  },
  modalTitle: {
    ...typography.h3,
    color: '#fff',
  },
  modalSave: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
  },
  timeButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeButtonLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  timeButtonValue: {
    ...typography.h3,
    color: '#fff',
  },
  pickerLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  priorityPicker: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priorityOptionSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  priorityOptionText: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.6)',
  },
  priorityOptionTextSelected: {
    color: '#000',
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  deleteButtonText: {
    ...typography.body,
    color: colors.dark.error,
  },
  taskScroller: {
    marginBottom: spacing.lg,
  },
  taskChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  taskChipSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  taskChipText: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.6)',
  },
  taskChipTextSelected: {
    color: '#000',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: '#fff',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
});

export default ScheduleScreen;
