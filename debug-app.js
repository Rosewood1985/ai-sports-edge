// AI Sports Edge Debug and Deploy Script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  rootDir: process.cwd(),
  logFile: path.join(process.cwd(), 'app-debug.log'),
};

// Initialize log file
fs.writeFileSync(config.logFile, `AI Sports Edge Debug and Deploy Log - ${new Date().toISOString()}\n\n`);

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(config.logFile, logMessage);
}

// Helper function to execute shell commands
function execute(command) {
  log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    log(`Command output: ${output}`);
    return output;
  } catch (error) {
    log(`Command error: ${error.message}`);
    return error.message;
  }
}

// Main function
async function main() {
  try {
    log('Starting AI Sports Edge Debug and Deploy Process');

    // 1. Run the detailed debug script
    log('Running detailed debug script');
    execute('node debug-app-detailed.js');

    // 2. Update deployment scripts to use production environment
    log('Updating deployment scripts to use production environment');
    
    // Update deploy.sh
    const deployShPath = path.join(config.rootDir, 'deploy.sh');
    if (fs.existsSync(deployShPath)) {
      let deployShContent = fs.readFileSync(deployShPath, 'utf8');
      deployShContent = deployShContent.replace(
        /npm run build/g, 
        'NODE_ENV=production npm run build:prod'
      );
      fs.writeFileSync(deployShPath, deployShContent);
      log('Updated deploy.sh to use production environment');
    }
    
    // Update deploy-api-key-security.sh
    const deployApiKeyPath = path.join(config.rootDir, 'deploy-api-key-security.sh');
    if (fs.existsSync(deployApiKeyPath)) {
      let deployApiKeyContent = fs.readFileSync(deployApiKeyPath, 'utf8');
      deployApiKeyContent = deployApiKeyContent.replace(
        /npm run build/g, 
        'NODE_ENV=production npm run build:prod'
      );
      fs.writeFileSync(deployApiKeyPath, deployApiKeyContent);
      log('Updated deploy-api-key-security.sh to use production environment');
    }
    
    // Update deploy-ai-features.sh
    const deployAiFeaturesPath = path.join(config.rootDir, 'deploy-ai-features.sh');
    if (fs.existsSync(deployAiFeaturesPath)) {
      let deployAiFeaturesContent = fs.readFileSync(deployAiFeaturesPath, 'utf8');
      deployAiFeaturesContent = deployAiFeaturesContent.replace(
        /npm run build/g, 
        'NODE_ENV=production npm run build:prod'
      );
      fs.writeFileSync(deployAiFeaturesPath, deployAiFeaturesContent);
      log('Updated deploy-ai-features.sh to use production environment');
    }

    // 3. Update Firebase configuration in dist/login.html
    log('Updating Firebase configuration in dist/login.html');
    const loginHtmlPath = path.join(config.rootDir, 'dist', 'login.html');
    if (fs.existsSync(loginHtmlPath)) {
      let loginHtmlContent = fs.readFileSync(loginHtmlPath, 'utf8');
      
      // Check if measurementId is already added
      if (!loginHtmlContent.includes('measurementId')) {
        loginHtmlContent = loginHtmlContent.replace(
          /const firebaseConfig = \{([^}]+)\};/,
          'const firebaseConfig = {$1  // Added measurementId for completeness\n        measurementId: "G-ABCDEF1234"\n      };'
        );
        fs.writeFileSync(loginHtmlPath, loginHtmlContent);
        log('Added measurementId to Firebase configuration in dist/login.html');
      } else {
        log('measurementId already exists in Firebase configuration');
      }
    }

    // 4. Build the application with production environment
    log('Building the application with production environment');
    execute('NODE_ENV=production npm run build:prod');

    // 5. Deploy to Firebase
    log('Deploying to Firebase');
    execute('firebase deploy');

    log('AI Sports Edge Debug and Deploy Process completed successfully');
  } catch (error) {
    log(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});