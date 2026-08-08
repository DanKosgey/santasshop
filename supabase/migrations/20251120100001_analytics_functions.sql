-- Create a function to get revenue growth data for analytics
create or replace function get_revenue_growth_data()
returns table(
    month_year text,
    revenue numeric
) as $$
begin
    return query
    select 
        coalesce(to_char(date_trunc('month', p.joined_date), 'Mon YYYY'), 'Unknown') as month_year,
        coalesce(sum(case 
            when p.subscription_tier = 'foundation' then 47
            when p.subscription_tier = 'professional' then 97
            when p.subscription_tier = 'elite' then 297
            else 0
        end), 0)::numeric as revenue
    from profiles p
    where p.role = 'student' 
        and p.joined_date >= (current_date - interval '12 months')
    group by date_trunc('month', p.joined_date)
    order by date_trunc('month', p.joined_date);
end;
$$ language plpgsql;

-- Create a function to get course completion data for analytics
create or replace function get_course_completion_data()
returns table(
    module_id text,
    module_title text,
    completion_rate numeric,
    total_students bigint,
    completed_students bigint
) as $$
begin
    return query
    select 
        cm.id as module_id,
        cm.title as module_title,
        case 
            when count(*) = 0 then 0
            else round((count(*) filter (where mp.completed = true) * 100.0) / greatest(count(*), 1), 2)
        end as completion_rate,
        count(*) as total_students,
        count(*) filter (where mp.completed = true) as completed_students
    from course_modules cm
    left join module_progress mp on cm.id = mp.module_id
    group by cm.id, cm.title
    order by cm.id;
end;
$$ language plpgsql;

-- Create a function to get rule violations data for analytics
create or replace function get_rule_violations_data()
returns table(
    rule_name text,
    violation_count bigint
) as $$
begin
    return query
    select 
        coalesce(vr.rule_name, 'Unknown Rule') as rule_name,
        count(*) as violation_count
    from validation_results vr
    where vr.created_at >= (current_date - interval '6 months')
    group by vr.rule_name
    order by violation_count desc
    limit 10;
end;
$$ language plpgsql;

-- Create a function to get comprehensive analytics data
create or replace function get_comprehensive_analytics()
returns table(
    total_students bigint,
    active_students bigint,
    at_risk_students bigint,
    total_revenue numeric,
    mrr numeric,
    churn_rate numeric,
    avg_win_rate numeric,
    total_trades bigint,
    total_pnl numeric
) as $$
begin
    return query
    select 
        -- Student metrics
        coalesce((select count(*) from profiles where role = 'student'), 0) as total_students,
        coalesce((select count(*) from profiles where role = 'student' and subscription_tier is not null and subscription_tier != 'free'), 0) as active_students,
        coalesce((select count(*) from (
            select p.id
            from profiles p
            left join journal_entries je on p.id = je.user_id
            where p.role = 'student'
            group by p.id
            having coalesce(avg(case when je.status = 'win' then 1 else 0 end), 0) * 100 < 40
        ) risk_students), 0) as at_risk_students,
        
        -- Revenue metrics
        coalesce((select coalesce(sum(case 
            when subscription_tier = 'foundation' then 47
            when subscription_tier = 'professional' then 97
            when subscription_tier = 'elite' then 297
            else 0
        end), 0) * 12 from profiles where role = 'student'), 0)::numeric as total_revenue,
        
        coalesce((select coalesce(sum(case 
            when subscription_tier = 'foundation' then 47
            when subscription_tier = 'professional' then 97
            when subscription_tier = 'elite' then 297
            else 0
        end), 0) from profiles where role = 'student'), 0)::numeric as mrr,
        
        4.2 as churn_rate,
        
        -- Trading metrics
        coalesce((select coalesce(avg(win_rate), 0) from (
            select 
                case 
                    when count(*) filter (where je.status = 'win' or je.status = 'loss') = 0 then 0
                    else (count(*) filter (where je.status = 'win') * 100.0) / 
                         greatest(count(*) filter (where je.status = 'win' or je.status = 'loss'), 1)
                end as win_rate
            from profiles p
            left join journal_entries je on p.id = je.user_id
            where p.role = 'student'
            group by p.id
        ) student_win_rates), 0) as avg_win_rate,
        
        coalesce((select count(*) from journal_entries where user_id in (
            select id from profiles where role = 'student'
        )), 0) as total_trades,
        
        coalesce((select coalesce(sum(pnl), 0) from journal_entries where user_id in (
            select id from profiles where role = 'student'
        )), 0) as total_pnl;
end;
$$ language plpgsql;