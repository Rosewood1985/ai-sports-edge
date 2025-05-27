/**
 * React hooks for AI/ML functionality in the admin dashboard
 * Phase 4.1: Foundation Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { AIMLService } from '../services/aimlService';
import {
  MLModel,
  Prediction,
  TimeSeriesForecast,
  AIInsight,
  Anomaly,
  AIRecommendation,
  TrainingJob,
  MLFilters,
  InsightFilters,
  PredictionFilters,
  PaginatedResponse,
  FeatureSet,
} from '../types/aiml';

// ===============================
// MODEL MANAGEMENT HOOKS
// ===============================

/**
 * Hook for managing ML models
 */
export function useMLModels(filters?: MLFilters) {
  const [models, setModels] = useState<PaginatedResponse<MLModel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AIMLService.getModels(filters, page, limit);
      setModels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const deployModel = useCallback(async (modelId: string) => {
    try {
      await AIMLService.deployModel(modelId);
      // Refresh models after deployment
      await loadModels();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy model');
      return false;
    }
  }, [loadModels]);

  const retireModel = useCallback(async (modelId: string) => {
    try {
      await AIMLService.retireModel(modelId);
      // Refresh models after retirement
      await loadModels();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retire model');
      return false;
    }
  }, [loadModels]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    loading,
    error,
    loadModels,
    deployModel,
    retireModel,
  };
}

/**
 * Hook for individual model details
 */
export function useMLModel(modelId: string | null) {
  const [model, setModel] = useState<MLModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModel = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AIMLService.getModel(id);
      setModel(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (modelId) {
      loadModel(modelId);
    } else {
      setModel(null);
    }
  }, [modelId, loadModel]);

  return {
    model,
    loading,
    error,
    loadModel,
  };
}

// ===============================
// PREDICTION HOOKS
// ===============================

/**
 * Hook for making predictions
 */
