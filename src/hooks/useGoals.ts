import { useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  fetchGoals,
  createGoalAsync,
  updateGoalAsync,
  deleteGoalAsync,
  createMilestone,
  updateMilestone,
  toggleMilestone,
  deleteMilestone,
  selectAllGoals,
  selectActiveGoals,
  selectCompletedGoals,
  selectGoalsLoading,
  selectGoalsSyncing,
  selectGoalById,
  selectMilestonesByGoalId,
  setCurrentGoal,
  clearGoalsError,
} from '@/store/slices/goalsSlice';
import { DbGoalInsert, DbGoalUpdate, DbMilestoneInsert, DbMilestoneUpdate } from '@/types/database';
import { Goal, Milestone } from '@/types/goal';

interface UseGoalsOptions {
  status?: 'active' | 'completed' | 'paused' | 'abandoned';
  autoFetch?: boolean;
}

const useGoals = (options: UseGoalsOptions = {}) => {
  const { status, autoFetch = true } = options;
  const dispatch = useAppDispatch();

  // Selectors
  const allGoals = useAppSelector(selectAllGoals);
  const activeGoals = useAppSelector(selectActiveGoals);
  const completedGoals = useAppSelector(selectCompletedGoals);
  const milestones = useAppSelector(state => state.goals.milestones);
  const loading = useAppSelector(selectGoalsLoading);
  const syncing = useAppSelector(selectGoalsSyncing);
  const error = useAppSelector(state => state.goals.error);
  const currentGoal = useAppSelector(state => state.goals.currentGoal);

  // Filter goals based on status option
  const goals = status
    ? allGoals.filter(g => g.status === status)
    : allGoals;

  // Transform to legacy Goal type for backward compatibility
  const legacyGoals: Goal[] = goals.map(g => ({
    id: g.id,
    title: g.title,
    description: g.description || undefined,
    targetDate: g.target_date ? new Date(g.target_date) : new Date(),
    progress: g.progress,
    milestones: milestones
      .filter(m => m.goal_id === g.id)
      .map(m => ({
        id: m.id,
        title: m.title,
        achieved: m.achieved,
        dateAchieved: m.achieved_at ? new Date(m.achieved_at) : undefined,
      })),
  }));

  // Fetch goals on mount
  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchGoals(status ? { status } : undefined));
    }
  }, [dispatch, autoFetch, status]);

  // Actions
  const addGoal = useCallback(
    async (goal: Omit<DbGoalInsert, 'user_id'>) => {
      try {
        await dispatch(createGoalAsync(goal)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to add goal:', err);
        return false;
      }
    },
    [dispatch]
  );

  const editGoal = useCallback(
    async (id: string, updates: DbGoalUpdate) => {
      try {
        await dispatch(updateGoalAsync({ id, updates })).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to update goal:', err);
        return false;
      }
    },
    [dispatch]
  );

  const removeGoal = useCallback(
    async (id: string) => {
      try {
        await dispatch(deleteGoalAsync(id)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to delete goal:', err);
        return false;
      }
    },
    [dispatch]
  );

  // Milestone actions
  const addMilestone = useCallback(
    async (milestone: Omit<DbMilestoneInsert, 'user_id'>) => {
      try {
        await dispatch(createMilestone(milestone)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to add milestone:', err);
        return false;
      }
    },
    [dispatch]
  );

  const editMilestone = useCallback(
    async (id: string, updates: DbMilestoneUpdate) => {
      try {
        await dispatch(updateMilestone({ id, updates })).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to update milestone:', err);
        return false;
      }
    },
    [dispatch]
  );

  const toggleMilestoneComplete = useCallback(
    async (milestoneId: string) => {
      try {
        await dispatch(toggleMilestone(milestoneId)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to toggle milestone:', err);
        return false;
      }
    },
    [dispatch]
  );

  const removeMilestone = useCallback(
    async (id: string) => {
      try {
        await dispatch(deleteMilestone(id)).unwrap();
        return true;
      } catch (err) {
        console.error('Failed to delete milestone:', err);
        return false;
      }
    },
    [dispatch]
  );

  const refresh = useCallback(() => {
    dispatch(fetchGoals(status ? { status } : undefined));
  }, [dispatch, status]);

  const clearError = useCallback(() => {
    dispatch(clearGoalsError());
  }, [dispatch]);

  const selectGoal = useCallback(
    (goal: typeof allGoals[0] | null) => {
      dispatch(setCurrentGoal(goal));
    },
    [dispatch]
  );

  // Get milestones for a specific goal
  const getMilestones = useCallback(
    (goalId: string) => milestones.filter(m => m.goal_id === goalId),
    [milestones]
  );

  // Get a specific goal by ID
  const getGoalById = useCallback(
    (goalId: string) => allGoals.find(g => g.id === goalId),
    [allGoals]
  );

  return {
    // Raw database goals
    goals: allGoals,
    activeGoals,
    completedGoals,
    milestones,
    currentGoal,
    loading,
    syncing,
    error,
    // Actions
    addGoal,
    editGoal,
    removeGoal,
    addMilestone,
    editMilestone,
    toggleMilestoneComplete,
    removeMilestone,
    refresh,
    clearError,
    selectGoal,
    getMilestones,
    getGoalById,
  };
};

// Named export for destructuring import
export { useGoals };

export default useGoals;