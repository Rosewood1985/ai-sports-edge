import React, { ReactNode } from 'react';
import { StripeProvider as StripeSDKProvider } from '@stripe/stripe-react-native';

// Replace with your Stripe publishable key
// In a production app, this should come from an environment variable
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51NxSdILkdIwIjOxOG8VKMq2pZ0XxuzQumDOtC9cRiRlSKpYfKyYMQvUeKjGQpLFrKVgxKvQXdLrF9zJ5U5VbKVgx00aBcdefgh';

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