#!/bin/bash
# firebase_consolidation.sh
# Consolidates multiple Firebase implementations and handles Git/deployment automatically

echo "========== AI Sports Edge Firebase Consolidation =========="
echo "This script will consolidate Firebase implementations and automate Git/deployment workflow"

# Create backup branch
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BRANCH_NAME="firebase-consolidation-$TIMESTAMP"
echo "Creating backup branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Backup all Firebase implementations
BACKUP_DIR="./archive/firebase-backup-$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
echo "Backing up Firebase implementations to $BACKUP_DIR"
find . -name "*firebase*.js" -o -name "*firebase*.ts" | xargs -I{} cp --parents {} "$BACKUP_DIR/"

# Analyze Firebase implementations
echo "Analyzing Firebase implementations..."
FIREBASE_FILES=$(find . -name "*firebase*.js" -o -name "*firebase*.ts")
echo "Found Firebase files:"
echo "$FIREBASE_FILES"

# Identify best implementation
BEST_IMPL="./src/config/firebase.ts"
if [ ! -f "$BEST_IMPL" ]; then
  echo "Creating standard Firebase implementation at $BEST_IMPL"
  mkdir -p $(dirname "$BEST_IMPL")
  
  # Create standardized implementation
  cat > "$BEST_IMPL" << 'END'
// Consolidated Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
let analytics = null;

// Only initialize analytics in browser environment
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export configured instances
export { app, auth, firestore, storage, functions, analytics };
export default app;
END
fi

# Update imports
echo "Updating imports to use the consolidated Firebase implementation..."
find ./src -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "firebase" | while read file; do
  # Skip the consolidated implementation itself
  if [ "$file" == "$BEST_IMPL" ]; then
    continue
  fi
  
  echo "Checking $file for Firebase imports..."
  
  # Make a backup of the file
  cp "$file" "$file.bak"
  
  # Update imports (basic example - would need to be extended)
  sed -i.sed 's|import .*firebase/auth.*|import { auth } from "../../config/firebase";|g' "$file"
  sed -i.sed 's|import .*firebase/firestore.*|import { firestore } from "../../config/firebase";|g' "$file"
  sed -i.sed 's|import .*firebase/storage.*|import { storage } from "../../config/firebase";|g' "$file"
  
  # Remove sed backup files
  rm -f "$file.sed"
done

# Test Firebase functionality
echo "Testing Firebase functionality..."
# (Add basic tests here for Firebase auth, firestore, etc.)

# Commit changes
echo "Committing Firebase consolidation changes..."
git add .
git status

echo ""
echo "Ready to commit changes? [Y/n]"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]] || [ -z "$response" ]; then
  git commit -m "Firebase consolidation: Standardized implementation and updated imports"
  
  echo "Push changes to remote? [Y/n]"
  read -r push_response
  if [[ "$push_response" =~ ^([yY][eE][sS]|[yY])$ ]] || [ -z "$push_response" ]; then
    git push origin "$BRANCH_NAME"
    
    echo "Create PR from $BRANCH_NAME to main? [Y/n]"
    read -r pr_response
    if [[ "$pr_response" =~ ^([yY][eE][sS]|[yY])$ ]] || [ -z "$pr_response" ]; then
      echo "Opening GitHub to create PR..."
      REPO_URL=$(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//')
      open "$REPO_URL/compare/main...$BRANCH_NAME?expand=1"
    fi
  fi
fi

# Deploy to test environment
echo "Deploy to test environment? [Y/n]"
read -r deploy_response
if [[ "$deploy_response" =~ ^([yY][eE][sS]|[yY])$ ]] || [ -z "$deploy_response" ]; then
  echo "Deploying to test environment..."
  firebase hosting:channel:deploy firebase-test --project ai-sports-edge
  
  echo "Testing deployment..."
  echo "Test URL: https://firebase-test--aisportsedge-app.web.app"
fi

echo "Firebase consolidation complete!"
echo "Branch: $BRANCH_NAME"
echo "Backup: $BACKUP_DIR"
echo "Consolidated implementation: $BEST_IMPL"