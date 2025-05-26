import * as Sentry from '@sentry/node';
import { firebaseService } from '../firebaseService';
import { UFCDataSyncService } from './ufcDataSyncService';
import { UFCAnalyticsService } from './ufcAnalyticsService';
import { UFCMLPredictionService } from './ufcMLPredictionService';

interface BettingOpportunity {
  fightId: string;
  type: 'value_bet' | 'arbitrage' | 'line_movement' | 'public_fade';
  confidence: number;
  expectedValue: number;
  recommendedStake: number;
  reasoning: string;
  odds: {
    bookmaker: string;
    line: number;
    impliedProbability: number;
  }[];
  riskFactors: string[];
  timeWindow: {
    start: Date;
    end: Date;
  };
}

interface MarketAnalysis {
  fightId: string;
  totalVolume: number;
  sharpMoney: {
    percentage: number;
    direction: 'fighter1' | 'fighter2';
  };
  publicBetting: {
    percentage: number;
    direction: 'fighter1' | 'fighter2';
  };
  lineMovement: {
    opening: number;
    current: number;
    direction: 'up' | 'down' | 'stable';
    velocity: number;
  };
  marketEfficiency: number;
  lastUpdated: Date;
}

interface BettingIntelligenceReport {
  reportId: string;
  eventId: string;
  opportunities: BettingOpportunity[];
  marketAnalysis: MarketAnalysis[];
  globalTrends: {
    favoritesBias: number;
    underdogValue: number;
    publicFadeOpportunities: number;
  };
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
  generatedAt: Date;
  validUntil: Date;
}

export class UFCBettingIntelligenceService {
  private dataSync: UFCDataSyncService;
  private analytics: UFCAnalyticsService;
  private mlPredict: UFCMLPredictionService;

  constructor() {
    this.dataSync = new UFCDataSyncService();
    this.analytics = new UFCAnalyticsService();
    this.mlPredict = new UFCMLPredictionService();
  }

