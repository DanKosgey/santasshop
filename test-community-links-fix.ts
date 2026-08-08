import { socialMediaService } from './services/socialMediaService';

async function testCommunityLinksFix() {
  console.log('Testing community links RLS fix...');
  
  try {
    // Test creating a new community link
    const testLink = {
      platformName: 'Test Platform',
      platformKey: 'test-platform',
      linkUrl: 'https://test-platform.com/mbauni',
      description: 'Test platform for RLS fix verification',
      iconColor: '#FF0000',
      isActive: true,
      sortOrder: 999
    };
    
    console.log('Attempting to create a test community link...');
    const result = await socialMediaService.createCommunityLink(testLink);
    
    if (result) {
      console.log('✅ SUCCESS: Community link created successfully');
      console.log('Created link:', result);
      
      // Clean up by deleting the test link
      console.log('Cleaning up test link...');
      await socialMediaService.deleteCommunityLink(result.id);
      console.log('✅ Test link cleaned up successfully');
    } else {
      console.log('❌ FAILED: Community link creation returned null');
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to create community link:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint
    });
  }
}

// Run the test
testCommunityLinksFix();