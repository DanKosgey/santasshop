-- Enable Supabase Realtime on profiles table
-- This is required for real-time profile change subscriptions in the app
-- (e.g., so bot access changes by admin reflect immediately for the student)

ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
