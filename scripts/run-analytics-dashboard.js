#!/usr/bin/env node

/**
 * This script launches the app and navigates directly to the Analytics Dashboard
 * for testing purposes.
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting AI Sports Edge with Analytics Dashboard...');

// Start the development server
const startDevServer = () => {
  console.log('📱 Starting development server...');
  
  const serverProcess = exec('npm run web', (error) => {
    if (error) {
      console.error('❌ Error starting development server:', error);
      process.exit(1);
    }
  });
  
  // Log server output
  serverProcess.stdout.on('data', (data) => {
    console.log(data.toString());
    
    // When the server is ready, open the browser
    if (data.toString().includes('Starting the development server') || 
        data.toString().includes('Compiled successfully') ||
        data.toString().includes('webpack compiled')) {
      setTimeout(() => {
        openBrowser();
      }, 2000); // Wait 2 seconds to ensure server is fully started
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  // Handle server process exit
  serverProcess.on('exit', (code) => {
    console.log(`Development server exited with code ${code}`);
  });
};

// Open the browser with the Analytics Dashboard
const openBrowser = () => {
  console.log('🌐 Opening browser to Analytics Dashboard...');
  
  // Use the appropriate command based on the platform
  const command = process.platform === 'win32' 
    ? `start http://localhost:19006/` 
    : process.platform === 'darwin' 
      ? `open http://localhost:19006/` 
      : `xdg-open http://localhost:19006/`;
  
  exec(command, (error) => {
    if (error) {
      console.error('❌ Error opening browser:', error);
    } else {
      console.log('✅ Browser opened successfully!');
      console.log('📊 Navigate to the Analytics Dashboard by clicking on the card on the home screen.');
    }
  });
};

// Start the process
startDevServer();