import { useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  fetchHabits,
  fetchTodayCompletions,
  createHabit,
  updateHabitAsync,
  deleteHabitAsync,
  completeHabit,
  archiveHabit,
  selectAllHabits,
  selectActiveHabits,
  selectTodayCompletions,
  selectHabitsLoading,
  selectHabitsSyncing,
  selectIsHabitCompletedToday,
  selectHabitById,
  clearHabitsError,
} from '@/store/slices/habitsSlice';
import { DbHabitInsert, DbHabitUpdate } from '@/types/database';

interface UseHabitsOptions {
  includeArchived?: boolean;
  autoFetch?: boolean;
}

const useHabits = (options: UseHabitsOptions = {}) => {
  const { includeArchived = false, autoFetch = true } = options;
  const dispatch = useAppDispatch();

  // Selectors
  const habits = useAppSelector(includeArchived ? selectAllHabits : selectActiveHabits);
  const completions = useAppSelector(selectTodayCompletions);
  const loading = useAppSelector(selectHabitsLoading);
  const syncing = useAppSelector(selectHabitsSyncing);
  const error = useAppSelector(state => state.habits.error);

  // Fetch habits on mount
  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchHabits({ includeArchived }));
      dispatch(fetchTodayCompletions());
    }
  }, [dispatch, autoFetch, includeArchived]);

  // Actions
  const addHabit = useCallback(
    async (habit: Omit<DbHabitInsert, 'user_id'>) => {
      try {
        await dispatch(createHabit(habit)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to add habit:', err);
        return false;
      }
    },
    [dispatch]
  );

  const editHabit = useCallback(
    async (id: string, updates: DbHabitUpdate) => {
      try {
        await dispatch(updateHabitAsync({ id, updates })).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to update habit:', err);
        return false;
      }
    },
    [dispatch]
  );

  const removeHabit = useCallback(
    async (id: string) => {
      try {
        await dispatch(deleteHabitAsync(id)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to delete habit:', err);
        return false;
      }
    },
    [dispatch]
  );

  // Helper to check if a specific habit is completed today
  const isCompletedToday = useCallback(
    (habitId: string) => completions.some(c => c.habit_id === habitId),
    [completions]
  );

  const checkInHabit = useCallback(
    async (habitId: string, notes?: string) => {
      // Prevent duplicate check-ins
      if (isCompletedToday(habitId)) {
        return true;
      }

      try {
        await dispatch(completeHabit({ habitId, notes })).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to check in habit:', err);
        return false;
      }
    },
    [dispatch, isCompletedToday]
  );

  const archive = useCallback(
    async (id: string) => {
      try {
        await dispatch(archiveHabit(id)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to archive habit:', err);
        return false;
      }
    },
    [dispatch]
  );

  const refresh = useCallback(() => {
    dispatch(fetchHabits({ includeArchived }));
    dispatch(fetchTodayCompletions());
  }, [dispatch, includeArchived]);

  const clearError = useCallback(() => {
    dispatch(clearHabitsError());
  }, [dispatch]);

  // Get a specific habit by ID
  const getHabitById = useCallback(
    (habitId: string) => habits.find(h => h.id === habitId),
    [habits]
  );

  return {
    habits,
    completions,
    loading,
    syncing,
    error,
    addHabit,
    editHabit,
    removeHabit,
    checkInHabit,
    checkIn: checkInHabit, // alias for convenience
    archive,
    refresh,
    clearError,
    isCompletedToday,
    getHabitById,
  };
};

// Named export for destructuring import
export { useHabits };

export default useHabits;