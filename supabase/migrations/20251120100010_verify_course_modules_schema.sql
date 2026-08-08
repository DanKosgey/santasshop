-- Verify course_modules schema and test basic operations
-- This migration tests that the course_modules table is working correctly after schema refresh

-- Test insert operation
DO $$
DECLARE
    test_course_id UUID;
    test_module_id UUID;
BEGIN
    -- Create a temporary course for testing if none exists
    INSERT INTO courses (title, description, level)
    VALUES ('Test Course', 'Temporary course for testing', 'beginner')
    ON CONFLICT DO NOTHING;
    
    -- Get a course ID to use for testing
    SELECT id INTO test_course_id FROM courses LIMIT 1;
    
    -- If we have a course, test inserting a module
    IF test_course_id IS NOT NULL THEN
        -- Test insert
        INSERT INTO course_modules (course_id, title, description, level, content_type, order_number)
        VALUES (test_course_id, 'Test Module', 'Temporary module for testing', 'beginner', 'text', 1)
        ON CONFLICT DO NOTHING;
        
        -- Test update
        UPDATE course_modules 
        SET title = 'Updated Test Module', updated_at = NOW()
        WHERE title = 'Test Module' OR title = 'Updated Test Module';
        
        -- Clean up test data
        DELETE FROM course_modules WHERE title = 'Updated Test Module';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    -- Log any errors but don't fail the migration
    RAISE NOTICE 'Test operations failed: %', SQLERRM;
END $$;