-- Create validation_results table (preserving this non-conflicting table)
create table if not exists validation_results (
  id uuid default uuid_generate_v4() primary key,
  journal_entry_id uuid references journal_entries(id) on delete cascade,
  rule_name text not null,
  status text check (status in ('approved', 'warning', 'rejected')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for validation_results
alter table validation_results enable row level security;

-- Create policies for validation_results
create policy "Validation results are viewable by admins."
  on validation_results for select
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "System can insert validation results."
  on validation_results for insert
  with check ( true );

-- Sample data insertion commented out to prevent data seeding
-- insert into validation_results (journal_entry_id, rule_name, status, notes)
-- select je.id, 
--        case (random() * 5)::int
--          when 0 then 'Trading Against Trend'
--          when 1 then 'No FVG Identified'
--          when 2 then 'Risk > 2% Account'
--          when 3 then 'Early Entry (No Close)'
--          when 4 then 'Trading News Event'
--          else 'Invalid Setup'
--        end as rule_name,
--        case (random() * 2)::int
--          when 0 then 'approved'
--          when 1 then 'warning'
--          else 'rejected'
--        end as status,
--        'Sample validation note'
-- from journal_entries je
-- limit 50
-- on conflict do nothing;