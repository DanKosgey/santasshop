-- Fix RLS policy for courses table to ensure only one insert policy exists
-- The previous migrations created conflicting policies which may cause RLS violations

-- Drop all existing insert policies for courses
drop policy if exists "Admins can insert courses." on courses;
drop policy if exists "Admins can create course versions." on courses;

-- Create a single, clear policy for course insertion
create policy "Admins can insert courses"
  on courses for insert
  with check ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Also ensure the select policy is correct
drop policy if exists "Courses are viewable by everyone." on courses;
create policy "Courses are viewable by everyone"
  on courses for select
  using ( true );

-- Also ensure the update policy is correct
drop policy if exists "Admins can update courses." on courses;
create policy "Admins can update courses"
  on courses for update
  using ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Also ensure the delete policy is correct
drop policy if exists "Admins can delete courses." on courses;
create policy "Admins can delete courses"
  on courses for delete
  using ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));

-- Add comments to describe the policies
comment on policy "Admins can insert courses" on courses is 
'Allows admin users to create new courses in the system';

comment on policy "Courses are viewable by everyone" on courses is 
'Allows all users to view available courses';

comment on policy "Admins can update courses" on courses is 
'Allows admin users to update existing courses';

comment on policy "Admins can delete courses" on courses is 
'Allows admin users to delete courses';