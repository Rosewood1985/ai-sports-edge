#!/bin/bash

# Script to deploy Database Consistency Triggers
# This script deploys the three Firebase Cloud Functions that maintain consistency
# between duplicated fields in the database
# It supports both interactive login and service account key authentication

set -e  # Exit on error

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default service account key path
SERVICE_ACCOUNT_KEY="./firebase-config/service-account.json"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-database-consistency-triggers_${TIMESTAMP}.log"

# Function to log messages
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    log "${GREEN}✓ $1 completed successfully${NC}"
  else
    log "${RED}✗ $1 failed${NC}"
    exit 1
  fi
}

# Function to display usage information
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo "  -k, --key FILE    Path to service account key file (default: $SERVICE_ACCOUNT_KEY)"
  echo "  -h, --help        Display this help message"
  exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -k|--key)
      SERVICE_ACCOUNT_KEY="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

log "${BLUE}=========================================${NC}"
log "${BLUE}AI Sports Edge Database Consistency Triggers Deployment${NC}"
log "${BLUE}=========================================${NC}"

# Step 1: Check if Firebase CLI is installed
log "\n${YELLOW}Step 1: Checking Firebase CLI...${NC}"
if ! command -v firebase &> /dev/null; then
  log "${RED}Firebase CLI not found. Please install it with 'npm install -g firebase-tools'${NC}"
  exit 1
fi
check_status "Firebase CLI check"

# Step 2: Check for service account key or Firebase authentication
log "\n${YELLOW}Step 2: Setting up Firebase authentication...${NC}"

# Check if service account key exists
if [ -f "$SERVICE_ACCOUNT_KEY" ]; then
  log "${GREEN}Using service account key: $SERVICE_ACCOUNT_KEY${NC}"
  
  # Export service account key path for Firebase CLI
  export GOOGLE_APPLICATION_CREDENTIALS="$SERVICE_ACCOUNT_KEY"
  
  # Verify we can access Firebase with the service account
  PROJECT_ID=$(node -e "const key = require('$SERVICE_ACCOUNT_KEY'); console.log(key.project_id);" 2>/dev/null)
  
  if [ -z "$PROJECT_ID" ]; then
    log "${RED}Invalid service account key file. Please check the file and try again.${NC}"
    exit 1
  fi
  
  log "${GREEN}Authenticated with service account for project: $PROJECT_ID${NC}"
else
  log "${YELLOW}Service account key not found at: $SERVICE_ACCOUNT_KEY${NC}"
  log "${YELLOW}Falling back to Firebase CLI authentication...${NC}"
  
  # Check if already authenticated
  FIREBASE_AUTH_STATUS=$(firebase projects:list 2>&1 || echo "Not authenticated")
  if [[ $FIREBASE_AUTH_STATUS == *"Not authenticated"* ]] || [[ $FIREBASE_AUTH_STATUS == *"Failed to authenticate"* ]]; then
    log "${RED}You are not authenticated with Firebase.${NC}"
    log "${YELLOW}Please run the following command to authenticate:${NC}"
    log "firebase login"
    log "${YELLOW}Or provide a service account key file with the --key option.${NC}"
    exit 1
  fi
  
  log "${GREEN}Already authenticated with Firebase CLI${NC}"
fi
check_status "Firebase authentication"

# Step 3: Verify project selection
log "\n${YELLOW}Step 3: Verifying project selection...${NC}"
CURRENT_PROJECT=$(firebase use 2>&1 | grep "Active project" || echo "No active project")
if [[ $CURRENT_PROJECT != *"ai-sports-edge"* ]]; then
  log "${YELLOW}Setting active project to ai-sports-edge...${NC}"
  firebase use ai-sports-edge
  check_status "Project selection"
else
  log "${GREEN}Project ai-sports-edge is already selected.${NC}"
fi

# Step 4: Build the functions
log "\n${YELLOW}Step 4: Building Firebase Functions...${NC}"
cd functions
npm run build
cd ..
check_status "Building functions"

# Step 5: Deploy the specific functions
log "\n${YELLOW}Step 5: Deploying Database Consistency Triggers...${NC}"
firebase deploy --only functions:syncSubscriptionStatus,functions:syncCustomerId,functions:standardizeStatusSpelling
check_status "Deploying functions"

# Step 6: Verify deployment
log "\n${YELLOW}Step 6: Verifying deployment...${NC}"
FUNCTIONS_LIST=$(firebase functions:list 2>&1)
if [[ $FUNCTIONS_LIST == *"syncSubscriptionStatus"* ]] && [[ $FUNCTIONS_LIST == *"syncCustomerId"* ]] && [[ $FUNCTIONS_LIST == *"standardizeStatusSpelling"* ]]; then
  log "${GREEN}All database consistency triggers are deployed and active.${NC}"
else
  log "${YELLOW}Warning: Not all functions appear to be active. Please check the Firebase console.${NC}"
fi

log "\n${GREEN}===== Deployment Complete =====${NC}"
log "${GREEN}Database Consistency Triggers have been deployed successfully!${NC}"
log "${YELLOW}Next Steps:${NC}"
log "1. Test subscription status synchronization"
log "2. Test customer ID synchronization"
log "3. Test status spelling standardization"
log "4. Monitor Firebase function logs for errors"

