/**
 * Advanced Stripe Components
 * 
 * UI components for advanced Stripe features including proration calculator,
 * tax calculator, and multi-currency pricing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import { advancedStripeService, ProrationDetails, TaxCalculation, CustomerDetails } from '../services/advancedStripeService';

interface ProrationCalculatorProps {
  currentSubscriptionId: string;
  availablePlans: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
  }>;
  onPlanChange?: (prorationDetails: ProrationDetails) => void;
}

export const ProrationCalculator: React.FC<ProrationCalculatorProps> = ({
  currentSubscriptionId,
  availablePlans,
  onPlanChange
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [prorationDetails, setProrationDetails] = useState<ProrationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateProration = async (newPriceId: string) => {
    if (!newPriceId || !currentSubscriptionId) return;

    setLoading(true);
    setError(null);

    try {
      const details = await advancedStripeService.calculateProration(
        currentSubscriptionId,
        newPriceId,
        true // preview only
      );
      
      setProrationDetails(details);
      onPlanChange?.(details);
    } catch (err) {
      setError('Failed to calculate proration. Please try again.');
      console.error('Proration calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPlanId) {
      calculateProration(selectedPlanId);
    }
  }, [selectedPlanId]);

  const formatCurrency = (amount: number, currency: string) => {
    return advancedStripeService.formatCurrencyAmount(amount, currency);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plan Change Calculator</Text>
      
      <Text style={styles.label}>Select New Plan:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planSelector}>
        {availablePlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlanId === plan.id && styles.selectedPlan
            ]}
            onPress={() => setSelectedPlanId(plan.id)}
          >
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              {formatCurrency(plan.price, plan.currency)}/{plan.interval}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Calculating proration...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {prorationDetails && !loading && (
        <View style={styles.prorationContainer}>
          <Text style={styles.sectionTitle}>Proration Details</Text>
          
          <View style={styles.comparisonRow}>
            <View style={styles.planComparison}>
              <Text style={styles.comparisonLabel}>Current Plan</Text>
              <Text style={styles.comparisonValue}>{prorationDetails.currentPlan.name}</Text>
              <Text style={styles.comparisonPrice}>
                {formatCurrency(prorationDetails.currentPlan.amount, prorationDetails.currentPlan.currency)}
              </Text>
            </View>
            
            <View style={styles.planComparison}>
              <Text style={styles.comparisonLabel}>New Plan</Text>
              <Text style={styles.comparisonValue}>{prorationDetails.newPlan.name}</Text>
              <Text style={styles.comparisonPrice}>
                {formatCurrency(prorationDetails.newPlan.amount, prorationDetails.newPlan.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.prorationSummary}>
            {prorationDetails.proration.immediateCharge > 0 && (
              <View style={styles.chargeRow}>
                <Text style={styles.chargeLabel}>Immediate Charge:</Text>
                <Text style={styles.chargeAmount}>
                  {formatCurrency(prorationDetails.proration.immediateCharge, prorationDetails.proration.currency)}
                </Text>
              </View>
            )}
            
            {prorationDetails.proration.immediateCredit > 0 && (
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Immediate Credit:</Text>
                <Text style={styles.creditAmount}>
                  {formatCurrency(prorationDetails.proration.immediateCredit, prorationDetails.proration.currency)}
                </Text>
              </View>
            )}

            <View style={styles.nextInvoiceRow}>
              <Text style={styles.nextInvoiceLabel}>Next Invoice:</Text>
              <Text style={styles.nextInvoiceAmount}>
                {formatCurrency(prorationDetails.nextInvoice.amount, prorationDetails.nextInvoice.currency)}
              </Text>
              <Text style={styles.nextInvoiceDate}>
                on {new Date(prorationDetails.nextInvoice.periodEnd * 1000).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

interface TaxCalculatorProps {
  priceId: string;
  onTaxCalculated?: (taxCalculation: TaxCalculation) => void;
}

export const TaxCalculator: React.FC<TaxCalculatorProps> = ({
  priceId,
  onTaxCalculated
}) => {
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    address: {
      country: 'US',
      state: '',
      postal_code: '',
      city: '',
      line1: ''
    }
  });
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTax = async () => {
    setLoading(true);
    setError(null);

    try {
      const validation = advancedStripeService.validateCustomerDetails(customerDetails);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        setLoading(false);
        return;
      }

      const calculation = await advancedStripeService.calculateTax(priceId, customerDetails);
      setTaxCalculation(calculation);
      onTaxCalculated?.(calculation);
    } catch (err) {
      setError('Failed to calculate tax. Please check your address details.');
      console.error('Tax calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return advancedStripeService.formatCurrencyAmount(amount, currency);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tax Calculator</Text>
      
      <View style={styles.addressForm}>
        <Text style={styles.label}>Country:</Text>
        <TextInput
          style={styles.input}
          value={customerDetails.address.country}
          onChangeText={(text) => setCustomerDetails(prev => ({
            ...prev,
            address: { ...prev.address, country: text }
          }))}
          placeholder="US"
        />

        <Text style={styles.label}>State/Province:</Text>
        <TextInput
          style={styles.input}
          value={customerDetails.address.state}
          onChangeText={(text) => setCustomerDetails(prev => ({
            ...prev,
            address: { ...prev.address, state: text }
          }))}
          placeholder="CA"
        />

        <Text style={styles.label}>ZIP/Postal Code:</Text>
        <TextInput
          style={styles.input}
          value={customerDetails.address.postal_code}
          onChangeText={(text) => setCustomerDetails(prev => ({
            ...prev,
            address: { ...prev.address, postal_code: text }
          }))}
          placeholder="90210"
        />

        <TouchableOpacity 
          style={styles.calculateButton}
          onPress={calculateTax}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Tax</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {taxCalculation && (
        <View style={styles.taxContainer}>
          <Text style={styles.sectionTitle}>Tax Breakdown</Text>
          
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Subtotal:</Text>
            <Text style={styles.taxAmount}>
              {formatCurrency(taxCalculation.subtotal, taxCalculation.currency)}
            </Text>
          </View>

          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Tax:</Text>
            <Text style={styles.taxAmount}>
              {formatCurrency(taxCalculation.taxAmount, taxCalculation.currency)}
            </Text>
          </View>

          <View style={styles.taxRowTotal}>
            <Text style={styles.taxLabelTotal}>Total:</Text>
            <Text style={styles.taxAmountTotal}>
              {formatCurrency(taxCalculation.totalAmount, taxCalculation.currency)}
            </Text>
          </View>

          {taxCalculation.taxBreakdown.length > 0 && (
            <View style={styles.breakdown}>
              <Text style={styles.breakdownTitle}>Tax Details:</Text>
              {taxCalculation.taxBreakdown.map((breakdown, index) => (
                <View key={index} style={styles.breakdownRow}>
                  <Text style={styles.breakdownJurisdiction}>{breakdown.jurisdiction}</Text>
                  <Text style={styles.breakdownRate}>{(breakdown.rate * 100).toFixed(2)}%</Text>
                  <Text style={styles.breakdownAmount}>
                    {formatCurrency(breakdown.amount, taxCalculation.currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

interface CurrencySelectorProps {
  productId: string;
  onCurrencySelected?: (currency: string, pricing: any) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  productId,
  onCurrencySelected
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const supportedCurrencies = advancedStripeService.getSupportedCurrencies();

  const loadPricing = async (currency: string) => {
    setLoading(true);
    try {
      const pricingData = await advancedStripeService.getPricingForCurrency(productId, currency);
      setPricing(pricingData);
      onCurrencySelected?.(currency, pricingData);
    } catch (error) {
      console.error('Failed to load pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const detectedCurrency = advancedStripeService.detectUserCurrency();
    setSelectedCurrency(detectedCurrency);
    loadPricing(detectedCurrency);
  }, [productId]);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    loadPricing(currency);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Currency & Pricing</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencySelector}>
        {supportedCurrencies.map((currency) => (
          <TouchableOpacity
            key={currency.code}
            style={[
              styles.currencyCard,
              selectedCurrency === currency.code && styles.selectedCurrency
            ]}
            onPress={() => handleCurrencyChange(currency.code)}
          >
            <Text style={styles.currencySymbol}>{currency.symbol}</Text>
            <Text style={styles.currencyCode}>{currency.code}</Text>
            <Text style={styles.currencyName}>{currency.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {pricing && !loading && (
        <View style={styles.pricingContainer}>
          <Text style={styles.pricingAmount}>
            {pricing.pricing.formattedAmount}
          </Text>
          {pricing.fallback && (
            <Text style={styles.fallbackNotice}>
              * Showing USD pricing (requested currency not available)
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  planSelector: {
    marginBottom: 16,
  },
  planCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  selectedPlan: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FFF2F2',
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  prorationContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planComparison: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  comparisonPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  prorationSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chargeLabel: {
    fontSize: 14,
    color: '#D32F2F',
  },
  chargeAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  creditLabel: {
    fontSize: 14,
    color: '#388E3C',
  },
  creditAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  nextInvoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  nextInvoiceLabel: {
    fontSize: 14,
    color: '#666',
  },
  nextInvoiceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  nextInvoiceDate: {
    fontSize: 12,
    color: '#666',
  },
  addressForm: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  calculateButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  taxContainer: {
    marginTop: 16,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  taxLabel: {
    fontSize: 14,
    color: '#666',
  },
  taxAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  taxRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
  },
  taxLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  taxAmountTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  breakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownJurisdiction: {
    flex: 2,
    fontSize: 12,
    color: '#666',
  },
  breakdownRate: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  breakdownAmount: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  currencySelector: {
    marginBottom: 16,
  },
  currencyCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedCurrency: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  pricingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  pricingAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  fallbackNotice: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default {
  ProrationCalculator,
  TaxCalculator,
  CurrencySelector,
};