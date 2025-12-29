import { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface UseFocusTimerReturn {
    timeLeft: number;
    isActive: boolean;
    startTimer: () => void;
    stopTimer: () => void;
    resetTimer: () => void;
    setTime: (seconds: number) => void;
}

/**
 * useFocusTimer Hook
 *
 * Manages a countdown timer with drift correction and background resilience.
 *
 * @param initialTime - Default duration in seconds.
 * @param expectedEndTime - (Optional) The absolute timestamp (ms) when the timer should end.
 *                          If provided, this is the source of truth for `timeLeft`.
 */
const useFocusTimer = (initialTime = 25 * 60, expectedEndTime?: number | null): UseFocusTimerReturn => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // Fallback end time for local-only sessions (though we aim to use expectedEndTime mostly)
    const localEndTimeRef = useRef<number | null>(null);

    /**
     * Calculates the remaining time based on the expected end time.
     */
    const getSyncedTime = useCallback(() => {
        const targetTime = expectedEndTime ?? localEndTimeRef.current;
        if (!targetTime) return null;

        const remainingMs = targetTime - Date.now();
        return Math.max(0, Math.ceil(remainingMs / 1000));
    }, [expectedEndTime]);

    /**
     * Syncs the local `timeLeft` state with the absolute time.
     */
    const syncTimeLeft = useCallback(() => {
        const remaining = getSyncedTime();
        if (remaining !== null) {
            setTimeLeft(remaining);
            if (remaining === 0 && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        } else if (isActive && !expectedEndTime && !localEndTimeRef.current) {
            // Edge case: active but lost reference? Should not happen if logic is correct.
            // fallback to manual decrement if needed, but we prefer absolute time.
            setTimeLeft(prev => Math.max(0, prev - 1));
        }
    }, [getSyncedTime, isActive, expectedEndTime]);

    // Initialize or Resume on Mount / Prop Change
    useEffect(() => {
        // If an expectedEndTime is provided, it implies the timer IS running (or paused at a specific state if handled elsewhere, but usually running).
        // However, `isActive` is our local toggle.
        // If we have an expectedEndTime that is in the future, we should probably auto-start or at least sync.

        if (expectedEndTime) {
            const remaining = Math.max(0, Math.ceil((expectedEndTime - Date.now()) / 1000));
            setTimeLeft(remaining);

            // If we have time remaining and an end time, we consider it active conceptually.
            // But we respect the `isActive` state passed/managed by the component?
            // Actually, the hook manages `isActive`.
            // If `expectedEndTime` is passed, we should assume it's running unless told otherwise.
            // But let's keep `isActive` control explicit via startTimer to avoid auto-play surprises,
            // UNLESS we are restoring state.

            if (remaining > 0) {
                 // We don't force setIsActive(true) here to avoid loops,
                 // but the parent component should call startTimer() if it knows a session is active.
            }
        } else {
             // If no expected end time, we reset to initial (only if we are not running a local session)
             if (!isActive && !localEndTimeRef.current) {
                 setTimeLeft(initialTime);
             }
        }
    }, [expectedEndTime, initialTime, isActive]);

    // Timer Interval
    useEffect(() => {
        if (isActive) {
            // Set local end time if not present (start fresh)
            if (!expectedEndTime && !localEndTimeRef.current) {
                localEndTimeRef.current = Date.now() + timeLeft * 1000;
            }

            // Sync immediately
            syncTimeLeft();

            if (!intervalRef.current) {
                intervalRef.current = setInterval(syncTimeLeft, 250); // Higher frequency for smoother UI feel if needed, but 1s is standard. 250ms helps catch 0 faster.
            }
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            // If we stop, we clear the local ref so we can restart fresh,
            // UNLESS we are just pausing?
            // For Pomodoro, "Pause" usually extends the end time.
            // If we rely on `expectedEndTime` from DB, pausing implies updating the DB record to "paused" and clearing the end time.
            // For this hook, `stopTimer` means "stop ticking".
            localEndTimeRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isActive, syncTimeLeft, expectedEndTime, timeLeft]);

    // App State Handling (Background/Foreground)
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            const prev = appStateRef.current;
            appStateRef.current = nextState;

            if (prev.match(/inactive|background/) && nextState === 'active') {
                // Resync immediately when coming back
                syncTimeLeft();
            }
        });

        return () => sub.remove();
    }, [syncTimeLeft]);

    const startTimer = useCallback(() => {
        setIsActive(true);
    }, []);

    const stopTimer = useCallback(() => {
        setIsActive(false);
    }, []);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        localEndTimeRef.current = null;
        setTimeLeft(initialTime);
    }, [initialTime]);

    const setTime = useCallback((seconds: number) => {
        const nextSeconds = Math.max(0, Math.floor(seconds));
        setTimeLeft(nextSeconds);
        // If active, we need to adjust the end time
        if (isActive) {
            // If using expectedEndTime (prop), we technically can't "set time" locally without desync.
            // The parent should handle DB updates.
            // But for local state:
            if (!expectedEndTime) {
                localEndTimeRef.current = Date.now() + nextSeconds * 1000;
            }
        }
    }, [isActive, expectedEndTime]);

    return { timeLeft, isActive, startTimer, stopTimer, resetTimer, setTime };
};

export default useFocusTimer;
