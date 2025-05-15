/**
 * AI Sports Edge - Migrate Firebase File
 * 
 * This script automatically migrates a JavaScript file to use
 * the consolidated Firebase services in the atomic architecture.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
let filePath = null;

if (args.length > 0) {
  filePath = args[0];
} else {
  console.error('Error: File path is required.');
  console.log('Usage: node migrate-firebase-file.js <file_path>');
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

// Migrate Firebase imports
function migrateImports(content, imports) {
  let updatedContent = content;
  const atomicImports = [];
  
  // Determine which Firebase services are used
  const services = new Set();
  imports.forEach(imp => {
    if (imp.path.includes('firebase/auth')) services.add('auth');
    if (imp.path.includes('firebase/firestore')) services.add('firestore');
    if (imp.path.includes('firebase/storage')) services.add('storage');
    if (imp.path.includes('firebase/analytics')) services.add('analytics');
    if (imp.path.includes('firebase/app')) services.add('app');
    if (imp.path === 'firebase' || imp.path === 'firebase/app') services.add('app');
  });
  
  // Remove old imports
  imports.forEach(imp => {
    updatedContent = updatedContent.replace(imp.source, '// Migrated: ' + imp.source);
  });
  
  // Add new imports
  if (services.has('app')) {
    atomicImports.push(`import { firebaseApp } from '../atomic/atoms/firebaseApp';`);
  }
  
  if (services.has('auth')) {
    atomicImports.push(`import { 
  signIn, 
  signUp, 
  signOut, 
  resetPassword, 
  getCurrentUser, 
  onAuthStateChange 
} from '../atomic/molecules/firebaseAuth';`);
  }
  
  if (services.has('firestore')) {
    atomicImports.push(`import { 
  getCollection, 
  getDocument, 
  addDocument, 
  updateDocument, 
  deleteDocument, 
  subscribeToDocument, 
  subscribeToCollection 
} from '../atomic/molecules/firebaseFirestore';`);
  }
  
  if (services.has('storage')) {
    atomicImports.push(`import { 
  uploadFile, 
  downloadFile, 
  deleteFile, 
  listFiles 
} from '../atomic/molecules/firebaseStorage';`);
  }
  
  if (services.has('analytics')) {
    atomicImports.push(`import { 
  trackEvent, 
  setUserInfo 
} from '../atomic/molecules/firebaseAnalytics';`);
  }
  
  // Add imports at the top of the file
  if (atomicImports.length > 0) {
    // Find the position after the last import
    const lastImportRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"][^'"]+['"];?/g;
    let lastImportMatch;
    let lastImportPosition = 0;
    
    while ((lastImportMatch = lastImportRegex.exec(content)) !== null) {
      lastImportPosition = lastImportMatch.index + lastImportMatch[0].length;
    }
    
    if (lastImportPosition > 0) {
      // Insert after the last import
      updatedContent = 
        updatedContent.substring(0, lastImportPosition) + 
        '\n\n// Atomic architecture imports\n' + 
        atomicImports.join('\n') + 
        '\n' + 
        updatedContent.substring(lastImportPosition);
    } else {
      // No imports found, add at the top
      updatedContent = 
        '// Atomic architecture imports\n' + 
        atomicImports.join('\n') + 
        '\n\n' + 
        updatedContent;
    }
  }
  
  return updatedContent;
}

// Migrate Firebase initializations
function migrateInitializations(content, initializations) {
  let updatedContent = content;
  
  initializations.forEach(init => {
    updatedContent = updatedContent.replace(
      init.source, 
      `// Migrated: ${init.source} - Firebase is already initialized in firebaseApp.js`
    );
  });
  
  return updatedContent;
}

// Migrate Firebase method calls
function migrateMethods(content) {
  let updatedContent = content;
  
  // Auth methods
  updatedContent = updatedContent
    .replace(/createUserWithEmailAndPassword\s*\(\s*auth\s*,/g, 'signUp(')
    .replace(/signInWithEmailAndPassword\s*\(\s*auth\s*,/g, 'signIn(')
    .replace(/signOut\s*\(\s*auth\s*\)/g, 'signOut()')
    .replace(/onAuthStateChanged\s*\(\s*auth\s*,/g, 'onAuthStateChange(')
    .replace(/sendPasswordResetEmail\s*\(\s*auth\s*,/g, 'resetPassword(')
    .replace(/auth\.currentUser/g, 'getCurrentUser()');
  
  // Firestore methods
  updatedContent = updatedContent
    .replace(/collection\s*\(\s*db\s*,\s*["']([^"']+)["']\s*\)/g, "getCollection('$1')")
    .replace(/doc\s*\(\s*db\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g, "getDocument('$1', '$2')")
    .replace(/setDoc\s*\(\s*doc\s*\(\s*db\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)\s*,/g, "updateDocument('$1', '$2',")
    .replace(/addDoc\s*\(\s*collection\s*\(\s*db\s*,\s*["']([^"']+)["']\s*\)\s*,/g, "addDocument('$1',")
    .replace(/updateDoc\s*\(\s*doc\s*\(\s*db\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)\s*,/g, "updateDocument('$1', '$2',")
    .replace(/deleteDoc\s*\(\s*doc\s*\(\s*db\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)\s*\)/g, "deleteDocument('$1', '$2')")
    .replace(/getDoc\s*\(\s*doc\s*\(\s*db\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)\s*\)/g, "getDocument('$1', '$2')")
    .replace(/getDocs\s*\(\s*collection\s*\(\s*db\s*,\s*["']([^"']+)["']\s*\)\s*\)/g, "getCollection('$1')")
    .replace(/onSnapshot\s*\(\s*doc\s*\(\s*db\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)\s*,/g, "subscribeToDocument('$1', '$2',")
    .replace(/onSnapshot\s*\(\s*collection\s*\(\s*db\s*,\s*["']([^"']+)["']\s*\)\s*,/g, "subscribeToCollection('$1',");
  
  // Storage methods
  updatedContent = updatedContent
    .replace(/uploadBytes\s*\(\s*ref\s*\(\s*storage\s*,\s*["']([^"']+)["']\s*\)\s*,/g, "uploadFile('$1',")
    .replace(/uploadBytesResumable\s*\(\s*ref\s*\(\s*storage\s*,\s*["']([^"']+)["']\s*\)\s*,/g, "uploadFile('$1',")
    .replace(/getDownloadURL\s*\(\s*ref\s*\(\s*storage\s*,\s*["']([^"']+)["']\s*\)\s*\)/g, "downloadFile('$1')")
    .replace(/deleteObject\s*\(\s*ref\s*\(\s*storage\s*,\s*["']([^"']+)["']\s*\)\s*\)/g, "deleteFile('$1')")
    .replace(/listAll\s*\(\s*ref\s*\(\s*storage\s*,\s*["']([^"']+)["']\s*\)\s*\)/g, "listFiles('$1')");
  
  // Analytics methods
  updatedContent = updatedContent
    .replace(/logEvent\s*\(\s*analytics\s*,\s*["']([^"']+)["']\s*,/g, "trackEvent('$1',")
    .replace(/setUserId\s*\(\s*analytics\s*,/g, "setUserInfo({ userId:")
    .replace(/setUserProperties\s*\(\s*analytics\s*,/g, "setUserInfo(");
  
  return updatedContent;
}

// Main migration function
function migrateFile(filePath, content) {
  const imports = detectFirebaseImports(content);
  const initializations = detectFirebaseInitialization(content);
  
  // Skip if no Firebase usage detected
  if (imports.length === 0 && initializations.length === 0) {
    console.log(`No Firebase usage detected in ${filePath}. Skipping migration.`);
    return null;
  }
  
  console.log(`Migrating ${filePath}...`);
  
  // Backup original file
  const backupDir = 'status/migration-backups';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupPath = path.join(backupDir, `${path.basename(filePath)}.bak`);
  fs.writeFileSync(backupPath, content);
  console.log(`Backup created: ${backupPath}`);
  
  // Migrate imports
  let updatedContent = migrateImports(content, imports);
  
  // Migrate initializations
  updatedContent = migrateInitializations(updatedContent, initializations);
  
  // Migrate method calls
  updatedContent = migrateMethods(updatedContent);
  
  // Add migration comment at the top
  updatedContent = 
    `/**
 * Migrated to use atomic architecture Firebase services
 * Original file backed up to: ${backupPath}
 * Migration date: ${new Date().toISOString()}
 */\n\n` + 
    updatedContent;
  
  return updatedContent;
}

// Perform the migration
const migratedContent = migrateFile(filePath, fileContent);

if (migratedContent) {
  // Write the migrated file
  fs.writeFileSync(filePath, migratedContent);
  console.log(`File migrated successfully: ${filePath}`);
  
  // Update migration tracker
  try {
    execSync(`./scripts/firebase-migration-tracker.sh mark-migrated "${filePath}"`);
    console.log(`Migration tracker updated.`);
  } catch (error) {
    console.warn(`Warning: Could not update migration tracker: ${error.message}`);
  }
  
  // Run tests if available
  try {
    execSync(`./scripts/test-migrated-files.sh run-file "${filePath}"`);
  } catch (error) {
    console.warn(`Warning: Tests failed for ${filePath}: ${error.message}`);
    console.log(`You may need to manually fix the migrated file.`);
  }
} else {
  console.log(`No changes made to ${filePath}.`);
}