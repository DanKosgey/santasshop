-- Create a function to create application notifications (for admin actions)
create or replace function create_application_notification(
  p_profile_id uuid,
  p_title text,
  p_message text,
  p_type text
) returns uuid as $$
declare
  notification_id uuid;
begin
  -- Insert notification with system privileges
  insert into notifications (profile_id, title, message, type)
  values (p_profile_id, p_title, p_message, p_type)
  returning id into notification_id;
  
  -- Ensure we return the notification ID
  if notification_id is null then
    raise exception 'Failed to create notification';
  end if;
  
  return notification_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function create_application_notification(uuid, text, text, text) to authenticated;