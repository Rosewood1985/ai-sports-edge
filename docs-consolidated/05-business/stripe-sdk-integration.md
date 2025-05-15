# Stripe SDK Integration Guide for React Native

This document provides detailed instructions for integrating the Stripe SDK into the AI Sports Edge React Native app.

## 1. Install Required Packages

```bash
# Install Stripe React Native SDK
npm install @stripe/stripe-react-native

# Install Firebase Functions for React Native
npm install @react-native-firebase/functions

# Update the Firebase configuration
npm install firebase@latest
```

## 2. Update Firebase Configuration

Update the `config/firebase.ts` file to include Firebase Functions:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDxLufbPyNYpax2MmE5ff27MHA-js9INBw",
  authDomain: "ai-sports-edge.firebaseapp.com",
  projectId: "ai-sports-edge",
  storageBucket: "ai-sports-edge.appspot.com",
  messagingSenderId: "63216708515",
  appId: "1:63216708515:web:209e6baf130386edb00816"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);

// Connect to Functions emulator in development
if (__DEV__) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { auth, firestore, functions };
```

## 3. Create a Stripe Provider Component

Create a new file `components/StripeProvider.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { StripeProvider as StripeSDKProvider } from '@stripe/stripe-react-native';

// Replace with your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_key_here';

interface StripeProviderProps {
  children: ReactNode;
}

/**
 * Stripe Provider component to wrap the app with Stripe SDK
 * @param {StripeProviderProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const StripeProvider = ({ children }: StripeProviderProps): JSX.Element => {
  return (
    <StripeSDKProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {children}
    </StripeSDKProvider>
  );
};

export default StripeProvider;
```

## 4. Update App.tsx to Include Stripe Provider

Update the `App.tsx` file to wrap the app with the Stripe Provider:

```typescript
import { registerRootComponent } from "expo";
import React from "react";
import AppNavigator from "./.expo/navigation/AppNavigator";
import StripeProvider from "./components/StripeProvider";

/**
 * Main App component
 * @returns {JSX.Element} - Rendered component
 */
function App(): JSX.Element {
  return (
    <StripeProvider>
      <AppNavigator />
    </StripeProvider>
  );
}

// Register App
registerRootComponent(App);

export default App;
```

## 5. Create a Stripe Hook for Easy Access

Create a new file `hooks/useStripePayment.ts`:

```typescript
import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { auth } from '../config/firebase';

/**
 * Custom hook for Stripe payment functionality
 * @returns {Object} - Stripe payment functions and state
 */
export const useStripePayment = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { createPaymentMethod } = useStripe();

  /**
   * Subscribe to a plan
   * @param {string} planId - The plan ID
   * @returns {Promise<any>} - The subscription result
   */
  const subscribeToPlan = async (planId: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);

      // Create a payment method
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod({
        type: 'Card',
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      if (!paymentMethod) {
        throw new Error('Payment method creation failed');
      }

      // Call the createSubscription function
      const createSubscriptionFn = httpsCallable(functions, 'createSubscription');
      const result = await createSubscriptionFn({
        paymentMethodId: paymentMethod.id,
        planId,
      });

      return result.data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<boolean>} - Success status
   */
  const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Call the cancelSubscription function
      const cancelSubscriptionFn = httpsCallable(functions, 'cancelSubscription');
      const result = await cancelSubscriptionFn({
        subscriptionId,
      });

      return result.data as boolean;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Make a one-time payment (for Pay-Per-Prediction)
   * @param {number} amount - The amount in cents
   * @param {string} description - The payment description
   * @returns {Promise<any>} - The payment result
   */
  const makeOneTimePayment = async (
    amount: number,
    description: string
  ): Promise<any> => {
    try {
      setLoading(true);
      setError(null);

      // Create a payment method
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod({
        type: 'Card',
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      if (!paymentMethod) {
        throw new Error('Payment method creation failed');
      }

      // Call the createPayment function
      const createPaymentFn = httpsCallable(functions, 'createPayment');
      const result = await createPaymentFn({
        paymentMethodId: paymentMethod.id,
        amount,
        description,
      });

      return result.data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    subscribeToPlan,
    cancelSubscription,
    makeOneTimePayment,
    loading,
    error,
  };
};

export default useStripePayment;
```

## 6. Update the Settings Screen

Update the `screens/SettingsScreen.tsx` file to include subscription management:

```typescript
// Inside the Account section of the SettingsScreen
{renderSettingItem(
  'card',
  'Manage Subscription',
  'View and manage your subscription details',
  <TouchableOpacity onPress={() => navigation.navigate('SubscriptionManagement' as never)}>
    <Ionicons name="chevron-forward" size={24} color="#999" />
  </TouchableOpacity>
)}
```

## 7. Update the Navigation

Update the `.expo/navigation/AppNavigator.tsx` file to include the subscription screens:

```typescript
// Add to RootStackParamList
type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Main: undefined;
  Subscription: undefined;
  Payment: { planId: string };
  SubscriptionManagement: undefined;
  RefundPolicy: undefined;
};

// Add the screens to the Stack Navigator
<Stack.Screen 
  name="Subscription" 
  component={SubscriptionScreen} 
  options={{ headerShown: true, title: "Choose a Plan" }}
/>
<Stack.Screen 
  name="Payment" 
  component={PaymentScreen} 
  options={{ headerShown: true, title: "Payment Information" }}
/>
<Stack.Screen 
  name="SubscriptionManagement" 
  component={SubscriptionManagementScreen} 
  options={{ headerShown: true, title: "Manage Subscription" }}
/>
<Stack.Screen 
  name="RefundPolicy" 
  component={RefundPolicyScreen} 
  options={{ headerShown: true, title: "Refund Policy" }}
/>
```

## 8. Create a Subscription Context

Create a new file `contexts/SubscriptionContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../config/firebase';
import { getUserSubscription, hasPremiumAccess, Subscription } from '../services/subscriptionService';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  hasPremium: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: false,
  error: null,
  hasPremium: false,
  refreshSubscription: async () => {},
});

