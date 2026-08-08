-- Create a function to get penalty trends over time for analytics
create or replace function get_penalty_trends()
returns table(
    date_period date,
    rejected_count bigint,
    warning_count bigint,
    total_penalties bigint
) as $$
begin
    return query
    select 
        date_trunc('day', je.date)::date as date_period,
        count(case when je.validation_result = 'rejected' then 1 end) as rejected_count,
        count(case when je.validation_result = 'warning' then 1 end) as warning_count,
        count(*) as total_penalties
    from journal_entries je
    join profiles p on je.user_id = p.id
    where p.role = 'student'
    and je.validation_result in ('rejected', 'warning')
    and je.date >= (current_date - interval '90 days')  -- Extended to 90 days to ensure we get data
    group by date_trunc('day', je.date)::date
    order by date_trunc('day', je.date)::date;
end;
$$ language plpgsql;