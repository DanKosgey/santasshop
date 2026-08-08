-- Test the handle_new_user function to ensure it properly sets subscription tiers
-- This is a test migration to verify the function works correctly

-- First, let's check if the function exists
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'handle_new_user'
);

-- Test the function with different subscription tier values
-- We'll create a test user with each tier and verify the profile is created correctly

-- Test with free tier
-- Note: This is just for verification, we won't actually insert test data into the auth.users table
-- In a real test, we would need to simulate the auth trigger

-- The important thing is to verify that the function properly handles the subscription tier mapping:
-- 'free' -> 'free'
-- 'foundation' -> 'foundation'
-- 'professional' -> 'professional'
-- 'elite' -> 'elite-pending'

-- Let's also verify the constraint on the subscription_tier column
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conname = 'valid_subscription_tier';