/**
 * Test Script for Database Consistency Triggers
 *
 * This script creates test data to verify the deployed triggers.
 * Run this script with: node test-triggers.js
 *
 * To use with service account key:
 * GOOGLE_APPLICATION_CREDENTIALS=./firebase-config/service-account.json node test-triggers.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with your project credentials
try {
  // Check if service account key is provided as an environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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
  await db.collection('users').doc(userId).collection('subscriptions').doc(subscriptionId).delete();

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
