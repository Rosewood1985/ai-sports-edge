/**
 * Stripe Provider Component
 *
 * This component initializes the Stripe service and provides Stripe context to the app.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

import * as stripeService from './stripeService';
import { getStripe } from '../../atoms/stripe/stripeConfig';

// Create Stripe context
interface StripeContextType {
  isInitialized: boolean;
  isTaxEnabled: boolean;
  processPayment: typeof stripeService.processPayment;
  setupCustomer: typeof stripeService.setupCustomer;
  getTaxInfo: typeof stripeService.getTaxInfo;
  stripe: ReturnType<typeof getStripe>;
}

const StripeContext = createContext<StripeContextType | null>(null);

// Stripe Provider props
interface StripeProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Stripe Provider Component
 *
 * Initializes Stripe and provides Stripe context to the app.
 */
export const StripeProvider: React.FC<StripeProviderProps> = ({ children, fallback }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTaxEnabled, setIsTaxEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Stripe service
    const initializeStripe = async () => {
      try {
        const initialized = await stripeService.initialize();
        if (initialized) {
          setIsInitialized(true);

          // Check if Stripe Tax is enabled
          const taxEnabled = await stripeService.isStripeTaxEnabled();
          setIsTaxEnabled(taxEnabled);
        } else {
          setError('Failed to initialize Stripe service');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error initializing Stripe');
      }
    };

    initializeStripe();
  }, []);

  // If there's an error, show error message
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Stripe initialization error: {error}</Text>
      </View>
    );
  }

  // If not initialized and fallback is provided, show fallback
  if (!isInitialized && fallback) {
    return <>{fallback}</>;
  }

  // If not initialized and no fallback, show loading indicator
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Initializing payment service...</Text>
      </View>
    );
  }

  // Provide Stripe context to children
  const contextValue: StripeContextType = {
    isInitialized,
    isTaxEnabled,
    processPayment: stripeService.processPayment,
    setupCustomer: stripeService.setupCustomer,
    getTaxInfo: stripeService.getTaxInfo,
    stripe: getStripe(),
  };

  return <StripeContext.Provider value={contextValue}>{children}</StripeContext.Provider>;
};

/**
 * Hook to use Stripe context
 * @returns Stripe context
 * @throws Error if used outside of StripeProvider
 */
export const useStripe = (): StripeContextType => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default StripeProvider;
