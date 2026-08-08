-- Fix RLS policy for course_categories table to ensure only one insert policy exists
-- The previous migrations created conflicting policies which may cause RLS violations

-- Drop all existing insert policies for course_categories
drop policy if exists "Admins can manage course categories." on course_categories;
drop policy if exists "Admins can insert course categories." on course_categories;

-- Create separate, clear policies for each operation
-- Select policy (unchanged)
drop policy if exists "Course categories are viewable by everyone." on course_categories;
create policy "Course categories are viewable by everyone"
  on course_categories for select
  using ( true );

-- Insert policy
create policy "Admins can insert course categories"
  on course_categories for insert
  with check ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Update policy
create policy "Admins can update course categories"
  on course_categories for update
  using ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Delete policy
create policy "Admins can delete course categories"
  on course_categories for delete
  using ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Add comments to describe the policies
comment on policy "Course categories are viewable by everyone" on course_categories is 
'Allows all users to view available course categories';

comment on policy "Admins can insert course categories" on course_categories is 
'Allows admin users to create new course categories';

comment on policy "Admins can update course categories" on course_categories is 
'Allows admin users to update existing course categories';

comment on policy "Admins can delete course categories" on course_categories is 
'Allows admin users to delete course categories';