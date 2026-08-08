-- Create courses table
create table if not exists courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  duration text, -- Total duration of all modules
  thumbnail text, -- URL to course thumbnail
  instructor text, -- Instructor name
  category text, -- e.g., 'Trading', 'Psychology', 'Risk Management'
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create course_modules table (enhanced version)
create table if not exists course_modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  description text,
  duration text,
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  content text,
  content_type text check (content_type in ('video', 'text')),
  order_number integer, -- For sequencing modules within a course
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create module_prerequisites table (for prerequisite relationships)
create table if not exists module_prerequisites (
  module_id uuid references course_modules(id) on delete cascade,
  prerequisite_id uuid references course_modules(id) on delete cascade,
  primary key (module_id, prerequisite_id)
);

-- Create course_enrollments table
create table if not exists course_enrollments (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()),
  status text check (status in ('active', 'completed', 'dropped')) default 'active',
  progress integer default 0, -- Percentage
  completed_at timestamp with time zone,
  unique(profile_id, course_id)
);

-- Create module_progress table
create table if not exists module_progress (
  profile_id uuid references profiles(id) on delete cascade,
  module_id uuid references course_modules(id) on delete cascade,
  completed boolean default false,
  quiz_score numeric,
  completed_at timestamp with time zone,
  time_spent integer, -- In minutes
  primary key (profile_id, module_id)
);

-- Create course_categories table
create table if not exists course_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  color text -- For UI display
);

-- Add category column to courses table
alter table courses add column if not exists category_id uuid references course_categories(id);

-- Enable RLS
alter table courses enable row level security;
alter table course_modules enable row level security;
alter table module_prerequisites enable row level security;
alter table course_enrollments enable row level security;
alter table module_progress enable row level security;
alter table course_categories enable row level security;

-- Create policies for courses
create policy "Courses are viewable by everyone."
  on courses for select
  using ( true );

create policy "Admins can insert courses."
  on courses for insert
  with check ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can update courses."
  on courses for update
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can delete courses."
  on courses for delete
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- Create policies for course_modules
create policy "Course modules are viewable by everyone."
  on course_modules for select
  using ( true );

create policy "Admins can insert course modules."
  on course_modules for insert
  with check ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can update course modules."
  on course_modules for update
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can delete course modules."
  on course_modules for delete
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- Create policies for module_prerequisites
create policy "Module prerequisites are viewable by everyone."
  on module_prerequisites for select
  using ( true );

create policy "Admins can manage module prerequisites."
  on module_prerequisites for all
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- Create policies for course_enrollments
create policy "Users can view own enrollments."
  on course_enrollments for select
  using ( auth.uid() = profile_id );

create policy "Users can insert own enrollments."
  on course_enrollments for insert
  with check ( auth.uid() = profile_id );

create policy "Users can update own enrollments."
  on course_enrollments for update
  using ( auth.uid() = profile_id );

create policy "Users can delete own enrollments."
  on course_enrollments for delete
  using ( auth.uid() = profile_id );

-- Create policies for module_progress
create policy "Users can view own progress."
  on module_progress for select
  using ( auth.uid() = profile_id );

create policy "Users can insert own progress."
  on module_progress for insert
  with check ( auth.uid() = profile_id );

create policy "Users can update own progress."
  on module_progress for update
  using ( auth.uid() = profile_id );

create policy "Users can delete own progress."
  on module_progress for delete
  using ( auth.uid() = profile_id );

-- Create policies for course_categories
create policy "Course categories are viewable by everyone."
  on course_categories for select
  using ( true );

create policy "Admins can manage course categories."
  on course_categories for all
  using ( exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- Insert sample course categories with proper UUIDs
-- We'll use a different approach to ensure proper UUID generation
-- insert into course_categories (name, description, color) values
--   ('Trading Fundamentals', 'Core concepts for new traders', '#10B981'),
--   ('Technical Analysis', 'Chart patterns and indicators', '#F59E0B'),
--   ('Risk Management', 'Protecting your capital', '#EF4444'),
--   ('Trading Psychology', 'Mindset and emotions', '#8B5CF6');
-- For now, we'll comment this out and let the application create categories as needed

-- Insert sample courses with proper UUIDs
-- We'll use a different approach to ensure proper UUID generation
-- insert into courses (title, description, level, duration, category_id, instructor) values
--   ('Market Structure Mastery', 'Master the foundational concepts of market structure', 'beginner', '4 hours', null, 'John Smith'),
--   ('Advanced Technical Analysis', 'Deep dive into chart patterns and indicators', 'intermediate', '6 hours', null, 'Jane Doe');
-- For now, we'll comment this out and let the application create courses as needed

-- Insert sample course modules with proper UUIDs
-- Note: We'll use a different approach to ensure proper UUID generation
-- The actual UUIDs will be auto-generated, so we'll insert without specifying IDs
-- insert into course_modules (course_id, title, description, duration, level, content_type, order_number) values
--   ('c001', 'Introduction to Market Structure', 'Understanding the foundation of price action', '45 min', 'beginner', 'video', 1),
--   ('c001', 'Supply and Demand Zones', 'Identifying high probability trading areas', '60 min', 'beginner', 'text', 2),
--   ('c001', 'Market Structure Quiz', 'Test your knowledge', '30 min', 'beginner', 'quiz', 3);
-- For now, we'll comment this out and let the application create modules as needed

-- Insert sample prerequisites
-- We'll use the dynamic approach from the separate migration file
-- The actual prerequisite relationships will be created by the application as needed
