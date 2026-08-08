// Debug script to check what penalty trends data is being returned
import { supabase } from './supabase/client';
import { fetchPenaltyTrends } from './services/adminService';

async function debugPenaltyTrends() {
  console.log('=== Debugging Penalty Trends Data ===\n');
  
  try {
    // Test the database function directly
    console.log('1. Testing database function directly:');
    const { data: dbData, error: dbError } = await supabase.rpc('get_penalty_trends');
    
    if (dbError) {
      console.error('❌ Database function error:', dbError);
    } else {
      console.log('✅ Database function returned', dbData?.length || 0, 'records');
      if (dbData && dbData.length > 0) {
        console.log('Sample data:');
        dbData.slice(0, 3).forEach((item: any, index: number) => {
          console.log(`  ${index + 1}. Date: ${item.date_period}, Rejected: ${item.rejected_count}, Warning: ${item.warning_count}, Total: ${item.total_penalties}`);
        });
      }
    }
    
    // Test the service function
    console.log('\n2. Testing service function:');
    const serviceData = await fetchPenaltyTrends();
    
    console.log('✅ Service function returned', serviceData.length, 'records');
    if (serviceData.length > 0) {
      console.log('Sample formatted data:');
      serviceData.slice(0, 3).forEach((item: any, index: number) => {
        console.log(`  ${index + 1}. Date: ${item.date}, Rejected: ${item.rejected}, Warning: ${item.warning}, Total: ${item.total}`);
      });
    }
    
    console.log('\n=== Debug Complete ===');
  } catch (error) {
    console.error('❌ Unexpected error during debug:', error);
  }
}

// Run the debug function
debugPenaltyTrends();