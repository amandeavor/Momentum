import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Slice imports
import authReducer from './slices/authSlice';
import tasksReducer from './slices/tasksSlice';
import pomodoroReducer from './slices/pomodoroSlice';
import journalReducer from './slices/journalSlice';
import settingsReducer from './slices/settingsSlice';
import capabilitiesReducer from './slices/capabilitiesSlice';
import syncReducer from './slices/syncSlice';
import habitsReducer from './slices/habitsSlice';
import goalsReducer from './slices/goalsSlice';
import timeblocksReducer from './slices/timeblocksSlice';
import notesReducer from './slices/notesSlice';
import analyticsReducer from './slices/analyticsSlice';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  tasks: tasksReducer,
  pomodoro: pomodoroReducer,
  journal: journalReducer,
  settings: settingsReducer,
  capabilities: capabilitiesReducer,
  sync: syncReducer,
  habits: habitsReducer,
  goals: goalsReducer,
  timeblocks: timeblocksReducer,
  notes: notesReducer,
  analytics: analyticsReducer,
});

// Persist configuration
const persistConfig = {
  key: 'momentum-root',
  version: 1,
  storage: AsyncStorage,
  // Whitelist reducers to persist
  whitelist: ['tasks', 'pomodoro', 'journal', 'settings', 'capabilities', 'sync', 'habits', 'goals', 'timeblocks', 'notes'],
  // Blacklist specific keys if needed
  // blacklist: [],
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

// Create persistor
export const persistor = persistStore(store);

// Infer types from store
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;