const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Generate AI summary for sports news
 * This function uses OpenAI's API to generate a summary of sports news
 * with a focus on betting implications
 */
exports.generateAISummary = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Validate required fields
  if (!data.content) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Content is required."
    );
  }

  const content = data.content;
  const maxLength = data.maxLength || 150;
  const focusOn = data.focusOn || "betting";

  try {
    // Production OpenAI API integration
    if (!process.env.OPENAI_API_KEY) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
      );
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a sports analyst specializing in summarizing sports news. Focus on how this might affect betting odds, point spreads, and game outcomes. Be concise and focus on facts."
          },
          {
            role: "user",
            content: `Summarize the following sports news in ${maxLength} words or less:\n\n${content}`
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    const summary = response.data.choices[0].message.content.trim();
    
    // Store the summary in Firestore for caching
    const db = admin.firestore();
    const summaryRef = db.collection("aiSummaries").doc();
    
    await summaryRef.set({
      content,
      summary,
      maxLength,
      focusOn,
      userId: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      summary,
      summaryId: summaryRef.id
    };
  } catch (error) {
    console.error("Error generating AI summary:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Mock summary generation function removed - now using real OpenAI API

// Export the functions
module.exports = {
  generateAISummary: exports.generateAISummary
};