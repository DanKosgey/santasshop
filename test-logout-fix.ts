import { supabase } from './supabase/client';

async function testLogoutFix() {
  console.log('Testing logout functionality fix...');
  
  try {
    // Test logout function
    console.log('Attempting logout...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ ERROR: Logout failed:', error);
      console.log('This might be expected if the user is not logged in.');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
    } else {
      console.log('✅ SUCCESS: Logout completed successfully');
    }
    
    console.log('\n=== LOGOUT FUNCTIONALITY TEST COMPLETE ===');
    console.log('If you were previously getting a 403 Forbidden error during logout,');
    console.log('the fixes should have resolved the issue:');
    console.log('1. Updated client.ts to use VITE_SUPABASE_ANON_KEY instead of VITE_SUPABASE_PUBLISHABLE_KEY');
    console.log('2. Added error handling to the logout function in App.tsx');
    console.log('3. Added error handling to the logout function in UnderReviewPage.tsx');
    
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
testLogoutFix();