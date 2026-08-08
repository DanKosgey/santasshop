-- Add missing order_number column to course_modules table
-- This migration fixes the schema mismatch where the column was defined in the table creation
-- but may not have been applied correctly in some environments

-- Add the order_number column if it doesn't exist
alter table course_modules add column if not exists order_number integer;

-- Add a comment to describe the column's purpose
comment on column course_modules.order_number is 'For sequencing modules within a course';

-- Update any existing records to have a default order_number value
update course_modules set order_number = 0 where order_number is null;

-- Add a default value for new records
alter table course_modules alter column order_number set default 0;