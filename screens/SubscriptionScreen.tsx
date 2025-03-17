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
import { SUBSCRIPTION_PLANS, getUserSubscription } from '../services/firebaseSubscriptionService';
import { auth } from '../config/firebase';
import { ReferralProgramCard } from '../components/ReferralProgramCard';
import { trackEvent } from '../services/analyticsService';

type RootStackParamList = {
  Payment: { planId: string };
  SubscriptionManagement: undefined;
  RefundPolicy: undefined;
  GiftRedemption: undefined;
  // Other screens...
};

type SubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

/**
 * SubscriptionScreen component displays available subscription plans
 * @returns {JSX.Element} - Rendered component
 */
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
    // Track subscription started event
    trackEvent('subscription_started', {
      plan_id: planId,
      plan_name: SUBSCRIPTION_PLANS.find(p => p.id === planId)?.name || 'Unknown'
    });
    
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
            onPress={() => navigation.navigate('SubscriptionManagement')}
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
              ${(plan.amount || plan.price * 100) / 100}
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

      {!hasSubscription && (
        <ReferralProgramCard isSubscribed={false} />
      )}

      <View style={styles.footerLinks}>
        <TouchableOpacity
          style={styles.giftButton}
          onPress={() => navigation.navigate('GiftRedemption')}
        >
          <Text style={styles.giftButtonText}>
            Redeem a Gift Subscription
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.policyLink}
          onPress={() => navigation.navigate('RefundPolicy')}
        >
          <Text style={styles.policyLinkText}>
            View our Cancellation & Refund Policy
          </Text>
        </TouchableOpacity>
      </View>
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
  footerLinks: {
    marginVertical: 20,
  },
  giftButton: {
    backgroundColor: '#f39c12',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  giftButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  policyLink: {
    alignItems: 'center',
    marginVertical: 10,
  },
  policyLinkText: {
    color: '#3498db',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SubscriptionScreen;