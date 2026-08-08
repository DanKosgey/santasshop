-- Update the handle_new_user function to properly set subscription tier based on application
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert the profile with the correct subscription tier
  -- For new signups, we'll default to 'free' tier
  -- For premium tiers, set to pending status for admin review
  insert into public.profiles (id, email, full_name, subscription_tier)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    CASE 
      WHEN new.raw_user_meta_data->>'subscription_tier' = 'free' THEN 'free'
      WHEN new.raw_user_meta_data->>'subscription_tier' = 'foundation' THEN 'foundation-pending'
      WHEN new.raw_user_meta_data->>'subscription_tier' = 'professional' THEN 'professional-pending'
      WHEN new.raw_user_meta_data->>'subscription_tier' = 'elite' THEN 'elite-pending'
      ELSE 'free'
    END
  );
  return new;
end;
$$ language plpgsql security definer;

-- Add a comment to document the function
comment on function public.handle_new_user() is 
'Handles new user creation and profile setup. Sets subscription tier based on user selection, with premium tiers requiring admin approval.';