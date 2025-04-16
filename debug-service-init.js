// Debug script to test service initialization
const fs = require('fs');

// Create log file
fs.writeFileSync('service-init-debug.log', '--- Service Initialization Debug Log ---\n\n');

// Redirect console.log to both console and a file
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

function logToFileAndConsole(prefix, args) {
  // Write to console
  const consoleMethod = prefix === '[INFO]' ? originalConsoleInfo : 
                        prefix === '[WARN]' ? originalConsoleWarn : 
                        prefix === '[ERROR]' ? originalConsoleError : 
                        originalConsoleLog;
  
  consoleMethod.apply(console, args);
  
  // Format for file
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const formattedPrefix = `[${timestamp}] ${prefix}`;
  const logMessage = formattedPrefix + ' ' + Array.from(args).join(' ') + '\n';
  
  // Write to file
  fs.appendFileSync('service-init-debug.log', logMessage);
}

// Override console methods
console.log = function() { logToFileAndConsole('[DEBUG]', arguments); };
console.info = function() { logToFileAndConsole('[INFO]', arguments); };
console.warn = function() { logToFileAndConsole('[WARN]', arguments); };
console.error = function() { logToFileAndConsole('[ERROR]', arguments); };

console.log('Debug script started - Testing service initialization');

// Mock React Native environment
global.__DEV__ = true;
global.Platform = { OS: 'web' };

// Mock React hooks
const mockUseEffect = (callback) => {
  console.log('Simulating useEffect');
  callback();
};

// Mock React Native components
global.React = {
  useEffect: mockUseEffect
};

// Mock navigation
const mockNavigationContainer = {
  onReady: (callback) => {
    console.log('Simulating NavigationContainer onReady');
    callback();
  },
  onStateChange: (callback) => {
    console.log('Simulating NavigationContainer onStateChange');
    callback({ routes: [{ name: 'Home' }], index: 0 });
  }
};

// Import services
try {
  console.log('Attempting to import errorUtils.ts');
  // This would normally be done with import, but we're using require for this script
  const errorUtils = require('./services/errorUtils');
  console.log('Successfully imported errorUtils:', Object.keys(errorUtils));
} catch (error) {
  console.error('Failed to import errorUtils:', error.message);
}

try {
  console.log('Attempting to import loggingService.ts');
  // This would normally be done with import, but we're using require for this script
  const loggingService = require('./services/loggingService');
  console.log('Successfully imported loggingService:', Object.keys(loggingService));
  
  console.log('Initializing logging service');
  const loggingInitialized = loggingService.initLogging();
  console.log('Logging initialization result:', loggingInitialized);
  
  if (loggingInitialized) {
    console.log('Testing logging functions');
    loggingService.info(loggingService.LogCategory.APP, 'Test info message');
    loggingService.warn(loggingService.LogCategory.APP, 'Test warning message');
    loggingService.error(loggingService.LogCategory.APP, 'Test error message', new Error('Test error'));
  }
} catch (error) {
  console.error('Failed to import or initialize loggingService:', error.message, error.stack);
}

try {
  console.log('Attempting to import errorTrackingService.ts');
  // This would normally be done with import, but we're using require for this script
  const errorTrackingService = require('./services/errorTrackingService');
  console.log('Successfully imported errorTrackingService:', Object.keys(errorTrackingService));
  
  console.log('Initializing error tracking service');
  errorTrackingService.initErrorTracking();
  
  console.log('Testing error tracking functions');
  errorTrackingService.captureMessage('Test message');
  errorTrackingService.captureException(new Error('Test exception'));
} catch (error) {
  console.error('Failed to import or initialize errorTrackingService:', error.message, error.stack);
}

// Simulate App.tsx initialization
console.log('Simulating App.tsx initialization');
try {
  console.log('Initializing services in order');
  
  // Initialize logging first
  console.log('About to initialize logging service');
  const loggingService = require('./services/loggingService');
  const loggingInitialized = loggingService.initLogging();
  console.log('Logging initialization result:', loggingInitialized);
  
  if (loggingInitialized) {
    loggingService.info(loggingService.LogCategory.APP, 'Logging service initialized');
    
    // Try to initialize error tracking
    console.log('About to initialize error tracking service');
    try {
      const errorTrackingService = require('./services/errorTrackingService');
      errorTrackingService.initErrorTracking();
      console.log('Error tracking service initialized successfully');
      loggingService.info(loggingService.LogCategory.APP, 'Error tracking service initialized');
    } catch (errorTrackingError) {
      console.error('Failed to initialize error tracking:', errorTrackingError);
    }
  } else {
    console.error('Logging service failed to initialize');
  }
  
  // Log app start
  console.log('Logging application start');
  loggingService.info(loggingService.LogCategory.APP, 'Application started');
  
  // Simulate NavigationContainer callbacks
  mockNavigationContainer.onReady(() => {
    loggingService.info(loggingService.LogCategory.NAVIGATION, 'Navigation container ready');
  });
  
  mockNavigationContainer.onStateChange((state) => {
    const currentRoute = state?.routes[state.index]?.name;
    if (currentRoute) {
      loggingService.info(loggingService.LogCategory.NAVIGATION, `Navigated to ${currentRoute}`);
    }
  });
} catch (error) {
  console.error('Error in App.tsx simulation:', error.message, error.stack);
}

// End of simulation
setTimeout(() => {
  console.log('Debug script completed');
  
  // Restore original console methods
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  
  console.log('Console methods restored');
  console.log('Check service-init-debug.log for the complete log');
}, 2000);