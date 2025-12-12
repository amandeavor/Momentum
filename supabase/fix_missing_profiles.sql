-- Fix missing profiles for existing auth users
-- Run this in your Supabase SQL Editor

-- Insert profiles for any auth users that don't have one
INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
SELECT 
  au.id,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Insert capabilities for any users that don't have them
INSERT INTO public.capabilities (user_id, created_at, updated_at)
SELECT 
  p.id,
  NOW(),
  NOW()
FROM public.profiles p
LEFT JOIN public.capabilities c ON p.id = c.user_id
WHERE c.user_id IS NULL;

-- Show count of fixed records
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.capabilities) as capabilities_count,
  (SELECT COUNT(*) FROM auth.users) as users_count;
