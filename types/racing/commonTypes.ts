/**
 * Common Racing Types - Phase 2: Data Transformation Pipeline
 * Shared interfaces and types for all racing sports
 * Part of Racing Data Integration Plan
 */

// Common sport types
export type RacingSport = 'nascar' | 'horse_racing';

// Common prediction confidence levels
export type PredictionConfidence = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';

// Common data quality levels
export type DataQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unusable';

// Base prediction interface
export interface BasePrediction {
  id: string;
  sport: RacingSport;
  eventId: string;
  eventName: string;
  generatedAt: string;
  validUntil: string;

  // Model information
  model: {
    version: string;
    algorithm: string;
    trainingDate: string;
    confidence: number;
  };

  // Data quality indicators
  dataQuality: {
    overall: DataQuality;
    score: number; // 0-1
    issues: string[];
    completeness: number; // 0-1
  };

  // Prediction metadata
  metadata: {
    predictionType: string;
    targetAudience: 'free' | 'premium' | 'internal';
    riskLevel: 'low' | 'medium' | 'high';
    expectedAccuracy: number;

    // Source tracking
    dataSources: string[];
    featureCount: number;
    modelFeatures: string[];
  };
}

// ML Feature extraction interface
export interface MLFeatureExtractor<T> {
  /**
   * Extract ML features from raw racing data
   */
  extractFeatures(rawData: T): Promise<MLFeatureVector>;

  /**
   * Validate feature completeness and quality
   */
  validateFeatures(features: MLFeatureVector): FeatureValidationResult;

  /**
   * Transform features for specific ML algorithms
   */
  transformForModel(
    features: MLFeatureVector,
    modelType: string
  ): Promise<TransformedFeatureVector>;
}

// Generic ML feature vector
export interface MLFeatureVector {
  id: string;
  sport: RacingSport;
  eventId: string;
  participantId: string;

  // Feature categories
  features: {
    [category: string]: {
      [featureName: string]: number | boolean | string;
    };
  };

  // Feature metadata
  metadata: {
    version: string;
    extractedAt: string;
    dataQuality: number;
    completeness: number;
    featureCount: number;

    // Feature engineering info
    normalizationApplied: boolean;
    scalingMethod?: string;
    missingValueStrategy: string;
    outlierHandling: string;
  };

  // Target variables (for training)
  targets?: {
    [targetName: string]: number | boolean;
  };
}

// Transformed feature vector for specific models
export interface TransformedFeatureVector {
  originalId: string;
  modelType: string;
  transformedAt: string;

  // Transformed features as arrays for ML algorithms
  numericFeatures: number[];
  categoricalFeatures: number[]; // One-hot encoded
  embeddingFeatures?: number[][]; // For deep learning models

  // Feature names and indices
  featureNames: string[];
  categoricalIndices: number[];
  numericIndices: number[];

  // Transformation metadata
  transformations: {
    normalization: {
      method: string;
      parameters: { [key: string]: number };
    };
    encoding: {
      categoricalEncoding: string;
      encodingMaps: { [feature: string]: { [value: string]: number } };
    };
    scaling: {
      method: string;
      scalingFactors: { [feature: string]: { mean: number; std: number } };
    };
  };
}

// Feature validation result
export interface FeatureValidationResult {
  isValid: boolean;
  quality: DataQuality;
  score: number; // 0-1

  // Detailed validation results
  validation: {
    completeness: {
      score: number;
      missingFeatures: string[];
      missingPercentage: number;
    };

    accuracy: {
      score: number;
      outliers: string[];
      anomalies: string[];
      suspiciousValues: string[];
    };

    consistency: {
      score: number;
      inconsistencies: string[];
      logicalErrors: string[];
    };

    timeliness: {
      score: number;
      staleFeatures: string[];
      lastUpdated: { [feature: string]: string };
    };
  };

  // Recommendations
  recommendations: {
    critical: string[];
    warning: string[];
    info: string[];
  };

  // Feature importance for this validation
  featureImportance?: {
    [featureName: string]: number;
  };
}

// Data transformation pipeline configuration
export interface TransformationPipeline {
  id: string;
  name: string;
  sport: RacingSport;
  version: string;

  // Pipeline steps
  steps: TransformationStep[];

