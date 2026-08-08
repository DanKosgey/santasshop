import { courseService } from './services/courseService';

async function testCoursesRLSFix() {
  console.log('Testing courses RLS fix...');
  
  try {
    // Test creating a minimal course to test the RLS policy
    const testCourse = {
      title: 'Test Course for RLS Fix Verification',
      description: 'Test course to verify RLS policies are working correctly',
      level: 'beginner' as const,
      duration: '2 hours',
      thumbnail: '',
      instructor: 'Test Instructor',
      categoryId: null
    };
    
    console.log('Attempting to create a test course...');
    const result = await courseService.createCourse(testCourse);
    
    if (result) {
      console.log('✅ SUCCESS: Course created successfully');
      console.log('Created course:', result);
      
      // Clean up by deleting the test course
      console.log('Cleaning up test course...');
      await courseService.deleteCourse(result.id);
      console.log('✅ Test course cleaned up successfully');
    } else {
      console.log('❌ FAILED: Course creation returned null');
      console.log('This might be expected if the current user is not an admin or if there are still RLS policy issues.');
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to create course:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint
    });
  }
}

// Run the test
testCoursesRLSFix();