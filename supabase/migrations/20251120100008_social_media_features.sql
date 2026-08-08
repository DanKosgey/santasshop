-- Create tables for premium social media features with chart analysis discussions and signals

-- Table for social media posts
create table social_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  content text not null,
  post_type text default 'discussion', -- 'discussion', 'chart_analysis', 'signal', 'question'
  chart_image_url text, -- URL to chart image for analysis posts
  pair text, -- Trading pair for signals
  signal_type text, -- 'buy', 'sell', 'hold'
  confidence_level integer, -- 1-10 confidence rating
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for comments on social posts
create table social_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references social_posts(id) not null,
  user_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for likes on social posts
create table social_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references social_posts(id) not null,
  user_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id) -- Prevent duplicate likes
);

-- Table for subscription plans
create table subscription_plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  interval text default 'one-time', -- 'one-time', 'monthly', 'yearly'
  features jsonb, -- JSON array of features included in the plan
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for plan features
create table plan_features (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references subscription_plans(id) not null,
  feature_name text not null,
  feature_description text,
  is_included boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table social_posts enable row level security;
alter table social_comments enable row level security;
alter table social_likes enable row level security;
alter table subscription_plans enable row level security;
alter table plan_features enable row level security;

-- Create policies for social posts
create policy "Users can view all social posts"
  on social_posts for select
  using ( true );

create policy "Users can insert their own social posts"
  on social_posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own social posts"
  on social_posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own social posts"
  on social_posts for delete
  using ( auth.uid() = user_id );

-- Create policies for social comments
create policy "Users can view all comments"
  on social_comments for select
  using ( true );

create policy "Users can insert their own comments"
  on social_comments for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own comments"
  on social_comments for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own comments"
  on social_comments for delete
  using ( auth.uid() = user_id );

-- Create policies for social likes
create policy "Users can view all likes"
  on social_likes for select
  using ( true );

create policy "Users can insert their own likes"
  on social_likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own likes"
  on social_likes for delete
  using ( auth.uid() = user_id );

-- Create policies for subscription plans
create policy "Users can view active subscription plans"
  on subscription_plans for select
  using ( is_active = true );

create policy "Admins can manage subscription plans"
  on subscription_plans for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Create policies for plan features
create policy "Users can view plan features for active plans"
  on plan_features for select
  using ( exists (select 1 from subscription_plans where id = plan_features.plan_id and is_active = true) );

create policy "Admins can manage plan features"
  on plan_features for all
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Create indexes for better performance
create index idx_social_posts_user_id on social_posts(user_id);
create index idx_social_posts_type on social_posts(post_type);
create index idx_social_posts_created_at on social_posts(created_at);
create index idx_social_comments_post_id on social_comments(post_id);
create index idx_social_comments_user_id on social_comments(user_id);
create index idx_social_likes_post_id on social_likes(post_id);
create index idx_social_likes_user_id on social_likes(user_id);
create index idx_subscription_plans_active on subscription_plans(is_active);
create index idx_subscription_plans_sort_order on subscription_plans(sort_order);
create index idx_plan_features_plan_id on plan_features(plan_id);

-- Insert default subscription plans
insert into subscription_plans (id, name, description, price, interval, features, sort_order) values
('00000000-0000-0000-0000-000000000001', 'Free Plan', 'Basic access to the platform', 0, 'one-time', 
  '["Live Signals from Premium Groups", "Basic Market Updates", "Community Access"]', 0),
('00000000-0000-0000-0000-000000000002', 'Foundation', 'Core course modules and community access', 45, 'one-time', 
  '["Modules 1-4 (Core CRT)", "Private Community", "Monthly Group Q&A"]', 1),
('00000000-0000-0000-0000-000000000003', 'Professional', 'Full course access with AI Trade Guard', 60, 'one-time', 
  '["Everything in Foundation", "AI Trade Guard Access", "Full Course (Modules 1-6)", "Advanced Journal & Analytics", "Weekly Live Trading Room"]', 2),
('00000000-0000-0000-0000-000000000004', 'Elite Mentorship', 'Premium mentorship with personalized support', 100, 'one-time', 
  '["Everything in Pro", "2x Monthly 1-on-1 Calls", "Private Signal Group", "Lifetime Updates"]', 3);

-- Insert default plan features
insert into plan_features (plan_id, feature_name, feature_description, is_included, sort_order) values
-- Free Plan features
('00000000-0000-0000-0000-000000000001', 'Live Signals from Premium Groups', 'Access to live trading signals from our premium groups', true, 1),
('00000000-0000-0000-0000-000000000001', 'Basic Market Updates', 'Receive basic market updates and analysis', true, 2),
('00000000-0000-0000-0000-000000000001', 'Community Access', 'Join our community discussions and networking', true, 3),
-- Foundation features
('00000000-0000-0000-0000-000000000002', 'Modules 1-4 (Core CRT)', 'Access to core course modules on CRT logic', true, 1),
('00000000-0000-0000-0000-000000000002', 'Private Community', 'Exclusive access to our private student community', true, 2),
('00000000-0000-0000-0000-000000000002', 'Monthly Group Q&A', 'Participate in monthly group Q&A sessions', true, 3),
-- Professional features
('00000000-0000-0000-0000-000000000003', 'AI Trade Guard Access', 'Full access to our AI-powered trade validation system', true, 1),
('00000000-0000-0000-0000-000000000003', 'Full Course (Modules 1-6)', 'Complete access to all course modules', true, 2),
('00000000-0000-0000-0000-000000000003', 'Advanced Journal & Analytics', 'Advanced trading journal with detailed analytics', true, 3),
('00000000-0000-0000-0000-000000000003', 'Weekly Live Trading Room', 'Join weekly live trading sessions with instructors', true, 4),
-- Elite features
('00000000-0000-0000-0000-000000000004', '2x Monthly 1-on-1 Calls', 'Two one-on-one mentoring calls per month', true, 1),
('00000000-0000-0000-0000-000000000004', 'Private Signal Group', 'Access to our exclusive private signal group', true, 2),
('00000000-0000-0000-0000-000000000004', 'Lifetime Updates', 'Lifetime access to all course updates and new content', true, 3);