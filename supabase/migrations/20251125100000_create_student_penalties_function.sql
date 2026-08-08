-- Create a function to get student penalties for analytics
create or replace function get_student_penalties()
returns table(
    id uuid,
    name text,
    email text,
    tier text,
    rejected_count bigint,
    warning_count bigint,
    total_penalties bigint
) as $$
begin
    return query
    with student_penalties as (
        select 
            p.id,
            p.full_name,
            p.email,
            p.subscription_tier,
            count(case when je.validation_result = 'rejected' then 1 end) as rejected_count,
            count(case when je.validation_result = 'warning' then 1 end) as warning_count
        from profiles p
        left join journal_entries je on p.id = je.user_id 
            and je.validation_result in ('rejected', 'warning')
        where p.role = 'student'
        group by p.id, p.full_name, p.email, p.subscription_tier
    )
    select 
        sp.id,
        coalesce(sp.full_name, sp.email, 'Unknown') as name,
        sp.email,
        sp.subscription_tier as tier,
        sp.rejected_count,
        sp.warning_count,
        (sp.rejected_count + sp.warning_count) as total_penalties
    from student_penalties sp
    where (sp.rejected_count + sp.warning_count) > 0
    order by (sp.rejected_count + sp.warning_count) desc
    limit 20;
end;
$$ language plpgsql;