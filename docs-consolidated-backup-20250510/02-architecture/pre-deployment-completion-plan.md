# Pre-Deployment Completion Plan

This document outlines the remaining tasks that need to be completed before the AI Sports Edge web app and iOS app can be deployed to customers.

## 1. Subscription Features

### 1.1 Gift Subscription Flow (COMPLETED)
- ✅ Backend implementation (Firebase Cloud Functions)
- ✅ Frontend implementation (GiftRedemptionScreen.tsx)
- ✅ Testing and validation

### 1.2 Subscription Bundles (TO BE IMPLEMENTED)

#### Backend Implementation
- [ ] Define bundle structure in `config/stripe.ts` and `services/firebaseSubscriptionService.ts`
```typescript
// Add to SUBSCRIPTION_PLANS array in firebaseSubscriptionService.ts
{
  id: 'premium-bundle-monthly',
  name: 'Premium Bundle',
  description: 'All premium features at a discounted price',
  price: 19.99,
  amount: 1999, // For backward compatibility (in cents)
  interval: 'month',
  productType: 'subscription',
  priceId: 'price_premium_bundle_monthly', // Replace with actual Stripe price ID
  features: [
    'All Premium features',
    'Enhanced Player Statistics',
    'Advanced Analytics',
    'AI Sports News',
    'Personalized Notifications',
    'Save 20% compared to individual subscriptions'
  ]
}
```

- [ ] Create Stripe products and prices for bundles
```javascript
// In Firebase function
const product = await stripe.products.create({
  name: 'Premium Bundle',
  description: 'All premium features at a discounted price'
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 1999, // $19.99
  currency: 'usd',
  recurring: {
    interval: 'month'
  },
  metadata: {
    type: 'subscription_bundle'
  }
});
```

- [ ] Implement access control for bundle subscribers
```typescript
// Add to firebaseSubscriptionService.ts
export const hasBundleAccess = async (userId: string): Promise<boolean> => {
  try {
    // Get user subscription
    const subscription = await getUserSubscription(userId);
    
    // Check if subscription is a bundle
    return subscription && 
      subscription.status === 'active' && 
      (subscription.planId === 'premium-bundle-monthly' || 
       subscription.planId === 'premium-bundle-yearly');
  } catch (error) {
    console.error('Error checking bundle access:', error);
    return false;
  }
};
```

#### Frontend Implementation
- [ ] Update SubscriptionScreen.tsx to display bundle options
```jsx
// Add to the SUBSCRIPTION_PLANS mapping in SubscriptionScreen.tsx
<View style={styles.bundleCard}>
  <Text style={styles.bundleTitle}>Premium Bundle</Text>
  <Text style={styles.bundlePrice}>$19.99/month</Text>
  <Text style={styles.bundleDescription}>
    Get all premium features at a discounted price
  </Text>
  <View style={styles.bundleFeatures}>
    {bundleFeatures.map((feature, index) => (
      <View key={index} style={styles.featureItem}>
        <Ionicons name="checkmark-circle" size={16} color="#0a7ea4" />
        <Text style={styles.featureText}>{feature}</Text>
      </View>
    ))}
  </View>
  <TouchableOpacity
    style={styles.subscribeButton}
    onPress={() => handleSelectPlan('premium-bundle-monthly')}
  >
    <Text style={styles.buttonText}>Subscribe</Text>
  </TouchableOpacity>
</View>
```

- [ ] Create bundle detail screen
```jsx
// Create BundleDetailScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BundleDetailScreen = () => {
  const navigation = useNavigation();
  
  const bundleFeatures = [
    'All Premium features',
    'Enhanced Player Statistics',
    'Advanced Analytics',
    'AI Sports News',
    'Personalized Notifications',
    'Save 20% compared to individual subscriptions'
  ];
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Premium Bundle</Text>
      <Text style={styles.price}>$19.99/month</Text>
      <Text style={styles.description}>
        Get all premium features at a discounted price
      </Text>
      
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Included Features:</Text>
        {bundleFeatures.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color="#0a7ea4" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={() => navigation.navigate('Payment', { planId: 'premium-bundle-monthly' })}
      >
        <Text style={styles.buttonText}>Subscribe Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Styles here
});

export default BundleDetailScreen;
```

- [ ] Update navigation to include bundle detail screen
```jsx
// In App.tsx or navigation file
<Stack.Screen
  name="BundleDetail"
  component={BundleDetailScreen}
  options={{
    title: "PREMIUM BUNDLE",
    headerBackTitle: "Back"
  }}
/>
```

### 1.3 Usage-Based Billing (TO BE IMPLEMENTED)

#### Backend Implementation
- [ ] Define metered features in `services/firebaseSubscriptionService.ts`
```typescript
// Add to firebaseSubscriptionService.ts
export const METERED_FEATURES = {
  PREMIUM_PREDICTIONS: {
    id: 'premium-predictions',
    name: 'Premium Predictions',
    description: 'AI-powered premium predictions',
    basePrice: 500, // $5.00 base price
    unitPrice: 50, // $0.50 per prediction
  },
  ADVANCED_ANALYTICS: {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'In-depth analytics and insights',
    basePrice: 300, // $3.00 base price
    unitPrice: 25, // $0.25 per analysis
  }
};
```

