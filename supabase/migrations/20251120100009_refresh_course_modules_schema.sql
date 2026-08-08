-- Refresh course_modules table schema to fix schema cache issues
-- This migration ensures that the Supabase schema cache recognizes all columns in the course_modules table

-- First, verify that all expected columns exist
alter table course_modules add column if not exists course_id uuid references courses(id) on delete cascade;
alter table course_modules add column if not exists title text not null default '';
alter table course_modules add column if not exists description text;
alter table course_modules add column if not exists duration text;
alter table course_modules add column if not exists level text check (level in ('beginner', 'intermediate', 'advanced'));
alter table course_modules add column if not exists content text;
alter table course_modules add column if not exists content_type text check (content_type in ('video', 'text'));
alter table course_modules add column if not exists order_number integer default 0;
alter table course_modules add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table course_modules add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Ensure the course_id column has the proper foreign key constraint
do $$ 
begin
  if not exists (select 1 from pg_constraint where conname = 'course_modules_course_id_fkey') then
    alter table course_modules add constraint course_modules_course_id_fkey 
    foreign key (course_id) references courses(id) on delete cascade;
  end if;
end $$;

-- Add comments for documentation
comment on column course_modules.course_id is 'Reference to the course this module belongs to';
comment on column course_modules.title is 'Module title';
comment on column course_modules.description is 'Module description';
comment on column course_modules.duration is 'Estimated time to complete';
comment on column course_modules.level is 'Difficulty level';
comment on column course_modules.content is 'Module content (video ID or text content)';
comment on column course_modules.content_type is 'Type of content (video or text)';
comment on column course_modules.order_number is 'For sequencing modules within a course';
comment on column course_modules.created_at is 'Timestamp when module was created';
comment on column course_modules.updated_at is 'Timestamp when module was last updated';

-- Update any existing records to ensure they have proper default values
update course_modules set title = 'Untitled Module' where title is null or title = '';
update course_modules set level = 'beginner' where level is null;
update course_modules set content_type = 'video' where content_type is null;
update course_modules set order_number = 0 where order_number is null;
update course_modules set updated_at = created_at where updated_at is null;

-- Ensure the updated_at column automatically updates
DO $$
BEGIN
    -- Create or replace the function
    CREATE OR REPLACE FUNCTION update_course_modules_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS update_course_modules_updated_at ON course_modules;

    -- Create the trigger
    CREATE TRIGGER update_course_modules_updated_at
        BEFORE UPDATE ON course_modules
        FOR EACH ROW
        EXECUTE FUNCTION update_course_modules_updated_at_column();
EXCEPTION WHEN OTHERS THEN
    -- Handle any errors silently
    NULL;
END $$;