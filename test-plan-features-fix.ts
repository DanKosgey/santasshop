import { socialMediaService } from './services/socialMediaService';

async function testPlanFeaturesFix() {
  console.log('Testing plan features RLS fix...');
  
  try {
    // First, create a temporary subscription plan to attach features to
    const testPlan = {
      name: 'Test Plan for Features',
      description: 'Test plan for RLS fix verification',
      price: 9.99,
      interval: 'monthly' as const,
      features: [],
      isActive: true,
      sortOrder: 999
    };
    
    console.log('Creating a temporary subscription plan...');
    const planResult = await socialMediaService.createSubscriptionPlan(testPlan);
    
    if (!planResult) {
      console.log('❌ FAILED: Could not create temporary subscription plan');
      return;
    }
    
    console.log('✅ SUCCESS: Temporary subscription plan created');
    
    // Test creating a new plan feature
    const testFeature = {
      planId: planResult.id,
      featureName: 'Test Feature',
      featureDescription: 'Test feature for RLS fix verification',
      isIncluded: true,
      sortOrder: 1
    };
    
    console.log('Attempting to create a test plan feature...');
    const featureResult = await socialMediaService.createPlanFeature(testFeature);
    
    if (featureResult) {
      console.log('✅ SUCCESS: Plan feature created successfully');
      console.log('Created feature:', featureResult);
      
      // Clean up by deleting the test feature
      console.log('Cleaning up test feature...');
      await socialMediaService.deletePlanFeature(featureResult.id);
      console.log('✅ Test feature cleaned up successfully');
    } else {
      console.log('❌ FAILED: Plan feature creation returned null');
    }
    
    // Clean up by deleting the temporary plan
    console.log('Cleaning up temporary plan...');
    await socialMediaService.deleteSubscriptionPlan(planResult.id);
    console.log('✅ Temporary plan cleaned up successfully');
  } catch (error) {
    console.error('❌ ERROR: Failed to create plan feature:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint
    });
  }
}

// Run the test
testPlanFeaturesFix();