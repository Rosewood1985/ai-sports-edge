const functions = require("firebase-functions");
// Minimal export to satisfy Firebase deployment
exports.placeholder = functions.https.onRequest((req, res) => {
  res.json({ message: "Firebase Functions deployed successfully" });
});
