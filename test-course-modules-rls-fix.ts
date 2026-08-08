import { supabase } from './supabase/client';

async function testCourseModulesRLSFix() {
  console.log('Testing course modules RLS fix...');
  
  try {
    // First, we need a course to attach the module to
    console.log('Creating a temporary course...');
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: 'Test Course for Module RLS Fix Verification',
        description: 'Test course to verify module RLS policies are working correctly',
        level: 'beginner'
      })
      .select()
      .single();
    
    if (courseError) {
      console.error('❌ ERROR: Failed to create temporary course:', courseError);
      return;
    }
    
    console.log('✅ SUCCESS: Temporary course created');
    
    // Test creating a minimal course module to test the RLS policy
    const testModule = {
      course_id: courseData.id,
      title: 'Test Module for RLS Fix Verification',
      description: 'Test module to verify RLS policies are working correctly',
      level: 'beginner' as const,
      content_type: 'text' as const,
      content: 'This is test content for the module',
      order_number: 1
    };
    
    console.log('Attempting to create a test module...');
    const { data: moduleData, error: moduleError } = await supabase
      .from('course_modules')
      .insert(testModule)
      .select()
      .single();
    
    if (moduleError) {
      console.error('❌ ERROR: Failed to create module:', moduleError);
      console.error('Error details:', {
        message: moduleError.message,
        code: moduleError.code,
        details: moduleError.details,
        hint: moduleError.hint
      });
    } else if (moduleData) {
      console.log('✅ SUCCESS: Module created successfully');
      console.log('Created module:', moduleData);
      
      // Clean up by deleting the test module
      console.log('Cleaning up test module...');
      const { error: deleteModuleError } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleData.id);
      
      if (deleteModuleError) {
        console.error('❌ ERROR: Failed to delete test module:', deleteModuleError);
      } else {
        console.log('✅ Test module cleaned up successfully');
      }
    } else {
      console.log('❌ FAILED: Module creation returned null');
      console.log('This might be expected if the current user is not an admin or if there are still RLS policy issues.');
    }
    
    // Clean up by deleting the temporary course
    console.log('Cleaning up temporary course...');
    const { error: deleteCourseError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseData.id);
    
    if (deleteCourseError) {
      console.error('❌ ERROR: Failed to delete temporary course:', deleteCourseError);
    } else {
      console.log('✅ Temporary course cleaned up successfully');
    }
    
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR: Test failed:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      name: (error as Error).name,
      stack: (error as Error).stack
    });
  }
}

// Run the test
testCourseModulesRLSFix();