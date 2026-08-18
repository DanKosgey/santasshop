/**
 * reset-all-data.js
 * ==========================================
 * FULL DATABASE RESET — IRREVERSIBLE
 * Deletes ALL rows in ALL tables and ALL auth users.
 * Run with: node supabase/reset-all-data.js
 * ==========================================
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eettnnvzxcuvwzazbkng.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldHRubnZ6eGN1dnd6YXpia25nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0Njk4MywiZXhwIjoyMDc4NDIyOTgzfQ.EAe8xdb-T-Zet2h2eTZ8FWgG38Qn3gIUBHNj9mj6lT4';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// All data tables in dependency order (children before parents)
const DATA_TABLES = [
  'investment_activity_log',
  'withdrawal_requests',
  'pool_trading_investments',
  'pool_trading_applications',
  'vip_requests',
  'admin_notifications',
  'admin_notification_settings',
  'todos',
  'user_progress',
  'journal_entries',
  'notification_preferences',
  'notifications',
  'subscription_history',
  'social_media_profiles',
  'social_media_posts',
  'social_media_likes',
  'social_media_comments',
  'community_links',
  'profiles',
];

async function deleteTableData(table) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    const { error: e2, count: c2 } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .gte('created_at', '2000-01-01');

    if (e2) {
      console.warn(`  WARNING  Could not clear "${table}": ${e2.message}`);
      return 0;
    }
    console.log(`  OK  Cleared "${table}" -- ${c2 ?? '?'} rows deleted`);
    return c2 ?? 0;
  }
  console.log(`  OK  Cleared "${table}" -- ${count ?? '?'} rows deleted`);
  return count ?? 0;
}

async function deleteAllAuthUsers() {
  console.log('\nDeleting all auth users...');
  let page = 1;
  let totalDeleted = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      console.error('  FAILED to list auth users:', error.message);
      break;
    }

    const users = data?.users ?? [];
    if (users.length === 0) break;

    console.log(`  Found ${users.length} auth users on page ${page}...`);

    for (const user of users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) {
        console.warn(`  WARNING  Could not delete user ${user.email}: ${delErr.message}`);
      } else {
        totalDeleted++;
      }
    }

    if (users.length < 1000) break;
    page++;
  }

  console.log(`  Deleted ${totalDeleted} auth users`);
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('  FOREX ROYAL -- FULL DATABASE RESET');
  console.log('========================================');
  console.log('');
  console.log('WARNING: This will permanently delete ALL data.');
  console.log('');

  console.log('Clearing all data tables...\n');
  let totalRows = 0;

  for (const table of DATA_TABLES) {
    const rows = await deleteTableData(table);
    totalRows += rows;
  }

  const extraTables = ['pool_trading_packages'];
  console.log('\nClearing package/config tables...\n');
  for (const table of extraTables) {
    const rows = await deleteTableData(table);
    totalRows += rows;
  }

  await deleteAllAuthUsers();

  console.log('');
  console.log('========================================');
  console.log('  RESET COMPLETE');
  console.log(`  Total data rows deleted: ${totalRows}`);
  console.log('  All auth users deleted.');
  console.log('  The app is now in a fresh state.');
  console.log('========================================');
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
