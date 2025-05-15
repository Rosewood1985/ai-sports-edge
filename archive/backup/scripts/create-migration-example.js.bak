/**
 * AI Sports Edge - Create Firebase Migration Example
 * 
 * This script creates an example of how to migrate a file to use
 * the consolidated Firebase services in the atomic architecture.
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let filePath = null;

if (args.length > 0) {
  filePath = args[0];
} else {
  console.error('Error: File path is required.');
  console.log('Usage: node create-migration-example.js <file_path>');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: File '${filePath}' does not exist.`);
  process.exit(1);
}

// Read file content
const fileContent = fs.readFileSync(filePath, 'utf8');

// Helper function to detect Firebase imports
function detectFirebaseImports(content) {
  const imports = [];
  
  // Check for ES6 imports
  const import { firebaseService } from '../src/atomic/organisms/firebaseService';
import\s+['"]([^'"]+)['"]/g;
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    if (importMatch[1].includes('firebase')) {
      imports.push({
        type: 'es6',
        source: importMatch[0],
        path: importMatch[1]
      });
    }
  }
  
  // Check for require statements
  const requireRegex = /(?:const|let|var)\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+=\s+require\(['"]([^'"]+)['"]\)/g;
  let requireMatch;
  while ((requireMatch = requireRegex.exec(content)) !== null) {
    if (requireMatch[1].includes('firebase')) {
      imports.push({
        type: 'require',
        source: requireMatch[0],
        path: requireMatch[1]
      });
    }
  }
  
  return imports;
}

// Helper function to detect Firebase service initialization
function detectFirebaseInitialization(content) {
  const initializations = [];
  
  // Firebase app initialization
  const appInitRegex = /firebase\.initializeApp\(.*\)|initializeApp\(.*\)/g;
  let appInitMatch;
  while ((appInitMatch = appInitRegex.exec(content)) !== null) {
    initializations.push({
      type: 'app',
      source: appInitMatch[0]
    });
  }
  
  // Firebase auth initialization
  const authInitRegex = /firebase\.auth\(\)|getAuth\(\)/g;
  let authInitMatch;
  while ((authInitMatch = authInitRegex.exec(content)) !== null) {
    initializations.push({
      type: 'auth',
      source: authInitMatch[0]
    });
  }
  
  // Firebase firestore initialization
  const firestoreInitRegex = /firebase\.firestore\(\)|getFirestore\(\)/g;
  let firestoreInitMatch;
  while ((firestoreInitMatch = firestoreInitRegex.exec(content)) !== null) {
    initializations.push({
      type: 'firestore',
      source: firestoreInitMatch[0]
    });
  }
  
  // Firebase storage initialization
  const storageInitRegex = /firebase\.storage\(\)|getStorage\(\)/g;
  let storageInitMatch;
  while ((storageInitMatch = storageInitRegex.exec(content)) !== null) {
    initializations.push({
      type: 'storage',
      source: storageInitMatch[0]
    });
  }
  
  // Firebase analytics initialization
  const analyticsInitRegex = /firebase\.analytics\(\)|getAnalytics\(\)/g;
  let analyticsInitMatch;
  while ((analyticsInitMatch = analyticsInitRegex.exec(content)) !== null) {
    initializations.push({
      type: 'analytics',
      source: analyticsInitMatch[0]
    });
  }
  
  return initializations;
}

// Helper function to detect Firebase method calls
function detectFirebaseMethods(content) {
  const methods = [];
  
  // Auth methods
  const authMethods = [
    'createUserWithEmailAndPassword',
    'signInWithEmailAndPassword',
    'signOut',
    'onAuthStateChanged',
    'updateProfile',
    'sendPasswordResetEmail',
    'verifyPasswordResetCode',
    'confirmPasswordReset',
    'signInWithPopup',
    'signInWithRedirect'
  ];
  
  // Firestore methods
  const firestoreMethods = [
    'collection',
    'doc',
    'setDoc',
    'addDoc',
    'updateDoc',
    'deleteDoc',
    'getDoc',
    'getDocs',
    'onSnapshot',
    'query',
    'where',
    'orderBy',
    'limit',
    'startAfter',
    'endBefore',
    'startAt',
    'endAt'
  ];
  
  // Storage methods
  const storageMethods = [
    'ref',
    'uploadBytes',
    'uploadBytesResumable',
    'uploadString',
    'getDownloadURL',
    'deleteObject',
    'listAll'
  ];
  
  // Analytics methods
  const analyticsMethods = [
    'logEvent',
    'setUserId',
    'setUserProperties',
    'setAnalyticsCollectionEnabled'
  ];
  
  // Check for auth methods
  authMethods.forEach(method => {
    const regex = new RegExp(`\\b${method}\\s*\\(`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      methods.push({
        type: 'auth',
        method: method,
        position: match.index
      });
    }
  });
  
  // Check for firestore methods
  firestoreMethods.forEach(method => {
    const regex = new RegExp(`\\b${method}\\s*\\(`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      methods.push({
        type: 'firestore',
        method: method,
        position: match.index
      });
    }
  });
  
  // Check for storage methods
  storageMethods.forEach(method => {
    const regex = new RegExp(`\\b${method}\\s*\\(`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      methods.push({
        type: 'storage',
        method: method,
        position: match.index
      });
    }
  });
  
  // Check for analytics methods
  analyticsMethods.forEach(method => {
    const regex = new RegExp(`\\b${method}\\s*\\(`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      methods.push({
        type: 'analytics',
        method: method,
        position: match.index
      });
    }
  });
  
  return methods;
}

// Create migration example
function createMigrationExample(filePath, content) {
  const imports = detectFirebaseImports(content);
  const initializations = detectFirebaseInitialization(content);
  const methods = detectFirebaseMethods(content);
  
  // Determine which Firebase services are used
  const services = new Set();
  initializations.forEach(init => services.add(init.type));
  methods.forEach(method => services.add(method.type));
  
  // Create example file content
  let exampleContent = `/**
 * AI Sports Edge - Firebase Migration Example
 * Original file: ${filePath}
 * Generated: ${new Date().toISOString()}
 */

