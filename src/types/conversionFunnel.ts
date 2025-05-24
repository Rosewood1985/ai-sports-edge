import { TrendDirection } from '../components/dashboard/metrics/MetricCard';

export interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface Cohort {
  startDate: string;
  size: number;
  conversionRate: number;
  retentionRates: { day: number; rate: number }[];
}

export interface ConversionTrigger {
  name: string;
  conversionImpact: number;
  convertedPercentage: number;
  nonConvertedPercentage: number;
}

export interface EngagementMetric {
  name: string;
  value: number;
  weight: number;
  trend: { direction: TrendDirection; value: string };
}

export interface EngagementScore {
  overallScore: number;
  scoreTrend: { direction: TrendDirection; value: string };
  metrics: EngagementMetric[];
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface ConversionFunnelData {
  funnelStages: FunnelStage[];
  cohorts: Cohort[];
  conversionTriggers: ConversionTrigger[];
  engagementScore: EngagementScore;
}
