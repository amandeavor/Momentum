import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchNotes, createNote, updateNote, deleteNote, selectAllNotes } from '@/store/slices/notesSlice';
import { Note } from '@/types/database';

const NOTE_COLORS = [
    '#1A1A1A', // Dark Grey
    '#262626', // Slightly lighter
    '#333333', // Medium Grey
    '#404040', // Lighter Grey
    '#000000', // Black
    '#121212', // Off Black
];

export default function NotesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const notes = useAppSelector(selectAllNotes);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteColor, setNoteColor] = useState<string>('#1A1A1A');
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        dispatch(fetchNotes());
    }, [dispatch]);

    const filteredNotes = notes.filter(note =>
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSave = async () => {
        if (!noteContent.trim() && !noteTitle.trim()) {
            closeModal();
            return;
        }

        try {
            if (editingNote) {
                await dispatch(updateNote({
                    id: editingNote.id,
                    updates: {
                        title: noteTitle,
                        content: noteContent,
                        color: noteColor,
                        is_pinned: isPinned,
                    }
                })).unwrap();
            } else {
                await dispatch(createNote({
                    title: noteTitle,
                    content: noteContent,
                    color: noteColor,
                    is_pinned: isPinned,
                    tags: [], // Schema expects string[] | null, [] is valid
                })).unwrap();
            }
            closeModal();
        } catch (error) {
            console.error('Failed to save note:', error);
            // Optionally show an alert here if needed, but for now just logging
            alert('Failed to save note. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (editingNote) {
            try {
                await dispatch(deleteNote(editingNote.id)).unwrap();
                closeModal();
            } catch (error) {
                console.error('Failed to delete note:', error);
                alert('Failed to delete note. Please try again.');
            }
        }
    };

    const handleTogglePin = (note: Note, e: any) => {
        e.stopPropagation();
        dispatch(updateNote({
            id: note.id,
            updates: {
                is_pinned: !note.is_pinned
            }
        }));
    };

    const openModal = (note?: Note) => {
        if (note) {
            setEditingNote(note);
            setNoteTitle(note.title || '');
            setNoteContent(note.content);
            setNoteColor(note.color || '#1A1A1A');
            setIsPinned(note.is_pinned);
        } else {
            setEditingNote(null);
            setNoteTitle('');
            setNoteContent('');
            setNoteColor('#1A1A1A');
            setIsPinned(false);
        }
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingNote(null);
        setNoteTitle('');
        setNoteContent('');
    };

    const renderNote = ({ item }: { item: Note }) => (
        <Pressable
            style={[styles.noteCard, { backgroundColor: item.color || '#1A1A1A' }]}
            onPress={() => openModal(item)}
        >
            <View style={styles.noteHeader}>
                {item.title ? (
                    <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
                ) : <View style={{ flex: 1 }} />}
                <Pressable
                    hitSlop={8}
                    onPress={(e) => handleTogglePin(item, e)}
                    style={styles.pinButton}
                >
                    <Ionicons
                        name={item.is_pinned ? "pin" : "pin-outline"}
                        size={16}
                        color={item.is_pinned ? "#fff" : "rgba(255,255,255,0.3)"}
                    />
                </Pressable>
            </View>
            <Text style={styles.noteContent} numberOfLines={8}>{item.content}</Text>
            <Text style={styles.noteDate}>
                {new Date(item.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
        </Pressable>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.title}>Quick Notes</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search notes..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredNotes}
                renderItem={renderNote}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.emptyText}>No notes yet</Text>
                        <Text style={styles.emptySubtext}>Tap + to create one</Text>
                    </View>
                }
            />

            <Pressable
                style={[styles.fab, { bottom: insets.bottom + 24 }]}
                onPress={() => openModal()}
            >
                <Ionicons name="add" size={32} color="#000" />
            </Pressable>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeModal}
            >
                <View style={[styles.modalContainer, { backgroundColor: noteColor }]}>
                    <View style={styles.modalHeader}>
                        <Pressable onPress={closeModal} style={styles.modalButton}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </Pressable>
                        <View style={styles.modalActions}>
                            {editingNote && (
                                <Pressable onPress={handleDelete} style={styles.iconButton}>
                                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                                </Pressable>
                            )}
                            <Pressable onPress={handleSave} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </Pressable>
                        </View>
                    </View>

                    <TextInput
                        style={styles.modalTitleInput}
                        placeholder="Title"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={noteTitle}
                        onChangeText={setNoteTitle}
                    />

                    <TextInput
                        style={styles.modalInput}
                        multiline
                        placeholder="Type your note..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={noteContent}
                        onChangeText={setNoteContent}
                        autoFocus={!editingNote}
                    />

                    <View style={styles.colorPicker}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScroll}>
                            {NOTE_COLORS.map(color => (
                                <Pressable
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        noteColor === color && styles.selectedColor
                                    ]}
                                    onPress={() => setNoteColor(color)}
                                />
                            ))}
                        </ScrollView>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
        marginLeft: -spacing.xs,
    },
    title: {
        ...typography.h3,
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: spacing.xl,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: '#fff',
        padding: 0,
    },
    listContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    noteCard: {
        flex: 1,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        minHeight: 120,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    noteTitle: {
        ...typography.body,
        fontWeight: '700',
        color: '#fff',
        flex: 1,
        marginRight: spacing.sm,
    },
    pinButton: {
        padding: 4,
        marginRight: -4,
        marginTop: -4,
    },
    noteContent: {
        ...typography.body,
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    noteDate: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.4)',
        position: 'absolute',
        bottom: spacing.md,
        left: spacing.md,
    },
    fab: {
        position: 'absolute',
        right: spacing.xl,
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        opacity: 0.5,
    },
    emptyText: {
        ...typography.h3,
        color: '#fff',
        marginTop: spacing.md,
    },
    emptySubtext: {
        ...typography.body,
        color: 'rgba(255,255,255,0.4)',
        marginTop: spacing.xs,
    },
    modalContainer: {
        flex: 1,
        padding: spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    modalButton: {
        padding: spacing.sm,
        marginLeft: -spacing.sm,
    },
    modalButtonText: {
        ...typography.body,
        color: '#fff',
    },
    modalActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconButton: {
        padding: spacing.sm,
    },
    saveButton: {
        backgroundColor: '#fff',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs + 2,
        borderRadius: radii.full,
    },
    saveButtonText: {
        ...typography.body,
        fontWeight: '600',
        color: '#000',
    },
    modalTitleInput: {
        ...typography.h3,
        color: '#fff',
        marginBottom: spacing.md,
    },
    modalInput: {
        ...typography.body,
        color: '#fff',
        fontSize: 18,
        flex: 1,
        textAlignVertical: 'top',
        lineHeight: 28,
    },
    colorPicker: {
        height: 60,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: spacing.md,
    },
    colorScroll: {
        gap: spacing.md,
        paddingHorizontal: spacing.xs,
    },
    colorOption: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    selectedColor: {
        borderWidth: 2,
        borderColor: '#fff',
    },
});