  // Pipeline configuration
  config: {
    inputFormat: string;
    outputFormat: string;
    batchSize: number;
    parallelProcessing: boolean;
    errorHandling: 'strict' | 'lenient' | 'skip';

    // Data validation
    validateInput: boolean;
    validateOutput: boolean;
    qualityThreshold: number;
  };

  // Performance metrics
  performance: {
    averageProcessingTime: number;
    throughput: number; // Records per second
    errorRate: number;
    lastRunTime: string;
    successRate: number;
  };
}

// Individual transformation step
export interface TransformationStep {
  id: string;
  name: string;
  type: 'normalize' | 'encode' | 'scale' | 'extract' | 'validate' | 'aggregate' | 'filter';
  order: number;

  // Step configuration
  config: {
    parameters: { [key: string]: any };
    requiredInputs: string[];
    outputs: string[];

    // Error handling for this step
    onError: 'fail' | 'skip' | 'default';
    defaultValues?: { [key: string]: any };
  };

  // Step performance
  performance: {
    averageExecutionTime: number;
    errorCount: number;
    successCount: number;
    lastRun: string;
  };

  // Dependencies
  dependencies: string[]; // Other step IDs this depends on
  conditions?: string[]; // Conditions for step execution
}

// Performance metrics normalization interface
export interface PerformanceNormalizer {
  /**
   * Normalize performance metrics across different racing formats
   */
  normalizePerformance(sport: RacingSport, rawMetrics: any): NormalizedPerformance;

  /**
   * Calculate relative performance within peer group
   */
  calculateRelativePerformance(
    performance: NormalizedPerformance,
    peerGroup: NormalizedPerformance[]
  ): RelativePerformance;

  /**
   * Generate performance trend analysis
   */
  analyzeTrends(historicalPerformance: NormalizedPerformance[]): PerformanceTrend;
}

// Normalized performance interface
export interface NormalizedPerformance {
  participantId: string;
  sport: RacingSport;
  normalizedAt: string;

  // Core performance metrics (0-1 scale)
  core: {
    winRate: number;
    successRate: number; // Top 3 or equivalent
    consistency: number;
    improvement: number;

    // Relative metrics
    vsField: number; // Performance vs average field
    vsPeers: number; // Performance vs similar participants
    vsElite: number; // Performance vs top performers
  };

  // Sport-specific normalized metrics
  sportSpecific: {
    [metricName: string]: number;
  };

  // Context factors
  context: {
    competitionLevel: number; // Quality of opposition
    conditionsRating: number; // Difficulty of conditions
    experienceLevel: number; // Participant experience
    equipmentRating: number; // Quality of equipment/team
  };

  // Confidence and reliability
  reliability: {
    sampleSize: number;
    dataQuality: number;
    confidenceInterval: [number, number];
    statisticalSignificance: number;
  };
}

// Relative performance within peer group
export interface RelativePerformance {
  participantId: string;
  peerGroupId: string;
  calculatedAt: string;

  // Rankings within peer group
  rankings: {
    overall: number; // 1-N ranking
    percentile: number; // 0-100 percentile
    zScore: number; // Standard deviations from mean

    // Category rankings
    byMetric: {
      [metricName: string]: {
        rank: number;
        percentile: number;
        zScore: number;
      };
    };
  };

  // Performance gaps
  gaps: {
    toAverage: number; // Gap to peer group average
    toLeader: number; // Gap to peer group leader
    toNext: number; // Gap to next better performer

    // Improvement potential
    improvementPotential: number;
    achievableGoals: {
      [metricName: string]: number;
    };
  };

  // Peer group context
  peerGroup: {
    size: number;
    averagePerformance: NormalizedPerformance;
    topPerformer: NormalizedPerformance;
    standardDeviation: { [metricName: string]: number };
  };
}

// Performance trend analysis
export interface PerformanceTrend {
  participantId: string;
  analyzedAt: string;
  periodCovered: {
    startDate: string;
    endDate: string;
    dataPoints: number;
  };

