// Detailed script to debug App.tsx by simulating its behavior
const fs = require('fs');

// Create log file
fs.writeFileSync('app-debug-detailed.log', '--- App Debug Log ---\n\n');

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
  fs.appendFileSync('app-debug-detailed.log', logMessage);
}

// Override console methods
console.log = function() { logToFileAndConsole('[DEBUG]', arguments); };
console.info = function() { logToFileAndConsole('[INFO]', arguments); };
console.warn = function() { logToFileAndConsole('[WARN]', arguments); };
console.error = function() { logToFileAndConsole('[ERROR]', arguments); };

// Simulate LogCategory enum
const LogCategory = {
  APP: 'app',
  NAVIGATION: 'navigation'
};

// Simulate loggingService.ts functions
function initLogging() {
  console.log('Logging initialized successfully');
  return true;
}

function info(category, message, data) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${timestamp}] [INFO] [${category}]`;
  console.info(`${prefix} ${message}`, data || '');
}

// Simulate App.tsx component lifecycle
console.log('Debug script started - Simulating App.tsx');

// Simulate component mounting
console.log('App component rendering');

// Simulate useEffect
console.log('useEffect running - initializing services');
initLogging();
info(LogCategory.APP, 'Application started');

// Simulate NavigationContainer callbacks
console.log('Simulating NavigationContainer setup');
setTimeout(() => {
  console.log('NavigationContainer onReady triggered');
  info(LogCategory.NAVIGATION, 'Navigation container ready');
}, 500);

setTimeout(() => {
  console.log('NavigationContainer onStateChange triggered');
  info(LogCategory.NAVIGATION, 'Navigated to Home');
}, 1000);

// Simulate component re-render
setTimeout(() => {
  console.log('Component re-rendered');
}, 1500);

// End of simulation
setTimeout(() => {
  console.log('Debug script completed');
  
  // Restore original console methods
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  
  console.log('Console methods restored');
  console.log('Check app-debug-detailed.log for the complete log');
}, 2000);