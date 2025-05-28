/**
 * Stripe Extension Checkout Component
 * Uses Firebase Stripe Extension for subscription and payment processing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { stripeExtensionService } from '../services/stripeExtensionService';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  description: string;
  active: boolean;
  images: string[];
  metadata: Record<string, string>;
  prices: Price[];
}

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'month' | 'year';
    interval_count: number;
  };
  metadata: Record<string, string>;
}

interface StripeExtensionCheckoutProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showOneTimeOptions?: boolean;
  allowTrials?: boolean;
}

export const StripeExtensionCheckout: React.FC<StripeExtensionCheckoutProps> = ({
  onSuccess,
  onError,
  showOneTimeOptions = false,
  allowTrials = true
}) => {
  const { colors, isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPriceId, setProcessingPriceId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await stripeExtensionService.getProducts();
      
      // Filter active products and sort by price
      const activeProducts = productsData
        .filter(product => product.active)
        .map(product => ({
          ...product,
          prices: product.prices
            .filter((price: Price) => price.unit_amount > 0)
            .sort((a: Price, b: Price) => a.unit_amount - b.unit_amount)
        }))
        .filter(product => product.prices.length > 0);

      setProducts(activeProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to load products'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionCheckout = async (priceId: string, trialDays?: number) => {
    try {
      setProcessingPriceId(priceId);
      
      const checkoutUrl = await stripeExtensionService.createSubscriptionCheckout(priceId, {
        trialPeriodDays: trialDays,
        allowPromotionCodes: true,
        automaticTax: true,
        metadata: {
          source: 'mobile_app',
          timestamp: new Date().toISOString()
        }
      });

      // In a real app, you'd navigate to the checkout URL
      // For React Native, you might use a WebView or external browser
      console.log('Checkout URL:', checkoutUrl);
      
      // Simulate success for demo purposes
      Alert.alert(
        'Checkout Ready',
        'Redirecting to Stripe Checkout...',
        [
          {
            text: 'Continue',
            onPress: () => {
              // In a real implementation, open the checkout URL
              onSuccess?.();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating checkout:', error);
      Alert.alert('Error', 'Failed to create checkout session');
      onError?.(error instanceof Error ? error : new Error('Checkout failed'));
    } finally {
      setProcessingPriceId(null);
    }
  };

  const handleOneTimeCheckout = async (priceId: string) => {
    try {
      setProcessingPriceId(priceId);
      
      const checkoutUrl = await stripeExtensionService.createOneTimeCheckout([priceId], {
        metadata: {
          source: 'mobile_app',
          type: 'one_time_purchase',
          timestamp: new Date().toISOString()
        }
      });

      console.log('One-time Checkout URL:', checkoutUrl);
      
      Alert.alert(
        'Checkout Ready',
        'Redirecting to Stripe Checkout...',
        [
          {
            text: 'Continue',
            onPress: () => {
              onSuccess?.();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating one-time checkout:', error);
      Alert.alert('Error', 'Failed to create checkout session');
      onError?.(error instanceof Error ? error : new Error('Checkout failed'));
    } finally {
      setProcessingPriceId(null);
    }
  };

  const formatPrice = (price: Price): string => {
    const amount = price.unit_amount / 100;
    const currency = price.currency.toUpperCase();
    
    if (price.recurring) {
      const interval = price.recurring.interval;
      const intervalCount = price.recurring.interval_count;
      const intervalText = intervalCount === 1 ? interval : `${intervalCount} ${interval}s`;
      return `$${amount}/${intervalText}`;
    }
    
    return `$${amount} ${currency}`;
  };

  const renderPriceButton = (product: Product, price: Price) => {
    const isProcessing = processingPriceId === price.id;
    const isSubscription = !!price.recurring;
    const hasFreeTrial = allowTrials && isSubscription && product.metadata.trial_days;
    
    return (
      <TouchableOpacity
        key={price.id}
        style={[
          styles.priceButton,
          {
            backgroundColor: isDark ? colors.surface : colors.background,
            borderColor: colors.primary,
          },
          isProcessing && styles.processingButton
        ]}
        onPress={() => {
          if (isSubscription) {
            handleSubscriptionCheckout(
              price.id,
              hasFreeTrial ? parseInt(product.metadata.trial_days) : undefined
            );
          } else if (showOneTimeOptions) {
            handleOneTimeCheckout(price.id);
          }
        }}
        disabled={isProcessing || (!isSubscription && !showOneTimeOptions)}
      >
        <View style={styles.priceButtonContent}>
          <View style={styles.priceInfo}>
            <Text style={[styles.priceText, { color: colors.text }]}>
              {formatPrice(price)}
            </Text>
            {hasFreeTrial && (
              <Text style={[styles.trialText, { color: colors.primary }]}>
                {product.metadata.trial_days} day free trial
              </Text>
            )}
            {price.metadata.popular && (
              <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
          </View>
          
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={colors.primary} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading subscription options...
        </Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons 
          name="alert-circle-outline" 
          size={48} 
          color={colors.text} 
          style={styles.errorIcon}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>
          No subscription plans available
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadProducts}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Choose Your Plan
      </Text>
      
      {products.map(product => (
        <View key={product.id} style={styles.productContainer}>
          <Text style={[styles.productName, { color: colors.text }]}>
            {product.name}
          </Text>
          
          {product.description && (
            <Text style={[styles.productDescription, { color: colors.textSecondary }]}>
              {product.description}
            </Text>
          )}
          
          <View style={styles.pricesContainer}>
            {product.prices.map(price => renderPriceButton(product, price))}
          </View>
        </View>
      ))}
      
      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
        Secure payment powered by Stripe. Cancel anytime.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  productContainer: {
    marginBottom: 32,
  },
  productName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  pricesContainer: {
    gap: 12,
  },
  priceButton: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
  },
  processingButton: {
    opacity: 0.7,
  },
  priceButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  trialText: {
    fontSize: 12,
    fontWeight: '500',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});

export default StripeExtensionCheckout;