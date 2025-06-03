import { StripeProvider as StripeSDKProvider } from '@stripe/stripe-react-native';
import React, { ReactNode, ReactElement } from 'react';

import { STRIPE_PUBLISHABLE_KEY } from '../config/stripe';

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
      {children as ReactElement}
    </StripeSDKProvider>
  );
};

export default StripeProvider;
