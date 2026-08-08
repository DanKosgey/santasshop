-- Test script for subscription history and churn rate calculation

-- First, let's check the current state of the subscription_history table
select 'Current subscription history entries:' as info;
select count(*) as total_entries from subscription_history;

-- Check the current business metrics
select 'Current business metrics:' as info;
select * from get_business_metrics();

-- Create a test user for subscription change testing
-- (In a real application, we'd use existing users)
-- For this test, we'll simulate changes with existing data

-- Simulate some subscription changes to test churn calculation
-- Get a few student users to work with
select 'Sample student users:' as info;
select id, full_name, subscription_tier from profiles where role = 'student' and subscription_tier is not null limit 3;

-- Insert test subscription changes to simulate churn
-- We'll simulate 2 users canceling their subscriptions in the last 30 days
do $$
declare
    student_ids uuid[];
    student_id uuid;
begin
    -- Get some student IDs
    select array_agg(id) into student_ids 
    from profiles 
    where role = 'student' 
    and subscription_tier in ('foundation', 'professional', 'elite')
    limit 2;
    
    -- If we have students, simulate subscription changes
    if array_length(student_ids, 1) >= 2 then
        -- Simulate first user canceling (changing from paid tier to no tier)
        student_id := student_ids[1];
        insert into subscription_history (user_id, old_tier, new_tier, change_date, change_reason)
        values (student_id, 'professional', null, current_date - interval '15 days', 'test_cancellation');
        
        -- Simulate second user downgrading
        student_id := student_ids[2];
        insert into subscription_history (user_id, old_tier, new_tier, change_date, change_reason)
        values (student_id, 'elite', 'foundation', current_date - interval '10 days', 'test_downgrade');
        
        raise notice 'Inserted test subscription changes for 2 users';
    else
        raise notice 'Not enough student users with paid subscriptions for testing';
    end if;
end $$;

-- Check the subscription history after adding test data
select 'Subscription history after test data insertion:' as info;
select user_id, old_tier, new_tier, change_date, change_reason 
from subscription_history 
order by change_date desc 
limit 10;

-- Check the updated business metrics with test data
select 'Business metrics after test data insertion:' as info;
select * from get_business_metrics();

-- Test the revenue growth calculation function
select 'Revenue growth percentage:' as info;
select calculate_revenue_growth_percentage() as growth_percentage;

-- Clean up test data
delete from subscription_history where change_reason like 'test_%';
select 'Cleaned up test data' as info;

-- Final check of business metrics after cleanup
select 'Final business metrics after cleanup:' as info;
select * from get_business_metrics();