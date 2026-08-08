
-- Create a table for public user profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  subscription_tier text default 'foundation', -- 'foundation', 'professional', 'elite', 'elite-pending'
  role text default 'student', -- 'student', 'admin'
  joined_date timestamp with time zone default timezone('utc'::text, now()),
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a table for journal entries
create table journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  pair text not null,
  type text not null, -- 'buy' or 'sell'
  entry_price numeric,
  stop_loss numeric,
  take_profit numeric,
  status text, -- 'win', 'loss', 'breakeven', 'open'
  pnl numeric,
  validation_result text, -- 'approved', 'warning', 'rejected'
  notes text,
  date timestamp with time zone default timezone('utc'::text, now()),
  emotions text[]
);

alter table journal_entries enable row level security;

create policy "Users can view own journal entries."
  on journal_entries for select
  using ( auth.uid() = user_id );

create policy "Users can insert own journal entries."
  on journal_entries for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own journal entries."
  on journal_entries for update
  using ( auth.uid() = user_id );

create policy "Users can delete own journal entries."
  on journal_entries for delete
  using ( auth.uid() = user_id );

-- Create a table for user progress (courses)
create table user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  course_id text not null,
  completed boolean default false,
  quiz_score numeric,
  last_accessed timestamp with time zone default timezone('utc'::text, now())
);

alter table user_progress enable row level security;

create policy "Users can view own progress."
  on user_progress for select
  using ( auth.uid() = user_id );

create policy "Users can insert/update own progress."
  on user_progress for all
  using ( auth.uid() = user_id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
