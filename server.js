// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const { exec } = require('child_process');
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
    json: () => (req, res, next) => next()
  };
}

// Try to load Firebase Admin SDK
try {
  admin = require('firebase-admin');
  
  try {
    const serviceAccount = require('./firebase-config/service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
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
  rssRoutes = require('./api/rssFeeds');
  console.log('RSS feed routes loaded successfully');
} catch (error) {
  console.warn('RSS feed routes not loaded:', error.message);
  rssRoutes = null;
}

// Use RSS feed routes if available
if (rssRoutes) {
  app.use('/api/rss-feeds', rssRoutes);
  console.log('RSS feed routes registered at /api/rss-feeds');
}

// Import authentication middleware
let authMiddleware;
try {
  authMiddleware = require('./middleware/authMiddleware');
  console.log('Authentication middleware loaded successfully');
} catch (error) {
  console.warn('Authentication middleware not loaded:', error.message);
  authMiddleware = {
    authenticate: (req, res, next) => next(),
    requireAdmin: (req, res, next) => next()
  };
}

// Import tax API routes
let taxApi;
try {
  taxApi = require('./api/tax-api');
  console.log('Tax API routes loaded successfully');
} catch (error) {
  console.warn('Tax API routes not loaded:', error.message);
  taxApi = null;
}

// Use tax API routes if available
if (taxApi) {
  // Secure tax calculation endpoint with authentication
  app.post('/api/tax/calculate', authMiddleware.authenticate, taxApi.calculateTax);
  
  // Tax rates endpoint is less sensitive, but still authenticated
  app.get('/api/tax/rates', authMiddleware.authenticate, taxApi.getTaxRates);
  
  // Admin-only endpoint for tax reporting
  app.get('/api/tax/reports', authMiddleware.requireAdmin, (req, res) => {
    // This would be implemented with the tax report generator
    res.json({ message: 'Tax reports endpoint (admin only)' });
  });
  
  console.log('Tax API routes registered with authentication');
}

// Import and start RSS feed cron job
try {
  const { startRssFeedCronJob } = require('./jobs/rssFeedCronJob.js');
  startRssFeedCronJob();
  console.log('RSS feed cron job started');
} catch (error) {
  console.warn('RSS feed cron job not started:', error.message);
}

// Import payment service
let paymentService;
try {
  paymentService = require('./services/paymentService');
  console.log('Payment service loaded successfully');
} catch (error) {
  console.warn('Payment service not loaded:', error.message);
  paymentService = null;
}

// API endpoints
app.post('/api/create-payment', async (req, res) => {
  try {
    const { userId, productId, price, productName, customerDetails, currency = 'usd', metadata = {} } = req.body;
    
    if (!userId || !productId || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get client IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // If payment service is available, use it to create a payment intent with US-only restrictions
    if (paymentService) {
      try {
        // Validate customer is in the US
        if (!customerDetails || !paymentService.isCustomerInUS(customerDetails, ipAddress)) {
          return res.status(403).json({ error: 'Payments are only accepted from the United States' });
        }
        
        // Create payment intent
        const paymentIntent = await paymentService.createPaymentIntent({
          amount: Math.round(price * 100), // Convert to cents
          currency,
          customerDetails,
          ipAddress,
          customerId: userId,
          metadata: {
            ...metadata,
            productId,
            productName
          }
        });
        
        // Log the payment attempt
        console.log(`Payment intent created for ${productName} (${productId}) by user ${userId} for $${price}`);
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (paymentError) {
        console.error('Payment service error:', paymentError);
        res.status(400).json({ error: paymentError.message });
      }
    } else {
      // Fallback to simulated payment for development
      console.log('Using simulated payment (payment service not available)');
      
      // Generate a fake client secret
      const clientSecret = `pi_${Math.random().toString(36).substring(2)}_secret_${Math.random().toString(36).substring(2)}`;
      
      // Log the payment attempt
      console.log(`Payment intent created for ${productName} (${productId}) by user ${userId} for $${price}`);
      
      res.json({ clientSecret });
    }
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
    console.log(`Purchase recorded for game ${gameId} by user ${userId} on ${platform} at ${timestamp}`);
    
    // Update Firebase if available
    if (admin && admin.apps && admin.apps.length > 0) {
      const db = admin.firestore();
      
      // Update user document
      await db.collection('users').doc(userId).set({
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      // Add purchase record
      await db.collection('users').doc(userId).collection('purchasedOdds').doc(gameId).set({
        timestamp: new Date(timestamp).getTime(),
        platform,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
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
        const purchasedOddsQuery = await db.collection('users')
          .doc(userId)
          .collection('purchasedOdds')
          .where('timestamp', '>', parseInt(lastSync, 10))
          .get();
        
        const purchasedOdds = [];
        
        purchasedOddsQuery.forEach((doc) => {
          purchasedOdds.push({
            gameId: doc.id,
            ...doc.data()
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
            style: 'default'
          },
          affiliateEnabled: true,
          affiliateCode: '',
          lastUpdated: Date.now(),
          lastPlatform: 'web'
        }
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
      await db.collection('users').doc(userId).set({
        userPreferences,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      // Update purchased odds
      if (purchasedOdds && purchasedOdds.length > 0) {
        for (const purchase of purchasedOdds) {
          await db.collection('users').doc(userId).collection('purchasedOdds').doc(purchase.gameId).set({
            timestamp: purchase.timestamp,
            platform: purchase.platform,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
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

// Special route for US-only payment test page
app.get('/test-us-payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-us-payment.html'));
});

// Special route for fixed about page
app.get('/fixed-about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fixed-about.html'));
});

// Admin dashboard routes
app.get('/admin/tax-dashboard', authMiddleware.requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'tax-dashboard.html'));
});

// Admin API endpoints
app.get('/api/admin/monitoring', authMiddleware.requireAdmin, (req, res) => {
  try {
    const monitoringService = require('./services/monitoringService');
    const data = monitoringService.getMonitoringSummary();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get monitoring data' });
  }
});

app.get('/api/admin/tax-settings', authMiddleware.requireAdmin, (req, res) => {
  try {
    const stripeTaxConfig = require('./utils/stripeTaxConfig');
    const data = stripeTaxConfig.getConfig();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get tax settings' });
  }
});

app.post('/api/admin/generate-report', authMiddleware.requireAdmin, (req, res) => {
  try {
    const { type, startDate, endDate, format } = req.body;
    
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // This would be handled asynchronously in a real implementation
    res.json({
      success: true,
      message: 'Report generation started',
      reportId: `report_${Date.now()}`,
      status: 'pending'
    });
    
    // In a real implementation, this would be a background job
    setTimeout(() => {
      console.log(`Generated ${type} report from ${startDate} to ${endDate} in ${format} format`);
    }, 100);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// Serve the index.html file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
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
            date: new Date().toISOString()
          },
          {
            home_team_name: 'Team C',
            away_team_name: 'Team D',
            ensemble_prediction: 0,
            ensemble_probability: 0.35,
            home_odds: 2.2,
            away_odds: 1.7,
            date: new Date().toISOString()
          }
        ]
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
            away_value: 0
          }
        ]
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
              roc_auc: 0.78
            }
          },
          gradient_boosting: {
            evaluation: {
              accuracy: 0.74,
              precision: 0.77,
              recall: 0.70,
              f1: 0.73,
              roc_auc: 0.80
            }
          },
          logistic_regression: {
            evaluation: {
              accuracy: 0.68,
              precision: 0.70,
              recall: 0.65,
              f1: 0.67,
              roc_auc: 0.73
            }
          }
        }
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
      details: stdout
    });
  });
});
