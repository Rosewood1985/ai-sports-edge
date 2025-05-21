import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { SUBSCRIPTION_PLANS, createSubscription } from '../services/firebaseSubscriptionService';
import { auth } from '../config/firebase';
import { useI18n } from '../atomic/organisms/i18n/I18nContext';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';

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
  const [selectedPlan, setSelectedPlan] = useState<(typeof SUBSCRIPTION_PLANS)[0] | null>(null);

  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { createPaymentMethod } = useStripe();
  const { t } = useI18n();

  const { planId } = route.params;

  useEffect(() => {
    // Find the selected plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
    } else {
      Alert.alert(t('common.error'), t('payment.errors.invalidPlan'));
      navigation.goBack();
    }
  }, [planId, navigation, t]);

  const handlePayment = async () => {
    try {
      if (!cardComplete) {
        Alert.alert(t('common.error'), t('payment.errors.incompleteCard'));
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
        throw new Error(t('payment.errors.paymentMethodFailed'));
      }

      // Create the subscription
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error(t('payment.errors.notAuthenticated'));
      }

      await createSubscription(userId, paymentMethod.id, planId);

      // Show success message
      Alert.alert(t('payment.success.title'), t('payment.success.message'), [
        {
          text: t('common.ok'),
          onPress: () => navigation.navigate('Main'),
        },
      ]);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('payment.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <AccessibleThemedView
        style={styles.loadingContainer}
        accessibilityLabel={t('payment.loading')}
        accessibilityRole="progressbar"
      >
        <ActivityIndicator
          size="large"
          color="#3498db"
          accessibilityLabel={t('payment.loadingPlan')}
        />
      </AccessibleThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} accessibilityLabel={t('payment.screenTitle')}>
      <AccessibleThemedText style={styles.title} type="h1" accessibilityRole="header">
        {t('payment.title')}
      </AccessibleThemedText>

      <AccessibleThemedText
        style={styles.subtitle}
        type="bodyStd"
        accessibilityLabel={t('payment.subtitleAccessibility', { planName: selectedPlan.name })}
      >
        {t('payment.subtitle', { planName: selectedPlan.name })}
      </AccessibleThemedText>

      <AccessibleThemedView
        style={styles.planSummary}
        accessibilityLabel={t('payment.planSummary.accessibilityLabel')}
      >
        <AccessibleThemedText style={styles.planSummaryTitle} type="h2" accessibilityRole="header">
          {t('payment.planSummary.title')}
        </AccessibleThemedText>

        <AccessibleThemedView style={styles.planSummaryRow}>
          <AccessibleThemedText style={styles.planSummaryLabel} type="label">
            {t('payment.planSummary.plan')}:
          </AccessibleThemedText>
          <AccessibleThemedText
            style={styles.planSummaryValue}
            type="bodyStd"
            accessibilityLabel={`${t('payment.planSummary.plan')}: ${selectedPlan.name}`}
          >
            {selectedPlan.name}
          </AccessibleThemedText>
        </AccessibleThemedView>

        <AccessibleThemedView style={styles.planSummaryRow}>
          <AccessibleThemedText style={styles.planSummaryLabel} type="label">
            {t('payment.planSummary.price')}:
          </AccessibleThemedText>
          <AccessibleThemedText
            style={styles.planSummaryValue}
            type="bodyStd"
            accessibilityLabel={`${t('payment.planSummary.price')}: $${
              (selectedPlan.amount || selectedPlan.price * 100) / 100
            } ${t(`payment.interval.${selectedPlan.interval}`)}`}
          >
            ${(selectedPlan.amount || selectedPlan.price * 100) / 100}/
            {t(`payment.interval.${selectedPlan.interval}`)}
          </AccessibleThemedText>
        </AccessibleThemedView>
      </AccessibleThemedView>

      <AccessibleThemedView
        style={styles.cardContainer}
        accessibilityLabel={t('payment.cardContainerAccessibility')}
      >
        <AccessibleThemedText style={styles.cardLabel} type="h2" accessibilityRole="header">
          {t('payment.cardInformation')}
        </AccessibleThemedText>

        <CardField
          postalCodeEnabled={true}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          style={styles.cardField}
          onCardChange={(cardDetails: { complete: boolean }) => {
            setCardComplete(cardDetails.complete);
          }}
          accessibilityLabel={t('payment.cardFieldAccessibility')}
          accessibilityHint={t('payment.cardFieldHint')}
        />
      </AccessibleThemedView>

      <AccessibleTouchableOpacity
        style={[styles.payButton, (!cardComplete || loading) && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={!cardComplete || loading}
        accessibilityLabel={t('payment.subscribeNowAccessibility')}
        accessibilityRole="button"
        accessibilityState={{ disabled: !cardComplete || loading }}
        accessibilityHint={t('payment.subscribeButtonHint')}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#fff"
            accessibilityLabel={t('payment.processingPayment')}
          />
        ) : (
          <AccessibleThemedText style={styles.payButtonText} type="button">
            {t('payment.subscribeNow')}
          </AccessibleThemedText>
        )}
      </AccessibleTouchableOpacity>

      <AccessibleThemedText
        style={styles.secureText}
        type="small"
        accessibilityLabel={t('payment.secureInfoAccessibility')}
      >
        🔒 {t('payment.secureInfo')}
      </AccessibleThemedText>

      <AccessibleTouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
        accessibilityLabel={t('common.cancelAccessibility')}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
        accessibilityHint={t('payment.cancelButtonHint')}
      >
        <AccessibleThemedText style={styles.cancelButtonText} type="button">
          {t('common.cancel')}
        </AccessibleThemedText>
      </AccessibleTouchableOpacity>
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
