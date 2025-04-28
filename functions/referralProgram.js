const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const personalizedNotificationService = require('./personalizedNotificationService');

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
    
    // Send a personalized notification to the referrer
    await personalizedNotificationService.sendReferralNotification({
      userId: referrerId,
      referredUserId: data.newUserId,
      type: 'newReferral',
      data: {
        referralCode: data.referralCode
      }
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
      
      // Send a personalized notification to the referrer
      await personalizedNotificationService.sendReferralNotification({
        userId: referrerId,
        referredUserId: userId,
        type: 'referralReward',
        data: {
          rewardPoints: REFERRAL_REWARD_POINTS,
          rewardDuration: 30, // 1 month in days
          subscriptionId: context.params.subscriptionId
        }
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

/**
 * Process referral milestone rewards when a user's referral count changes
 * This function is triggered by a Firestore document update in the users collection
 */
exports.processMilestoneReward = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const { userId } = context.params;
    const newData = change.after.data();
    const previousData = change.before.data();
    
    // Check if referral count has changed
    if (newData.referralCount === previousData.referralCount) {
      return null; // No change in referral count
    }
    
    try {
      const db = admin.firestore();
      
      // Define milestones and rewards
      const milestones = [
        {
          count: 3,
          reward: {
            type: 'subscription_extension',
            duration: 30, // 1 month in days
            description: '1 Month Free Subscription'
          }
        },
        {
          count: 5,
          reward: {
            type: 'premium_trial',
            duration: 60, // 2 months in days
            description: 'Premium Trial for 2 Months'
          }
        },
        {
          count: 10,
          reward: {
            type: 'cash_or_upgrade',
            amount: 25, // $25
            upgradeDuration: 30, // 1 month in days
            description: 'Cash Reward ($25) or Free Pro Subscription'
          }
        },
        {
          count: 20,
          reward: {
            type: 'elite_status',
            description: 'Elite Status + Special Badge'
          }
        }
      ];
      
      // Check if any milestone has been reached
      for (const milestone of milestones) {
        if (
          newData.referralCount >= milestone.count &&
          previousData.referralCount < milestone.count
        ) {
          // Milestone reached
          console.log(`User ${userId} reached milestone: ${milestone.count} referrals`);
          
          // Add milestone reward to user's rewards collection
          await db.collection('users').doc(userId).collection('rewards').add({
            type: 'milestone_reward',
            milestone: milestone.count,
            reward: milestone.reward,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Send a personalized notification to the user
          await personalizedNotificationService.sendReferralNotification({
            userId,
            type: 'milestoneReached',
            data: {
              count: milestone.count,
              rewardDescription: milestone.reward.description,
              rewardType: milestone.reward.type,
              rewardDuration: milestone.reward.duration || 0,
              rewardAmount: milestone.reward.amount || 0
            }
          });
          
          // Track the milestone in analytics
          await db.collection('analytics').doc('referrals').collection('events').add({
            type: 'milestone_reached',
            userId,
            milestone: milestone.count,
            reward: milestone.reward,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Process the reward based on type
          switch (milestone.reward.type) {
            case 'subscription_extension':
              // Extend subscription by specified duration
              await processSubscriptionExtension(userId, milestone.reward.duration);
              break;
              
            case 'premium_trial':
              // Grant premium trial
              await processPremiumTrial(userId, milestone.reward.duration);
              break;
              
            case 'cash_or_upgrade':
              // This will be handled manually or through a user choice
              // Mark as pending for now
              break;
              
            case 'elite_status':
              // Update user's status to elite
              await db.collection('users').doc(userId).update({
                eliteStatus: true,
                badgeType: 'hall-of-fame',
                eliteStatusGrantedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              break;
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error processing milestone reward:', error);
      return null;
    }
  });

/**
 * Helper function to process subscription extension
 * @param {string} userId - User ID
 * @param {number} durationDays - Duration in days to extend the subscription
 * @returns {Promise<boolean>} - Success status
 */
async function processSubscriptionExtension(userId, durationDays) {
  try {
    const db = admin.firestore();
    
    // Get user's active subscription
    const subscriptionsQuery = await db.collection('users').doc(userId)
      .collection('subscriptions')
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (subscriptionsQuery.empty) {
      console.log(`No active subscription found for user ${userId}`);
      return false;
    }
    
    const subscriptionDoc = subscriptionsQuery.docs[0];
    const subscriptionId = subscriptionDoc.id;
    const subscriptionData = subscriptionDoc.data();
    
    // Calculate new end date
    const currentPeriodEnd = subscriptionData.currentPeriodEnd.toDate();
    const newPeriodEnd = new Date(currentPeriodEnd);
    newPeriodEnd.setDate(newPeriodEnd.getDate() + durationDays);
    
    // Update subscription in Stripe
    await stripe.subscriptions.update(subscriptionId, {
      proration_behavior: 'none',
      trial_end: Math.floor(newPeriodEnd.getTime() / 1000)
    });
    
    // Update subscription in Firestore
    await subscriptionDoc.ref.update({
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(newPeriodEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      milestoneRewardApplied: true
    });
    
    console.log(`Extended subscription ${subscriptionId} for user ${userId} by ${durationDays} days`);
    return true;
  } catch (error) {
    console.error('Error processing subscription extension:', error);
    return false;
  }
}

/**
 * Helper function to process premium trial
 * @param {string} userId - User ID
 * @param {number} durationDays - Duration in days for the premium trial
 * @returns {Promise<boolean>} - Success status
 */
async function processPremiumTrial(userId, durationDays) {
  try {
    const db = admin.firestore();
    
    // Check if user already has premium
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData.premiumTier) {
      // User already has premium, extend their subscription instead
      return processSubscriptionExtension(userId, durationDays);
    }
    
    // Grant premium trial
    await db.collection('users').doc(userId).update({
      premiumTrial: true,
      premiumTrialStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      premiumTrialEndsAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      ),
      badgeType: 'elite'
    });
    
    console.log(`Granted premium trial to user ${userId} for ${durationDays} days`);
    return true;
  } catch (error) {
    console.error('Error processing premium trial:', error);
    return false;
  }
}

// Export the functions
module.exports = {
  generateReferralCode: exports.generateReferralCode,
  applyReferralCode: exports.applyReferralCode,
  processReferralReward: exports.processReferralReward,
  processMilestoneReward: exports.processMilestoneReward
};