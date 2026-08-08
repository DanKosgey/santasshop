# Course Modules RLS Policy Fix

## Problem Description

When attempting to create new course modules through the admin portal, users encountered the following error:

```
new row violates row-level security policy for table "course_modules"
```

This error occurred despite the user having admin privileges.

## Root Cause

The issue was caused by conflicting Row Level Security (RLS) policies on the `course_modules` table:

1. The `20251120100003_enhanced_course_curriculum.sql` migration created a policy named "Admins can insert course modules."
2. The `20251120100004_course_versioning.sql` migration created another policy named "Admins can create module versions."
3. Both policies were defined for the INSERT operation on the `course_modules` table with the same conditions
4. This created a conflict where PostgreSQL didn't know which policy to apply

When multiple policies exist for the same operation on a table, PostgreSQL evaluates them using OR logic. However, in some cases with complex conditions, this can lead to unexpected behavior and policy violations.

## Solution

The fix involved creating a migration `20251126100007_fix_course_modules_rls.sql` that:

1. Drops all existing INSERT policies for the `course_modules` table
2. Creates a single, clear policy named "Admins can insert course modules" for INSERT operations
3. Also cleans up and standardizes the other policies for SELECT, UPDATE, and DELETE operations
4. Adds comments to describe each policy for better maintainability

The new policy is:
```sql
create policy "Admins can insert course modules"
  on course_modules for insert
  with check ( exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ));
```

## Implementation Steps

1. Apply the migration file `20251126100007_fix_course_modules_rls.sql` to your database
2. Restart your Supabase services to refresh the PostgREST schema cache
3. Test the course module creation functionality

## Testing

A test script `test-course-modules-rls-fix.ts` has been created to verify the fix:
- Creates a temporary course to attach modules to
- Attempts to create a test course module
- Verifies that the operation succeeds for admin users
- Cleans up the test data
- Provides detailed error information if the fix doesn't work

## Prevention

To prevent similar issues in the future:
1. Ensure that only one policy exists for each operation on a table
2. Use clear, descriptive names for policies
3. Document policies with comments
4. Test RLS policies thoroughly after any changes
5. Monitor for policy conflicts when adding new migrations