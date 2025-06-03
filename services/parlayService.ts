import AsyncStorage from '@react-native-async-storage/async-storage';

import { trackEvent } from './analyticsService';
import { hasPremiumAccess, MICROTRANSACTIONS } from './subscriptionService';
import { auth } from '../config/firebase';
import { Game, ConfidenceLevel } from '../types/odds';

// Parlay types
export interface ParlayPick {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  odds: number;
  confidence: ConfidenceLevel;
  reasoning: string;
}

export interface ParlayPackage {
  id: string;
  title: string;
  description: string;
  picks: ParlayPick[];
  totalOdds: number;
  potentialReturn: number;
  stakeAmount: number;
  confidence: ConfidenceLevel;
  createdAt: number;
  expiresAt: number;
  trendScore: number; // 0-100 indicating how trendy this parlay is
  purchased: boolean;
}

export interface ParlayPurchase {
  id: string;
  parlayId: string;
  userId: string;
  purchaseDate: number;
  price: number;
  result?: 'win' | 'loss' | 'pending';
}

/**
 * Generate a parlay pick for a game
 * @param game - The game to pick
 * @returns Parlay pick
 */
const generateParlayPick = (game: Game): ParlayPick => {
  // In a real app, this would use sophisticated AI models
  // For now, we'll simulate AI predictions with random data

  // Randomly select a winner
  const teams = [game.home_team, game.away_team];
  const pick = teams[Math.floor(Math.random() * teams.length)];

  // Generate random odds (between 1.5 and 3.0)
  const odds = 1.5 + Math.random() * 1.5;

  // Generate a confidence score (0-100)
  const confidenceScore = Math.floor(Math.random() * 100);

  // Determine confidence level based on score
  let confidence: ConfidenceLevel;
  if (confidenceScore >= 70) {
    confidence = 'high';
  } else if (confidenceScore >= 40) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Generate reasoning
  const reasonings = [
    `${pick} has won 7 of their last 10 games.`,
    `${pick} has a strong historical performance against their opponent.`,
    `${pick} has key players returning from injury.`,
    `${pick} has a statistical advantage in offensive efficiency.`,
    `${pick} has performed well in similar weather conditions.`,
    `Our AI model shows a 68% win probability for ${pick} based on recent form.`,
    `${pick}'s defense has been exceptional in the last 5 games.`,
    `${pick} has covered the spread in 80% of their last 10 games.`,
  ];

  const reasoning = reasonings[Math.floor(Math.random() * reasonings.length)];

  return {
    gameId: game.id,
    homeTeam: game.home_team,
    awayTeam: game.away_team,
    pick,
    odds: parseFloat(odds.toFixed(2)),
    confidence,
    reasoning,
  };
};

/**
 * Generate a parlay package from a list of games
 * @param games - List of games
 * @param size - Number of picks in the parlay (2-5)
 * @param stakeAmount - Stake amount in dollars
 * @returns Parlay package
 */
export const generateParlayPackage = (
  games: Game[],
  size: number = 3,
  stakeAmount: number = 10
): ParlayPackage => {
  // Ensure size is between 2 and 5
  const pickCount = Math.min(Math.max(size, 2), 5);

  // Ensure we have enough games
  if (games.length < pickCount) {
    throw new Error(`Not enough games to create a ${pickCount}-pick parlay`);
  }

  // Shuffle games and take the first 'pickCount' games
  const shuffledGames = [...games].sort(() => 0.5 - Math.random());
  const selectedGames = shuffledGames.slice(0, pickCount);

  // Generate picks for each selected game
  const picks = selectedGames.map(game => generateParlayPick(game));

  // Calculate total odds (multiply all odds together)
  const totalOdds = picks.reduce((total, pick) => total * pick.odds, 1);

  // Calculate potential return
  const potentialReturn = stakeAmount * totalOdds;

  // Determine overall confidence based on individual pick confidences
  const confidenceScores = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const totalConfidenceScore = picks.reduce(
    (total, pick) => total + confidenceScores[pick.confidence],
    0
  );

  const averageConfidenceScore = totalConfidenceScore / picks.length;

  let confidence: ConfidenceLevel;
  if (averageConfidenceScore > 2.5) {
    confidence = 'high';
  } else if (averageConfidenceScore > 1.5) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Generate trend score (0-100)
  const trendScore = 50 + Math.floor(Math.random() * 50);

  // Create parlay package
  const now = Date.now();
  return {
    id: `parlay_${now}_${Math.random().toString(36).substring(2, 9)}`,
    title: `${pickCount}-Pick ${confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence Parlay`,
    description: `AI-generated ${pickCount}-pick parlay with ${confidence} confidence`,
    picks,
    totalOdds: parseFloat(totalOdds.toFixed(2)),
    potentialReturn: parseFloat(potentialReturn.toFixed(2)),
    stakeAmount,
    confidence,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // Expires in 24 hours
    trendScore,
    purchased: false,
  };
};

