-- Fix RLS Defaults
-- Run this script in your Supabase SQL Editor to apply the fixes.
-- This avoids the "relation already exists" errors by modifying the existing tables.

ALTER TABLE public.todos ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.habits ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.goals ALTER COLUMN user_id SET DEFAULT auth.uid();
