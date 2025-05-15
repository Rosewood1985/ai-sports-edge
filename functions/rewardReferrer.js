const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.rewardReferrer = functions.firestore
  .document("purchases/{purchaseId}")
  .onCreate(async (snap, context) => {
    const purchase = snap.data();
    const uid = purchase.uid;

    const db = admin.firestore();

    // Check if this is the user's first purchase
    const userPurchases = await db
      .collection("purchases")
      .where("uid", "==", uid)
      .get();

    if (userPurchases.size > 1) {
      console.log("Not the first purchase. No reward issued.");
      return null;
    }

    // Check if user was referred
    const userRef = await db.collection("users").doc(uid).get();
    const userData = userRef.data();

    if (!userData || !userData.referrerId) {
      console.log("No referrer found.");
      return null;
    }

    const referrerId = userData.referrerId;

    // Reward the referrer
    const rewardRef = db.collection("users").doc(referrerId);
    await rewardRef.update({
      referralRewards: admin.firestore.FieldValue.increment(1)
    });

    console.log(`Reward issued to referrer: ${referrerId}`);
    return null;
  });