const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Generate a unique referral code for a user
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @returns {Object} - Referral code details
 */
exports.generateReferralCode = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Verify the user is generating a code for themselves
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Users can only generate referral codes for themselves.'
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(data.userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found.'
      );
    }
    
    const userData = userDoc.data();
    
    // Check if user already has a referral code
    if (userData.referralCode) {
      return {
        referralCode: userData.referralCode,
        isNew: false
      };
    }
    
    // Generate a unique referral code
    const referralCode = generateUniqueCode(data.userId);
    
    // Store the referral code in the user's document
    await userRef.update({
      referralCode: referralCode,
      referralCount: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create a referral code document for lookups
    await db.collection('referralCodes').doc(referralCode).set({
      userId: data.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: 0
    });
    
    return {
      referralCode: referralCode,
      isNew: true
    };
  } catch (error) {
    console.error('Error generating referral code:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Apply a referral code during signup or subscription
 * @param {Object} data - Request data
 * @param {string} data.referralCode - Referral code to apply
 * @param {string} data.newUserId - Firebase user ID of the new user
 * @returns {Object} - Referral application details
 */
exports.applyReferralCode = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Verify the user is applying a code for themselves
  if (data.newUserId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Users can only apply referral codes for themselves.'
    );
  }

  // Validate required fields
  if (!data.referralCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Referral code is required.'
    );
  }

  try {
    const db = admin.firestore();
    
    // Look up the referral code
    const referralCodeDoc = await db.collection('referralCodes').doc(data.referralCode).get();
    
    if (!referralCodeDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Invalid referral code.'
      );
    }
    
    const referralData = referralCodeDoc.data();
    const referrerId = referralData.userId;
    
    // Make sure the user isn't referring themselves
    if (referrerId === data.newUserId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'You cannot use your own referral code.'
      );
    }
    
    // Check if this user has already used a referral code
    const newUserRef = db.collection('users').doc(data.newUserId);
    const newUserDoc = await newUserRef.get();
    
    if (newUserDoc.exists && newUserDoc.data().referredBy) {
      throw new functions.https.HttpsError(
        'already-exists',
        'You have already used a referral code.'
      );
    }
    
    // Get the referrer's user document
    const referrerRef = db.collection('users').doc(referrerId);
    const referrerDoc = await referrerRef.get();
    
    if (!referrerDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Referrer not found.'
      );
    }
    
    // Update the new user's document with the referral info
    await newUserRef.update({
      referredBy: referrerId,
      referralCodeUsed: data.referralCode,
      referralDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Increment the referrer's referral count
    await referrerRef.update({
      referralCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Increment the usage count for the referral code
    await referralCodeDoc.ref.update({
      usageCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create a record of the referral
    await db.collection('referrals').add({
      referrerId: referrerId,
      referredUserId: data.newUserId,
      referralCode: data.referralCode,
      status: 'pending', // Will be updated to 'completed' when the referred user subscribes
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Track the referral in analytics
    await db.collection('analytics').doc('referrals').collection('events').add({
      type: 'referral_applied',
      referrerId: referrerId,
      referredUserId: data.newUserId,
      referralCode: data.referralCode,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create a notification for the referrer
    await referrerRef.collection('notifications').add({
      type: 'new_referral',
      title: 'New Referral',
      message: 'Someone has used your referral code! You\'ll receive your reward when they subscribe.',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      referralCode: data.referralCode,
      referrerId: referrerId
    };
  } catch (error) {
    console.error('Error applying referral code:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Process referral rewards when a referred user subscribes
 * This function is triggered by a Firestore document creation in the subscriptions collection
 */
exports.processReferralReward = functions.firestore
  .document('users/{userId}/subscriptions/{subscriptionId}')
  .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const subscriptionData = snapshot.data();
    
    try {
      const db = admin.firestore();
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.log(`User ${userId} not found`);
        return null;
      }
      
      const userData = userDoc.data();
      
      // Check if this user was referred by someone
      if (!userData.referredBy) {
        console.log(`User ${userId} was not referred by anyone`);
        return null;
      }
      
      const referrerId = userData.referredBy;
      const referrerRef = db.collection('users').doc(referrerId);
      const referrerDoc = await referrerRef.get();
      
      if (!referrerDoc.exists) {
        console.log(`Referrer ${referrerId} not found`);
        return null;
      }
      
      // Find the referral record
      const referralsQuery = await db.collection('referrals')
        .where('referrerId', '==', referrerId)
        .where('referredUserId', '==', userId)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
      
      if (referralsQuery.empty) {
        console.log(`No pending referral found for referrer ${referrerId} and user ${userId}`);
        return null;
      }
      
      const referralDoc = referralsQuery.docs[0];
      const referralId = referralDoc.id;
      
      // Update the referral status to completed
      await referralDoc.ref.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        subscriptionId: context.params.subscriptionId,
        rewardProcessed: true
      });
      
      // Grant rewards to the referrer
      // 1. Free month extension if they have an active subscription
      const referrerSubscriptionsQuery = await referrerRef.collection('subscriptions')
        .where('status', '==', 'active')
        .limit(1)
        .get();
      
      if (!referrerSubscriptionsQuery.empty) {
        const referrerSubscriptionDoc = referrerSubscriptionsQuery.docs[0];
        const referrerSubscriptionId = referrerSubscriptionDoc.id;
        const referrerSubscriptionData = referrerSubscriptionDoc.data();
        
        // Extend the subscription by 1 month (30 days)
        const currentPeriodEnd = referrerSubscriptionData.currentPeriodEnd.toDate();
        const newPeriodEnd = new Date(currentPeriodEnd);
        newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);
        
        // Update the subscription in Stripe
        await stripe.subscriptions.update(referrerSubscriptionId, {
          proration_behavior: 'none',
          trial_end: Math.floor(newPeriodEnd.getTime() / 1000)
        });
        
        // Update the subscription in Firestore
        await referrerSubscriptionDoc.ref.update({
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(newPeriodEnd),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          referralRewardApplied: true
        });
        
        console.log(`Extended subscription ${referrerSubscriptionId} for referrer ${referrerId} by 30 days`);
      }
      
      // 2. Add loyalty points
      const REFERRAL_REWARD_POINTS = 200;
      await referrerRef.update({
        loyaltyPoints: admin.firestore.FieldValue.increment(REFERRAL_REWARD_POINTS),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Track the reward in analytics
      await db.collection('analytics').doc('referrals').collection('events').add({
        type: 'referral_reward_processed',
        referrerId: referrerId,
        referredUserId: userId,
        referralId: referralId,
        subscriptionId: context.params.subscriptionId,
        rewardPoints: REFERRAL_REWARD_POINTS,
        subscriptionExtended: !referrerSubscriptionsQuery.empty,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create a notification for the referrer
      await referrerRef.collection('notifications').add({
        type: 'referral_reward',
        title: 'Referral Reward',
        message: `Your referral has subscribed! You've earned ${REFERRAL_REWARD_POINTS} loyalty points and a 1-month subscription extension.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        referralId: referralId,
        referrerId: referrerId,
        referredUserId: userId
      };
    } catch (error) {
      console.error('Error processing referral reward:', error);
      return null;
    }
  });

/**
 * Generate a unique referral code
 * @param {string} userId - User ID to base the code on
 * @returns {string} - Unique referral code
 */
function generateUniqueCode(userId) {
  // Generate a code based on user ID and random characters
  const prefix = 'SPORT';
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const userPart = userId.substring(0, 4);
  
  return `${prefix}-${randomPart}-${userPart}`;
}

// Export the functions
module.exports = {
  generateReferralCode: exports.generateReferralCode,
  applyReferralCode: exports.applyReferralCode,
  processReferralReward: exports.processReferralReward
};