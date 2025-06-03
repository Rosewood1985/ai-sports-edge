const { exec } = require('child_process');
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Optional dependencies
let admin;
let bodyParser;

// Try to load body-parser
try {
  bodyParser = require('body-parser');
} catch (error) {
  console.warn('body-parser not installed, API endpoints will not work properly');
  bodyParser = {
    json: () => (req, res, next) => next(),
  };
}

// Try to load Firebase Admin SDK
try {
  admin = require('firebase-admin');

  try {
    const serviceAccount = require('./firebase-config/service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized');
  } catch (serviceAccountError) {
    console.warn('Firebase service account not found:', serviceAccountError.message);
    console.log('Running in development mode without Firebase');
  }
} catch (adminError) {
  console.warn('firebase-admin not installed, running in development mode');
  admin = null;
}
// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Import RSS feed routes
let rssRoutes;
try {
  rssRoutes = require('./api/rssFeeds/rssRoutes.js').default;
  console.log('RSS feed routes loaded successfully');
} catch (error) {
  console.warn('RSS feed routes not loaded:', error.message);
  rssRoutes = null;
}

// Use RSS feed routes if available
if (rssRoutes) {
  app.use('/api/rss', rssRoutes);
  console.log('RSS feed routes registered at /api/rss');
}

// Import and start RSS feed cron job
try {
  const { startRssFeedCronJob } = require('./jobs/rssFeedCronJob.js');
  startRssFeedCronJob();
  console.log('RSS feed cron job started');
} catch (error) {
  console.warn('RSS feed cron job not started:', error.message);
}

// Import odds routes
let oddsRoutes;
try {
  // Since odds routes are using ES modules, we need to use dynamic import
  import('./api/routes/odds.js')
    .then(module => {
      oddsRoutes = module.default;
      // Use odds routes
      app.use('/api/odds', oddsRoutes);
      console.log('Odds routes registered at /api/odds');
    })
    .catch(error => {
      console.warn('Odds routes not loaded:', error.message);
    });
} catch (error) {
  console.warn('Odds routes not loaded:', error.message);
}

