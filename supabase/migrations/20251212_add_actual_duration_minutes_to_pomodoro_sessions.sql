-- Add actual duration to support partial (stopped) Pomodoro sessions
ALTER TABLE public.pomodoro_sessions
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER;

-- Backfill completed sessions so analytics can rely on actual_duration_minutes
UPDATE public.pomodoro_sessions
SET actual_duration_minutes = duration_minutes
WHERE completed = TRUE AND actual_duration_minutes IS NULL;
