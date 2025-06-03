#!/usr/bin/env node

/**
 * Test script for the betting analytics service implementation
 *
 * This script tests the JavaScript implementation of the betting analytics service
 * by using a simplified version that can be run directly with Node.js.
 *
 * Usage:
 *   node scripts/test-betting-analytics.js
 */

require('dotenv').config();

// Mock Firebase Auth and Firestore
const mockAuth = {
  currentUser: {
    uid: 'test-user-123',
  },
};

const mockFirestore = {
  collection: () => mockFirestore,
  doc: () => mockFirestore,
  getDoc: async () => ({
    exists: () => true,
    data: () => mockBetData,
  }),
  getDocs: async () => ({
    forEach: callback => {
      mockBets.forEach((bet, index) => {
        callback({
          id: `bet-${index}`,
          data: () => bet,
        });
      });
    },
  }),
  addDoc: async () => ({ id: 'new-bet-id' }),
  updateDoc: async () => {},
  query: () => mockFirestore,
  where: () => mockFirestore,
  orderBy: () => mockFirestore,
  limit: () => mockFirestore,
};

// Enums for bet types, status, and results
const BetType = {
  MONEYLINE: 'moneyline',
  SPREAD: 'spread',
  OVER_UNDER: 'overUnder',
  PROP: 'prop',
  PARLAY: 'parlay',
  FUTURES: 'futures',
};

const BetStatus = {
  PENDING: 'pending',
  SETTLED: 'settled',
  CANCELLED: 'cancelled',
};

const BetResult = {
  WIN: 'win',
  LOSS: 'loss',
  PUSH: 'push',
  VOID: 'void',
};

// Mock bet data
const mockBetData = {
  userId: 'test-user-123',
  gameId: 'game-456',
  teamId: 'team-789',
  betType: BetType.MONEYLINE,
  amount: 100,
  odds: 150,
  potentialWinnings: 150,
  status: BetStatus.SETTLED,
  result: BetResult.WIN,
  createdAt: { toMillis: () => Date.now() - 86400000 }, // 1 day ago
  settledAt: { toMillis: () => Date.now() - 43200000 }, // 12 hours ago
  sport: 'Basketball',
  league: 'NBA',
  teamName: 'Los Angeles Lakers',
  opponentName: 'Boston Celtics',
  gameDate: { toMillis: () => Date.now() - 86400000 }, // 1 day ago
};

