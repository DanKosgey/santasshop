-- Fix RLS policy for course_modules table to ensure only one insert policy exists
-- The previous migrations created conflicting policies which may cause RLS violations

-- Drop all existing insert policies for course_modules
drop policy if exists "Admins can insert course modules." on course_modules;
drop policy if exists "Admins can create module versions." on course_modules;

-- Create a single, clear policy for course module insertion
create policy "Admins can insert course modules"
  on course_modules for insert
  with check ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Also ensure the select policy is correct
drop policy if exists "Course modules are viewable by everyone." on course_modules;
create policy "Course modules are viewable by everyone"
  on course_modules for select
  using ( true );

-- Also ensure the update policy is correct
drop policy if exists "Admins can update course modules." on course_modules;
create policy "Admins can update course modules"
  on course_modules for update
  using ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Also ensure the delete policy is correct
drop policy if exists "Admins can delete course modules." on course_modules;
create policy "Admins can delete course modules"
  on course_modules for delete
  using ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Add comments to describe the policies
comment on policy "Admins can insert course modules" on course_modules is 
'Allows admin users to create new course modules in the system';

comment on policy "Course modules are viewable by everyone" on course_modules is 
'Allows all users to view available course modules';

comment on policy "Admins can update course modules" on course_modules is 
'Allows admin users to update existing course modules';

comment on policy "Admins can delete course modules" on course_modules is 
'Allows admin users to delete course modules';