# Notifications Schema Fix

## Problem Description

When attempting to create notifications with enhanced fields, users encountered the following error:

```
Could not find the 'related_entity_id' column of 'notifications' in the schema cache
```

This error occurred despite the column being defined in the database schema.

## Root Cause

The issue was caused by a mismatch between the database schema and the Supabase PostgREST schema cache:

1. The `related_entity_id` and `related_entity_type` columns were added to the `notifications` table through migration `20251122100002_notification_system_enhanced.sql`
2. However, the Supabase PostgREST service maintains an internal schema cache that wasn't refreshed after the migration
3. When the application tried to insert data with the enhanced columns, PostgREST rejected the request because it didn't recognize these columns in its cache

## Solution

The fix involves two parts:

### 1. Migration File
Created migration `20251126100008_refresh_notifications_schema.sql` which:
- Verifies that the `related_entity_id` and `related_entity_type` columns exist on the `notifications` table
- Adds any missing columns if needed
- Ensures all necessary indexes are in place
- Provides instructions for refreshing the schema cache

### 2. Schema Cache Refresh
The Supabase PostgREST schema cache needs to be refreshed. This typically requires:
- Restarting the Supabase services
- Or manually triggering a schema refresh through the Supabase dashboard

## Implementation Steps

1. Apply the migration file `20251126100008_refresh_notifications_schema.sql` to your database
2. Restart your Supabase services to refresh the PostgREST schema cache
3. Alternatively, use the Supabase dashboard to trigger a schema refresh
4. Test the notification creation functionality

## Testing

A test script `test-notifications-schema-fix.ts` has been created to verify the fix:
- Validates that notification structures with enhanced fields are correct
- Provides instructions for ensuring the fix is properly applied

## Prevention

To prevent similar issues in the future:
1. Always restart Supabase services after applying schema migrations
2. Monitor for schema cache issues when adding new columns
3. Test all affected functionality after database schema changes