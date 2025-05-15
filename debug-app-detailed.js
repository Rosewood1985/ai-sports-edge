// 🛠️ FULL SYSTEMATIC DEBUG + CLEANUP FOR AI SPORTS EDGE WEB APP

// Import required modules
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const prettier = require('prettier');

// Configuration
const config = {
  rootDir: process.cwd(),
  srcDir: path.join(process.cwd(), 'src'),
  componentsDir: path.join(process.cwd(), 'components'),
  screensDir: path.join(process.cwd(), 'screens'),
  servicesDir: path.join(process.cwd(), 'services'),
  utilsDir: path.join(process.cwd(), 'utils'),
  hooksDir: path.join(process.cwd(), 'hooks'),
  assetsDir: path.join(process.cwd(), 'assets'),
  i18nDir: path.join(process.cwd(), 'i18n'),
  docsDir: path.join(process.cwd(), 'docs'),
  testDir: path.join(process.cwd(), '__tests__'),
  distDir: path.join(process.cwd(), 'dist'),
  logFile: path.join(process.cwd(), 'app-debug-detailed.log'),
};

// Initialize log file
fs.writeFileSync(config.logFile, `AI Sports Edge Debug Log - ${new Date().toISOString()}\n\n`);

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

// Helper function to find files recursively
function findFiles(dir, pattern, results = []) {
  if (!fs.existsSync(dir)) {
    log(`Directory does not exist: ${dir}`);
    return results;
  }

  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, pattern, results);
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Helper function to check if a file contains a pattern
function fileContains(filePath, pattern) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  return pattern.test(content);
}

// Helper function to create directory if it doesn't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

// 1. 🔎 Begin with entry point (App.tsx / index.tsx)
log('1. 🔎 Analyzing entry points (App.tsx / index.tsx)');

// Check App.tsx
const appTsxPath = path.join(config.rootDir, 'App.tsx');
if (fs.existsSync(appTsxPath)) {
  log('Found App.tsx');
  const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');
  
  // Check for Firebase initialization
  if (appTsxContent.includes('firebase') || appTsxContent.includes('Firebase')) {
    log('App.tsx contains Firebase references');
    
    // Check for proper initialization
    if (appTsxContent.includes('initializeApp')) {
      log('Firebase appears to be initialized in App.tsx');
    } else {
      log('WARNING: Firebase is referenced but may not be properly initialized in App.tsx');
    }
  } else {
    log('App.tsx does not contain direct Firebase references');
  }
  
  // Check for context providers
  const contextProviders = (appTsxContent.match(/<(\w+)Provider/g) || [])
    .map(match => match.replace('<', '').replace('Provider', ''));
  
  if (contextProviders.length > 0) {
    log(`Found context providers in App.tsx: ${contextProviders.join(', ')}`);
  } else {
    log('No context providers found in App.tsx');
  }
} else {
  log('App.tsx not found');
}

// Check index.tsx or index.js
const indexTsxPath = path.join(config.srcDir, 'index.tsx');
const indexJsPath = path.join(config.srcDir, 'index.js');

if (fs.existsSync(indexTsxPath)) {
  log('Found index.tsx');
  const indexContent = fs.readFileSync(indexTsxPath, 'utf8');
  
  // Check for Firebase initialization
  if (indexContent.includes('firebase') || indexContent.includes('Firebase')) {
    log('index.tsx contains Firebase references');
    
    // Check for proper initialization
    if (indexContent.includes('initializeApp')) {
      log('Firebase appears to be initialized in index.tsx');
    } else {
      log('WARNING: Firebase is referenced but may not be properly initialized in index.tsx');
    }
  }
} else if (fs.existsSync(indexJsPath)) {
  log('Found index.js');
  const indexContent = fs.readFileSync(indexJsPath, 'utf8');
  
  // Check for Firebase initialization
  if (indexContent.includes('firebase') || indexContent.includes('Firebase')) {
    log('index.js contains Firebase references');
    
    // Check for proper initialization
    if (indexContent.includes('initializeApp')) {
      log('Firebase appears to be initialized in index.js');
    } else {
      log('WARNING: Firebase is referenced but may not be properly initialized in index.js');
    }
  }
} else {
  log('Neither index.tsx nor index.js found in src directory');
}

