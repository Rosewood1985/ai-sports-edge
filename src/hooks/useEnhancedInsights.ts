/**
 * Enhanced Insights Hooks
 * Phase 4.2: Advanced AI/ML Features
 * React hooks for enhanced insights and interactive AI tools
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { EnhancedInsightsService } from '../services/enhancedInsightsService';
import {
  EnhancedInsight,
  PatternDetection,
  CorrelationAnalysis,
  PredictiveInsight,
  InsightFilters,
  InsightAnalytics,
  InsightBatchResult,
  InsightStream,
} from '../types/enhancedInsights';
import {
  ScenarioAnalysis,
  WhatIfAnalysis,
  ModelSimulation,
  ScenarioComparison,
  ScenarioParameters,
} from '../types/interactiveAI';

// Main hook for enhanced insights
export const useEnhancedInsights = () => {
  const [insights, setInsights] = useState<EnhancedInsight[]>([]);
  const [analytics, setAnalytics] = useState<InsightAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Scenarios state
  const [scenarios, setScenarios] = useState<ScenarioAnalysis[]>([]);
  const [whatIfAnalysis, setWhatIfAnalysis] = useState<WhatIfAnalysis | null>(null);

  // Fetch enhanced insights
  const fetchInsights = useCallback(async (filters?: InsightFilters, page = 1, limit = 20) => {
    setLoading(true);
    setError(null);

    try {
      const result = await EnhancedInsightsService.getEnhancedInsights(filters, page, limit);
      setInsights(result.insights);
      setAnalytics(result.analytics);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate insights from data
  const generateInsights = useCallback(
    async (
      dataSource: string,
      options?: {
        includeNLP?: boolean;
        includePatterns?: boolean;
        includeCorrelations?: boolean;
        includePredictions?: boolean;
      }
    ): Promise<InsightBatchResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await EnhancedInsightsService.generateInsights(dataSource, options);
        // Refresh insights after generation
        await fetchInsights();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate insights');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchInsights]
  );

  // Update insight status
  const updateInsightStatus = useCallback(
    async (
      insightId: string,
      status: EnhancedInsight['status'],
      assignedTo?: string,
      notes?: string
    ) => {
      try {
        const updatedInsight = await EnhancedInsightsService.updateInsightStatus(
          insightId,
          status,
          assignedTo,
          notes
        );

        // Update local state
        setInsights(prev =>
          prev.map(insight => (insight.id === insightId ? updatedInsight : insight))
        );

        return updatedInsight;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update insight');
        throw err;
      }
    },
    []
  );

  // Run scenario analysis
  const runScenarioAnalysis = useCallback(
    async (metric: string, parameters: ScenarioParameters): Promise<ModelSimulation> => {
      setLoading(true);
      setError(null);

      try {
        // Mock implementation - in real app, this would call a service
        const result: ModelSimulation = {
          id: `simulation_${Date.now()}`,
          name: `${metric} Scenario Analysis`,
          type: 'monte_carlo',
          model: {
            id: 'scenario_model_v1',
            name: 'Scenario Analysis Model',
            version: '1.0.0',
            description: 'General scenario analysis model',
            inputs: [],
            outputs: [],
            assumptions: ['Normal market conditions', 'Linear growth patterns'],
            limitations: ['6-month horizon', 'Single metric focus'],
          },
          parameters: {
            iterations: 10000,
            timeHorizon: '6 months',
            timeStep: '1 day',
            confidenceLevel: 0.95,
            convergenceCriteria: {
              enabled: true,
              tolerance: 0.001,
              minIterations: 1000,
              maxIterations: 50000,
              metric: 'standard_error',
            },
            customSettings: parameters,
          },
          results: {
            summary: {
              iterations: 10000,
              convergenceReached: true,
              computeTime: 2450,
              meanOutcome: 125000,
              medianOutcome: 123000,
              confidenceIntervals: [
                { level: 95, lowerBound: 95000, upperBound: 155000 },
                { level: 90, lowerBound: 102000, upperBound: 148000 },
              ],
              percentiles: [
                { percentile: 5, value: 95000 },
                { percentile: 25, value: 115000 },
                { percentile: 75, value: 135000 },
                { percentile: 95, value: 155000 },
              ],
            },
            distributions: [],
            correlations: { variables: [], matrix: [], significanceMatrix: [] },
            sensitivityAnalysis: [],
            scenarios: [],
            performance: {
              executionTime: 2450,
              memoryUsage: 256,
              convergenceIterations: 8500,
              accuracy: 0.95,
              stability: 0.89,
            },
          },
          validation: {
            backtesting: [],
            crossValidation: {
              folds: 5,
              averageError: 0.12,
              standardDeviation: 0.08,
              r2Score: 0.85,
              meanAbsoluteError: 0.09,
            },
            realityCheck: [],
            uncertaintyQuantification: {
              aleatory: 0.15,
              epistemic: 0.08,
              total: 0.23,
              propagation: [],
            },
          },
          predictedOutcome: {
            value: 125000,
            confidence: 0.84,
            range: {
              lower: 118000,
              upper: 132000,
              percentile95: 155000,
              percentile5: 95000,
            },
            distribution: {
              type: 'normal',
              mean: 125000,
              median: 123000,
              standardDeviation: 15000,
            },
          },
          influencingFactors: [
            {
              name: 'Growth Rate',
              impact: parameters.growthRate || 15,
              confidence: 0.89,
              description: 'User and revenue growth rate',
              controllable: true,
            },
            {
              name: 'Market Factor',
              impact: (parameters.marketFactor || 1.0) * 10,
              confidence: 0.76,
              description: 'Overall market conditions',
              controllable: false,
            },
            {
              name: 'Seasonality',
              impact: (parameters.seasonality || 0.2) * 20,
              confidence: 0.92,
              description: 'Seasonal variations',
              controllable: false,
            },
          ],
          timeSeriesData: {
            timestamps: Array.from({ length: 180 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              return date.toISOString().split('T')[0];
            }),
            values: Array.from({ length: 180 }, (_, i) => {
              const base = 125000;
              const growth = (parameters.growthRate || 15) / 100;
              const seasonality =
                Math.sin((i / 365) * 2 * Math.PI) * (parameters.seasonality || 0.2);
              const noise = (Math.random() - 0.5) * 0.1;
              return base * (1 + (growth * i) / 365 + seasonality + noise);
            }),
            metadata: {
              frequency: 'daily',
              seasonality: true,
              trend: 'increasing',
            },
          },
          riskAssessment: {
            level: 'medium',
            score: 45,
            factors: [
              {
                name: 'Market Volatility',
                impact: -12,
                probability: 0.35,
                category: 'market',
                description: 'Potential market downturns',
                earlyWarningSignals: ['Economic indicators', 'Competitor actions'],
              },
            ],
            mitigationStrategies: [
              {
                name: 'Diversification',
                description: 'Diversify revenue streams',
                effectiveness: 0.7,
                cost: 50000,
                timeToImplement: '3 months',
                prerequisites: ['Market analysis', 'Product development'],
              },
            ],
            monitoringRequirements: ['Weekly performance reviews', 'Market condition tracking'],
          },
        };

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to run scenario analysis');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Run what-if analysis
  const runWhatIfAnalysis = useCallback(
    async (question: string, changes: Record<string, number>): Promise<WhatIfAnalysis> => {
      setLoading(true);
      setError(null);

      try {
        // Mock implementation
        const result: WhatIfAnalysis = {
          id: `whatif_${Date.now()}`,
          question,
          baselineScenario: {
            id: 'baseline',
            name: 'Current State',
            variables: { revenue: 100000, users: 5000, conversion: 0.15 },
            outcomes: { revenue: 100000, growth: 0.12 },
            metadata: {
              createdAt: new Date().toISOString(),
              computeTime: 150,
              confidence: 0.85,
            },
          },
          modifiedScenario: {
            id: 'modified',
            name: 'Modified State',
            variables: { ...changes },
            outcomes: { revenue: 125000, growth: 0.18 },
            metadata: {
              createdAt: new Date().toISOString(),
              computeTime: 180,
              confidence: 0.82,
            },
          },
          variableChanges: Object.entries(changes).map(([variable, newValue]) => ({
            variable,
            originalValue: 100000, // mock original
            newValue,
            changePercent: ((newValue - 100000) / 100000) * 100,
            changeType: 'relative',
            justification: `Modified ${variable} to test impact`,
          })),
          impactAnalysis: {
            primaryMetrics: [
              {
                metric: 'revenue',
                currentValue: 100000,
                projectedValue: 125000,
                absoluteChange: 25000,
                percentageChange: 25,
                confidence: 0.84,
                significance: 'high',
              },
            ],
            secondaryMetrics: [],
            cascadingEffects: [],
            timeToImpact: '2-4 weeks',
            persistenceDuration: '6+ months',
          },
          sensitivityAnalysis: {
            mostSensitiveVariables: [],
            elasticity: [],
            thresholds: [],
            robustness: {
              overall: 75,
              volatility: 25,
              resilience: 80,
              adaptability: 70,
              factors: ['Market conditions', 'User behavior'],
            },
          },
          recommendations: [],
        };

        setWhatIfAnalysis(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to run what-if analysis');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Run model simulation
  const runModelSimulation = useCallback(
    async (
      modelType: 'monte_carlo' | 'discrete_event' | 'agent_based',
      parameters: Record<string, any>
    ): Promise<ModelSimulation> => {
      return runScenarioAnalysis('simulation', parameters);
    },
    [runScenarioAnalysis]
  );

  // Compare scenarios
  const compareScenarios = useCallback(
    async (scenarioIds: string[]): Promise<ScenarioComparison> => {
      setLoading(true);
      setError(null);

      try {
        // Mock implementation
        const result: ScenarioComparison = {
          id: `comparison_${Date.now()}`,
          name: 'Scenario Comparison',
          scenarios: scenarioIds.map(id => ({
            id,
            name: `Scenario ${id}`,
            description: 'Mock scenario for comparison',
            parameters: { growth: 15, risk: 0.2 },
            outcomes: { revenue: 125000, probability: 0.8 },
            risk: {
              overall: 45,
              categories: { market: 30, operational: 20 },
              mitigations: ['Diversification', 'Monitoring'],
            },
            feasibility: {
              technical: 85,
              financial: 70,
              operational: 80,
              timeline: 75,
              overall: 77,
            },
          })),
          comparisonMetrics: [],
          analysis: {
            dominantScenarios: [scenarioIds[0]],
            tradeoffs: [],
            sensitivityToChanges: [],
            robustness: [],
            optimalChoice: {
              scenarioId: scenarioIds[0],
              confidence: 0.85,
              reasoning: ['Highest expected return', 'Acceptable risk level'],
              conditions: ['Market stability', 'Resource availability'],
              monitoring: ['Weekly reviews', 'KPI tracking'],
            },
          },
          recommendations: [],
          visualization: {
            type: 'radar',
            config: {
              title: 'Scenario Comparison',
              axes: [],
              colors: ['#007bff', '#28a745', '#ffc107'],
              annotations: [],
              interactivity: {
                zoomable: true,
                pannable: true,
                selectable: true,
                tooltips: true,
                filters: [],
              },
            },
            data: {},
          },
        };

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to compare scenarios');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initialize - fetch insights on mount
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    // State
    insights,
    analytics,
    loading,
    error,
    total,
    scenarios,
    whatIfAnalysis,

    // Actions
    fetchInsights,
    generateInsights,
    updateInsightStatus,
    runScenarioAnalysis,
    runWhatIfAnalysis,
    runModelSimulation,
    compareScenarios,

    // Utility
    refresh: () => fetchInsights(),
    clearError: () => setError(null),
  };
};

// Hook for pattern detection
export const usePatternDetection = () => {
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectPatterns = useCallback(
    async (
      metrics: string[],
      timeRange: { start: string; end: string },
      options?: {
        minStrength?: number;
        patternTypes?: string[];
        includeSeasonality?: boolean;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await EnhancedInsightsService.detectPatterns(metrics, timeRange, options);
        setPatterns(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to detect patterns');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    patterns,
    loading,
    error,
    detectPatterns,
    clearError: () => setError(null),
  };
};

// Hook for correlation analysis
export const useCorrelationAnalysis = () => {
  const [correlations, setCorrelations] = useState<CorrelationAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCorrelations = useCallback(
    async (
      metrics: string[],
      timeRange: { start: string; end: string },
      options?: {
        minCorrelation?: number;
        correlationTypes?: string[];
        includeCausality?: boolean;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await EnhancedInsightsService.analyzeCorrelations(
          metrics,
          timeRange,
          options
        );
        setCorrelations(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze correlations');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    correlations,
    loading,
    error,
    analyzeCorrelations,
    clearError: () => setError(null),
  };
};

// Hook for predictive insights
export const usePredictiveInsights = () => {
  const [predictions, setPredictions] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePredictions = useCallback(
    async (
      metrics: string[],
      horizon: string,
      options?: {
        includeScenarios?: boolean;
        includeRisks?: boolean;
        includeOpportunities?: boolean;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await EnhancedInsightsService.generatePredictiveInsights(
          metrics,
          horizon,
          options
        );
        setPredictions(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate predictions');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    predictions,
    loading,
    error,
    generatePredictions,
    clearError: () => setError(null),
  };
};

// Hook for real-time insight streaming
export const useInsightStream = () => {
  const [stream, setStream] = useState<InsightStream | null>(null);
  const [insights, setInsights] = useState<EnhancedInsight[]>([]);
  const [isActive, setIsActive] = useState(false);
  const streamRef = useRef<InsightStream | null>(null);

  const startStream = useCallback(async (filters: InsightFilters) => {
    try {
      const newStream = await EnhancedInsightsService.startInsightStream(
        filters,
        (insight: EnhancedInsight) => {
          setInsights(prev => [insight, ...prev].slice(0, 100)); // Keep latest 100
        }
      );

      setStream(newStream);
      streamRef.current = newStream;
      setIsActive(true);
      return newStream;
    } catch (err) {
      console.error('Failed to start insight stream:', err);
      throw err;
    }
  }, []);

  const stopStream = useCallback(async () => {
    if (streamRef.current) {
      await EnhancedInsightsService.stopInsightStream(streamRef.current.id);
      setStream(null);
      streamRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        EnhancedInsightsService.stopInsightStream(streamRef.current.id);
      }
    };
  }, []);

  return {
    stream,
    insights,
    isActive,
    startStream,
    stopStream,
    clearInsights: () => setInsights([]),
  };
};

export default useEnhancedInsights;
