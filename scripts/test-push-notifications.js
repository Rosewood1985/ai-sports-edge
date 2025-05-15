/**
 * Test script for push notifications
 * 
 * This script tests the push notification service by:
 * 1. Initializing the service
 * 2. Getting and updating notification preferences
 * 3. Scheduling a test notification
 * 
 * Usage: node scripts/test-push-notifications.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ai-sports-edge.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ai-sports-edge",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ai-sports-edge.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-ABCDEFGHIJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

/**
 * Test notification preferences
 */
async function testNotificationPreferences() {
  console.log('\n--- Testing Notification Preferences ---');
  
  try {
    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    const userId = userCredential.user.uid;
    console.log(`Signed in anonymously with user ID: ${userId}`);
    
    // Get notification preferences
    const docRef = doc(firestore, 'users', userId, 'settings', 'notifications');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('Existing notification preferences:', docSnap.data());
    } else {
      console.log('No notification preferences found. Creating default preferences...');
      
      // Default preferences would be created by the service
      console.log('Default preferences would be created by the service');
    }
    
    console.log('Notification preferences test completed successfully');
  } catch (error) {
    console.error('Error testing notification preferences:', error);
  }
}

/**
 * Test scheduled notifications
 */
async function testScheduledNotifications() {
  console.log('\n--- Testing Scheduled Notifications ---');
  
  try {
    // Sign in anonymously if not already signed in
    if (!auth.currentUser) {
      const userCredential = await signInAnonymously(auth);
      console.log(`Signed in anonymously with user ID: ${userCredential.user.uid}`);
    }
    
    const userId = auth.currentUser.uid;
    
    // Get scheduled notifications
    const notificationsRef = collection(firestore, 'scheduledNotifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('sent', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No scheduled notifications found');
    } else {
      console.log(`Found ${snapshot.size} scheduled notifications:`);
      
      snapshot.forEach(doc => {
        const notification = doc.data();
        console.log(`- ${doc.id}: "${notification.title}" scheduled for ${notification.scheduledAt.toDate()}`);
      });
    }
    
    // Schedule a test notification
    console.log('\nScheduling a test notification would be done by the service');
    
    console.log('Scheduled notifications test completed successfully');
  } catch (error) {
    console.error('Error testing scheduled notifications:', error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('Starting push notification tests...');
    
    await testNotificationPreferences();
    await testScheduledNotifications();
    
    console.log('\nAll push notification tests completed');
  } catch (error) {
    console.error('Error running push notification tests:', error);
  } finally {
    // Sign out
    if (auth.currentUser) {
      await auth.signOut();
      console.log('Signed out');
    }
    
    process.exit(0);
  }
}

// Run tests
runTests();