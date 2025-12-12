/**
 * Journal Screen - Reflection & Diary
 * 
 * Allows users to write daily journal entries, track mood, and maintain a streak.
 * Optimized for performance with FlatList and memoized components.
 * 
 * Features:
 * - Create/Edit/Delete entries
 * - Daily streak tracking
 * - Mood selection
 * - Export functionality (Text, Markdown, JSON)
 * 
 * @module JournalScreen
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
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
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  selectAllEntries,
  selectJournalLoading,
  selectTodaysEntry,
  selectJournalStreak,
} from '@/store/selectors';
import { fetchEntries, addEntry, updateEntry, deleteEntry } from '@/store/slices/journalSlice';
import { recordActivity } from '@/store/slices/analyticsSlice';
import {
  copyJournalsToClipboard,
  shareJournalsAsFile,
  ExportFormat
} from '@/services/export';
import type { JournalInsert, Journal as JournalEntry } from '@/types/database';

/**
 * Mood emoji options available for selection.
 */
const MOOD_OPTIONS = ['😊', '😌', '😐', '😔', '😤', '🥱', '🤔', '😴'];

/**
 * Props for the ExportOption component.
 */
interface ExportOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
  disabled: boolean;
  fullWidth?: boolean;
}

/**
 * Renders a single export option card.
 */