// API endpoints
app.post('/api/create-payment', async (req, res) => {
  try {
    const { userId, productId, price, productName } = req.body;

    if (!userId || !productId || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In a real app, this would create a payment intent with Stripe
    // For now, we'll just simulate a successful payment

    // Generate a fake client secret
    const clientSecret = `pi_${Math.random().toString(36).substring(2)}_secret_${Math.random().toString(36).substring(2)}`;

    // Log the payment attempt
    console.log(
      `Payment intent created for ${productName} (${productId}) by user ${userId} for $${price}`
    );

    res.json({ clientSecret });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.post('/api/update-purchase', async (req, res) => {
  try {
    const { userId, gameId, timestamp, platform = 'web' } = req.body;

    if (!userId || !gameId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log the purchase
    console.log(
      `Purchase recorded for game ${gameId} by user ${userId} on ${platform} at ${timestamp}`
    );

    // Update Firebase if available
    if (admin && admin.apps && admin.apps.length > 0) {
      const db = admin.firestore();

      // Update user document
      await db.collection('users').doc(userId).set(
        {
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Add purchase record
      await db
        .collection('users')
        .doc(userId)
        .collection('purchasedOdds')
        .doc(gameId)
        .set(
          {
            timestamp: new Date(timestamp).getTime(),
            platform,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      console.log(`Purchase record saved to Firebase for game ${gameId} by user ${userId}`);
    } else {
      console.log('Firebase not available, purchase record saved only in local storage');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating purchase record:', error);
    res.status(500).json({ error: 'Failed to update purchase record' });
  }
});

// API endpoint to get user data
app.get('/api/user-data', async (req, res) => {
  try {
    const { userId, lastSync } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If Firebase is available, get data from there
    if (admin && admin.apps && admin.apps.length > 0) {
      const db = admin.firestore();

      // Get user document
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return res.json(null);
      }

      const userData = userDoc.data();

      // Get purchased odds that were updated after last sync
      if (lastSync) {
        const purchasedOddsQuery = await db
          .collection('users')
          .doc(userId)
          .collection('purchasedOdds')
          .where('timestamp', '>', parseInt(lastSync, 10))
          .get();

        const purchasedOdds = [];

        purchasedOddsQuery.forEach(doc => {
          purchasedOdds.push({
            gameId: doc.id,
            ...doc.data(),
          });
        });

        userData.purchasedOdds = purchasedOdds;
      }

      return res.json(userData);
    } else {
      // If Firebase is not available, return empty data
      // In a real app, this would use a database
      return res.json({
        purchasedOdds: [],
        userPreferences: {
          favoriteTeams: [],
          primaryTeam: '',
          buttonSettings: {
            size: 'medium',
            animation: 'pulse',
            position: 'inline',
            style: 'default',
          },
          affiliateEnabled: true,
          affiliateCode: '',
          lastUpdated: Date.now(),
          lastPlatform: 'web',
        },
      });
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// API endpoint to update user data
app.post('/api/update-user-data', async (req, res) => {
  try {
    const { userId, purchasedOdds, userPreferences } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log the update
    console.log(`User data update for user ${userId}`);

    // Update Firebase if available
    if (admin && admin.apps && admin.apps.length > 0) {
      const db = admin.firestore();

      // Update user document
      await db.collection('users').doc(userId).set(
        {
          userPreferences,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Update purchased odds
      if (purchasedOdds && purchasedOdds.length > 0) {
        for (const purchase of purchasedOdds) {
          await db
            .collection('users')
            .doc(userId)
            .collection('purchasedOdds')
            .doc(purchase.gameId)
            .set(
              {
                timestamp: purchase.timestamp,
                platform: purchase.platform,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
        }
      }

      console.log(`User data saved to Firebase for user ${userId}`);
    } else {
      console.log('Firebase not available, user data saved only in local storage');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ error: 'Failed to update user data' });
  }
});

// Special route for test payment page
app.get('/test-payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-payment.html'));
});

// Special route for fixed about page
app.get('/fixed-about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fixed-about.html'));
});

// ML Sports Edge API endpoints
app.get('/api/ml-sports-edge/predictions', (req, res) => {
  const { sport, league } = req.query;

  // Execute the ML Sports Edge script to get predictions
  const command = `./scripts/run-ml-sports-edge.sh --predictions --sport ${sport} --league ${league}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ML Sports Edge script: ${error}`);
      return res.status(500).json({ error: 'Failed to get predictions' });
    }

    // Parse the output to extract predictions
    // This is a simplified example - you would need to parse the actual output format
    try {
      // For now, return mock data
      return res.json({
        predictions: [
          {
            home_team_name: 'Team A',
            away_team_name: 'Team B',
            ensemble_prediction: 1,
            ensemble_probability: 0.75,
            home_odds: 1.5,
            away_odds: 2.5,
            date: new Date().toISOString(),
          },
          {
            home_team_name: 'Team C',
            away_team_name: 'Team D',
            ensemble_prediction: 0,
            ensemble_probability: 0.35,
            home_odds: 2.2,
            away_odds: 1.7,
            date: new Date().toISOString(),
          },
        ],
      });
    } catch (e) {
      console.error(`Error parsing predictions: ${e}`);
      return res.status(500).json({ error: 'Failed to parse predictions' });
    }
  });
});

app.get('/api/ml-sports-edge/value_bets', (req, res) => {
  const { sport, league } = req.query;

  // Execute the ML Sports Edge script to get value bets
  const command = `./scripts/run-ml-sports-edge.sh --predictions --sport ${sport} --league ${league}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ML Sports Edge script: ${error}`);
      return res.status(500).json({ error: 'Failed to get value bets' });
    }

    // Parse the output to extract value bets
    // This is a simplified example - you would need to parse the actual output format
    try {
      // For now, return mock data
      return res.json({
        value_bets: [
          {
            home_team_name: 'Team A',
            away_team_name: 'Team B',
            home_odds: 1.5,
            away_odds: 2.5,
            home_value_bet: true,
            away_value_bet: false,
            ensemble_probability: 0.75,
            home_value: 0.15,
            away_value: 0,
          },
        ],
      });
    } catch (e) {
      console.error(`Error parsing value bets: ${e}`);
      return res.status(500).json({ error: 'Failed to parse value bets' });
    }
  });
});

app.get('/api/ml-sports-edge/models', (req, res) => {
  const { sport } = req.query;

  // Execute the ML Sports Edge script to get model information
  const command = `./scripts/run-ml-sports-edge.sh --sport ${sport} --predictions`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ML Sports Edge script: ${error}`);
      return res.status(500).json({ error: 'Failed to get model information' });
    }

    // Parse the output to extract model information
    // This is a simplified example - you would need to parse the actual output format
    try {
      // For now, return mock data
      return res.json({
        models: {
          random_forest: {
            evaluation: {
              accuracy: 0.72,
              precision: 0.75,
              recall: 0.68,
              f1: 0.71,
              roc_auc: 0.78,
            },
          },
          gradient_boosting: {
            evaluation: {
              accuracy: 0.74,
              precision: 0.77,
              recall: 0.7,
              f1: 0.73,
              roc_auc: 0.8,
            },
          },
          logistic_regression: {
            evaluation: {
              accuracy: 0.68,
              precision: 0.7,
              recall: 0.65,
              f1: 0.67,
              roc_auc: 0.73,
            },
          },
        },
      });
    } catch (e) {
      console.error(`Error parsing model information: ${e}`);
      return res.status(500).json({ error: 'Failed to parse model information' });
    }
  });
});

app.post('/api/ml-sports-edge/run_pipeline', (req, res) => {
  const { sport, league, target, train } = req.body;

  // Execute the ML Sports Edge script to run the pipeline
  const trainFlag = train ? '--train' : '';
  const command = `./scripts/run-ml-sports-edge.sh --sport ${sport} --league ${league} --target ${target || 'home_team_winning'} ${trainFlag}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ML Sports Edge script: ${error}`);
      return res.status(500).json({ error: 'Failed to run pipeline' });
    }

    // Return success response
    return res.json({
      success: true,
      message: 'Pipeline executed successfully',
      details: stdout,
    });
  });
});

// Serve the index.html file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
