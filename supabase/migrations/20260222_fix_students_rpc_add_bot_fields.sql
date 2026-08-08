-- Fix: Include bot_access and bot_purchase_status in get_all_students_for_admin RPC
-- Previously these columns were missing from the function's return type, causing the
-- admin panel to always show botAccess=false even after saving.

create or replace function get_all_students_for_admin()
returns table(
    id uuid,
    name text,
    email text,
    tier text,
    joined_date timestamp with time zone,
    status text,
    win_rate numeric,
    total_pnl numeric,
    trades_count bigint,
    avg_risk_reward numeric,
    current_drawdown numeric,
    bot_access boolean,
    bot_purchase_status text
) as $$
begin
    return query
    with student_stats as (
        select 
            p.id as profile_id,
            p.full_name as student_name,
            p.email as student_email,
            p.subscription_tier as student_tier,
            p.joined_date as student_joined_date,
            p.bot_access as student_bot_access,
            p.bot_purchase_status as student_bot_purchase_status,
            (get_student_stats(p.id)).win_rate as student_win_rate,
            (get_student_stats(p.id)).total_pnl as student_total_pnl,
            (get_student_stats(p.id)).trades_count as student_trades_count,
            (get_student_stats(p.id)).avg_risk_reward as student_avg_risk_reward,
            (get_student_stats(p.id)).current_drawdown as student_current_drawdown
        from profiles p
        where p.role = 'student'
    )
    select 
        profile_id as id,
        student_name as name,
        student_email as email,
        student_tier as tier,
        student_joined_date as joined_date,
        case 
            when student_win_rate < 40 then 'at-risk'
            when student_trades_count = 0 then 'inactive'
            else 'active'
        end as status,
        student_win_rate as win_rate,
        student_total_pnl as total_pnl,
        student_trades_count as trades_count,
        student_avg_risk_reward as avg_risk_reward,
        student_current_drawdown as current_drawdown,
        coalesce(student_bot_access, false) as bot_access,
        coalesce(student_bot_purchase_status, 'none') as bot_purchase_status
    from student_stats;
end;
$$ language plpgsql;
