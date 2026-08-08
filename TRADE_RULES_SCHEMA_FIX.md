# Trade Rules Schema Fix

## Problem Description

When attempting to access the `trade_rules` table, users encountered the following error:

```
Could not find the table 'public.trade_rules' in the schema cache
```

This error occurred despite the table being defined in the database schema.

## Root Cause

The issue was caused by a mismatch between the database schema and the Supabase PostgREST schema cache:

1. The `trade_rules` table and related tables (`user_rules`, `rule_versions`, `rule_audit_log`) were created through migration `20251120100013_create_trade_rules_table.sql`
2. However, the Supabase PostgREST service maintains an internal schema cache that wasn't refreshed after the migration
3. When the application tried to access these tables, PostgREST rejected the request because it didn't recognize these tables in its cache

## Solution

The fix involves two parts:

### 1. Migration File
Created migration `20251126100005_refresh_trade_rules_schema.sql` which:
- Verifies that all trade rules related tables exist
- Creates any missing tables if needed
- Ensures all necessary indexes are in place
- Enables Row Level Security (RLS) on all tables
- Provides instructions for refreshing the schema cache

### 2. Schema Cache Refresh
The Supabase PostgREST schema cache needs to be refreshed. This typically requires:
- Restarting the Supabase services
- Or manually triggering a schema refresh through the Supabase dashboard

## Implementation Steps

1. Apply the migration file `20251126100005_refresh_trade_rules_schema.sql` to your database
2. Restart your Supabase services to refresh the PostgREST schema cache
3. Alternatively, use the Supabase dashboard to trigger a schema refresh
4. Test the trade rules functionality

## Testing

A test script `test-trade-rules-schema-fix.ts` has been created to verify the fix:
- Checks that the `trade_rules` table is accessible
- Validates that trade rule structures are correct
- Provides instructions for ensuring the fix is properly applied

## Related Tables

This fix affects the following tables:
- `trade_rules` - Main table for trading rules
- `user_rules` - User-specific rule associations
- `rule_versions` - Rule versioning history
- `rule_audit_log` - Audit trail for rule changes

## Prevention

To prevent similar issues in the future:
1. Always restart Supabase services after applying schema migrations
2. Monitor for schema cache issues when adding new tables
3. Test all affected functionality after database schema changes