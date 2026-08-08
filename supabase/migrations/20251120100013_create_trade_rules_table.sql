-- Create trade_rules table
create table if not exists trade_rules (
  id uuid default uuid_generate_v4() primary key,
  text text not null,
  type text check (type in ('buy', 'sell')) not null,
  required boolean default true,
  order_number integer default 0,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create user_rules table for user-specific rule associations
create table if not exists user_rules (
  user_id uuid references profiles(id) on delete cascade,
  rule_id uuid references trade_rules(id) on delete cascade,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, rule_id)
);

-- Create rule_versions table for rule versioning
create table if not exists rule_versions (
  id uuid default uuid_generate_v4() primary key,
  rule_id uuid references trade_rules(id) on delete cascade,
  text text not null,
  version_number integer not null,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(rule_id, version_number)
);

-- Create rule_audit_log table for tracking changes
create table if not exists rule_audit_log (
  id uuid default uuid_generate_v4() primary key,
  rule_id uuid references trade_rules(id),
  action text not null, -- 'created', 'updated', 'deleted'
  old_values jsonb,
  new_values jsonb,
  changed_by uuid references profiles(id),
  changed_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for better performance
create index if not exists trade_rules_type_idx on trade_rules(type);
create index if not exists trade_rules_order_idx on trade_rules(order_number);
create index if not exists trade_rules_created_by_idx on trade_rules(created_by);
create index if not exists user_rules_user_id_idx on user_rules(user_id);
create index if not exists user_rules_rule_id_idx on user_rules(rule_id);
create index if not exists rule_versions_rule_id_idx on rule_versions(rule_id);
create index if not exists rule_audit_log_rule_id_idx on rule_audit_log(rule_id);
create index if not exists rule_audit_log_changed_by_idx on rule_audit_log(changed_by);

-- Enable RLS
alter table trade_rules enable row level security;
alter table user_rules enable row level security;
alter table rule_versions enable row level security;
alter table rule_audit_log enable row level security;

-- Create policies for trade_rules
create policy "Users can view active trade rules."
  on trade_rules for select
  using ( exists (
    select 1 from user_rules ur 
    where ur.rule_id = trade_rules.id 
    and ur.user_id = auth.uid() 
    and ur.is_active = true
  ) or created_by = auth.uid() or created_by is null );

create policy "Admins can manage all trade rules."
  on trade_rules for all
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Users can manage their own trade rules."
  on trade_rules for all
  using ( created_by = auth.uid() );

-- Create policies for user_rules
create policy "Users can view their own rule associations."
  on user_rules for select
  using ( user_id = auth.uid() );

create policy "Users can manage their own rule associations."
  on user_rules for all
  using ( user_id = auth.uid() );

create policy "Admins can manage all user rule associations."
  on user_rules for all
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- Create policies for rule_versions
create policy "Users can view versions of rules they have access to."
  on rule_versions for select
  using ( exists (
    select 1 from trade_rules tr
    join user_rules ur on ur.rule_id = tr.id
    where tr.id = rule_versions.rule_id
    and ur.user_id = auth.uid()
    and ur.is_active = true
  ) or exists (
    select 1 from trade_rules tr
    where tr.id = rule_versions.rule_id
    and tr.created_by = auth.uid()
  ) or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can manage all rule versions."
  on rule_versions for all
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- Create policies for rule_audit_log
create policy "Users can view audit logs for their own rules."
  on rule_audit_log for select
  using ( exists (
    select 1 from trade_rules tr
    where tr.id = rule_audit_log.rule_id
    and tr.created_by = auth.uid()
  ) or exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "System can insert audit logs."
  on rule_audit_log for insert
  with check (true);

-- Create a function to get user rules
create or replace function get_user_rules(user_id uuid)
returns table(
    id uuid,
    text text,
    type text,
    required boolean,
    order_number integer,
    created_at timestamp with time zone
) as $$
begin
    return query
    select 
        tr.id,
        tr.text,
        tr.type,
        tr.required,
        tr.order_number,
        tr.created_at
    from trade_rules tr
    join user_rules ur on tr.id = ur.rule_id
    where ur.user_id = get_user_rules.user_id
    and ur.is_active = true
    order by tr.order_number asc;
end;
$$ language plpgsql;

-- Create a function to log rule changes
create or replace function log_rule_change(
    rule_id uuid,
    action text,
    old_vals jsonb,
    new_vals jsonb,
    changed_by uuid
) returns void as $$
begin
    insert into rule_audit_log (rule_id, action, old_values, new_values, changed_by)
    values (rule_id, action, old_vals, new_vals, changed_by);
end;
$$ language plpgsql;