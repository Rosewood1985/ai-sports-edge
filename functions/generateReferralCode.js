const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.generateReferralCode = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const displayName = user.displayName || "USER";
  const timestamp = Date.now().toString().slice(-4);  // last 4 digits of timestamp
  const referralCode = `${displayName.substring(0, 4).toUpperCase()}-EDGE-${timestamp}`;

  const referralEntry = {
    referralCode: referralCode,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ownerUid: uid
  };

  const db = admin.firestore();
  const userRef = db.collection("users").doc(uid);
  const referralCodeRef = db.collection("referralCodes").doc(referralCode);

  try {
    await userRef.set({ referralCode: referralCode }, { merge: true });
    await referralCodeRef.set(referralEntry);
    console.log(`Referral code ${referralCode} generated for ${uid}`);
  } catch (error) {
    console.error("Error creating referral code:", error);
  }
});