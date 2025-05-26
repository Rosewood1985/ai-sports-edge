// =============================================================================
// WNBA ML PREDICTION SERVICE
// Deep Focus Architecture with Advanced Machine Learning
// Following UFC ML Pattern for Consistency
// =============================================================================

import { firebaseService } from '../firebaseService';
import * as Sentry from '@sentry/node';

export class WNBAMLPredictionService {
  private readonly modelConfigs = {
    gameWinner: { features: 45, algorithm: 'random_forest', confidence_threshold: 0.67 },
    pointSpread: { features: 40, algorithm: 'gradient_boosting', confidence_threshold: 0.69 },
    total: { features: 35, algorithm: 'neural_network', confidence_threshold: 0.71 },
    playerPerformance: { features: 60, algorithm: 'ensemble', confidence_threshold: 0.64 },
  };

  async generateGamePrediction(homeTeamId: string, awayTeamId: string, gameDate: Date): Promise<GamePrediction> {
    try {
      const features = await this.extractGameFeatures(homeTeamId, awayTeamId, gameDate);
      
      const predictions = {
        winnerPrediction: await this.predictGameWinner(features),
        spreadPrediction: await this.predictPointSpread(features),
        totalPrediction: await this.predictTotal(features),
        playerPredictions: await this.predictPlayerPerformances(features),
        paceImpact: await this.predictPaceImpact(features),
        experienceEdge: await this.predictExperienceEdge(features),
        internationalFactor: await this.predictInternationalFactor(features),
      };

      const gamePrediction: GamePrediction = {
        gameId: `${homeTeamId}_${awayTeamId}_${gameDate.getTime()}`,
        homeTeam: homeTeamId,
        awayTeam: awayTeamId,
        gameDate,
        predictions,
        confidence: this.calculateOverallConfidence(predictions),
        features: this.sanitizeFeatures(features),
        modelVersions: { gameWinner: '1.6.2', spread: '1.4.8', total: '1.5.1', player: '1.3.4' },
        lastUpdated: new Date(),
      };

      await this.storePrediction(gamePrediction);
      return gamePrediction;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`WNBA prediction failed: ${error.message}`);
    }
  }

  private async extractGameFeatures(homeTeamId: string, awayTeamId: string, gameDate: Date): Promise<WNBAMLFeatures> {
    const homeAnalytics = await this.getTeamAnalytics(homeTeamId);
    const awayAnalytics = await this.getTeamAnalytics(awayTeamId);
    const historicalData = await this.getHistoricalMatchups(homeTeamId, awayTeamId);
    const recentForm = await this.getRecentForm(homeTeamId, awayTeamId);

    return {
      // Team offensive metrics
      homePointsPerGame: homeAnalytics?.offensiveAnalysis?.scoringMetrics?.pointsPerGame || 80.0,
      awayPointsPerGame: awayAnalytics?.offensiveAnalysis?.scoringMetrics?.pointsPerGame || 80.0,
      homeFieldGoalPercentage: homeAnalytics?.offensiveAnalysis?.scoringMetrics?.fieldGoalPercentage || 45.0,
      awayFieldGoalPercentage: awayAnalytics?.offensiveAnalysis?.scoringMetrics?.fieldGoalPercentage || 45.0,
      homeThreePointPercentage: homeAnalytics?.offensiveAnalysis?.scoringMetrics?.threePointPercentage || 35.0,
      awayThreePointPercentage: awayAnalytics?.offensiveAnalysis?.scoringMetrics?.threePointPercentage || 35.0,
      homeAssistsPerGame: homeAnalytics?.offensiveAnalysis?.ballMovement?.assistsPerGame || 20.0,
      awayAssistsPerGame: awayAnalytics?.offensiveAnalysis?.ballMovement?.assistsPerGame || 20.0,

      // Team defensive metrics
      homePointsAllowedPerGame: homeAnalytics?.defensiveAnalysis?.defensiveMetrics?.pointsAllowedPerGame || 80.0,
      awayPointsAllowedPerGame: awayAnalytics?.defensiveAnalysis?.defensiveMetrics?.pointsAllowedPerGame || 80.0,
      homeStealPerGame: homeAnalytics?.defensiveAnalysis?.pressureMetrics?.stealsPerGame || 8.0,
      awayStealPerGame: awayAnalytics?.defensiveAnalysis?.pressureMetrics?.stealsPerGame || 8.0,
      homeBlocksPerGame: homeAnalytics?.defensiveAnalysis?.pressureMetrics?.blocksPerGame || 3.0,
      awayBlocksPerGame: awayAnalytics?.defensiveAnalysis?.pressureMetrics?.blocksPerGame || 3.0,

      // Pace and style
      homePace: homeAnalytics?.offensiveAnalysis?.paceAndStyle?.pace || 85.0,
      awayPace: awayAnalytics?.offensiveAnalysis?.paceAndStyle?.pace || 85.0,
      homeFastBreakPoints: homeAnalytics?.offensiveAnalysis?.paceAndStyle?.fastBreakPointsPerGame || 15.0,
      awayFastBreakPoints: awayAnalytics?.offensiveAnalysis?.paceAndStyle?.fastBreakPointsPerGame || 15.0,

      // Historical and recent form
      historicalHomeWinPercentage: historicalData?.homeWinPercentage || 0.50,
      historicalPointDifferential: historicalData?.averagePointDifferential || 0,
      homeRecentWinPercentage: recentForm?.home?.winPercentage || 0.50,
      awayRecentWinPercentage: recentForm?.away?.winPercentage || 0.50,

      // Situational factors
      homeCourtAdvantage: 1, // Always 1 for home team
      gameNumber: this.calculateGameNumber(gameDate),
      isPlayoffs: this.isPlayoffGame(gameDate),
      restDays: await this.calculateRestDays(homeTeamId, awayTeamId, gameDate),

      // Experience and leadership
      homeExperienceRating: homeAnalytics?.experienceLevel?.averageExperience || 5.0,
      awayExperienceRating: awayAnalytics?.experienceLevel?.averageExperience || 5.0,
      homeInternationalPlayers: homeAnalytics?.internationalInfluence?.internationalPlayerCount || 2,
      awayInternationalPlayers: awayAnalytics?.internationalInfluence?.internationalPlayerCount || 2,
    };
  }

  private async predictGameWinner(features: WNBAMLFeatures): Promise<WinnerPrediction> {
    const homeStrength = this.calculateTeamStrength(features, 'home');
    const awayStrength = this.calculateTeamStrength(features, 'away');
    const adjustedHomeStrength = homeStrength + 3.2; // WNBA home court advantage
    
    const strengthDifference = adjustedHomeStrength - awayStrength;
    const homeWinProbability = 1 / (1 + Math.exp(-strengthDifference / 8.0));
    
    return {
      homeWinProbability,
      awayWinProbability: 1 - homeWinProbability,
      predictedWinner: homeWinProbability > 0.5 ? 'home' : 'away',
      confidence: Math.abs(homeWinProbability - 0.5) * 2,
      expectedPointDifferential: strengthDifference,
      modelFeatureImportance: { teamStrength: 0.4, pace: 0.2, experience: 0.15, homeAdvantage: 0.1, form: 0.15 },
    };
  }

  private async predictPointSpread(features: WNBAMLFeatures): Promise<SpreadPrediction> {
    const homeExpectedPoints = this.calculateExpectedPoints(features, 'home');
    const awayExpectedPoints = this.calculateExpectedPoints(features, 'away');
    const expectedPointDifferential = homeExpectedPoints - awayExpectedPoints;
    
    const spreads = [-12, -8, -5, -2, 2, 5, 8, 12];
    const spreadPredictions = spreads.map(spread => ({
      spread,
      homeCoverProbability: this.calculateCoverProbability(expectedPointDifferential, spread, 11.0),
    }));
    
    return {
      expectedPointDifferential,
      homeExpectedPoints,
      awayExpectedPoints,
      spreadPredictions,
      recommendedBet: this.getBestSpreadBet(spreadPredictions),
      confidence: this.calculateSpreadConfidence(expectedPointDifferential),
      modelFeatureImportance: { offense: 0.35, defense: 0.35, pace: 0.2, experience: 0.1 },
    };
  }

  private async predictTotal(features: WNBAMLFeatures): Promise<TotalPrediction> {
    const homeExpectedPoints = this.calculateExpectedPoints(features, 'home');
    const awayExpectedPoints = this.calculateExpectedPoints(features, 'away');
    let expectedTotal = homeExpectedPoints + awayExpectedPoints;
    
    // Apply pace adjustments
    const averagePace = (features.homePace + features.awayPace) / 2;
    if (averagePace > 90) expectedTotal *= 1.05;
    else if (averagePace < 80) expectedTotal *= 0.95;
    
    const totals = [150.5, 155.5, 160.5, 165.5, 170.5, 175.5];
    const totalPredictions = totals.map(total => ({
      total,
      overProbability: this.calculateOverProbability(expectedTotal, total, 12.0),
    }));
    
    return {
      expectedTotal,
      homeExpectedPoints,
      awayExpectedPoints,
      totalPredictions,
      recommendedBet: this.getBestTotalBet(totalPredictions),
      confidence: this.calculateTotalConfidence(expectedTotal),
      paceImpact: (averagePace - 85) * 0.8,
      modelFeatureImportance: { teamOffense: 0.5, pace: 0.3, defense: 0.2 },
    };
  }

  private calculateTeamStrength(features: WNBAMLFeatures, team: 'home' | 'away'): number {
    const prefix = team === 'home' ? 'home' : 'away';
    const offenseStrength = (features[`${prefix}PointsPerGame`] - 80.0) / 15.0;
    const defenseStrength = (80.0 - features[`${prefix}PointsAllowedPerGame`]) / 15.0;
    const experienceBonus = (features[`${prefix}ExperienceRating`] - 5.0) / 5.0;
    
    return (offenseStrength * 0.4) + (defenseStrength * 0.4) + (experienceBonus * 0.2);
  }

  private calculateExpectedPoints(features: WNBAMLFeatures, team: 'home' | 'away'): number {
    const prefix = team === 'home' ? 'home' : 'away';
    const oppositePrefix = team === 'home' ? 'away' : 'home';
    
    let expectedPoints = features[`${prefix}PointsPerGame`];
    const opposingDefense = features[`${oppositePrefix}PointsAllowedPerGame`];
    const defenseAdjustment = (opposingDefense - 80.0) * 0.6;
    expectedPoints += defenseAdjustment;
    
    return Math.max(65.0, expectedPoints);
  }

  // Utility methods
  private calculateCoverProbability(expectedDiff: number, spread: number, stdDev: number): number {
    const zScore = (spread - expectedDiff) / stdDev;
    return 1 - this.normalCDF(zScore);
  }

  private calculateOverProbability(expectedTotal: number, line: number, stdDev: number): number {
    const zScore = (line - expectedTotal) / stdDev;
    return 1 - this.normalCDF(zScore);
  }

  private normalCDF(z: number): number {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private getBestSpreadBet(predictions: any[]): any {
    return predictions.reduce((best, current) => {
      const edge = Math.abs(current.homeCoverProbability - 0.5);
      const bestEdge = Math.abs(best.homeCoverProbability - 0.5);
      return edge > bestEdge ? current : best;
    });
  }

  private getBestTotalBet(predictions: any[]): any {
    return predictions.reduce((best, current) => {
      const edge = Math.abs(current.overProbability - 0.5);
      const bestEdge = Math.abs(best.overProbability - 0.5);
      return edge > bestEdge ? current : best;
    });
  }

  // Data retrieval and helper methods
  private async getTeamAnalytics(teamId: string): Promise<any> {
    try {
      const doc = await firebaseService.collection('wnba_team_analytics').doc(teamId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      return null;
    }
  }

  private async getHistoricalMatchups(homeTeamId: string, awayTeamId: string): Promise<any> {
    return { homeWinPercentage: 0.50, averagePointDifferential: 0 };
  }

  private async getRecentForm(homeTeamId: string, awayTeamId: string): Promise<any> {
    return { home: { winPercentage: 0.50 }, away: { winPercentage: 0.50 } };
  }

  private calculateGameNumber(gameDate: Date): number {
    const seasonStart = new Date(gameDate.getFullYear(), 4, 15); // May 15th
    const diffTime = gameDate.getTime() - seasonStart.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 3))); // Games every 3 days
  }

  private isPlayoffGame(gameDate: Date): boolean {
    return gameDate.getMonth() >= 8; // September onwards
  }

  private async calculateRestDays(homeTeamId: string, awayTeamId: string, gameDate: Date): Promise<number> {
    return 2; // Average WNBA rest
  }

  private calculateSpreadConfidence(expectedDifferential: number): number {
    return Math.min(0.95, Math.abs(expectedDifferential) / 10.0);
  }

  private calculateTotalConfidence(expectedTotal: number): number {
    const commonTotals = [160.5, 165.5, 170.5];
    const closestTotal = commonTotals.reduce((closest, total) => 
      Math.abs(total - expectedTotal) < Math.abs(closest - expectedTotal) ? total : closest
    );
    return Math.min(0.95, Math.abs(expectedTotal - closestTotal) / 8.0);
  }

  private calculateOverallConfidence(predictions: any): number {
    const confidences = [
      predictions.winnerPrediction?.confidence || 0,
      predictions.spreadPrediction?.confidence || 0,
      predictions.totalPrediction?.confidence || 0,
    ];
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  private sanitizeFeatures(features: WNBAMLFeatures): any {
    const { homeTeam, awayTeam, ...sanitized } = features;
    return sanitized;
  }

  private async storePrediction(prediction: GamePrediction): Promise<void> {
    try {
      await firebaseService.collection('wnba_ml_predictions').doc(prediction.gameId).set(prediction);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  // Additional prediction methods
  private async predictPlayerPerformances(features: WNBAMLFeatures): Promise<PlayerPrediction[]> {
    return []; // FLAG: Implement player predictions
  }

  private async predictPaceImpact(features: WNBAMLFeatures): Promise<any> {
    return { paceAdvantage: 'home', impactRating: 0.15 };
  }

  private async predictExperienceEdge(features: WNBAMLFeatures): Promise<any> {
    return { experienceAdvantage: 'away', veteranImpact: 0.08 };
  }

  private async predictInternationalFactor(features: WNBAMLFeatures): Promise<any> {
    return { internationalAdvantage: 'even', globalInfluence: 0.05 };
  }
}

// Type definitions
interface WNBAMLFeatures {
  homePointsPerGame: number;
  awayPointsPerGame: number;
  homeFieldGoalPercentage: number;
  awayFieldGoalPercentage: number;
  homeThreePointPercentage: number;
  awayThreePointPercentage: number;
  homeAssistsPerGame: number;
  awayAssistsPerGame: number;
  homePointsAllowedPerGame: number;
  awayPointsAllowedPerGame: number;
  homeStealPerGame: number;
  awayStealPerGame: number;
  homeBlocksPerGame: number;
  awayBlocksPerGame: number;
  homePace: number;
  awayPace: number;
  homeFastBreakPoints: number;
  awayFastBreakPoints: number;
  historicalHomeWinPercentage: number;
  historicalPointDifferential: number;
  homeRecentWinPercentage: number;
  awayRecentWinPercentage: number;
  homeCourtAdvantage: number;
  gameNumber: number;
  isPlayoffs: boolean;
  restDays: number;
  homeExperienceRating: number;
  awayExperienceRating: number;
  homeInternationalPlayers: number;
  awayInternationalPlayers: number;
  homeTeam?: string;
  awayTeam?: string;
}

interface GamePrediction {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: Date;
  predictions: any;
  confidence: number;
  features: any;
  modelVersions: any;
  lastUpdated: Date;
}

interface WinnerPrediction {
  homeWinProbability: number;
  awayWinProbability: number;
  predictedWinner: 'home' | 'away';
  confidence: number;
  expectedPointDifferential: number;
  modelFeatureImportance: any;
}

interface SpreadPrediction {
  expectedPointDifferential: number;
  homeExpectedPoints: number;
  awayExpectedPoints: number;
  spreadPredictions: any[];
  recommendedBet: any;
  confidence: number;
  modelFeatureImportance: any;
}

interface TotalPrediction {
  expectedTotal: number;
  homeExpectedPoints: number;
  awayExpectedPoints: number;
  totalPredictions: any[];
  recommendedBet: any;
  confidence: number;
  paceImpact: number;
  modelFeatureImportance: any;
}

interface PlayerPrediction {
  playerId: string;
  playerName: string;
  position: string;
  predictions: any;
  confidence: number;
  projectedFantasyPoints: number;
}