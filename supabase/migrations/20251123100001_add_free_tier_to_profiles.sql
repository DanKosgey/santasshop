-- Update the subscription_tier column to include 'free' as a valid option
alter table profiles 
alter column subscription_tier type text;

-- Add a check constraint to ensure only valid subscription tiers are used
alter table profiles 
drop constraint if exists valid_subscription_tier;

alter table profiles 
add constraint valid_subscription_tier 
check (subscription_tier in ('free', 'foundation', 'professional', 'elite', 'elite-pending', 'foundation-pending', 'professional-pending'));

-- Update the default value to 'free' for new users
alter table profiles 
alter column subscription_tier set default 'free';

-- Update existing users who might not have a subscription tier set
update profiles 
set subscription_tier = 'free' 
where subscription_tier is null or subscription_tier = '';