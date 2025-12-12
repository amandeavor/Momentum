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

const useFocusTimer = (initialTime = 25 * 60): UseFocusTimerReturn => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const endTimeMsRef = useRef<number | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const prevInitialTimeRef = useRef(initialTime);

    const computeRemainingSeconds = useCallback(() => {
        const endTimeMs = endTimeMsRef.current;
        if (!endTimeMs) return null;
        const remainingMs = endTimeMs - Date.now();
        return Math.max(0, Math.ceil(remainingMs / 1000));
    }, []);

    const syncTimeLeft = useCallback(() => {
        const remaining = computeRemainingSeconds();
        if (remaining === null) return;
        setTimeLeft(remaining);
        if (remaining === 0 && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [computeRemainingSeconds]);

    useEffect(() => {
        if (isActive) {
            // Safety: if we're starting without an end time, derive from current timeLeft.
            if (!endTimeMsRef.current) {
                endTimeMsRef.current = Date.now() + timeLeft * 1000;
            }

            syncTimeLeft();
            if (!intervalRef.current) {
                intervalRef.current = setInterval(syncTimeLeft, 250);
            }
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isActive, syncTimeLeft, timeLeft]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            const prev = appStateRef.current;
            appStateRef.current = nextState;

            if (prev.match(/inactive|background/) && nextState === 'active') {
                // Ensure we resync after backgrounding.
                syncTimeLeft();
            }
        });

        return () => sub.remove();
    }, [syncTimeLeft]);

    // Update timeLeft ONLY when initialTime changes (and we're inactive).
    // Important: don't overwrite manual setTime() calls when toggling active state.
    useEffect(() => {
        if (prevInitialTimeRef.current === initialTime) return;
        prevInitialTimeRef.current = initialTime;

        if (!isActive) {
            setTimeLeft(initialTime);
            endTimeMsRef.current = null;
        }
    }, [initialTime, isActive]);

    const startTimer = useCallback(() => {
        endTimeMsRef.current = Date.now() + timeLeft * 1000;
        setIsActive(true);
    }, [timeLeft]);

    const stopTimer = useCallback(() => {
        syncTimeLeft();
        endTimeMsRef.current = null;
        setIsActive(false);
    }, [syncTimeLeft]);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        endTimeMsRef.current = null;
        setTimeLeft(initialTime);
    }, [initialTime]);

    const setTime = useCallback((seconds: number) => {
        const nextSeconds = Math.max(0, Math.floor(seconds));
        setTimeLeft(nextSeconds);
        if (isActive) {
            endTimeMsRef.current = Date.now() + nextSeconds * 1000;
            syncTimeLeft();
        } else {
            endTimeMsRef.current = null;
        }
    }, [isActive, syncTimeLeft]);

    return { timeLeft, isActive, startTimer, stopTimer, resetTimer, setTime };
};

export default useFocusTimer;