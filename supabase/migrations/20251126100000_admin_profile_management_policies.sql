-- Add RLS policies to allow admins to manage student profiles
-- This migration adds policies that allow admin users to update and delete any profile

-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Admins can update any profile." on profiles;
drop policy if exists "Admins can delete any profile." on profiles;

-- Create policy for admins to update any profile
create policy "Admins can update any profile."
  on profiles for update
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Create policy for admins to delete any profile
create policy "Admins can delete any profile."
  on profiles for delete
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Add comment to document the changes
comment on policy "Admins can update any profile." on profiles is 
'Allows admin users to update any user profile in the system';

comment on policy "Admins can delete any profile." on profiles is 
'Allows admin users to delete any user profile in the system';