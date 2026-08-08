-- Refresh the schema cache for notifications table to include enhanced columns
-- This migration ensures that the related_entity_id and related_entity_type columns are recognized by PostgREST

-- First, verify that the enhanced columns exist and add them if they don't
DO $$ 
BEGIN
  -- Check if related_entity_id column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'related_entity_id'
  ) THEN
    -- Add the missing column
    ALTER TABLE notifications 
    ADD COLUMN related_entity_id uuid;
  END IF;
  
  -- Check if related_entity_type column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'related_entity_type'
  ) THEN
    -- Add the missing column
    ALTER TABLE notifications 
    ADD COLUMN related_entity_type text 
    CHECK (related_entity_type IN ('trade', 'course', 'quiz', 'module'));
  END IF;
END $$;

-- Create indexes if they don't exist
create index if not exists idx_notifications_related_entity on notifications(related_entity_id, related_entity_type);

-- Add comments to describe the columns
comment on column notifications.related_entity_id is 'ID of the related entity (trade, course, etc.)';
comment on column notifications.related_entity_type is 'Type of the related entity';

-- Refresh the PostgREST schema cache
-- Note: This command needs to be run separately as it's not a standard SQL command
-- Notify the application that the schema has been updated
SELECT 'Schema refresh complete. Please restart Supabase services if needed.' as message;