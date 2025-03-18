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
    console.log(`Payment intent created for ${productName} (${productId}) by user ${userId} for $${price}`);
    
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

// Special route for fixed about page
app.get('/fixed-about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fixed-about.html'));
});

// Serve the index.html file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});