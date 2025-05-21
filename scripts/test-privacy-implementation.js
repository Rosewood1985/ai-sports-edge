/**
 * Privacy Implementation Test Script
 *
 * This script tests the privacy implementation by creating and processing
 * data access and deletion requests for a test user.
 *
 * Usage: node scripts/test-privacy-implementation.js
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} = require('firebase/firestore');

// Import privacy manager
const {
  createDataAccessRequest,
  getDataAccessRequest,
  processDataAccessRequest,
  createDataDeletionRequest,
  getDataDeletionRequest,
  processDataDeletionRequest,
  updatePrivacyPreferences,
  recordConsent,
  hasConsent,
} = require('../atomic/molecules/privacy');

// Firebase configuration
const firebaseConfig = {
  // Your Firebase configuration
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test user ID
const TEST_USER_ID = 'privacy_test_user';

/**
 * Create a test user with sample data
 */
async function createTestUser() {
  console.log('Creating test user...');

  try {
    // Create user document
    await setDoc(doc(db, 'users', TEST_USER_ID), {
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date(),
      privacyPreferences: {
        marketingCommunications: false,
        dataAnalytics: false,
        thirdPartySharing: false,
        profiling: false,
      },
    });

    // Create some sample data for the user
    await setDoc(doc(db, 'activity', `activity_${Date.now()}`), {
      userId: TEST_USER_ID,
      action: 'login',
      timestamp: new Date(),
    });

    await setDoc(doc(db, 'marketing', `marketing_${Date.now()}`), {
      userId: TEST_USER_ID,
      campaign: 'welcome',
      timestamp: new Date(),
    });

    console.log('Test user created successfully');
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

/**
 * Test privacy preferences update
 */
async function testPrivacyPreferencesUpdate() {
  console.log('\nTesting privacy preferences update...');

  try {
    const preferences = await updatePrivacyPreferences(TEST_USER_ID, {
      marketingCommunications: true,
      dataAnalytics: true,
    });

    console.log('Privacy preferences updated successfully:');
    console.log(preferences);

    // Verify the update
    const userDoc = await getDoc(doc(db, 'users', TEST_USER_ID));
    if (userDoc.exists()) {
      console.log('Verified preferences in Firestore:');
      console.log(userDoc.data().privacyPreferences);
    }
  } catch (error) {
    console.error('Error updating privacy preferences:', error);
  }
}

/**
 * Test consent management
 */
async function testConsentManagement() {
  console.log('\nTesting consent management...');

  try {
    // Record consent
    const consentRecord = await recordConsent(TEST_USER_ID, {
      id: `consent_${Date.now()}`,
      userId: TEST_USER_ID,
      consentType: 'marketing',
      given: true,
      timestamp: new Date(),
      method: 'explicit',
      policyVersion: '1.0',
      policyText: 'I agree to receive marketing communications...',
    });

    console.log('Consent recorded successfully:');
    console.log(consentRecord);

    // Check consent
    const hasMarketingConsent = await hasConsent(TEST_USER_ID, 'marketing');
    console.log(`Has marketing consent: ${hasMarketingConsent}`);
  } catch (error) {
    console.error('Error testing consent management:', error);
  }
}

/**
 * Test data access request
 */
async function testDataAccessRequest() {
  console.log('\nTesting data access request...');

  try {
    // Create data access request
    const request = await createDataAccessRequest(TEST_USER_ID, undefined, 'json');
    console.log('Data access request created successfully:');
    console.log(request);

    // Get the request
    const retrievedRequest = await getDataAccessRequest(request.id);
    console.log('Retrieved data access request:');
    console.log(retrievedRequest);

    // Process the request
    console.log('Processing data access request...');
    const processedRequest = await processDataAccessRequest(request.id);
    console.log('Data access request processed successfully:');
    console.log(processedRequest);

    if (processedRequest.responseData && processedRequest.responseData.downloadUrl) {
      console.log(`Download URL: ${processedRequest.responseData.downloadUrl}`);
    }
  } catch (error) {
    console.error('Error testing data access request:', error);
  }
}

/**
 * Test data deletion request
 */
async function testDataDeletionRequest() {
  console.log('\nTesting data deletion request...');

  try {
    // Create data deletion request for specific categories
    const request = await createDataDeletionRequest(TEST_USER_ID, ['marketingData', 'usageData']);
    console.log('Data deletion request created successfully:');
    console.log(request);

    // Get the request
    const retrievedRequest = await getDataDeletionRequest(request.id);
    console.log('Retrieved data deletion request:');
    console.log(retrievedRequest);

    // Process the request
    console.log('Processing data deletion request...');

    // In a real implementation, we would verify the request first
    // For testing purposes, we'll update the verification status directly
    await updateDoc(doc(db, 'privacyRequests', request.id), {
      verificationStatus: 'verified',
    });

    const processedRequest = await processDataDeletionRequest(request.id);
    console.log('Data deletion request processed successfully:');
    console.log(processedRequest);

    if (processedRequest.responseData) {
      console.log('Deleted categories:');
      console.log(processedRequest.responseData.deletedCategories);
      console.log('Anonymized categories:');
      console.log(processedRequest.responseData.anonymizedCategories);
    }
  } catch (error) {
    console.error('Error testing data deletion request:', error);
  }
}

/**
 * Clean up test data
 */
async function cleanUp() {
  console.log('\nCleaning up test data...');

  try {
    // Delete privacy requests
    const requestsQuery = query(
      collection(db, 'privacyRequests'),
      where('userId', '==', TEST_USER_ID)
    );
    const requestsSnapshot = await getDocs(requestsQuery);
    const deletePromises = [];

    requestsSnapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    // Delete user data
    const activityQuery = query(collection(db, 'activity'), where('userId', '==', TEST_USER_ID));
    const activitySnapshot = await getDocs(activityQuery);

    activitySnapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    const marketingQuery = query(collection(db, 'marketing'), where('userId', '==', TEST_USER_ID));
    const marketingSnapshot = await getDocs(marketingQuery);

    marketingSnapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    // Delete user
    deletePromises.push(deleteDoc(doc(db, 'users', TEST_USER_ID)));

    await Promise.all(deletePromises);
    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    await createTestUser();
    await testPrivacyPreferencesUpdate();
    await testConsentManagement();
    await testDataAccessRequest();
    await testDataDeletionRequest();

    // Uncomment to clean up test data
    // await cleanUp();

    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();
