// Firebase Service Initialization Debugger
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  rootDir: process.cwd(),
  logFile: path.join(process.cwd(), 'service-init-debug.log'),
  envFiles: ['.env', '.env.production', '.env.development', '.env.local'],
  firebaseConfigFiles: [],
  firebaseInitFiles: [],
};

// Initialize log file
fs.writeFileSync(
  config.logFile,
  `Firebase Service Initialization Debug Log - ${new Date().toISOString()}\n\n`
);

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(config.logFile, logMessage);
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

// Main function
async function main() {
  try {
    log('Starting Firebase Service Initialization Debug');

    // 1. Check environment variables
    log('Checking environment variables');
    for (const envFile of config.envFiles) {
      const envPath = path.join(config.rootDir, envFile);
      if (fs.existsSync(envPath)) {
        log(`Found environment file: ${envFile}`);

        const envContent = fs.readFileSync(envPath, 'utf8');
        const firebaseVars = envContent.match(/FIREBASE_[A-Z_]+=.*/g) || [];

        log(`Found ${firebaseVars.length} Firebase-related variables in ${envFile}:`);
        firebaseVars.forEach(variable => {
          // Mask sensitive values
          const maskedVariable = variable.replace(/=(.+)/, '=********');
          log(`  - ${maskedVariable}`);
        });

        // Check for API key specifically
        const apiKeyVar = envContent.match(/FIREBASE_API_KEY=.*/);
        if (apiKeyVar) {
          log(`  - Found FIREBASE_API_KEY in ${envFile}`);

          // Check if it's a test value
          if (apiKeyVar[0].includes('test-firebase-api-key')) {
            log(`  - WARNING: FIREBASE_API_KEY in ${envFile} appears to be a test value`);
          } else if (apiKeyVar[0].includes('AIza')) {
            log(`  - FIREBASE_API_KEY in ${envFile} appears to be a valid Firebase API key`);
          }
        } else {
          log(`  - WARNING: FIREBASE_API_KEY not found in ${envFile}`);
        }
      } else {
        log(`Environment file not found: ${envFile}`);
      }
    }

    // 2. Find Firebase configuration files
    log('Finding Firebase configuration files');
    config.firebaseConfigFiles = findFiles(config.rootDir, /firebase.*config|config.*firebase/i);

    log(`Found ${config.firebaseConfigFiles.length} potential Firebase configuration files:`);
    config.firebaseConfigFiles.forEach(file => log(`  - ${file}`));

    // 3. Analyze Firebase configuration files
    log('Analyzing Firebase configuration files');
    for (const file of config.firebaseConfigFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for Firebase config object
      const configMatch = content.match(/firebaseConfig\s*=\s*{([^}]+)}/);
      if (configMatch) {
        log(`Found Firebase config object in ${file}`);

        // Check for API key
        if (content.includes('apiKey')) {
          log(`  - Found apiKey in Firebase config`);

          // Check if it's using environment variables
          if (content.includes('process.env') && content.includes('FIREBASE_API_KEY')) {
            log(`  - Firebase config is using environment variables for apiKey`);
          } else if (content.includes('AIza')) {
            log(`  - WARNING: Firebase config contains hardcoded API key`);
          }
        } else {
          log(`  - WARNING: apiKey not found in Firebase config`);
        }

        // Check for other required fields
        const requiredFields = [
          'authDomain',
          'projectId',
          'storageBucket',
          'messagingSenderId',
          'appId',
        ];
        for (const field of requiredFields) {
          if (content.includes(field)) {
            log(`  - Found ${field} in Firebase config`);
          } else {
            log(`  - WARNING: ${field} not found in Firebase config`);
          }
        }
      }
    }

    // 4. Find Firebase initialization files
    log('Finding Firebase initialization files');
    config.firebaseInitFiles = findFiles(config.rootDir, /\.(js|jsx|ts|tsx)$/);

    // Filter to only files that contain Firebase initialization
    config.firebaseInitFiles = config.firebaseInitFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return (
        content.includes('initializeApp') ||
        content.includes('firebase.initializeApp') ||
        content.includes('getApps().length === 0')
      );
    });

    log(`Found ${config.firebaseInitFiles.length} files with Firebase initialization:`);
    config.firebaseInitFiles.forEach(file => log(`  - ${file}`));

    // 5. Analyze Firebase initialization
    log('Analyzing Firebase initialization');
    for (const file of config.firebaseInitFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for initialization pattern
      if (content.includes('initializeApp')) {
        log(`Found initializeApp in ${file}`);

        // Check for conditional initialization
        if (content.includes('getApps().length === 0') || content.includes('apps.length === 0')) {
          log(`  - Firebase initialization is conditional (checking if already initialized)`);
        }

        // Check for error handling
        if (
          content.includes('try') &&
          content.includes('catch') &&
          (content.includes('initializeApp') || content.includes('firebase.initializeApp'))
        ) {
          log(`  - Firebase initialization has error handling`);
        } else {
          log(`  - WARNING: Firebase initialization may not have proper error handling`);
        }
      }
    }

    // 6. Check for Firebase Auth usage
    log('Checking for Firebase Auth usage');
    const authFiles = findFiles(config.rootDir, /\.(js|jsx|ts|tsx)$/);

    // Filter to only files that contain Firebase Auth methods
    const authMethods = [
      'signInWithEmailAndPassword',
      'createUserWithEmailAndPassword',
      'signOut',
      'onAuthStateChanged',
      'sendPasswordResetEmail',
    ];

    const authFilesFiltered = authFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return authMethods.some(method => content.includes(method));
    });

    log(`Found ${authFilesFiltered.length} files with Firebase Auth methods:`);
    authFilesFiltered.forEach(file => log(`  - ${file}`));

    // 7. Check for Firebase Auth error handling
    log('Checking for Firebase Auth error handling');
    for (const file of authFilesFiltered) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for error handling
      if (
        content.includes('try') &&
        content.includes('catch') &&
        authMethods.some(method => content.includes(method))
      ) {
        log(`  - ${file} has error handling for Firebase Auth methods`);

        // Check for specific error codes
        if (content.includes('error.code') || content.includes('error.message')) {
          log(`  - ${file} checks for specific error codes/messages`);

          // Check for auth/api-key-not-valid error
          if (content.includes('auth/api-key-not-valid')) {
            log(`  - ${file} specifically handles auth/api-key-not-valid error`);
          }
        }
      } else {
        log(`  - WARNING: ${file} may not have proper error handling for Firebase Auth methods`);
      }
    }

    // 8. Generate summary
    log('Generating summary');

    const summary = `
# Firebase Service Initialization Debug Summary

## Environment Variables
${config.envFiles.filter(env => fs.existsSync(path.join(config.rootDir, env))).length} environment files found
${
  config.envFiles.filter(env => {
    const envPath = path.join(config.rootDir, env);
    if (!fs.existsSync(envPath)) return false;
    const content = fs.readFileSync(envPath, 'utf8');
    return content.includes('FIREBASE_API_KEY');
  }).length
} files contain FIREBASE_API_KEY

## Firebase Configuration
${config.firebaseConfigFiles.length} Firebase configuration files found
${config.firebaseInitFiles.length} files with Firebase initialization

## Firebase Auth
${authFilesFiltered.length} files with Firebase Auth methods

## Recommendations

1. Ensure all deployment scripts use \`NODE_ENV=production npm run build:prod\` instead of \`npm run build\`
2. Consolidate Firebase configuration to a single file
3. Add proper error handling for Firebase Auth methods
4. Use environment variables for all Firebase configuration values
5. Add specific handling for auth/api-key-not-valid error
`;

    const summaryPath = path.join(config.rootDir, 'firebase-auth-fix-summary.md');
    fs.writeFileSync(summaryPath, summary);
    log(`Generated summary: ${summaryPath}`);

    log('Firebase Service Initialization Debug completed successfully');
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
