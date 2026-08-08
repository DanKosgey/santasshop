# Subscription Plans RLS Policy Fix

## Problem Description

When attempting to create new subscription plans through the admin portal, users encountered the following error:

```
new row violates row-level security policy for table "subscription_plans"
```

This error occurred despite the user having admin privileges.

## Root Cause

The issue was with the Row Level Security (RLS) policy defined for the `subscription_plans` table. The original policy was:

```sql
create policy "Admins can manage subscription plans"
  on subscription_plans for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );
```

This policy only had a `USING` clause but lacked a `WITH CHECK` clause. In PostgreSQL RLS:

- The `USING` clause determines which rows are visible for SELECT, UPDATE, and DELETE operations
- The `WITH CHECK` clause determines which rows can be inserted or updated

When performing an INSERT operation, PostgreSQL checks the `WITH CHECK` clause to determine if the user is allowed to create the new row. Since there was no `WITH CHECK` clause, the operation failed with the RLS violation error.

## Solution

The fix was to add a `WITH CHECK` clause to the policy that mirrors the `USING` clause:

```sql
create policy "Admins can manage subscription plans"
  on subscription_plans for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') )
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );
```

This ensures that:
1. Only admins can view, insert, update, or delete subscription plans
2. The same condition is applied for both row visibility and row creation

## Implementation

The fix was implemented in a new migration file `20251126100002_fix_subscription_plans_rls.sql` that:
1. Drops the existing policy
2. Creates the corrected policy with both `USING` and `WITH CHECK` clauses

## Testing

A test script `test-subscription-plans-fix.ts` was created to verify the fix works correctly by:
1. Attempting to create a new subscription plan
2. Verifying the operation succeeds
3. Cleaning up the test data

## Related Issues

This is the same type of issue that was affecting the community_links table, which was fixed in a similar manner.