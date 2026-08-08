import { socialMediaService } from './services/socialMediaService';

async function testSubscriptionPlans() {
  console.log('Testing subscription plans synchronization...');
  
  try {
    // Test fetching subscription plans
    const plans = await socialMediaService.getSubscriptionPlans();
    console.log('Active subscription plans:', plans);
    
    // Test fetching all subscription plans
    const allPlans = await socialMediaService.getAllSubscriptionPlans();
    console.log('All subscription plans:', allPlans);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSubscriptionPlans();