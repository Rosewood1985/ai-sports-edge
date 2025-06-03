/**
 * Interactive AI Types
 * Phase 4.2: Advanced AI/ML Features
 * Types for scenario modeling and interactive AI tools
 */

// Base interfaces for interactive AI functionality
export interface InteractiveSession {
  id: string;
  type: 'scenario' | 'whatif' | 'simulation' | 'comparison';
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'draft' | 'running' | 'completed' | 'failed';
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  duration?: number;
  computeTime?: number;
  dataPoints: number;
  modelVersion: string;
  parameters: Record<string, any>;
  tags: string[];
}

// Scenario Analysis Types
export interface ScenarioAnalysis {
  id: string;
  name: string;
  description: string;
  baseMetric: string;
  parameters: ScenarioParameters;
  outcomes: ScenarioOutcome[];
  predictedOutcome: PredictedOutcome;
  riskAssessment: RiskAssessment;
  recommendations: ScenarioRecommendation[];
  createdAt: string;
  validUntil: string;
}

export interface ScenarioParameters {
  growthRate?: number;
  marketFactor?: number;
  seasonality?: number;
  externalImpact?: number;
  competitorEffect?: number;
  economicIndex?: number;
  customVariables?: Record<string, number>;
}

export interface ScenarioOutcome {
  name: string;
  probability: number;
  value: number;
  description: string;
  requiredConditions: string[];
  timeToRealization: string;
}

export interface PredictedOutcome {
  value: number;
  confidence: number;
  range: {
    lower: number;
    upper: number;
    percentile95: number;
    percentile5: number;
  };
  distribution: OutcomeDistribution;
}

export interface OutcomeDistribution {
  type: 'normal' | 'skewed' | 'bimodal' | 'uniform';
  mean: number;
  median: number;
  standardDeviation: number;
  skewness?: number;
  kurtosis?: number;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  factors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
  monitoringRequirements: string[];
}

export interface RiskFactor {
  name: string;
  impact: number; // -100 to 100
  probability: number; // 0-1
  category: 'market' | 'operational' | 'financial' | 'regulatory' | 'technical';
  description: string;
  earlyWarningSignals: string[];
}

export interface MitigationStrategy {
  name: string;
  description: string;
  effectiveness: number; // 0-1
  cost: number;
  timeToImplement: string;
  prerequisites: string[];
}

export interface ScenarioRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'preventive' | 'reactive' | 'optimization' | 'contingency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedImpact: number;
  confidence: number;
  timeline: string;
  resources: RequiredResource[];
}

export interface RequiredResource {
  type: 'human' | 'financial' | 'technical' | 'time';
  amount: number;
  unit: string;
  description: string;
}

// What-If Analysis Types
export interface WhatIfAnalysis {
  id: string;
  question: string;
  baselineScenario: ScenarioData;
  modifiedScenario: ScenarioData;
  variableChanges: VariableChange[];
  impactAnalysis: ImpactAnalysis;
  sensitivityAnalysis: SensitivityAnalysis;
  recommendations: WhatIfRecommendation[];
}

export interface ScenarioData {
  id: string;
  name: string;
  variables: Record<string, number>;
  outcomes: Record<string, number>;
  metadata: {
    createdAt: string;
    computeTime: number;
    confidence: number;
  };
}

export interface VariableChange {
  variable: string;
  originalValue: number;
  newValue: number;
  changePercent: number;
  changeType: 'absolute' | 'relative';
  justification: string;
}

export interface ImpactAnalysis {
  primaryMetrics: MetricImpact[];
  secondaryMetrics: MetricImpact[];
  cascadingEffects: CascadingEffect[];
  timeToImpact: string;
  persistenceDuration: string;
}

export interface MetricImpact {
  metric: string;
  currentValue: number;
  projectedValue: number;
  absoluteChange: number;
  percentageChange: number;
  confidence: number;
  significance: 'low' | 'medium' | 'high';
}

