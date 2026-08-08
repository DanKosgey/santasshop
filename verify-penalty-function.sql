-- Verify the get_student_penalties function works correctly
SELECT * FROM get_student_penalties();

-- Also check the total penalties across all students
SELECT 
    SUM(rejected_count) as total_rejected,
    SUM(warning_count) as total_warnings,
    SUM(total_penalties) as total_all_penalties
FROM get_student_penalties();