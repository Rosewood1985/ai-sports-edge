// Simple script to debug App.tsx by importing and rendering it
const fs = require('fs');

// Redirect console.log to both console and a file
const originalConsoleLog = console.log;
console.log = function() {
  // Write to console
  originalConsoleLog.apply(console, arguments);
  
  // Write to file
  const logMessage = Array.from(arguments).join(' ') + '\n';
  fs.appendFileSync('app-debug.log', logMessage);
};

console.log('Debug script started');
console.log('Attempting to simulate App.tsx rendering');

// Simulate React component lifecycle
console.log('Simulating component mounting');
console.log('App component rendering');
console.log('useEffect running');
console.log('State updated');
console.log('Component re-rendered');

console.log('Debug script completed');