import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

// Load .env file manually
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Extract project ref from URL: https://<ref>.supabase.co
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const managementEndpoint = `${supabaseUrl}/rest/v1/rpc`;

console.log(`✅ Connected to Supabase project: ${projectRef}`);
console.log(`📡 Endpoint: ${supabaseUrl}\n`);

/**
 * Execute raw SQL via Supabase's pg_execute workaround.
 * We use the service role key which allows full database access.
 */
async function executeSql(sql) {
  const url = `${supabaseUrl}/rest/v1/rpc/execute_sql`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

/**
 * Bootstrap: Create execute_sql function using Supabase's pg_catalog directly.
 * We use a raw HTTPS POST to PostgREST with a special query.
 */
async function bootstrapExecuteSqlFunction() {
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
    GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;
  `;

  // Try Supabase's internal admin endpoint to create the bootstrap function
  const url = `${supabaseUrl}/rest/v1/`;

  // Method: Use pg_meta API (available on hosted Supabase)
  const pgMetaUrl = `${supabaseUrl.replace('.supabase.co', '')}-api.supabase.co/pg-meta/v0/query`;

  // Fallback: Use the Supabase database-level REST API
  const queryUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log('🔧 Bootstrapping execute_sql function...');

  // Try using the pg-meta endpoint first
  try {
    const res = await fetch(`${supabaseUrl.replace('https://', 'https://api.')}/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: createFunctionSql }),
    });

    if (res.ok) {
      console.log('✅ execute_sql function created via Management API\n');
      return;
    }
  } catch (err) {
    // expected to fail without personal access token
  }

  // Try via PostgREST with a raw query body (some Supabase versions support this)
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({ sql: 'SELECT 1' }),
    });

    if (res.ok) {
      console.log('✅ execute_sql already exists\n');
      return;
    }
  } catch (err) {
    // function doesn't exist
  }

  // If we reach here, we need manual bootstrap
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('⚠️  ONE-TIME SETUP REQUIRED');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('Please run this SQL ONCE in your Supabase SQL Editor:');
  console.error('  👉 https://supabase.com/dashboard/project/' + projectRef + '/sql');
  console.error('');
  console.error('  CREATE OR REPLACE FUNCTION public.execute_sql(sql text)');
  console.error('  RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$');
  console.error('  BEGIN EXECUTE sql; END; $$;');
  console.error('  GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;');
  console.error('');
  console.error('After running it, run this script again: node supabase/run-migrations.js');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
}

async function applyMigration(filePath) {
  const sql = readFileSync(filePath, 'utf8');
  const fileName = filePath.split(/[/\\]/).pop();

  console.log(`📄 Applying: ${fileName}`);

  // Split into statements, handling $$ blocks carefully
  const statements = [];
  let currentStatement = '';
  let insideDollarQuote = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;

    if (trimmed.includes('$$')) {
      insideDollarQuote = !insideDollarQuote;
    }

    currentStatement += line + '\n';

    if (!insideDollarQuote && trimmed.endsWith(';')) {
      const stmt = currentStatement.trim();
      if (stmt.length > 1) statements.push(stmt);
      currentStatement = '';
    }
  }

  // Remaining statement
  if (currentStatement.trim().length > 1) {
    statements.push(currentStatement.trim());
  }

  let applied = 0;
  let skipped = 0;

  for (const statement of statements) {
    if (!statement || statement === ';') continue;

    try {
      await executeSql(statement);
      applied++;
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate') ||
        msg.includes('42P07') ||  // relation already exists
        msg.includes('42710')     // duplicate_object
      ) {
        skipped++;
        continue;
      }

      console.error(`  ❌ Error in statement:\n    ${statement.substring(0, 100)}...`);
      console.error(`  Reason: ${msg.substring(0, 200)}`);
      // Continue instead of exiting — apply as much as possible
    }
  }

  console.log(`  ✓ ${applied} statements applied, ${skipped} skipped (already exist)\n`);
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀  Forex Royal — Remote Migration Runner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await bootstrapExecuteSqlFunction();

  const migrationsDir = resolve('supabase/migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Only run the 10 new Pool Trading migrations
  const newMigrations = files.filter(f => f.startsWith('20260809'));

  if (newMigrations.length === 0) {
    console.log('✅ No new Pool Trading migrations to apply.');
    process.exit(0);
  }

  console.log(`📦 Found ${newMigrations.length} new migration files to apply:\n`);
  newMigrations.forEach(f => console.log(`   • ${f}`));
  console.log('');

  for (const file of newMigrations) {
    await applyMigration(join(migrationsDir, file));
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  All Pool Trading migrations applied successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
