/**
 * Enhanced Insights React Hooks
 * Phase 4.2: Advanced AI/ML Features
 * Hooks for NLP-powered insights and advanced pattern detection
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
  NLPSummary,
} from '../types/enhancedInsights';

// ===============================
// ENHANCED INSIGHTS HOOKS
// ===============================

/**
 * Hook for managing enhanced insights with NLP capabilities
 */
export function useEnhancedInsights(initialFilters?: InsightFilters) {
  const [insights, setInsights] = useState<EnhancedInsight[]>([]);
  const [analytics, setAnalytics] = useState<InsightAnalytics | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InsightFilters>(initialFilters || {});
  const [page, setPage] = useState(1);

  const loadInsights = useCallback(async (newPage = 1, newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await EnhancedInsightsService.getEnhancedInsights(
        newFilters,
        newPage,
        20
      );
      
      setInsights(response.insights);
      setAnalytics(response.analytics);
      setTotal(response.total);
      setPage(newPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: InsightFilters) => {
    setFilters(newFilters);
    loadInsights(1, newFilters);
  }, [loadInsights]);

  const updateInsightStatus = useCallback(async (
    insightId: string,
    status: EnhancedInsight['status'],
    assignedTo?: string,
    notes?: string
  ) => {
    try {
      setError(null);
      const updatedInsight = await EnhancedInsightsService.updateInsightStatus(
        insightId,
        status,
        assignedTo,
        notes
      );
      
      // Update local state
      setInsights(prev =>
        prev.map(insight =>
          insight.id === insightId ? updatedInsight : insight
        )
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update insight');
      return false;
    }
  }, []);

  const generateInsights = useCallback(async (
    dataSource: string,
    options?: {
      includeNLP?: boolean;
      includePatterns?: boolean;
      includeCorrelations?: boolean;
      includePredictions?: boolean;
    }
  ) => {
    try {
      setError(null);
      const result = await EnhancedInsightsService.generateInsights(dataSource, options);
      
      // Refresh insights after generation
      await loadInsights();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      return null;
    }
  }, [loadInsights]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return {
    insights,
    analytics,
    total,
    loading,
    error,
    filters,
    page,
    loadInsights,
    updateFilters,
    updateInsightStatus,
    generateInsights,
    nextPage: () => loadInsights(page + 1),
    previousPage: () => loadInsights(Math.max(1, page - 1)),
  };
}

/**
 * Hook for individual enhanced insight details
 */
export function useEnhancedInsight(insightId: string | null) {
  const [insight, setInsight] = useState<EnhancedInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsight = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await EnhancedInsightsService.getInsightDetails(id);
      setInsight(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insight');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (insightId) {
      loadInsight(insightId);
    } else {
      setInsight(null);
    }
  }, [insightId, loadInsight]);

  return {
    insight,
    loading,
    error,
    reload: () => insightId && loadInsight(insightId),
  };
}

// ===============================
// PATTERN DETECTION HOOKS
// ===============================

/**
 * Hook for pattern detection in metrics
 */
export function usePatternDetection() {
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectPatterns = useCallback(async (
    metrics: string[],
    timeRange: { start: string; end: string },
    options?: {
      minStrength?: number;
      patternTypes?: string[];
      includeSeasonality?: boolean;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const detectedPatterns = await EnhancedInsightsService.detectPatterns(
        metrics,
        timeRange,
        options
      );
      setPatterns(detectedPatterns);
      return detectedPatterns;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect patterns');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeMetricPatterns = useCallback(async (
    metric: string,
    timeRange: { start: string; end: string }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const patterns = await EnhancedInsightsService.getPatternAnalysis(metric, timeRange);
      return patterns;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze patterns');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    patterns,
    loading,
    error,
    detectPatterns,
    analyzeMetricPatterns,
  };
}

// ===============================
// CORRELATION ANALYSIS HOOKS
// ===============================

/**
 * Hook for correlation analysis between metrics
 */
export function useCorrelationAnalysis() {
  const [correlations, setCorrelations] = useState<CorrelationAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCorrelations = useCallback(async (
    metrics: string[],
    timeRange: { start: string; end: string },
    options?: {
      minCorrelation?: number;
      correlationTypes?: string[];
      includeCausality?: boolean;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const analysis = await EnhancedInsightsService.analyzeCorrelations(
        metrics,
        timeRange,
        options
      );
      setCorrelations(analysis);
      return analysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze correlations');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    correlations,
    loading,
    error,
    analyzeCorrelations,
  };
}

// ===============================
// PREDICTIVE INSIGHTS HOOKS
// ===============================

/**
 * Hook for predictive insights generation
 */
export function usePredictiveInsights() {
  const [predictions, setPredictions] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePredictions = useCallback(async (
    metrics: string[],
    horizon: string,
    options?: {
      includeScenarios?: boolean;
      includeRisks?: boolean;
      includeOpportunities?: boolean;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const insights = await EnhancedInsightsService.generatePredictiveInsights(
        metrics,
        horizon,
        options
      );
      setPredictions(insights);
      return insights;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate predictions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    predictions,
    loading,
    error,
    generatePredictions,
  };
}

// ===============================
// NLP PROCESSING HOOKS
// ===============================

/**
 * Hook for NLP text processing
 */
export function useNLPProcessor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processText = useCallback(async (
    text: string,
    options?: {
      extractEntities?: boolean;
      analyzeSentiment?: boolean;
      identifyTopics?: boolean;
      extractKeyPhrases?: boolean;
    }
  ): Promise<NLPSummary | null> => {
    try {
      setLoading(true);
      setError(null);
      const summary = await EnhancedInsightsService.processTextWithNLP(text, options);
      return summary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process text');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    processText,
  };
}

// ===============================
// REAL-TIME INSIGHTS HOOKS
// ===============================

/**
 * Hook for real-time insight streaming
 */
export function useInsightStream(filters: InsightFilters) {
  const [stream, setStream] = useState<InsightStream | null>(null);
  const [insights, setInsights] = useState<EnhancedInsight[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<InsightStream | null>(null);

  const startStream = useCallback(async () => {
    try {
      setError(null);
      
      const newStream = await EnhancedInsightsService.startInsightStream(
        filters,
        (insight: EnhancedInsight) => {
          setInsights(prev => [insight, ...prev.slice(0, 49)]); // Keep last 50 insights
        }
      );
      
      setStream(newStream);
      streamRef.current = newStream;
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start insight stream');
    }
  }, [filters]);

  const stopStream = useCallback(async () => {
    if (streamRef.current) {
      try {
        await EnhancedInsightsService.stopInsightStream(streamRef.current.id);
        setConnected(false);
        setStream(null);
        streamRef.current = null;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to stop insight stream');
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup stream on unmount
      if (streamRef.current) {
        EnhancedInsightsService.stopInsightStream(streamRef.current.id);
      }
    };
  }, []);

  return {
    stream,
    insights,
    connected,
    error,
    startStream,
    stopStream,
  };
}

// ===============================
// ANALYTICS HOOKS
// ===============================

/**
 * Hook for insight analytics and metrics
 */
export function useInsightAnalytics(timeRange?: { start: string; end: string }) {
  const [analytics, setAnalytics] = useState<InsightAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EnhancedInsightsService.getInsightAnalytics(timeRange);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    reload: loadAnalytics,
  };
}

// ===============================
// COMBINED DASHBOARD HOOK
// ===============================

/**
 * Combined hook for enhanced insights dashboard
 */
export function useEnhancedInsightsDashboard(filters?: InsightFilters) {
  const insightsData = useEnhancedInsights(filters);
  const analyticsData = useInsightAnalytics();
  const patternData = usePatternDetection();
  const correlationData = useCorrelationAnalysis();

  const quickStats = {
    totalInsights: insightsData.total,
    newInsights: insightsData.insights.filter(i => i.status === 'new').length,
    criticalInsights: insightsData.insights.filter(i => i.severity === 'critical').length,
    averageConfidence: analyticsData.analytics?.averageConfidence || 0,
    topCategory: analyticsData.analytics ? 
      Object.entries(analyticsData.analytics.byCategory)
        .sort(([,a], [,b]) => b - a)[0]?.[0] : 'N/A',
  };

  return {
    insights: insightsData,
    analytics: analyticsData,
    patterns: patternData,
    correlations: correlationData,
    quickStats,
    loading: insightsData.loading || analyticsData.loading,
    error: insightsData.error || analyticsData.error,
  };
}

// Hook exports
export {
  useEnhancedInsights,
  useEnhancedInsight,
  usePatternDetection,
  useCorrelationAnalysis,
  usePredictiveInsights,
  useNLPProcessor,
  useInsightStream,
  useInsightAnalytics,
  useEnhancedInsightsDashboard,
};