export interface CascadingEffect {
  fromMetric: string;
  toMetric: string;
  correlation: number;
  delay: string;
  impact: number;
  confidence: number;
}

export interface SensitivityAnalysis {
  mostSensitiveVariables: SensitivityMetric[];
  elasticity: ElasticityMetric[];
  thresholds: ThresholdAnalysis[];
  robustness: RobustnessScore;
}

export interface SensitivityMetric {
  variable: string;
  sensitivityScore: number;
  partialDerivative: number;
  elasticity: number;
  impactDirection: 'positive' | 'negative' | 'neutral';
}

export interface ElasticityMetric {
  variable: string;
  metric: string;
  elasticity: number;
  interpretation: string;
}

export interface ThresholdAnalysis {
  variable: string;
  thresholds: Threshold[];
  currentPosition: 'below' | 'at' | 'above';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Threshold {
  value: number;
  type: 'critical' | 'warning' | 'optimal' | 'maximum';
  consequence: string;
  actionRequired: string;
}

export interface RobustnessScore {
  overall: number; // 0-100
  volatility: number;
  resilience: number;
  adaptability: number;
  factors: string[];
}

export interface WhatIfRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  expectedOutcome: string;
  implementation: ImplementationPlan;
  monitoring: MonitoringPlan;
}

export interface ImplementationPlan {
  steps: ImplementationStep[];
  timeline: string;
  dependencies: string[];
  risks: string[];
  successCriteria: string[];
}

export interface ImplementationStep {
  order: number;
  description: string;
  duration: string;
  resources: RequiredResource[];
  deliverables: string[];
}

export interface MonitoringPlan {
  keyMetrics: string[];
  checkpoints: Checkpoint[];
  alertThresholds: AlertThreshold[];
  reportingFrequency: string;
}

export interface Checkpoint {
  timeline: string;
  expectedValue: number;
  tolerance: number;
  actionIfMissed: string;
}

export interface AlertThreshold {
  metric: string;
  warningLevel: number;
  criticalLevel: number;
  responseProtocol: string;
}

// Model Simulation Types
export interface ModelSimulation {
  id: string;
  name: string;
  type: 'monte_carlo' | 'discrete_event' | 'agent_based' | 'system_dynamics';
  model: SimulationModel;
  parameters: SimulationParameters;
  results: SimulationResults;
  validation: ModelValidation;
  predictedOutcome: PredictedOutcome;
  influencingFactors: InfluencingFactor[];
  timeSeriesData: TimeSeriesData;
  riskAssessment: RiskAssessment;
}

export interface SimulationModel {
  id: string;
  name: string;
  version: string;
  description: string;
  inputs: ModelInput[];
  outputs: ModelOutput[];
  assumptions: string[];
  limitations: string[];
}

export interface ModelInput {
  name: string;
  type: 'continuous' | 'discrete' | 'categorical' | 'boolean';
  range?: { min: number; max: number };
  distribution?: DistributionSpec;
  defaultValue: any;
  required: boolean;
  description: string;
}

export interface ModelOutput {
  name: string;
  type: 'metric' | 'probability' | 'classification' | 'forecast';
  unit: string;
  description: string;
  interpretationGuide: string;
}

export interface DistributionSpec {
  type: 'normal' | 'uniform' | 'exponential' | 'poisson' | 'beta' | 'gamma';
  parameters: Record<string, number>;
}

export interface SimulationParameters {
  iterations: number;
  timeHorizon: string;
  timeStep: string;
  randomSeed?: number;
  confidenceLevel: number;
  convergenceCriteria: ConvergenceCriteria;
  customSettings: Record<string, any>;
}

export interface ConvergenceCriteria {
  enabled: boolean;
  tolerance: number;
  minIterations: number;
  maxIterations: number;
  metric: string;
}

export interface SimulationResults {
  summary: ResultSummary;
  distributions: DistributionResult[];
  correlations: CorrelationMatrix;
  sensitivityAnalysis: SensitivityResult[];
  scenarios: ScenarioResult[];
  performance: SimulationPerformance;
}

