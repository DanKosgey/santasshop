-- Quick test to verify the penalty trends function works
-- First, let's see if we get any data from the function
SELECT * FROM get_penalty_trends();

-- If the above returns no data, let's check if we have any journal entries with penalties at all
SELECT 
    date_trunc('day', date)::date as date_period,
    validation_result,
    count(*) as count
FROM journal_entries 
WHERE validation_result IN ('rejected', 'warning')
GROUP BY date_trunc('day', date)::date, validation_result
ORDER BY date_trunc('day', date)::date;

-- Let's also check the total count of journal entries with penalties
SELECT 
    validation_result,
    count(*) as total_count
FROM journal_entries 
WHERE validation_result IN ('rejected', 'warning')
GROUP BY validation_result;