-- Create todos table
create table if not exists todos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table todos enable row level security;

-- Create policies
create policy "Users can view own todos."
  on todos for select
  using ( auth.uid() = user_id );

create policy "Users can insert own todos."
  on todos for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own todos."
  on todos for update
  using ( auth.uid() = user_id );

create policy "Users can delete own todos."
  on todos for delete
  using ( auth.uid() = user_id );

-- Create index for better performance
create index if not exists todos_user_id_idx on todos(user_id);
create index if not exists todos_completed_idx on todos(completed);