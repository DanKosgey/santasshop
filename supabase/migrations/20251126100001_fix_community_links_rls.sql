-- Fix RLS policy for community_links table to allow admins to insert new records
-- The previous policy only had a USING clause but no WITH CHECK clause, which caused
-- INSERT operations to fail with "new row violates row-level security policy"

-- Drop the existing policy
drop policy if exists "Admins can manage community links" on community_links;

-- Create the corrected policy with both USING and WITH CHECK clauses
create policy "Admins can manage community links"
  on community_links for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') )
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );