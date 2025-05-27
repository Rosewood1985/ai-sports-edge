/**
 * TypeScript types for AI/ML integration in the admin dashboard
 * Phase 4.1: Foundation Types
 */

// Core AI/ML Types
export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: 'timeSeries' | 'classification' | 'regression' | 'anomalyDetection';
  status: 'training' | 'deployed' | 'deprecated' | 'failed';
  accuracy: number;
  lastTrained: string;
  deployedAt?: string;
  metrics: ModelMetrics;
  config: ModelConfig;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse?: number; // for regression models
  mae?: number; // for regression models
  auc?: number; // for classification models
  lastEvaluated: string;
}

export interface ModelConfig {
  features: string[];
  hyperparameters: Record<string, any>;
  trainingParams: {
    epochs?: number;
    batchSize?: number;
    learningRate?: number;
    validationSplit: number;
  };
}

// Prediction Types
export interface Prediction {
  id: string;
  modelId: string;
  timestamp: string;
  input: Record<string, any>;
  output: PredictionOutput;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface PredictionOutput {
  value: any;
  probability?: number;
  alternativeOutcomes?: Array<{
    value: any;
    probability: number;
  }>;
}

// Time Series Forecasting
export interface TimeSeriesForecast {
  id: string;
  metric: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  forecastData: Array<{
    date: string;
    predicted: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    actual?: number;
  }>;
  accuracy: number;
  generatedAt: string;
}

// Insights Types
export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  data: Record<string, any>;
  actionable: boolean;
  suggestedActions?: string[];
  createdAt: string;
  readBy?: string[];
}

// Anomaly Detection
export interface Anomaly {
  id: string;
  metric: string;
  timestamp: string;
  value: number;
  expectedValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  deviation: number;
  context: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  rootCause?: string;
}

// Recommendation Engine
export interface AIRecommendation {
  id: string;
  type: 'optimization' | 'alert' | 'action' | 'insight';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  estimatedImpact: string;
  category: string;
  actions: RecommendationAction[];
  createdAt: string;
  implementedAt?: string;
  feedback?: 'helpful' | 'notHelpful' | 'irrelevant';
}

export interface RecommendationAction {
  id: string;
  title: string;
  description: string;
  type: 'immediate' | 'scheduled' | 'manual';
  estimated_time: string;
  impact: 'low' | 'medium' | 'high';
}

// Feature Store
export interface Feature {
  name: string;
  type: 'numeric' | 'categorical' | 'text' | 'datetime' | 'boolean';
  description: string;
  importance: number;
  source: string;
  transformations: string[];
  lastUpdated: string;
}

export interface FeatureSet {
  id: string;
  name: string;
  description: string;
  features: Feature[];
  version: string;
  createdAt: string;
  usedByModels: string[];
}

// Training Job Types
export interface TrainingJob {
  id: string;
  modelId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  config: ModelConfig;
  metrics?: ModelMetrics;
  logs: string[];
  error?: string;
}

// API Request/Response Types
export interface PredictionRequest {
  modelId: string;
  features: Record<string, any>;
  options?: {
    includeAlternatives?: boolean;
    includeExplanation?: boolean;
  };
}

export interface PredictionResponse {
  prediction: Prediction;
  explanation?: string;
  processingTime: number;
}

export interface ForecastRequest {
  metric: string;
  horizon: number; // days to forecast
  confidence: number; // confidence level (0.8, 0.9, 0.95)
  includeHistory?: boolean;
}

export interface BatchPredictionRequest {
  modelId: string;
  inputs: Array<Record<string, any>>;
  batchId?: string;
}

export interface BatchPredictionResponse {
  batchId: string;
  status: 'processing' | 'completed' | 'failed';
  predictions?: Prediction[];
  totalProcessed: number;
  completedAt?: string;
  error?: string;
}

// Dashboard Widget Types for AI/ML
export interface MLModelPerformanceWidget {
  modelId: string;
  metrics: ModelMetrics;
  performanceTrend: Array<{
    date: string;
    accuracy: number;
    predictions: number;
  }>;
}

export interface PredictionVolumeWidget {
  totalPredictions: number;
  predictionsTrend: Array<{
    date: string;
    count: number;
    accuracy: number;
  }>;
  byModel: Array<{
    modelId: string;
    modelName: string;
    count: number;
    percentage: number;
  }>;
}

export interface AnomalyDetectionWidget {
  activeAnomalies: number;
  resolvedAnomalies: number;
  anomaliesByType: Array<{
    type: string;
    count: number;
  }>;
  recentAnomalies: Anomaly[];
}

// Utility types
export type ModelType = MLModel['type'];
export type ModelStatus = MLModel['status'];
export type InsightType = AIInsight['type'];
export type RecommendationType = AIRecommendation['type'];
export type TrainingJobStatus = TrainingJob['status'];

// Filter and pagination types
export interface MLFilters {
  modelType?: ModelType;
  status?: ModelStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  minAccuracy?: number;
}

export interface InsightFilters {
  type?: InsightType;
  severity?: AIInsight['severity'];
  read?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PredictionFilters {
  modelId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minConfidence?: number;
}

// Response wrapper types
export interface MLServiceResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default {
  MLModel,
  Prediction,
  TimeSeriesForecast,
  AIInsight,
  Anomaly,
  AIRecommendation,
  TrainingJob,
  ModelMetrics,
  ModelConfig,
  Feature,
  FeatureSet,
};