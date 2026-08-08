-- Add versioning support to courses table
alter table courses add column if not exists version integer default 1;
alter table courses add column if not exists parent_id uuid references courses(id);

-- Add versioning support to course_modules table
alter table course_modules add column if not exists version integer default 1;
alter table course_modules add column if not exists parent_id uuid references course_modules(id);

-- Create indexes for better performance
create index if not exists courses_version_idx on courses(version);
create index if not exists courses_parent_id_idx on courses(parent_id);
create index if not exists course_modules_version_idx on course_modules(version);
create index if not exists course_modules_parent_id_idx on course_modules(parent_id);

-- Create a function to create a new version of a course
create or replace function create_course_version(course_id uuid)
returns uuid as $$
declare
  new_course_id uuid;
  new_module_id uuid;
  old_course courses;
  old_module course_modules;
begin
  -- Get the original course
  select * into old_course from courses where id = course_id;
  
  if not found then
    raise exception 'Course not found';
  end if;
  
  -- Create new version of the course
  insert into courses (
    title, description, level, duration, thumbnail, instructor, category_id, 
    version, parent_id, created_at, updated_at
  ) values (
    old_course.title, old_course.description, old_course.level, old_course.duration, 
    old_course.thumbnail, old_course.instructor, old_course.category_id,
    old_course.version + 1, course_id, now(), now()
  ) returning id into new_course_id;
  
  -- Copy all modules for this course
  for old_module in 
    select * from course_modules where course_id = course_id
  loop
    insert into course_modules (
      course_id, title, description, duration, level, content, content_type, 
      order_number, version, parent_id, created_at, updated_at
    ) values (
      new_course_id, old_module.title, old_module.description, old_module.duration,
      old_module.level, old_module.content, old_module.content_type,
      old_module.order_number, old_module.version + 1, old_module.id, now(), now()
    );
  end loop;
  
  return new_course_id;
end;
$$ language plpgsql;

-- Create a function to get all versions of a course
create or replace function get_course_versions(course_id uuid)
returns table(
  id uuid,
  title text,
  version integer,
  created_at timestamp with time zone,
  is_current boolean
) as $$
begin
  return query
  with recursive course_tree as (
    -- Base case: the original course
    select id, title, version, created_at, parent_id, id as root_id
    from courses 
    where id = course_id or parent_id = course_id
    
    union all
    
    -- Recursive case: all child versions
    select c.id, c.title, c.version, c.created_at, c.parent_id, ct.root_id
    from courses c
    join course_tree ct on c.parent_id = ct.id
  )
  select 
    ct.id,
    ct.title,
    ct.version,
    ct.created_at,
    (ct.id = course_id) as is_current
  from course_tree ct
  where ct.root_id = (select id from courses where id = course_id or parent_id = course_id limit 1)
  order by ct.version;
end;
$$ language plpgsql;

-- Create policies for versioned courses
create policy "Users can view all versions of courses."
  on courses for select
  using (true);

create policy "Admins can create course versions."
  on courses for insert
  with check (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can update course versions."
  on courses for update
  using (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- Create policies for versioned modules
create policy "Users can view all versions of modules."
  on course_modules for select
  using (true);

create policy "Admins can create module versions."
  on course_modules for insert
  with check (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can update module versions."
  on course_modules for update
  using (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));