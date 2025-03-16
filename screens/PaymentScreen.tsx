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
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { SUBSCRIPTION_PLANS, createSubscription } from '../services/subscriptionService';
import { auth } from '../config/firebase';

type RootStackParamList = {
  Payment: { planId: string };
  Main: undefined;
  // Other screens...
};

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

/**
 * PaymentScreen component for collecting payment information
 * @returns {JSX.Element} - Rendered component
 */
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
        paymentMethodType: 'Card',
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
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
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

export default PaymentScreen;