// 2. 🧼 Clean codebase
log('2. 🧼 Cleaning codebase');

// Find potential duplicate files
log('Checking for potential duplicate files');
const firebaseConfigFiles = findFiles(config.rootDir, /firebase.*config/i);
if (firebaseConfigFiles.length > 1) {
  log(`WARNING: Multiple Firebase config files found: ${firebaseConfigFiles.join(', ')}`);
}

// Find potential dead code (components never imported)
log('Checking for potential dead code');
const componentFiles = findFiles(config.componentsDir, /\.(jsx|tsx|js|ts)$/);
log(`Found ${componentFiles.length} component files`);

const potentialDeadComponents = [];
for (const componentFile of componentFiles) {
  const componentName = path.basename(componentFile, path.extname(componentFile));
  const componentPattern = new RegExp(`import.*${componentName}|<${componentName}[\\s/>]`);
  
  let isImported = false;
  const allSourceFiles = [
    ...findFiles(config.srcDir, /\.(jsx|tsx|js|ts)$/),
    ...findFiles(config.componentsDir, /\.(jsx|tsx|js|ts)$/),
    ...findFiles(config.screensDir, /\.(jsx|tsx|js|ts)$/),
  ];
  
  for (const sourceFile of allSourceFiles) {
    if (sourceFile === componentFile) continue;
    
    if (fileContains(sourceFile, componentPattern)) {
      isImported = true;
      break;
    }
  }
  
  if (!isImported) {
    potentialDeadComponents.push(componentFile);
  }
}

if (potentialDeadComponents.length > 0) {
  log(`WARNING: Found ${potentialDeadComponents.length} potentially unused components:`);
  potentialDeadComponents.forEach(comp => log(`  - ${comp}`));
}

// 3. ✅ Fix Signup Flow
log('3. ✅ Analyzing Signup Flow');

// Find signup-related files
const signupFiles = [
  ...findFiles(config.screensDir, /signup|register|auth/i),
  ...findFiles(config.componentsDir, /signup|register|auth/i),
];

log(`Found ${signupFiles.length} signup-related files`);
signupFiles.forEach(file => log(`  - ${file}`));

// Check for Firebase Auth usage in signup files
for (const file of signupFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('createUserWithEmailAndPassword')) {
    log(`File ${file} contains Firebase Auth signup method`);
    
    // Check for proper error handling
    if (content.includes('catch') && content.includes('error.code')) {
      log(`File ${file} has error handling for Firebase Auth`);
    } else {
      log(`WARNING: File ${file} may not have proper error handling for Firebase Auth`);
    }
  }
}

// 4. 🧭 Verify App Navigation
log('4. 🧭 Verifying App Navigation');

// Find navigation-related files
const navigationFiles = findFiles(config.rootDir, /navigation|navigator|router|route/i);
log(`Found ${navigationFiles.length} navigation-related files`);

// Check for navigation configuration
for (const file of navigationFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('createStackNavigator') || content.includes('createBottomTabNavigator')) {
    log(`File ${file} contains React Navigation configuration`);
  } else if (content.includes('BrowserRouter') || content.includes('Route')) {
    log(`File ${file} contains React Router configuration`);
  }
}

// 5. 🎯 Check Feature Load Order
log('5. 🎯 Checking Feature Load Order');

// Check for theme and language context
const themeContextFiles = findFiles(config.rootDir, /theme.*context/i);
const languageContextFiles = findFiles(config.rootDir, /language.*context|i18n.*context/i);

log(`Found ${themeContextFiles.length} theme context files`);
log(`Found ${languageContextFiles.length} language context files`);

// 6. 🧹 Cleanup
log('6. 🧹 Cleanup');

// Create a list of files to potentially clean up
const cleanupCandidates = [
  ...potentialDeadComponents,
  ...(firebaseConfigFiles.length > 1 ? firebaseConfigFiles.slice(1) : []),
];

