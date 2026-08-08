-- Migration to create subscription history table for tracking user subscription changes

-- Create subscription_history table
create table if not exists subscription_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  old_tier text,
  new_tier text,
  change_date timestamp with time zone default timezone('utc'::text, now()),
  change_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for better query performance
create index if not exists idx_subscription_history_user_id on subscription_history(user_id);
create index if not exists idx_subscription_history_change_date on subscription_history(change_date);
create index if not exists idx_subscription_history_tiers on subscription_history(old_tier, new_tier);

-- Set up Row Level Security (RLS)
alter table subscription_history enable row level security;

-- Create policies for subscription_history
create policy "Admins can view all subscription history."
  on subscription_history for select
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Users can view their own subscription history."
  on subscription_history for select
  using ( auth.uid() = user_id );

-- Add comment to describe the subscription_history table
comment on table subscription_history is 'Tracks user subscription tier changes for analytics and churn calculation';

comment on column subscription_history.user_id is 'The user whose subscription changed';
comment on column subscription_history.old_tier is 'The previous subscription tier';
comment on column subscription_history.new_tier is 'The new subscription tier';
comment on column subscription_history.change_date is 'When the subscription change occurred';
comment on column subscription_history.change_reason is 'Reason for the subscription change (e.g., upgrade, downgrade, cancellation)';

-- Create a function to log subscription changes
create or replace function log_subscription_change()
returns trigger as $$
begin
  -- Only log if the tier actually changed
  if old.subscription_tier != new.subscription_tier then
    insert into subscription_history (user_id, old_tier, new_tier, change_reason)
    values (new.id, old.subscription_tier, new.subscription_tier, 'tier_change');
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to automatically log subscription changes
create or replace trigger on_profile_subscription_change
  after update of subscription_tier on profiles
  for each row
  execute function log_subscription_change();

-- Create a function to populate initial subscription history for existing users
-- This will create an entry for each user with their current tier as both old and new
-- to establish a baseline for future churn calculations
create or replace function populate_initial_subscription_history()
returns void as $$
begin
  insert into subscription_history (user_id, old_tier, new_tier, change_date, change_reason)
  select id, subscription_tier, subscription_tier, joined_date, 'initial_state'
  from profiles
  where role = 'student'
  and subscription_tier is not null
  on conflict do nothing;
end;
$$ language plpgsql security definer;

-- Execute the function to populate initial data
select populate_initial_subscription_history();

-- Drop the function after use as it's no longer needed
drop function populate_initial_subscription_history();