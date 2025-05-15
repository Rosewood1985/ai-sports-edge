/**
 * Firebase Scanner for AI Sports Edge
 * 
 * Scans files for Firebase usage and dependencies.
 * Used by the QA Coverage Analyzer to identify Firebase components.
 */

const fs = require('fs');
const path = require('path');

// Firebase import patterns to look for
const FIREBASE_IMPORT_PATTERNS = [
  // Firebase App
  /import { firebaseService } from '../src/atomic/organisms/firebaseService';
import\s+['"]firebase\/app['"]/,
  /import\s+.*from\s+['"]@firebase\/app['"]/,
  /import\s+.*from\s+['"]firebase['"]/,
  
  // Firebase Auth
  /import\s+.*from\s+['"]firebase\/auth['"]/,
  /import\s+.*from\s+['"]@firebase\/auth['"]/,
  
  // Firebase Firestore
  /import\s+.*from\s+['"]firebase\/firestore['"]/,
  /import\s+.*from\s+['"]@firebase\/firestore['"]/,
  
  // Firebase Storage
  /import\s+.*from\s+['"]firebase\/storage['"]/,
  /import\s+.*from\s+['"]@firebase\/storage['"]/,
  
  // Firebase Functions
  /import\s+.*from\s+['"]firebase\/functions['"]/,
  /import\s+.*from\s+['"]@firebase\/functions['"]/,
  
  // Firebase Messaging
  /import\s+.*from\s+['"]firebase\/messaging['"]/,
  /import\s+.*from\s+['"]@firebase\/messaging['"]/,
  
  // Firebase Analytics
  /import\s+.*from\s+['"]firebase\/analytics['"]/,
  /import\s+.*from\s+['"]@firebase\/analytics['"]/,
  
  // Firebase Performance
  /import\s+.*from\s+['"]firebase\/performance['"]/,
  /import\s+.*from\s+['"]@firebase\/performance['"]/,
  
  // Firebase Remote Config
  /import\s+.*from\s+['"]firebase\/remote-config['"]/,
  /import\s+.*from\s+['"]@firebase\/remote-config['"]/,
  
  // Local Firebase imports
  /import\s+.*from\s+['"](\.\.\/)+firebase['"]/,
  /import\s+.*from\s+['"]\.\/firebase['"]/,
  /import\s+.*from\s+['"](\.\.\/)+config\/firebase['"]/,
  /import\s+.*from\s+['"]\.\/config\/firebase['"]/,
  /import\s+.*from\s+['"](\.\.\/)+firebase\/.*['"]/,
  /import\s+.*from\s+['"]\.\/firebase\/.*['"]/
];

// Firebase usage patterns to look for
const FIREBASE_USAGE_PATTERNS = [
  // Firebase initialization
  /firebase\.initializeApp/,
  /initializeApp/,
  
  // Firebase Auth
  /firebase\.auth/,
  /getAuth/,
  /signInWithEmailAndPassword/,
  /createUserWithEmailAndPassword/,
  /signOut/,
  /onAuthStateChanged/,
  
  // Firebase Firestore
  /firebase\.firestore/,
  /getFirestore/,
  /collection/,
  /doc/,
  /getDoc/,
  /getDocs/,
  /setDoc/,
  /updateDoc/,
  /deleteDoc/,
  /onSnapshot/,
  /query/,
  /where/,
  /orderBy/,
  /limit/,
  
  // Firebase Storage
  /firebase\.storage/,
  /getStorage/,
  /ref/,
  /uploadBytes/,
  /getDownloadURL/,
  
  // Firebase Functions
  /firebase\.functions/,
  /getFunctions/,
  /httpsCallable/,
  
  // Firebase Messaging
  /firebase\.messaging/,
  /getMessaging/,
  /getToken/,
  /onMessage/,
  
  // Firebase Analytics
  /firebase\.analytics/,
  /getAnalytics/,
  /logEvent/,
  
  // Firebase Performance
  /firebase\.performance/,
  /getPerformance/,
  /trace/,
  
  // Firebase Remote Config
  /firebase\.remoteConfig/,
  /getRemoteConfig/,
  /fetchAndActivate/
];

/**
 * Check if a file has Firebase imports
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if the file has Firebase imports
 */
function hasFirebaseImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    for (const pattern of FIREBASE_IMPORT_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking Firebase imports in ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Check if a file has Firebase usage
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if the file has Firebase usage
 */
function hasFirebaseUsage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // First check for imports
    if (hasFirebaseImports(filePath)) {
      return true;
    }
    
    // Then check for usage patterns
    for (const pattern of FIREBASE_USAGE_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking Firebase usage in ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Get Firebase services used in a file
 * @param {string} filePath - Path to the file
 * @returns {Array} Array of Firebase services used in the file
 */
function getFirebaseServices(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const services = [];
    
    // Check for Auth
    if (/firebase\.auth|getAuth|signIn|createUser|signOut|onAuthStateChanged/.test(content)) {
      services.push('auth');
    }
    
    // Check for Firestore
    if (/firebase\.firestore|getFirestore|collection|doc|getDoc|getDocs|setDoc|updateDoc|deleteDoc|onSnapshot|query|where|orderBy|limit/.test(content)) {
      services.push('firestore');
    }
    
    // Check for Storage
    if (/firebase\.storage|getStorage|ref|uploadBytes|getDownloadURL/.test(content)) {
      services.push('storage');
    }
    
    // Check for Functions
    if (/firebase\.functions|getFunctions|httpsCallable/.test(content)) {
      services.push('functions');
    }
    
    // Check for Messaging
    if (/firebase\.messaging|getMessaging|getToken|onMessage/.test(content)) {
      services.push('messaging');
    }
    
    // Check for Analytics
    if (/firebase\.analytics|getAnalytics|logEvent/.test(content)) {
      services.push('analytics');
    }
    
    // Check for Performance
    if (/firebase\.performance|getPerformance|trace/.test(content)) {
      services.push('performance');
    }
    
    // Check for Remote Config
    if (/firebase\.remoteConfig|getRemoteConfig|fetchAndActivate/.test(content)) {
      services.push('remote-config');
    }
    
    return services;
  } catch (error) {
    console.error(`Error getting Firebase services in ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Analyze Firebase usage in a file
 * @param {string} filePath - Path to the file
 * @returns {Object} Object with Firebase usage information
 */
function analyzeFirebaseUsage(filePath) {
  try {
    const hasFirebase = hasFirebaseUsage(filePath);
    const services = hasFirebase ? getFirebaseServices(filePath) : [];
    
    return {
      file: filePath,
      hasFirebase,
      services,
      serviceCount: services.length
    };
  } catch (error) {
    console.error(`Error analyzing Firebase usage in ${filePath}:`, error.message);
    return {
      file: filePath,
      hasFirebase: false,
      services: [],
      serviceCount: 0,
      error: error.message
    };
  }
}

module.exports = {
  hasFirebaseImports,
  hasFirebaseUsage,
  getFirebaseServices,
  analyzeFirebaseUsage
};