-- Create function to get course enrollment trends with real date data
create or replace function get_course_enrollment_trends(days integer default 30)
returns table(
    date text,
    enrollments bigint,
    completions bigint
) as $$
begin
    return query
    select 
        to_char(date_trunc('day', ce.enrolled_at), 'Mon DD') as date,
        count(*) as enrollments,
        count(*) filter (where ce.status = 'completed') as completions
    from course_enrollments ce
    where ce.enrolled_at >= (current_date - interval '1 day' * days)
    group by date_trunc('day', ce.enrolled_at)
    order by date_trunc('day', ce.enrolled_at);
end;
$$ language plpgsql;

-- Create function to get module completion rates by course
create or replace function get_module_completion_rates()
returns table(
    course_id uuid,
    course_title text,
    completion_rate numeric,
    total_modules bigint,
    completed_modules bigint
) as $$
begin
    return query
    select 
        c.id as course_id,
        c.title as course_title,
        case 
            when count(cm.id) = 0 then 0
            else round((count(*) filter (where mp.completed = true) * 100.0) / greatest(count(cm.id), 1), 2)
        end as completion_rate,
        count(cm.id) as total_modules,
        count(*) filter (where mp.completed = true) as completed_modules
    from courses c
    left join course_modules cm on c.id = cm.course_id
    left join module_progress mp on cm.id = mp.module_id
    group by c.id, c.title
    order by completion_rate desc;
end;
$$ language plpgsql;

-- Create function to get course enrollment counts
create or replace function get_course_enrollment_counts()
returns table(
    course_id uuid,
    course_title text,
    total_enrollments bigint,
    active_enrollments bigint,
    completed_enrollments bigint,
    dropped_enrollments bigint
) as $$
begin
    return query
    select 
        c.id as course_id,
        c.title as course_title,
        count(ce.id) as total_enrollments,
        count(*) filter (where ce.status = 'active') as active_enrollments,
        count(*) filter (where ce.status = 'completed') as completed_enrollments,
        count(*) filter (where ce.status = 'dropped') as dropped_enrollments
    from courses c
    left join course_enrollments ce on c.id = ce.course_id
    group by c.id, c.title
    order by total_enrollments desc
    limit 10;
end;
$$ language plpgsql;

-- Create function to get course difficulty distribution
create or replace function get_course_difficulty_distribution()
returns table(
    level text,
    count bigint
) as $$
begin
    return query
    select 
        c.level,
        count(*) as count
    from courses c
    group by c.level
    order by count desc;
end;
$$ language plpgsql;

-- Create function to get content type distribution
create or replace function get_content_type_distribution()
returns table(
    content_type text,
    count bigint
) as $$
begin
    return query
    select 
        cm.content_type,
        count(*) as count
    from course_modules cm
    group by cm.content_type
    order by count desc;
end;
$$ language plpgsql;