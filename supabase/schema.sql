-- Momentum App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  avatar_color TEXT DEFAULT '#8FCFFF',
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'skip')),
  age INTEGER CHECK (age >= 13 AND age <= 120),
  bedtime TIME DEFAULT '22:00',
  timezone TEXT DEFAULT 'UTC',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capabilities table (feature toggles per user)
CREATE TABLE IF NOT EXISTS public.capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  streaks_enabled BOOLEAN DEFAULT TRUE,
  friends_enabled BOOLEAN DEFAULT FALSE,
  notes_enabled BOOLEAN DEFAULT FALSE,
  nofap_enabled BOOLEAN DEFAULT FALSE,
  nofap_visible_to_friends BOOLEAN DEFAULT FALSE,
  pinned_tabs TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  timeblock_id UUID,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pomodoro sessions table
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES public.todos(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  break_duration_minutes INTEGER DEFAULT 5,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journals table
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL,
  mood TEXT, -- Emoji string
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks table
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pomodoro', 'journal', 'custom', 'nofap')),
  name TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  best_count INTEGER DEFAULT 0,
  last_check_in DATE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeblocks table
CREATE TABLE IF NOT EXISTS public.timeblocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT DEFAULT '#6200EE',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  frequency_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7]::INTEGER[], -- Days of week (1=Mon, 7=Sun)
  color TEXT DEFAULT '#7C9DF7', -- pastelBlue
  icon TEXT,
  reminder_time TIME,
  streak_count INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit completions table (tracks daily check-ins)
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  UNIQUE(habit_id, completed_date)
);

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  color TEXT DEFAULT '#A8D5A2', -- pastelGreen
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones table (sub-goals within a goal)
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal sessions table (tracks when user works on goals)
CREATE TABLE IF NOT EXISTS public.goal_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_date DATE DEFAULT CURRENT_DATE,
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, session_date)
);

-- Sync queue for offline-first
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- Friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  visible_streaks TEXT[] DEFAULT ARRAY['pomodoro', 'journal']::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Encouragements table
CREATE TABLE IF NOT EXISTS public.encouragements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  emoji TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NoFap daily logs table (bedtime check-ins)
CREATE TABLE IF NOT EXISTS public.nofap_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  relapsed BOOLEAN DEFAULT FALSE,
  relapse_count INTEGER DEFAULT 0,
  triggers TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Urge events table (for urge surfing analytics)
CREATE TABLE IF NOT EXISTS public.urge_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  surfed_duration INTEGER DEFAULT 0, -- seconds
  succeeded BOOLEAN DEFAULT TRUE,
  technique TEXT DEFAULT 'breathing', -- 'breathing', 'distraction', 'other'
  notes TEXT,
  happened_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streak meta table (for milestone celebrations)
CREATE TABLE IF NOT EXISTS public.streak_meta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('tasks', 'habits', 'journal', 'nofap', 'focus')),
  milestones_celebrated INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  best_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_started_at ON public.pomodoro_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON public.journals(created_at);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON public.streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_timeblocks_user_id_date ON public.timeblocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_archived ON public.habits(is_archived);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_completed_at ON public.habit_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON public.milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_sessions_goal_id ON public.goal_sessions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_sessions_user_date ON public.goal_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON public.sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced_at ON public.sync_queue(synced_at);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_to_user ON public.encouragements(to_user_id);

-- NoFap and streak indexes
CREATE INDEX IF NOT EXISTS idx_nofap_logs_user_date ON public.nofap_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_urge_events_user_time ON public.urge_events(user_id, happened_at);
CREATE INDEX IF NOT EXISTS idx_streak_meta_user_type ON public.streak_meta(user_id, streak_type);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capabilities_updated_at BEFORE UPDATE ON public.capabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON public.journals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeblocks_updated_at BEFORE UPDATE ON public.timeblocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nofap_logs_updated_at BEFORE UPDATE ON public.nofap_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streak_meta_updated_at BEFORE UPDATE ON public.streak_meta
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeblocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encouragements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nofap_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urge_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Capabilities: users can read/update their own capabilities
CREATE POLICY "Users can view own capabilities" ON public.capabilities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own capabilities" ON public.capabilities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own capabilities" ON public.capabilities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Todos: users can CRUD their own todos
CREATE POLICY "Users can manage own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);

-- Pomodoro sessions: users can CRUD their own sessions
CREATE POLICY "Users can manage own pomodoro sessions" ON public.pomodoro_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Journals: users can CRUD their own journals
CREATE POLICY "Users can manage own journals" ON public.journals
  FOR ALL USING (auth.uid() = user_id);

-- Streaks: users can CRUD their own streaks
CREATE POLICY "Users can manage own streaks" ON public.streaks
  FOR ALL USING (auth.uid() = user_id);

-- Timeblocks: users can CRUD their own timeblocks
CREATE POLICY "Users can manage own timeblocks" ON public.timeblocks
  FOR ALL USING (auth.uid() = user_id);

-- Habits: users can CRUD their own habits
CREATE POLICY "Users can manage own habits" ON public.habits
  FOR ALL USING (auth.uid() = user_id);

-- Habit completions: users can CRUD their own completions
CREATE POLICY "Users can manage own habit completions" ON public.habit_completions
  FOR ALL USING (auth.uid() = user_id);

-- Goals: users can CRUD their own goals
CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

-- Milestones: users can CRUD their own milestones
CREATE POLICY "Users can manage own milestones" ON public.milestones
  FOR ALL USING (auth.uid() = user_id);

-- Sync queue: users can manage their own sync queue
CREATE POLICY "Users can manage own sync queue" ON public.sync_queue
  FOR ALL USING (auth.uid() = user_id);

-- Friendships: users can manage friendships they're part of
CREATE POLICY "Users can view friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friendships" ON public.friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = user_id);

-- Encouragements: users can send and receive
CREATE POLICY "Users can view own encouragements" ON public.encouragements
  FOR SELECT USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can send encouragements" ON public.encouragements
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can mark encouragements as read" ON public.encouragements
  FOR UPDATE USING (auth.uid() = to_user_id);

-- NoFap logs: users can manage their own logs
CREATE POLICY "Users can manage own nofap logs" ON public.nofap_logs
  FOR ALL USING (auth.uid() = user_id);

-- Urge events: users can manage their own events
CREATE POLICY "Users can manage own urge events" ON public.urge_events
  FOR ALL USING (auth.uid() = user_id);

-- Streak meta: users can manage their own streak meta
CREATE POLICY "Users can manage own streak meta" ON public.streak_meta
  FOR ALL USING (auth.uid() = user_id);

-- Goal sessions: users can manage their own goal sessions
CREATE POLICY "Users can manage own goal sessions" ON public.goal_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Function to create profile and capabilities on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, NULL, NULL);
  
  INSERT INTO public.capabilities (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles policy for viewing friend profiles (limited info)
CREATE POLICY "Users can view friend profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (user_id = auth.uid() AND friend_id = profiles.id AND status = 'accepted')
         OR (friend_id = auth.uid() AND user_id = profiles.id AND status = 'accepted')
    )
  );

-- Streaks policy for viewing friend streaks (based on visibility settings)
CREATE POLICY "Friends can view allowed streaks" ON public.streaks
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND ((f.user_id = auth.uid() AND f.friend_id = streaks.user_id)
          OR (f.friend_id = auth.uid() AND f.user_id = streaks.user_id))
        AND streaks.type = ANY(f.visible_streaks)
    )
  );

-- Notes table for quick capture
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  content TEXT NOT NULL,
  title TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#1F2937',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes" ON public.notes
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
