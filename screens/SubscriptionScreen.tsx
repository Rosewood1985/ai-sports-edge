import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SUBSCRIPTION_PLANS, getUserSubscription, ONE_TIME_PURCHASES } from '../services/firebaseSubscriptionService';
import { auth } from '../config/firebase';
import ReferralProgramCard from '../components/ReferralProgramCard';
import { analyticsService } from '../services';
import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import { AnalyticsEventType } from '../services/analyticsService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Payment: { planId: string };
  SubscriptionManagement: undefined;
  RefundPolicy: undefined;
  GiftRedemption: undefined;
  GroupSubscription: undefined;
  // Other screens...
};

type SubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

/**
 * Enhanced SubscriptionScreen with improved UX and visual design
 * @returns {JSX.Element} - Rendered component
 */
const SubscriptionScreen = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'subscription' | 'one-time'>('subscription');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();
  const { t } = useI18n();

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
    setSelectedPlan(planId);
    
    // Track subscription started event
    const allPlans = [...SUBSCRIPTION_PLANS, ...ONE_TIME_PURCHASES];
    const plan = allPlans.find(p => p.id === planId);
    
    analyticsService.trackEvent(AnalyticsEventType.SUBSCRIPTION_STARTED, {
      plan_id: planId,
      plan_name: plan?.name || 'Unknown',
      plan_type: activeTab
    });
    
    navigation.navigate('Payment', { planId });
  };

  const calculateSavings = (yearlyPrice: number, monthlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'subscription' && styles.activeTab]}
        onPress={() => setActiveTab('subscription')}
      >
        <Text style={[styles.tabText, activeTab === 'subscription' && styles.activeTabText]}>
          {t('subscription.tabs.subscription') || 'Subscriptions'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'one-time' && styles.activeTab]}
        onPress={() => setActiveTab('one-time')}
      >
        <Text style={[styles.tabText, activeTab === 'one-time' && styles.activeTabText]}>
          {t('subscription.tabs.oneTime') || 'One-Time'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlanCard = (plan: any, isRecommended = false) => {
    const isYearly = plan.interval === 'year';
    const monthlyPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'premium-monthly');
    const savings = isYearly && monthlyPlan ? calculateSavings(plan.price, monthlyPlan.price) : null;

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isRecommended && styles.recommendedCard,
          selectedPlan === plan.id && styles.selectedCard
        ]}
        onPress={() => handleSelectPlan(plan.id)}
      >
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.recommendedText}>{t('subscription.recommended') || 'Most Popular'}</Text>
          </View>
        )}
        
        {savings && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>
              {t('subscription.save') || 'Save'} {savings.percentage}%
            </Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>
              ${plan.price}
            </Text>
            <Text style={styles.planInterval}>
              /{plan.interval === 'month' ? 'month' : 'year'}
            </Text>
            {savings && (
              <Text style={styles.savingsAmount}>
                Save ${savings.amount.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        
        <Text style={styles.planDescription}>{plan.description}</Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>{t('subscription.features') || 'Features'}:</Text>
          {plan.features.slice(0, 3).map((feature: string, index: number) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {plan.features.length > 3 && (
            <Text style={styles.moreFeatures}>
              +{plan.features.length - 3} {t('subscription.moreFeatures') || 'more features'}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.selectButton,
            isRecommended && styles.recommendedButton
          ]}
          onPress={() => handleSelectPlan(plan.id)}
        >
          <Text style={[
            styles.selectButtonText,
            isRecommended && styles.recommendedButtonText
          ]}>
            {t('subscription.selectPlan') || 'Select Plan'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>{t('subscription.loading') || 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('subscription.title') || 'Choose Your Plan'}</Text>
        <Text style={styles.subtitle}>
          {t('subscription.subtitle') || 'Get access to premium features and insights'}
        </Text>
      </View>

      {hasSubscription && (
        <View style={styles.infoBox}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              {t('subscription.alreadySubscribed') || 'You already have an active subscription'}
            </Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => navigation.navigate('SubscriptionManagement')}
            >
              <Text style={styles.manageButtonText}>
                {t('subscription.manageSubscription') || 'Manage Subscription'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {renderTabSelector()}

      <View style={styles.plansContainer}>
        {activeTab === 'subscription' ? (
          <>
            {SUBSCRIPTION_PLANS.map((plan) => renderPlanCard(plan, plan.popular))}
          </>
        ) : (
          <>
            {ONE_TIME_PURCHASES.map((purchase) => renderPlanCard(purchase, false))}
          </>
        )}
      </View>

      {!hasSubscription && (
        <ReferralProgramCard />
      )}

      <View style={styles.groupSubscriptionCard}>
        <Text style={styles.groupTitle}>{t('subscription.group.title') || 'Group Subscription'}</Text>
        <Text style={styles.groupDescription}>
          {t('subscription.group.description') || 'Share premium features with friends and family'}
        </Text>
        <TouchableOpacity
          style={styles.groupButton}
          onPress={() => navigation.navigate('GroupSubscription')}
        >
          <Text style={styles.groupButtonText}>
            {t('subscription.group.createButton') || 'Create Group'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerLinks}>
        <TouchableOpacity
          style={styles.giftButton}
          onPress={() => navigation.navigate('GiftRedemption')}
        >
          <Text style={styles.giftButtonText}>
            {t('subscription.gift.redeemButton') || 'Redeem Gift'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.policyLink}
          onPress={() => navigation.navigate('RefundPolicy')}
        >
          <Text style={styles.policyLinkText}>
            {t('subscription.refundPolicy') || 'Refund Policy'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#3498db',
  },
  plansContainer: {
    paddingHorizontal: 20,
  },
  infoBox: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bde0fe',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  manageButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recommendedCard: {
    borderColor: '#3498db',
    transform: [{ scale: 1.02 }],
  },
  selectedCard: {
    borderColor: '#10B981',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
  },
  planInterval: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  savingsAmount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  planDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginTop: 8,
  },
  selectButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  recommendedButton: {
    backgroundColor: '#2c3e50',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  recommendedButtonText: {
    color: '#fff',
  },
  groupSubscriptionCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#bde0fe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  groupButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  groupButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footerLinks: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  giftButton: {
    backgroundColor: '#f39c12',
    borderRadius: 12,
    padding: 16,
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