/**
 * Get trending parlay packages
 * @param games - List of games
 * @param count - Number of parlay packages to generate
 * @returns List of parlay packages
 */
export const getTrendingParlays = async (
  games: Game[],
  count: number = 3
): Promise<ParlayPackage[]> => {
  try {
    if (games.length < 2) {
      return [];
    }

    // Generate different sized parlays
    const parlays: ParlayPackage[] = [];

    // 2-pick parlay
    parlays.push(generateParlayPackage(games, 2));

    // 3-pick parlay
    if (games.length >= 3) {
      parlays.push(generateParlayPackage(games, 3));
    }

    // 4 or 5-pick parlay for the last one
    if (games.length >= 4) {
      const size = games.length >= 5 ? 5 : 4;
      parlays.push(generateParlayPackage(games, size));
    }

    // Sort by trend score (highest first)
    parlays.sort((a, b) => b.trendScore - a.trendScore);

    // Check if user has purchased any of these parlays
    const userId = auth.currentUser?.uid;
    if (userId) {
      const purchasedParlaysData = await AsyncStorage.getItem(`purchased_parlays_${userId}`);
      const purchasedParlays = purchasedParlaysData ? JSON.parse(purchasedParlaysData) : [];

      // Mark parlays as purchased if they've been purchased
      parlays.forEach(parlay => {
        parlay.purchased = purchasedParlays.some(
          (purchase: ParlayPurchase) => purchase.parlayId === parlay.id
        );
      });
    }

    return parlays.slice(0, count);
  } catch (error) {
    console.error('Error getting trending parlays:', error);
    return [];
  }
};

/**
 * Purchase a parlay package
 * @param userId - User ID
 * @param parlayId - Parlay package ID
 * @param parlay - Parlay package
 * @returns Success status
 */
export const purchaseParlay = async (
  userId: string,
  parlayId: string,
  parlay: ParlayPackage
): Promise<boolean> => {
  try {
    // Check if user has premium access (premium users get discounted parlays)
    const hasPremium = await hasPremiumAccess(userId);

    // Find the parlay microtransaction product
    const parlayProduct = MICROTRANSACTIONS.find(p => p.id === 'parlay-suggestion');
    if (!parlayProduct) {
      throw new Error('Parlay product not found');
    }

    // Apply discount for premium users
    const price = hasPremium ? parlayProduct.price * 0.7 : parlayProduct.price;

    // Create purchase record
    const purchase: ParlayPurchase = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      parlayId,
      userId,
      purchaseDate: Date.now(),
      price,
      result: 'pending',
    };

    // Save to AsyncStorage
    const purchasesKey = `purchased_parlays_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];

    existingPurchases.push(purchase);

    await AsyncStorage.setItem(purchasesKey, JSON.stringify(existingPurchases));

    // Track the purchase event
    trackEvent('parlay_purchased' as any, {
      parlay_id: parlayId,
      price,
      picks_count: parlay.picks.length,
      confidence: parlay.confidence,
      has_premium: hasPremium,
    });

    return true;
  } catch (error) {
    console.error('Error purchasing parlay:', error);
    return false;
  }
};

/**
 * Check if user has purchased a parlay
 * @param userId - User ID
 * @param parlayId - Parlay package ID
 * @returns Whether the user has purchased the parlay
 */
export const hasPurchasedParlay = async (userId: string, parlayId: string): Promise<boolean> => {
  try {
    const purchasesKey = `purchased_parlays_${userId}`;
    const purchasesData = await AsyncStorage.getItem(purchasesKey);

    if (!purchasesData) {
      return false;
    }

    const purchases = JSON.parse(purchasesData) as ParlayPurchase[];

    return purchases.some(purchase => purchase.parlayId === parlayId);
  } catch (error) {
    console.error('Error checking parlay purchase:', error);
    return false;
  }
};

/**
 * Get user's purchased parlays
 * @param userId - User ID
 * @returns List of purchased parlays
 */
export const getPurchasedParlays = async (userId: string): Promise<ParlayPurchase[]> => {
  try {
    const purchasesKey = `purchased_parlays_${userId}`;
    const purchasesData = await AsyncStorage.getItem(purchasesKey);

    if (!purchasesData) {
      return [];
    }

    return JSON.parse(purchasesData) as ParlayPurchase[];
  } catch (error) {
    console.error('Error getting purchased parlays:', error);
    return [];
  }
};

export default {
  generateParlayPackage,
  getTrendingParlays,
  purchaseParlay,
  hasPurchasedParlay,
  getPurchasedParlays,
};
