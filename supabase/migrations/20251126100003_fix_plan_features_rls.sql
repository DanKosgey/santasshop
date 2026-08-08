-- Fix RLS policy for plan_features table to allow admins to insert new records
-- The previous policy only had a USING clause but no WITH CHECK clause, which caused
-- INSERT operations to fail with "new row violates row-level security policy"

-- Drop the existing policy
drop policy if exists "Admins can manage plan features" on plan_features;

-- Create the corrected policy with both USING and WITH CHECK clauses
create policy "Admins can manage plan features"
  on plan_features for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') )
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );