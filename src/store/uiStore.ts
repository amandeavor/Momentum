// Zustand store for ephemeral UI state
// This store handles transient state that doesn't need persistence or sync

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// === Modal State ===
interface ModalState {
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
}

// === Form Draft State ===
interface FormDraftState {
  todoDraft: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  } | null;
  journalDraft: {
    title: string;
    body: string;
    mood: string | null;
  } | null;
}

// === Animation & Accessibility ===
interface AnimationState {
  reducedMotion: boolean;
  hapticEnabled: boolean;
}

// === Navigation State ===
interface NavigationState {
  isDrawerOpen: boolean;
  activeTabIndex: number;
  showNewFeatureBadge: Record<string, boolean>;
}

// === Pomodoro UI State ===
interface PomodoroUIState {
  isRunning: boolean;
  isPaused: boolean;
  showRatingModal: boolean;
  currentSessionId: string | null;
}

// === Toast/Snackbar State ===
interface ToastState {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    action?: {
      label: string;
      onPress: () => void;
    };
    duration?: number;
  }>;
}

// === Onboarding State ===
interface OnboardingState {
  currentStep: number;
  isComplete: boolean;
  skippedSteps: number[];
}

// === Complete UI Store ===
interface UIStore extends 
  ModalState, 
  FormDraftState, 
  AnimationState, 
  NavigationState,
  PomodoroUIState,
  ToastState,
  OnboardingState {
  // Modal actions
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Form draft actions
  setTodoDraft: (draft: FormDraftState['todoDraft']) => void;
  clearTodoDraft: () => void;
  setJournalDraft: (draft: FormDraftState['journalDraft']) => void;
  clearJournalDraft: () => void;

  // Animation actions
  setReducedMotion: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;

  // Navigation actions
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  setActiveTab: (index: number) => void;
  setNewFeatureBadge: (feature: string, show: boolean) => void;

  // Pomodoro UI actions
  setPomodoroRunning: (running: boolean) => void;
  setPomodoroPaused: (paused: boolean) => void;
  showPomodoroRating: (sessionId: string) => void;
  hidePomodoroRating: () => void;

  // Toast actions
  showToast: (toast: Omit<ToastState['toasts'][0], 'id'>) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;

  // Onboarding actions
  setOnboardingStep: (step: number) => void;
  skipOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

// Generate unique toast ID
const generateToastId = () => `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useUIStore = create<UIStore>()(
  subscribeWithSelector((set, get) => ({
    // === Initial State ===
    
    // Modal
    activeModal: null,
    modalData: null,

    // Form drafts
    todoDraft: null,
    journalDraft: null,

    // Animation
    reducedMotion: false,
    hapticEnabled: true,

    // Navigation
    isDrawerOpen: false,
    activeTabIndex: 0,
    showNewFeatureBadge: {},

    // Pomodoro
    isRunning: false,
    isPaused: false,
    showRatingModal: false,
    currentSessionId: null,

    // Toasts
    toasts: [],

    // Onboarding
    currentStep: 0,
    isComplete: false,
    skippedSteps: [],

    // === Actions ===

    // Modal
    openModal: (modalId, data) => set({ 
      activeModal: modalId, 
      modalData: data ?? null 
    }),
    closeModal: () => set({ 
      activeModal: null, 
      modalData: null 
    }),

    // Form drafts
    setTodoDraft: (draft) => set({ todoDraft: draft }),
    clearTodoDraft: () => set({ todoDraft: null }),
    setJournalDraft: (draft) => set({ journalDraft: draft }),
    clearJournalDraft: () => set({ journalDraft: null }),

    // Animation
    setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
    setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),

    // Navigation
    setDrawerOpen: (open) => set({ isDrawerOpen: open }),
    toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    setActiveTab: (index) => set({ activeTabIndex: index }),
    setNewFeatureBadge: (feature, show) => set((state) => ({
      showNewFeatureBadge: { ...state.showNewFeatureBadge, [feature]: show }
    })),

    // Pomodoro
    setPomodoroRunning: (running) => set({ isRunning: running }),
    setPomodoroPaused: (paused) => set({ isPaused: paused }),
    showPomodoroRating: (sessionId) => set({ 
      showRatingModal: true, 
      currentSessionId: sessionId 
    }),
    hidePomodoroRating: () => set({ 
      showRatingModal: false, 
      currentSessionId: null 
    }),

    // Toasts
    showToast: (toast) => {
      const id = generateToastId();
      set((state) => ({
        toasts: [...state.toasts, { ...toast, id }]
      }));
      
      // Auto-hide after duration (default 4 seconds)
      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          get().hideToast(id);
        }, duration);
      }
    },
    hideToast: (id) => set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),
    clearToasts: () => set({ toasts: [] }),

    // Onboarding
    setOnboardingStep: (step) => set({ currentStep: step }),
    skipOnboardingStep: (step) => set((state) => ({
      skippedSteps: [...state.skippedSteps, step],
      currentStep: state.currentStep + 1,
    })),
    completeOnboarding: () => set({ isComplete: true }),
    resetOnboarding: () => set({
      currentStep: 0,
      isComplete: false,
      skippedSteps: [],
    }),
  }))
);

// Selector hooks for better performance
export const useModal = () => useUIStore((state) => ({
  activeModal: state.activeModal,
  modalData: state.modalData,
  openModal: state.openModal,
  closeModal: state.closeModal,
}));

export const useToasts = () => useUIStore((state) => ({
  toasts: state.toasts,
  showToast: state.showToast,
  hideToast: state.hideToast,
}));

export const useAnimationPrefs = () => useUIStore((state) => ({
  reducedMotion: state.reducedMotion,
  hapticEnabled: state.hapticEnabled,
  setReducedMotion: state.setReducedMotion,
  setHapticEnabled: state.setHapticEnabled,
}));

export const usePomodoroUI = () => useUIStore((state) => ({
  isRunning: state.isRunning,
  isPaused: state.isPaused,
  showRatingModal: state.showRatingModal,
  currentSessionId: state.currentSessionId,
  setPomodoroRunning: state.setPomodoroRunning,
  setPomodoroPaused: state.setPomodoroPaused,
  showPomodoroRating: state.showPomodoroRating,
  hidePomodoroRating: state.hidePomodoroRating,
}));

export const useOnboarding = () => useUIStore((state) => ({
  currentStep: state.currentStep,
  isComplete: state.isComplete,
  skippedSteps: state.skippedSteps,
  setOnboardingStep: state.setOnboardingStep,
  skipOnboardingStep: state.skipOnboardingStep,
  completeOnboarding: state.completeOnboarding,
  resetOnboarding: state.resetOnboarding,
}));
