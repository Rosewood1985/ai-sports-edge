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
} from '../services/firebaseSubscriptionService';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

/**
 * SubscriptionManagementScreen component for managing subscriptions
 * @returns {JSX.Element} - Rendered component
 */
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

              await cancelSubscription(userId);
              
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

  const formatDate = (date: Date | number | undefined): string => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
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
          onPress={() => {
            // @ts-ignore - Navigation typing issue
            navigation.navigate('Subscription');
          }}
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
          <Text style={styles.detailValue}>{subscription.plan?.name || 'Unknown'}</Text>
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
            ${((subscription.plan?.amount || subscription.plan?.price * 100 || 0) / 100).toFixed(2)}/
            {subscription.plan?.interval || 'month'}
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
            onPress={() => {
              // @ts-ignore - Navigation typing issue
              navigation.navigate('Payment', { updatePaymentMethod: true });
            }}
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
        onPress={() => {
          // @ts-ignore - Navigation typing issue
          navigation.navigate('RefundPolicy');
        }}
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