  // Trend indicators
  trends: {
    overall: 'improving' | 'declining' | 'stable' | 'volatile';
    direction: number; // -1 to 1 (declining to improving)
    momentum: number; // Rate of change
    acceleration: number; // Change in rate of change

    // Metric-specific trends
    byMetric: {
      [metricName: string]: {
        trend: 'improving' | 'declining' | 'stable' | 'volatile';
        slope: number;
        r_squared: number; // Trend fit quality
        significance: number; // Statistical significance
      };
    };
  };

  // Cycle analysis
  cycles: {
    seasonality: {
      detected: boolean;
      period: number; // Days
      amplitude: number;
      phase: number;
    };

    peaks: {
      date: string;
      value: number;
      duration: number;
    }[];

    troughs: {
      date: string;
      value: number;
      duration: number;
    }[];
  };

  // Forecasting
  forecast: {
    nextPeriod: number; // Predicted performance next period
    confidence: number; // Forecast confidence
    range: [number, number]; // Prediction interval
    factors: string[]; // Key factors influencing forecast
  };

  // Change points
  changePoints: {
    date: string;
    type: 'improvement' | 'decline' | 'plateau';
    magnitude: number;
    confidence: number;
    possibleCauses: string[];
  }[];
}

// Schema validation interface
export interface SchemaValidator<T> {
  /**
   * Validate data against schema
   */
  validate(data: T): ValidationResult;

  /**
   * Get schema definition
   */
  getSchema(): object;

  /**
   * Check if data matches expected format
   */
  isValidFormat(data: any): boolean;

  /**
   * Repair data to match schema where possible
   */
  repairData(data: any): { repaired: T; repairs: string[] };
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];

  // Validation metrics
  metrics: {
    validFields: number;
    invalidFields: number;
    missingFields: number;
    totalFields: number;
    validationScore: number; // 0-1
  };

  // Suggested repairs
  repairs: {
    required: string[];
    optional: string[];
    automatic: string[];
  };
}

// Validation error
export interface ValidationError {
  field: string;
  value: any;
  expectedType: string;
  actualType: string;
  message: string;
  severity: 'critical' | 'error' | 'warning';

  // Error context
  context: {
    path: string;
    rule: string;
    constraint: any;
  };

  // Suggested fix
  suggestedFix?: {
    action: string;
    newValue: any;
    confidence: number;
  };
}

// Validation warning
export interface ValidationWarning {
  field: string;
  value: any;
  message: string;
  severity: 'info' | 'warning';

  // Warning context
  context: {
    path: string;
    recommendation: string;
    impact: string;
  };
}

// Data quality assessment
export interface DataQualityAssessment {
  assessmentId: string;
  dataSource: string;
  sport: RacingSport;
  assessedAt: string;

  // Overall quality metrics
  overall: {
    score: number; // 0-100
    grade: DataQuality;
    confidence: number;
  };

  // Dimension-specific quality
  dimensions: {
    completeness: {
      score: number;
      missingDataPercentage: number;
      criticalFieldsMissing: string[];
    };

    accuracy: {
      score: number;
      errorRate: number;
      inconsistencies: number;
      outliers: number;
    };

    consistency: {
      score: number;
      contradictions: number;
      formatInconsistencies: number;
      logicalErrors: number;
    };

    timeliness: {
      score: number;
      averageAge: number; // Hours
      staleRecords: number;
      updateFrequency: string;
    };

    validity: {
      score: number;
      formatErrors: number;
      constraintViolations: number;
      typeErrors: number;
    };

    uniqueness: {
      score: number;
      duplicateRecords: number;
      duplicateRate: number;
    };
  };

  // Improvement recommendations
  recommendations: {
    immediate: {
      action: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      priority: number;
    }[];

    planned: {
      action: string;
      timeline: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
    }[];
  };

  // Trend analysis
  trend: {
    improving: boolean;
    qualityDirection: 'up' | 'down' | 'stable';
    recentChanges: {
      date: string;
      change: string;
      impact: number;
    }[];
  };
}

// Export utility type for creating sport-specific interfaces
export type RacingDataTransformer<TInput, TOutput> = {
  transform(input: TInput): Promise<TOutput>;
  validateInput(input: TInput): ValidationResult;
  validateOutput(output: TOutput): ValidationResult;
  getTransformationMetadata(): {
    version: string;
    lastUpdated: string;
    supportedInputTypes: string[];
    outputSchema: object;
  };
};
