import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart, ScatterChart } from 'react-native-chart-kit';
import { useCorrelationAnalysis } from '../../../../hooks/useEnhancedInsights';
import { CorrelationInsight, CorrelationType } from '../../../../types/enhancedInsights';
import LoadingIndicator from '../../../LoadingIndicator';
import ErrorMessage from '../../../ErrorMessage';

const screenWidth = Dimensions.get('window').width;

interface CorrelationAnalysisWidgetProps {
  dateRange: [Date, Date];
  variables: string[];
}

export const CorrelationAnalysisWidget: React.FC<CorrelationAnalysisWidgetProps> = ({
  dateRange,
  variables
}) => {
  const [selectedCorrelation, setSelectedCorrelation] = useState<CorrelationInsight | null>(null);
  const [correlationType, setCorrelationType] = useState<CorrelationType>('pearson');
  const [minStrength, setMinStrength] = useState<number>(0.3);

  const { 
    correlations, 
    isLoading, 
    error, 
    analyzeCorrelations,
    getCorrelationMatrix,
    predictCorrelation 
  } = useCorrelationAnalysis({
    startDate: dateRange[0],
    endDate: dateRange[1],
    variables,
    type: correlationType,
    minStrength
  });

  useEffect(() => {
    analyzeCorrelations();
  }, [dateRange, variables, correlationType, minStrength]);

  if (isLoading) return <LoadingIndicator />;
  if (error) return <ErrorMessage message={error} />;

  const getCorrelationStrengthLabel = (strength: number): string => {
    const absStrength = Math.abs(strength);
    if (absStrength >= 0.8) return 'Very Strong';
    if (absStrength >= 0.6) return 'Strong';
    if (absStrength >= 0.4) return 'Moderate';
    if (absStrength >= 0.2) return 'Weak';
    return 'Very Weak';
  };

  const getCorrelationColor = (strength: number): string => {
    const absStrength = Math.abs(strength);
    if (absStrength >= 0.8) return strength > 0 ? '#2ECC71' : '#E74C3C';
    if (absStrength >= 0.6) return strength > 0 ? '#27AE60' : '#C0392B';
    if (absStrength >= 0.4) return strength > 0 ? '#F39C12' : '#E67E22';
    if (absStrength >= 0.2) return strength > 0 ? '#F1C40F' : '#D68910';
    return '#95A5A6';
  };

  const generateCorrelationMatrix = () => {
    const matrix = getCorrelationMatrix();
    if (!matrix || matrix.length === 0) return null;

    return (
      <View style={styles.matrixContainer}>
        <Text style={styles.matrixTitle}>Correlation Matrix</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header row */}
            <View style={styles.matrixRow}>
              <View style={styles.matrixHeaderCell}>
                <Text style={styles.matrixHeaderText}></Text>
              </View>
              {matrix[0]?.variables.map((variable, index) => (
                <View key={index} style={styles.matrixHeaderCell}>
                  <Text style={styles.matrixHeaderText} numberOfLines={1}>
                    {variable.substring(0, 8)}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Data rows */}
            {matrix.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.matrixRow}>
                <View style={styles.matrixHeaderCell}>
                  <Text style={styles.matrixHeaderText} numberOfLines={1}>
                    {row.variables[0]?.substring(0, 8)}
                  </Text>
                </View>
                {row.correlations.map((correlation, colIndex) => (
                  <View
                    key={colIndex}
                    style={[
                      styles.matrixCell,
                      { backgroundColor: getCorrelationColor(correlation) + '20' }
                    ]}
                  >
                    <Text style={[
                      styles.matrixCellText,
                      { color: getCorrelationColor(correlation) }
                    ]}>
                      {correlation.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const generateScatterPlot = (correlation: CorrelationInsight) => {
    if (!correlation.scatterData) return null;

    const data = {
      datasets: [{
        data: correlation.scatterData.map(point => ({
          x: point.x,
          y: point.y
        })),
        color: () => getCorrelationColor(correlation.strength),
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {correlation.variableX} vs {correlation.variableY}
        </Text>
        <ScatterChart
          data={data}
          width={screenWidth - 80}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 2,
            color: (opacity = 1) => getCorrelationColor(correlation.strength),
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
          }}
          style={styles.chart}
        />
      </View>
    );
  };

  const generateTrendChart = (correlation: CorrelationInsight) => {
    if (!correlation.timeSeriesData) return null;

    const data = {
      labels: correlation.timeSeriesData.map(point => 
        new Date(point.timestamp).toLocaleDateString().split('/')[1]
      ),
      datasets: [
        {
          data: correlation.timeSeriesData.map(point => point.correlation),
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
          strokeWidth: 2,
        }
      ]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Correlation Trend Over Time</Text>
        <LineChart
          data={data}
          width={screenWidth - 80}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#2ECC71'
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderCorrelationCard = (correlation: CorrelationInsight, index: number) => (
    <TouchableOpacity
      key={correlation.id}
      style={[
        styles.correlationCard,
        selectedCorrelation?.id === correlation.id && styles.selectedCard
      ]}
      onPress={() => setSelectedCorrelation(correlation)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.variablesContainer}>
          <Text style={styles.variableText}>{correlation.variableX}</Text>
          <Text style={styles.correlationSymbol}>⟷</Text>
          <Text style={styles.variableText}>{correlation.variableY}</Text>
        </View>
        <View style={[
          styles.strengthBadge,
          { backgroundColor: getCorrelationColor(correlation.strength) }
        ]}>
          <Text style={styles.strengthText}>
            {correlation.strength > 0 ? '+' : ''}{correlation.strength.toFixed(3)}
          </Text>
        </View>
      </View>

      <Text style={styles.strengthLabel}>
        {getCorrelationStrengthLabel(correlation.strength)} {correlation.type} Correlation
      </Text>

      <View style={styles.cardMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>P-Value</Text>
          <Text style={styles.metricValue}>
            {correlation.pValue ? correlation.pValue.toExponential(2) : 'N/A'}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Sample Size</Text>
          <Text style={styles.metricValue}>{correlation.sampleSize}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Confidence</Text>
          <Text style={styles.metricValue}>
            {correlation.confidence ? (correlation.confidence * 100).toFixed(1) + '%' : 'N/A'}
          </Text>
        </View>
      </View>

      {correlation.significance && (
        <View style={[
          styles.significanceTag,
          { 
            backgroundColor: correlation.significance === 'significant' ? '#2ECC71' : 
                           correlation.significance === 'marginally_significant' ? '#F39C12' : '#95A5A6'
          }
        ]}>
          <Text style={styles.significanceText}>
            {correlation.significance.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCorrelationDetails = () => {
    if (!selectedCorrelation) {
      return (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>
            Select a correlation to view detailed analysis
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>
          {selectedCorrelation.variableX} ⟷ {selectedCorrelation.variableY}
        </Text>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Correlation Analysis</Text>
          <Text style={styles.analysisText}>
            This {getCorrelationStrengthLabel(selectedCorrelation.strength).toLowerCase()} {' '}
            {selectedCorrelation.strength > 0 ? 'positive' : 'negative'} correlation indicates that 
            as {selectedCorrelation.variableX} {selectedCorrelation.strength > 0 ? 'increases' : 'decreases'}, {' '}
            {selectedCorrelation.variableY} tends to {selectedCorrelation.strength > 0 ? 'increase' : 'decrease'} as well.
          </Text>
          
          {selectedCorrelation.interpretation && (
            <Text style={styles.interpretationText}>
              📊 {selectedCorrelation.interpretation}
            </Text>
          )}
        </View>

        {generateScatterPlot(selectedCorrelation)}
        {generateTrendChart(selectedCorrelation)}

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Statistical Details</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Correlation Coefficient</Text>
              <Text style={[
                styles.statValue,
                { color: getCorrelationColor(selectedCorrelation.strength) }
              ]}>
                {selectedCorrelation.strength.toFixed(4)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>R-Squared</Text>
              <Text style={styles.statValue}>
                {(selectedCorrelation.strength ** 2).toFixed(4)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Method</Text>
              <Text style={styles.statValue}>{selectedCorrelation.type}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Significance</Text>
              <Text style={styles.statValue}>
                {selectedCorrelation.significance || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {selectedCorrelation.implications && selectedCorrelation.implications.length > 0 && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Business Implications</Text>
            {selectedCorrelation.implications.map((implication, index) => (
              <View key={index} style={styles.implicationItem}>
                <Text style={styles.implicationText}>• {implication}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Correlation Analysis</Text>
        <Text style={styles.subtitle}>
          {correlations.length} correlations found
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Method:</Text>
          <View style={styles.methodButtons}>
            {(['pearson', 'spearman', 'kendall'] as CorrelationType[]).map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.methodButton,
                  correlationType === method && styles.activeMethod
                ]}
                onPress={() => setCorrelationType(method)}
              >
                <Text style={[
                  styles.methodText,
                  correlationType === method && styles.activeMethodText
                ]}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Min Strength:</Text>
          <View style={styles.strengthButtons}>
            {[0.1, 0.3, 0.5, 0.7].map(strength => (
              <TouchableOpacity
                key={strength}
                style={[
                  styles.strengthButton,
                  minStrength === strength && styles.activeStrength
                ]}
                onPress={() => setMinStrength(strength)}
              >
                <Text style={[
                  styles.strengthButtonText,
                  minStrength === strength && styles.activeStrengthText
                ]}>
                  {strength}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {generateCorrelationMatrix()}

      <View style={styles.contentContainer}>
        {/* Correlations List */}
        <View style={styles.listContainer}>
          <ScrollView style={styles.correlationsList} showsVerticalScrollIndicator={false}>
            {correlations.map((correlation, index) => 
              renderCorrelationCard(correlation, index)
            )}
          </ScrollView>
        </View>

        {/* Correlation Details */}
        <View style={styles.detailsPane}>
          {renderCorrelationDetails()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  controlsContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  controlGroup: {
    marginBottom: 15,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  methodButtons: {
    flexDirection: 'row',
  },
  methodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeMethod: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  methodText: {
    fontSize: 12,
    color: '#495057',
  },
  activeMethodText: {
    color: '#ffffff',
  },
  strengthButtons: {
    flexDirection: 'row',
  },
  strengthButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeStrength: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  strengthButtonText: {
    fontSize: 12,
    color: '#495057',
  },
  activeStrengthText: {
    color: '#ffffff',
  },
  matrixContainer: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matrixTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
  },
  matrixHeaderCell: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  matrixHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  matrixCell: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  matrixCellText: {
    fontSize: 10,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  listContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  correlationsList: {
    padding: 15,
  },
  correlationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#2ECC71',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  variablesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  variableText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    maxWidth: 80,
  },
  correlationSymbol: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  strengthLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  cardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  significanceTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  significanceText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  detailsPane: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  detailsContainer: {
    padding: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  analysisText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  interpretationText: {
    fontSize: 14,
    color: '#2ECC71',
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  chartContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  implicationItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  implicationText: {
    fontSize: 14,
    color: '#666',
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noSelectionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default CorrelationAnalysisWidget;