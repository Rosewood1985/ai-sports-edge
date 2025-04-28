/**
 * Types for the Betting Slip Import feature
 */

/**
 * Supported sportsbooks for betting slip import
 */
export enum Sportsbook {
  DRAFTKINGS = 'draftkings',
  FANDUEL = 'fanduel',
  BETMGM = 'betmgm',
  CAESARS = 'caesars',
  POINTSBET = 'pointsbet',
  BARSTOOL = 'barstool',
  WYNN = 'wynn',
  BETRIVERS = 'betrivers',
  FOXBET = 'foxbet',
  UNIBET = 'unibet'
}

/**
 * Betting slip import method
 */
export enum ImportMethod {
  SCREENSHOT = 'screenshot',
  COPY_PASTE = 'copy_paste',
  MANUAL_ENTRY = 'manual_entry',
  QR_CODE = 'qr_code',
  DEEP_LINK = 'deep_link'
}

/**
 * Bet type for imported bets
 */
export enum ImportedBetType {
  MONEYLINE = 'moneyline',
  SPREAD = 'spread',
  OVER_UNDER = 'over_under',
  PROP = 'prop',
  PARLAY = 'parlay',
  TEASER = 'teaser',
  FUTURES = 'futures',
  LIVE = 'live',
  UNKNOWN = 'unknown'
}

/**
 * Status of the imported bet
 */
export enum ImportedBetStatus {
  PENDING = 'pending',
  WON = 'won',
  LOST = 'lost',
  PUSHED = 'pushed',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown'
}

/**
 * Validation status of the imported bet
 */
export enum ValidationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  NEEDS_REVIEW = 'needs_review',
  PENDING = 'pending'
}

/**
 * AI suggestion type for imported bets
 */
export enum SuggestionType {
  BETTER_ODDS = 'better_odds',
  HEDGE = 'hedge',
  AVOID = 'avoid',
  GOOD_VALUE = 'good_value',
  ALTERNATIVE_BET = 'alternative_bet',
  NONE = 'none'
}

/**
 * Imported bet leg (for parlays)
 */
export interface ImportedBetLeg {
  id: string;
  team?: string;
  player?: string;
  game?: string;
  betType: ImportedBetType;
  line?: number;
  odds: number;
  description: string;
  status: ImportedBetStatus;
}

/**
 * Imported bet from a sportsbook
 */
export interface ImportedBet {
  id: string;
  userId: string;
  sportsbook: Sportsbook;
  importMethod: ImportMethod;
  importTimestamp: number;
  betTimestamp: number;
  betType: ImportedBetType;
  sport: string;
  league: string;
  amount: number;
  odds: number;
  potentialWinnings: number;
  status: ImportedBetStatus;
  description: string;
  legs?: ImportedBetLeg[];
  validationStatus: ValidationStatus;
  validationMessage?: string;
  aiSuggestion?: AISuggestion;
}

/**
 * AI suggestion for an imported bet
 */
export interface AISuggestion {
  type: SuggestionType;
  description: string;
  confidence: number; // 0-1
  alternativeOdds?: number;
  alternativeSportsbook?: Sportsbook;
  potentialSavings?: number;
  potentialAdditionalWinnings?: number;
  hedgeAmount?: number;
  hedgeOdds?: number;
  hedgeSportsbook?: Sportsbook;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  message: string;
  bets: ImportedBet[];
  errorDetails?: string;
}

/**
 * Import history
 */
export interface ImportHistory {
  userId: string;
  imports: {
    id: string;
    timestamp: number;
    sportsbook: Sportsbook;
    importMethod: ImportMethod;
    betCount: number;
    totalAmount: number;
  }[];
}

/**
 * Subscription tier requirements for betting slip import
 */
export interface SubscriptionRequirements {
  isFeatureEnabled: boolean;
  requiredTier: string;
  currentTier: string;
  isEligible: boolean;
  upgradeMessage?: string;
  upgradeUrl?: string;
}