export function usePredictions() {
  const [predictions, setPredictions] = useState<PaginatedResponse<Prediction> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPredictions = useCallback(async (
    filters?: PredictionFilters,
    page = 1,
    limit = 20
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AIMLService.getPredictions(filters, page, limit);
      setPredictions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, []);

  const makePrediction = useCallback(async (modelId: string, features: Record<string, any>) => {
    try {
      setError(null);
      const response = await AIMLService.makePrediction({
        modelId,
        features,
        options: { includeAlternatives: true, includeExplanation: true },
      });
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make prediction');
      return null;
    }
  }, []);

  const makeBatchPredictions = useCallback(async (
    modelId: string,
    inputs: Array<Record<string, any>>
  ) => {
    try {
      setError(null);
      const response = await AIMLService.makeBatchPredictions({
        modelId,
        inputs,
      });
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make batch predictions');
      return null;
    }
  }, []);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  return {
    predictions,
    loading,
    error,
    loadPredictions,
    makePrediction,
    makeBatchPredictions,
  };
}

// ===============================
// FORECASTING HOOKS
// ===============================

/**
 * Hook for time series forecasting
 */
export function useForecasting() {
  const [forecasts, setForecasts] = useState<TimeSeriesForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadForecasts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AIMLService.getForecasts();
      setForecasts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateForecast = useCallback(async (
    metric: string,
    horizon: number,
    confidence = 0.9
  ) => {
    try {
      setError(null);
      const forecast = await AIMLService.generateForecast({
        metric,
        horizon,
        confidence,
        includeHistory: true,
      });
      
      // Add to existing forecasts
      setForecasts(prev => [forecast, ...prev.filter(f => f.metric !== metric)]);
      return forecast;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate forecast');
      return null;
    }
  }, []);

  useEffect(() => {
    loadForecasts();
  }, [loadForecasts]);

  return {
    forecasts,
    loading,
    error,
    loadForecasts,
    generateForecast,
  };
}

// ===============================
// INSIGHTS & RECOMMENDATIONS HOOKS
// ===============================

/**
 * Hook for AI insights
 */
export function useInsights(filters?: InsightFilters) {
  const [insights, setInsights] = useState<PaginatedResponse<AIInsight> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AIMLService.getInsights(filters, page, limit);
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const markAsRead = useCallback(async (insightId: string, userId: string) => {
    try {
      await AIMLService.markInsightAsRead(insightId, userId);
      // Update local state
      setInsights(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(insight =>
            insight.id === insightId
              ? { ...insight, readBy: [...(insight.readBy || []), userId] }
              : insight
          ),
        };
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark insight as read');
      return false;
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return {
    insights,
    loading,
    error,
    loadInsights,
    markAsRead,
  };
}

/**
 * Hook for AI recommendations
 */
export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AIMLService.getRecommendations();
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  const provideFeedback = useCallback(async (
    recommendationId: string,
    feedback: 'helpful' | 'notHelpful' | 'irrelevant'
  ) => {
    try {
      await AIMLService.provideRecommendationFeedback(recommendationId, feedback);
      // Update local state
      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === recommendationId ? { ...rec, feedback } : rec
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provide feedback');
      return false;
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return {
    recommendations,
    loading,
    error,
    loadRecommendations,
    provideFeedback,
  };
}

// ===============================
// ANOMALY DETECTION HOOKS
// ===============================

/**
 * Hook for anomaly detection
 */
export function useAnomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnomalies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AIMLService.getAnomalies();
      setAnomalies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAnomaly = useCallback(async (anomalyId: string, rootCause?: string) => {
    try {
      await AIMLService.resolveAnomaly(anomalyId, rootCause);
      // Update local state
      setAnomalies(prev =>
        prev.map(anomaly =>
          anomaly.id === anomalyId
            ? {
                ...anomaly,
                resolved: true,
                resolvedAt: new Date().toISOString(),
                rootCause,
              }
            : anomaly
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve anomaly');
      return false;
    }
  }, []);

  useEffect(() => {
    loadAnomalies();
  }, [loadAnomalies]);

  return {
    anomalies,
    loading,
    error,
    loadAnomalies,
    resolveAnomaly,
  };
}

// ===============================
// TRAINING JOBS HOOKS
// ===============================

/**
 * Hook for training jobs
 */
export function useTrainingJobs() {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AIMLService.getTrainingJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load training jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  const startTraining = useCallback(async (modelId: string, config: any) => {
    try {
      setError(null);
      const job = await AIMLService.startTrainingJob(modelId, config);
      setJobs(prev => [job, ...prev]);
      return job;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start training');
      return null;
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    loading,
    error,
    loadJobs,
    startTraining,
  };
}

// ===============================
// FEATURE STORE HOOKS
// ===============================

/**
 * Hook for feature sets
 */
export function useFeatureSets() {
  const [featureSets, setFeatureSets] = useState<FeatureSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeatureSets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AIMLService.getFeatureSets();
      setFeatureSets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature sets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatureSets();
  }, [loadFeatureSets]);

  return {
    featureSets,
    loading,
    error,
    loadFeatureSets,
  };
}

// ===============================
// COMBINED DASHBOARD HOOK
// ===============================

/**
 * Combined hook for AI/ML dashboard overview
 */
export function useAIMLDashboard() {
  const { models } = useMLModels();
  const { insights } = useInsights();
  const { recommendations } = useRecommendations();
  const { anomalies } = useAnomalies();
  const { jobs } = useTrainingJobs();

  const stats = {
    totalModels: models?.total || 0,
    deployedModels: models?.items.filter(m => m.status === 'deployed').length || 0,
    activeInsights: insights?.items.filter(i => !(i.readBy?.length)).length || 0,
    criticalAnomalies: anomalies.filter(a => !a.resolved && a.severity === 'critical').length,
    runningJobs: jobs.filter(j => j.status === 'running').length,
    avgModelAccuracy: models?.items.reduce((sum, m) => sum + m.accuracy, 0) / (models?.items.length || 1) || 0,
  };

  return {
    stats,
    models: models?.items || [],
    insights: insights?.items || [],
    recommendations: recommendations.slice(0, 5), // Top 5
    anomalies: anomalies.filter(a => !a.resolved), // Only active
    runningJobs: jobs.filter(j => j.status === 'running'),
  };
}

// Hook exports
export {
  useMLModels,
  useMLModel,
  usePredictions,
  useForecasting,
  useInsights,
  useRecommendations,
  useAnomalies,
  useTrainingJobs,
  useFeatureSets,
  useAIMLDashboard,
};