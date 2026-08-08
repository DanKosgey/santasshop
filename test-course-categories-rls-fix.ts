import { supabase } from './supabase/client';

async function testCourseCategoriesRLSFix() {
  console.log('Testing course categories RLS fix...');
  
  try {
    // Test creating a minimal course category to test the RLS policy
    const testCategory = {
      name: 'Test Category for RLS Fix Verification',
      description: 'Test category to verify RLS policies are working correctly',
      color: '#FF0000'
    };
    
    console.log('Attempting to create a test category...');
    const { data, error } = await supabase
      .from('course_categories')
      .insert(testCategory)
      .select()
      .single();
    
    if (error) throw error;
    
    if (data) {
      console.log('✅ SUCCESS: Category created successfully');
      console.log('Created category:', data);
      
      // Clean up by deleting the test category
      console.log('Cleaning up test category...');
      const { error: deleteError } = await supabase
        .from('course_categories')
        .delete()
        .eq('id', data.id);
      
      if (deleteError) throw deleteError;
      console.log('✅ Test category cleaned up successfully');
    } else {
      console.log('❌ FAILED: Category creation returned null');
      console.log('This might be expected if the current user is not an admin or if there are still RLS policy issues.');
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to create category:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint
    });
  }
  
  console.log('\n=== COURSE CATEGORIES RLS FIX TEST COMPLETE ===');
  console.log('If you were previously getting the "new row violates row-level security policy" error,');
  console.log('please ensure that migration 20251126100009_fix_course_categories_rls.sql has been applied.');
}

// Run the test
testCourseCategoriesRLSFix();