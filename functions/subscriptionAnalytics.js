const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Track subscription analytics events
 * This function is triggered by various subscription-related events
 */
exports.trackSubscriptionEvent = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Validate required fields
  if (!data.eventType || !data.userId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Event type and user ID are required."
    );
  }

  try {
    const db = admin.firestore();
    const analyticsRef = db.collection("analytics").doc("subscriptions");
    
    // Create the event record
    await analyticsRef.collection("events").add({
      eventType: data.eventType,
      userId: data.userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      properties: data.properties || {}
    });
    
    // Update aggregate metrics based on event type
    switch (data.eventType) {
    case "subscription_created":
      await updateSubscriptionMetrics(analyticsRef, "new_subscriptions", 1);
      await updateUserSubscriptionStatus(db, data.userId, "active", data.properties?.planId);
      break;
      
    case "subscription_cancelled":
      await updateSubscriptionMetrics(analyticsRef, "cancelled_subscriptions", 1);
      await updateUserSubscriptionStatus(db, data.userId, "cancelled", null);
      break;
      
    case "subscription_renewed":
      await updateSubscriptionMetrics(analyticsRef, "renewed_subscriptions", 1);
      break;
      
    case "payment_failed":
      await updateSubscriptionMetrics(analyticsRef, "failed_payments", 1);
      break;
      
    case "plan_upgraded":
      await updateSubscriptionMetrics(analyticsRef, "plan_upgrades", 1);
      await updateUserSubscriptionStatus(db, data.userId, "active", data.properties?.newPlanId);
      break;
      
    case "plan_downgraded":
      await updateSubscriptionMetrics(analyticsRef, "plan_downgrades", 1);
      await updateUserSubscriptionStatus(db, data.userId, "active", data.properties?.newPlanId);
      break;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error tracking subscription event:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Generate subscription analytics report
 * @param {Object} data - Request data
 * @param {string} data.timeRange - Time range for the report ('7d', '30d', '90d', 'all')
 * @param {string} data.startDate - Start date for the report (YYYY-MM-DD) - optional
 * @param {string} data.endDate - End date for the report (YYYY-MM-DD) - optional
 * @returns {Object} - Subscription analytics report
 */
exports.generateSubscriptionReport = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  const db = admin.firestore();
  
  // Check if user is an admin
  let isAdmin = false;
  try {
    const adminDoc = await db.collection("admins").doc(userId).get();
    isAdmin = adminDoc.exists && adminDoc.data().isAdmin;
  } catch (error) {
    console.log("Error checking admin status:", error);
    // Continue as regular user
  }
  
  // Determine date range based on timeRange or explicit dates
  let startDate, endDate;
  
  if (data.startDate && data.endDate) {
    // Use explicit dates if provided
    startDate = new Date(data.startDate);
    endDate = new Date(data.endDate);
    endDate.setHours(23, 59, 59, 999); // End of the day
  } else {
    // Use timeRange
    const timeRange = data.timeRange || "30d";
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of the day
    
    startDate = new Date();
    switch (timeRange) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "all":
      startDate = new Date(2020, 0, 1); // Beginning of 2020 or some early date
      break;
    default:
      startDate.setDate(startDate.getDate() - 30); // Default to 30 days
    }
  }
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid date format. Use YYYY-MM-DD."
    );
  }

  try {
    // We already have startDate and endDate from above
    
    // Query subscription events within the date range
    const eventsRef = db.collection("analytics").doc("subscriptions").collection("events");
    const eventsQuery = await eventsRef
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .get();
    
    // Initialize report data
    const report = {
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0]
      },
      metrics: {
        new_subscriptions: 0,
        cancelled_subscriptions: 0,
        renewed_subscriptions: 0,
        failed_payments: 0,
        plan_upgrades: 0,
        plan_downgrades: 0,
        auto_resubscribes: 0
      },
      revenue: {
        total: 0,
        by_plan: {}
      },
      churn_rate: 0,
      retention_rate: 0,
      conversion_rate: 0,
      average_subscription_length: 0,
      referral_conversions: 0
    };
    
    // Process events
    const events = eventsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Count events by type
    events.forEach(event => {
      switch (event.eventType) {
      case "subscription_created":
        report.metrics.new_subscriptions++;
          
        // Add revenue
        if (event.properties && event.properties.amount) {
          report.revenue.total += event.properties.amount;
            
          // Track by plan
          const planId = event.properties.planId || "unknown";
          if (!report.revenue.by_plan[planId]) {
            report.revenue.by_plan[planId] = 0;
          }
          report.revenue.by_plan[planId] += event.properties.amount;
        }
        break;
        
      case "subscription_cancelled":
        report.metrics.cancelled_subscriptions++;
        break;
        
      case "subscription_renewed":
        report.metrics.renewed_subscriptions++;
          
        // Add revenue
        if (event.properties && event.properties.amount) {
          report.revenue.total += event.properties.amount;
            
          // Track by plan
          const planId = event.properties.planId || "unknown";
          if (!report.revenue.by_plan[planId]) {
            report.revenue.by_plan[planId] = 0;
          }
          report.revenue.by_plan[planId] += event.properties.amount;
        }
        break;
        
      case "payment_failed":
        report.metrics.failed_payments++;
        break;
        
      case "plan_upgraded":
        report.metrics.plan_upgrades++;
        break;
        
      case "plan_downgraded":
        report.metrics.plan_downgrades++;
        break;
        
      case "auto_resubscribe":
        report.metrics.auto_resubscribes++;
        break;
      }
    });
    
    // Calculate churn rate
    // Churn rate = (Cancelled subscriptions / Total subscriptions at start) * 100
    const totalSubscriptionsQuery = await db.collection("users")
      .where("subscriptionStatus", "==", "active")
      .where("subscriptionCreatedAt", "<", admin.firestore.Timestamp.fromDate(startDate))
      .count()
      .get();
    
    const totalSubscriptionsAtStart = totalSubscriptionsQuery.data().count;
    
    if (totalSubscriptionsAtStart > 0) {
      report.churn_rate = (report.metrics.cancelled_subscriptions / totalSubscriptionsAtStart) * 100;
      report.retention_rate = 100 - report.churn_rate;
    }
    
    // Calculate conversion rate
    // Conversion rate = (New subscriptions / Total subscription page views) * 100
    const subscriptionPageViewsQuery = await db.collection("analytics")
      .doc("pageViews")
      .collection("events")
      .where("page", "==", "subscription")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .count()
      .get();
    
    const subscriptionPageViews = subscriptionPageViewsQuery.data().count;
    
    if (subscriptionPageViews > 0) {
      report.conversion_rate = (report.metrics.new_subscriptions / subscriptionPageViews) * 100;
    }
    
    // Calculate average subscription length
    const subscriptionsQuery = await db.collectionGroup("subscriptions")
      .where("status", "==", "cancelled")
      .where("canceledAt", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .where("canceledAt", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .get();
    
    let totalDays = 0;
    let cancelledCount = 0;
    
    subscriptionsQuery.forEach(doc => {
      const data = doc.data();
      if (data.createdAt && data.canceledAt) {
        const startTime = data.createdAt.toDate().getTime();
        const endTime = data.canceledAt.toDate().getTime();
        const durationDays = Math.round((endTime - startTime) / (1000 * 60 * 60 * 24));
        totalDays += durationDays;
        cancelledCount++;
      }
    });
    
    if (cancelledCount > 0) {
      report.average_subscription_length = totalDays / cancelledCount;
    }
    
    // Count referral conversions
    const referralConversionsQuery = await db.collection("referrals")
      .where("status", "==", "completed")
      .where("completedAt", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .where("completedAt", "<=", admin.firestore.Timestamp.fromDate(endDate))
      .count()
      .get();
    
    report.referral_conversions = referralConversionsQuery.data().count;
    
    // Helper function to get plan name by ID
    const getPlanNameById = (planId) => {
      const planMap = {
        "price_basic_monthly": "Basic Monthly",
        "price_premium_monthly": "Premium Monthly",
        "price_premium_yearly": "Premium Annual",
        "unknown": "Unknown Plan"
      };
      return planMap[planId] || "Unknown Plan";
    };
    
    // Helper function to generate revenue by month
    const generateRevenueByMonth = async (start, end, db) => {
      const months = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      // Create a copy of the start date
      const current = new Date(start);
      
      // Generate array of months between start and end
      while (current <= end) {
        months.push({
          month: monthNames[current.getMonth()],
          year: current.getFullYear(),
          revenue: 0
        });
        current.setMonth(current.getMonth() + 1);
      }
      
      try {
        // Get actual revenue data from Firestore
        const revenueData = {};
        
        // Query monthly revenue data
        for (const monthData of months) {
          const monthKey = `${monthData.year}-${String(monthNames.indexOf(monthData.month) + 1).padStart(2, "0")}`;
          const monthlyRevenueDoc = await db.collection("analytics")
            .doc("subscriptions")
            .collection("monthly")
            .doc(monthKey)
            .get();
          
          if (monthlyRevenueDoc.exists) {
            const data = monthlyRevenueDoc.data();
            // Sum up all revenue types (new subscriptions, renewals, etc.)
            let monthRevenue = 0;
            if (data.revenue) {
              monthRevenue = data.revenue;
            } else {
              // If no direct revenue field, try to calculate from other fields
              const newSubRevenue = data.new_subscription_revenue || 0;
              const renewalRevenue = data.renewal_revenue || 0;
              const upgradeRevenue = data.upgrade_revenue || 0;
              monthRevenue = newSubRevenue + renewalRevenue + upgradeRevenue;
            }
            
            revenueData[monthData.month] = monthRevenue / 100; // Convert cents to dollars
          }
        }
        
        // Apply the actual revenue data to our months array
        months.forEach(month => {
          if (revenueData[month.month] !== undefined) {
            month.revenue = revenueData[month.month];
          }
        });
        
        // If we still have no revenue data (e.g., in development), distribute total revenue evenly
        const hasRevenueData = months.some(month => month.revenue > 0);
        if (!hasRevenueData && report.revenue.total > 0) {
          const monthCount = months.length;
          const revenuePerMonth = report.revenue.total / monthCount / 100; // Convert cents to dollars
          
          months.forEach(month => {
            month.revenue = revenuePerMonth;
          });
        }
      } catch (error) {
        console.error("Error getting monthly revenue data:", error);
        // Fallback to even distribution if there's an error
        if (report.revenue.total > 0) {
          const monthCount = months.length;
          const revenuePerMonth = report.revenue.total / monthCount / 100; // Convert cents to dollars
          
          months.forEach(month => {
            month.revenue = revenuePerMonth;
          });
        }
      }
      
      // Return only the month name and revenue for the client
      return months.map(month => ({
        month: month.month,
        revenue: month.revenue
      }));
    };
    
    // Format the report for the client
    const clientReport = {
      activeSubscriptions: totalSubscriptionsAtStart - report.metrics.cancelled_subscriptions,
      totalRevenue: report.revenue.total / 100, // Convert cents to dollars
      averageRevenue: report.revenue.total > 0 && report.metrics.new_subscriptions > 0 ?
        (report.revenue.total / report.metrics.new_subscriptions) / 100 : 0,
      churnRate: report.churn_rate,
      conversionRate: report.conversion_rate,
      
      // Format subscriptions by plan
      subscriptionsByPlan: Object.entries(report.revenue.by_plan).map(([planId, amount]) => {
        const planName = getPlanNameById(planId);
        
        // Calculate count and percentage for each plan
        // In a real implementation, this would be based on actual subscription counts
        const count = Math.round(amount / (report.revenue.total || 1) * report.metrics.new_subscriptions);
        const percentage = report.revenue.total > 0 ?
          Math.round((amount / report.revenue.total) * 100) : 0;
        
        return {
          name: planName,
          count,
          percentage
        };
      }),
      
      // Generate revenue by month with actual data
      revenueByMonth: await generateRevenueByMonth(startDate, endDate, db),
      
      // Subscriptions by status with more accurate data
      subscriptionsByStatus: [
        {
          status: "Active",
          count: totalSubscriptionsAtStart - report.metrics.cancelled_subscriptions,
          percentage: totalSubscriptionsAtStart > 0 ?
            Math.round(((totalSubscriptionsAtStart - report.metrics.cancelled_subscriptions) / totalSubscriptionsAtStart) * 100) : 0
        },
        {
          status: "Canceled",
          count: report.metrics.cancelled_subscriptions,
          percentage: totalSubscriptionsAtStart > 0 ?
            Math.round((report.metrics.cancelled_subscriptions / totalSubscriptionsAtStart) * 100) : 0
        },
        {
          status: "Past Due",
          count: report.metrics.failed_payments || 0,
          percentage: totalSubscriptionsAtStart > 0 ?
            Math.round((report.metrics.failed_payments || 0) / totalSubscriptionsAtStart * 100) : 0
        }
      ]
    };
    
    // Store the full report for admins
    if (isAdmin) {
      const reportRef = db.collection("analytics").doc("subscriptions").collection("reports").doc();
      await reportRef.set({
        ...report,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        generatedBy: userId
      });
      
      return {
        reportId: reportRef.id,
        ...clientReport
      };
    }
    
    return clientReport;
  } catch (error) {
    console.error("Error generating subscription report:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Update subscription metrics
 * @param {FirebaseFirestore.DocumentReference} analyticsRef - Analytics document reference
 * @param {string} metricName - Name of the metric to update
 * @param {number} incrementBy - Amount to increment by
 */
async function updateSubscriptionMetrics(analyticsRef, metricName, incrementBy) {
  // Get the current date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  
  // Update daily metrics
  await analyticsRef.collection("daily").doc(today).set({
    [metricName]: admin.firestore.FieldValue.increment(incrementBy),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  // Update monthly metrics
  const month = today.substring(0, 7); // YYYY-MM
  await analyticsRef.collection("monthly").doc(month).set({
    [metricName]: admin.firestore.FieldValue.increment(incrementBy),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  // Update all-time metrics
  await analyticsRef.set({
    [metricName]: admin.firestore.FieldValue.increment(incrementBy),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

/**
 * Update user subscription status
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} status - Subscription status
 * @param {string|null} planId - Plan ID
 */
async function updateUserSubscriptionStatus(db, userId, status, planId) {
  const userRef = db.collection("users").doc(userId);
  
  const updateData = {
    subscriptionStatus: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  if (planId) {
    updateData.currentPlanId = planId;
  }
  
  if (status === "active" && !planId) {
    // Don't update the plan ID if it's not provided and the status is active
    delete updateData.currentPlanId;
  }
  
  await userRef.update(updateData);
}

// Export the functions
module.exports = {
  trackSubscriptionEvent: exports.trackSubscriptionEvent,
  generateSubscriptionReport: exports.generateSubscriptionReport
};