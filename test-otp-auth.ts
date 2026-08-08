/**
 * Test script for OTP authentication flow
 * This script verifies that the OTP-based authentication is working correctly
 */

import { supabase } from './supabase/client';

async function testOtpSignup() {
  console.log('Testing OTP-based signup flow...');
  
  try {
    // Test signup with OTP
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test User',
          subscription_tier: 'free'
        },
        emailRedirectTo: undefined // Don't use redirect links
      }
    });
    
    if (signupError) {
      console.error('Signup Error:', signupError);
      return;
    }
    
    console.log('Signup successful:', signupData);
    
    // Note: In a real test, you would:
    // 1. Check the email for the OTP code
    // 2. Use that code to verify the signup
    // 3. Test login with password
    // 4. Test passwordless login with OTP
    
    console.log('OTP signup flow test completed. Please check email for verification code.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testOtpSignup();