export interface ResultSummary {
  iterations: number;
  convergenceReached: boolean;
  computeTime: number;
  meanOutcome: number;
  medianOutcome: number;
  confidenceIntervals: ConfidenceInterval[];
  percentiles: Percentile[];
}

export interface ConfidenceInterval {
  level: number; // e.g., 95
  lowerBound: number;
  upperBound: number;
}

export interface Percentile {
  percentile: number;
  value: number;
}

export interface DistributionResult {
  variable: string;
  statistics: DistributionStats;
  histogram: HistogramData;
  fittedDistribution?: FittedDistribution;
}

export interface DistributionStats {
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  min: number;
  max: number;
}

export interface HistogramData {
  bins: number[];
  frequencies: number[];
  binWidth: number;
}

export interface FittedDistribution {
  type: string;
  parameters: Record<string, number>;
  goodnessOfFit: number;
  pValue: number;
}

export interface CorrelationMatrix {
  variables: string[];
  matrix: number[][];
  significanceMatrix: boolean[][];
}

export interface SensitivityResult {
  inputVariable: string;
  outputVariable: string;
  correlationCoefficient: number;
  regressionCoefficient: number;
  importance: number; // 0-1
  ranking: number;
}

export interface ScenarioResult {
  name: string;
  probability: number;
  outcomes: Record<string, number>;
  description: string;
  keyDrivers: string[];
}

export interface SimulationPerformance {
  executionTime: number;
  memoryUsage: number;
  convergenceIterations: number;
  accuracy: number;
  stability: number;
}

export interface ModelValidation {
  backtesting: BacktestResult[];
  crossValidation: CrossValidationResult;
  realityCheck: RealityCheckResult[];
  uncertaintyQuantification: UncertaintyAnalysis;
}

export interface BacktestResult {
  period: string;
  predictedValue: number;
  actualValue: number;
  error: number;
  percentageError: number;
}

export interface CrossValidationResult {
  folds: number;
  averageError: number;
  standardDeviation: number;
  r2Score: number;
  meanAbsoluteError: number;
}

export interface RealityCheckResult {
  assumption: string;
  validationMethod: string;
  result: 'valid' | 'questionable' | 'invalid';
  confidence: number;
  implications: string[];
}

export interface UncertaintyAnalysis {
  aleatory: number; // inherent randomness
  epistemic: number; // knowledge uncertainty
  total: number;
  propagation: UncertaintyPropagation[];
}

export interface UncertaintyPropagation {
  source: string;
  contribution: number;
  type: 'aleatory' | 'epistemic';
  mitigation: string[];
}

export interface InfluencingFactor {
  name: string;
  impact: number;
  confidence: number;
  description: string;
  controllable: boolean;
}

export interface TimeSeriesData {
  timestamps: string[];
  values: number[];
  confidence?: number[];
  metadata: {
    frequency: string;
    seasonality?: boolean;
    trend?: 'increasing' | 'decreasing' | 'stable';
  };
}

// Scenario Comparison Types
export interface ScenarioComparison {
  id: string;
  name: string;
  scenarios: ComparisonScenario[];
  comparisonMetrics: ComparisonMetric[];
  analysis: ComparisonAnalysis;
  recommendations: ComparisonRecommendation[];
  visualization: ComparisonVisualization;
}

export interface ComparisonScenario {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, number>;
  outcomes: Record<string, number>;
  risk: RiskProfile;
  feasibility: FeasibilityAssessment;
}

export interface RiskProfile {
  overall: number;
  categories: Record<string, number>;
  mitigations: string[];
}

export interface FeasibilityAssessment {
  technical: number;
  financial: number;
  operational: number;
  timeline: number;
  overall: number;
}

export interface ComparisonMetric {
  name: string;
  unit: string;
  importance: number;
  values: Record<string, number>; // scenarioId -> value
  normalized: Record<string, number>; // normalized values
  ranking: Record<string, number>; // scenarioId -> rank
}

