# Course Categories RLS Policy Fix

## Problem Description

When attempting to create new course categories through the admin portal, users encountered the following error:

```
new row violates row-level security policy for table "course_categories"
```

This error occurred despite the user having admin privileges.

## Root Cause

The issue was caused by conflicting Row Level Security (RLS) policies on the `course_categories` table:

1. The `20251120100003_enhanced_course_curriculum.sql` migration created a policy named "Admins can manage course categories." with `for all` operations
2. This policy only had a `using` clause but was missing the `with check` clause for INSERT operations
3. Additionally, the policy structure was not consistent with the approach used for other tables

When a policy is defined with `for all` operations but only has a `using` clause (which applies to SELECT, UPDATE, and DELETE), it doesn't properly handle INSERT operations which require a `with check` clause.

## Solution

The fix involved creating a migration `20251126100009_fix_course_categories_rls.sql` that:

1. Drops the existing conflicting "Admins can manage course categories." policy
2. Creates separate, clear policies for each operation (SELECT, INSERT, UPDATE, DELETE)
3. Ensures each policy has the appropriate clauses:
   - `using` clause for SELECT, UPDATE, and DELETE operations
   - `with check` clause for INSERT operations
4. Adds comments to describe each policy for better maintainability

### Specific Changes

1. **Select Policy**: "Course categories are viewable by everyone" - Unchanged from original
2. **Insert Policy**: "Admins can insert course categories" - New policy with proper `with check` clause
3. **Update Policy**: "Admins can update course categories" - New policy with proper `using` clause
4. **Delete Policy**: "Admins can delete course categories" - New policy with proper `using` clause

## Prevention

To prevent similar issues in the future:
1. Ensure that only one policy exists for each operation on a table
2. Use clear, descriptive names for policies
3. Document policies with comments
4. Test RLS policies thoroughly after any changes
5. Monitor for policy conflicts when adding new migrations
6. Follow the same pattern for all tables: separate policies for each operation rather than using `for all`