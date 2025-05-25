const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { wrapEventFunction, trackReferralFunction, captureCloudFunctionError, trackFunctionPerformance } = require('./sentryConfig');

// Check if admin is already initialized to avoid duplicate initialization
try {
  admin.initializeApp();
} catch (e) {
  // App already initialized
}

exports.rewardReferrer = wrapEventFunction(functions.firestore
  .document("purchases/{purchaseId}")
  .onCreate(async (snap, context) => {
    const startTime = Date.now();
    const purchase = snap.data();
    const uid = purchase.uid;
    const purchaseId = context.params.purchaseId;

    try {
      trackReferralFunction('rewardReferrer', 'purchase_created', {
        userId: uid,
        purchaseId: purchaseId,
        amount: purchase.amount,
      });

      const db = admin.firestore();

      // Check if this is the user's first purchase
      const userPurchases = await db
        .collection("purchases")
        .where("uid", "==", uid)
        .get();

      if (userPurchases.size > 1) {
        console.log("Not the first purchase. No reward issued.");
        trackReferralFunction('rewardReferrer', 'not_first_purchase', {
          userId: uid,
          purchaseCount: userPurchases.size,
        });
        trackFunctionPerformance('rewardReferrer', Date.now() - startTime, true);
        return null;
      }

      // Check if user was referred
      const userRef = await db.collection("users").doc(uid).get();
      const userData = userRef.data();

      if (!userData || !userData.referrerId) {
        console.log("No referrer found.");
        trackReferralFunction('rewardReferrer', 'no_referrer', {
          userId: uid,
        });
        trackFunctionPerformance('rewardReferrer', Date.now() - startTime, true);
        return null;
      }

      const referrerId = userData.referrerId;

      // Reward the referrer
      const rewardRef = db.collection("users").doc(referrerId);
      await rewardRef.update({
        referralRewards: admin.firestore.FieldValue.increment(1)
      });

      console.log(`Reward issued to referrer: ${referrerId}`);
      trackReferralFunction('rewardReferrer', 'reward_issued', {
        userId: uid,
        referrerId: referrerId,
        purchaseAmount: purchase.amount,
      });
      trackFunctionPerformance('rewardReferrer', Date.now() - startTime, true);
      return null;
    } catch (error) {
      console.error('Error rewarding referrer:', error);
      captureCloudFunctionError(error, 'rewardReferrer', {
        userId: uid,
        purchaseId: purchaseId,
      });
      trackFunctionPerformance('rewardReferrer', Date.now() - startTime, false);
      return null;
    }
  }));