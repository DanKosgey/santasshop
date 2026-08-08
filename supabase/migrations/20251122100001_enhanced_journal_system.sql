-- Migration to enhance the journal_entries table with additional fields for better analytics and admin oversight

-- Add new columns to journal_entries table
alter table journal_entries 
add column if not exists strategy text,
add column if not exists time_frame text,
add column if not exists market_condition text,
add column if not exists confidence_level integer check (confidence_level >= 1 and confidence_level <= 10),
add column if not exists risk_amount numeric,
add column if not exists position_size numeric,
add column if not exists trade_duration interval,
add column if not exists tags text[],
add column if not exists admin_notes text,
add column if not exists admin_review_status text default 'pending' check (admin_review_status in ('pending', 'reviewed', 'flagged')),
add column if not exists review_timestamp timestamp with time zone,
add column if not exists mentor_id uuid references profiles(id),
add column if not exists session_id uuid,
add column if not exists trade_source text check (trade_source in ('demo', 'live', 'paper')),
add column if not exists screenshot_url text;

-- Create indexes for better query performance
create index if not exists idx_journal_entries_user_id_date on journal_entries(user_id, date desc); -- Changed back to user_id for journal entries
create index if not exists idx_journal_entries_status on journal_entries(status);
create index if not exists idx_journal_entries_pair on journal_entries(pair);
create index if not exists idx_journal_entries_strategy on journal_entries(strategy);
create index if not exists idx_journal_entries_admin_review on journal_entries(admin_review_status);
create index if not exists idx_journal_entries_tags on journal_entries using gin(tags);
create index if not exists idx_journal_entries_pnl on journal_entries(pnl);

