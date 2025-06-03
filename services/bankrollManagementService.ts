import AsyncStorage from '@react-native-async-storage/async-storage';

import { BankrollData, BankrollRecommendation } from '../types/horseRacing';

// Storage keys
const BANKROLL_DATA_KEY = 'bankroll_data';

/**
 * Bankroll Management Service
 *
 * This service provides methods for managing a user's bankroll:
 * - Tracking betting history
 * - Analyzing betting patterns
 * - Generating recommendations
 * - Managing deposits and withdrawals
 */
class BankrollManagementService {
  /**
   * Get bankroll data for a user
   * @param userId User ID
   * @returns Bankroll data or null if not found
   */
  async getBankrollData(userId: string): Promise<BankrollData | null> {
    try {
      const key = `${BANKROLL_DATA_KEY}_${userId}`;
      const data = await AsyncStorage.getItem(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as BankrollData;
    } catch (error) {
      console.error('Error getting bankroll data:', error);
      return null;
    }
  }

  /**
   * Initialize bankroll data for a user
   * @param userId User ID
   * @param initialDeposit Initial deposit amount
   * @returns Success status
   */
  async initializeBankrollData(userId: string, initialDeposit: number): Promise<boolean> {
    try {
      const key = `${BANKROLL_DATA_KEY}_${userId}`;

      // Check if data already exists
      const existingData = await AsyncStorage.getItem(key);
      if (existingData) {
        return false; // Data already exists
      }

      // Create initial data
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const initialData: BankrollData = {
        userId,
        currentBalance: initialDeposit,
        totalDeposited: initialDeposit,
        totalWithdrawn: 0,
        riskProfile: 'moderate',
        bettingPatterns: {
          averageBetSize: 0,
          betSizeVariance: 0,
          betFrequency: 0,
          preferredBetTypes: [],
          preferredSports: [],
          preferredLeagues: [],
        },
        bettingHistory: [
          {
            date: todayStr,
            betsPlaced: 0,
            betsWon: 0,
            amountWagered: 0,
            amountWon: 0,
            netProfit: 0,
            roi: 0,
          },
        ],
        recommendations: this.generateInitialRecommendations(initialDeposit),
      };

      // Save data
      await AsyncStorage.setItem(key, JSON.stringify(initialData));

      return true;
    } catch (error) {
      console.error('Error initializing bankroll data:', error);
      return false;
    }
  }

  /**
   * Update bankroll data
   * @param userId User ID
   * @param data Updated bankroll data
   * @returns Success status
   */
  async updateBankrollData(userId: string, data: BankrollData): Promise<boolean> {
    try {
      const key = `${BANKROLL_DATA_KEY}_${userId}`;

      // Save data
      await AsyncStorage.setItem(key, JSON.stringify(data));

      return true;
    } catch (error) {
      console.error('Error updating bankroll data:', error);
      return false;
    }
  }

  /**
   * Record a deposit
   * @param userId User ID
   * @param amount Deposit amount
   * @returns Updated bankroll data or null if failed
   */
  async recordDeposit(userId: string, amount: number): Promise<BankrollData | null> {
    try {
      // Get current data
      const data = await this.getBankrollData(userId);
      if (!data) {
        return null;
      }

      // Update data
      data.currentBalance += amount;
      data.totalDeposited += amount;

      // Generate new recommendations based on deposit
      const newRecommendations = this.generateDepositRecommendations(data, amount);
      data.recommendations = [...data.recommendations, ...newRecommendations];

      // Save updated data
      await this.updateBankrollData(userId, data);

      return data;
    } catch (error) {
      console.error('Error recording deposit:', error);
      return null;
    }
  }

  /**
   * Record a withdrawal
   * @param userId User ID
   * @param amount Withdrawal amount
   * @returns Updated bankroll data or null if failed
   */
  async recordWithdrawal(userId: string, amount: number): Promise<BankrollData | null> {
    try {
      // Get current data
      const data = await this.getBankrollData(userId);
      if (!data) {
        return null;
      }

      // Check if withdrawal is possible
      if (data.currentBalance < amount) {
        return null; // Insufficient funds
      }

      // Update data
      data.currentBalance -= amount;
      data.totalWithdrawn += amount;

      // Generate new recommendations based on withdrawal
      const newRecommendations = this.generateWithdrawalRecommendations(data, amount);
      data.recommendations = [...data.recommendations, ...newRecommendations];

      // Save updated data
      await this.updateBankrollData(userId, data);

      return data;
    } catch (error) {
      console.error('Error recording withdrawal:', error);
      return null;
    }
  }

  /**
   * Record a bet
   * @param userId User ID
   * @param betAmount Bet amount
   * @param betType Bet type
   * @param sport Sport
   * @param league League
   * @param isWin Whether the bet was won
   * @param winAmount Win amount (0 if lost)
   * @returns Updated bankroll data or null if failed
   */
  async recordBet(
    userId: string,
    betAmount: number,
    betType: string,
    sport: string,
    league: string,
    isWin: boolean,
    winAmount: number
  ): Promise<BankrollData | null> {
    try {
      // Get current data
      const data = await this.getBankrollData(userId);
      if (!data) {
        return null;
      }

      // Check if bet is possible
      if (data.currentBalance < betAmount) {
        return null; // Insufficient funds
      }

      // Update balance
      data.currentBalance -= betAmount;
      if (isWin) {
        data.currentBalance += winAmount;
      }

      // Update betting history
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Check if there's an entry for today
      const todayEntry = data.bettingHistory.find(entry => entry.date === todayStr);

      if (todayEntry) {
        // Update today's entry
        todayEntry.betsPlaced += 1;
        todayEntry.betsWon += isWin ? 1 : 0;
        todayEntry.amountWagered += betAmount;
        todayEntry.amountWon += isWin ? winAmount : 0;
        todayEntry.netProfit += isWin ? winAmount - betAmount : -betAmount;
        todayEntry.roi =
          todayEntry.amountWagered > 0 ? todayEntry.netProfit / todayEntry.amountWagered : 0;
      } else {
        // Create new entry for today
        data.bettingHistory.push({
          date: todayStr,
          betsPlaced: 1,
          betsWon: isWin ? 1 : 0,
          amountWagered: betAmount,
          amountWon: isWin ? winAmount : 0,
          netProfit: isWin ? winAmount - betAmount : -betAmount,
          roi: isWin ? (winAmount - betAmount) / betAmount : -1,
        });
      }

      // Update betting patterns
      this.updateBettingPatterns(data, betAmount, betType, sport, league, isWin);

      // Generate new recommendations based on bet
      const newRecommendations = this.generateBetRecommendations(data, betAmount, isWin);
      data.recommendations = [...data.recommendations, ...newRecommendations];

      // Save updated data
      await this.updateBankrollData(userId, data);

      return data;
    } catch (error) {
      console.error('Error recording bet:', error);
      return null;
    }
  }

  /**
   * Mark a recommendation as implemented
   * @param userId User ID
   * @param recommendationId Recommendation ID
   * @returns Updated bankroll data or null if failed
   */
  async implementRecommendation(
    userId: string,
    recommendationId: string
  ): Promise<BankrollData | null> {
    try {
      // Get current data
      const data = await this.getBankrollData(userId);
      if (!data) {
        return null;
      }

      // Find recommendation
      const recommendation = data.recommendations.find(rec => rec.id === recommendationId);
      if (!recommendation) {
        return null; // Recommendation not found
      }

      // Mark as implemented
      recommendation.isImplemented = true;
      recommendation.implementedDate = new Date().toISOString();

      // Save updated data
      await this.updateBankrollData(userId, data);

      return data;
    } catch (error) {
      console.error('Error implementing recommendation:', error);
      return null;
    }
  }

  /**
   * Update betting patterns
   * @param data Bankroll data
   * @param betAmount Bet amount
   * @param betType Bet type
   * @param sport Sport
   * @param league League
   * @param isWin Whether the bet was won
   */
  private updateBettingPatterns(
    data: BankrollData,
    betAmount: number,
    betType: string,
    sport: string,
    league: string,
    isWin: boolean
  ): void {
    // Calculate total bets placed
    const totalBets = data.bettingHistory.reduce((sum, day) => sum + day.betsPlaced, 0);

    // Update average bet size
    const totalWagered = data.bettingHistory.reduce((sum, day) => sum + day.amountWagered, 0);
    data.bettingPatterns.averageBetSize = totalBets > 0 ? totalWagered / totalBets : 0;

    // Update bet size variance
    // (This is a simplified calculation - in a real app, we would use a more sophisticated algorithm)
    const betSizes = data.bettingHistory.flatMap(day =>
      Array(day.betsPlaced).fill(day.amountWagered / day.betsPlaced)
    );
    const avgBetSize = data.bettingPatterns.averageBetSize;
    const sumSquaredDiffs = betSizes.reduce((sum, size) => sum + Math.pow(size - avgBetSize, 2), 0);
    data.bettingPatterns.betSizeVariance =
      betSizes.length > 0 ? sumSquaredDiffs / betSizes.length : 0;

    // Update bet frequency (bets per day)
    const uniqueDays = new Set(data.bettingHistory.map(day => day.date)).size;
    data.bettingPatterns.betFrequency = uniqueDays > 0 ? totalBets / uniqueDays : 0;

    // Update preferred bet types
    this.updatePreferredList(data.bettingPatterns.preferredBetTypes, betType);

    // Update preferred sports
    this.updatePreferredList(data.bettingPatterns.preferredSports, sport);

    // Update preferred leagues
    this.updatePreferredList(data.bettingPatterns.preferredLeagues, league);

    // Update risk profile based on betting patterns
    this.updateRiskProfile(data);
  }

  /**
   * Update a preferred list
   * @param list Preferred list
   * @param item Item to add or update
   */
  private updatePreferredList(list: { name: string; count: number }[], item: string): void {
    const existingItem = list.find(i => i.name === item);

    if (existingItem) {
      existingItem.count += 1;
    } else {
      list.push({ name: item, count: 1 });
    }

    // Sort by count (descending)
    list.sort((a, b) => b.count - a.count);

    // Keep only top 5
    if (list.length > 5) {
      list.length = 5;
    }
  }

  /**
   * Update risk profile based on betting patterns
   * @param data Bankroll data
   */
  private updateRiskProfile(data: BankrollData): void {
    // Calculate risk score based on various factors
    let riskScore = 0;

    // Factor 1: Average bet size relative to bankroll
    const betToBankrollRatio = data.bettingPatterns.averageBetSize / data.currentBalance;
    if (betToBankrollRatio > 0.1) {
      riskScore += 3; // High risk
    } else if (betToBankrollRatio > 0.05) {
      riskScore += 2; // Moderate risk
    } else if (betToBankrollRatio > 0.02) {
      riskScore += 1; // Low risk
    }

    // Factor 2: Bet size variance
    const varianceRatio =
      data.bettingPatterns.betSizeVariance / Math.pow(data.bettingPatterns.averageBetSize, 2);
    if (varianceRatio > 0.5) {
      riskScore += 3; // High risk
    } else if (varianceRatio > 0.2) {
      riskScore += 2; // Moderate risk
    } else if (varianceRatio > 0.1) {
      riskScore += 1; // Low risk
    }

    // Factor 3: Bet frequency
    if (data.bettingPatterns.betFrequency > 5) {
      riskScore += 2; // High risk
    } else if (data.bettingPatterns.betFrequency > 2) {
      riskScore += 1; // Moderate risk
    }

    // Factor 4: Recent ROI
    const recentROI = data.bettingHistory.length > 0 ? data.bettingHistory[0].roi : 0;
    if (recentROI < -0.5) {
      riskScore += 2; // High risk (losing badly)
    } else if (recentROI < -0.2) {
      riskScore += 1; // Moderate risk (losing)
    }

    // Determine risk profile based on score
    if (riskScore >= 7) {
      data.riskProfile = 'aggressive';
    } else if (riskScore >= 4) {
      data.riskProfile = 'moderate';
    } else {
      data.riskProfile = 'conservative';
    }
  }

  /**
   * Generate initial recommendations
   * @param initialDeposit Initial deposit amount
   * @returns Array of recommendations
   */
  private generateInitialRecommendations(initialDeposit: number): BankrollRecommendation[] {
    const recommendations: BankrollRecommendation[] = [];
    const now = new Date().toISOString();

    // Recommendation 1: Set a betting unit
    const bettingUnit = Math.max(5, Math.round(initialDeposit * 0.02));
    recommendations.push({
      id: `rec-${Date.now()}-1`,
      title: 'Set Your Betting Unit',
      description: `Start with a betting unit of $${bettingUnit} (2% of your bankroll). This helps manage risk and extend your bankroll.`,
      type: 'bet_sizing',
      priority: 'high',
      potentialImpact: 'Reduces risk of ruin by 60% and extends bankroll longevity.',
      isImplemented: false,
      createdDate: now,
    });

    // Recommendation 2: Track all bets
    recommendations.push({
      id: `rec-${Date.now()}-2`,
      title: 'Track All Your Bets',
      description:
        'Record every bet you place, including the amount, odds, and outcome. This data will help identify your strengths and weaknesses.',
      type: 'tracking',
      priority: 'high',
      potentialImpact: 'Improves decision-making and helps identify profitable betting patterns.',
      isImplemented: false,
      createdDate: now,
    });

    // Recommendation 3: Set a stop-loss limit
    const stopLoss = Math.round(initialDeposit * 0.1);
    recommendations.push({
      id: `rec-${Date.now()}-3`,
      title: 'Set a Daily Stop-Loss',
      description: `Limit daily losses to $${stopLoss} (10% of your bankroll). If you reach this limit, stop betting for the day.`,
      type: 'risk_management',
      priority: 'medium',
      potentialImpact:
        'Prevents emotional betting and protects your bankroll during losing streaks.',
      isImplemented: false,
      createdDate: now,
    });

    return recommendations;
  }

  /**
   * Generate recommendations based on deposit
   * @param data Bankroll data
   * @param amount Deposit amount
   * @returns Array of recommendations
   */
  private generateDepositRecommendations(
    data: BankrollData,
    amount: number
  ): BankrollRecommendation[] {
    const recommendations: BankrollRecommendation[] = [];
    const now = new Date().toISOString();

    // Only generate if deposit is significant (>= 20% of previous balance)
    const previousBalance = data.currentBalance - amount;
    if (amount >= previousBalance * 0.2) {
      // Recommendation: Adjust betting unit
      const newBettingUnit = Math.round(data.currentBalance * 0.02);
      recommendations.push({
        id: `rec-${Date.now()}-deposit`,
        title: 'Adjust Your Betting Unit',
        description: `With your increased bankroll, consider adjusting your betting unit to $${newBettingUnit} (2% of your new bankroll).`,
        type: 'bet_sizing',
        priority: 'medium',
        potentialImpact: 'Maintains optimal risk management with your larger bankroll.',
        isImplemented: false,
        createdDate: now,
      });
    }

    return recommendations;
  }

  /**
   * Generate recommendations based on withdrawal
   * @param data Bankroll data
   * @param amount Withdrawal amount
   * @returns Array of recommendations
   */
  private generateWithdrawalRecommendations(
    data: BankrollData,
    amount: number
  ): BankrollRecommendation[] {
    const recommendations: BankrollRecommendation[] = [];
    const now = new Date().toISOString();

    // Only generate if withdrawal is significant (>= 20% of previous balance)
    const previousBalance = data.currentBalance + amount;
    if (amount >= previousBalance * 0.2) {
      // Recommendation: Adjust betting unit
      const newBettingUnit = Math.round(data.currentBalance * 0.02);
      recommendations.push({
        id: `rec-${Date.now()}-withdrawal`,
        title: 'Reduce Your Betting Unit',
        description: `With your reduced bankroll, consider adjusting your betting unit to $${newBettingUnit} (2% of your new bankroll).`,
        type: 'bet_sizing',
        priority: 'high',
        potentialImpact: 'Prevents overbetting and reduces risk of depleting your bankroll.',
        isImplemented: false,
        createdDate: now,
      });
    }

    return recommendations;
  }

  /**
   * Generate recommendations based on bet
   * @param data Bankroll data
   * @param betAmount Bet amount
   * @param isWin Whether the bet was won
   * @returns Array of recommendations
   */
  private generateBetRecommendations(
    data: BankrollData,
    betAmount: number,
    isWin: boolean
  ): BankrollRecommendation[] {
    const recommendations: BankrollRecommendation[] = [];
    const now = new Date().toISOString();

    // Check if bet size is too large
    const betToBankrollRatio = betAmount / data.currentBalance;
    if (betToBankrollRatio > 0.05) {
      recommendations.push({
        id: `rec-${Date.now()}-bet-size`,
        title: 'Reduce Your Bet Size',
        description: `Your recent bet of $${betAmount} was ${Math.round(betToBankrollRatio * 100)}% of your bankroll, which is risky. Consider limiting bets to 2-3% of your bankroll.`,
        type: 'bet_sizing',
        priority: 'high',
        potentialImpact: 'Reduces risk of significant bankroll depletion during losing streaks.',
        isImplemented: false,
        createdDate: now,
      });
    }

    // Check for losing streak
    const recentBets = data.bettingHistory.slice(0, 3);
    const totalBets = recentBets.reduce((sum, day) => sum + day.betsPlaced, 0);
    const totalWins = recentBets.reduce((sum, day) => sum + day.betsWon, 0);

    if (totalBets >= 5 && totalWins / totalBets < 0.2) {
      recommendations.push({
        id: `rec-${Date.now()}-losing-streak`,
        title: 'Take a Short Break',
        description:
          "You're experiencing a losing streak. Consider taking a short break or reducing your bet size until your results improve.",
        type: 'risk_management',
        priority: 'high',
        potentialImpact: 'Prevents emotional betting and helps preserve your bankroll.',
        isImplemented: false,
        createdDate: now,
      });
    }

    // Check for winning streak
    if (totalBets >= 5 && totalWins / totalBets > 0.7) {
      recommendations.push({
        id: `rec-${Date.now()}-winning-streak`,
        title: 'Maintain Discipline',
        description:
          "You're on a hot streak! Remember to maintain your betting discipline and avoid increasing your bet sizes based on recent success.",
        type: 'discipline',
        priority: 'medium',
        potentialImpact: 'Prevents overconfidence and maintains long-term profitability.',
        isImplemented: false,
        createdDate: now,
      });
    }

    return recommendations;
  }
}

// Export as singleton
export const bankrollManagementService = new BankrollManagementService();
