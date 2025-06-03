import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  View,
  findNodeHandle,
  AccessibilityRole,
} from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import { useI18n } from '../atomic/organisms/i18n/I18nContext';
import { auth } from '../config/firebase';
import accessibilityService from '../services/accessibilityService';
import { SUBSCRIPTION_PLANS, createSubscription } from '../services/firebaseSubscriptionService';

type RootStackParamList = {
  Payment: { planId: string };
  Main: undefined;
  // Other screens...
};

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

/**
 * PaymentScreen component for collecting payment information
 * Enhanced with full accessibility features including keyboard navigation,
 * screen reader support, focus management, and voice control
 * @returns {JSX.Element} - Rendered component
 */
const PaymentScreen = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(false);
  const [cardComplete, setCardComplete] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<(typeof SUBSCRIPTION_PLANS)[0] | null>(null);

  // Refs for focus management
  const cardFieldRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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
      // Type assertion for auth to avoid TypeScript error
      const userId = (auth as any).currentUser?.uid;
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

  // Register keyboard navigable elements and voice commands for accessibility
  useEffect(() => {
    if (!selectedPlan) return;

    // Register card field
    if (cardFieldRef.current) {
      const nodeHandle = findNodeHandle(cardFieldRef.current);
      if (nodeHandle) {
        accessibilityService.registerKeyboardNavigableElement('payment-card-field', {
          ref: { current: { nodeHandle } },
          nextElementId: 'payment-subscribe-button',
          prevElementId: undefined, // Use undefined instead of null
          onFocus: () => {
            // Ensure the card field is visible when focused
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ y: 200, animated: true });
            }
          },
        });
      }
    }

    // Register pay button
    accessibilityService.registerKeyboardNavigableElement('payment-subscribe-button', {
      ref: { current: null },
      nextElementId: 'payment-cancel-button',
      prevElementId: 'payment-card-field',
      onFocus: () => {
        // Ensure the button is visible when focused
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 300, animated: true });
        }
      },
    });

    // Register cancel button
    accessibilityService.registerKeyboardNavigableElement('payment-cancel-button', {
      ref: { current: null },
      nextElementId: undefined, // Use undefined instead of null
      prevElementId: 'payment-subscribe-button',
      onFocus: () => {
        // Ensure the button is visible when focused
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 400, animated: true });
        }
      },
    });

    // Register voice commands
    const subscribeCommand = accessibilityService.registerVoiceCommand({
      command: 'subscribe now',
      handler: () => {
        if (!cardComplete || loading) return;
        handlePayment();
      },
      description: 'Completes the subscription payment process',
    });

    const cancelCommand = accessibilityService.registerVoiceCommand({
      command: 'cancel payment',
      handler: () => {
        if (!loading) {
          navigation.goBack();
        }
      },
      description: 'Cancels the payment and returns to the previous screen',
    });

    const focusCardCommand = accessibilityService.registerVoiceCommand({
      command: 'focus card field',
      handler: () => {
        accessibilityService.focusElement('payment-card-field');
      },
      description: 'Sets focus to the card input field',
    });

    // Set initial focus to card field
    setTimeout(() => {
      accessibilityService.focusElement('payment-card-field');
    }, 500);

    // Clean up on unmount
    return () => {
      accessibilityService.unregisterKeyboardNavigableElement('payment-card-field');
      accessibilityService.unregisterKeyboardNavigableElement('payment-subscribe-button');
      accessibilityService.unregisterKeyboardNavigableElement('payment-cancel-button');
      subscribeCommand();
      cancelCommand();
      focusCardCommand();
    };
  }, [selectedPlan, cardComplete, loading, navigation, handlePayment]);

  if (!selectedPlan) {
    return (
      <AccessibleThemedView
        style={styles.loadingContainer}
        accessibilityLabel={t('payment.loading')}
        accessibilityRole="progressbar"
        accessibilityHint={t('payment.loadingHint')}
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
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      accessibilityLabel={t('payment.screenTitle')}
      accessibilityHint={t('payment.screenHint')}
      accessibilityRole="none"
    >
      <AccessibleThemedText
        style={styles.title}
        type="h1"
        accessibilityRole="header"
        accessibilityLabel={t('payment.title')}
        accessibilityHint={t('payment.titleHint')}
      >
        {t('payment.title')}
      </AccessibleThemedText>

      <AccessibleThemedText
        style={styles.subtitle}
        type="bodyStd"
        accessibilityLabel={t('payment.subtitleAccessibility', { planName: selectedPlan.name })}
        accessibilityHint={t('payment.subtitleHint')}
      >
        {t('payment.subtitle', { planName: selectedPlan.name })}
      </AccessibleThemedText>

      <AccessibleThemedView
        style={styles.planSummary}
        accessibilityLabel={t('payment.planSummary.accessibilityLabel')}
        accessibilityHint={t('payment.planSummary.accessibilityHint')}
      >
        <AccessibleThemedText
          style={styles.planSummaryTitle}
          type="h2"
          accessibilityRole="header"
          accessibilityLabel={t('payment.planSummary.title')}
        >
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
        accessibilityHint={t('payment.cardContainerHint')}
      >
        <AccessibleThemedText
          style={styles.cardLabel}
          type="h2"
          accessibilityRole="header"
          accessibilityLabel={t('payment.cardInformation')}
        >
          {t('payment.cardInformation')}
        </AccessibleThemedText>

        <View
          ref={cardFieldRef}
          accessible
          accessibilityLabel={t('payment.cardFieldAccessibility')}
          accessibilityHint={t('payment.cardFieldHint')}
          importantForAccessibility="yes"
        >
          <CardField
            postalCodeEnabled
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            style={styles.cardField}
            onCardChange={(cardDetails: { complete: boolean }) => {
              setCardComplete(cardDetails.complete);

              // If card is complete, move focus to the subscribe button
              if (cardDetails.complete && !cardComplete) {
                setTimeout(() => {
                  accessibilityService.focusElement('payment-subscribe-button');
                }, 500);
              }
            }}
            accessibilityLabel={t('payment.cardFieldAccessibility')}
            accessibilityHint={t('payment.cardFieldHint')}
          />
        </View>
      </AccessibleThemedView>

      <AccessibleTouchableOpacity
        style={[styles.payButton, (!cardComplete || loading) && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={!cardComplete || loading}
        accessibilityLabel={t('payment.subscribeNowAccessibility')}
        accessibilityRole="button"
        accessibilityState={{ disabled: !cardComplete || loading }}
        accessibilityHint={t('payment.subscribeButtonHint')}
        // Custom props are handled in the component
        {...{
          keyboardNavigationId: 'payment-subscribe-button',
          nextElementId: 'payment-cancel-button',
          prevElementId: 'payment-card-field',
        }}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#fff"
            accessibilityLabel={t('payment.processingPayment')}
          />
        ) : (
          <AccessibleThemedText
            style={styles.payButtonText}
            type="button"
            accessibilityLabel={t('payment.subscribeNow')}
          >
            {t('payment.subscribeNow')}
          </AccessibleThemedText>
        )}
      </AccessibleTouchableOpacity>

      <AccessibleThemedText
        style={styles.secureText}
        type="small"
        accessibilityLabel={t('payment.secureInfoAccessibility')}
        accessibilityHint={t('payment.secureInfoHint')}
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
        // Custom props are handled in the component
        {...{
          keyboardNavigationId: 'payment-cancel-button',
          nextElementId: undefined,
          prevElementId: 'payment-subscribe-button',
        }}
      >
        <AccessibleThemedText
          style={styles.cancelButtonText}
          type="button"
          accessibilityLabel={t('common.cancel')}
        >
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
  contentContainer: {
    paddingBottom: 40, // Add padding at the bottom for better scrolling
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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
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
    opacity: 0.7,
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
