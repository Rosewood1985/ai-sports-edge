/**
 * Language-Specific Analytics for Admin Dashboard
 * AI Sports Edge - Track Spanish vs English user behavior separately
 */

const { onRequest } = require("firebase-functions/v2/https");
const { wrapHttpFunction, captureCloudFunctionError, trackFunctionPerformance } = require("./sentryConfig");
const admin = require("firebase-admin");

// Initialize Firestore
const db = admin.firestore();

/**
 * Enhanced subscription analytics with language segmentation
 */
exports.languageSegmentedAnalytics = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  try {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // Verify admin token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Authorization required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get time range from query parameters
    const timeRange = req.query.timeRange || "30d";
    const endDate = new Date();
    const startDate = new Date();
    
    // Calculate start date based on time range
    switch (timeRange) {
    case "7d":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(endDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(endDate.getDate() - 90);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
    }

    // Fetch user analytics with language data
    const analyticsSnapshot = await db.collection("user_analytics")
      .where("timestamp", ">=", startDate)
      .where("timestamp", "<=", endDate)
      .get();

    const languageMetrics = {
      english: {
        totalUsers: 0,
        activeUsers: 0,
        subscriptions: 0,
        revenue: 0,
        sessionDuration: 0,
        conversionRate: 0,
        topFeatures: {},
        deviceTypes: { mobile: 0, desktop: 0, tablet: 0 },
        geographicDistribution: {}
      },
      spanish: {
        totalUsers: 0,
        activeUsers: 0,
        subscriptions: 0,
        revenue: 0,
        sessionDuration: 0,
        conversionRate: 0,
        topFeatures: {},
        deviceTypes: { mobile: 0, desktop: 0, tablet: 0 },
        geographicDistribution: {}
      }
    };

    // Process analytics data
    const processedUsers = new Set();
    
    analyticsSnapshot.forEach(doc => {
      const data = doc.data();
      const userLang = data.userLanguage || data.language || "en";
      const isSpanish = userLang.startsWith("es");
      const langKey = isSpanish ? "spanish" : "english";
      
      // Track unique users
      if (!processedUsers.has(data.userId)) {
        processedUsers.add(data.userId);
        languageMetrics[langKey].totalUsers++;
      }
      
      // Active users (users with activity in the period)
      if (data.lastActivity) {
        const lastActivity = data.lastActivity.toDate();
        if (lastActivity >= startDate) {
          languageMetrics[langKey].activeUsers++;
        }
      }
      
      // Session duration
      if (data.sessionDuration) {
        languageMetrics[langKey].sessionDuration += data.sessionDuration;
      }
      
      // Device types
      if (data.deviceType) {
        const deviceType = data.deviceType.toLowerCase();
        if (languageMetrics[langKey].deviceTypes[deviceType] !== undefined) {
          languageMetrics[langKey].deviceTypes[deviceType]++;
        }
      }
      
      // Geographic distribution
      if (data.country) {
        if (!languageMetrics[langKey].geographicDistribution[data.country]) {
          languageMetrics[langKey].geographicDistribution[data.country] = 0;
        }
        languageMetrics[langKey].geographicDistribution[data.country]++;
      }
      
      // Feature usage
      if (data.featuresUsed) {
        data.featuresUsed.forEach(feature => {
          if (!languageMetrics[langKey].topFeatures[feature]) {
            languageMetrics[langKey].topFeatures[feature] = 0;
          }
          languageMetrics[langKey].topFeatures[feature]++;
        });
      }
    });

    // Fetch subscription data with language segmentation
    const subscriptionsSnapshot = await db.collection("subscriptions")
      .where("createdAt", ">=", startDate)
      .where("createdAt", "<=", endDate)
      .get();

    const subscriptionUsers = new Set();
    
    for (const subDoc of subscriptionsSnapshot.docs) {
      const subData = subDoc.data();
      
      // Get user language preference
      const userDoc = await db.collection("users").doc(subData.userId).get();
      const userData = userDoc.data();
      const userLang = userData?.languagePreference || userData?.language || "en";
      const isSpanish = userLang.startsWith("es");
      const langKey = isSpanish ? "spanish" : "english";
      
      // Track subscriptions
      if (!subscriptionUsers.has(subData.userId)) {
        subscriptionUsers.add(subData.userId);
        languageMetrics[langKey].subscriptions++;
        
        // Add revenue
        if (subData.amount) {
          languageMetrics[langKey].revenue += subData.amount;
        }
      }
    }

    // Calculate conversion rates
    languageMetrics.english.conversionRate = languageMetrics.english.totalUsers > 0 ? 
      (languageMetrics.english.subscriptions / languageMetrics.english.totalUsers) * 100 : 0;
    languageMetrics.spanish.conversionRate = languageMetrics.spanish.totalUsers > 0 ? 
      (languageMetrics.spanish.subscriptions / languageMetrics.spanish.totalUsers) * 100 : 0;

    // Calculate average session duration
    languageMetrics.english.sessionDuration = languageMetrics.english.totalUsers > 0 ? 
      languageMetrics.english.sessionDuration / languageMetrics.english.totalUsers : 0;
    languageMetrics.spanish.sessionDuration = languageMetrics.spanish.totalUsers > 0 ? 
      languageMetrics.spanish.sessionDuration / languageMetrics.spanish.totalUsers : 0;

    // Get top features for each language
    Object.keys(languageMetrics).forEach(lang => {
      const features = languageMetrics[lang].topFeatures;
      languageMetrics[lang].topFeatures = Object.entries(features)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    });

    // Additional Spanish-specific insights
    const spanishInsights = {
      marketPenetration: {
        us: languageMetrics.spanish.geographicDistribution["US"] || 0,
        mexico: languageMetrics.spanish.geographicDistribution["MX"] || 0,
        spain: languageMetrics.spanish.geographicDistribution["ES"] || 0,
        other: Object.entries(languageMetrics.spanish.geographicDistribution)
          .filter(([country]) => !["US", "MX", "ES"].includes(country))
          .reduce((sum, [, count]) => sum + count, 0)
      },
      contentPreferences: {
        // This would be enhanced with actual content analytics
        soccerEngagement: languageMetrics.spanish.topFeatures["soccer"] || 0,
        baseballEngagement: languageMetrics.spanish.topFeatures["baseball"] || 0,
        footballEngagement: languageMetrics.spanish.topFeatures["football"] || 0
      }
    };

    const result = {
      timeRange,
      generatedAt: new Date().toISOString(),
      languageMetrics,
      spanishInsights,
      summary: {
        totalUsers: languageMetrics.english.totalUsers + languageMetrics.spanish.totalUsers,
        spanishUserPercentage: languageMetrics.spanish.totalUsers / 
          (languageMetrics.english.totalUsers + languageMetrics.spanish.totalUsers) * 100,
        spanishRevenuePercentage: languageMetrics.spanish.revenue / 
          (languageMetrics.english.revenue + languageMetrics.spanish.revenue) * 100
      }
    };

    trackFunctionPerformance("languageSegmentedAnalytics", Date.now() - startTime, true);

    res.status(200).json({
      status: 200,
      message: "Success",
      data: result
    });

  } catch (error) {
    console.error("Language analytics error:", error);
    captureCloudFunctionError(error, "languageSegmentedAnalytics");
    trackFunctionPerformance("languageSegmentedAnalytics", Date.now() - startTime, false);
    
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      error: error.message
    });
  }
}));

/**
 * Track language-specific user events
 */
exports.trackLanguageEvent = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  try {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const { userId, eventType, language, properties } = req.body;
    
    if (!userId || !eventType || !language) {
      return res.status(400).json({ 
        error: "userId, eventType, and language are required" 
      });
    }

    // Store the language-specific event
    await db.collection("language_analytics").add({
      userId,
      eventType,
      language,
      properties: properties || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isSpanish: language.startsWith("es")
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error("Track language event error:", error);
    captureCloudFunctionError(error, "trackLanguageEvent");
    res.status(500).json({ error: "Failed to track event" });
  }
}));

console.log("Language Analytics module loaded successfully");