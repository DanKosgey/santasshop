# Plan Features RLS Policy Fix

## Problem Description

When attempting to create new plan features through the admin portal, users would encounter RLS (Row Level Security) policy violations similar to those experienced with community links and subscription plans:

```
new row violates row-level security policy for table "plan_features"
```

This error occurred despite the user having admin privileges.

## Root Cause

The issue was with the Row Level Security (RLS) policy defined for the `plan_features` table. The original policy was:

```sql
create policy "Admins can manage plan features"
  on plan_features for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );
```

This policy only had a `USING` clause but lacked a `WITH CHECK` clause. In PostgreSQL RLS:

- The `USING` clause determines which rows are visible for SELECT, UPDATE, and DELETE operations
- The `WITH CHECK` clause determines which rows can be inserted or updated

When performing an INSERT operation, PostgreSQL checks the `WITH CHECK` clause to determine if the user is allowed to create the new row. Since there was no `WITH CHECK` clause, the operation failed with the RLS violation error.

## Solution

The fix was to add a `WITH CHECK` clause to the policy that mirrors the `USING` clause:

```sql
create policy "Admins can manage plan features"
  on plan_features for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') )
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );
```

This ensures that:
1. Only admins can view, insert, update, or delete plan features
2. The same condition is applied for both row visibility and row creation

## Implementation

The fix was implemented in a new migration file `20251126100003_fix_plan_features_rls.sql` that:
1. Drops the existing policy
2. Creates the corrected policy with both `USING` and `WITH CHECK` clauses

## Testing

A test script `test-plan-features-fix.ts` was created to verify the fix works correctly by:
1. Creating a temporary subscription plan
2. Attempting to create a new plan feature for that plan
3. Verifying the operation succeeds
4. Cleaning up the test data

## Related Issues

This is the same type of issue that was affecting the community_links and subscription_plans tables, which were fixed in a similar manner.