// Mock bets for testing
const mockBets = [
  // Winning moneyline bet on Lakers
  {
    userId: 'test-user-123',
    gameId: 'game-456',
    teamId: 'team-789',
    betType: BetType.MONEYLINE,
    amount: 100,
    odds: 150,
    potentialWinnings: 150,
    status: BetStatus.SETTLED,
    result: BetResult.WIN,
    createdAt: { toMillis: () => Date.now() - 86400000 }, // 1 day ago
    settledAt: { toMillis: () => Date.now() - 43200000 }, // 12 hours ago
    sport: 'Basketball',
    league: 'NBA',
    teamName: 'Los Angeles Lakers',
    opponentName: 'Boston Celtics',
    gameDate: { toMillis: () => Date.now() - 86400000 }, // 1 day ago
  },
  // Losing spread bet on Warriors
  {
    userId: 'test-user-123',
    gameId: 'game-457',
    teamId: 'team-790',
    betType: BetType.SPREAD,
    amount: 50,
    odds: -110,
    potentialWinnings: 45.45,
    status: BetStatus.SETTLED,
    result: BetResult.LOSS,
    createdAt: { toMillis: () => Date.now() - 172800000 }, // 2 days ago
    settledAt: { toMillis: () => Date.now() - 129600000 }, // 1.5 days ago
    sport: 'Basketball',
    league: 'NBA',
    teamName: 'Golden State Warriors',
    opponentName: 'Phoenix Suns',
    gameDate: { toMillis: () => Date.now() - 172800000 }, // 2 days ago
  },
  // Winning over/under bet on Yankees game
  {
    userId: 'test-user-123',
    gameId: 'game-458',
    teamId: 'team-791',
    betType: BetType.OVER_UNDER,
    amount: 75,
    odds: -105,
    potentialWinnings: 71.43,
    status: BetStatus.SETTLED,
    result: BetResult.WIN,
    createdAt: { toMillis: () => Date.now() - 259200000 }, // 3 days ago
    settledAt: { toMillis: () => Date.now() - 216000000 }, // 2.5 days ago
    sport: 'Baseball',
    league: 'MLB',
    teamName: 'New York Yankees',
    opponentName: 'Boston Red Sox',
    gameDate: { toMillis: () => Date.now() - 259200000 }, // 3 days ago
  },
  // Push on prop bet for Chiefs game
  {
    userId: 'test-user-123',
    gameId: 'game-459',
    teamId: 'team-792',
    betType: BetType.PROP,
    amount: 25,
    odds: 200,
    potentialWinnings: 50,
    status: BetStatus.SETTLED,
    result: BetResult.PUSH,
    createdAt: { toMillis: () => Date.now() - 345600000 }, // 4 days ago
    settledAt: { toMillis: () => Date.now() - 302400000 }, // 3.5 days ago
    sport: 'Football',
    league: 'NFL',
    teamName: 'Kansas City Chiefs',
    opponentName: 'Buffalo Bills',
    gameDate: { toMillis: () => Date.now() - 345600000 }, // 4 days ago
  },
  // Losing parlay bet
  {
    userId: 'test-user-123',
    gameId: 'game-460',
    teamId: 'team-793',
    betType: BetType.PARLAY,
    amount: 20,
    odds: 600,
    potentialWinnings: 120,
    status: BetStatus.SETTLED,
    result: BetResult.LOSS,
    createdAt: { toMillis: () => Date.now() - 432000000 }, // 5 days ago
    settledAt: { toMillis: () => Date.now() - 388800000 }, // 4.5 days ago
    sport: 'Multiple',
    league: 'Multiple',
    teamName: 'Parlay (3 teams)',
    gameDate: { toMillis: () => Date.now() - 432000000 }, // 5 days ago
  },
];

// Mock Timestamp
class Timestamp {
  constructor(seconds, nanoseconds) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  static now() {
    return new Timestamp(Math.floor(Date.now() / 1000), 0);
  }

  static fromDate(date) {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  }

  toMillis() {
    return this.seconds * 1000;
  }
}

/**
 * Betting Analytics Service class
 */
class BettingAnalyticsService {
  constructor() {
    this.auth = mockAuth;
    this.firestore = mockFirestore;
    this.betsCollection = mockFirestore.collection('bets');
    this.Timestamp = Timestamp;
  }

  /**
   * Add a new bet record
   * @param {Object} bet Bet record to add
   * @returns {Promise<string>} Promise with the new bet ID
   */
  async addBet(bet) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Calculate potential winnings if not provided
      if (!bet.potentialWinnings) {
        bet.potentialWinnings = this.calculatePotentialWinnings(bet.amount, bet.odds);
      }

      const betWithUserId = {
        ...bet,
        userId,
        createdAt: bet.createdAt || Timestamp.now(),
        status: bet.status || BetStatus.PENDING,
      };

