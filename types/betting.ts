// Core Data Types
export interface BetSlip {
  id: string;
  userId: string;
  sportsbook: string;
  isParlay: boolean;
  totalStake: number;
  totalPayout?: number;
  totalOdds?: number;
  status: 'pending' | 'won' | 'lost' | 'pushed' | 'cancelled';
  placedAt: Date;
  settledAt?: Date;
  legs: BetLeg[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BetLeg {
  id: string;
  betSlipId: string;
  sport: string;
  league: string;
  eventName: string;
  eventDate?: Date;
  betType: string;
  selection: string;
  odds: string;
  oddsAmerican: number;
  oddsFormat: 'american' | 'decimal' | 'fractional';
  stake: number;
  potentialPayout: number;
  actualPayout?: number;
  result: 'pending' | 'won' | 'lost' | 'pushed';
  modelOdds?: number;
  modelConfidence?: number;
  edgeValue?: number;
}

export interface OCRUpload {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  sportsbook?: string;
  confidence: number;
  rawText: string;
  parsedData: any;
  status: 'processing' | 'completed' | 'failed' | 'review';
  betSlipId?: string;
}

export interface UserAnalytics {
  performance: PerformanceMetrics;
  bySport: Record<string, PerformanceMetrics>;
  byBetType: Record<string, BetTypeAnalytics>;
  bySportsbook: Record<string, PerformanceMetrics>;
  modelComparison?: ModelComparison;
  insights: Insight[];
  recommendations: Recommendation[];
}

export interface PerformanceMetrics {
  totalBets: number;
  totalParlays: number;
  winRate: number;
  totalStaked: number;
  totalReturned: number;
  profitLoss: number;
  roi: number;
  averageStake: number;
  biggestWin: number;
  biggestLoss: number;
  winStreak: number;
  currentStreak: { streak: number; isWinning: boolean };
}

export interface BetTypeAnalytics {
  totalBets: number;
  winRate: number;
  averageOdds: number;
  profitLoss: number;
}

export interface ModelComparison {
  totalComparisons: number;
  alignmentScore: number;
  averageEdge: number;
  positiveEdgeBets: number;
  modelAgreementRate: number;
}

export interface Insight {
  type: string;
  title: string;
  message: string;
  data?: any;
}

export interface Recommendation {
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  actionable: boolean;
}
