const functions = require('firebase-functions');
const admin = require('firebase-admin');
const notificationService = require('./notificationService');

/**
 * Trigger notification when new predictions are available
 */
exports.sendPredictionNotifications = functions.firestore
  .document('predictions/{predictionId}')
  .onCreate(async (snapshot, context) => {
    const prediction = snapshot.data();
    
    // Get users who are interested in this sport
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where(`preferences.sports.${prediction.sport}`, '==', true)
      .where('preferences.notifications.predictions', '==', true)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('No users found for prediction notification');
      return null;
    }
    
    // Get user IDs
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    console.log(`Sending prediction notification to ${userIds.length} users`);
    
    // Send notification
    return notificationService.sendToUsers({
      title: 'New Prediction Available',
      message: `Check out our prediction for ${prediction.homeTeam} vs ${prediction.awayTeam}`,
      data: {
        predictionId: context.params.predictionId,
        sport: prediction.sport,
        screen: 'Odds'
      },
      userIds
    });
  });

/**
 * Trigger notification for value betting opportunities
 */
exports.sendValueBetNotifications = functions.firestore
  .document('valueBets/{betId}')
  .onCreate(async (snapshot, context) => {
    const valueBet = snapshot.data();
    
    // Only send notifications for high-value bets
    if (valueBet.value < 0.1) { // 10% edge
      console.log(`Value bet ${context.params.betId} has low value (${valueBet.value}), skipping notification`);
      return null;
    }
    
    // Get premium users
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('subscription.status', '==', 'active')
      .where('subscription.plan', 'in', ['pro', 'elite'])
      .where(`preferences.sports.${valueBet.sport}`, '==', true)
      .where('preferences.notifications.valueBets', '==', true)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('No premium users found for value bet notification');
      return null;
    }
    
    // Get user IDs
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    console.log(`Sending value bet notification to ${userIds.length} premium users`);
    
    // Send notification
    return notificationService.sendToUsers({
      title: 'Value Betting Opportunity',
      message: `We've identified a ${Math.round(valueBet.value * 100)}% edge on ${valueBet.team}`,
      data: {
        betId: context.params.betId,
        sport: valueBet.sport,
        screen: 'Odds'
      },
      userIds
    });
  });

/**
 * Trigger notification for game start reminders
 */
exports.sendGameStartReminders = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async (context) => {
    // Get games starting in the next 30 minutes
    const now = admin.firestore.Timestamp.now();
    const thirtyMinutesFromNow = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 30 * 60 * 1000
    );
    
    const gamesSnapshot = await admin.firestore()
      .collection('games')
      .where('startTime', '>', now)
      .where('startTime', '<=', thirtyMinutesFromNow)
      .get();
    
    if (gamesSnapshot.empty) {
      console.log('No games starting in the next 30 minutes');
      return null;
    }
    
    console.log(`Found ${gamesSnapshot.size} games starting in the next 30 minutes`);
    
    // Process each game
    const promises = gamesSnapshot.docs.map(async (doc) => {
      const game = doc.data();
      
      // Get users interested in this game
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where(`preferences.sports.${game.sport}`, '==', true)
        .where('preferences.notifications.gameReminders', '==', true)
        .get();
      
      if (usersSnapshot.empty) {
        console.log(`No users found for game reminder: ${game.homeTeam} vs ${game.awayTeam}`);
        return null;
      }
      
      // Get user IDs
      const userIds = usersSnapshot.docs.map(doc => doc.id);
      
      console.log(`Sending game reminder to ${userIds.length} users for ${game.homeTeam} vs ${game.awayTeam}`);
      
      // Send notification
      return notificationService.sendToUsers({
        title: 'Game Starting Soon',
        message: `${game.homeTeam} vs ${game.awayTeam} starts in 30 minutes`,
        data: {
          gameId: doc.id,
          sport: game.sport,
          screen: 'Odds'
        },
        userIds
      });
    });
    
    return Promise.all(promises);
  });

/**
 * Send weekly model performance updates
 */
exports.sendModelPerformanceUpdates = functions.pubsub
  .schedule('every monday 09:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Calculate model performance for the past week
    const oneWeekAgo = admin.firestore.Timestamp.fromMillis(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    
    const predictionsSnapshot = await admin.firestore()
      .collection('predictions')
      .where('timestamp', '>=', oneWeekAgo)
      .get();
    
    if (predictionsSnapshot.empty) {
      console.log('No predictions found for the past week');
      return null;
    }
    
    // Calculate performance metrics
    const predictions = predictionsSnapshot.docs.map(doc => doc.data());
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.result === 'correct').length;
    const accuracy = (correctPredictions / totalPredictions) * 100;
    
    // Group by sport
    const sportPerformance = {};
    predictions.forEach(p => {
      if (!sportPerformance[p.sport]) {
        sportPerformance[p.sport] = {
          total: 0,
          correct: 0
        };
      }
      
      sportPerformance[p.sport].total++;
      if (p.result === 'correct') {
        sportPerformance[p.sport].correct++;
      }
    });
    
    // Format performance message
    let performanceMessage = `Overall accuracy: ${accuracy.toFixed(1)}% (${correctPredictions}/${totalPredictions})`;
    
    Object.entries(sportPerformance).forEach(([sport, data]) => {
      const sportAccuracy = (data.correct / data.total) * 100;
      performanceMessage += `\n${sport}: ${sportAccuracy.toFixed(1)}% (${data.correct}/${data.total})`;
    });
    
    console.log('Weekly model performance:', performanceMessage);
    
    // Get users who want model performance updates
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('preferences.notifications.modelPerformance', '==', true)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('No users found for model performance notification');
      return null;
    }
    
    // Get user IDs
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    console.log(`Sending model performance update to ${userIds.length} users`);
    
    // Send notification
    return notificationService.sendToUsers({
      title: 'Weekly Model Performance Update',
      message: performanceMessage,
      data: {
        screen: 'PersonalizedHome'
      },
      userIds
    });
  });