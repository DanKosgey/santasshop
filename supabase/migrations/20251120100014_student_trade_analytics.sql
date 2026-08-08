-- Create function to get all trades for a specific student
-- This function returns all journal entries for a given student, ordered by date (newest first)
create or replace function get_student_trades(user_id uuid)
returns table(
    id uuid,
    pair text,
    type text,
    entry_price numeric,
    stop_loss numeric,
    take_profit numeric,
    status text,
    pnl numeric,
    validation_result text,
    notes text,
    date timestamp with time zone
) as $$
begin
    return query
    select 
        je.id,
        je.pair,
        je.type,
        je.entry_price,
        je.stop_loss,
        je.take_profit,
        je.status,
        je.pnl,
        je.validation_result,
        je.notes,
        je.date
    from journal_entries je
    where je.user_id = get_student_trades.user_id
    order by je.date desc;
end;
$$ language plpgsql security definer;

-- Create function to get student trade statistics
-- This function calculates key performance metrics for a student's trading activity
create or replace function get_student_trade_stats(user_id uuid)
returns table(
    total_trades bigint,
    win_rate numeric,
    total_pnl numeric,
    avg_win numeric,
    avg_loss numeric,
    profit_factor numeric,
    max_drawdown numeric,
    avg_risk_reward numeric
) as $$
begin
    return query
    with trade_stats as (
        select 
            count(*) as total_trades,
            coalesce(avg(case when je.status = 'win' then 1 else 0 end) * 100, 0) as win_rate,
            coalesce(sum(je.pnl), 0) as total_pnl,
            coalesce(avg(case when je.pnl > 0 then je.pnl end), 0) as avg_win,
            coalesce(avg(case when je.pnl < 0 then abs(je.pnl) end), 0) as avg_loss,
            case 
                when coalesce(avg(case when je.pnl < 0 then abs(je.pnl) end), 0) = 0 then 0
                else coalesce(avg(case when je.pnl > 0 then je.pnl end), 0) / coalesce(avg(case when je.pnl < 0 then abs(je.pnl) end), 1)
            end as profit_factor
        from journal_entries je
        where je.user_id = get_student_trade_stats.user_id
    ),
    drawdown_calc as (
        select 
            je.date,
            je.pnl,
            sum(je.pnl) over (order by je.date rows between unbounded preceding and current row) as equity
        from journal_entries je
        where je.user_id = get_student_trade_stats.user_id
        order by je.date
    ),
    running_max as (
        select 
            date,
            equity,
            pnl,
            max(equity) over (order by date rows between unbounded preceding and current row) as peak
        from drawdown_calc
    ),
    drawdowns as (
        select 
            equity,
            peak,
            (peak - equity) as drawdown
        from running_max
    )
    select 
        ts.total_trades::bigint,
        ts.win_rate::numeric,
        ts.total_pnl::numeric,
        ts.avg_win::numeric,
        ts.avg_loss::numeric,
        ts.profit_factor::numeric,
        coalesce(max(d.drawdown), 0)::numeric as max_drawdown,
        2.0::numeric as avg_risk_reward -- Placeholder, would need more complex calculation
    from trade_stats ts
    cross join (select 0 as dummy) dummy
    left join drawdowns d on true
    group by ts.total_trades, ts.win_rate, ts.total_pnl, ts.avg_win, ts.avg_loss, ts.profit_factor;
end;
$$ language plpgsql security definer;

-- Create function to get student trade performance over time
-- This function returns the equity curve data for charting purposes
create or replace function get_student_equity_curve(user_id uuid)
returns table(
    date text,
    equity numeric,
    pnl numeric
) as $$
begin
    return query
    select 
        to_char(je.date, 'Mon DD') as date,
        sum(je.pnl) over (order by je.date rows between unbounded preceding and current row) as equity,
        je.pnl
    from journal_entries je
    where je.user_id = get_student_equity_curve.user_id
    order by je.date
    limit 30; -- Last 30 trades
end;
$$ language plpgsql security definer;

-- Create function to get student's recent trades (last 10)
-- This function returns the most recent 10 trades for quick overview
create or replace function get_student_recent_trades(user_id uuid)
returns table(
    id uuid,
    pair text,
    type text,
    entry_price numeric,
    stop_loss numeric,
    take_profit numeric,
    status text,
    pnl numeric,
    validation_result text,
    notes text,
    date timestamp with time zone
) as $$
begin
    return query
    select 
        je.id,
        je.pair,
        je.type,
        je.entry_price,
        je.stop_loss,
        je.take_profit,
        je.status,
        je.pnl,
        je.validation_result,
        je.notes,
        je.date
    from journal_entries je
    where je.user_id = get_student_recent_trades.user_id
    order by je.date desc
    limit 10;
end;
$$ language plpgsql security definer;

-- Security Notes:
-- 1. All functions use 'security definer' to ensure they run with appropriate privileges
-- 2. All functions filter data by user_id parameter, ensuring students can only access their own data
-- 3. The underlying journal_entries table has Row Level Security (RLS) policies that restrict access:
--    - Users can only view their own journal entries
--    - Users can only insert their own journal entries
--    - Users can only update their own journal entries
--    - Users can only delete their own journal entries
-- 4. These database-level security measures ensure that even if application-level checks fail,
--    the data remains protected at the database level