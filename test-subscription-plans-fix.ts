import { socialMediaService } from './services/socialMediaService';

async function testSubscriptionPlansFix() {
  console.log('Testing subscription plans RLS fix...');
  
  try {
    // Test creating a new subscription plan
    const testPlan = {
      name: 'Test Plan',
      description: 'Test plan for RLS fix verification',
      price: 9.99,
      interval: 'monthly' as const,
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      isActive: true,
      sortOrder: 999
    };
    
    console.log('Attempting to create a test subscription plan...');
    const result = await socialMediaService.createSubscriptionPlan(testPlan);
    
    if (result) {
      console.log('✅ SUCCESS: Subscription plan created successfully');
      console.log('Created plan:', result);
      
      // Clean up by deleting the test plan
      console.log('Cleaning up test plan...');
      await socialMediaService.deleteSubscriptionPlan(result.id);
      console.log('✅ Test plan cleaned up successfully');
    } else {
      console.log('❌ FAILED: Subscription plan creation returned null');
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to create subscription plan:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint
    });
  }
}

// Run the test
testSubscriptionPlansFix();