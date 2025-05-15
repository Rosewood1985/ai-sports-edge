# Subscription Screens Implementation Guide

This document provides detailed implementation instructions for the subscription-related screens in the AI Sports Edge app.

## 1. Subscription Screen

### File Location
```
screens/SubscriptionScreen.tsx
```

### Purpose
Display available subscription plans and allow users to select a plan to subscribe to.

### Dependencies
```typescript
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SUBSCRIPTION_PLANS, getUserSubscription } from '../services/subscriptionService';
import { auth } from '../config/firebase';
```

### Component Structure

```typescript
type RootStackParamList = {
  Payment: { planId: string };
  // Other screens...
};

type SubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

const SubscriptionScreen = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const subscription = await getUserSubscription(userId);
          setHasSubscription(!!subscription);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, []);

  const handleSelectPlan = (planId: string) => {
    navigation.navigate('Payment', { planId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose a Subscription Plan</Text>
      <Text style={styles.subtitle}>
        Get access to premium AI-powered betting insights
      </Text>

      {hasSubscription && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            You already have an active subscription. You can manage your subscription in the settings.
          </Text>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate('SubscriptionManagement' as never)}
          >
            <Text style={styles.manageButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      )}

      {SUBSCRIPTION_PLANS.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={styles.planCard}
          onPress={() => handleSelectPlan(plan.id)}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              ${(plan.amount / 100).toFixed(2)}
              <Text style={styles.planInterval}>
                /{plan.interval}
              </Text>
            </Text>
          </View>
          
          <Text style={styles.planDescription}>{plan.description}</Text>
          
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Features:</Text>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureText}>• {feature}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handleSelectPlan(plan.id)}
          >
            <Text style={styles.selectButtonText}>Select Plan</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.policyLink}
        onPress={() => navigation.navigate('RefundPolicy' as never)}
      >
        <Text style={styles.policyLinkText}>
          View our Cancellation & Refund Policy
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bde0fe',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  manageButton: {
    backgroundColor: '#3498db',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
  },
  planInterval: {
    fontSize: 14,
    color: '#666',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  policyLink: {
    alignItems: 'center',
    marginVertical: 20,
  },
  policyLinkText: {
    color: '#3498db',
    fontSize: 14,
  },
});

export default SubscriptionScreen;
```

## 2. Payment Screen

### File Location
```
screens/PaymentScreen.tsx
```

### Purpose
Collect payment information from the user and process the subscription.

### Dependencies
```typescript
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CardField, useStripe, StripeProvider } from '@stripe/stripe-react-native';
import { SUBSCRIPTION_PLANS, createSubscription } from '../services/subscriptionService';
import { auth } from '../config/firebase';
```

### Component Structure

```typescript
type RootStackParamList = {
  Payment: { planId: string };
  Main: undefined;
  // Other screens...
};

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

const PaymentScreen = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(false);
  const [cardComplete, setCardComplete] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof SUBSCRIPTION_PLANS[0] | null>(null);
  
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { createPaymentMethod } = useStripe();
  
  const { planId } = route.params;

  useEffect(() => {
    // Find the selected plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
    } else {
      Alert.alert('Error', 'Invalid subscription plan');
      navigation.goBack();
    }
  }, [planId, navigation]);

  const handlePayment = async () => {
    try {
      if (!cardComplete) {
        Alert.alert('Error', 'Please complete the card details');
        return;
      }

      setLoading(true);

      // Create a payment method
      const { paymentMethod, error } = await createPaymentMethod({
        type: 'Card',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentMethod) {
        throw new Error('Payment method creation failed');
      }

      // Create the subscription
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await createSubscription(userId, paymentMethod.id, planId);

      // Show success message
      Alert.alert(
        'Subscription Successful',
        'Your subscription has been activated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during payment processing');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Payment Information</Text>
      <Text style={styles.subtitle}>
        Enter your card details to subscribe to {selectedPlan.name}
      </Text>

      <View style={styles.planSummary}>
        <Text style={styles.planSummaryTitle}>Plan Summary</Text>
        <View style={styles.planSummaryRow}>
          <Text style={styles.planSummaryLabel}>Plan:</Text>
          <Text style={styles.planSummaryValue}>{selectedPlan.name}</Text>
        </View>
        <View style={styles.planSummaryRow}>
          <Text style={styles.planSummaryLabel}>Price:</Text>
          <Text style={styles.planSummaryValue}>
            ${(selectedPlan.amount / 100).toFixed(2)}/{selectedPlan.interval}
          </Text>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.cardLabel}>Card Information</Text>
        <CardField
          postalCodeEnabled={true}
          placeholder={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={styles.cardStyle}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.payButton,
          (!cardComplete || loading) && styles.payButtonDisabled,
        ]}
        onPress={handlePayment}
        disabled={!cardComplete || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>Subscribe Now</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.secureText}>
        🔒 Your payment information is secure and encrypted
      </Text>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const PaymentScreenWrapper = (): JSX.Element => {
  // Replace with your Stripe publishable key
  const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_key_here';

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <PaymentScreen />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  planSummary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  planSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  planSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  planSummaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cardContainer: {
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  cardStyle: {
    backgroundColor: '#fff',
    textColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  payButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonDisabled: {
    backgroundColor: '#a0c8e7',
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secureText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
});

export default PaymentScreenWrapper;
```

## 3. Subscription Management Screen

### File Location
```
screens/SubscriptionManagementScreen.tsx
```

### Purpose
Allow users to view and manage their current subscription, including cancellation.

### Dependencies
```typescript
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  getUserSubscription, 
  cancelSubscription, 
  Subscription,
  getUserPaymentMethods,
  PaymentMethod
} from '../services/subscriptionService';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
```

### Component Structure

```typescript
const SubscriptionManagementScreen = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get subscription and payment methods
      const [userSubscription, userPaymentMethods] = await Promise.all([
        getUserSubscription(userId),
        getUserPaymentMethods(userId)
      ]);

      setSubscription(userSubscription);
      setPaymentMethods(userPaymentMethods);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period.',
      [
        {
          text: 'No, Keep It',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const userId = auth.currentUser?.uid;
              
              if (!userId) {
                throw new Error('User not authenticated');
              }

              await cancelSubscription(userId, subscription.id);
              
              Alert.alert(
                'Subscription Canceled',
                'Your subscription has been canceled. You will still have access until the end of your current billing period.',
                [
                  {
                    text: 'OK',
                    onPress: () => loadData(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel subscription');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.noSubscriptionContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#666" />
        <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
        <Text style={styles.noSubscriptionText}>
          You don't have an active subscription. Subscribe to get access to premium features.
        </Text>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => navigation.navigate('Subscription' as never)}
        >
          <Text style={styles.subscribeButtonText}>View Subscription Plans</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Subscription Management</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Subscription</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Plan:</Text>
          <Text style={styles.detailValue}>{subscription.plan.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <View style={styles.statusContainer}>
            <View 
              style={[
                styles.statusDot, 
                subscription.status === 'active' ? styles.statusActive : styles.statusInactive
              ]} 
            />
            <Text style={styles.detailValue}>
              {subscription.status === 'active' ? 'Active' : 
               subscription.status === 'trialing' ? 'Trial' : 
               subscription.status === 'canceled' ? 'Canceled' : 'Past Due'}
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>
            ${(subscription.plan.amount / 100).toFixed(2)}/{subscription.plan.interval}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Started:</Text>
          <Text style={styles.detailValue}>{formatDate(subscription.createdAt)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Next Billing:</Text>
          <Text style={styles.detailValue}>{formatDate(subscription.currentPeriodEnd)}</Text>
        </View>
      </View>

      {defaultPaymentMethod && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentMethodContainer}>
            <View style={styles.cardBrandContainer}>
              <Text style={styles.cardBrand}>{defaultPaymentMethod.brand.toUpperCase()}</Text>
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardNumber}>•••• {defaultPaymentMethod.last4}</Text>
              <Text style={styles.cardExpiry}>
                Expires {defaultPaymentMethod.expiryMonth}/{defaultPaymentMethod.expiryYear}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => navigation.navigate('Payment' as never, { updatePaymentMethod: true } as never)}
          >
            <Text style={styles.updateButtonText}>Update Payment Method</Text>
          </TouchableOpacity>
        </View>
      )}

      {subscription.status === 'active' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelSubscription}
        >
          <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.policyLink}
        onPress={() => navigation.navigate('RefundPolicy' as never)}
      >
        <Text style={styles.policyLinkText}>
          View our Cancellation & Refund Policy
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: '#2ecc71',
  },
  statusInactive: {
    backgroundColor: '#e74c3c',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardBrandContainer: {
    backgroundColor: '#f1f1f1',
    borderRadius: 4,
    padding: 8,
    marginRight: 12,
  },
  cardBrand: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDetails: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  policyLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  policyLinkText: {
    color: '#3498db',
    fontSize: 14,
  },
  noSubscriptionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  noSubscriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  subscribeButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  subscribeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SubscriptionManagementScreen;
```

## 4. Refund Policy Screen

### File Location
```
screens/RefundPolicyScreen.tsx
```

### Purpose
Display the cancellation and refund policy for subscriptions.

### Dependencies
```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
```

### Component Structure

```typescript
const RefundPolicyScreen = (): JSX.Element => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cancellation & Refund Policy</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription Cancellation</Text>
        <Text style={styles.paragraph}>
          You may cancel your subscription at any time through the Subscription Management screen in the app. 
          Upon cancellation, your subscription will remain active until the end of your current billing period.
        </Text>
        <Text style={styles.paragraph}>
          No partial refunds will be issued for unused portions of your subscription period.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Refund Policy</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Monthly Subscriptions:</Text> We do not provide refunds for monthly subscriptions. 
          If you cancel, you will have access to premium features until the end of your current billing period.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Weekend Pass:</Text> Due to the short-term nature of this purchase, 
          Weekend Passes are non-refundable once activated.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Pay-Per-Prediction:</Text> Individual prediction purchases are non-refundable 
          once the prediction has been delivered.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exceptional Circumstances</Text>
        <Text style={styles.paragraph}>
          In exceptional circumstances, such as technical issues preventing access to our services, 
          we may consider refund requests on a case-by-case basis.
        </Text>
        <Text style={styles.paragraph}>
          To request a refund in such cases, please contact our support team at support@aisportsedge.com 
          with your account details and a description of the issue.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify this policy at any time. Changes will be effective immediately 
          upon posting to the app. Your continued use of our services after any changes indicates your 
          acceptance of the new terms.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about our Cancellation & Refund Policy, please contact us at:
        </Text>
        <Text style={styles.contactInfo}>
          Email: support@aisportsedge.com
        </Text>
        <Text style={styles.contactInfo}>
          Phone: (555) 123-4567
        </Text>
      </View>
      
      <Text style={styles.lastUpdated}>
        Last Updated: March 15, 2025
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  contactInfo: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3498db',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
});

export default RefundPolicyScreen;
```

## 5. Navigation Updates

### File Location
```
.expo/navigation/AppNavigator.tsx
```

### Updates Required

Add the new screens to the RootStackParamList:

```typescript
// Define the stack navigator param list
type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Main: undefined;
  Subscription: undefined;
  Payment: { planId: string };
  SubscriptionManagement: undefined;
  RefundPolicy: undefined;
};
```

Add the screens to the Stack Navigator:

```typescript
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

## 6. Settings Screen Update

### File Location
```
screens/SettingsScreen.tsx
```

### Updates Required

Add a subscription management option to the Settings screen:

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

## Next Steps

After implementing these screens, we'll need to:

1. Update the Firebase configuration to include the functions export
2. Implement the Firebase Cloud Functions for Stripe integration
3. Test the complete subscription flow
4. Implement email receipts for successful payments