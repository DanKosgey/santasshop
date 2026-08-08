// Test script to verify subscription tier handling
import { supabase } from './supabase/client';

async function testSubscriptionTiers() {
  console.log('Testing subscription tier handling...');
  
  // Test 1: Create a user with free tier
  console.log('Test 1: Creating user with free tier...');
  const { data: freeUser, error: freeError } = await supabase.auth.signUp({
    email: 'free_test@example.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Free Test User',
        subscription_tier: 'free'
      }
    }
  });
  
  if (freeError) {
    console.error('Error creating free user:', freeError);
  } else {
    console.log('Free user created:', freeUser);
  }
  
  // Test 2: Create a user with elite tier (should become elite-pending)
  console.log('Test 2: Creating user with elite tier...');
  const { data: eliteUser, error: eliteError } = await supabase.auth.signUp({
    email: 'elite_test@example.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Elite Test User',
        subscription_tier: 'elite'
      }
    }
  });
  
  if (eliteError) {
    console.error('Error creating elite user:', eliteError);
  } else {
    console.log('Elite user created:', eliteUser);
  }
  
  // Give some time for the triggers to run
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check the profiles table to see if the tiers were set correctly
  console.log('Checking profiles table...');
  
  // Check free user
  const { data: freeProfile, error: freeProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'free_test@example.com')
    .single();
    
  if (freeProfileError) {
    console.error('Error fetching free user profile:', freeProfileError);
  } else {
    console.log('Free user profile:', freeProfile);
    console.log('Free user subscription tier:', freeProfile?.subscription_tier);
  }
  
  // Check elite user
  const { data: eliteProfile, error: eliteProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'elite_test@example.com')
    .single();
    
  if (eliteProfileError) {
    console.error('Error fetching elite user profile:', eliteProfileError);
  } else {
    console.log('Elite user profile:', eliteProfile);
    console.log('Elite user subscription tier:', eliteProfile?.subscription_tier);
  }
  
  console.log('Test completed.');
}

// Run the test
testSubscriptionTiers().catch(console.error);