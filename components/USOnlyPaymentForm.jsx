import { CardField, useStripe } from '@stripe/stripe-react-native';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button } from 'react-native-elements';

/**
 * US-Only Payment Form Component
 *
 * This component provides a payment form that only accepts payments from US customers.
 * It validates the postal code and restricts payments to USD currency.
 *
 * @param {Object} props
 * @param {number} props.amount - Amount to charge in dollars (will be converted to cents)
 * @param {Function} props.onPaymentSuccess - Callback when payment succeeds
 * @param {Function} props.onPaymentError - Callback when payment fails
 * @param {Object} props.customerDetails - Customer details including address
 * @param {Object} [props.metadata] - Additional metadata for the payment
 */
const USOnlyPaymentForm = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  customerDetails,
  metadata = {},
}) => {
  const { createPaymentMethod, handleCardAction, confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [error, setError] = useState(null);

  // Validate amount and currency
  useEffect(() => {
    if (!amount || amount <= 0) {
      setError('Invalid payment amount');
    }
  }, [amount]);

  // Handle card field changes
  const handleCardChange = details => {
    setCardDetails(details);
    setCardComplete(details.complete);

    // Validate US postal code
    if (details.postalCode) {
      const usZipRegex = /^\d{5}(-\d{4})?$/;
      if (!usZipRegex.test(details.postalCode)) {
        setError('Payments are only accepted from the United States');
      } else {
        setError(null);
      }
    }
  };

  // Process payment
  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate card is complete
      if (!cardComplete) {
        setError('Please complete card information');
        setLoading(false);
        return;
      }

      // Validate customer is in the US
      if (!customerDetails?.address?.country || customerDetails.address.country !== 'US') {
        setError('Payments are only accepted from the United States');
        setLoading(false);
        return;
      }

      // Create payment method
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod({
        type: 'Card',
        billingDetails: {
          name: customerDetails.name,
          email: customerDetails.email,
          phone: customerDetails.phone,
          address: {
            country: 'US',
            state: customerDetails.address.state,
            city: customerDetails.address.city,
            line1: customerDetails.address.line1,
            line2: customerDetails.address.line2,
            postalCode: customerDetails.address.postal_code,
          },
        },
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message);
        setLoading(false);
        if (onPaymentError) onPaymentError(paymentMethodError);
        return;
      }

      // Create payment intent on the server
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          paymentMethodId: paymentMethod.id,
          customerDetails,
          metadata: {
            ...metadata,
            us_only: 'true',
          },
        }),
      });

      const { clientSecret, error: intentError } = await response.json();

      if (intentError) {
        setError(intentError);
        setLoading(false);
        if (onPaymentError) onPaymentError(intentError);
        return;
      }

      // Confirm the payment
      const { paymentIntent, error: confirmError } = await confirmPayment(clientSecret, {
        type: 'Card',
      });

      if (confirmError) {
        setError(confirmError.message);
        setLoading(false);
        if (onPaymentError) onPaymentError(confirmError);
        return;
      }

      // Payment succeeded
      setLoading(false);
      if (onPaymentSuccess) onPaymentSuccess(paymentIntent);
    } catch (e) {
      setError('An unexpected error occurred');
      setLoading(false);
      if (onPaymentError) onPaymentError(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Details</Text>
      <Text style={styles.subtitle}>USD ${amount.toFixed(2)}</Text>

      <View style={styles.cardContainer}>
        <CardField
          postalCodeEnabled
          placeholder={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={{
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
          }}
          style={styles.cardField}
          onCardChange={handleCardChange}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.noticeContainer}>
        <Text style={styles.noticeText}>
          Note: Payments are only accepted from the United States.
        </Text>
      </View>

      <Button
        title={loading ? 'Processing...' : 'Pay Now'}
        disabled={!cardComplete || loading || error !== null}
        onPress={handlePayment}
        buttonStyle={styles.payButton}
        titleStyle={styles.payButtonText}
        icon={loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
  },
  cardContainer: {
    marginBottom: 16,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  errorText: {
    color: '#dc3545',
    marginBottom: 16,
  },
  noticeContainer: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 14,
    color: '#495057',
  },
  payButton: {
    backgroundColor: '#007bff',
    borderRadius: 4,
    paddingVertical: 12,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default USOnlyPaymentForm;
