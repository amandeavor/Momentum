import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useAppSelector } from '@/store';
import { selectHapticLevel } from '@/store/slices/settingsSlice';

/**
 * Custom hook for haptic feedback that respects user settings
 * @returns Object with haptic feedback functions
 */
export const useHaptics = () => {
    const hapticLevel = useAppSelector(selectHapticLevel);

    /**
     * Light impact feedback - for taps, selections
     */
    const light = useCallback(() => {
        if (hapticLevel === 'off') return;

        Haptics.impactAsync(
            hapticLevel === 'full'
                ? Haptics.ImpactFeedbackStyle.Light
                : Haptics.ImpactFeedbackStyle.Soft
        );
    }, [hapticLevel]);

    /**
     * Medium impact feedback - for button presses, confirmations
     */
    const medium = useCallback(() => {
        if (hapticLevel === 'off') return;

        Haptics.impactAsync(
            hapticLevel === 'full'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light
        );
    }, [hapticLevel]);

    /**
     * Heavy impact feedback - for important actions, errors
     */
    const heavy = useCallback(() => {
        if (hapticLevel === 'off') return;

        Haptics.impactAsync(
            hapticLevel === 'full'
                ? Haptics.ImpactFeedbackStyle.Heavy
                : Haptics.ImpactFeedbackStyle.Medium
        );
    }, [hapticLevel]);

    /**
     * Success notification - for successful actions
     */
    const success = useCallback(() => {
        if (hapticLevel === 'off') return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [hapticLevel]);

    /**
     * Error notification - for errors or failures
     */
    const error = useCallback(() => {
        if (hapticLevel === 'off') return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, [hapticLevel]);

    /**
     * Warning notification - for warnings or cautions
     */
    const warning = useCallback(() => {
        if (hapticLevel === 'off') return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, [hapticLevel]);

    /**
     * Selection feedback - for picker/selector changes
     */
    const selection = useCallback(() => {
        if (hapticLevel === 'off') return;

        Haptics.selectionAsync();
    }, [hapticLevel]);

    return {
        light,
        medium,
        heavy,
        success,
        error,
        warning,
        selection,
        isEnabled: hapticLevel !== 'off',
        level: hapticLevel,
    };
};
