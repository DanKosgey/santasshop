import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

// Load environment variables from .env file
const dotenv = await import('dotenv');
const path = await import('path');
const fs = await import('fs');

// Load .env file
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filePath) {
  try {
    // Read the migration file
    const migrationSql = readFileSync(filePath, 'utf8');
    
    console.log(`Applying migration: ${filePath}`);
    
    // Split the migration into individual statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.startsWith('--')) {
        // Skip comments
        continue;
      }
      
      // Skip empty statements
      if (statement.trim() === '') {
        continue;
      }
      
      console.log('Executing statement:', statement.substring(0, 50) + '...');
      
      // Handle CREATE statements with IF NOT EXISTS variants
      let modifiedStatement = statement;
      if (statement.toLowerCase().includes('create table') && !statement.toLowerCase().includes('if not exists')) {
        modifiedStatement = statement.replace(/create table/i, 'create table if not exists');
      } else if (statement.toLowerCase().includes('create policy') && !statement.toLowerCase().includes('if not exists')) {
        // For policies, we'll skip the error if it already exists
        try {
          const { error } = await supabase.rpc('execute_sql', { sql: statement });
          if (error) {
            if (error.message.includes('already exists')) {
              console.log('Skipping (already exists):', statement.substring(0, 50) + '...');
            } else {
              throw error;
            }
          }
          continue;
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log('Skipping (already exists):', statement.substring(0, 50) + '...');
            continue;
          } else {
            throw err;
          }
        }
      } else if (statement.toLowerCase().includes('create or replace function')) {
        // Functions should be fine with CREATE OR REPLACE
      } else if (statement.toLowerCase().includes('create function') && !statement.toLowerCase().includes('or replace')) {
        modifiedStatement = statement.replace(/create function/i, 'create or replace function');
      }
      
      const { error } = await supabase.rpc('execute_sql', { sql: modifiedStatement });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log('Skipping (already exists):', statement.substring(0, 50) + '...');
        } else {
          console.error('Error executing statement:', error);
          process.exit(1);
        }
      }
    }
    
    console.log(`Migration applied successfully: ${filePath}\n`);
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

async function applyAllMigrations() {
  try {
    // Get all migration files sorted by filename (timestamp)
    const migrationsDir = resolve('./supabase/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== 'supabase_schema.sql')
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files to apply.`);
    
    // Apply each migration in order
    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      await applyMigration(filePath);
    }
    
    console.log('All migrations applied successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

// Check if a specific file was provided as argument
if (process.argv[2]) {
  const filePath = resolve(process.argv[2]);
  applyMigration(filePath);
} else {
  // Apply all migrations
  applyAllMigrations();
}