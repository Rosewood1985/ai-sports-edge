/**
 * ML Sports Edge Pipeline Test
 * Tests the data pipeline and prediction API
 */

require('dotenv').config();
const { runPipeline, runPipelineForSport } = require('./run-pipeline');
const predictionController = require('./api/controllers/prediction.controller');

/**
 * Test the pipeline with a single sport
 * @param {string} sport - Sport key
 */
async function testPipelineForSport(sport) {
  console.log(`\n=== TESTING PIPELINE FOR ${sport} ===\n`);
  
  try {
    // Run pipeline for the sport with minimal steps
    const result = await runPipelineForSport(sport, {
      fetchData: true,
      normalizeData: true,
      extractFeatures: true,
      trainModels: false // Skip training for quick test
    });
    
    console.log(`Pipeline test for ${sport} completed with result:`, result);
    
    return result;
  } catch (error) {
    console.error(`Error testing pipeline for ${sport}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test the prediction API
 */
async function testPredictionAPI() {
  console.log('\n=== TESTING PREDICTION API ===\n');
  
  // Mock Express request and response objects
  const mockReq = {
    query: {
      sport: 'NBA',
      limit: 2
    },
    params: {},
    user: {
      id: 'test-user-123'
    },
    body: {}
  };
  
  const mockRes = {
    json: (data) => {
      console.log('API Response:', JSON.stringify(data, null, 2));
      return mockRes;
    },
    status: (code) => {
      console.log('Status Code:', code);
      return mockRes;
    }
  };
  
  try {
    // Test game predictions endpoint
    console.log('\nTesting getGamePredictions:');
    await predictionController.getGamePredictions(mockReq, mockRes);
    
    // Test trending predictions endpoint
    console.log('\nTesting getTrendingPredictions:');
    await predictionController.getTrendingPredictions(mockReq, mockRes);
    
    // Test player prediction endpoint
    console.log('\nTesting getPlayerPrediction:');
    mockReq.params.playerId = 'player123';
    await predictionController.getPlayerPrediction(mockReq, mockRes);
    
    console.log('\nPrediction API tests completed successfully');
    
    return {
      success: true,
      message: 'Prediction API tests completed successfully'
    };
  } catch (error) {
    console.error('Error testing prediction API:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting ML Sports Edge pipeline and API tests...');
  
  const results = {
    pipeline: {},
    api: null
  };
  
  // Test pipeline for NBA (as a representative sport)
  results.pipeline.NBA = await testPipelineForSport('NBA');
  
  // Test prediction API
  results.api = await testPredictionAPI();
  
  console.log('\n=== TEST RESULTS SUMMARY ===\n');
  console.log('Pipeline Tests:');
  Object.entries(results.pipeline).forEach(([sport, result]) => {
    console.log(`- ${sport}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  });
  
  console.log('\nAPI Tests:');
  console.log(`- Prediction API: ${results.api.success ? 'SUCCESS' : 'FAILED'}`);
  
  return results;
}

// Execute if run directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      const allSuccessful = Object.values(results.pipeline).every(r => r.success) && results.api.success;
      
      if (allSuccessful) {
        console.log('\nAll tests completed successfully!');
        process.exit(0);
      } else {
        console.error('\nSome tests failed. See summary above for details.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error in tests:', error);
      process.exit(1);
    });
}

module.exports = {
  testPipelineForSport,
  testPredictionAPI,
  runAllTests
};