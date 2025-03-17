const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Update the referral leaderboard
 * This function runs on a schedule (daily at midnight)
 */
exports.updateReferralLeaderboard = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      
      // Get all users with referral counts
      const usersSnapshot = await db.collection('users')
        .where('referralCount', '>', 0)
        .get();
      
      if (usersSnapshot.empty) {
        console.log('No users with referrals found');
        return null;
      }
      
      // Extract user data
      const users = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          userId: doc.id,
          referralCount: userData.referralCount || 0,
          displayName: userData.displayName || 'Anonymous User',
          leaderboardPrivacy: userData.leaderboardPrivacy || 'public'
        });
      });
      
      // Sort users by referral count (descending)
      users.sort((a, b) => b.referralCount - a.referralCount);
      
      // Assign ranks
      users.forEach((user, index) => {
        user.rank = index + 1;
        
        // Determine badge type based on referral count
        if (user.referralCount >= 20) {
          user.badgeType = 'hall-of-fame';
        } else if (user.referralCount >= 10) {
          user.badgeType = 'elite';
        } else {
          user.badgeType = 'rookie';
        }
      });
      
      // Determine time periods
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
      
      // Create leaderboard entries
      const batch = db.batch();
      
      // Clear existing leaderboards
      const weeklyLeaderboardRef = db.collection('leaderboards').doc('weekly');
      const monthlyLeaderboardRef = db.collection('leaderboards').doc('monthly');
      const allTimeLeaderboardRef = db.collection('leaderboards').doc('allTime');
      
      batch.set(weeklyLeaderboardRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        startDate: admin.firestore.Timestamp.fromDate(weekStart),
        endDate: admin.firestore.Timestamp.fromDate(now)
      });
      
      batch.set(monthlyLeaderboardRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        startDate: admin.firestore.Timestamp.fromDate(monthStart),
        endDate: admin.firestore.Timestamp.fromDate(now)
      });
      
      batch.set(allTimeLeaderboardRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Add users to leaderboards
      for (const user of users) {
        // Skip users who have opted out
        if (user.leaderboardPrivacy === 'private') {
          continue;
        }
        
        // Anonymize usernames for those who prefer it
        const displayName = user.leaderboardPrivacy === 'anonymous' 
          ? `User${user.userId.substring(0, 4)}` 
          : user.displayName;
        
        // Add to all-time leaderboard
        const allTimeEntryRef = allTimeLeaderboardRef.collection('entries').doc(user.userId);
        batch.set(allTimeEntryRef, {
          userId: user.userId,
          displayName,
          referralCount: user.referralCount,
          rank: user.rank,
          badgeType: user.badgeType,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Add to weekly and monthly leaderboards
        // In a real implementation, you would filter based on referrals within the time period
        // For this example, we'll use the same data for simplicity
        const weeklyEntryRef = weeklyLeaderboardRef.collection('entries').doc(user.userId);
        const monthlyEntryRef = monthlyLeaderboardRef.collection('entries').doc(user.userId);
        
        batch.set(weeklyEntryRef, {
          userId: user.userId,
          displayName,
          referralCount: user.referralCount,
          rank: user.rank,
          badgeType: user.badgeType,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        batch.set(monthlyEntryRef, {
          userId: user.userId,
          displayName,
          referralCount: user.referralCount,
          rank: user.rank,
          badgeType: user.badgeType,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Updated leaderboards with ${users.length} users`);
      return { success: true, usersProcessed: users.length };
    } catch (error) {
      console.error('Error updating referral leaderboard:', error);
      return null;
    }
  });

// Export the functions
module.exports = {
  updateReferralLeaderboard: exports.updateReferralLeaderboard
};