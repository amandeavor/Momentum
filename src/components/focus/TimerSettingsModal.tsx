import React, { memo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';

/**
 * Props for the TimerSettingsModal component.
 */
interface TimerSettingsModalProps {
    /** Whether the modal is visible. */
    visible: boolean;
    /** Callback to close the modal without saving. */
    onClose: () => void;
    /** Callback when "Save Settings" is pressed. */
    onSave: () => void;
    /** Current temporary settings state. */
    tempSettings: {
        focusDuration: number;
        shortBreakDuration: number;
        longBreakDuration: number;
    };
    /** Function to adjust a specific duration setting. */
    onAdjust: (key: 'focusDuration' | 'shortBreakDuration' | 'longBreakDuration', delta: number) => void;
}

/**
 * TimerSettingsModal Component
 * 
 * A modal dialog for adjusting Pomodoro timer durations.
 * 
 * @component
 */
const TimerSettingsModal = ({
    visible,
    onClose,
    onSave,
    tempSettings,
    onAdjust,
}: TimerSettingsModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Timer Settings</Text>
                        <Pressable onPress={onClose} hitSlop={12}>
                            <Ionicons name="close" size={24} color={colors.dark.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={styles.settingsSection}>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Focus Duration</Text>
                            <View style={styles.settingControl}>
                                <Pressable
                                    onPress={() => onAdjust('focusDuration', -5)}
                                    style={styles.settingButton}
                                >
                                    <Ionicons name="remove" size={20} color={colors.dark.text} />
                                </Pressable>
                                <Text style={styles.settingValue}>{tempSettings.focusDuration} min</Text>
                                <Pressable
                                    onPress={() => onAdjust('focusDuration', 5)}
                                    style={styles.settingButton}
                                >
                                    <Ionicons name="add" size={20} color={colors.dark.text} />
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Short Break</Text>
                            <View style={styles.settingControl}>
                                <Pressable
                                    onPress={() => onAdjust('shortBreakDuration', -1)}
                                    style={styles.settingButton}
                                >
                                    <Ionicons name="remove" size={20} color={colors.dark.text} />
                                </Pressable>
                                <Text style={styles.settingValue}>{tempSettings.shortBreakDuration} min</Text>
                                <Pressable
                                    onPress={() => onAdjust('shortBreakDuration', 1)}
                                    style={styles.settingButton}
                                >
                                    <Ionicons name="add" size={20} color={colors.dark.text} />
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Long Break</Text>
                            <View style={styles.settingControl}>
                                <Pressable
                                    onPress={() => onAdjust('longBreakDuration', -5)}
                                    style={styles.settingButton}
                                >
                                    <Ionicons name="remove" size={20} color={colors.dark.text} />
                                </Pressable>
                                <Text style={styles.settingValue}>{tempSettings.longBreakDuration} min</Text>
                                <Pressable
                                    onPress={() => onAdjust('longBreakDuration', 5)}
                                    style={styles.settingButton}
                                >
                                    <Ionicons name="add" size={20} color={colors.dark.text} />
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <Pressable onPress={onSave} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Save Settings</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.dark.surface,
        borderRadius: radii.xxl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.dark.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'Inter_700Bold',
        color: colors.dark.text,
        letterSpacing: -0.5,
    },
    settingsSection: {
        gap: spacing.lg,
        marginBottom: spacing.xl,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
        color: colors.dark.text,
        letterSpacing: -0.2,
    },
    settingControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    settingButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: 16,
        fontFamily: 'Inter_700Bold',
        color: colors.dark.text,
        minWidth: 60,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    saveButton: {
        backgroundColor: colors.dark.text,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        color: colors.dark.background,
        letterSpacing: -0.2,
    },
});

export default memo(TimerSettingsModal);
