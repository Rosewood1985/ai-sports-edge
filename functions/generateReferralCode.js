const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { wrapEventFunction, trackReferralFunction, captureCloudFunctionError, trackFunctionPerformance } = require('./sentryConfig');

// Check if admin is already initialized to avoid duplicate initialization
try {
  admin.initializeApp();
} catch (e) {
  // App already initialized
}

exports.generateReferralCode = wrapEventFunction(functions.auth.user().onCreate(async (user) => {
  const startTime = Date.now();
  const uid = user.uid;
  const displayName = user.displayName || "USER";
  const timestamp = Date.now().toString().slice(-4);  // last 4 digits of timestamp
  const referralCode = `${displayName.substring(0, 4).toUpperCase()}-EDGE-${timestamp}`;

  try {
    trackReferralFunction('generateReferralCode', 'user_created', {
      userId: uid,
      email: user.email,
      displayName: displayName,
    });

    const referralEntry = {
      referralCode: referralCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ownerUid: uid
    };

    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);
    const referralCodeRef = db.collection("referralCodes").doc(referralCode);

    await userRef.set({ referralCode: referralCode }, { merge: true });
    await referralCodeRef.set(referralEntry);
    
    console.log(`Referral code ${referralCode} generated for ${uid}`);
    trackReferralFunction('generateReferralCode', 'code_generated', {
      userId: uid,
      referralCode: referralCode,
    });
    trackFunctionPerformance('generateReferralCode', Date.now() - startTime, true);
  } catch (error) {
    console.error("Error creating referral code:", error);
    captureCloudFunctionError(error, 'generateReferralCode', {
      userId: uid,
      displayName: displayName,
    });
    trackFunctionPerformance('generateReferralCode', Date.now() - startTime, false);
  }
}));