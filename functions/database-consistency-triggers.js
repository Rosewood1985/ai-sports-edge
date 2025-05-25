/**
 * Database Consistency Triggers
 *
 * This module contains Firebase Cloud Functions that maintain consistency
 * between duplicated fields in the database, particularly between the
 * users collection and the subscriptions subcollection.
 *
 * Following atomic architecture principles, these triggers ensure data
 * integrity across the application by keeping duplicated fields in sync.
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { wrapEventFunction, trackDatabaseFunction, captureCloudFunctionError, trackFunctionPerformance } = require('./sentryConfig');

// If admin SDK isn't already initialized in this context
try {
  admin.initializeApp();
} catch (e) {
  // App already initialized
}

/**
 * Syncs subscription status changes from the subscriptions subcollection to the users collection
 *
 * This trigger fires whenever a subscription document is updated in the subscriptions subcollection.
 * It ensures that the subscription status in the parent user document is kept in sync.
 *
 * Source of truth: subscriptions subcollection (subscriptions.status)
 */
exports.syncSubscriptionStatus = wrapEventFunction(functions.firestore
  .document('users/{userId}/subscriptions/{subscriptionId}')
  .onWrite(async (change, context) => {
    const startTime = Date.now();
    try {
      trackDatabaseFunction('syncSubscriptionStatus', 'subscription_write', {
        userId: context.params.userId,
        subscriptionId: context.params.subscriptionId,
        isDelete: !change.after.exists,
      });
      // Skip if the document was deleted
      if (!change.after.exists) {
        console.log('Subscription document was deleted, skipping status sync');
        return null;
      }

      const userId = context.params.userId;
      const subscriptionData = change.after.data();

      // Skip if there's no status field
      if (!subscriptionData.status) {
        console.log('No status field in subscription document, skipping sync');
        return null;
      }

      console.log(`Syncing subscription status "${subscriptionData.status}" to user ${userId}`);

      // Standardize the spelling of "canceled" to "cancelled" for the user document
      // This maintains consistency with existing user documents
      let userStatus = subscriptionData.status;
      if (userStatus === 'canceled') {
        userStatus = 'cancelled';
      }

      // Update the user document with the standardized status
      const userRef = admin.firestore().collection('users').doc(userId);

      // Use transaction to ensure atomic update
      return admin.firestore().runTransaction(async transaction => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error(`User document ${userId} not found`);
        }

        transaction.update(userRef, {
          subscriptionStatus: userStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Successfully synced subscription status to user ${userId}`);
        trackDatabaseFunction('syncSubscriptionStatus', 'status_synced', {
          userId,
          subscriptionStatus: userStatus,
        });
        trackFunctionPerformance('syncSubscriptionStatus', Date.now() - startTime, true);
        return null;
      });
    } catch (error) {
      console.error('Error syncing subscription status:', error);
      captureCloudFunctionError(error, 'syncSubscriptionStatus', {
        userId: context.params.userId,
        subscriptionId: context.params.subscriptionId,
      });
      trackFunctionPerformance('syncSubscriptionStatus', Date.now() - startTime, false);
      return null;
    }
  }));

/**
 * Syncs customer ID changes from the users collection to the subscriptions subcollection
 *
 * This trigger fires whenever a user document is updated.
 * It ensures that the Stripe customer ID in all subscription documents is kept in sync.
 *
 * Source of truth: users collection (users.stripeCustomerId)
 */
exports.syncCustomerId = wrapEventFunction(functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const startTime = Date.now();
    try {
      trackDatabaseFunction('syncCustomerId', 'user_updated', {
        userId: context.params.userId,
        hasCustomerId: !!change.after.data().stripeCustomerId,
      });
      const userId = context.params.userId;
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Skip if stripeCustomerId hasn't changed
      if (beforeData.stripeCustomerId === afterData.stripeCustomerId) {
        return null;
      }

      // Skip if there's no stripeCustomerId
      if (!afterData.stripeCustomerId) {
        console.log('No stripeCustomerId in user document, skipping sync');
        return null;
      }

      console.log(
        `Syncing customer ID ${afterData.stripeCustomerId} to subscriptions for user ${userId}`
      );

      // Get all subscriptions for this user
      const db = admin.firestore();
      const subscriptionsRef = db.collection('users').doc(userId).collection('subscriptions');
      const subscriptionsSnapshot = await subscriptionsRef.get();

      // If no subscriptions, nothing to update
      if (subscriptionsSnapshot.empty) {
        console.log(`No subscriptions found for user ${userId}`);
        return null;
      }

      // Use batch to update all subscriptions atomically
      const batch = db.batch();

      subscriptionsSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          customerId: afterData.stripeCustomerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(
        `Successfully synced customer ID to ${subscriptionsSnapshot.size} subscriptions for user ${userId}`
      );
      trackDatabaseFunction('syncCustomerId', 'customer_id_synced', {
        userId,
        subscriptionCount: subscriptionsSnapshot.size,
        customerId: afterData.stripeCustomerId,
      });
      trackFunctionPerformance('syncCustomerId', Date.now() - startTime, true);
      return null;
    } catch (error) {
      console.error('Error syncing customer ID:', error);
      captureCloudFunctionError(error, 'syncCustomerId', {
        userId: context.params.userId,
      });
      trackFunctionPerformance('syncCustomerId', Date.now() - startTime, false);
      return null;
    }
  }));

/**
 * Standardizes the spelling of "canceled"/"cancelled" across all collections
 *
 * This trigger normalizes the spelling of subscription status values to ensure
 * consistency across the database. It converts "canceled" to "cancelled" in the
 * users collection and maintains "canceled" in the subscriptions subcollection.
 *
 * This helps prevent UI inconsistencies and business logic errors due to
 * different spellings of the same status.
 */
exports.standardizeStatusSpelling = wrapEventFunction(functions.firestore
  .document('users/{userId}/subscriptions/{subscriptionId}')
  .onWrite(async (change, context) => {
    const startTime = Date.now();
    try {
      trackDatabaseFunction('standardizeStatusSpelling', 'subscription_write', {
        userId: context.params.userId,
        subscriptionId: context.params.subscriptionId,
        isDelete: !change.after.exists,
      });
      // Skip if the document was deleted
      if (!change.after.exists) {
        return null;
      }

      const subscriptionData = change.after.data();
      const subscriptionRef = change.after.ref;

      // Skip if there's no status field
      if (!subscriptionData.status) {
        return null;
      }

      // For subscriptions collection, ensure "canceled" spelling (not "cancelled")
      if (subscriptionData.status === 'cancelled') {
        console.log(
          `Standardizing "cancelled" to "canceled" in subscription ${context.params.subscriptionId}`
        );

        await subscriptionRef.update({
          status: 'canceled',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(
          `Successfully standardized status spelling in subscription ${context.params.subscriptionId}`
        );
        trackDatabaseFunction('standardizeStatusSpelling', 'status_standardized', {
          subscriptionId: context.params.subscriptionId,
          fromStatus: 'cancelled',
          toStatus: 'canceled',
        });
      }

      trackFunctionPerformance('standardizeStatusSpelling', Date.now() - startTime, true);
      return null;
    } catch (error) {
      console.error('Error standardizing status spelling:', error);
      captureCloudFunctionError(error, 'standardizeStatusSpelling', {
        userId: context.params.userId,
        subscriptionId: context.params.subscriptionId,
      });
      trackFunctionPerformance('standardizeStatusSpelling', Date.now() - startTime, false);
      return null;
    }
  }));

/**
 * Updates the index.js file to export the new triggers
 *
 * This function is not exported as a Cloud Function but is included here
 * as a reminder to update the index.js file to export these new triggers.
 *
 * Add the following to index.js:
 *
 * const { syncSubscriptionStatus, syncCustomerId, standardizeStatusSpelling } = require('./database-consistency-triggers');
 * exports.syncSubscriptionStatus = syncSubscriptionStatus;
 * exports.syncCustomerId = syncCustomerId;
 * exports.standardizeStatusSpelling = standardizeStatusSpelling;
 */
