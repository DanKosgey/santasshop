-- Migration to create enhanced notification system for trade journal activities

-- Create notifications table
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) not null, -- Changed from user_id to profile_id
  title text not null,
  message text not null,
  type text not null check (type in ('info', 'success', 'warning', 'error')),
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  related_entity_id uuid,
  related_entity_type text check (related_entity_type in ('trade', 'course', 'quiz', 'module'))
);

-- Create indexes for better query performance
create index if not exists idx_notifications_profile_id on notifications(profile_id); -- Changed from user_id to profile_id
create index if not exists idx_notifications_read on notifications(read);
create index if not exists idx_notifications_created_at on notifications(created_at);
create index if not exists idx_notifications_type on notifications(type);
create index if not exists idx_notifications_related_entity on notifications(related_entity_id, related_entity_type);

-- Set up Row Level Security (RLS)
alter table notifications enable row level security;

-- Create policies for notifications
create policy "Users can view their own notifications."
  on notifications for select
  using ( auth.uid() = profile_id ); -- Changed from user_id to profile_id

create policy "Users can insert their own notifications."
  on notifications for insert
  with check ( auth.uid() = profile_id ); -- Changed from user_id to profile_id

create policy "Users can update their own notifications."
  on notifications for update
  using ( auth.uid() = profile_id ); -- Changed from user_id to profile_id

create policy "Users can delete their own notifications."
  on notifications for delete
  using ( auth.uid() = profile_id ); -- Changed from user_id to profile_id

-- Create admin policy for inserting notifications for other users
create policy "Admins can insert notifications for any user."
  on notifications for insert
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Add comment to describe the notifications table
comment on table notifications is 'Enhanced notification system for trade journal activities and other platform events';

comment on column notifications.profile_id is 'The user this notification is for'; -- Changed from user_id to profile_id
comment on column notifications.title is 'Title of the notification';
comment on column notifications.message is 'Detailed message of the notification';
comment on column notifications.type is 'Type of notification (info, success, warning, error)';
comment on column notifications.read is 'Whether the notification has been read';
comment on column notifications.created_at is 'Timestamp when the notification was created';
comment on column notifications.related_entity_id is 'ID of the related entity (trade, course, etc.)';
comment on column notifications.related_entity_type is 'Type of the related entity';