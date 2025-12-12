import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchTodos,
  createTodo as addTodo,
  updateTodo,
  deleteTodo,
  toggleTodoComplete,
} from '@/store/slices/tasksSlice';
import {
  selectAllTodos,
  selectTodosLoading,
  selectTodaysTodos,
  selectIncompleteTodos,
  selectCompletedTodos,
  selectHighPriorityTodos,
  selectTodosStats,
  selectTodoById,
} from '@/store/selectors';
import type { TodoInsert, TodoUpdate } from '@/types/database';

export const useTasks = () => {
  const dispatch = useAppDispatch();
  const todos = useAppSelector(selectAllTodos);
  const loading = useAppSelector(selectTodosLoading);
  const todaysTodos = useAppSelector(selectTodaysTodos);
  const incompleteTodos = useAppSelector(selectIncompleteTodos);
  const completedTodos = useAppSelector(selectCompletedTodos);
  const highPriorityTodos = useAppSelector(selectHighPriorityTodos);
  const stats = useAppSelector(selectTodosStats);

  // Load todos on mount
  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  // Actions
  const createTodo = useCallback(
    async (todo: Omit<TodoInsert, 'user_id'>) => {
      return dispatch(addTodo(todo)).unwrap();
    },
    [dispatch]
  );

  const editTodo = useCallback(
    async (id: string, updates: TodoUpdate) => {
      return dispatch(updateTodo({ id, updates })).unwrap();
    },
    [dispatch]
  );

  const removeTodo = useCallback(
    async (id: string) => {
      return dispatch(deleteTodo(id)).unwrap();
    },
    [dispatch]
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      return dispatch(toggleTodoComplete(id)).unwrap();
    },
    [dispatch]
  );

  const getTodoById = useCallback(
    (id: string) => {
      return todos.find((t) => t.id === id);
    },
    [todos]
  );

  const refresh = useCallback(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  return {
    // Data
    todos,
    todaysTodos,
    incompleteTodos,
    completedTodos,
    highPriorityTodos,
    stats,
    loading,

    // Actions
    createTodo,
    updateTodo: editTodo, // Alias for consistency
    editTodo,
    removeTodo,
    toggleComplete,
    getTodoById,
    refresh,
  };
};

export default useTasks;