const ExportOption = React.memo(({ icon, label, sublabel, color, onPress, disabled, fullWidth }: ExportOptionProps) => (
  <Pressable
    style={[
      styles.exportOptionCard,
      fullWidth ? styles.exportOptionFull : styles.exportOptionHalf,
      disabled && { opacity: 0.5 }
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={styles.exportIconContainer}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View>
      <Text style={styles.exportOptionLabel}>{label}</Text>
      <Text style={styles.exportOptionSublabel}>{sublabel}</Text>
    </View>
  </Pressable>
));

/**
 * Helper to format date strings relative to today.
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Journal Entry Item Component
 * 
 * Renders a single journal entry card.
 * Memoized for list performance.
 */
const JournalItem = React.memo(({ item, index, onPress }: { item: JournalEntry; index: number; onPress: () => void }) => (
  <Animated.View
    entering={FadeInRight.delay(index * 50).duration(400)}
  >
    <Pressable onPress={onPress}>
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          {item.mood && (
            <Text style={styles.entryMood}>{item.mood}</Text>
          )}
          <Text style={styles.entryDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <Text style={styles.entryBody} numberOfLines={3}>
          {item.body}
        </Text>
      </View>
    </Pressable>
  </Animated.View>
));

/**
 * JournalScreen Component
 * 
 * Main interface for the journal feature.
 */
export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectAllEntries);
  const loading = useAppSelector(selectJournalLoading);
  const todaysEntry = useAppSelector(selectTodaysEntry);
  const streak = useAppSelector(selectJournalStreak);

  // Local State
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Form State
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [entryForm, setEntryForm] = useState({ mood: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Initial fetch
  React.useEffect(() => {
    dispatch(fetchEntries({}));
  }, [dispatch]);

  /**
   * Refreshes the journal list.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchEntries({}));
    setRefreshing(false);
  }, [dispatch]);

  /**
   * Opens modal to create a new entry.
   */
  const openCreateModal = useCallback(() => {
    setEditingEntry(null);
    setEntryForm({ mood: '', body: '' });
    setShowModal(true);
  }, []);

  /**
   * Opens modal to edit an existing entry.
   */
  const openEditModal = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setEntryForm({ mood: entry.mood || '', body: entry.body });
    setShowModal(true);
  }, []);

  /**
   * Saves entry to backend.
   */
  const handleSaveEntry = async () => {
    if (!entryForm.body.trim()) return;

    setSaving(true);
    try {
      if (editingEntry) {
        await dispatch(updateEntry({
          id: editingEntry.id,
          updates: {
            mood: entryForm.mood || null,
            body: entryForm.body.trim(),
          }
        })).unwrap();
      } else {
        const entry: Omit<JournalInsert, 'user_id'> = {
          mood: entryForm.mood || null,
          body: entryForm.body.trim(),
        };
        await dispatch(addEntry(entry)).unwrap();
        // Record activity for streak tracking
        dispatch(recordActivity());
      }

      setEntryForm({ mood: '', body: '' });
      setShowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Deletes entry after confirmation.
   */
  const handleDeleteEntry = () => {
    if (!editingEntry) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteEntry(editingEntry.id)).unwrap();
              setShowModal(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Failed to delete entry:', error);
              Alert.alert('Error', 'Failed to delete entry.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handles export functionality.
   */
  const handleExport = async (format: ExportFormat, method: 'copy' | 'share') => {
    if (entries.length === 0) {
      Alert.alert('No Entries', 'There are no journal entries to export.');
      return;
    }

    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      let success: boolean;

      if (method === 'copy') {
        success = await copyJournalsToClipboard(entries, format);
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Copied!', `${entries.length} journal entries copied to clipboard.`);
        }
      } else {
        success = await shareJournalsAsFile(entries, format);
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      if (!success) {
        Alert.alert('Error', 'Failed to export entries. Please try again.');
      }

      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export entries. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Renders a single item in the FlatList.
   */
  const renderItem: ListRenderItem<JournalEntry> = useCallback(({ item, index }) => (
    <JournalItem item={item} index={index} onPress={() => openEditModal(item)} />
  ), [openEditModal]);

  return (
    <View style={styles.container}>
      {/* List Container with Header */}
      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 100 }
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
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.pageTitle}>Journal</Text>
                <View style={styles.headerActions}>
                  <Pressable
                    onPress={() => setShowExportModal(true)}
                    style={styles.headerButton}
                  >
                    <Ionicons name="download-outline" size={22} color="#fff" />
                  </Pressable>
                  <Pressable onPress={openCreateModal} style={styles.addIconButton}>
                    <View style={styles.addIconContent}>
                      <Ionicons name="add" size={22} color="#000" />
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Streak Card */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.streakContainer}>
              <View style={styles.streakCard}>
                <View style={styles.streakContent}>
                  <View style={styles.streakRow}>
                    <View style={styles.streakIcon}>
                      <Ionicons name="flame" size={26} color="#fff" />
                    </View>
                    <View style={styles.streakInfo}>
                      <Text style={styles.streakValue}>{streak} Day Streak</Text>
                      <Text style={styles.streakLabel}>
                        {todaysEntry
                          ? "You've reflected today!"
                          : 'Write to keep your streak'}
                      </Text>
                    </View>
                    {!todaysEntry && (
                      <Pressable onPress={openCreateModal}>
                        <View style={styles.writeButton}>
                          <Text style={styles.writeButtonText}>Write</Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>

            <Text style={styles.sectionHeader}>Your Reflections</Text>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.emptyStateContainer}>
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons
                    name="book-outline"
                    size={48}
                    color={colors.dark.textTertiary}
                  />
                </View>
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start your reflection journey
                </Text>
                <Pressable style={styles.emptyButton} onPress={openCreateModal}>
                  <View style={styles.emptyButtonContent}>
                    <Ionicons name="create" size={20} color={colors.dark.background} />
                    <Text style={styles.emptyButtonText}>Write First Entry</Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          ) : null
        }
      />

      {/* Entry Modal (Create/Edit) */}
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
              {editingEntry ? 'Edit Entry' : 'New Entry'}
            </Text>
            <View style={styles.modalRightActions}>
              {editingEntry && (
                <Pressable onPress={handleDeleteEntry} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={22} color={colors.dark.error} />
                </Pressable>
              )}
              <Pressable
                onPress={handleSaveEntry}
                disabled={!entryForm.body.trim() || saving}
                hitSlop={12}
              >
                <Text style={[
                  styles.modalSave,
                  (!entryForm.body.trim() || saving) && styles.modalSaveDisabled
                ]}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.moodLabel}>How are you feeling?</Text>
            <View style={styles.moodOptions}>
              {MOOD_OPTIONS.map((mood) => (
                <Pressable
                  key={mood}
                  style={[
                    styles.moodOption,
                    entryForm.mood === mood && styles.moodOptionSelected,
                  ]}
                  onPress={() =>
                    setEntryForm((prev) => ({
                      ...prev,
                      mood: prev.mood === mood ? '' : mood,
                    }))
                  }
                >
                  <Text style={styles.moodEmoji}>{mood}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.bodyInput}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.dark.textTertiary}
              value={entryForm.body}
              onChangeText={(text) =>
                setEntryForm((prev) => ({ ...prev, body: text }))
              }
              multiline
              textAlignVertical="top"
              autoFocus={!editingEntry}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.exportModalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowExportModal(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.dark.text} />
            </Pressable>
            <Text style={styles.modalTitle}>Export Journal</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.exportContent}>
            <Text style={styles.exportDescription}>
              Export your {entries.length} journal entries
            </Text>

            <View style={styles.exportSection}>
              <Text style={styles.exportSectionTitle}>Copy to Clipboard</Text>
              <View style={styles.bentoGrid}>
                <ExportOption
                  icon="document-text-outline"
                  label="Text"
                  sublabel="Plain text format"
                  color="#fff"
                  onPress={() => handleExport('text', 'copy')}
                  disabled={exporting}
                />
                <ExportOption
                  icon="logo-markdown"
                  label="Markdown"
                  sublabel="Formatted text"
                  color="#fff"
                  onPress={() => handleExport('markdown', 'copy')}
                  disabled={exporting}
                />
                <ExportOption
                  icon="code-outline"
                  label="JSON"
                  sublabel="Raw data"
                  color="#fff"
                  onPress={() => handleExport('json', 'copy')}
                  disabled={exporting}
                  fullWidth
                />
              </View>
            </View>

            <View style={styles.exportSection}>
              <Text style={styles.exportSectionTitle}>Share as File</Text>
              <View style={styles.bentoGrid}>
                <ExportOption
                  icon="share-outline"
                  label=".txt"
                  sublabel="Text file"
                  color="#fff"
                  onPress={() => handleExport('text', 'share')}
                  disabled={exporting}
                />
                <ExportOption
                  icon="share-outline"
                  label=".md"
                  sublabel="Markdown file"
                  color="#fff"
                  onPress={() => handleExport('markdown', 'share')}
                  disabled={exporting}
                />
                <ExportOption
                  icon="share-outline"
                  label=".json"
                  sublabel="JSON file"
                  color="#fff"
                  onPress={() => handleExport('json', 'share')}
                  disabled={exporting}
                  fullWidth
                />
              </View>
            </View>

            <View style={styles.tipCard}>
              <View style={styles.tipContent}>
                <Ionicons name="bulb" size={20} color="#fff" />
                <Text style={styles.tipText}>
                  Pro Tip: Copy as text to paste into AI for journaling insights and patterns.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  addIconButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addIconContent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  streakContainer: {
    marginBottom: spacing.lg,
  },
  streakCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  streakContent: {
    padding: spacing.lg,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    ...typography.h3,
    color: '#fff',
  },
  streakLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  writeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: '#fff',
  },
  writeButtonText: {
    ...typography.bodySmall,
    color: '#000',
    fontWeight: '600',
  },
  sectionHeader: {
    ...typography.h3,
    color: '#fff',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  entryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  entryMood: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  entryDate: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
  },
  entryBody: {
    ...typography.body,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  emptyStateContainer: {
    paddingTop: spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  emptyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    backgroundColor: '#fff',
  },
  emptyButtonText: {
    ...typography.body,
    color: '#000',
    fontWeight: '600',
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  moodLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.sm,
  },
  moodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  moodOption: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  moodOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: '#fff',
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 26,
  },
  bodyInput: {
    ...typography.body,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.xl,
    padding: spacing.md,
    minHeight: 200,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  // Export Modal styles
  exportModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  exportContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  exportDescription: {
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  exportSection: {
    marginBottom: spacing.xl,
  },
  exportSectionTitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  exportOptionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exportOptionHalf: {
    width: '47%',
  },
  exportOptionFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  exportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exportOptionLabel: {
    ...typography.body,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  exportOptionSublabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
  },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: 'auto',
    marginBottom: spacing.xl,
  },
  tipContent: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
});
