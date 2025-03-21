import { Game, Market, Outcome } from '../types/odds';
import fetchOdds from '../config/oddsApi';
import { auth } from '../config/firebase';
import { hasPremiumAccess, purchaseMicrotransaction } from './firebaseSubscriptionService';

// Define parlay types
export type ParlayType = '2-team' | '3-team' | '4-team';

// Define parlay access types
export type ParlayAccessDuration = 'daily' | 'weekly' | 'monthly';

// Define parlay access pricing
export const PARLAY_PRICING = {
  daily: {
    id: 'live-parlay-odds-daily',
    price: 2.99,
    name: 'Daily Parlay Odds Access',
    description: '24-hour access to live parlay odds',
  },
  weekly: {
    id: 'live-parlay-odds-weekly',
    price: 9.99,
    name: 'Weekly Parlay Odds Access',
    description: '7-day access to live parlay odds',
  },
  monthly: {
    id: 'live-parlay-odds-monthly',
    price: 24.99,
    name: 'Monthly Parlay Odds Access',
    description: '30-day access to live parlay odds',
  }
};

// Define parlay access record type
export interface ParlayAccess {
  userId: string;
  accessType: ParlayAccessDuration;
  purchaseDate: number;
  expirationDate: number;
}

/**
 * Calculate parlay odds for a set of games
 * @param games Array of games to include in the parlay
 * @param betType Type of bet (moneyline, spread, total)
 * @param selections Array of selected outcomes (team names or over/under)
 * @returns Calculated parlay odds (American format)
 */
export const calculateParlayOdds = (
  games: Game[],
  betType: 'h2h' | 'spreads' | 'totals',
  selections: string[]
): number => {
  if (games.length !== selections.length) {
    throw new Error('Number of games must match number of selections');
  }

  // Convert all odds to decimal format for calculation
  const decimalOdds: number[] = [];

  games.forEach((game, index) => {
    const selection = selections[index];
    let foundOdds = false;

    // Find the bookmaker with the market we need
    for (const bookmaker of game.bookmakers) {
      const market = bookmaker.markets.find(m => m.key === betType);
      if (!market) continue;

      // Find the outcome that matches our selection
      const outcome = findOutcomeForSelection(market, selection, game);
      if (outcome) {
        // Convert American odds to decimal
        decimalOdds.push(americanToDecimal(outcome.price));
        foundOdds = true;
        break;
      }
    }

    if (!foundOdds) {
      throw new Error(`Could not find odds for selection: ${selection} in game: ${game.id}`);
    }
  });

  // Calculate combined decimal odds by multiplying all individual odds
  const combinedDecimalOdds = decimalOdds.reduce((acc, odds) => acc * odds, 1);

  // Convert back to American odds
  return decimalToAmerican(combinedDecimalOdds);
};

/**
 * Find the outcome that matches the selection
 * @param market Market to search in
 * @param selection Selection (team name or over/under)
 * @param game Game data for context
 * @returns Matching outcome or undefined
 */
const findOutcomeForSelection = (
  market: Market,
  selection: string,
  game: Game
): Outcome | undefined => {
  // For moneyline (h2h) bets
  if (market.key === 'h2h') {
    // Find the outcome where the name matches the selection
    return market.outcomes.find(outcome => 
      outcome.name.toLowerCase() === selection.toLowerCase()
    );
  }
  
  // For spread bets
  if (market.key === 'spreads') {
    // Find the outcome where the name matches the selection
    return market.outcomes.find(outcome => 
      outcome.name.toLowerCase() === selection.toLowerCase()
    );
  }
  
  // For totals (over/under) bets
  if (market.key === 'totals') {
    // Selection should be "over" or "under"
    const overUnder = selection.toLowerCase().startsWith('over') ? 'Over' : 'Under';
    return market.outcomes.find(outcome => 
      outcome.name === overUnder
    );
  }
  
  return undefined;
};

/**
 * Convert American odds to decimal format
 * @param americanOdds Odds in American format
 * @returns Odds in decimal format
 */
export const americanToDecimal = (americanOdds: number): number => {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
};

/**
 * Convert decimal odds to American format
 * @param decimalOdds Odds in decimal format
 * @returns Odds in American format
 */
