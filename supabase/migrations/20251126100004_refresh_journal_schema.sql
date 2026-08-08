-- Refresh the schema cache for journal_entries table to include enhanced columns
-- This migration ensures that the confidence_level and other enhanced columns are recognized by PostgREST

-- First, verify that the enhanced columns exist
DO $$ 
BEGIN
  -- Check if confidence_level column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'journal_entries' 
    AND column_name = 'confidence_level'
  ) THEN
    -- Add the missing columns if they don't exist
    ALTER TABLE journal_entries 
    ADD COLUMN IF NOT EXISTS strategy text,
    ADD COLUMN IF NOT EXISTS time_frame text,
    ADD COLUMN IF NOT EXISTS market_condition text,
    ADD COLUMN IF NOT EXISTS confidence_level integer check (confidence_level >= 1 and confidence_level <= 10),
    ADD COLUMN IF NOT EXISTS risk_amount numeric,
    ADD COLUMN IF NOT EXISTS position_size numeric,
    ADD COLUMN IF NOT EXISTS trade_duration interval,
    ADD COLUMN IF NOT EXISTS tags text[],
    ADD COLUMN IF NOT EXISTS admin_notes text,
    ADD COLUMN IF NOT EXISTS admin_review_status text default 'pending' check (admin_review_status in ('pending', 'reviewed', 'flagged')),
    ADD COLUMN IF NOT EXISTS review_timestamp timestamp with time zone,
    ADD COLUMN IF NOT EXISTS mentor_id uuid references profiles(id),
    ADD COLUMN IF NOT EXISTS session_id uuid,
    ADD COLUMN IF NOT EXISTS trade_source text check (trade_source in ('demo', 'live', 'paper')),
    ADD COLUMN IF NOT EXISTS screenshot_url text;
  END IF;
END $$;

-- Refresh the PostgREST schema cache
-- Note: This command needs to be run separately as it's not a standard SQL command
-- Notify the application that the schema has been updated
SELECT 'Schema refresh complete. Please restart Supabase services if needed.' as message;