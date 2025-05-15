// Horse Racing Types

// Track condition enum
export enum TrackCondition {
  FAST = 'FAST',
  GOOD = 'GOOD',
  MUDDY = 'MUDDY',
  SLOPPY = 'SLOPPY',
  SLOW = 'SLOW',
  HEAVY = 'HEAVY',
  FIRM = 'FIRM',
  GOOD_FIRM = 'GOOD_FIRM',
  SOFT = 'SOFT',
  YIELDING = 'YIELDING',
  FROZEN = 'FROZEN',
  SEALED = 'SEALED'
}

// Race type enum
export enum RaceType {
  FLAT = 'FLAT',
  HURDLE = 'HURDLE',
  STEEPLECHASE = 'STEEPLECHASE',
  HARNESS = 'HARNESS'
}

// Race grade enum
export enum RaceGrade {
  GRADE_1 = 'GRADE_1',
  GRADE_2 = 'GRADE_2',
  GRADE_3 = 'GRADE_3',
  LISTED = 'LISTED',
  HANDICAP = 'HANDICAP',
  MAIDEN = 'MAIDEN',
  CLAIMING = 'CLAIMING',
  ALLOWANCE = 'ALLOWANCE'
}

// Race status enum
export enum RaceStatus {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED',
  POSTPONED = 'POSTPONED'
}

// Bet type enum
export enum BetType {
  WIN = 'WIN',
  PLACE = 'PLACE',
  SHOW = 'SHOW',
  EXACTA = 'EXACTA',
  QUINELLA = 'QUINELLA',
  TRIFECTA = 'TRIFECTA',
  SUPERFECTA = 'SUPERFECTA',
  DAILY_DOUBLE = 'DAILY_DOUBLE',
  PICK_3 = 'PICK_3',
  PICK_4 = 'PICK_4',
  PICK_5 = 'PICK_5',
  PICK_6 = 'PICK_6'
}

// Track interface
export interface Track {
  id: string;
  name: string;
  code: string;
  location: string;
  country: string;
  timezone: string;
  surface: string[];
  weatherCondition?: string;
  temperature?: number;
  trackBias?: string;
}

// Jockey interface
export interface Jockey {
  id: string;
  name: string;
  wins: number;
  places: number;
  shows: number;
  careerWinRate: number;
  yearWinRate: number;
  trackWinRate: number;
}

// Trainer interface
export interface Trainer {
  id: string;
  name: string;
  wins: number;
  winRate: number;
  roi: number;
}

// Horse interface
export interface Horse {
  id: string;
  name: string;
  age: number;
  sex: 'colt' | 'filly' | 'mare' | 'stallion' | 'gelding';
  weight: number;
  jockey: Jockey;
  trainer: Trainer;
  form: string;
  odds: number;
  morningLineOdds?: number;
  currentOdds?: number;
  saddleNumber: number;
  postPosition: number;
  isScratched: boolean;
  speedFigures?: number[];
  pastPerformances?: any[];
  equipment?: string[];
  medication?: string[];
}

// Race interface
export interface Race {
  id: string;
  trackId: string;
  track: Track;
  date: string;
  postTime: string;
  raceNumber: number;
  name?: string;
  distance: number; // in furlongs
  surface: string;
  condition: TrackCondition;
  raceType: RaceType;
  raceGrade?: RaceGrade;
  purse: number;
  ageRestrictions?: string;
  entries: Horse[];
  status: RaceStatus;
  results?: {
    positions: { position: number; horseId: string }[];
    winPayouts: { betType: BetType; amount: number; selections: number[] }[];
  };
  weather?: {
    condition: string;
    temperature: number;
    windSpeed: number;
    windDirection: string;
    precipitation: number;
  };
  isStakes: boolean;
  isGraded: boolean;
}

// Betting option interface
export interface BettingOption {
  id: string;
  raceId: string;
  betType: BetType;
  selections: number[]; // Saddle numbers
  odds: number;
  minBet: number;
  maxBet?: number;
  poolSize?: number;
  willPay?: number;
}

// User bet interface
export interface UserBet {
  id?: string;
  userId: string;
  raceId: string;
  betType: BetType;
  selections: number[];
  amount: number;
  potentialPayout: number;
  isWin?: boolean;
  payout?: number;
  timestamp: string;
}

// Race prediction interface
export interface RacePrediction {
  raceId: string;
  timestamp: number;
  predictions: {
    horseId: string;
    horseName: string;
    winProbability: number;
    placeProbability: number;
    showProbability: number;
    expectedValue: number;
    confidenceScore: number;
    keyFactors: string[];
  }[];
  suggestedBets: {
    betType: BetType;
    selections: number[];
    recommendedAmount: number;
    expectedValue: number;
    confidenceScore: number;
    reasoning: string;
  }[];
  trackBias: {
    favoredRunningStyle: 'early_speed' | 'stalker' | 'closer' | 'none';
    favoredPostPositions: number[];
    biasStrength: 'strong' | 'moderate' | 'weak' | 'none';
    notes: string;
  };
  paceScenario: {
    projectedPace: 'fast' | 'moderate' | 'slow';
    earlyPaceSetters: string[];
    closers: string[];
    paceAdvantage: string;
  };
  weatherImpact?: {
    affectedHorses: {
      horseId: string;
      impact: 'positive' | 'negative' | 'neutral';
      reason: string;
    }[];
    overallImpact: string;
  };
}

// Bankroll data interface
export interface BankrollData {
  userId: string;
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  bettingPatterns: {
    averageBetSize: number;
    betSizeVariance: number;
    betFrequency: number;
    preferredBetTypes: { name: string; count: number }[];
    preferredSports: { name: string; count: number }[];
    preferredLeagues: { name: string; count: number }[];
  };
  bettingHistory: {
    date: string;
    betsPlaced: number;
    betsWon: number;
    amountWagered: number;
    amountWon: number;
    netProfit: number;
    roi: number;
  }[];
  recommendations: BankrollRecommendation[];
}

// Bankroll recommendation interface
export interface BankrollRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'bet_sizing' | 'bet_type' | 'track_selection' | 'timing' | 'risk_management' | 'tracking' | 'discipline' | 'general';
  priority: 'high' | 'medium' | 'low';
  potentialImpact: string;
  isImplemented: boolean;
  implementedDate?: string;
  createdDate: string;
}