`;

  // Add imports
  exampleContent += `// BEFORE: Original Firebase imports\n`;
  imports.forEach(imp => {
    exampleContent += `// ${imp.source}\n`;
  });
  
  exampleContent += `\n// AFTER: Atomic architecture imports\n`;
  if (services.has('app')) {
    exampleContent += `import { firebaseApp } from '../atomic/atoms/firebaseApp';\n`;
  }
  if (services.has('auth')) {
    exampleContent += `import { 
  signIn, 
  signUp, 
  signOut, 
  resetPassword, 
  getCurrentUser, 
  onAuthStateChange 
} from '../atomic/molecules/firebaseAuth';\n`;
  }
  if (services.has('firestore')) {
    exampleContent += `import { 
  getCollection, 
  getDocument, 
  addDocument, 
  updateDocument, 
  deleteDocument, 
  subscribeToDocument, 
  subscribeToCollection 
} from '../atomic/molecules/firebaseFirestore';\n`;
  }
  if (services.has('storage')) {
    exampleContent += `import { 
  uploadFile, 
  downloadFile, 
  deleteFile, 
  listFiles 
} from '../atomic/molecules/firebaseStorage';\n`;
  }
  if (services.has('analytics')) {
    exampleContent += `import { 
  trackEvent, 
  setUserInfo 
} from '../atomic/molecules/firebaseAnalytics';\n`;
  }
  
  // Add initialization examples
  if (initializations.length > 0) {
    exampleContent += `\n// BEFORE: Original Firebase initialization\n`;
    initializations.forEach(init => {
      exampleContent += `// ${init.source}\n`;
    });
    
    exampleContent += `\n// AFTER: Atomic architecture initialization\n`;
    exampleContent += `// Note: Firebase is already initialized in firebaseApp.js\n`;
    exampleContent += `// You don't need to initialize Firebase services in your components\n`;
  }
  
  // Add method examples
  if (methods.length > 0) {
    exampleContent += `\n// BEFORE: Original Firebase method calls\n`;
    exampleContent += `/*
${methods.map(m => `${m.type}.${m.method}(...)`).join('\n')}
*/\n`;
    
    exampleContent += `\n// AFTER: Atomic architecture method calls\n`;
    
    if (services.has('auth')) {
      exampleContent += `
// Authentication examples
const user = getCurrentUser();
const unsubscribe = onAuthStateChange((user) => {
  // Handle auth state changes
});

// Sign in
try {
  const userCredential = await signIn('user@example.com', 'password');
  // Handle successful sign in
} catch (error) {
  // Handle sign in error
}

// Sign up
try {
  const userCredential = await signUp('user@example.com', 'password');
  // Handle successful sign up
} catch (error) {
  // Handle sign up error
}

// Sign out
await signOut();

// Reset password
await resetPassword('user@example.com');
`;
    }
    
    if (services.has('firestore')) {
      exampleContent += `
// Firestore examples
// Get a document
const document = await getDocument('collection', 'documentId');

// Get a collection
const documents = await getCollection('collection');

// Add a document
const newDocId = await addDocument('collection', { field: 'value' });

// Update a document
await updateDocument('collection', 'documentId', { field: 'new value' });

// Delete a document
await deleteDocument('collection', 'documentId');

// Subscribe to a document
const unsubscribeDoc = subscribeToDocument('collection', 'documentId', (doc) => {
  // Handle document updates
});

// Subscribe to a collection
const unsubscribeColl = subscribeToCollection('collection', (docs) => {
  // Handle collection updates
});
`;
    }
    
    if (services.has('storage')) {
      exampleContent += `
// Storage examples
// Upload a file
const downloadUrl = await uploadFile('path/to/file', file);

// Download a file
const url = await downloadFile('path/to/file');

// Delete a file
await deleteFile('path/to/file');

// List files
const files = await listFiles('path/to/directory');
`;
    }
    
    if (services.has('analytics')) {
      exampleContent += `
// Analytics examples
// Track an event
trackEvent('button_click', { button_id: 'login' });

// Set user information
setUserInfo({ userId: 'user123', userRole: 'premium' });
`;
    }
  }
  
  // Add error handling example
  exampleContent += `
// Error handling with atomic architecture
try {
  // Firebase operations
} catch (error) {
  // Use the error utilities from atomic architecture
  import { parseError, getUserFriendlyMessage } from '../atomic/molecules/errorTracking';
  
  const parsedError = parseError(error);
  const userMessage = getUserFriendlyMessage(error);
  
  console.error('Operation failed:', parsedError);
  // Show userMessage to the user
}
`;

  return exampleContent;
}

// Create output directory if it doesn't exist
const outputDir = 'status/migration-examples';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate example file name
const fileName = path.basename(filePath);
const examplePath = path.join(outputDir, `${fileName}.example.js`);

// Create migration example
const exampleContent = createMigrationExample(filePath, fileContent);
fs.writeFileSync(examplePath, exampleContent);

console.log(`Migration example created: ${examplePath}`);

// Update migration tracker
try {
  const { execSync } = require('child_process');
  execSync(`./scripts/firebase-migration-tracker.sh add-note "${filePath}" "Migration example created at ${examplePath}"`);
  console.log(`Migration tracker updated with note.`);
} catch (error) {
  console.warn(`Warning: Could not update migration tracker: ${error.message}`);
}