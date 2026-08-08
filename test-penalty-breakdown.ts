// Test script to verify penalty breakdown functionality
import { supabase } from './supabase/client';

async function testPenaltyBreakdown() {
  console.log('Testing penalty breakdown functionality...');
  
  try {
    // Test the get_student_penalties function
    const { data, error } = await supabase.rpc('get_student_penalties');
    
    if (error) {
      console.error('❌ ERROR: Failed to fetch student penalties:', error);
      return;
    }
    
    console.log('✅ SUCCESS: Student penalties data retrieved');
    console.log('Number of students with penalties:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('Sample penalty data:');
      data.slice(0, 3).forEach((student: any) => {
        console.log(`  - ${student.name || student.email}: ${student.total_penalties} penalties (${student.rejected_count} rejected, ${student.warning_count} warnings)`);
      });
    }
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error);
  }
}

// Run the test function
testPenaltyBreakdown();