export const decimalToAmerican = (decimalOdds: number): number => {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
};

/**
 * Calculate potential payout for a bet
 * @param odds Odds in American format
 * @param betAmount Bet amount in dollars
 * @returns Potential payout in dollars
 */
export const calculatePotentialPayout = (odds: number, betAmount: number): number => {
  const decimalOdds = americanToDecimal(odds);
  return decimalOdds * betAmount;
};

/**
 * Fetch games for parlay selection
 * @param sport Sport key (e.g., "americanfootball_nfl")
 * @param useCache Whether to use cached data
 * @returns Array of games
 */
export const fetchGamesForParlay = async (
  sport = "americanfootball_nfl",
  useCache = true
): Promise<Game[]> => {
  try {
    const result = await fetchOdds(
      sport,
      ["h2h", "spreads", "totals"],
      "us",
      useCache
    );
    
    if (result.success && result.data) {
      return result.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching games for parlay:', error);
    return [];
  }
};

/**
 * Check if a user has access to live parlay odds
 * @param userId User ID
 * @returns Whether the user has access
 */
export const hasParlayAccess = async (userId: string): Promise<boolean> => {
  try {
    // First check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      return true;
    }
    
    // TODO: Check for specific parlay access in Firestore
    // This would check if the user has purchased parlay access
    // and if it's still valid
    
    // For now, return false
    return false;
  } catch (error) {
    console.error('Error checking parlay access:', error);
    return false;
  }
};

/**
 * Purchase access to live parlay odds
 * @param accessType Duration of access
 * @param paymentMethodId Payment method ID
 * @returns Whether the purchase was successful
 */
export const purchaseParlayAccess = async (
  accessType: ParlayAccessDuration,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const pricing = PARLAY_PRICING[accessType];
    
    // Purchase the microtransaction
    const success = await purchaseMicrotransaction(
      userId,
      pricing.id,
      paymentMethodId
    );
    
    if (success) {
      // TODO: Store the access record in Firestore
      // This would include the user ID, access type, purchase date,
      // and expiration date
    }
    
    return success;
  } catch (error) {
    console.error('Error purchasing parlay access:', error);
    return false;
  }
};

/**
 * Get value indicator for a parlay
 * @param calculatedOdds Calculated parlay odds
 * @param bookmakerOdds Bookmaker's parlay odds
 * @returns Value indicator (-1 to 1, where positive is good value)
 */
export const getParlayValueIndicator = (
  calculatedOdds: number,
  bookmakerOdds: number
): number => {
  const calculatedDecimal = americanToDecimal(calculatedOdds);
  const bookmakerDecimal = americanToDecimal(bookmakerOdds);
  
  // Calculate the percentage difference
  const difference = (calculatedDecimal - bookmakerDecimal) / bookmakerDecimal;
  
  // Clamp to range -1 to 1
  return Math.max(-1, Math.min(1, difference));
};

/**
 * Format odds for display
 * @param odds Odds in American format
 * @returns Formatted odds string
 */
export const formatOdds = (odds: number): string => {
  if (odds > 0) {
    return `+${odds}`;
  } else {
    return `${odds}`;
  }
};

// Define the type for the service
export interface ParlayOddsService {
  calculateParlayOdds: typeof calculateParlayOdds;
  americanToDecimal: typeof americanToDecimal;
  decimalToAmerican: typeof decimalToAmerican;
  calculatePotentialPayout: typeof calculatePotentialPayout;
  fetchGamesForParlay: typeof fetchGamesForParlay;
  hasParlayAccess: typeof hasParlayAccess;
  purchaseParlayAccess: typeof purchaseParlayAccess;
  getParlayValueIndicator: typeof getParlayValueIndicator;
  formatOdds: typeof formatOdds;
  PARLAY_PRICING: typeof PARLAY_PRICING;
}

// Create a service object with all the functions
const parlayOddsService: ParlayOddsService = {
  calculateParlayOdds,
  americanToDecimal,
  decimalToAmerican,
  calculatePotentialPayout,
  fetchGamesForParlay,
  hasParlayAccess,
  purchaseParlayAccess,
  getParlayValueIndicator,
  formatOdds,
  PARLAY_PRICING
};

// Export the service as default
export default parlayOddsService;