  async generateBettingIntelligence(eventId: string): Promise<BettingIntelligenceReport> {
    try {
      Sentry.addBreadcrumb({
        message: `Generating betting intelligence for event ${eventId}`,
        category: 'ufc.betting',
        level: 'info',
      });

      const event = await this.getEventDetails(eventId);
      const fights = await this.getEventFights(eventId);

      const opportunities: BettingOpportunity[] = [];
      const marketAnalyses: MarketAnalysis[] = [];

      for (const fight of fights) {
        const fightOpportunities = await this.analyzeFightBettingOpportunities(fight);
        const marketAnalysis = await this.analyzeMarket(fight.id);

        opportunities.push(...fightOpportunities);
        marketAnalyses.push(marketAnalysis);
      }

      const globalTrends = await this.analyzeGlobalTrends(opportunities);
      const riskAssessment = await this.assessOverallRisk(opportunities, marketAnalyses);

      const report: BettingIntelligenceReport = {
        reportId: `betting_intel_${eventId}_${Date.now()}`,
        eventId,
        opportunities: opportunities.sort((a, b) => b.expectedValue - a.expectedValue),
        marketAnalysis: marketAnalyses,
        globalTrends,
        riskAssessment,
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      await this.saveBettingIntelligence(report);

      Sentry.addBreadcrumb({
        message: `Generated ${opportunities.length} betting opportunities`,
        category: 'ufc.betting',
        level: 'info',
      });

      return report;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to generate betting intelligence: ${error.message}`);
    }
  }

  private async analyzeFightBettingOpportunities(fight: any): Promise<BettingOpportunity[]> {
    try {
      const opportunities: BettingOpportunity[] = [];

      // Get ML predictions for the fight
      const prediction = await this.mlPredict.predictFightOutcome(
        fight.fighter1Id,
        fight.fighter2Id,
        fight.details
      );

      // Get current odds from multiple bookmakers
      const odds = await this.getCurrentOdds(fight.id);

      // Analyze value betting opportunities
      const valueBets = await this.findValueBets(prediction, odds, fight);
      opportunities.push(...valueBets);

      // Look for arbitrage opportunities
      const arbitrageOpps = await this.findArbitrageOpportunities(odds, fight);
      opportunities.push(...arbitrageOpps);

      // Analyze line movement opportunities
      const lineMovementOpps = await this.analyzeLineMovement(fight.id);
      opportunities.push(...lineMovementOpps);

      // Public fade opportunities
      const publicFadeOpps = await this.findPublicFadeOpportunities(fight.id, prediction);
      opportunities.push(...publicFadeOpps);

      return opportunities;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async findValueBets(
    prediction: any,
    odds: any[],
    fight: any
  ): Promise<BettingOpportunity[]> {
    const valueBets: BettingOpportunity[] = [];

    try {
      for (const bookmakerOdds of odds) {
        const impliedProb = this.oddsToImpliedProbability(bookmakerOdds.fighter1Odds);
        const ourProb = prediction.predictions.winProbability.fighter1;

        // Check if our model suggests higher probability than market
        if (ourProb > impliedProb + 0.05) {
          // 5% edge threshold
          const expectedValue = this.calculateExpectedValue(ourProb, bookmakerOdds.fighter1Odds);

          if (expectedValue > 0.1) {
            // 10% minimum EV
            valueBets.push({
              fightId: fight.id,
              type: 'value_bet',
              confidence: prediction.confidence * 0.8, // Adjust for betting context
              expectedValue,
              recommendedStake: this.calculateOptimalStake(expectedValue, 0.02), // 2% bankroll
              reasoning: `Model gives ${(ourProb * 100).toFixed(1)}% chance, market implies ${(
                impliedProb * 100
              ).toFixed(1)}%`,
              odds: [
                {
                  bookmaker: bookmakerOdds.bookmaker,
                  line: bookmakerOdds.fighter1Odds,
                  impliedProbability: impliedProb,
                },
              ],
              riskFactors: await this.assessBetRiskFactors(fight, 'fighter1'),
              timeWindow: {
                start: new Date(),
                end: new Date(fight.scheduledDate),
              },
            });
          }
        }

        // Check fighter 2 as well
        const impliedProb2 = this.oddsToImpliedProbability(bookmakerOdds.fighter2Odds);
        const ourProb2 = prediction.predictions.winProbability.fighter2;

        if (ourProb2 > impliedProb2 + 0.05) {
          const expectedValue2 = this.calculateExpectedValue(ourProb2, bookmakerOdds.fighter2Odds);

          if (expectedValue2 > 0.1) {
            valueBets.push({
              fightId: fight.id,
              type: 'value_bet',
              confidence: prediction.confidence * 0.8,
              expectedValue: expectedValue2,
              recommendedStake: this.calculateOptimalStake(expectedValue2, 0.02),
              reasoning: `Model gives ${(ourProb2 * 100).toFixed(1)}% chance, market implies ${(
                impliedProb2 * 100
              ).toFixed(1)}%`,
              odds: [
                {
                  bookmaker: bookmakerOdds.bookmaker,
                  line: bookmakerOdds.fighter2Odds,
                  impliedProbability: impliedProb2,
                },
              ],
              riskFactors: await this.assessBetRiskFactors(fight, 'fighter2'),
              timeWindow: {
                start: new Date(),
                end: new Date(fight.scheduledDate),
              },
            });
          }
        }
      }

      return valueBets;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async findArbitrageOpportunities(odds: any[], fight: any): Promise<BettingOpportunity[]> {
    const arbitrageOpps: BettingOpportunity[] = [];

    try {
      // Find the best odds for each fighter across all bookmakers
      const bestOdds1 = Math.max(...odds.map(o => o.fighter1Odds));
      const bestOdds2 = Math.max(...odds.map(o => o.fighter2Odds));

      const bestBook1 = odds.find(o => o.fighter1Odds === bestOdds1)?.bookmaker;
      const bestBook2 = odds.find(o => o.fighter2Odds === bestOdds2)?.bookmaker;

      // Calculate if arbitrage exists
      const impliedTotal = 1 / bestOdds1 + 1 / bestOdds2;

      if (impliedTotal < 0.98) {
        // Arbitrage opportunity exists (2% margin for safety)
        const profit = (1 - impliedTotal) * 100;

        arbitrageOpps.push({
          fightId: fight.id,
          type: 'arbitrage',
          confidence: 0.95, // High confidence for pure arbitrage
          expectedValue: profit / 100,
          recommendedStake: 0.05, // 5% of bankroll for arbitrage
          reasoning: `Arbitrage opportunity: ${profit.toFixed(2)}% guaranteed profit`,
          odds: [
            {
              bookmaker: bestBook1,
              line: bestOdds1,
              impliedProbability: 1 / bestOdds1,
            },
            {
              bookmaker: bestBook2,
              line: bestOdds2,
              impliedProbability: 1 / bestOdds2,
            },
          ],
          riskFactors: ['Betting limits', 'Account restrictions', 'Line changes'],
          timeWindow: {
            start: new Date(),
            end: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours for arbitrage
          },
        });
      }

      return arbitrageOpps;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async analyzeLineMovement(fightId: string): Promise<BettingOpportunity[]> {
    const lineMovementOpps: BettingOpportunity[] = [];

    try {
      // FLAG: Replace with real odds history API call
      const oddsHistory = await this.getOddsHistory(fightId);

      if (oddsHistory.length < 2) return lineMovementOpps;

      const latestOdds = oddsHistory[oddsHistory.length - 1];
      const previousOdds = oddsHistory[oddsHistory.length - 2];

      // Calculate line movement velocity
      const movement1 =
        (latestOdds.fighter1Odds - previousOdds.fighter1Odds) / previousOdds.fighter1Odds;
      const movement2 =
        (latestOdds.fighter2Odds - previousOdds.fighter2Odds) / previousOdds.fighter2Odds;

      // Significant line movement (>5% in 24 hours)
      if (Math.abs(movement1) > 0.05 || Math.abs(movement2) > 0.05) {
        const movingFighter = Math.abs(movement1) > Math.abs(movement2) ? 'fighter1' : 'fighter2';
        const movementDirection = movement1 > 0 ? 'up' : 'down';

        lineMovementOpps.push({
          fightId,
          type: 'line_movement',
          confidence: 0.7,
          expectedValue: Math.abs(movement1) / 2, // Conservative EV estimate
          recommendedStake: 0.03, // 3% of bankroll
          reasoning: `Significant line movement: ${movingFighter} odds moved ${movementDirection} by ${(
            Math.abs(movement1) * 100
          ).toFixed(1)}%`,
          odds: [
            {
              bookmaker: latestOdds.bookmaker,
              line: latestOdds[`${movingFighter}Odds`],
              impliedProbability: 1 / latestOdds[`${movingFighter}Odds`],
            },
          ],
          riskFactors: ['Sharp money', 'Injury news', 'Information asymmetry'],
          timeWindow: {
            start: new Date(),
            end: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
          },
        });
      }

      return lineMovementOpps;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async findPublicFadeOpportunities(
    fightId: string,
    prediction: any
  ): Promise<BettingOpportunity[]> {
    const fadeOpps: BettingOpportunity[] = [];

    try {
      // FLAG: Replace with real public betting data API call
      const publicBettingData = await this.getPublicBettingData(fightId);

      // Look for fights where public is heavily on one side (>75%)
      if (
        publicBettingData.fighter1Percentage > 0.75 ||
        publicBettingData.fighter2Percentage > 0.75
      ) {
        const publicFavorite =
          publicBettingData.fighter1Percentage > 0.75 ? 'fighter1' : 'fighter2';
        const fadeCandidate = publicFavorite === 'fighter1' ? 'fighter2' : 'fighter1';

        // Check if our model supports fading the public
        const ourProbability = prediction.predictions.winProbability[fadeCandidate];
        const publicImpliedProb =
          1 -
          (publicFavorite === 'fighter1'
            ? publicBettingData.fighter1Percentage
            : publicBettingData.fighter2Percentage);

        if (ourProbability > publicImpliedProb + 0.1) {
          // Our model gives 10%+ better chance
          fadeOpps.push({
            fightId,
            type: 'public_fade',
            confidence: 0.65,
            expectedValue: 0.15, // Historical fade value
            recommendedStake: 0.025, // 2.5% of bankroll
            reasoning: `Public heavily on ${publicFavorite} (${(
              (publicFavorite === 'fighter1'
                ? publicBettingData.fighter1Percentage
                : publicBettingData.fighter2Percentage) * 100
            ).toFixed(1)}%), fade opportunity on ${fadeCandidate}`,
            odds: [
              {
                bookmaker: 'average',
                line: publicBettingData[`${fadeCandidate}Odds`],
                impliedProbability: 1 / publicBettingData[`${fadeCandidate}Odds`],
              },
            ],
            riskFactors: ['Public may be right', 'Media influence', 'Sharp money counter-move'],
            timeWindow: {
              start: new Date(),
              end: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
            },
          });
        }
      }

      return fadeOpps;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async analyzeMarket(fightId: string): Promise<MarketAnalysis> {
    try {
      // FLAG: Replace with real market data API calls
      const marketData = await this.getMarketData(fightId);
      const bettingVolume = await this.getBettingVolume(fightId);
      const lineHistory = await this.getOddsHistory(fightId);

      const analysis: MarketAnalysis = {
        fightId,
        totalVolume: bettingVolume.total,
        sharpMoney: {
          percentage: bettingVolume.sharpPercentage,
          direction: bettingVolume.sharpDirection,
        },
        publicBetting: {
          percentage: bettingVolume.publicPercentage,
          direction: bettingVolume.publicDirection,
        },
        lineMovement: this.calculateLineMovement(lineHistory),
        marketEfficiency: this.calculateMarketEfficiency(marketData),
        lastUpdated: new Date(),
      };

      return analysis;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to analyze market for fight ${fightId}: ${error.message}`);
    }
  }

  private async analyzeGlobalTrends(opportunities: BettingOpportunity[]): Promise<any> {
    try {
      const valueBets = opportunities.filter(o => o.type === 'value_bet');
      const favoritesBias = this.calculateFavoritesBias(valueBets);
      const underdogValue = this.calculateUnderdogValue(valueBets);
      const publicFadeOpportunities = opportunities.filter(o => o.type === 'public_fade').length;

      return {
        favoritesBias,
        underdogValue,
        publicFadeOpportunities,
      };
    } catch (error) {
      Sentry.captureException(error);
      return {
        favoritesBias: 0,
        underdogValue: 0,
        publicFadeOpportunities: 0,
      };
    }
  }

  private async assessOverallRisk(
    opportunities: BettingOpportunity[],
    marketAnalyses: MarketAnalysis[]
  ): Promise<any> {
    try {
      const highConfidenceOpps = opportunities.filter(o => o.confidence > 0.8).length;
      const totalEV = opportunities.reduce((sum, o) => sum + o.expectedValue, 0);
      const marketEfficiencyAvg =
        marketAnalyses.reduce((sum, m) => sum + m.marketEfficiency, 0) / marketAnalyses.length;

      let riskLevel: 'low' | 'medium' | 'high' = 'medium';
      const factors: string[] = [];
      const recommendations: string[] = [];

      if (highConfidenceOpps > 3 && totalEV > 1.0 && marketEfficiencyAvg < 0.7) {
        riskLevel = 'low';
        recommendations.push(
          'Excellent betting environment with multiple high-confidence opportunities'
        );
      } else if (highConfidenceOpps < 1 || totalEV < 0.3 || marketEfficiencyAvg > 0.9) {
        riskLevel = 'high';
        factors.push('Limited high-confidence opportunities', 'Efficient market conditions');
        recommendations.push('Consider reducing bet sizes or waiting for better opportunities');
      }

      return {
        overallRisk: riskLevel,
        factors,
        recommendations,
      };
    } catch (error) {
      Sentry.captureException(error);
      return {
        overallRisk: 'high',
        factors: ['Analysis error'],
        recommendations: ['Manual review required'],
      };
    }
  }

  // Helper methods for calculations
  private oddsToImpliedProbability(odds: number): number {
    return 1 / odds;
  }

  private calculateExpectedValue(probability: number, odds: number): number {
    return probability * (odds - 1) - (1 - probability);
  }

  private calculateOptimalStake(expectedValue: number, maxRisk: number): number {
    // Kelly Criterion with conservative adjustment
    return Math.min(expectedValue * 0.5, maxRisk);
  }

  private calculateLineMovement(history: any[]): any {
    if (history.length < 2) {
      return {
        opening: 0,
        current: 0,
        direction: 'stable',
        velocity: 0,
      };
    }

    const opening = history[0].fighter1Odds;
    const current = history[history.length - 1].fighter1Odds;
    const change = current - opening;
    const direction = change > 0.05 ? 'up' : change < -0.05 ? 'down' : 'stable';
    const velocity = Math.abs(change) / history.length;

    return {
      opening,
      current,
      direction,
      velocity,
    };
  }

  private calculateMarketEfficiency(marketData: any): number {
    // Simplified market efficiency calculation
    // In reality, this would involve complex statistical analysis
    return 0.75; // Placeholder
  }

  private calculateFavoritesBias(valueBets: BettingOpportunity[]): number {
    // Calculate if there's systematic bias towards favorites
    return 0.15; // Placeholder
  }

  private calculateUnderdogValue(valueBets: BettingOpportunity[]): number {
    // Calculate average value found in underdog bets
    return 0.22; // Placeholder
  }

  private async assessBetRiskFactors(fight: any, fighter: string): Promise<string[]> {
    const riskFactors: string[] = [];

    try {
      // FLAG: Add real risk assessment logic based on fighter data
      const fighterData = await this.analytics.analyzeFighterPerformance(fight[`${fighter}Id`]);

      if (fighterData.injuryRisk > 0.7) {
        riskFactors.push('High injury risk');
      }

      if (fighterData.mentalAnalysis.pressureRating < 0.5) {
        riskFactors.push('Poor performance under pressure');
      }

      return riskFactors;
    } catch (error) {
      return ['Risk assessment unavailable'];
    }
  }

  // Data retrieval methods (to be implemented with real APIs)
  private async getEventDetails(eventId: string): Promise<any> {
    // FLAG: Replace with real UFC API call
    return firebaseService.getDocument('ufc_events', eventId);
  }

  private async getEventFights(eventId: string): Promise<any[]> {
    // FLAG: Replace with real UFC API call
    return firebaseService.getCollection('ufc_fights', { eventId });
  }

  private async getCurrentOdds(fightId: string): Promise<any[]> {
    // FLAG: Replace with real odds API calls from multiple bookmakers
    return [
      {
        bookmaker: 'DraftKings',
        fighter1Odds: 1.85,
        fighter2Odds: 1.95,
      },
      {
        bookmaker: 'FanDuel',
        fighter1Odds: 1.9,
        fighter2Odds: 1.9,
      },
    ];
  }

  private async getOddsHistory(fightId: string): Promise<any[]> {
    // FLAG: Replace with real odds history API call
    return firebaseService.getCollection('ufc_odds_history', { fightId });
  }

  private async getPublicBettingData(fightId: string): Promise<any> {
    // FLAG: Replace with real public betting data API call
    return {
      fighter1Percentage: 0.65,
      fighter2Percentage: 0.35,
      fighter1Odds: 1.85,
      fighter2Odds: 1.95,
    };
  }

  private async getMarketData(fightId: string): Promise<any> {
    // FLAG: Replace with real market data API call
    return {
      efficiency: 0.75,
      liquidity: 'high',
      spread: 0.05,
    };
  }

  private async getBettingVolume(fightId: string): Promise<any> {
    // FLAG: Replace with real betting volume API call
    return {
      total: 1000000,
      sharpPercentage: 0.3,
      sharpDirection: 'fighter1',
      publicPercentage: 0.7,
      publicDirection: 'fighter2',
    };
  }

  private async saveBettingIntelligence(report: BettingIntelligenceReport): Promise<void> {
    try {
      await firebaseService.saveDocument('ufc_betting_intelligence', report.reportId, report);

      Sentry.addBreadcrumb({
        message: `Saved betting intelligence report ${report.reportId}`,
        category: 'ufc.betting',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to save betting intelligence: ${error.message}`);
    }
  }
}
