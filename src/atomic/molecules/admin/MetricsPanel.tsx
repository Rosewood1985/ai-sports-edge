import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MetricCard, MetricCardProps } from '../../atoms/admin/MetricCard';

export interface MetricsPanelProps {
  title: string;
  metrics: Omit<MetricCardProps, 'onClick'>[];
  columns?: 1 | 2 | 3 | 4;
  onMetricClick?: (metricIndex: number) => void;
}

/**
 * MetricsPanel - A molecule component for displaying multiple metrics
 * 
 * @param title - The panel title
 * @param metrics - Array of metric data
 * @param columns - Number of columns to display (1-4)
 * @param onMetricClick - Optional click handler for metrics
 */
export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  title,
  metrics,
  columns = 2,
  onMetricClick,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.metricsContainer, { flexDirection: columns === 1 ? 'column' : 'row' }]}>
        {metrics.map((metric, index) => (
          <View
            key={index}
            style={[
              styles.metricWrapper,
              {
                width: columns === 1 ? '100%' : columns === 2 ? '48%' : columns === 3 ? '31%' : '23%',
              },
            ]}
          >
            <MetricCard
              {...metric}
              onClick={onMetricClick ? () => onMetricClick(index) : undefined}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricWrapper: {
    marginBottom: 16,
  },
});