- [ ] Implement usage tracking service
```typescript
// Create services/usageTrackingService.ts
import { firestore } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Track feature usage
 * @param userId User ID
 * @param featureId Feature ID
 * @param quantity Usage quantity
 * @returns Promise<void>
 */
export const trackUsage = async (
  userId: string,
  featureId: string,
  quantity: number = 1
): Promise<void> => {
  try {
    const db = firestore;
    if (!db) return;
    
    // Add usage record to Firestore
    await addDoc(collection(db, 'usageRecords'), {
      userId,
      featureId,
      quantity,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
};

/**
 * Get current usage for a feature
 * @param userId User ID
 * @param featureId Feature ID
 * @param billingPeriodStart Start of billing period
 * @returns Promise<number> Total usage
 */
export const getCurrentUsage = async (
  userId: string,
  featureId: string,
  billingPeriodStart: Date
): Promise<number> => {
  try {
    const db = firestore;
    if (!db) return 0;
    
    const startTimestamp = Timestamp.fromDate(billingPeriodStart);
    
    // Query usage records for the current billing period
    const usageSnapshot = await getDocs(
      query(
        collection(db, 'usageRecords'),
        where('userId', '==', userId),
        where('featureId', '==', featureId),
        where('timestamp', '>=', startTimestamp)
      )
    );
    
    // Sum up the quantities
    let totalUsage = 0;
    usageSnapshot.forEach(doc => {
      const data = doc.data();
      totalUsage += data.quantity || 1;
    });
    
    return totalUsage;
  } catch (error) {
    console.error('Error getting current usage:', error);
    return 0;
  }
};

export default {
  trackUsage,
  getCurrentUsage
};
```

- [ ] Create Firebase function for reporting usage to Stripe
```javascript
// In functions/index.js
exports.reportUsageToStripe = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  try {
    const db = admin.firestore();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get all active subscriptions with metered billing
    const subscriptionsSnapshot = await db.collectionGroup('subscriptions')
      .where('status', '==', 'active')
      .where('usageType', '==', 'metered')
      .get();
    
    for (const subscriptionDoc of subscriptionsSnapshot.docs) {
      const subscription = subscriptionDoc.data();
      const userId = subscriptionDoc.ref.parent.parent.id;
      
      // Get usage records for yesterday
      const usageSnapshot = await db.collection('usageRecords')
        .where('userId', '==', userId)
        .where('featureId', '==', subscription.featureId)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(now))
        .get();
      
      // Sum up the quantities
      let totalUsage = 0;
      usageSnapshot.forEach(doc => {
        const data = doc.data();
        totalUsage += data.quantity || 1;
      });
      
      if (totalUsage > 0) {
        // Report usage to Stripe
        await stripe.subscriptionItems.createUsageRecord(
          subscription.stripeSubscriptionItemId,
          {
            quantity: totalUsage,
            timestamp: Math.floor(now.getTime() / 1000),
            action: 'increment'
          }
        );
        
        console.log(`Reported usage for user ${userId}: ${totalUsage} units`);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
    return null;
  }
});
```

- [ ] Implement function to create metered subscription
```javascript
// In functions/index.js
exports.createMeteredSubscription = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create a subscription.'
    );
  }
  
  const userId = context.auth.uid;
  const { featureId, paymentMethodId } = data;
  
  try {
    // Get user document
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found.'
      );
    }
    
    const userData = userDoc.data();
    
    // Get or create Stripe customer
    let customerId = userData.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.auth.token.email,
        metadata: {
          firebaseUserId: userId
        }
      });
      
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await admin.firestore().collection('users').doc(userId).update({
        stripeCustomerId: customerId
      });
    }
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
    
    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
    
    // Get feature details
    const featureConfig = METERED_FEATURES[featureId];
    if (!featureConfig) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid feature ID.'
      );
    }
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: 'usd',
            product: featureConfig.productId,
            recurring: {
              interval: 'month',
              usage_type: 'metered'
            },
            unit_amount: featureConfig.unitPrice
          }
        }
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });
    
    // Store subscription in Firestore
    await admin.firestore().collection('users').doc(userId)
      .collection('subscriptions').doc(subscription.id).set({
        status: subscription.status,
        featureId: featureId,
        usageType: 'metered',
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionItemId: subscription.items.data[0].id,
        currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Update user's subscription status
    await admin.firestore().collection('users').doc(userId).update({
      hasMeteredSubscription: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    };
  } catch (error) {
    console.error('Error creating metered subscription:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

#### Frontend Implementation
- [ ] Create usage tracking UI components
```jsx
// Create components/UsageTracker.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getCurrentUsage } from '../services/usageTrackingService';
import { auth } from '../config/firebase';

interface UsageTrackerProps {
  featureId: string;
  featureName: string;
}

