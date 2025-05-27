/**
 * Advanced Stripe Service
 * 
 * Client-side service for advanced Stripe features including proration,
 * tax calculation, and multi-currency support
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

export interface ProrationDetails {
  currentPlan: {
    name: string;
    amount: number;
    currency: string;
    interval: string;
  };
  newPlan: {
    name: string;
    amount: number;
    currency: string;
    interval: string;
  };
  proration: {
    creditAmount: number;
    chargeAmount: number;
    netAmount: number;
    currency: string;
    immediateCharge: number;
    immediateCredit: number;
  };
  nextInvoice: {
    amount: number;
    currency: string;
    periodStart: number;
    periodEnd: number;
  };
}

export interface TaxCalculation {
  calculationId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  taxBreakdown: Array<{
    jurisdiction: string;
    rate: number;
    amount: number;
  }>;
}

export interface CustomerDetails {
  address: {
    country: string;
    state?: string;
    postal_code?: string;
    city?: string;
    line1?: string;
    line2?: string;
  };
  tax_id?: string;
  tax_exempt?: 'none' | 'exempt' | 'reverse';
  locale?: string;
}

export interface CurrencyPricing {
  priceId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  formattedAmount: string;
}

export interface MultiCurrencyPricing {
  productId: string;
  currencies: Record<string, CurrencyPricing>;
  baseAmount: number;
  supportedCurrencies: string[];
}

class AdvancedStripeService {
  private functions = getFunctions();
  private auth = getAuth();

  /**
   * Calculate proration for subscription changes
   */
  async calculateProration(
    subscriptionId: string,
    newPriceId: string,
    previewOnly: boolean = true
  ): Promise<ProrationDetails> {
    const calculateProration = httpsCallable(this.functions, 'calculateProration');
    
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to calculate proration');
    }

    try {
      const result = await calculateProration({
        userId: user.uid,
        subscriptionId,
        newPriceId,
        previewOnly
      });

      return result.data as ProrationDetails;
    } catch (error) {
      console.error('Error calculating proration:', error);
      throw new Error('Failed to calculate proration');
    }
  }

  /**
   * Update subscription with proration
   */
  async updateSubscriptionWithProration(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
  ): Promise<{
    subscriptionId: string;
    status: string;
    newPriceId: string;
    planName: string;
    currentPeriodEnd: number;
  }> {
    const updateSubscription = httpsCallable(this.functions, 'updateSubscriptionWithProration');
    
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update subscription');
    }

    try {
      const result = await updateSubscription({
        userId: user.uid,
        subscriptionId,
        newPriceId,
        prorationBehavior
      });

      return result.data as any;
    } catch (error) {
      console.error('Error updating subscription with proration:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Calculate tax for a purchase
   */
  async calculateTax(
    priceId: string,
    customerDetails: CustomerDetails
  ): Promise<TaxCalculation> {
    const calculateTax = httpsCallable(this.functions, 'calculateTax');
    
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to calculate tax');
    }

    try {
      const result = await calculateTax({
        userId: user.uid,
        priceId,
        customerDetails
      });

      return result.data as TaxCalculation;
    } catch (error) {
      console.error('Error calculating tax:', error);
      throw new Error('Failed to calculate tax');
    }
  }

  /**
   * Get pricing for specific currency
   */
  async getPricingForCurrency(
    productId: string,
    currency: string
  ): Promise<{
    productId: string;
    currency: string;
    pricing: CurrencyPricing;
    fallback: boolean;
    availableCurrencies: string[];
  }> {
    const getPricing = httpsCallable(this.functions, 'getPricingForCurrency');
    
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to get pricing');
    }

    try {
      const result = await getPricing({
        userId: user.uid,
        productId,
        currency
      });

      return result.data as any;
    } catch (error) {
      console.error('Error getting pricing for currency:', error);
      throw new Error('Failed to get currency pricing');
    }
  }

  /**
   * Create advanced subscription with tax and currency support
   */
  async createAdvancedSubscription(
    paymentMethodId: string,
    priceId: string,
    customerDetails: CustomerDetails,
    currency: string
  ): Promise<{
    subscriptionId: string;
    status: string;
    currency: string;
    amount: number;
    clientSecret: string;
    currentPeriodEnd: number;
  }> {
    const createSubscription = httpsCallable(this.functions, 'createAdvancedSubscription');
    
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to create subscription');
    }

    try {
      const result = await createSubscription({
        userId: user.uid,
        paymentMethodId,
        priceId,
        customerDetails,
        currency
      });

      return result.data as any;
    } catch (error) {
      console.error('Error creating advanced subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Format currency amount for display
   */
  formatCurrencyAmount(amount: number, currency: string): string {
    // Handle zero-decimal currencies
    const divisor = ['jpy', 'krw', 'vnd'].includes(currency.toLowerCase()) ? 1 : 100;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / divisor);
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }> {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    ];
  }

  /**
   * Detect user's currency based on locale
   */
  detectUserCurrency(): string {
    const locale = navigator.language;
    const currencyMap: Record<string, string> = {
      'en-US': 'USD',
      'en-CA': 'CAD',
      'en-GB': 'GBP',
      'en-AU': 'AUD',
      'fr-FR': 'EUR',
      'de-DE': 'EUR',
      'es-ES': 'EUR',
      'it-IT': 'EUR',
      'ja-JP': 'JPY',
    };

    return currencyMap[locale] || 'USD';
  }

  /**
   * Calculate savings from plan upgrade/downgrade
   */
  calculatePlanSavings(
    currentAmount: number,
    newAmount: number,
    currency: string,
    interval: 'month' | 'year'
  ): {
    savings: number;
    savingsFormatted: string;
    percentageSavings: number;
    isUpgrade: boolean;
    annualSavings?: number;
    annualSavingsFormatted?: string;
  } {
    const difference = currentAmount - newAmount;
    const isUpgrade = difference < 0;
    const savings = Math.abs(difference);
    const percentageSavings = (savings / currentAmount) * 100;

    let annualSavings: number | undefined;
    let annualSavingsFormatted: string | undefined;

    if (interval === 'month') {
      annualSavings = savings * 12;
      annualSavingsFormatted = this.formatCurrencyAmount(annualSavings, currency);
    }

    return {
      savings,
      savingsFormatted: this.formatCurrencyAmount(savings, currency),
      percentageSavings: Math.round(percentageSavings),
      isUpgrade,
      annualSavings,
      annualSavingsFormatted,
    };
  }

  /**
   * Validate customer details for tax calculation
   */
  validateCustomerDetails(customerDetails: CustomerDetails): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!customerDetails.address?.country) {
      errors.push('Country is required');
    }

    // US-specific validation
    if (customerDetails.address?.country === 'US') {
      if (!customerDetails.address.state) {
        errors.push('State is required for US addresses');
      }
      if (!customerDetails.address.postal_code) {
        errors.push('ZIP code is required for US addresses');
      }
    }

    // EU-specific validation
    const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
    if (euCountries.includes(customerDetails.address?.country || '')) {
      if (!customerDetails.address.postal_code) {
        errors.push('Postal code is required for EU addresses');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const advancedStripeService = new AdvancedStripeService();

export default advancedStripeService;