-- Configure Supabase Auth for OTP-based email verification and passwordless login
-- This migration ensures that the authentication system is properly set up for OTP flows

-- Enable email OTP in auth settings
-- Note: This configuration is typically done in the Supabase Dashboard,
-- but we're documenting it here for reference and completeness.

-- Update the email template to use OTP codes instead of links
-- This would be configured in the Supabase Dashboard under Authentication > Email Templates

-- For signup confirmation email template, use:
-- <h2>Confirm your email</h2>
-- <p>Enter this code to confirm your account:</p>
-- <h1>{{ .Token }}</h1>
-- <p>This code expires in 24 hours.</p>

-- For passwordless login email template, use:
-- <h2>Login to {VITE_APP_NAME}</h2>
-- <p>Enter this code to login to your account:</p>
-- <h1>{{ .Token }}</h1>
-- <p>This code expires in 24 hours.</p>

-- Ensure the handle_new_user function properly handles new users with OTP verification
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, subscription_tier)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 
          coalesce(new.raw_user_meta_data->>'subscription_tier', 'free'));
  return new;
end;
$$ language plpgsql security definer;

-- Update the trigger to ensure it's properly set
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add a comment to document the OTP configuration
comment on function public.handle_new_user() is 
'Handles new user creation and profile setup. Works with OTP-based email verification.';