# FanDuel Affiliate Integration with Micro-Transactions

This document outlines the implementation plan for enhancing the FanDuel affiliate integration with micro-transactions, creating a dual revenue stream model.

## Workflow Overview

1. **Initial State**: User sees "Get Odds" button
2. **Purchase Flow**: User clicks "Get Odds" → prompted to pay via Stripe (in-app micro-transaction)
3. **Post-Purchase**: After successful purchase, the button immediately updates to "Bet Now on FanDuel", dynamically linked with affiliate tracking to FanDuel's specific event

## Implementation Components

### 1. OddsButton Component

Create a dynamic React Native component that changes based on purchase status:

```typescript
// components/OddsButton.tsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet, View } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import * as Linking from 'expo-linking';
import { analyticsService } from '../services/analyticsService';
import { gameUrlService, BettingSite } from '../services/gameUrlService';
import { bettingAffiliateService } from '../services/bettingAffiliateService';
import { useThemeColor } from '../hooks/useThemeColor';
import { colors } from '../styles/theme';

interface OddsButtonProps {
  game: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    fanduelEventId?: string;
  };
  userId: string;
  affiliateId: string;
  hasPurchasedOdds: boolean;
  onPurchaseSuccess?: () => void;
  style?: any;
}

const OddsButton: React.FC<OddsButtonProps> = ({
  game,
  userId,
  affiliateId,
  hasPurchasedOdds,
  onPurchaseSuccess,
  style
}) => {
  const stripe = useStripe();
  const [isPurchased, setIsPurchased] = useState(hasPurchasedOdds);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get theme colors
  const backgroundColor = useThemeColor({ 
    light: isPurchased ? colors.neon.blue : colors.neon.orange, 
    dark: isPurchased ? colors.neon.blue : colors.neon.orange 
  }, 'background');
  
  const textColor = useThemeColor({ 
    light: '#FFFFFF', 
    dark: '#FFFFFF' 
  }, 'text');

  useEffect(() => {
    setIsPurchased(hasPurchasedOdds);
  }, [hasPurchasedOdds]);

  const handleStripePayment = async () => {
    try {
      setIsLoading(true);
      
      // Track analytics event
      analyticsService.trackEvent('odds_purchase_initiated', {
        gameId: game.id,
        userId,
        timestamp: Date.now(),
      });
      
      // Create payment intent on server
      const { data } = await axios.post('https://api.aisportsedge.app/create-payment', {
        userId,
        productId: game.id,
        price: 199, // $1.99 example price
        productName: `Odds for ${game.homeTeam} vs ${game.awayTeam}`,
      });

      const { clientSecret } = data;

      // Initialize payment sheet
      const initSheet = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'AI Sports Edge',
      });

      if (initSheet.error) {
        Alert.alert('Error', initSheet.error.message);
        setIsLoading(false);
        return;
      }

      // Present payment sheet
      const { error } = await stripe.presentPaymentSheet();

      if (error) {
        // Track cancelled payment
        analyticsService.trackEvent('odds_purchase_cancelled', {
          gameId: game.id,
          userId,
          error: error.message,
          timestamp: Date.now(),
        });
        
        Alert.alert('Payment Cancelled', error.message);
      } else {
        // Track successful payment
        analyticsService.trackEvent('odds_purchase_completed', {
          gameId: game.id,
          userId,
          price: 199,
          timestamp: Date.now(),
        });
        
        Alert.alert('Payment Successful', 'You can now view odds!');
        setIsPurchased(true);
        
        // Update Firestore with purchase record
        await updatePurchaseRecord(game.id, userId);
        
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
      }
    } catch (error) {
      // Track payment error
      analyticsService.trackEvent('odds_purchase_error', {
        gameId: game.id,
        userId,
        error: error.message,
        timestamp: Date.now(),
      });
      
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePurchaseRecord = async (gameId: string, userId: string) => {
    try {
      // This would be implemented in a Firebase function or directly using Firestore
      await axios.post('https://api.aisportsedge.app/update-purchase-record', {
        userId,
        gameId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating purchase record:', error);
    }
  };

  const handleFanDuelRedirect = async () => {
    try {
      setIsLoading(true);
      
      // Track affiliate link click
      bettingAffiliateService.trackButtonClick('odds_button', affiliateId, game.id, userId, game.id);
      
      // Get game-specific URL if available
      let baseUrl = 'https://sportsbook.fanduel.com/';
      if (game.fanduelEventId) {
        baseUrl = `https://sportsbook.fanduel.com/event/${game.fanduelEventId}`;
      } else {
        // Try to get URL from GameUrlService
        const gameUrl = await gameUrlService.getGameUrl(game.id, BettingSite.FANDUEL);
        if (gameUrl) {
          baseUrl = gameUrl;
        }
      }
      
      // Generate affiliate link
      const affiliateUrl = await bettingAffiliateService.generateAffiliateLink(
        baseUrl,
        affiliateId,
        null, // No team ID needed as we're using game-specific URL
        userId,
        game.id
      );
      
      // Track conversion
      bettingAffiliateService.trackConversion('odds_to_bet', 0, userId);
      
      // Open URL
      const supported = await Linking.canOpenURL(affiliateUrl);
      if (supported) {
        await Linking.openURL(affiliateUrl);
      } else {
        Alert.alert('Error', 'Unable to open FanDuel. Please try again.');
      }
    } catch (error) {
      console.error('Error redirecting to FanDuel:', error);
      Alert.alert('Error', 'Unable to open FanDuel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        isPurchased ? styles.betButton : styles.oddsButton,
        style
      ]}
      onPress={isPurchased ? handleFanDuelRedirect : handleStripePayment}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>
          {isPurchased ? 'Bet Now on FanDuel' : 'Get Odds'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oddsButton: {
    backgroundColor: colors.neon.orange,
  },
  betButton: {
    backgroundColor: colors.neon.blue,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OddsButton;
```

### 2. Server-Side Payment Processing

Implement a server endpoint to handle Stripe payment intents:

```javascript
// functions/stripePayments.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

// Initialize Firestore
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Create a payment intent for purchasing odds
 */
exports.createPayment = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to make a payment'
    );
  }

  const { userId, productId, price, productName } = data;

  // Validate inputs
  if (!userId || !productId || !price || !productName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        productId,
        productName,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Update purchase record in Firestore
 */
exports.updatePurchaseRecord = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to update purchase records'
    );
  }

  const { userId, gameId, timestamp } = data;

  // Validate inputs
  if (!userId || !gameId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  try {
    // Update purchase record in Firestore
    await db.collection('user_purchases').doc(userId).set(
      {
        [gameId]: {
          hasPurchased: true,
          timestamp: timestamp || new Date().toISOString(),
        },
      },
      { merge: true }
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating purchase record:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Check if user has purchased odds for a specific game
 */
exports.checkPurchaseStatus = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to check purchase status'
    );
  }

  const { userId, gameId } = data;

  // Validate inputs
  if (!userId || !gameId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  try {
    // Get purchase record from Firestore
    const purchaseDoc = await db.collection('user_purchases').doc(userId).get();
    
    if (!purchaseDoc.exists) {
      return { hasPurchased: false };
    }
    
    const purchaseData = purchaseDoc.data();
    return {
      hasPurchased: purchaseData[gameId]?.hasPurchased || false,
      timestamp: purchaseData[gameId]?.timestamp || null,
    };
  } catch (error) {
    console.error('Error checking purchase status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Handle Stripe webhook events
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      endpointSecret
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  
  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { userId, productId } = paymentIntent.metadata;
    
    // Update purchase record in Firestore
    if (userId && productId) {
      try {
        await db.collection('user_purchases').doc(userId).set(
          {
            [productId]: {
              hasPurchased: true,
              timestamp: new Date().toISOString(),
            },
          },
          { merge: true }
        );
        
        console.log(`Purchase record updated for user ${userId}, game ${productId}`);
      } catch (error) {
        console.error('Error updating purchase record from webhook:', error);
      }
    }
  }
  
  res.status(200).send({ received: true });
});
```

### 3. Firestore Database Structure

Set up the following Firestore collection to track user purchases:

```
user_purchases (collection)
  |
  └── userId (document)
       |
       └── gameId (field - map)
            |
            ├── hasPurchased: true
            └── timestamp: "2025-03-17T14:25:00Z"
```

### 4. Integration with Game Screens

Update the game detail screens to use the OddsButton component:

```typescript
// screens/GameDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import OddsButton from '../components/OddsButton';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

const GameDetailScreen = () => {
  const route = useRoute();
  const { game } = route.params;
  const { user } = useAuth();
  const [hasPurchasedOdds, setHasPurchasedOdds] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user has purchased odds for this game
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user) return;
      
      try {
        const checkStatus = httpsCallable(functions, 'checkPurchaseStatus');
        const result = await checkStatus({
          userId: user.uid,
          gameId: game.id,
        });
        
        setHasPurchasedOdds(result.data.hasPurchased);
      } catch (error) {
        console.error('Error checking purchase status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPurchaseStatus();
  }, [user, game.id]);
  
  const handlePurchaseSuccess = () => {
    setHasPurchasedOdds(true);
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* Game details */}
      <View style={styles.header}>
        <Text style={styles.title}>{game.homeTeam} vs {game.awayTeam}</Text>
        <Text style={styles.subtitle}>{game.date} • {game.time}</Text>
      </View>
      
      {/* Game stats and information */}
      <View style={styles.statsContainer}>
        {/* ... game stats ... */}
      </View>
      
      {/* Odds button */}
      {!isLoading && (
        <View style={styles.oddsButtonContainer}>
          <OddsButton
            game={game}
            userId={user?.uid || 'anonymous'}
            affiliateId="YOUR_AFFILIATE_ID"
            hasPurchasedOdds={hasPurchasedOdds}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        </View>
      )}
      
      {/* Show odds if purchased */}
      {hasPurchasedOdds && (
        <View style={styles.oddsContainer}>
          <Text style={styles.oddsTitle}>Betting Odds</Text>
          <View style={styles.oddsRow}>
            <Text style={styles.teamName}>{game.homeTeam}</Text>
            <Text style={styles.odds}>{game.homeOdds}</Text>
          </View>
          <View style={styles.oddsRow}>
            <Text style={styles.teamName}>{game.awayTeam}</Text>
            <Text style={styles.odds}>{game.awayOdds}</Text>
          </View>
          <View style={styles.oddsRow}>
            <Text style={styles.teamName}>Over/Under</Text>
            <Text style={styles.odds}>{game.overUnder}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  oddsButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    alignItems: 'center',
  },
  oddsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  oddsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  oddsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  teamName: {
    fontSize: 16,
  },
  odds: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GameDetailScreen;
```

### 5. Stripe Integration Setup

1. Install the necessary packages:

```bash
npm install @stripe/stripe-react-native
```

2. Initialize Stripe in your App.tsx:

```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

// Inside your App component
return (
  <StripeProvider
    publishableKey="YOUR_PUBLISHABLE_KEY"
    merchantIdentifier="merchant.com.aisportsedge"
  >
    {/* Rest of your app */}
  </StripeProvider>
);
```

3. Configure Firebase Functions for Stripe:

```bash
firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY" stripe.webhook_secret="YOUR_WEBHOOK_SECRET"
```

## Benefits of This Implementation

1. **Dual Revenue Streams**:
   - Direct revenue from micro-transactions
   - Affiliate commission from FanDuel

2. **Enhanced User Experience**:
   - Clear value proposition (pay for odds, bet for free)
   - Seamless transition from purchase to betting

3. **Improved Tracking**:
   - Complete purchase funnel analytics
   - Detailed conversion tracking

4. **Automated Process**:
   - No manual updating required
   - Scales automatically with new games

## Implementation Timeline

1. **Week 1**: Set up Stripe integration and payment processing
2. **Week 2**: Implement OddsButton component and Firestore structure
3. **Week 3**: Integrate with game screens and test purchase flow
4. **Week 4**: Test FanDuel affiliate links and optimize conversion

## Testing Plan

1. **Unit Tests**:
   - Test OddsButton component rendering in both states
   - Test purchase record updates in Firestore

2. **Integration Tests**:
   - Test complete purchase flow with Stripe test cards
   - Test affiliate link generation with game IDs

3. **End-to-End Tests**:
   - Complete purchase and verify button state change
   - Click "Bet Now" and verify redirect to FanDuel

## Monitoring and Analytics

1. **Key Metrics to Track**:
   - Odds purchase conversion rate
   - FanDuel click-through rate
   - Revenue per user
   - Affiliate commission earned

2. **Dashboard Setup**:
   - Create Firebase Analytics dashboard for purchase metrics
   - Set up FanDuel affiliate dashboard integration

## Conclusion

This implementation creates a powerful dual revenue stream by combining micro-transactions with affiliate marketing. Users get immediate value from purchasing odds, and the app earns both direct revenue and affiliate commission when users place bets on FanDuel.

The automated nature of this system ensures scalability with minimal maintenance, while the seamless user experience maximizes conversion at each step of the funnel.