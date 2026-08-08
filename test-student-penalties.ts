// Test script to verify student penalties data
import { supabase } from './supabase/client';
import { fetchStudentPenalties } from './services/adminService';

async function testStudentPenalties() {
  console.log('=== Testing Student Penalties Data ===\n');
  
  try {
    // Test the database function directly
    console.log('1. Testing database function directly:');
    const { data: dbData, error: dbError } = await supabase.rpc('get_student_penalties');
    
    if (dbError) {
      console.error('❌ Database function error:', dbError);
    } else {
      console.log('✅ Database function returned', dbData?.length || 0, 'records');
      if (dbData && dbData.length > 0) {
        console.log('Sample data:');
        dbData.slice(0, 3).forEach((item: any, index: number) => {
          console.log(`  ${index + 1}. Name: ${item.name}, Rejected: ${item.rejected_count}, Warning: ${item.warning_count}, Total: ${item.total_penalties}`);
        });
      } else {
        console.log('No penalty data found in database');
      }
    }
    
    // Test the service function
    console.log('\n2. Testing service function:');
    const serviceData = await fetchStudentPenalties();
    
    console.log('✅ Service function returned', serviceData.length, 'records');
    if (serviceData.length > 0) {
      console.log('Sample formatted data:');
      serviceData.slice(0, 3).forEach((item: any, index: number) => {
        console.log(`  ${index + 1}. Name: ${item.name}, Rejected: ${item.rejected_count}, Warning: ${item.warning_count}, Total: ${item.total_penalties}`);
      });
    }
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
  }
}

// Run the test function
testStudentPenalties();