# Create a test script to help with verification
cat > test-triggers.js << 'EOL'
/**
 * Test Script for Database Consistency Triggers
 *
 * This script creates test data to verify the deployed triggers.
 * Run this script with: node test-triggers.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with your project credentials
try {
  // Check if service account key is provided as an environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Initialized Firebase Admin with service account key');
  } else {
    // Fall back to default credentials (Firebase CLI authentication)
    admin.initializeApp();
    console.log('Initialized Firebase Admin with default credentials');
  }
} catch (e) {
  console.log('Firebase admin already initialized or error:', e.message);
}

const db = admin.firestore();

// Test user ID - using timestamp to ensure uniqueness
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_SUBSCRIPTION_ID = 'test-subscription-' + Date.now();

/**
 * Creates test data in Firestore
 */
async function setupTestData() {
  console.log('\n=== Setting up test data ===');

  // Create test user
  await db.collection('users').doc(TEST_USER_ID).set({
    email: 'test@example.com',
    stripeCustomerId: 'cus_old_id',
    subscriptionStatus: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create test subscription
  await db
    .collection('users')
    .doc(TEST_USER_ID)
    .collection('subscriptions')
    .doc(TEST_SUBSCRIPTION_ID)
    .set({
      id: TEST_SUBSCRIPTION_ID,
      status: 'active',
      customerId: 'cus_old_id',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  console.log(`Created test user: ${TEST_USER_ID}`);
  console.log(`Created test subscription: ${TEST_SUBSCRIPTION_ID}`);
  
  return { userId: TEST_USER_ID, subscriptionId: TEST_SUBSCRIPTION_ID };
}

/**
 * Test syncSubscriptionStatus trigger
 */
async function testSyncSubscriptionStatus(userId, subscriptionId) {
  console.log('\n=== Testing syncSubscriptionStatus trigger ===');

  // Update subscription status
  const subscriptionRef = db
    .collection('users')
    .doc(userId)
    .collection('subscriptions')
    .doc(subscriptionId);

  // Before state
  const userBefore = await db.collection('users').doc(userId).get();
  console.log('User before:', userBefore.data().subscriptionStatus);

  // Update subscription to "canceled"
  await subscriptionRef.update({
    status: 'canceled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Updated subscription status to "canceled"');
  
  // Wait for the trigger to execute
  console.log('Waiting for trigger to execute...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Verify the user document was updated
  const userAfter = await db.collection('users').doc(userId).get();
  console.log('User after:', userAfter.data().subscriptionStatus);

  if (userAfter.data().subscriptionStatus === 'cancelled') {
    console.log('✅ syncSubscriptionStatus trigger PASSED');
  } else {
    console.log('❌ syncSubscriptionStatus trigger FAILED');
  }
}

/**
 * Test syncCustomerId trigger
 */
async function testSyncCustomerId(userId, subscriptionId) {
  console.log('\n=== Testing syncCustomerId trigger ===');

  const userRef = db.collection('users').doc(userId);

  // Before state
  const subBefore = await db
    .collection('users')
    .doc(userId)
    .collection('subscriptions')
    .doc(subscriptionId)
    .get();
  console.log('Subscription before:', subBefore.data().customerId);

  // Update user's customer ID
  await userRef.update({
    stripeCustomerId: 'cus_new_id',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Updated user stripeCustomerId to "cus_new_id"');
  
  // Wait for the trigger to execute
  console.log('Waiting for trigger to execute...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Verify the subscription document was updated
  const subAfter = await db
    .collection('users')
    .doc(userId)
    .collection('subscriptions')
    .doc(subscriptionId)
    .get();
  console.log('Subscription after:', subAfter.data().customerId);

  if (subAfter.data().customerId === 'cus_new_id') {
    console.log('✅ syncCustomerId trigger PASSED');
  } else {
    console.log('❌ syncCustomerId trigger FAILED');
  }
}

/**
 * Test standardizeStatusSpelling trigger
 */
async function testStandardizeStatusSpelling(userId, subscriptionId) {
  console.log('\n=== Testing standardizeStatusSpelling trigger ===');

  const subscriptionRef = db
    .collection('users')
    .doc(userId)
    .collection('subscriptions')
    .doc(subscriptionId);

  // Update subscription to "cancelled" (with British spelling)
  await subscriptionRef.update({
    status: 'cancelled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Updated subscription status to "cancelled" (British spelling)');
  
  // Wait for the trigger to execute
  console.log('Waiting for trigger to execute...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Verify the subscription document was updated
  const subAfter = await db
    .collection('users')
    .doc(userId)
    .collection('subscriptions')
    .doc(subscriptionId)
    .get();
  console.log('Subscription after:', subAfter.data().status);

  if (subAfter.data().status === 'canceled') {
    console.log('✅ standardizeStatusSpelling trigger PASSED');
  } else {
    console.log('❌ standardizeStatusSpelling trigger FAILED');
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(userId, subscriptionId) {
  console.log('\n=== Cleaning up test data ===');

  // Delete test subscription
  await db
    .collection('users')
    .doc(userId)
    .collection('subscriptions')
    .doc(subscriptionId)
    .delete();

  // Delete test user
  await db.collection('users').doc(userId).delete();

  console.log(`Deleted test user: ${userId}`);
  console.log(`Deleted test subscription: ${subscriptionId}`);
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    const { userId, subscriptionId } = await setupTestData();
    await testSyncSubscriptionStatus(userId, subscriptionId);
    await testSyncCustomerId(userId, subscriptionId);
    await testStandardizeStatusSpelling(userId, subscriptionId);
    await cleanupTestData(userId, subscriptionId);

    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();
EOL

log "\n${YELLOW}A test script has been created: test-triggers.js${NC}"
log "Run it with: node test-triggers.js"
log "To use with service account key: GOOGLE_APPLICATION_CREDENTIALS=./firebase-config/service-account.json node test-triggers.js"

exit 0