if (cleanupCandidates.length > 0) {
  log(`Identified ${cleanupCandidates.length} files as cleanup candidates:`);
  cleanupCandidates.forEach(file => log(`  - ${file}`));
  
  // Create a backup directory
  const backupDir = path.join(config.rootDir, 'backups', new Date().toISOString().split('T')[0]);
  ensureDirectoryExists(backupDir);
  
  // Backup files instead of deleting them
  for (const file of cleanupCandidates) {
    const relativePath = path.relative(config.rootDir, file);
    const backupPath = path.join(backupDir, relativePath);
    ensureDirectoryExists(path.dirname(backupPath));
    
    fs.copyFileSync(file, backupPath);
    log(`Backed up ${file} to ${backupPath}`);
    
    // Don't actually delete, just mark as potential deletion
    log(`MARKED FOR POTENTIAL DELETION: ${file}`);
  }
}

// 7. 📁 Refactor folder structure
log('7. 📁 Analyzing folder structure');

// Check if the project follows the recommended folder structure
const recommendedFolders = [
  'screens', 'components', 'contexts', 'services', 'utils', 'hooks', 'assets', 'i18n'
];

for (const folder of recommendedFolders) {
  const folderPath = path.join(config.rootDir, folder);
  if (fs.existsSync(folderPath)) {
    log(`Found recommended folder: ${folder}`);
  } else {
    log(`Missing recommended folder: ${folder}`);
  }
}

// 8. ⚙️ Standardize code formatting
log('8. ⚙️ Standardizing code formatting');

// Check if prettier is installed
try {
  const prettierVersion = execSync('npx prettier --version', { encoding: 'utf8' });
  log(`Prettier version: ${prettierVersion.trim()}`);
  
  // Don't actually run prettier, just log the command
  log('To format all files, run: npx prettier --write .');
} catch (error) {
  log('Prettier not found. To install: npm install --save-dev prettier');
}

// 9. 🗃️ Cache Improvements
log('9. 🗃️ Analyzing caching strategies');

// Check for service worker
const serviceWorkerFiles = findFiles(config.rootDir, /service-worker|serviceworker|sw\.js/i);
if (serviceWorkerFiles.length > 0) {
  log(`Found ${serviceWorkerFiles.length} service worker files`);
} else {
  log('No service worker files found');
}

// Check for caching in Firebase config
const firebaseFiles = findFiles(config.rootDir, /firebase/i);
for (const file of firebaseFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('enablePersistence') || content.includes('cacheSizeBytes')) {
    log(`File ${file} contains Firestore persistence/caching configuration`);
  }
}

// 10. 📄 Validate documentation
log('10. 📄 Validating documentation');

// Check for documentation files
ensureDirectoryExists(config.docsDir);
const docFiles = findFiles(config.docsDir, /\.md$/);
log(`Found ${docFiles.length} documentation files`);

// Check for key documentation topics
const requiredDocs = [
  'auth', 'firebase-setup', 'user-preferences', 'betting-logic', 
  'prediction-model', 'onboarding', 'profile-settings'
];

const missingDocs = [];
for (const topic of requiredDocs) {
  const hasDoc = docFiles.some(file => {
    const filename = path.basename(file, '.md');
    return filename.includes(topic);
  });
  
  if (!hasDoc) {
    missingDocs.push(topic);
  }
}

if (missingDocs.length > 0) {
  log(`Missing documentation for: ${missingDocs.join(', ')}`);
  
  // Create template for missing docs
  for (const topic of missingDocs) {
    const docPath = path.join(config.docsDir, `${topic}.md`);
    const docContent = `# ${topic.charAt(0).toUpperCase() + topic.slice(1).replace(/-/g, ' ')}

## Overview

[Provide an overview of the ${topic.replace(/-/g, ' ')} feature]

## Implementation Details

[Describe how the ${topic.replace(/-/g, ' ')} feature is implemented]

## Usage

[Explain how to use the ${topic.replace(/-/g, ' ')} feature]

## Troubleshooting

[Common issues and solutions related to ${topic.replace(/-/g, ' ')}]

`;
    
    fs.writeFileSync(docPath, docContent);
    log(`Created template documentation file: ${docPath}`);
  }
}

