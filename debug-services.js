// This file will be imported by App.tsx to debug service initialization

// Export a function to debug service initialization
export const debugServiceInitialization = () => {
  console.log('=== DEBUG SERVICE INITIALIZATION ===');
  
  // Check if errorUtils is available
  try {
    const errorUtilsPath = require.resolve('./services/errorUtils');
    console.log('errorUtils module found at:', errorUtilsPath);
  } catch (error) {
    console.error('errorUtils module not found:', error.message);
  }
  
  // Check if loggingService is available
  try {
    const loggingServicePath = require.resolve('./services/loggingService');
    console.log('loggingService module found at:', loggingServicePath);
  } catch (error) {
    console.error('loggingService module not found:', error.message);
  }
  
  // Check if errorTrackingService is available
  try {
    const errorTrackingServicePath = require.resolve('./services/errorTrackingService');
    console.log('errorTrackingService module found at:', errorTrackingServicePath);
  } catch (error) {
    console.error('errorTrackingService module not found:', error.message);
  }
  
  console.log('=== END DEBUG SERVICE INITIALIZATION ===');
};

// Export a function to debug service dependencies
export const debugServiceDependencies = () => {
  console.log('=== DEBUG SERVICE DEPENDENCIES ===');
  
  // Check if @sentry/browser is available
  try {
    const sentryPath = require.resolve('@sentry/browser');
    console.log('@sentry/browser module found at:', sentryPath);
  } catch (error) {
    console.error('@sentry/browser module not found:', error.message);
  }
  
  // Check if react-native is available
  try {
    const reactNativePath = require.resolve('react-native');
    console.log('react-native module found at:', reactNativePath);
  } catch (error) {
    console.error('react-native module not found:', error.message);
  }
  
  console.log('=== END DEBUG SERVICE DEPENDENCIES ===');
};