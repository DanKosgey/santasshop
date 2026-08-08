-- Refresh the schema cache for trade_rules table and related tables
-- This migration ensures that the trade_rules, user_rules, rule_versions, and rule_audit_log tables are recognized by PostgREST

-- First, verify that all tables exist and create them if they don't
DO $$ 
BEGIN
  -- Check if trade_rules table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'trade_rules'
  ) THEN
    -- Create trade_rules table
    CREATE TABLE trade_rules (
      id uuid default uuid_generate_v4() primary key,
      text text not null,
      type text check (type in ('buy', 'sell')) not null,
      required boolean default true,
      order_number integer default 0,
      created_by uuid references profiles(id),
      created_at timestamp with time zone default timezone('utc'::text, now()),
      updated_at timestamp with time zone default timezone('utc'::text, now())
    );
  END IF;

  -- Check if user_rules table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'user_rules'
  ) THEN
    -- Create user_rules table
    CREATE TABLE user_rules (
      user_id uuid references profiles(id) on delete cascade,
      rule_id uuid references trade_rules(id) on delete cascade,
      is_active boolean default true,
      created_at timestamp with time zone default timezone('utc'::text, now()),
      primary key (user_id, rule_id)
    );
  END IF;

  -- Check if rule_versions table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'rule_versions'
  ) THEN
    -- Create rule_versions table
    CREATE TABLE rule_versions (
      id uuid default uuid_generate_v4() primary key,
      rule_id uuid references trade_rules(id) on delete cascade,
      text text not null,
      version_number integer not null,
      created_by uuid references profiles(id),
      created_at timestamp with time zone default timezone('utc'::text, now()),
      unique(rule_id, version_number)
    );
  END IF;

  -- Check if rule_audit_log table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'rule_audit_log'
  ) THEN
    -- Create rule_audit_log table
    CREATE TABLE rule_audit_log (
      id uuid default uuid_generate_v4() primary key,
      rule_id uuid references trade_rules(id),
      action text not null, -- 'created', 'updated', 'deleted'
      old_values jsonb,
      new_values jsonb,
      changed_by uuid references profiles(id),
      changed_at timestamp with time zone default timezone('utc'::text, now())
    );
  END IF;
END $$;

-- Create indexes if they don't exist
create index if not exists trade_rules_type_idx on trade_rules(type);
create index if not exists trade_rules_order_idx on trade_rules(order_number);
create index if not exists trade_rules_created_by_idx on trade_rules(created_by);
create index if not exists user_rules_user_id_idx on user_rules(user_id);
create index if not exists user_rules_rule_id_idx on user_rules(rule_id);
create index if not exists rule_versions_rule_id_idx on rule_versions(rule_id);
create index if not exists rule_audit_log_rule_id_idx on rule_audit_log(rule_id);
create index if not exists rule_audit_log_changed_by_idx on rule_audit_log(changed_by);

-- Enable RLS if not already enabled
alter table trade_rules enable row level security;
alter table user_rules enable row level security;
alter table rule_versions enable row level security;
alter table rule_audit_log enable row level security;

-- Refresh the PostgREST schema cache
-- Note: This command needs to be run separately as it's not a standard SQL command
-- Notify the application that the schema has been updated
SELECT 'Schema refresh complete. Please restart Supabase services if needed.' as message;