interface SubscriptionProviderProps {
  children: ReactNode;
}

/**
 * Subscription Provider component
 * @param {SubscriptionProviderProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const SubscriptionProvider = ({ children }: SubscriptionProviderProps): JSX.Element => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPremium, setHasPremium] = useState<boolean>(false);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        setSubscription(null);
        setHasPremium(false);
        return;
      }

      // Get the user's subscription
      const userSubscription = await getUserSubscription(userId);
      setSubscription(userSubscription);

      // Check if the user has premium access
      const premium = await hasPremiumAccess(userId);
      setHasPremium(premium);
    } catch (err: any) {
      console.error('Error loading subscription:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load subscription when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      loadSubscription();
    });

    return () => unsubscribe();
  }, []);

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        hasPremium,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

/**
 * Hook to use the subscription context
 * @returns {SubscriptionContextType} - Subscription context
 */
export const useSubscription = (): SubscriptionContextType => {
  return useContext(SubscriptionContext);
};
```

## 9. Update App.tsx to Include Subscription Provider

Update the `App.tsx` file to include the Subscription Provider:

```typescript
import { registerRootComponent } from "expo";
import React from "react";
import AppNavigator from "./.expo/navigation/AppNavigator";
import StripeProvider from "./components/StripeProvider";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";

/**
 * Main App component
 * @returns {JSX.Element} - Rendered component
 */
function App(): JSX.Element {
  return (
    <StripeProvider>
      <SubscriptionProvider>
        <AppNavigator />
      </SubscriptionProvider>
    </StripeProvider>
  );
}

// Register App
registerRootComponent(App);

export default App;
```

## 10. Create Premium Feature Guards

Create a new component `components/PremiumFeature.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';

interface PremiumFeatureProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Premium Feature component that only renders its children if the user has premium access
 * @param {PremiumFeatureProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const PremiumFeature = ({ children, fallback }: PremiumFeatureProps): JSX.Element => {
  const { hasPremium, loading } = useSubscription();
  const navigation = useNavigation();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hasPremium) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Premium Feature</Text>
        <Text style={styles.description}>
          This feature is only available to premium subscribers.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Subscription' as never)}
        >
          <Text style={styles.buttonText}>View Subscription Plans</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginVertical: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default PremiumFeature;
```

## 11. Use Premium Feature Guards in the App

Example usage in a screen:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PremiumFeature from '../components/PremiumFeature';

const AIPredictionsScreen = (): JSX.Element => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Predictions</Text>
      
      <PremiumFeature>
        {/* Premium content here */}
        <View style={styles.premiumContent}>
          <Text style={styles.predictionTitle}>Today's Top Picks</Text>
          {/* AI predictions content */}
        </View>
      </PremiumFeature>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  premiumContent: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default AIPredictionsScreen;
```

## 12. Testing the Integration

### 12.1 Stripe Test Cards

Use these test cards for testing:

- **Successful payment**: 4242 4242 4242 4242
- **Authentication required**: 4000 0025 0000 3155
- **Payment declined**: 4000 0000 0000 9995

### 12.2 Testing Checklist

1. **Subscription Creation**:
   - Test creating a subscription with a valid card
   - Test with a card that requires authentication
   - Test with a card that will be declined

2. **Subscription Management**:
   - Test viewing subscription details
   - Test canceling a subscription
   - Verify that access continues until the end of the billing period

3. **Payment Methods**:
   - Test adding a new payment method
   - Test setting a payment method as default
   - Test removing a payment method

4. **One-Time Payments**:
   - Test making a one-time payment for Pay-Per-Prediction
   - Verify receipt email is sent

5. **Premium Access**:
   - Test accessing premium features with an active subscription
   - Test premium feature guards redirect to subscription screen when not subscribed

## 13. Production Considerations

### 13.1 Environment Variables

Use environment variables for API keys:

```typescript
// In StripeProvider.tsx
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here';
```

### 13.2 Error Handling

Implement proper error handling for payment failures:

```typescript
try {
  await subscribeToPlan(planId);
  // Success handling
} catch (error) {
  if (error.code === 'card_declined') {
    // Handle declined card
  } else if (error.code === 'authentication_required') {
    // Handle authentication required
  } else {
    // Handle other errors
  }
}
```

### 13.3 Analytics

Track subscription events for analytics:

```typescript
// After successful subscription
analytics.logEvent('subscription_created', {
  planId,
  userId: auth.currentUser?.uid,
});

// After cancellation
analytics.logEvent('subscription_canceled', {
  subscriptionId,
  userId: auth.currentUser?.uid,
});
```

## 14. Next Steps

After implementing the Stripe SDK integration:

1. Test the complete subscription flow in development
2. Deploy Firebase Functions to production
3. Update environment variables for production
4. Monitor for any errors or issues
5. Track subscription metrics and conversion rates