-- Create a function to get detailed trade statistics for a student
create or replace function get_student_detailed_stats(user_id uuid) -- Keep as user_id for journal entries
returns table(
    total_trades bigint,
    win_rate numeric,
    total_pnl numeric,
    avg_win numeric,
    avg_loss numeric,
    profit_factor numeric,
    max_drawdown numeric,
    avg_risk_reward numeric,
    avg_confidence numeric,
    most_traded_pair text,
    most_used_strategy text,
    avg_trade_duration interval
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
            end as profit_factor,
            coalesce(avg(je.confidence_level), 0) as avg_confidence,
            mode() within group (order by je.pair) as most_traded_pair,
            mode() within group (order by je.strategy) as most_used_strategy,
            avg(je.trade_duration) as avg_trade_duration
        from journal_entries je
        where je.user_id = get_student_detailed_stats.user_id -- Keep as user_id for journal entries
    ),
    drawdown_calc as (
        select 
            je.date,
            je.pnl,
            sum(je.pnl) over (order by je.date rows between unbounded preceding and current row) as equity
        from journal_entries je
        where je.user_id = get_student_detailed_stats.user_id -- Keep as user_id for journal entries
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
        2.0::numeric as avg_risk_reward, -- Placeholder, would need more complex calculation
        ts.avg_confidence::numeric,
        ts.most_traded_pair,
        ts.most_used_strategy,
        ts.avg_trade_duration
    from trade_stats ts
    cross join (select 0 as dummy) dummy
    left join drawdowns d on true
    group by ts.total_trades, ts.win_rate, ts.total_pnl, ts.avg_win, ts.avg_loss, ts.profit_factor, ts.avg_confidence, ts.most_traded_pair, ts.most_used_strategy, ts.avg_trade_duration;
end;
$$ language plpgsql security definer;

-- Create a function to get all trades for admin portal with enhanced information
create or replace function get_all_trades_for_admin_enhanced()
returns table(
    id uuid,
    user_id uuid, -- Keep as user_id for journal entries
    student_name text,
    student_tier text,
    pair text,
    type text,
    entry_price numeric,
    stop_loss numeric,
    take_profit numeric,
    status text,
    pnl numeric,
    validation_result text,
    notes text,
    date timestamp with time zone,
    strategy text,
    confidence_level integer,
    admin_review_status text,
    review_timestamp timestamp with time zone,
    tags text[]
) as $$
begin
    return query
    select 
        je.id as id,
        je.user_id as user_id, -- Keep as user_id for journal entries
        p.full_name as student_name,
        p.subscription_tier as student_tier,
        je.pair as pair,
        je.type as type,
        je.entry_price as entry_price,
        je.stop_loss as stop_loss,
        je.take_profit as take_profit,
        je.status as status,
        je.pnl as pnl,
        je.validation_result as validation_result,
        je.notes as notes,
        je.date as date,
        je.strategy as strategy,
        je.confidence_level as confidence_level,
        je.admin_review_status as admin_review_status,
        je.review_timestamp as review_timestamp,
        je.tags as tags
    from journal_entries je
    join profiles p on je.user_id = p.id -- Keep as user_id for journal entries
    where p.role = 'student'
    order by je.date desc;
end;
$$ language plpgsql security definer;

-- Create a function to get flagged trades for admin review
create or replace function get_flagged_trades_for_review()
returns table(
    id uuid,
    user_id uuid, -- Keep as user_id for journal entries
    student_name text,
    student_tier text,
    pair text,
    type text,
    entry_price numeric,
    stop_loss numeric,
    take_profit numeric,
    status text,
    pnl numeric,
    notes text,
    date timestamp with time zone,
    strategy text,
    confidence_level integer,
    admin_notes text,
    tags text[]
) as $$
begin
    return query
    select 
        je.id as id,
        je.user_id as user_id, -- Keep as user_id for journal entries
        p.full_name as student_name,
        p.subscription_tier as student_tier,
        je.pair as pair,
        je.type as type,
        je.entry_price as entry_price,
        je.stop_loss as stop_loss,
        je.take_profit as take_profit,
        je.status as status,
        je.pnl as pnl,
        je.notes as notes,
        je.date as date,
        je.strategy as strategy,
        je.confidence_level as confidence_level,
        je.admin_notes as admin_notes,
        je.tags as tags
    from journal_entries je
    join profiles p on je.user_id = p.id -- Keep as user_id for journal entries
    where je.admin_review_status = 'flagged'
    order by je.date desc;
end;
$$ language plpgsql security definer;

-- Create a function to get mentor assigned trades
create or replace function get_mentor_assigned_trades(mentor_uuid uuid)
returns table(
    id uuid,
    user_id uuid, -- Keep as user_id for journal entries
    student_name text,
    student_tier text,
    pair text,
    type text,
    entry_price numeric,
    stop_loss numeric,
    take_profit numeric,
    status text,
    pnl numeric,
    notes text,
    date timestamp with time zone,
    strategy text,
    confidence_level integer,
    admin_review_status text,
    tags text[]
) as $$
begin
    return query
    select 
        je.id as id,
        je.user_id as user_id, -- Keep as user_id for journal entries
        p.full_name as student_name,
        p.subscription_tier as student_tier,
        je.pair as pair,
        je.type as type,
        je.entry_price as entry_price,
        je.stop_loss as stop_loss,
        je.take_profit as take_profit,
        je.status as status,
        je.pnl as pnl,
        je.notes as notes,
        je.date as date,
        je.strategy as strategy,
        je.confidence_level as confidence_level,
        je.admin_review_status as admin_review_status,
        je.tags as tags
    from journal_entries je
    join profiles p on je.user_id = p.id -- Keep as user_id for journal entries
    where je.mentor_id = mentor_uuid
    order by je.date desc;
end;
$$ language plpgsql security definer;

-- Update RLS policies to accommodate new columns
drop policy if exists "Users can view own journal entries." on journal_entries;
create policy "Users can view own journal entries."
  on journal_entries for select
  using ( auth.uid() = user_id ); -- Keep as user_id for journal entries

drop policy if exists "Users can insert own journal entries." on journal_entries;
create policy "Users can insert own journal entries."
  on journal_entries for insert
  with check ( auth.uid() = user_id ); -- Keep as user_id for journal entries

drop policy if exists "Users can update own journal entries." on journal_entries;
create policy "Users can update own journal entries."
  on journal_entries for update
  using ( auth.uid() = user_id ); -- Keep as user_id for journal entries

drop policy if exists "Users can delete own journal entries." on journal_entries;
create policy "Users can delete own journal entries."
  on journal_entries for delete
  using ( auth.uid() = user_id ); -- Keep as user_id for journal entries

-- Create admin policy for viewing all journal entries
create policy "Admins can view all journal entries."
  on journal_entries for select
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Create admin policy for updating journal entries (for admin notes and review status)
create policy "Admins can update journal entries for review."
  on journal_entries for update
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Add comment to describe the enhanced schema
comment on table journal_entries is 'Enhanced trade journal entries with additional fields for analytics and admin oversight';

comment on column journal_entries.strategy is 'Trading strategy used for this trade';
comment on column journal_entries.time_frame is 'Time frame of the trade (e.g., 1H, 4H, Daily)';
comment on column journal_entries.market_condition is 'Market condition during the trade (e.g., trending, ranging)';
comment on column journal_entries.confidence_level is 'Trader confidence level from 1-10';
comment on column journal_entries.risk_amount is 'Amount risked in this trade';
comment on column journal_entries.position_size is 'Position size for this trade';
comment on column journal_entries.trade_duration is 'Duration of the trade';
comment on column journal_entries.tags is 'Tags for categorizing trades';
comment on column journal_entries.admin_notes is 'Notes added by admin/mentor for this trade';
comment on column journal_entries.admin_review_status is 'Review status by admin (pending, reviewed, flagged)';
comment on column journal_entries.review_timestamp is 'Timestamp when admin reviewed this trade';
comment on column journal_entries.mentor_id is 'ID of assigned mentor for this trade';
comment on column journal_entries.session_id is 'ID of trading session this trade belongs to';
comment on column journal_entries.trade_source is 'Source of the trade (demo, live, paper)';