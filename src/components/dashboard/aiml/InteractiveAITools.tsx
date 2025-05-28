/**
 * Interactive AI Tools Component
 * Phase 4.2: Advanced AI/ML Features
 * Scenario modeling and what-if analysis tools
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button, TextInput, Picker } from '../../../atomic';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { useEnhancedInsights } from '../../../hooks/useEnhancedInsights';
import {
  ScenarioAnalysis,
  WhatIfAnalysis,
  ModelSimulation,
  InteractiveVisualization,
  ScenarioComparison,
} from '../../../types/interactiveAI';
import { ChartComponent } from '../charts/ChartComponent';
import { LoadingState } from '../../atoms/LoadingState';
import { ErrorBoundary } from '../../organisms/ErrorBoundary';

const { width: screenWidth } = Dimensions.get('window');

interface InteractiveAIToolsProps {
  className?: string;
}

export const InteractiveAITools: React.FC<InteractiveAIToolsProps> = ({
  className,
}) => {
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  
  // State management
  const [activeTab, setActiveTab] = useState<'scenario' | 'whatif' | 'simulation' | 'comparison'>('scenario');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');
  const [scenarioParams, setScenarioParams] = useState<Record<string, number>>({});
  const [simulationResults, setSimulationResults] = useState<ModelSimulation | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Custom hooks
  const {
    scenarios,
    whatIfAnalysis,
    runScenarioAnalysis,
    runWhatIfAnalysis,
    runModelSimulation,
    compareScenarios,
    loading,
    error,
  } = useEnhancedInsights();

  // Available metrics for analysis
  const availableMetrics = [
    { label: 'Revenue', value: 'revenue' },
    { label: 'User Engagement', value: 'engagement' },
    { label: 'Conversion Rate', value: 'conversion' },
    { label: 'Customer Acquisition Cost', value: 'cac' },
    { label: 'Churn Rate', value: 'churn' },
    { label: 'Lifetime Value', value: 'ltv' },
  ];

  // Run scenario analysis
  const handleRunScenario = useCallback(async () => {
    if (!selectedMetric) {
      Alert.alert('Error', 'Please select a metric to analyze');
      return;
    }

    setIsRunning(true);
    try {
      const result = await runScenarioAnalysis(selectedMetric, scenarioParams);
      setSimulationResults(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to run scenario analysis');
      console.error('Scenario analysis error:', error);
    } finally {
      setIsRunning(false);
    }
  }, [selectedMetric, scenarioParams, runScenarioAnalysis]);

  // Update scenario parameters
  const updateScenarioParam = useCallback((param: string, value: number) => {
    setScenarioParams(prev => ({
      ...prev,
      [param]: value,
    }));
  }, []);

  // Render scenario builder
  const renderScenarioBuilder = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Scenario Builder
      </Text>
      <Text style={[styles.sectionDescription, { color: textColor }]}>
        Create and analyze custom scenarios to understand potential outcomes
      </Text>

      {/* Metric Selection */}
      <Card style={styles.parameterCard}>
        <Text style={[styles.cardTitle, { color: textColor }]}>
          Primary Metric
        </Text>
        <Picker
          selectedValue={selectedMetric}
          onValueChange={setSelectedMetric}
          items={availableMetrics}
          style={styles.picker}
        />
      </Card>

      {/* Parameter Inputs */}
      <Card style={styles.parameterCard}>
        <Text style={[styles.cardTitle, { color: textColor }]}>
          Scenario Parameters
        </Text>
        
        <View style={styles.parameterGrid}>
          <View style={styles.parameterInput}>
            <Text style={[styles.parameterLabel, { color: textColor }]}>
              Growth Rate (%)
            </Text>
            <TextInput
              value={scenarioParams.growthRate?.toString() || ''}
              onChangeText={(text) => updateScenarioParam('growthRate', parseFloat(text) || 0)}
              placeholder="15"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.parameterInput}>
            <Text style={[styles.parameterLabel, { color: textColor }]}>
              Market Factor
            </Text>
            <TextInput
              value={scenarioParams.marketFactor?.toString() || ''}
              onChangeText={(text) => updateScenarioParam('marketFactor', parseFloat(text) || 0)}
              placeholder="1.0"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.parameterInput}>
            <Text style={[styles.parameterLabel, { color: textColor }]}>
              Seasonality
            </Text>
            <TextInput
              value={scenarioParams.seasonality?.toString() || ''}
              onChangeText={(text) => updateScenarioParam('seasonality', parseFloat(text) || 0)}
              placeholder="0.2"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.parameterInput}>
            <Text style={[styles.parameterLabel, { color: textColor }]}>
              External Impact
            </Text>
            <TextInput
              value={scenarioParams.externalImpact?.toString() || ''}
              onChangeText={(text) => updateScenarioParam('externalImpact', parseFloat(text) || 0)}
              placeholder="0"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <Button
          title={isRunning ? 'Running Analysis...' : 'Run Scenario Analysis'}
          onPress={handleRunScenario}
          disabled={isRunning || loading}
          style={[styles.runButton, { backgroundColor: primaryColor }]}
        />
      </Card>

      {/* Results Visualization */}
      {simulationResults && (
        <Card style={styles.resultsCard}>
          <Text style={[styles.cardTitle, { color: textColor }]}>
            Scenario Results
          </Text>
          
          <View style={styles.resultsSummary}>
            <View style={styles.resultItem}>
              <Text style={[styles.resultLabel, { color: textColor }]}>
                Predicted Value
              </Text>
              <Text style={[styles.resultValue, { color: primaryColor }]}>
                {simulationResults.predictedOutcome.value.toLocaleString()}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={[styles.resultLabel, { color: textColor }]}>
                Confidence
              </Text>
              <Text style={[styles.resultValue, { color: primaryColor }]}>
                {(simulationResults.predictedOutcome.confidence * 100).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={[styles.resultLabel, { color: textColor }]}>
                Risk Level
              </Text>
              <Text style={[styles.resultValue, { 
                color: simulationResults.riskAssessment.level === 'high' ? '#ff4757' : 
                       simulationResults.riskAssessment.level === 'medium' ? '#ffa502' : '#2ed573'
              }]}>
                {simulationResults.riskAssessment.level.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Outcome Chart */}
          <ChartComponent
            type="line"
            data={{
              labels: simulationResults.timeSeriesData.timestamps,
              datasets: [{
                label: 'Predicted Outcome',
                data: simulationResults.timeSeriesData.values,
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}20`,
                fill: true,
              }],
            }}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `${selectedMetric} Scenario Projection`,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
            style={styles.chart}
          />

          {/* Key Factors */}
          <View style={styles.factorsSection}>
            <Text style={[styles.sectionSubtitle, { color: textColor }]}>
              Key Influencing Factors
            </Text>
            {simulationResults.influencingFactors.map((factor, index) => (
              <View key={index} style={styles.factorItem}>
                <Text style={[styles.factorName, { color: textColor }]}>
                  {factor.name}
                </Text>
                <View style={styles.factorDetails}>
                  <Text style={[styles.factorImpact, { 
                    color: factor.impact > 0 ? '#2ed573' : '#ff4757'
                  }]}>
                    {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}%
                  </Text>
                  <Text style={[styles.factorConfidence, { color: textColor }]}>
                    ({(factor.confidence * 100).toFixed(0)}% confidence)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}
    </View>
  );

  // Render what-if analysis
  const renderWhatIfAnalysis = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        What-If Analysis
      </Text>
      <Text style={[styles.sectionDescription, { color: textColor }]}>
        Explore the impact of specific changes on your metrics
      </Text>

      <Card style={styles.parameterCard}>
        <Text style={[styles.cardTitle, { color: textColor }]}>
          Change Variables
        </Text>
        
        <View style={styles.whatIfGrid}>
          <TouchableOpacity style={styles.whatIfOption}>
            <Text style={[styles.whatIfTitle, { color: textColor }]}>
              Increase Marketing Spend
            </Text>
            <Text style={[styles.whatIfSubtitle, { color: textColor }]}>
              +25% budget allocation
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatIfOption}>
            <Text style={[styles.whatIfTitle, { color: textColor }]}>
              Feature Launch
            </Text>
            <Text style={[styles.whatIfSubtitle, { color: textColor }]}>
              New premium feature
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatIfOption}>
            <Text style={[styles.whatIfTitle, { color: textColor }]}>
              Price Adjustment
            </Text>
            <Text style={[styles.whatIfSubtitle, { color: textColor }]}>
              ±10% subscription cost
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatIfOption}>
            <Text style={[styles.whatIfTitle, { color: textColor }]}>
              Market Expansion
            </Text>
            <Text style={[styles.whatIfSubtitle, { color: textColor }]}>
              Enter new geographic market
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  // Render model simulation
  const renderModelSimulation = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Model Simulation
      </Text>
      <Text style={[styles.sectionDescription, { color: textColor }]}>
        Run advanced simulations using machine learning models
      </Text>

      <Card style={styles.simulationCard}>
        <Text style={[styles.cardTitle, { color: textColor }]}>
          Monte Carlo Simulation
        </Text>
        <Text style={[styles.cardDescription, { color: textColor }]}>
          Run thousands of scenarios to understand outcome distribution
        </Text>
        
        <Button
          title="Run Simulation"
          onPress={() => {}}
          style={[styles.simulationButton, { backgroundColor: primaryColor }]}
        />
      </Card>

      <Card style={styles.simulationCard}>
        <Text style={[styles.cardTitle, { color: textColor }]}>
          Sensitivity Analysis
        </Text>
        <Text style={[styles.cardDescription, { color: textColor }]}>
          Identify which variables have the highest impact
        </Text>
        
        <Button
          title="Analyze Sensitivity"
          onPress={() => {}}
          style={[styles.simulationButton, { backgroundColor: primaryColor }]}
        />
      </Card>
    </View>
  );

  // Render scenario comparison
  const renderScenarioComparison = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Scenario Comparison
      </Text>
      <Text style={[styles.sectionDescription, { color: textColor }]}>
        Compare multiple scenarios side by side
      </Text>

      <Card style={styles.comparisonCard}>
        <Text style={[styles.cardTitle, { color: textColor }]}>
          Select Scenarios to Compare
        </Text>
        
        <View style={styles.comparisonGrid}>
          <TouchableOpacity style={[styles.scenarioOption, { borderColor: primaryColor }]}>
            <Text style={[styles.scenarioName, { color: textColor }]}>
              Conservative Growth
            </Text>
            <Text style={[styles.scenarioDescription, { color: textColor }]}>
              5% annual growth
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.scenarioOption, { borderColor: primaryColor }]}>
            <Text style={[styles.scenarioName, { color: textColor }]}>
              Aggressive Expansion
            </Text>
            <Text style={[styles.scenarioDescription, { color: textColor }]}>
              25% growth with investment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.scenarioOption, { borderColor: primaryColor }]}>
            <Text style={[styles.scenarioName, { color: textColor }]}>
              Market Downturn
            </Text>
            <Text style={[styles.scenarioDescription, { color: textColor }]}>
              -10% external impact
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Compare Scenarios"
          onPress={() => {}}
          style={[styles.compareButton, { backgroundColor: primaryColor }]}
        />
      </Card>
    </View>
  );

  // Tab navigation
  const tabs = [
    { key: 'scenario', label: 'Scenario Builder', icon: '📊' },
    { key: 'whatif', label: 'What-If Analysis', icon: '🤔' },
    { key: 'simulation', label: 'Simulation', icon: '🎯' },
    { key: 'comparison', label: 'Comparison', icon: '⚖️' },
  ];

  if (loading) {
    return <LoadingState message="Loading Interactive AI Tools..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: '#ff4757' }]}>
          Error loading AI tools: {error}
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor }]} className={className}>
        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
                { borderBottomColor: activeTab === tab.key ? primaryColor : 'transparent' }
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? primaryColor : textColor }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeTab === 'scenario' && renderScenarioBuilder()}
          {activeTab === 'whatif' && renderWhatIfAnalysis()}
          {activeTab === 'simulation' && renderModelSimulation()}
          {activeTab === 'comparison' && renderScenarioComparison()}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
  },
  activeTab: {
    backgroundColor: '#f8f9fa',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 22,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  parameterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    lineHeight: 20,
  },
  picker: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  parameterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  parameterInput: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  parameterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  runButton: {
    marginTop: 16,
    height: 44,
    borderRadius: 8,
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  resultItem: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chart: {
    height: 200,
    marginBottom: 20,
  },
  factorsSection: {
    marginTop: 16,
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  factorName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  factorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorImpact: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  factorConfidence: {
    fontSize: 12,
    opacity: 0.7,
  },
  whatIfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  whatIfOption: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  whatIfTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  whatIfSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  simulationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  simulationButton: {
    height: 44,
    borderRadius: 8,
  },
  comparisonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  comparisonGrid: {
    marginBottom: 20,
  },
  scenarioOption: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scenarioDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  compareButton: {
    height: 44,
    borderRadius: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default InteractiveAITools;