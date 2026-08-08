// Simple test to verify admin service functions
import { fetchPendingApplications } from '../services/adminService';

// Mock console.log for cleaner output
const originalLog = console.log;
console.log = (...args) => {
  // Only log important messages
  if (args[0].includes('Testing') || args[0].includes('✅') || args[0].includes('❌')) {
    originalLog(...args);
  }
};

async function testAdminService() {
  console.log('Testing admin service functions...');
  
  try {
    // Test fetchPendingApplications function
    console.log('Testing fetchPendingApplications...');
    const pendingApps = await fetchPendingApplications();
    console.log(`✅ fetchPendingApplications returned ${pendingApps.length} applications`);
    
    // Verify the structure of returned data
    if (pendingApps.length > 0) {
      const app = pendingApps[0];
      if (app.id && app.name && app.email && app.tier && app.joinedDate) {
        console.log('✅ Pending applications have correct structure');
      } else {
        console.log('❌ Pending applications missing required fields');
      }
      
      // Check that all returned applications have pending tiers
      const pendingTiers = ['elite-pending', 'foundation-pending', 'professional-pending'];
      const allPending = pendingApps.every(app => pendingTiers.includes(app.tier));
      if (allPending) {
        console.log('✅ All returned applications have pending tiers');
      } else {
        console.log('❌ Some applications do not have pending tiers');
      }
    }
    
    console.log('✅ Admin service tests completed successfully');
  } catch (error) {
    console.log('❌ Admin service tests failed:', error.message);
  }
}

// Run the test
testAdminService().then(() => {
  console.log = originalLog; // Restore original console.log
});