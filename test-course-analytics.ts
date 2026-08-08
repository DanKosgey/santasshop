import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCourseAnalytics() {
  console.log('Testing Course Analytics Functions...\n');

  try {
    // Test 1: Course Enrollment Trends
    console.log('1. Testing Course Enrollment Trends...');
    const { data: enrollmentTrends, error: enrollmentError } = await supabase.rpc('get_course_enrollment_trends', { days: 30 });
    if (enrollmentError) throw enrollmentError;
    console.log('   Enrollment Trends:', enrollmentTrends);
    console.log('   ✓ Course Enrollment Trends function works\n');

    // Test 2: Module Completion Rates
    console.log('2. Testing Module Completion Rates...');
    const { data: completionRates, error: completionError } = await supabase.rpc('get_module_completion_rates');
    if (completionError) throw completionError;
    console.log('   Module Completion Rates:', completionRates);
    console.log('   ✓ Module Completion Rates function works\n');

    // Test 3: Course Enrollment Counts
    console.log('3. Testing Course Enrollment Counts...');
    const { data: enrollmentCounts, error: countsError } = await supabase.rpc('get_course_enrollment_counts');
    if (countsError) throw countsError;
    console.log('   Course Enrollment Counts:', enrollmentCounts);
    console.log('   ✓ Course Enrollment Counts function works\n');

    // Test 4: Course Difficulty Distribution
    console.log('4. Testing Course Difficulty Distribution...');
    const { data: difficultyDist, error: difficultyError } = await supabase.rpc('get_course_difficulty_distribution');
    if (difficultyError) throw difficultyError;
    console.log('   Course Difficulty Distribution:', difficultyDist);
    console.log('   ✓ Course Difficulty Distribution function works\n');

    // Test 5: Content Type Distribution
    console.log('5. Testing Content Type Distribution...');
    const { data: contentTypeDist, error: contentTypeError } = await supabase.rpc('get_content_type_distribution');
    if (contentTypeError) throw contentTypeError;
    console.log('   Content Type Distribution:', contentTypeDist);
    console.log('   ✓ Content Type Distribution function works\n');

    console.log('🎉 All Course Analytics Functions are working correctly!');
  } catch (error) {
    console.error('❌ Error testing Course Analytics Functions:', error);
  }
}

// Run the test
testCourseAnalytics();