export interface ComparisonAnalysis {
  dominantScenarios: string[];
  tradeoffs: Tradeoff[];
  sensitivityToChanges: SensitivityToChange[];
  robustness: ScenarioRobustness[];
  optimalChoice: OptimalChoice;
}

export interface Tradeoff {
  metric1: string;
  metric2: string;
  correlation: number;
  description: string;
  implications: string[];
}

export interface SensitivityToChange {
  scenario: string;
  parameter: string;
  sensitivity: number;
  threshold: number;
  impact: string;
}

export interface ScenarioRobustness {
  scenario: string;
  score: number;
  factors: string[];
  vulnerabilities: string[];
}

export interface OptimalChoice {
  scenarioId: string;
  confidence: number;
  reasoning: string[];
  conditions: string[];
  monitoring: string[];
}

export interface ComparisonRecommendation {
  id: string;
  title: string;
  description: string;
  preferredScenario: string;
  alternatives: string[];
  justification: string[];
  implementationNotes: string[];
}

export interface ComparisonVisualization {
  type: 'radar' | 'parallel_coordinates' | 'scatter_matrix' | 'decision_tree';
  config: VisualizationConfig;
  data: any;
}

export interface VisualizationConfig {
  title: string;
  axes: AxisConfig[];
  colors: string[];
  annotations: Annotation[];
  interactivity: InteractivityConfig;
}

export interface AxisConfig {
  name: string;
  scale: 'linear' | 'log' | 'categorical';
  range?: [number, number];
  format?: string;
}

export interface Annotation {
  type: 'text' | 'arrow' | 'highlight';
  position: { x: number; y: number };
  content: string;
  style: Record<string, any>;
}

export interface InteractivityConfig {
  zoomable: boolean;
  pannable: boolean;
  selectable: boolean;
  tooltips: boolean;
  filters: FilterConfig[];
}

export interface FilterConfig {
  parameter: string;
  type: 'range' | 'selection' | 'toggle';
  defaultValue: any;
}

// Interactive Visualization Types
export interface InteractiveVisualization {
  id: string;
  type: 'dashboard' | 'explorer' | 'simulator' | 'comparator';
  title: string;
  components: VisualizationComponent[];
  layout: LayoutConfig;
  interactions: InteractionDefinition[];
  state: VisualizationState;
}

export interface VisualizationComponent {
  id: string;
  type: 'chart' | 'table' | 'control' | 'text' | 'metric';
  config: ComponentConfig;
  data: any;
  position: ComponentPosition;
}

export interface ComponentConfig {
  title?: string;
  description?: string;
  chartType?: string;
  options?: Record<string, any>;
  styling?: Record<string, any>;
}

export interface ComponentPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
}

export interface LayoutConfig {
  type: 'grid' | 'free' | 'tabs' | 'accordion';
  responsive: boolean;
  breakpoints?: Record<string, number>;
  spacing: number;
}

export interface InteractionDefinition {
  id: string;
  trigger: InteractionTrigger;
  action: InteractionAction;
  targets: string[]; // component IDs
}

export interface InteractionTrigger {
  type: 'click' | 'hover' | 'change' | 'load';
  source: string; // component ID
  condition?: any;
}

export interface InteractionAction {
  type: 'update' | 'filter' | 'highlight' | 'navigate' | 'compute';
  parameters: Record<string, any>;
}

export interface VisualizationState {
  filters: Record<string, any>;
  selections: Record<string, any>;
  computedValues: Record<string, any>;
  lastUpdated: string;
}

// Export all types
export type {
  // Main interfaces
  InteractiveSession,
  SessionMetadata,
  ScenarioAnalysis,
  WhatIfAnalysis,
  ModelSimulation,
  ScenarioComparison,
  InteractiveVisualization,

  // Supporting types
  ScenarioParameters,
  PredictedOutcome,
  RiskAssessment,
  ImpactAnalysis,
  SensitivityAnalysis,
  SimulationParameters,
  SimulationResults,
  ComparisonAnalysis,
  VisualizationComponent,
};
