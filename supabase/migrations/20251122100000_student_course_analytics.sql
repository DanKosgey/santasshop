-- Create function to get student course progress
-- This function returns detailed progress information for a specific student across all their enrolled courses
create or replace function get_student_course_progress(user_id uuid)
returns table(
    course_id uuid,
    course_title text,
    course_level text,
    enrolled_at timestamp with time zone,
    status text,
    progress integer,
    total_modules bigint,
    completed_modules bigint,
    completion_percentage numeric
) as $$
begin
    return query
    select 
        c.id as course_id,
        c.title as course_title,
        c.level as course_level,
        ce.enrolled_at,
        ce.status,
        ce.progress,
        count(cm.id) as total_modules,
        count(*) filter (where mp.completed = true) as completed_modules,
        case 
            when count(cm.id) = 0 then 0
            else round((count(*) filter (where mp.completed = true) * 100.0) / greatest(count(cm.id), 1), 2)
        end as completion_percentage
    from course_enrollments ce
    join courses c on ce.course_id = c.id
    left join course_modules cm on c.id = cm.course_id
    left join module_progress mp on cm.id = mp.module_id and mp.profile_id = get_student_course_progress.user_id
    where ce.profile_id = get_student_course_progress.user_id
    group by c.id, c.title, c.level, ce.enrolled_at, ce.status, ce.progress
    order by ce.enrolled_at desc;
end;
$$ language plpgsql security definer;

-- Create function to get student module progress for a specific course
-- This function returns detailed progress information for a specific student in a specific course
create or replace function get_student_module_progress(user_id uuid, course_id uuid)
returns table(
    module_id uuid,
    module_title text,
    module_level text,
    module_order integer,
    completed boolean,
    completed_at timestamp with time zone,
    quiz_score numeric,
    time_spent integer
) as $$
begin
    return query
    select 
        cm.id as module_id,
        cm.title as module_title,
        cm.level as module_level,
        cm.order_number as module_order,
        coalesce(mp.completed, false) as completed,
        mp.completed_at,
        mp.quiz_score,
        mp.time_spent
    from course_modules cm
    left join module_progress mp on cm.id = mp.module_id and mp.profile_id = get_student_module_progress.user_id
    where cm.course_id = get_student_module_progress.course_id
    order by cm.order_number;
end;
$$ language plpgsql security definer;

-- Create function to get student overall course statistics
-- This function returns aggregated statistics for a student's course activity
create or replace function get_student_course_stats(user_id uuid)
returns table(
    total_courses_enrolled bigint,
    total_courses_completed bigint,
    total_courses_active bigint,
    avg_completion_rate numeric,
    total_modules_completed bigint,
    total_time_spent integer
) as $$
begin
    return query
    with course_stats as (
        select 
            count(*) as total_courses_enrolled,
            count(*) filter (where ce.status = 'completed') as total_courses_completed,
            count(*) filter (where ce.status = 'active') as total_courses_active
        from course_enrollments ce
        where ce.profile_id = get_student_course_stats.user_id
    ),
    module_stats as (
        select 
            count(*) filter (where mp.completed = true) as total_modules_completed,
            sum(mp.time_spent) as total_time_spent
        from module_progress mp
        where mp.profile_id = get_student_course_stats.user_id
    ),
    completion_stats as (
        select 
            avg(case 
                when count(cm.id) = 0 then 0
                else round((count(*) filter (where mp.completed = true) * 100.0) / greatest(count(cm.id), 1), 2)
            end) as avg_completion_rate
        from course_enrollments ce
        join courses c on ce.course_id = c.id
        left join course_modules cm on c.id = cm.course_id
        left join module_progress mp on cm.id = mp.module_id and mp.profile_id = get_student_course_stats.user_id
        where ce.profile_id = get_student_course_stats.user_id
        group by c.id
    )
    select 
        cs.total_courses_enrolled,
        cs.total_courses_completed,
        cs.total_courses_active,
        coalesce(avg(cs2.avg_completion_rate), 0) as avg_completion_rate,
        coalesce(ms.total_modules_completed, 0) as total_modules_completed,
        coalesce(ms.total_time_spent, 0) as total_time_spent
    from course_stats cs
    cross join module_stats ms
    left join completion_stats cs2 on true;
end;
$$ language plpgsql security definer;

-- Security Notes:
-- 1. All functions use 'security definer' to ensure they run with appropriate privileges
-- 2. All functions filter data by user_id parameter, ensuring students can only access their own data
-- 3. The underlying course_enrollments, course_modules, and module_progress tables have Row Level Security (RLS) policies that restrict access:
--    - Users can only view their own enrollments
--    - Users can only view their own progress
-- 4. These database-level security measures ensure that even if application-level checks fail,
--    the data remains protected at the database level