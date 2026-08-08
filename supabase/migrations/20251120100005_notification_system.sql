-- Create notifications table
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text check (type in ('info', 'warning', 'success', 'error')) default 'info',
  read boolean default false,
  course_id uuid references courses(id) on delete cascade,
  module_id uuid references course_modules(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create notification_preferences table
create table if not exists notification_preferences (
  profile_id uuid references profiles(id) on delete cascade primary key,
  email_notifications boolean default true,
  push_notifications boolean default true,
  course_updates boolean default true,
  module_updates boolean default true,
  quiz_reminders boolean default true,
  progress_reminders boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for better performance
create index if not exists notifications_profile_id_idx on notifications(profile_id);
create index if not exists notifications_read_idx on notifications(read);
create index if not exists notifications_course_id_idx on notifications(course_id);
create index if not exists notifications_created_at_idx on notifications(created_at);

-- Enable RLS
alter table notifications enable row level security;
alter table notification_preferences enable row level security;

-- Create policies for notifications
create policy "Users can view own notifications."
  on notifications for select
  using (auth.uid() = profile_id);

create policy "Users can update own notifications."
  on notifications for update
  using (auth.uid() = profile_id);

create policy "Users can delete own notifications."
  on notifications for delete
  using (auth.uid() = profile_id);

create policy "System can insert notifications."
  on notifications for insert
  with check (true);

-- Create policies for notification_preferences
create policy "Users can view own notification preferences."
  on notification_preferences for select
  using (auth.uid() = profile_id);

create policy "Users can update own notification preferences."
  on notification_preferences for update
  using (auth.uid() = profile_id);

create policy "Users can insert own notification preferences."
  on notification_preferences for insert
  with check (auth.uid() = profile_id);

-- Create a function to create course update notifications
create or replace function create_course_update_notification(
  course_id uuid,
  updater_name text,
  update_type text
) returns void as $$
declare
  course_title text;
  enrolled_profiles uuid[];
  notification_title text;
  notification_message text;
begin
  -- Get course title
  select title into course_title from courses where id = course_id;
  
  -- Get all enrolled profiles
  select array_agg(profile_id) into enrolled_profiles
  from course_enrollments 
  where course_id = course_id and status = 'active';
  
  -- Set notification content based on update type
  if update_type = 'new_version' then
    notification_title := 'New Version Available';
    notification_message := updater_name || ' has published a new version of "' || course_title || '"';
  elsif update_type = 'content_update' then
    notification_title := 'Course Updated';
    notification_message := updater_name || ' has updated content in "' || course_title || '"';
  elsif update_type = 'new_module' then
    notification_title := 'New Module Added';
    notification_message := updater_name || ' has added a new module to "' || course_title || '"';
  else
    notification_title := 'Course Update';
    notification_message := updater_name || ' has made updates to "' || course_title || '"';
  end if;
  
  -- Create notifications for all enrolled users
  if enrolled_profiles is not null then
    for i in array_lower(enrolled_profiles, 1)..array_upper(enrolled_profiles, 1) loop
      insert into notifications (profile_id, title, message, type, course_id)
      values (enrolled_profiles[i], notification_title, notification_message, 'info', course_id);
    end loop;
  end if;
end;
$$ language plpgsql;

-- Create a function to create module update notifications
create or replace function create_module_update_notification(
  module_id uuid,
  updater_name text
) returns void as $$
declare
  module_title text;
  course_id_var uuid;
  course_title text;
  enrolled_profiles uuid[];
begin
  -- Get module and course info
  select title, course_id into module_title, course_id_var 
  from course_modules where id = module_id;
  
  select title into course_title from courses where id = course_id_var;
  
  -- Get all enrolled profiles for this course
  select array_agg(profile_id) into enrolled_profiles
  from course_enrollments 
  where course_id = course_id_var and status = 'active';
  
  -- Create notifications for all enrolled users
  if enrolled_profiles is not null then
    for i in array_lower(enrolled_profiles, 1)..array_upper(enrolled_profiles, 1) loop
      insert into notifications (profile_id, title, message, type, course_id, module_id)
      values (
        enrolled_profiles[i], 
        'Module Updated', 
        updater_name || ' has updated "' || module_title || '" in "' || course_title || '"',
        'info', 
        course_id_var, 
        module_id
      );
    end loop;
  end if;
end;
$$ language plpgsql;

-- Create a function to get unread notifications count for a user
create or replace function get_unread_notifications_count(user_id uuid)
returns integer as $$
declare
  count_var integer;
begin
  select count(*) into count_var
  from notifications
  where profile_id = user_id and read = false;
  
  return count_var;
end;
$$ language plpgsql;

-- Insert default notification preferences for existing users
insert into notification_preferences (profile_id)
select id from profiles
on conflict (profile_id) do nothing;