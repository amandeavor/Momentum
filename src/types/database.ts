// Database types for Supabase
// These types mirror the database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bedtime: string; // Time in HH:MM format
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bedtime?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bedtime?: string;
          timezone?: string;
          updated_at?: string;
        };
      };
      capabilities: {
        Row: {
          id: string;
          user_id: string;
          streaks_enabled: boolean;
          friends_enabled: boolean;
          notes_enabled: boolean;
          pinned_tabs: string[]; // Array of tab identifiers
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          streaks_enabled?: boolean;
          friends_enabled?: boolean;
          notes_enabled?: boolean;
          pinned_tabs?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          streaks_enabled?: boolean;
          friends_enabled?: boolean;
          notes_enabled?: boolean;
          pinned_tabs?: string[];
          updated_at?: string;
        };
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          completed: boolean;
          priority: 'low' | 'medium' | 'high';
          due_date: string | null;
          timeblock_id: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          timeblock_id?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          timeblock_id?: string | null;
          order_index?: number;
          updated_at?: string;
        };
      };
      pomodoro_sessions: {
        Row: {
          id: string;
          user_id: string;
          todo_id: string | null;
          duration_minutes: number;
          actual_duration_minutes: number | null;
          break_duration_minutes: number;
          started_at: string;
          ended_at: string | null;
          completed: boolean;
          rating: number | null; // 1-5 focus rating
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          todo_id?: string | null;
          duration_minutes: number;
          actual_duration_minutes?: number | null;
          break_duration_minutes?: number;
          started_at?: string;
          ended_at?: string | null;
          completed?: boolean;
          rating?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          ended_at?: string | null;
          completed?: boolean;
          actual_duration_minutes?: number | null;
          rating?: number | null;
          notes?: string | null;
        };
      };
      journals: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          body: string;
          mood: string | null; // Emoji string
          mood_rating: number | null; // 1-5
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          body: string;
          mood?: string | null;
          mood_rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          body?: string;
          mood?: string | null;
          mood_rating?: number | null;
          updated_at?: string;
        };
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          type: 'pomodoro' | 'journal' | 'custom';
          name: string;
          current_count: number;
          best_count: number;
          last_check_in: string | null;
          started_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'pomodoro' | 'journal' | 'custom';
          name: string;
          current_count?: number;
          best_count?: number;
          last_check_in?: string | null;
          started_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          current_count?: number;
          best_count?: number;
          last_check_in?: string | null;
          updated_at?: string;
        };
      };
      timeblocks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date: string;
          start_time: string; // HH:MM format
          end_time: string; // HH:MM format
          color: string;
          priority: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          date: string;
          start_time: string;
          end_time: string;
          color?: string;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          color?: string;
          priority?: 'low' | 'medium' | 'high';
          updated_at?: string;
        };
      };
      sync_queue: {
        Row: {
          id: string;
          user_id: string;
          operation: 'insert' | 'update' | 'delete';
          table_name: string;
          record_id: string;
          payload: Json;
          created_at: string;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          operation: 'insert' | 'update' | 'delete';
          table_name: string;
          record_id: string;
          payload: Json;
          created_at?: string;
          synced_at?: string | null;
        };
        Update: {
          synced_at?: string | null;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          visible_streaks: string[]; // Array of streak types to share
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          visible_streaks?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'blocked';
          visible_streaks?: string[];
          updated_at?: string;
        };
      };
      encouragements: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          emoji: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          emoji?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
          frequency_days: number[] | null;
          color: string | null;
          icon: string | null;
          reminder_time: string | null;
          streak_count: number;
          best_streak: number;
          last_completed_at: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
          frequency_days?: number[] | null;
          color?: string | null;
          icon?: string | null;
          reminder_time?: string | null;
          streak_count?: number;
          best_streak?: number;
          last_completed_at?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
          frequency_days?: number[] | null;
          color?: string | null;
          icon?: string | null;
          reminder_time?: string | null;
          streak_count?: number;
          best_streak?: number;
          last_completed_at?: string | null;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      habit_completions: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          completed_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          completed_at?: string;
          notes?: string | null;
        };
        Update: {
          notes?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_date: string | null;
          progress: number;
          status: 'active' | 'completed' | 'paused' | 'abandoned';
          color: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_date?: string | null;
          progress?: number;
          status?: 'active' | 'completed' | 'paused' | 'abandoned';
          color?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          target_date?: string | null;
          progress?: number;
          status?: 'active' | 'completed' | 'paused' | 'abandoned';
          color?: string | null;
          category?: string | null;
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_date: string | null;
          achieved: boolean;
          achieved_at: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_date?: string | null;
          achieved?: boolean;
          achieved_at?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          target_date?: string | null;
          achieved?: boolean;
          achieved_at?: string | null;
          order_index?: number;
          updated_at?: string;
        };
      };
      goal_sessions: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          session_date: string;
          duration_minutes: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          session_date?: string;
          duration_minutes?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          duration_minutes?: number;
          notes?: string | null;
        };
      };
      streak_meta: {
        Row: {
          id: string;
          user_id: string;
          streak_type: 'tasks' | 'habits' | 'journal' | 'focus';
          current_streak: number;
          longest_streak: number;
          last_check_in: string | null;
          last_milestone_celebrated: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          streak_type: 'tasks' | 'habits' | 'journal' | 'focus';
          current_streak?: number;
          longest_streak?: number;
          last_check_in?: string | null;
          last_milestone_celebrated?: number;
          updated_at?: string;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_check_in?: string | null;
          last_milestone_celebrated?: number;
          updated_at?: string;
        };
      };
      urge_events: {
        Row: {
          id: string;
          user_id: string;
          timestamp: string;
          intensity: number;
          duration_seconds: number;
          coping_used: string[] | null;
          outcome: 'surfed' | 'relapsed' | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          timestamp?: string;
          intensity: number;
          duration_seconds: number;
          coping_used?: string[] | null;
          outcome?: 'surfed' | 'relapsed' | null;
        };
        Update: {
          intensity?: number;
          duration_seconds?: number;
          coping_used?: string[] | null;
          outcome?: 'surfed' | 'relapsed' | null;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          content: string;
          is_pinned: boolean;
          color: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          content: string;
          is_pinned?: boolean;
          color?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          content?: string;
          is_pinned?: boolean;
          color?: string | null;
          tags?: string[] | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_urge_count: {
        Args: {
          p_user_id: string;
          p_date: string;
        };
        Returns: void;
      };
    };
    Enums: {
      priority_level: 'low' | 'medium' | 'high';
      streak_type: 'pomodoro' | 'journal' | 'custom' | 'tasks' | 'habits' | 'focus';
      friendship_status: 'pending' | 'accepted' | 'blocked';
      sync_operation: 'insert' | 'update' | 'delete';
      urge_outcome: 'surfed' | 'relapsed';
    };
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Capabilities = Database['public']['Tables']['capabilities']['Row'];
export type CapabilitiesInsert = Database['public']['Tables']['capabilities']['Insert'];
export type CapabilitiesUpdate = Database['public']['Tables']['capabilities']['Update'];

export type Todo = Database['public']['Tables']['todos']['Row'];
export type TodoInsert = Database['public']['Tables']['todos']['Insert'];
export type TodoUpdate = Database['public']['Tables']['todos']['Update'];

export type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row'];
export type PomodoroSessionInsert = Database['public']['Tables']['pomodoro_sessions']['Insert'];
export type PomodoroSessionUpdate = Database['public']['Tables']['pomodoro_sessions']['Update'];

export type Journal = Database['public']['Tables']['journals']['Row'];
export type JournalInsert = Database['public']['Tables']['journals']['Insert'];
export type JournalUpdate = Database['public']['Tables']['journals']['Update'];

export type Streak = Database['public']['Tables']['streaks']['Row'];
export type StreakInsert = Database['public']['Tables']['streaks']['Insert'];
export type StreakUpdate = Database['public']['Tables']['streaks']['Update'];

export type Timeblock = Database['public']['Tables']['timeblocks']['Row'];
export type TimeblockInsert = Database['public']['Tables']['timeblocks']['Insert'];
export type TimeblockUpdate = Database['public']['Tables']['timeblocks']['Update'];

export type SyncQueueItem = Database['public']['Tables']['sync_queue']['Row'];
export type SyncQueueInsert = Database['public']['Tables']['sync_queue']['Insert'];

export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type FriendshipInsert = Database['public']['Tables']['friendships']['Insert'];
export type FriendshipUpdate = Database['public']['Tables']['friendships']['Update'];

export type Encouragement = Database['public']['Tables']['encouragements']['Row'];
export type EncouragementInsert = Database['public']['Tables']['encouragements']['Insert'];

export type DbHabit = Database['public']['Tables']['habits']['Row'];
export type DbHabitInsert = Database['public']['Tables']['habits']['Insert'];
export type DbHabitUpdate = Database['public']['Tables']['habits']['Update'];

export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row'];
export type HabitCompletionInsert = Database['public']['Tables']['habit_completions']['Insert'];

export type DbGoal = Database['public']['Tables']['goals']['Row'];
export type DbGoalInsert = Database['public']['Tables']['goals']['Insert'];
export type DbGoalUpdate = Database['public']['Tables']['goals']['Update'];

export type DbMilestone = Database['public']['Tables']['milestones']['Row'];
export type DbMilestoneInsert = Database['public']['Tables']['milestones']['Insert'];
export type DbMilestoneUpdate = Database['public']['Tables']['milestones']['Update'];

export type GoalSession = Database['public']['Tables']['goal_sessions']['Row'];
export type GoalSessionInsert = Database['public']['Tables']['goal_sessions']['Insert'];
export type GoalSessionUpdate = Database['public']['Tables']['goal_sessions']['Update'];



export type StreakMeta = Database['public']['Tables']['streak_meta']['Row'];
export type StreakMetaInsert = Database['public']['Tables']['streak_meta']['Insert'];
export type StreakMetaUpdate = Database['public']['Tables']['streak_meta']['Update'];

export type UrgeEvent = Database['public']['Tables']['urge_events']['Row'];
export type UrgeEventInsert = Database['public']['Tables']['urge_events']['Insert'];
export type UrgeEventUpdate = Database['public']['Tables']['urge_events']['Update'];

export type Note = Database['public']['Tables']['notes']['Row'];
export type NoteInsert = Database['public']['Tables']['notes']['Insert'];
export type NoteUpdate = Database['public']['Tables']['notes']['Update'];
