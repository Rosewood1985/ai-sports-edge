/**
 * AI Sports Edge - Firebase Migration Analyzer
 * 
 * This script analyzes JavaScript files to determine how they should be
 * migrated to use the consolidated Firebase services.
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let filePath = null;
let analyzeMode = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--analyze') {
    analyzeMode = true;
  } else if (!filePath) {
    filePath = args[i];
  }
}

if (!filePath) {
  console.error('Error: File path is required.');
  console.log('Usage: node migrate-to-firebase-service.js [--analyze] <file_path>');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: File '${filePath}' does not exist.`);
  process.exit(1);
}

// Read file content
const fileContent = fs.readFileSync(filePath, 'utf8');

// Firebase service patterns to look for
const firebasePatterns = {
  auth: [
    /firebase\.auth\(\)/,
    /getAuth\(\)/,
    /createUserWithEmailAndPassword/,
    /signInWithEmailAndPassword/,
    /signOut/,
    /onAuthStateChanged/,
    /currentUser/,
    /updateProfile/,
    /sendPasswordResetEmail/,
    /verifyPasswordResetCode/,
    /confirmPasswordReset/,
    /GoogleAuthProvider/,
    /FacebookAuthProvider/,
    /TwitterAuthProvider/,
    /GithubAuthProvider/,
    /signInWithPopup/,
    /signInWithRedirect/
  ],
  firestore: [
    /firebase\.firestore\(\)/,
    /getFirestore\(\)/,
    /collection\(/,
    /doc\(/,
    /setDoc\(/,
    /addDoc\(/,
    /updateDoc\(/,
    /deleteDoc\(/,
    /getDoc\(/,
    /getDocs\(/,
    /onSnapshot\(/,
    /query\(/,
    /where\(/,
    /orderBy\(/,
    /limit\(/,
    /startAfter\(/,
    /endBefore\(/,
    /startAt\(/,
    /endAt\(/
  ],
  storage: [
    /firebase\.storage\(\)/,
    /getStorage\(\)/,
    /ref\(/,
    /uploadBytes\(/,
    /uploadBytesResumable\(/,
    /uploadString\(/,
    /getDownloadURL\(/,
    /deleteObject\(/,
    /listAll\(/
  ],
  analytics: [
    /firebase\.analytics\(\)/,
    /getAnalytics\(\)/,
    /logEvent\(/,
    /setUserId\(/,
    /setUserProperties\(/,
    /setAnalyticsCollectionEnabled\(/
  ],
  config: [
    /firebase\.initializeApp\(/,
    /initializeApp\(/,
    /firebase\.app\(\)/,
    /getApp\(\)/,
    /firebase\.apps/,
    /getApps\(\)/
  ]
};

// Analyze file for Firebase usage
function analyzeFile(content) {
  const results = {
    services: {},
    imports: [],
    dependencies: [],
    migrationComplexity: 'low',
    recommendations: []
  };
  
  // Check for each Firebase service
  for (const [service, patterns] of Object.entries(firebasePatterns)) {
    const matches = patterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    if (matches > 0) {
      results.services[service] = {
        used: true,
        matchCount: matches
      };
    }
  }
  
  // Check for imports
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    results.imports.push(importMatch[1]);
  }
  
  // Check for require statements
  const requireRegex = /(?:const|let|var)\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+=\s+require\(['"]([^'"]+)['"]\)/g;
  let requireMatch;
  while ((requireMatch = requireRegex.exec(content)) !== null) {
    results.imports.push(requireMatch[1]);
  }
  
  // Filter for Firebase-related imports
  results.dependencies = results.imports.filter(imp => 
    imp.includes('firebase') || 
    imp.includes('firestore') || 
    imp.includes('auth') ||
    imp.includes('storage') ||
    imp.includes('analytics')
  );
  
  // Determine migration complexity
  const serviceCount = Object.keys(results.services).length;
  const firebaseDependencies = results.dependencies.length;
  
  if (serviceCount > 2 || firebaseDependencies > 3) {
    results.migrationComplexity = 'high';
    results.recommendations.push('This file uses multiple Firebase services and has complex dependencies.');
    results.recommendations.push('Consider breaking it down into smaller, focused components before migration.');
  } else if (serviceCount > 1 || firebaseDependencies > 1) {
    results.migrationComplexity = 'medium';
    results.recommendations.push('This file uses multiple Firebase services or dependencies.');
    results.recommendations.push('Carefully review all Firebase interactions during migration.');
  } else {
    results.recommendations.push('This file has simple Firebase usage and should be straightforward to migrate.');
  }
  
  // Add specific recommendations based on services used
  if (results.services.auth) {
    results.recommendations.push('Use the consolidated firebaseAuth.js from atomic/molecules.');
  }
  
  if (results.services.firestore) {
    results.recommendations.push('Use the consolidated firebaseFirestore.js from atomic/molecules.');
  }
  
  if (results.services.storage) {
    results.recommendations.push('Use the consolidated firebaseStorage.js from atomic/molecules.');
  }
  
  if (results.services.analytics) {
    results.recommendations.push('Use the consolidated firebaseAnalytics.js from atomic/molecules.');
  }
  
  if (results.services.config) {
    results.recommendations.push('Use the consolidated firebaseApp.js from atomic/atoms.');
  }
  
  return results;
}

// Generate migration plan
function generateMigrationPlan(filePath, analysis) {
  const fileName = path.basename(filePath);
  const servicesList = Object.keys(analysis.services).join(', ');
  
  let plan = `# Migration Plan for ${fileName}\n\n`;
  plan += `## Overview\n\n`;
  plan += `- **File**: ${filePath}\n`;
  plan += `- **Firebase Services Used**: ${servicesList || 'None detected'}\n`;
  plan += `- **Migration Complexity**: ${analysis.migrationComplexity}\n\n`;
  
  plan += `## Current Firebase Dependencies\n\n`;
  if (analysis.dependencies.length > 0) {
    analysis.dependencies.forEach(dep => {
      plan += `- ${dep}\n`;
    });
  } else {
    plan += `No direct Firebase dependencies detected.\n`;
  }
  
  plan += `\n## Recommendations\n\n`;
  analysis.recommendations.forEach(rec => {
    plan += `- ${rec}\n`;
  });
  
  plan += `\n## Migration Steps\n\n`;
  plan += `1. Create a backup of the original file\n`;
  plan += `2. Update imports to use atomic architecture components:\n`;
  
  if (analysis.services.auth) {
    plan += `   - Replace Firebase Auth imports with: \`import { ... } from '../atomic/molecules/firebaseAuth';\`\n`;
  }
  
  if (analysis.services.firestore) {
    plan += `   - Replace Firestore imports with: \`import { ... } from '../atomic/molecules/firebaseFirestore';\`\n`;
  }
  
  if (analysis.services.storage) {
    plan += `   - Replace Storage imports with: \`import { ... } from '../atomic/molecules/firebaseStorage';\`\n`;
  }
  
  if (analysis.services.analytics) {
    plan += `   - Replace Analytics imports with: \`import { ... } from '../atomic/molecules/firebaseAnalytics';\`\n`;
  }
  
  if (analysis.services.config) {
    plan += `   - Replace Firebase App imports with: \`import { ... } from '../atomic/atoms/firebaseApp';\`\n`;
  }
  
  plan += `3. Update Firebase service initialization code\n`;
  plan += `4. Replace direct Firebase method calls with atomic architecture equivalents\n`;
  plan += `5. Update any Firebase-specific error handling\n`;
  plan += `6. Run tests to verify functionality\n`;
  plan += `7. Mark as migrated using: \`./scripts/firebase-migration-tracker.sh mark-migrated ${filePath}\`\n`;
  
  return plan;
}

// Main execution
if (analyzeMode) {
  console.log(`Analyzing file: ${filePath}`);
  const analysis = analyzeFile(fileContent);
  
  console.log('\nAnalysis Results:');
  console.log('=================');
  console.log(`Firebase Services Used: ${Object.keys(analysis.services).join(', ') || 'None detected'}`);
  console.log(`Migration Complexity: ${analysis.migrationComplexity}`);
  
  console.log('\nFirebase Dependencies:');
  if (analysis.dependencies.length > 0) {
    analysis.dependencies.forEach(dep => {
      console.log(`- ${dep}`);
    });
  } else {
    console.log('No direct Firebase dependencies detected.');
  }
  
  console.log('\nRecommendations:');
  analysis.recommendations.forEach(rec => {
    console.log(`- ${rec}`);
  });
  
  // Generate migration plan file
  const planDir = 'status/migration-plans';
  if (!fs.existsSync(planDir)) {
    fs.mkdirSync(planDir, { recursive: true });
  }
  
  const planFileName = path.basename(filePath, path.extname(filePath)) + '-migration-plan.md';
  const planPath = path.join(planDir, planFileName);
  
  const plan = generateMigrationPlan(filePath, analysis);
  fs.writeFileSync(planPath, plan);
  
  console.log(`\nMigration plan generated: ${planPath}`);
} else {
  // TODO: Implement automatic migration
  console.log('Automatic migration not yet implemented. Use --analyze flag to generate a migration plan.');
}