/**
 * Sentry Test Cloud Function
 * Test error reporting and monitoring for Cloud Functions
 * 
 * This function can be called to verify Sentry integration is working
 * and then removed from production deployments.
 */

const { onRequest } = require("firebase-functions/v2/https");
const {
  wrapHttpFunction,
  trackRacingFunction,
  trackMLFunction,
  trackSubscriptionFunction,
  trackNotificationFunction,
  captureCloudFunctionError,
  trackFunctionPerformance,
  Sentry,
} = require('./sentryConfig');

// Test function to verify Sentry integration
exports.sentryTest = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('Running Sentry test function');
    
    const testType = req.query.test || 'all';
    const results = [];
    
    // Test 1: Basic error capture
    if (testType === 'error' || testType === 'all') {
      try {
        throw new Error('Test error from Cloud Function');
      } catch (error) {
        const eventId = captureCloudFunctionError(error, 'sentryTest', {
          testType: 'basic_error',
          timestamp: new Date().toISOString(),
        });
        results.push({
          test: 'Basic Error Capture',
          success: true,
          eventId,
          message: 'Error captured successfully',
        });
      }
    }
    
    // Test 2: Racing operation tracking
    if (testType === 'racing' || testType === 'all') {
      trackRacingFunction('sentryTest', 'nascar', {
        raceId: 'test_atlanta_500',
        drivers: 40,
        testMode: true,
        cloudFunction: true,
      });
      
      trackRacingFunction('sentryTest', 'horse_racing', {
        raceId: 'test_kentucky_derby',
        runners: 20,
        testMode: true,
        cloudFunction: true,
      });
      
      results.push({
        test: 'Racing Operation Tracking',
        success: true,
        message: 'NASCAR and Horse Racing operations tracked',
      });
    }
    
    // Test 3: ML operation tracking
    if (testType === 'ml' || testType === 'all') {
      trackMLFunction('sentryTest', 'prediction', 'xgboost', {
        sport: 'nascar',
        accuracy: 0.89,
        testMode: true,
        cloudFunction: true,
      });
      
      trackMLFunction('sentryTest', 'training', 'neural_network', {
        sport: 'horse_racing',
        epochs: 100,
        testMode: true,
        cloudFunction: true,
      });
      
      results.push({
        test: 'ML Operation Tracking',
        success: true,
        message: 'XGBoost and Neural Network operations tracked',
      });
    }
    
    // Test 4: Subscription tracking
    if (testType === 'subscription' || testType === 'all') {
      trackSubscriptionFunction('sentryTest', 'test_action', {
        userId: 'test_user_123',
        subscriptionId: 'test_sub_456',
        testMode: true,
        cloudFunction: true,
      });
      
      results.push({
        test: 'Subscription Tracking',
        success: true,
        message: 'Subscription operation tracked',
      });
    }
    
    // Test 5: Notification tracking
    if (testType === 'notification' || testType === 'all') {
      trackNotificationFunction('sentryTest', 'racing_alert', 25, {
        sport: 'nascar',
        raceId: 'test_race_789',
        testMode: true,
        cloudFunction: true,
      });
      
      results.push({
        test: 'Notification Tracking',
        success: true,
        message: 'Notification operation tracked with 25 recipients',
      });
    }
    
    // Test 6: Performance monitoring
    if (testType === 'performance' || testType === 'all') {
      const transaction = Sentry.startTransaction({
        name: 'Test Cloud Function Performance',
        op: 'cloud_function_test',
        description: 'Testing Sentry performance monitoring in Cloud Functions',
      });
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      transaction.finish();
      
      results.push({
        test: 'Performance Transaction',
        success: true,
        message: 'Performance transaction completed',
      });
    }
    
    // Test 7: Breadcrumb tracking
    if (testType === 'breadcrumbs' || testType === 'all') {
      Sentry.addBreadcrumb({
        message: 'Test breadcrumb from Cloud Function',
        category: 'test',
        level: 'info',
        data: {
          function: 'sentryTest',
          testMode: true,
          timestamp: new Date().toISOString(),
        },
      });
      
      results.push({
        test: 'Breadcrumb Tracking',
        success: true,
        message: 'Breadcrumb added successfully',
      });
    }
    
    // Test 8: Message capture
    if (testType === 'message' || testType === 'all') {
      const eventId = Sentry.captureMessage('Test message from Cloud Function', 'info');
      
      results.push({
        test: 'Message Capture',
        success: true,
        eventId,
        message: 'Info message captured',
      });
    }
    
    const duration = Date.now() - startTime;
    trackFunctionPerformance('sentryTest', duration, true, {
      testType,
      testsRun: results.length,
    });
    
    // Return test results
    res.status(200).json({
      success: true,
      message: 'Sentry Cloud Function tests completed successfully',
      environment: process.env.NODE_ENV || 'production',
      functionName: 'sentryTest',
      duration,
      results,
      sentryDsn: '***configured***',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in Sentry test function:', error);
    captureCloudFunctionError(error, 'sentryTest', {
      testType: req.query.test,
      method: req.method,
    });
    trackFunctionPerformance('sentryTest', Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      error: 'Sentry test function failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Racing data processing test function
exports.testRacingDataProcessing = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const sport = req.query.sport || 'nascar';
    
    trackRacingFunction('testRacingDataProcessing', sport, {
      operation: 'data_ingestion_test',
      testMode: true,
    });
    
    // Simulate racing data processing
    const transaction = Sentry.startTransaction({
      name: `Test ${sport} Data Processing`,
      op: 'racing_data_processing',
      description: `Testing ${sport} data ingestion and feature extraction`,
    });
    
    // Simulate feature extraction
    await new Promise(resolve => setTimeout(resolve, 200));
    trackRacingFunction('testRacingDataProcessing', sport, {
      operation: 'feature_extraction',
      featuresGenerated: 25,
      testMode: true,
    });
    
    // Simulate ML prediction
    await new Promise(resolve => setTimeout(resolve, 150));
    trackMLFunction('testRacingDataProcessing', 'prediction', 'xgboost', {
      sport,
      accuracy: 0.91,
      participantCount: sport === 'nascar' ? 40 : 20,
      testMode: true,
    });
    
    transaction.finish();
    
    const duration = Date.now() - startTime;
    trackFunctionPerformance('testRacingDataProcessing', duration, true, {
      sport,
      operationsCompleted: 3,
    });
    
    res.status(200).json({
      success: true,
      message: `${sport} data processing test completed`,
      sport,
      duration,
      operations: [
        'data_ingestion',
        'feature_extraction',
        'ml_prediction',
      ],
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in racing data processing test:', error);
    captureCloudFunctionError(error, 'testRacingDataProcessing', {
      sport: req.query.sport,
    });
    trackFunctionPerformance('testRacingDataProcessing', Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      error: 'Racing data processing test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Test function for subscription analytics
exports.testSubscriptionAnalytics = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  
  try {
    trackSubscriptionFunction('testSubscriptionAnalytics', 'analytics_test', {
      testMode: true,
    });
    
    // Simulate subscription analytics processing
    const transaction = Sentry.startTransaction({
      name: 'Test Subscription Analytics',
      op: 'subscription_analytics',
      description: 'Testing subscription analytics and reporting',
    });
    
    // Simulate data aggregation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    transaction.finish();
    
    const duration = Date.now() - startTime;
    trackFunctionPerformance('testSubscriptionAnalytics', duration, true);
    
    res.status(200).json({
      success: true,
      message: 'Subscription analytics test completed',
      duration,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in subscription analytics test:', error);
    captureCloudFunctionError(error, 'testSubscriptionAnalytics');
    trackFunctionPerformance('testSubscriptionAnalytics', Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      error: 'Subscription analytics test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));