      const docRef = await this.betsCollection.addDoc(betWithUserId);
      return docRef.id;
    } catch (error) {
      console.error('Error adding bet:', error);
      throw error;
    }
  }

  /**
   * Update a bet record
   * @param {string} betId Bet ID
   * @param {Object} updates Updates to apply
   */
  async updateBet(betId, updates) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const betRef = this.firestore.doc('bets', betId);
      const betSnap = await this.firestore.getDoc(betRef);

      if (!betSnap.exists()) {
        throw new Error('Bet not found');
      }

      const betData = betSnap.data();
      if (betData.userId !== userId) {
        throw new Error('Not authorized to update this bet');
      }

      // If updating status to settled, add settledAt timestamp
      if (updates.status === BetStatus.SETTLED && !updates.settledAt) {
        updates.settledAt = Timestamp.now();
      }

      await this.firestore.updateDoc(betRef, updates);
    } catch (error) {
      console.error('Error updating bet:', error);
      throw error;
    }
  }

  /**
   * Get all bets for the current user
   * @param {Object} filters Optional filters
   * @returns {Promise<Array>} Promise with array of bet records
   */
  async getUserBets(filters = {}) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const q = this.firestore.query(
        this.betsCollection,
        this.firestore.where('userId', '==', userId)
      );

      // Apply filters (in a real implementation)
      // For this mock, we'll just return all bets

      const querySnapshot = await this.firestore.getDocs(q);
      const bets = [];

      querySnapshot.forEach(doc => {
        bets.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return bets;
    } catch (error) {
      console.error('Error getting user bets:', error);
      throw error;
    }
  }

  /**
   * Get analytics summary for the current user
   * @param {Object} timePeriod Optional time period filter
   * @returns {Promise<Object>} Promise with analytics summary
   */
  async getAnalyticsSummary(timePeriod = {}) {
    try {
      // Get all settled bets for the user within the time period
      const bets = await this.getUserBets({
        status: BetStatus.SETTLED,
        timePeriod,
      });

      if (bets.length === 0) {
        return this.getEmptyAnalyticsSummary();
      }

      // Calculate basic stats
      const totalBets = bets.length;
      const totalWagered = bets.reduce((sum, bet) => sum + bet.amount, 0);

      const winningBets = bets.filter(bet => bet.result === BetResult.WIN);
      const losingBets = bets.filter(bet => bet.result === BetResult.LOSS);
      const pushBets = bets.filter(bet => bet.result === BetResult.PUSH);

      const totalWinnings = winningBets.reduce((sum, bet) => sum + (bet.potentialWinnings || 0), 0);
      const netProfit = totalWinnings - totalWagered;
      const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;
      const winRate = totalBets > 0 ? (winningBets.length / totalBets) * 100 : 0;
      const averageBetAmount = totalBets > 0 ? totalWagered / totalBets : 0;
      const averageOdds =
        totalBets > 0 ? bets.reduce((sum, bet) => sum + bet.odds, 0) / totalBets : 0;

      // Find best and worst bets
      const bestBet = this.findBestBet(bets);
      const worstBet = this.findWorstBet(bets);

      // Calculate most bet sport and team
      const sportCounts = {};
      const teamCounts = {};

      bets.forEach(bet => {
        // Count sports
        sportCounts[bet.sport] = (sportCounts[bet.sport] || 0) + 1;

        // Count teams
        if (!teamCounts[bet.teamId]) {
          teamCounts[bet.teamId] = {
            teamId: bet.teamId,
            teamName: bet.teamName,
            count: 0,
          };
        }
        teamCounts[bet.teamId].count++;
      });

      // Find most bet sport
      let mostBetSport;
      Object.entries(sportCounts).forEach(([sport, count]) => {
        if (!mostBetSport || count > mostBetSport.count) {
          mostBetSport = { sport, count };
        }
      });

      // Find most bet team
      let mostBetTeam;
      Object.values(teamCounts).forEach(teamCount => {
        if (!mostBetTeam || teamCount.count > mostBetTeam.count) {
          mostBetTeam = teamCount;
        }
      });

      // Calculate recent form (last 5 bets)
      const recentForm = bets
        .slice(0, 5)
        .map(bet => bet.result)
        .filter(result => result !== undefined);

      // Calculate streaks
      const streaks = this.calculateStreaks(bets);

      // Calculate bet type breakdown
      const betTypeBreakdown = {};

      Object.values(BetType).forEach(betType => {
        const betsOfType = bets.filter(bet => bet.betType === betType);
        if (betsOfType.length > 0) {
          const winsOfType = betsOfType.filter(bet => bet.result === BetResult.WIN).length;
          const totalWageredOfType = betsOfType.reduce((sum, bet) => sum + bet.amount, 0);
          const totalWinningsOfType = betsOfType
            .filter(bet => bet.result === BetResult.WIN)
            .reduce((sum, bet) => sum + (bet.potentialWinnings || 0), 0);

          betTypeBreakdown[betType] = {
            count: betsOfType.length,
            winRate: (winsOfType / betsOfType.length) * 100,
            profit: totalWinningsOfType - totalWageredOfType,
          };
        }
      });

      return {
        totalBets,
        totalWagered,
        totalWinnings,
        netProfit,
        roi,
        winRate,
        averageBetAmount,
        averageOdds,
        bestBet,
        worstBet,
        mostBetSport,
        mostBetTeam,
        recentForm,
        streaks,
        betTypeBreakdown,
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      throw error;
    }
  }

  /**
   * Calculate potential winnings based on bet amount and odds
   * @param {number} amount Bet amount
   * @param {number} odds Bet odds (American format)
   * @returns {number} Potential winnings
   */
  calculatePotentialWinnings(amount, odds) {
    if (odds >= 0) {
      // Positive odds (underdog)
      return amount * (odds / 100);
    } else {
      // Negative odds (favorite)
      return amount * (100 / Math.abs(odds));
    }
  }

  /**
   * Find the best bet from a list of bets
   * @param {Array} bets List of bets
   * @returns {Object} Best bet or undefined
   */
  findBestBet(bets) {
    const winningBets = bets.filter(bet => bet.result === BetResult.WIN);
    if (winningBets.length === 0) {
      return undefined;
    }

    return winningBets.reduce((best, bet) => {
      const profit = (bet.potentialWinnings || 0) - bet.amount;
      const bestProfit = (best.potentialWinnings || 0) - best.amount;

      return profit > bestProfit ? bet : best;
    }, winningBets[0]);
  }

  /**
   * Find the worst bet from a list of bets
   * @param {Array} bets List of bets
   * @returns {Object} Worst bet or undefined
   */
  findWorstBet(bets) {
    const losingBets = bets.filter(bet => bet.result === BetResult.LOSS);
    if (losingBets.length === 0) {
      return undefined;
    }

    return losingBets.reduce((worst, bet) => {
      return bet.amount > worst.amount ? bet : worst;
    }, losingBets[0]);
  }

  /**
   * Calculate winning and losing streaks
   * @param {Array} bets List of bets
   * @returns {Object} Streak information
   */
  calculateStreaks(bets) {
    let currentStreakType = null;
    let currentStreakCount = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;

    // Sort bets by date (oldest first) to calculate streaks chronologically
    const sortedBets = [...bets].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

    sortedBets.forEach(bet => {
      if (bet.result === BetResult.WIN || bet.result === BetResult.LOSS) {
        if (currentStreakType === bet.result) {
          // Continue current streak
          currentStreakCount++;
        } else {
          // Start new streak
          currentStreakType = bet.result;
          currentStreakCount = 1;
        }

        // Update longest streaks
        if (bet.result === BetResult.WIN && currentStreakCount > longestWinStreak) {
          longestWinStreak = currentStreakCount;
        } else if (bet.result === BetResult.LOSS && currentStreakCount > longestLossStreak) {
          longestLossStreak = currentStreakCount;
        }
      }
      // Ignore PUSH and VOID results for streak calculations
    });

    return {
      currentStreak: {
        type: currentStreakType || BetResult.PUSH,
        count: currentStreakCount,
      },
      longestWinStreak,
      longestLossStreak,
    };
  }

  /**
   * Get empty analytics summary for users with no bets
   * @returns {Object} Empty analytics summary
   */
  getEmptyAnalyticsSummary() {
    return {
      totalBets: 0,
      totalWagered: 0,
      totalWinnings: 0,
      netProfit: 0,
      roi: 0,
      winRate: 0,
      averageBetAmount: 0,
      averageOdds: 0,
      recentForm: [],
      streaks: {
        currentStreak: {
          type: BetResult.PUSH,
          count: 0,
        },
        longestWinStreak: 0,
        longestLossStreak: 0,
      },
      betTypeBreakdown: {},
    };
  }
}

/**
 * Format currency
 * @param {number} amount Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format percentage
 * @param {number} value Percentage value
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

/**
 * Main function
 */
async function main() {
  console.log('Testing betting analytics service implementation...');
  console.log('=================================================\n');

  // Create betting analytics service instance
  const bettingAnalyticsService = new BettingAnalyticsService();

  // Get user bets
  console.log('Getting user bets...');
  const userBets = await bettingAnalyticsService.getUserBets();
  console.log(`Found ${userBets.length} bets for the user`);

  // Get analytics summary
  console.log('\nGetting analytics summary...');
  const analytics = await bettingAnalyticsService.getAnalyticsSummary();

  console.log('\nAnalytics Summary:');
  console.log('----------------');
  console.log(`Total Bets: ${analytics.totalBets}`);
  console.log(`Win Rate: ${formatPercentage(analytics.winRate)}`);
  console.log(`Total Wagered: ${formatCurrency(analytics.totalWagered)}`);
  console.log(`Total Winnings: ${formatCurrency(analytics.totalWinnings)}`);
  console.log(`Net Profit: ${formatCurrency(analytics.netProfit)}`);
  console.log(`ROI: ${formatPercentage(analytics.roi)}`);

  // Display recent form
  console.log('\nRecent Form:');
  console.log('------------');
  if (analytics.recentForm.length > 0) {
    const formString = analytics.recentForm
      .map(result => {
        if (result === BetResult.WIN) return 'W';
        if (result === BetResult.LOSS) return 'L';
        if (result === BetResult.PUSH) return 'P';
        return 'V';
      })
      .join(' ');
    console.log(formString);
  } else {
    console.log('No recent bets');
  }

  // Display streaks
  console.log('\nStreaks:');
  console.log('--------');
  console.log(
    `Current Streak: ${analytics.streaks.currentStreak.count} ${analytics.streaks.currentStreak.type}(s)`
  );
  console.log(`Longest Win Streak: ${analytics.streaks.longestWinStreak}`);
  console.log(`Longest Loss Streak: ${analytics.streaks.longestLossStreak}`);

  // Display bet type breakdown
  console.log('\nBet Type Breakdown:');
  console.log('------------------');
  Object.entries(analytics.betTypeBreakdown).forEach(([betType, data]) => {
    console.log(
      `${betType}: ${data.count} bets, ${formatPercentage(data.winRate)} win rate, ${formatCurrency(data.profit)} profit`
    );
  });

  // Display most bet sport and team
  console.log('\nMost Bet:');
  console.log('---------');
  if (analytics.mostBetSport) {
    console.log(`Sport: ${analytics.mostBetSport.sport} (${analytics.mostBetSport.count} bets)`);
  }
  if (analytics.mostBetTeam) {
    console.log(`Team: ${analytics.mostBetTeam.teamName} (${analytics.mostBetTeam.count} bets)`);
  }

  // Display best and worst bets
  console.log('\nBest & Worst Bets:');
  console.log('-----------------');
  if (analytics.bestBet) {
    const bestProfit = (analytics.bestBet.potentialWinnings || 0) - analytics.bestBet.amount;
    console.log(
      `Best Bet: ${analytics.bestBet.teamName} - ${formatCurrency(analytics.bestBet.amount)} bet, ${formatCurrency(bestProfit)} profit`
    );
  }
  if (analytics.worstBet) {
    console.log(
      `Worst Bet: ${analytics.worstBet.teamName} - ${formatCurrency(analytics.worstBet.amount)} lost`
    );
  }

  // Add a new bet
  console.log('\nAdding a new bet...');
  const newBet = {
    gameId: 'game-461',
    teamId: 'team-794',
    betType: BetType.MONEYLINE,
    amount: 150,
    odds: -120,
    status: BetStatus.PENDING,
    sport: 'Hockey',
    league: 'NHL',
    teamName: 'Tampa Bay Lightning',
    opponentName: 'Florida Panthers',
    gameDate: Timestamp.now(),
  };

  const newBetId = await bettingAnalyticsService.addBet(newBet);
  console.log(`New bet added with ID: ${newBetId}`);

  // Update the bet
  console.log('\nUpdating the bet...');
  await bettingAnalyticsService.updateBet(newBetId, {
    status: BetStatus.SETTLED,
    result: BetResult.WIN,
    potentialWinnings: 125,
  });
  console.log('Bet updated successfully');

  // Get updated analytics
  console.log('\nGetting updated analytics...');
  const updatedAnalytics = await bettingAnalyticsService.getAnalyticsSummary();
  console.log(`New total bets: ${updatedAnalytics.totalBets}`);
  console.log(`New net profit: ${formatCurrency(updatedAnalytics.netProfit)}`);

  console.log('\nBetting analytics service test completed successfully!');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
