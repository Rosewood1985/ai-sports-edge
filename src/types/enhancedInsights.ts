/**
 * Enhanced Insights Types
 * Phase 4.2: Advanced AI/ML Features
 * NLP-powered insights and advanced pattern detection
 */

// Enhanced insight types with NLP capabilities
export interface EnhancedInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction' | 'opportunity' | 'risk';
  category: 'user_behavior' | 'financial' | 'operational' | 'marketing' | 'product' | 'security';
  title: string;
  description: string;
  nlpSummary: NLPSummary;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  impact: InsightImpact;
  evidence: InsightEvidence[];
  recommendations: SmartRecommendation[];
  metadata: InsightMetadata;
  createdAt: string;
  updatedAt?: string;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';
  assignedTo?: string;
  tags: string[];
}

// NLP-powered summary and analysis
export interface NLPSummary {
  keyPhrases: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  entities: NamedEntity[];
  topics: Topic[];
  readabilityScore: number;
  urgencyIndicators: string[];
  actionWords: string[];
}

export interface NamedEntity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'MONEY' | 'PERCENTAGE' | 'METRIC';
  confidence: number;
  startOffset: number;
  endOffset: number;
}

export interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
  relatedInsights: string[];
}

// Impact analysis with quantified metrics
export interface InsightImpact {
  scope: 'local' | 'regional' | 'global';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  affectedUsers: number | 'unknown';
  estimatedRevenue: {
    impact: number;
    currency: string;
    confidence: number;
  };
  riskLevel: number; // 0-100
  opportunityScore: number; // 0-100
  businessValue: 'low' | 'medium' | 'high' | 'critical';
}

// Evidence supporting the insight
export interface InsightEvidence {
  id: string;
  type: 'metric' | 'event' | 'pattern' | 'correlation' | 'external';
  source: string;
  data: any;
  weight: number; // 0-1, importance of this evidence
  timestamp: string;
  visualization?: {
    type: 'chart' | 'table' | 'map' | 'heatmap';
    config: any;
  };
}

// Smart recommendations with ML-driven prioritization
export interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'immediate' | 'strategic' | 'preventive' | 'optimization';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  expectedOutcome: {
    description: string;
    metrics: ExpectedMetric[];
    confidence: number;
  };
  prerequisites: string[];
  risks: string[];
  alternatives: AlternativeAction[];
}

export interface ExpectedMetric {
  name: string;
  currentValue: number;
  expectedValue: number;
  unit: string;
  confidence: number;
}

export interface AlternativeAction {
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  expectedImpact: number; // 0-100
}

// Enhanced metadata with ML context
export interface InsightMetadata {
  modelVersion: string;
  algorithms: string[];
  dataSourcesUsed: string[];
  processingTime: number;
  relatedInsights: string[];
  historicalContext: {
    similarInsights: number;
    averageResolutionTime: number;
    successRate: number;
  };
  qualityScore: number; // 0-100
  freshness: number; // 0-100, how current the data is
}

// Pattern detection results
export interface PatternDetection {
  id: string;
  type: 'seasonal' | 'cyclical' | 'trending' | 'irregular' | 'correlation';
  pattern: DetectedPattern;
  strength: number; // 0-1
  significance: number; // p-value
  duration: {
    start: string;
    end?: string;
    predictedEnd?: string;
  };
  affectedMetrics: string[];
  visualization: PatternVisualization;
}

export interface DetectedPattern {
  name: string;
  description: string;
  formula?: string;
  parameters: Record<string, number>;
  frequency?: string; // for cyclical patterns
  trend?: 'increasing' | 'decreasing' | 'stable';
  seasonality?: {
    period: string;
    peaks: string[];
    troughs: string[];
  };
}

export interface PatternVisualization {
  type: 'time_series' | 'scatter' | 'heatmap' | 'network';
  data: any;
  annotations: Array<{
    x: number;
    y: number;
    text: string;
    type: 'peak' | 'trough' | 'anomaly' | 'change_point';
  }>;
}

// Correlation analysis
export interface CorrelationAnalysis {
  id: string;
  metrics: {
    primary: string;
    secondary: string;
  };
  correlation: {
    coefficient: number;
    type: 'pearson' | 'spearman' | 'kendall';
    pValue: number;
    strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
    direction: 'positive' | 'negative';
  };
  timeRange: {
    start: string;
    end: string;
  };
  significance: boolean;
  causality: {
    inferred: boolean;
    direction?: 'x_causes_y' | 'y_causes_x' | 'bidirectional' | 'confounded';
    confidence: number;
  };
  businessContext: string;
}

// Predictive insights
export interface PredictiveInsight {
  id: string;
  metric: string;
  prediction: {
    value: number;
    confidence: number;
    range: {
      lower: number;
      upper: number;
    };
    horizon: string; // e.g., '7 days', '1 month'
  };
  factors: InfluencingFactor[];
  scenarios: PredictionScenario[];
  riskFactors: RiskFactor[];
  opportunities: OpportunityFactor[];
}

export interface InfluencingFactor {
  name: string;
  impact: number; // -100 to 100
  confidence: number;
  description: string;
  controllable: boolean;
}

export interface PredictionScenario {
  name: string;
  description: string;
  probability: number;
  outcome: {
    value: number;
    impact: string;
  };
  requiredActions: string[];
}

export interface RiskFactor {
  name: string;
  probability: number;
  impact: number;
  mitigation: string[];
  earlyWarningSignals: string[];
}

export interface OpportunityFactor {
  name: string;
  potential: number;
  effort: number;
  timeline: string;
  prerequisites: string[];
}

// Advanced search and filtering
export interface InsightFilters {
  types?: EnhancedInsight['type'][];
  categories?: EnhancedInsight['category'][];
  severities?: EnhancedInsight['severity'][];
  statuses?: EnhancedInsight['status'][];
  dateRange?: {
    start: string;
    end: string;
  };
  keywords?: string[];
  tags?: string[];
  assignedTo?: string;
  minConfidence?: number;
  minImpact?: number;
  hasRecommendations?: boolean;
  nlpFilters?: {
    sentiment?: NLPSummary['sentiment'][];
    entities?: string[];
    topics?: string[];
  };
}

// Insight analytics and metrics
export interface InsightAnalytics {
  totalInsights: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  averageConfidence: number;
  averageResolutionTime: number;
  topTopics: Array<{
    topic: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  sentimentDistribution: Record<string, number>;
  impactAnalysis: {
    totalEstimatedValue: number;
    averageImpact: number;
    highImpactCount: number;
  };
}

// Batch processing results
export interface InsightBatchResult {
  batchId: string;
  status: 'processing' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  totalRecords: number;
  processedRecords: number;
  insights: EnhancedInsight[];
  patterns: PatternDetection[];
  correlations: CorrelationAnalysis[];
  errors: Array<{
    record: number;
    error: string;
  }>;
  summary: InsightAnalytics;
}

// Real-time insight streaming
export interface InsightStream {
  id: string;
  filters: InsightFilters;
  callback: (insight: EnhancedInsight) => void;
  status: 'active' | 'paused' | 'stopped';
  createdAt: string;
  lastActivity: string;
  insightCount: number;
}

// Export types
export type {
  EnhancedInsight,
  NLPSummary,
  NamedEntity,
  Topic,
  InsightImpact,
  InsightEvidence,
  SmartRecommendation,
  ExpectedMetric,
  AlternativeAction,
  InsightMetadata,
  PatternDetection,
  DetectedPattern,
  PatternVisualization,
  CorrelationAnalysis,
  PredictiveInsight,
  InfluencingFactor,
  PredictionScenario,
  RiskFactor,
  OpportunityFactor,
  InsightFilters,
  InsightAnalytics,
  InsightBatchResult,
  InsightStream,
};