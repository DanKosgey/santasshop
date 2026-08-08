import { supabase } from './supabase/client';

async function testAdminJournalEntries() {
  console.log('Testing admin journal entries fetch...');
  
  try {
    // Test the RPC function directly
    console.log('Calling get_all_trades_for_admin_enhanced RPC function...');
    const { data, error } = await supabase.rpc('get_all_trades_for_admin_enhanced');
    
    if (error) {
      console.error('❌ ERROR: Failed to call RPC function:', error);
      return;
    }
    
    console.log(`✅ SUCCESS: RPC function returned ${data.length} entries`);
    console.log('Sample entries:', data.slice(0, 3));
    
    // Check if the specific user's entry is in the results
    const targetUserId = '69e4e1ae-b84d-4023-bead-71ecf479ed6e';
    const userEntries = data.filter((entry: any) => entry.user_id === targetUserId);
    
    if (userEntries.length > 0) {
      console.log(`✅ SUCCESS: Found ${userEntries.length} entries for user ${targetUserId}`);
      console.log('Sample user entry:', userEntries[0]);
    } else {
      console.log(`⚠️  WARNING: No entries found for user ${targetUserId}`);
      console.log('This might indicate an issue with the RPC function filter or the user\'s role');
    }
    
    // Also test fetching a specific entry by ID if we know one
    console.log('\nTesting direct query for journal entries...');
    const { data: directData, error: directError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', targetUserId)
      .limit(3);
    
    if (directError) {
      console.error('❌ ERROR: Failed to query journal_entries directly:', directError);
    } else {
      console.log(`✅ SUCCESS: Direct query returned ${directData.length} entries for user ${targetUserId}`);
      if (directData.length > 0) {
        console.log('Sample direct entry:', directData[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error);
  }
  
  console.log('\n=== ADMIN JOURNAL ENTRIES TEST COMPLETE ===');
}

// Run the test
testAdminJournalEntries();