// 11. 🧪 Verify testing hooks
log('11. 🧪 Verifying testing setup');

// Check for test files
const testFiles = findFiles(config.testDir, /\.(test|spec)\.(js|jsx|ts|tsx)$/);
log(`Found ${testFiles.length} test files`);

// Check for auth-related tests
const authTestFiles = testFiles.filter(file => {
  const content = fs.readFileSync(file, 'utf8');
  return content.includes('login') || content.includes('signup') || 
         content.includes('auth') || content.includes('register');
});

log(`Found ${authTestFiles.length} auth-related test files`);

// 12. 🔐 Environment Variables
log('12. 🔐 Checking Environment Variables');

// Check for .env files
const envFiles = [
  '.env',
  '.env.production',
  '.env.development',
  '.env.local',
];

for (const envFile of envFiles) {
  const envPath = path.join(config.rootDir, envFile);
  if (fs.existsSync(envPath)) {
    log(`Found environment file: ${envFile}`);
    
    // Check for Firebase-related variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const firebaseVars = envContent.match(/FIREBASE_[A-Z_]+/g) || [];
    log(`Found ${firebaseVars.length} Firebase-related variables in ${envFile}`);
  }
}

// 13. 🧾 Final Report
log('13. 🧾 Generating Final Report');

// Create a summary report
const summaryReport = `
# AI Sports Edge Debug Summary

## Issues Found

1. ${firebaseConfigFiles.length > 1 ? `Multiple Firebase config files (${firebaseConfigFiles.length})` : 'Firebase config files look good'}
2. ${potentialDeadComponents.length > 0 ? `Potentially unused components (${potentialDeadComponents.length})` : 'No unused components detected'}
3. ${missingDocs.length > 0 ? `Missing documentation for: ${missingDocs.join(', ')}` : 'Documentation looks complete'}

## Recommendations

1. Ensure Firebase is properly initialized with the correct API key
2. Update all deployment scripts to use \`npm run build:prod\` instead of \`npm run build\`
3. Consolidate Firebase configuration to a central location
4. Improve error handling for authentication flows
5. Clean up unused components and duplicate configuration files
6. Complete missing documentation
7. Add tests for critical flows like authentication

## Next Steps

1. Run the deployment scripts with the production environment:
   \`\`\`
   NODE_ENV=production npm run build:prod
   firebase deploy
   \`\`\`

2. Verify that the signup flow works correctly
3. Implement the remaining recommendations from this report
`;

const summaryPath = path.join(config.rootDir, 'debugging-summary.md');
fs.writeFileSync(summaryPath, summaryReport);
log(`Generated summary report: ${summaryPath}`);

// Create a detailed plan
const detailedPlan = `
# AI Sports Edge Detailed Debugging Plan

## 1. Fix Environment Variables

1. Update all deployment scripts to use production environment:
   - deploy.sh
   - deploy-api-key-security.sh
   - deploy-ai-features.sh

2. Ensure webpack.config.js and webpack.prod.js load the correct environment variables

## 2. Consolidate Firebase Configuration

1. Create a central firebase.config.js file
2. Use environment variables for all Firebase configuration values
3. Remove duplicate Firebase configuration files

## 3. Improve Error Handling

1. Add detailed error logging for Firebase authentication errors
2. Provide user-friendly error messages for common authentication issues

## 4. Clean Up Codebase

1. Remove unused components
2. Standardize code formatting with Prettier
3. Improve documentation

## 5. Fix Navigation Issues

1. Ensure all navigation links work correctly
2. Fix client-side routing for static HTML files

## 6. Implement Testing

1. Add tests for authentication flows
2. Ensure all tests pass before deployment

## 7. Deployment Process

1. Set up a more robust deployment process
2. Add pre-deployment checks for environment variables
`;

const planPath = path.join(config.rootDir, 'debugging-plan.md');
fs.writeFileSync(planPath, detailedPlan);
log(`Generated detailed plan: ${planPath}`);

log('Debug script completed successfully');