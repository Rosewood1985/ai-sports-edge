import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * TaxSummary Component
 *
 * Displays a summary of tax information for a transaction
 *
 * @param {Object} props
 * @param {number} props.subtotal - Subtotal amount (pre-tax)
 * @param {number} props.taxAmount - Tax amount
 * @param {Array} props.taxBreakdown - Tax breakdown by jurisdiction
 * @param {string} props.currency - Currency code (default: 'USD')
 */
const TaxSummary = ({ subtotal, taxAmount, taxBreakdown = [], currency = 'USD' }) => {
  // Calculate total
  const total = subtotal + taxAmount;

  // Format currency
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tax Summary</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Subtotal:</Text>
        <Text style={styles.value}>{formatCurrency(subtotal)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Tax:</Text>
        <Text style={styles.value}>{formatCurrency(taxAmount)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      {taxBreakdown.length > 0 && (
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Tax Breakdown</Text>

          {taxBreakdown.map((item, index) => (
            <View key={index} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                {item.jurisdiction_name} ({item.tax_rate_percentage}%):
              </Text>
              <Text style={styles.breakdownValue}>{formatCurrency(item.tax_amount / 100)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  breakdownContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#333',
  },
});

export default TaxSummary;