const UsageTracker: React.FC<UsageTrackerProps> = ({ featureId, featureName }) => {
  const [currentUsage, setCurrentUsage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        // Get billing period start (first day of current month)
        const now = new Date();
        const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const usage = await getCurrentUsage(userId, featureId, billingPeriodStart);
        setCurrentUsage(usage);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsage();
  }, [featureId]);
  
  if (loading) {
    return <ActivityIndicator size="small" color="#0a7ea4" />;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{featureName} Usage</Text>
      <Text style={styles.usage}>{currentUsage} units used this month</Text>
      <Text style={styles.info}>You are billed based on your actual usage</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  usage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 8,
  },
  info: {
    fontSize: 12,
    color: '#666',
  },
});

export default UsageTracker;
```

- [ ] Create metered subscription screen
```jsx
// Create screens/MeteredSubscriptionScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { functions, auth } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { METERED_FEATURES } from '../services/firebaseSubscriptionService';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';

const MeteredSubscriptionScreen = () => {
  const navigation = useNavigation();
  const { createPaymentMethod } = useStripe();
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  
  const handleSubscribe = async () => {
    if (!selectedFeature) {
      Alert.alert('Error', 'Please select a feature to subscribe to.');
      return;
    }
    
    if (!cardDetails?.complete) {
      Alert.alert('Error', 'Please enter valid card details.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create payment method
      const { paymentMethod, error } = await createPaymentMethod({
        type: 'Card',
        billingDetails: {
          email: auth.currentUser?.email,
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Create metered subscription
      const createMeteredSubscription = httpsCallable(functions, 'createMeteredSubscription');
      const result = await createMeteredSubscription({
        featureId: selectedFeature.id,
        paymentMethodId: paymentMethod.id
      });
      
      // Navigate to success screen
      navigation.navigate('SubscriptionSuccess', {
        subscriptionId: result.data.subscriptionId,
        featureName: selectedFeature.name
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Usage-Based Billing</Text>
      <Text style={styles.subtitle}>
        Subscribe to features and pay only for what you use
      </Text>
      
      <View style={styles.featuresContainer}>
        {Object.values(METERED_FEATURES).map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[
              styles.featureCard,
              selectedFeature?.id === feature.id && styles.selectedFeature
            ]}
            onPress={() => setSelectedFeature(feature)}
          >
            <Text style={styles.featureName}>{feature.name}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
            <Text style={styles.featurePrice}>
              ${(feature.basePrice / 100).toFixed(2)}/month base +
              ${(feature.unitPrice / 100).toFixed(2)}/unit
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {selectedFeature && (
        <View style={styles.paymentContainer}>
          <Text style={styles.paymentTitle}>Payment Details</Text>
          
          <CardField
            postalCodeEnabled={false}
            placeholder={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={styles.cardStyle}
            style={styles.cardField}
            onCardChange={setCardDetails}
          />
          
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Processing...' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Styles here
});

export default MeteredSubscriptionScreen;
```

- [ ] Update navigation to include metered subscription screen
```jsx
// In App.tsx or navigation file
<Stack.Screen
  name="MeteredSubscription"
  component={MeteredSubscriptionScreen}
  options={{
    title: "USAGE-BASED BILLING",
    headerBackTitle: "Back"
  }}
/>
```

## 2. Enhanced Player Statistics (PARTIALLY IMPLEMENTED)

### 2.1 Complete Implementation
- [ ] Finalize the UpgradePrompt component
- [ ] Implement view counter for free users
- [ ] Add weather API integration for advanced analytics
- [ ] Implement historical trends visualization

### 2.2 Testing and Refinement
- [ ] Test subscription access control
- [ ] Verify view counter functionality
- [ ] Test microtransaction purchases
- [ ] Ensure cross-platform compatibility

## 3. Deployment Preparation

### 3.1 iOS App Store Submission
- [ ] Prepare App Store screenshots and metadata
- [ ] Create app privacy policy
- [ ] Complete App Store Connect listing
- [ ] Configure TestFlight for beta testing
- [ ] Submit for App Review

### 3.2 Web App Deployment
- [ ] Finalize Firebase hosting configuration
- [ ] Set up proper SSL certificates
- [ ] Configure custom domain settings
- [ ] Implement proper redirects and routing

### 3.3 Environment Configuration
- [ ] Set up production API keys
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Implement proper error tracking

## 4. Post-Deployment Monitoring

### 4.1 Analytics Setup
- [ ] Configure conversion tracking
- [ ] Set up user journey analytics
- [ ] Implement feature usage tracking
- [ ] Create monitoring dashboards

### 4.2 Feedback Mechanisms
- [ ] Implement in-app feedback collection
- [ ] Set up crash reporting
- [ ] Create user satisfaction surveys
- [ ] Establish feedback processing workflow

## Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| 1 | Complete Subscription Bundles | 2 weeks |
| 2 | Implement Usage-Based Billing | 3 weeks |
| 3 | Finalize Enhanced Player Statistics | 2 weeks |
| 4 | Deployment Preparation | 2 weeks |
| 5 | Post-Deployment Monitoring | 1 week |

**Total Estimated Time to Completion: 10 weeks**