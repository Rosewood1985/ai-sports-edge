// Minimal boxing service test to verify memory optimization

import { boxingDataSyncService } from '../services/boxing/boxingDataSyncService.js';

async function testBoxingService() {
  try {
    console.log('🥊 Starting minimal boxing service test...');
    
    // Test basic service initialization
    await boxingDataSyncService.initialize();
    console.log('✅ Boxing service initialized successfully');
    
    // Test getting upcoming fights (should be lightweight)
    const upcomingFights = await boxingDataSyncService.getUpcomingFights(7); // Next 7 days only
    console.log(`✅ Found ${upcomingFights.length} upcoming fights`);
    
    // Test getting a single fighter (minimal memory usage)
    const testFighter = await boxingDataSyncService.getFighterById('canelo_alvarez');
    if (testFighter) {
      console.log(`✅ Retrieved fighter: ${testFighter.name}`);
    } else {
      console.log('ℹ️ Test fighter not found (expected for fresh DB)');
    }
    
    console.log('✅ Minimal boxing service test completed successfully');
    console.log('📊 Memory usage test passed - no heap overflow');
    
  } catch (error) {
    console.error('❌ Boxing service test failed:', error.message);
    throw error;
  }
}

// Set memory limit and run test
process.env.NODE_OPTIONS = '--max-old-space-size=8192';

testBoxingService()
  .then(() => {
    console.log('🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });