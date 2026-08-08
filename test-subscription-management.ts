import { socialMediaService } from './services/socialMediaService.js';

async function testSubscriptionManagement() {
  console.log('Testing subscription plan management...');
  
  try {
    // Test fetching all subscription plans (admin view)
    console.log('Fetching all subscription plans...');
    const allPlans = await socialMediaService.getAllSubscriptionPlans();
    console.log('All plans:', allPlans);
    
    // Test creating a new subscription plan
    console.log('Creating a new subscription plan...');
    const newPlan = await socialMediaService.createSubscriptionPlan({
      name: 'Test Plan',
      description: 'A test subscription plan',
      price: 29.99,
      interval: 'monthly',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      isActive: true,
      sortOrder: 10
    });
    
    if (newPlan) {
      console.log('Created new plan:', newPlan);
      
      // Test updating the subscription plan
      console.log('Updating the subscription plan...');
      const updateSuccess = await socialMediaService.updateSubscriptionPlan(newPlan.id, {
        name: 'Updated Test Plan',
        price: 39.99,
        features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4']
      });
      
      if (updateSuccess) {
        console.log('Plan updated successfully');
      } else {
        console.log('Failed to update plan');
      }
      
      // Test fetching active subscription plans (user view)
      console.log('Fetching active subscription plans...');
      const activePlans = await socialMediaService.getSubscriptionPlans();
      console.log('Active plans:', activePlans);
      
      // Test deleting the subscription plan
      console.log('Deleting the subscription plan...');
      const deleteSuccess = await socialMediaService.deleteSubscriptionPlan(newPlan.id);
      
      if (deleteSuccess) {
        console.log('Plan deleted successfully');
      } else {
        console.log('Failed to delete plan');
      }
    } else {
      console.log('Failed to create new plan');
    }
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSubscriptionManagement();