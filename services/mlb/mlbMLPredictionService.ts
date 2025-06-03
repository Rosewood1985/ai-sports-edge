// =============================================================================
// MLB ML PREDICTION SERVICE
// Deep Focus Architecture with Advanced Machine Learning
// Following UFC ML Pattern for Consistency
// =============================================================================

import * as Sentry from '@sentry/node';

import { firebaseService } from '../firebaseService';

export class MLBMLPredictionService {
  private readonly modelConfigs = {
    gameWinner: {
      features: 50,
      algorithm: 'random_forest',
      confidence_threshold: 0.65,
    },
    playerPerformance: {
      features: 75,
      algorithm: 'gradient_boosting',
      confidence_threshold: 0.7,
    },
    runLine: {
      features: 40,
      algorithm: 'neural_network',
      confidence_threshold: 0.68,
    },
    total: {
      features: 35,
      algorithm: 'support_vector_machine',
      confidence_threshold: 0.72,
    },
  };

  async generateGamePrediction(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date
  ): Promise<GamePrediction> {
    try {
      Sentry.addBreadcrumb({
        message: `Generating MLB game prediction: ${homeTeamId} vs ${awayTeamId}`,
        category: 'mlb.ml.prediction',
        level: 'info',
      });

      // Gather features for ML model
      const features = await this.extractGameFeatures(homeTeamId, awayTeamId, gameDate);

      // Generate predictions using different models
      const predictions = {
        winnerPrediction: await this.predictGameWinner(features),
        runLinePrediction: await this.predictRunLine(features),
        totalPrediction: await this.predictTotal(features),
        playerPredictions: await this.predictPlayerPerformances(features),
        pitcherMatchup: await this.predictPitcherMatchup(features),
        bullpenImpact: await this.predictBullpenImpact(features),
        weatherImpact: await this.predictWeatherImpact(features),
        situationalFactors: await this.predictSituationalFactors(features),
      };

      const gamePrediction: GamePrediction = {
        gameId: `${homeTeamId}_${awayTeamId}_${gameDate.getTime()}`,
        homeTeam: homeTeamId,
        awayTeam: awayTeamId,
        gameDate,
        predictions,
        confidence: this.calculateOverallConfidence(predictions),
        features: this.sanitizeFeatures(features),
        modelVersions: this.getModelVersions(),
        lastUpdated: new Date(),
      };

      // Store prediction for tracking and analysis
      await this.storePrediction(gamePrediction);

      return gamePrediction;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Game prediction failed: ${error.message}`);
    }
  }

  private async extractGameFeatures(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date
  ): Promise<MLFeatures> {
    try {
      // Get team analytics
      const homeTeamAnalytics = await this.getTeamAnalytics(homeTeamId);
      const awayTeamAnalytics = await this.getTeamAnalytics(awayTeamId);

      // Get starting pitchers
      const startingPitchers = await this.getStartingPitchers(homeTeamId, awayTeamId, gameDate);

      // Get historical matchups
      const historicalMatchups = await this.getHistoricalMatchups(homeTeamId, awayTeamId);

      // Get recent form
      const recentForm = await this.getRecentForm(homeTeamId, awayTeamId);

      // Get weather conditions
      const weatherConditions = await this.getWeatherConditions(homeTeamId, gameDate);

      // Get betting market data
      const marketData = await this.getBettingMarketData(homeTeamId, awayTeamId, gameDate);

      // Get injury reports
      const injuryReports = await this.getInjuryReports(homeTeamId, awayTeamId);

      return {
        // Team offensive features
        homeOffensiveRating: homeTeamAnalytics?.offensiveAnalysis?.runsPerGame || 4.5,
        awayOffensiveRating: awayTeamAnalytics?.offensiveAnalysis?.runsPerGame || 4.5,
        homeTeamBattingAverage: homeTeamAnalytics?.offensiveAnalysis?.teamBattingAverage || 0.25,
        awayTeamBattingAverage: awayTeamAnalytics?.offensiveAnalysis?.teamBattingAverage || 0.25,
        homeOnBasePercentage: homeTeamAnalytics?.offensiveAnalysis?.onBasePercentage || 0.32,
        awayOnBasePercentage: awayTeamAnalytics?.offensiveAnalysis?.onBasePercentage || 0.32,
        homeSluggingPercentage: homeTeamAnalytics?.offensiveAnalysis?.sluggingPercentage || 0.4,
        awaySluggingPercentage: awayTeamAnalytics?.offensiveAnalysis?.sluggingPercentage || 0.4,

        // Team defensive/pitching features
        homeTeamERA: homeTeamAnalytics?.pitchingStaffAnalysis?.starterERA || 4.5,
        awayTeamERA: awayTeamAnalytics?.pitchingStaffAnalysis?.starterERA || 4.5,
        homeBullpenERA: homeTeamAnalytics?.bullpenAnalysis?.bullpenERA || 4.0,
        awayBullpenERA: awayTeamAnalytics?.bullpenAnalysis?.bullpenERA || 4.0,
        homeFieldingPercentage: homeTeamAnalytics?.defensiveAnalysis?.fieldingPercentage || 0.985,
        awayFieldingPercentage: awayTeamAnalytics?.defensiveAnalysis?.fieldingPercentage || 0.985,

        // Starting pitcher features
        homeStarterERA: startingPitchers?.home?.era || 4.5,
        awayStarterERA: startingPitchers?.away?.era || 4.5,
        homeStarterWHIP: startingPitchers?.home?.whip || 1.3,
        awayStarterWHIP: startingPitchers?.away?.whip || 1.3,
        homeStarterStrikeoutRate: startingPitchers?.home?.strikeoutRate || 8.5,
        awayStarterStrikeoutRate: startingPitchers?.away?.strikeoutRate || 8.5,
        homeStarterInningsPitched: startingPitchers?.home?.averageInnings || 6.0,
        awayStarterInningsPitched: startingPitchers?.away?.averageInnings || 6.0,

        // Historical matchup features
        historicalHomeWinPercentage: historicalMatchups?.homeWinPercentage || 0.5,
        historicalRunsHomeAverage: historicalMatchups?.homeRunsAverage || 4.5,
        historicalRunsAwayAverage: historicalMatchups?.awayRunsAverage || 4.5,
        historicalTotalAverage: historicalMatchups?.totalRunsAverage || 9.0,
        gamesPlayedAgainstEachOther: historicalMatchups?.gamesPlayed || 0,

        // Recent form features (last 10 games)
        homeRecentWinPercentage: recentForm?.home?.winPercentage || 0.5,
        awayRecentWinPercentage: recentForm?.away?.winPercentage || 0.5,
        homeRecentRunsPerGame: recentForm?.home?.runsPerGame || 4.5,
        awayRecentRunsPerGame: recentForm?.away?.runsPerGame || 4.5,
        homeRecentRunsAllowed: recentForm?.home?.runsAllowed || 4.5,
        awayRecentRunsAllowed: recentForm?.away?.runsAllowed || 4.5,

        // Environmental features
        temperature: weatherConditions?.temperature || 75,
        humidity: weatherConditions?.humidity || 50,
        windSpeed: weatherConditions?.windSpeed || 5,
        windDirection: this.encodeWindDirection(weatherConditions?.windDirection),
        precipitation: weatherConditions?.precipitation || 0,
        isDome: weatherConditions?.isDome || false,

        // Situational features
        homeFieldAdvantage: 1, // Always 1 for home team
        restDays: await this.calculateRestDays(homeTeamId, awayTeamId, gameDate),
        seasonMonth: gameDate.getMonth() + 1,
        dayOfWeek: gameDate.getDay(),
        isWeekend: gameDate.getDay() === 0 || gameDate.getDay() === 6,
        gameTime: this.encodeGameTime(gameDate),

        // Market features
        openingSpread: marketData?.openingSpread || 0,
        openingTotal: marketData?.openingTotal || 9.0,
        currentSpread: marketData?.currentSpread || 0,
        currentTotal: marketData?.currentTotal || 9.0,
        homeMoneyline: marketData?.homeMoneyline || -110,
        awayMoneyline: marketData?.awayMoneyline || -110,

        // Injury impact features
        homeKeyInjuries: injuryReports?.home?.keyInjuries || 0,
        awayKeyInjuries: injuryReports?.away?.keyInjuries || 0,
        homeInjuryImpactScore: injuryReports?.home?.impactScore || 0,
        awayInjuryImpactScore: injuryReports?.away?.impactScore || 0,

        // Advanced metrics
        homePythagoreanWinPercentage: this.calculatePythagoreanWinPct(homeTeamAnalytics),
        awayPythagoreanWinPercentage: this.calculatePythagoreanWinPct(awayTeamAnalytics),
        homeBasePathingRuns: homeTeamAnalytics?.advancedMetrics?.basePathingRuns || 0,
        awayBasePathingRuns: awayTeamAnalytics?.advancedMetrics?.basePathingRuns || 0,
        homeDefensiveRuns: homeTeamAnalytics?.advancedMetrics?.defensiveRuns || 0,
        awayDefensiveRuns: awayTeamAnalytics?.advancedMetrics?.defensiveRuns || 0,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Feature extraction failed: ${error.message}`);
    }
  }

  private async predictGameWinner(features: MLFeatures): Promise<WinnerPrediction> {
    try {
      // Simulate ML model prediction - in production, this would call actual ML model
      const homeTeamStrength = this.calculateTeamStrength(features, 'home');
      const awayTeamStrength = this.calculateTeamStrength(features, 'away');

      // Apply home field advantage
      const adjustedHomeStrength = homeTeamStrength * 1.03; // 3% home field boost

      // Calculate win probability using logistic function
      const strengthDifference = adjustedHomeStrength - awayTeamStrength;
      const homeWinProbability = 1 / (1 + Math.exp(-strengthDifference * 2));

      return {
        homeWinProbability,
        awayWinProbability: 1 - homeWinProbability,
        predictedWinner: homeWinProbability > 0.5 ? 'home' : 'away',
        confidence: Math.abs(homeWinProbability - 0.5) * 2,
        modelFeatureImportance: this.getWinnerFeatureImportance(),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultWinnerPrediction();
    }
  }

  private async predictRunLine(features: MLFeatures): Promise<RunLinePrediction> {
    try {
      // Calculate expected run differential
      const homeExpectedRuns = this.calculateExpectedRuns(features, 'home');
      const awayExpectedRuns = this.calculateExpectedRuns(features, 'away');
      const expectedDifferential = homeExpectedRuns - awayExpectedRuns;

      // Common run lines in MLB
      const runLines = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
      const runLinePredictions = runLines.map(line => ({
        line,
        homeCoverProbability: this.calculateCoverProbability(expectedDifferential, line),
      }));

      return {
        expectedRunDifferential: expectedDifferential,
        homeExpectedRuns,
        awayExpectedRuns,
        runLinePredictions,
        recommendedBet: this.getRunLineRecommendation(runLinePredictions),
        confidence: this.calculateRunLineConfidence(expectedDifferential),
        modelFeatureImportance: this.getRunLineFeatureImportance(),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultRunLinePrediction();
    }
  }

  private async predictTotal(features: MLFeatures): Promise<TotalPrediction> {
    try {
      // Calculate expected total runs
      const homeExpectedRuns = this.calculateExpectedRuns(features, 'home');
      const awayExpectedRuns = this.calculateExpectedRuns(features, 'away');
      const expectedTotal = homeExpectedRuns + awayExpectedRuns;

      // Apply environmental adjustments
      const weatherAdjustedTotal = this.applyWeatherAdjustments(expectedTotal, features);
      const ballparkAdjustedTotal = this.applyBallparkAdjustments(
        weatherAdjustedTotal,
        features.homeTeam
      );

      // Common totals in MLB
      const totals = [7.5, 8.0, 8.5, 9.0, 9.5, 10.0, 10.5, 11.0];
      const totalPredictions = totals.map(total => ({
        total,
        overProbability: this.calculateOverProbability(ballparkAdjustedTotal, total),
      }));

      return {
        expectedTotal: ballparkAdjustedTotal,
        homeExpectedRuns,
        awayExpectedRuns,
        totalPredictions,
        recommendedBet: this.getTotalRecommendation(totalPredictions),
        confidence: this.calculateTotalConfidence(ballparkAdjustedTotal),
        weatherImpact: weatherAdjustedTotal - expectedTotal,
        ballparkImpact: ballparkAdjustedTotal - weatherAdjustedTotal,
        modelFeatureImportance: this.getTotalFeatureImportance(),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultTotalPrediction();
    }
  }

  private async predictPlayerPerformances(features: MLFeatures): Promise<PlayerPrediction[]> {
    try {
      // Get key players for both teams
      const homeKeyPlayers = await this.getKeyPlayers(features.homeTeam);
      const awayKeyPlayers = await this.getKeyPlayers(features.awayTeam);

      const playerPredictions: PlayerPrediction[] = [];

      // Predict performance for key players
      for (const player of [...homeKeyPlayers, ...awayKeyPlayers]) {
        const playerFeatures = await this.extractPlayerFeatures(player.id, features);
        const prediction = await this.predictIndividualPlayerPerformance(player, playerFeatures);
        playerPredictions.push(prediction);
      }

      return playerPredictions;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async predictIndividualPlayerPerformance(
    player: any,
    features: any
  ): Promise<PlayerPrediction> {
    try {
      let prediction: PlayerPrediction;

      if (player.position === 'P') {
        // Pitcher prediction
        prediction = {
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          predictions: {
            inningsPitched: this.predictInningsPitched(features),
            earnedRuns: this.predictEarnedRuns(features),
            strikeouts: this.predictStrikeouts(features),
            walks: this.predictWalks(features),
            hits: this.predictHitsAllowed(features),
            pitchCount: this.predictPitchCount(features),
            winProbability: this.predictWinProbability(features),
            qualityStart: this.predictQualityStart(features),
          },
          confidence: this.calculatePlayerConfidence(features),
          projectedFantasyPoints: this.calculateFantasyPoints(prediction.predictions, 'pitcher'),
        };
      } else {
        // Batter prediction
        prediction = {
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          predictions: {
            atBats: this.predictAtBats(features),
            hits: this.predictHits(features),
            homeRuns: this.predictHomeRuns(features),
            rbis: this.predictRBIs(features),
            runs: this.predictRuns(features),
            walks: this.predictWalks(features),
            strikeouts: this.predictStrikeouts(features),
            stolenBases: this.predictStolenBases(features),
          },
          confidence: this.calculatePlayerConfidence(features),
          projectedFantasyPoints: this.calculateFantasyPoints(prediction.predictions, 'batter'),
        };
      }

      return prediction;
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultPlayerPrediction(player);
    }
  }

  // Utility methods
  private calculateTeamStrength(features: MLFeatures, team: 'home' | 'away'): number {
    const prefix = team === 'home' ? 'home' : 'away';

    // Weighted combination of team metrics
    const offenseWeight = 0.4;
    const pitchingWeight = 0.4;
    const defenseWeight = 0.2;

    const offenseStrength = (features[`${prefix}OffensiveRating`] - 4.5) / 2.0; // Normalize around league average
    const pitchingStrength = (4.5 - features[`${prefix}TeamERA`]) / 1.0; // Lower ERA = better
    const defenseStrength = (features[`${prefix}FieldingPercentage`] - 0.985) * 100; // Above average fielding

    return (
      offenseStrength * offenseWeight +
      pitchingStrength * pitchingWeight +
      defenseStrength * defenseWeight
    );
  }

  private calculateExpectedRuns(features: MLFeatures, team: 'home' | 'away'): number {
    const prefix = team === 'home' ? 'home' : 'away';
    const oppositePrefix = team === 'home' ? 'away' : 'home';

    // Base expected runs from team offensive rating
    let expectedRuns = features[`${prefix}OffensiveRating`];

    // Adjust for opposing pitcher
    const opposingERA = features[`${oppositePrefix}StarterERA`];
    const leagueAverageERA = 4.5;
    const pitcherAdjustment = (leagueAverageERA - opposingERA) * 0.2;
    expectedRuns += pitcherAdjustment;

    // Apply weather adjustments
    if (features.windSpeed > 10 && features.windDirection > 0.5) {
      // Tailwind
      expectedRuns *= 1.05;
    } else if (features.windSpeed > 10) {
      // Headwind
      expectedRuns *= 0.95;
    }

    // Apply temperature adjustments
    if (features.temperature > 80) {
      expectedRuns *= 1.02; // Ball travels further in hot weather
    }

    return Math.max(1.0, expectedRuns); // Minimum 1 run expected
  }

  private applyWeatherAdjustments(total: number, features: MLFeatures): number {
    let adjustedTotal = total;

    // Wind adjustments
    if (features.windSpeed > 15) {
      if (features.windDirection > 0.5) {
        // Tailwind
        adjustedTotal *= 1.08;
      } else {
        // Headwind
        adjustedTotal *= 0.92;
      }
    }

    // Temperature adjustments
    if (features.temperature > 85) {
      adjustedTotal *= 1.03;
    } else if (features.temperature < 50) {
      adjustedTotal *= 0.97;
    }

    // Humidity adjustments
    if (features.humidity > 80) {
      adjustedTotal *= 0.98; // Heavy air
    }

    // Precipitation adjustments
    if (features.precipitation > 0) {
      adjustedTotal *= 0.95; // Rain generally reduces scoring
    }

    return adjustedTotal;
  }

  private applyBallparkAdjustments(total: number, homeTeam: string): number {
    // Ballpark factors - these would come from a database in production
    const ballparkFactors: { [key: string]: number } = {
      COL: 1.15, // Coors Field - high altitude
      BOS: 1.08, // Fenway - Green Monster
      TEX: 1.06, // Globe Life - hot weather
      NYY: 1.04, // Yankee Stadium - short porch
      SD: 0.92, // Petco - marine layer
      OAK: 0.94, // Oakland Coliseum - foul territory
      SEA: 0.96, // T-Mobile Park - marine air
      SF: 0.93, // Oracle Park - marine layer and wind
    };

    const factor = ballparkFactors[homeTeam] || 1.0;
    return total * factor;
  }

  private calculateOverProbability(expectedTotal: number, line: number): number {
    // Use normal distribution to calculate over probability
    const standardDeviation = 1.5; // Historical standard deviation of total runs
    const zScore = (line - expectedTotal) / standardDeviation;

    // Approximate normal CDF
    return 1 - this.normalCDF(zScore);
  }

  private calculateCoverProbability(expectedDiff: number, line: number): number {
    // Calculate probability that home team covers the spread
    const standardDeviation = 2.0; // Historical standard deviation of run differential
    const zScore = (line - expectedDiff) / standardDeviation;

    return 1 - this.normalCDF(zScore);
  }

  private normalCDF(z: number): number {
    // Approximation of standard normal cumulative distribution function
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  // Data retrieval methods
  private async getTeamAnalytics(teamId: string): Promise<any> {
    try {
      const analyticsDoc = await firebaseService.collection('mlb_team_analytics').doc(teamId).get();
      return analyticsDoc.exists ? analyticsDoc.data() : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getStartingPitchers(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date
  ): Promise<any> {
    try {
      // FLAG: Implement starting pitcher retrieval from probable pitchers or rotation
      return {
        home: { era: 4.5, whip: 1.3, strikeoutRate: 8.5, averageInnings: 6.0 },
        away: { era: 4.5, whip: 1.3, strikeoutRate: 8.5, averageInnings: 6.0 },
      };
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getHistoricalMatchups(homeTeamId: string, awayTeamId: string): Promise<any> {
    try {
      // FLAG: Implement historical matchup data retrieval
      return {
        homeWinPercentage: 0.5,
        homeRunsAverage: 4.5,
        awayRunsAverage: 4.5,
        totalRunsAverage: 9.0,
        gamesPlayed: 19, // Teams play 19 times per season in same division
      };
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getRecentForm(homeTeamId: string, awayTeamId: string): Promise<any> {
    try {
      // FLAG: Implement recent form calculation (last 10 games)
      return {
        home: { winPercentage: 0.6, runsPerGame: 5.2, runsAllowed: 4.1 },
        away: { winPercentage: 0.4, runsPerGame: 4.8, runsAllowed: 5.3 },
      };
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getWeatherConditions(homeTeamId: string, gameDate: Date): Promise<any> {
    try {
      // FLAG: Implement weather data retrieval for game location and time
      return {
        temperature: 75,
        humidity: 50,
        windSpeed: 8,
        windDirection: 'out', // or encoded number
        precipitation: 0,
        isDome: false,
      };
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getBettingMarketData(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date
  ): Promise<any> {
    try {
      // FLAG: Implement betting market data retrieval
      return {
        openingSpread: -1.5,
        openingTotal: 9.0,
        currentSpread: -1.5,
        currentTotal: 9.5,
        homeMoneyline: -140,
        awayMoneyline: +120,
      };
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getInjuryReports(homeTeamId: string, awayTeamId: string): Promise<any> {
    try {
      // FLAG: Implement injury report analysis
      return {
        home: { keyInjuries: 1, impactScore: 2.5 },
        away: { keyInjuries: 0, impactScore: 0.0 },
      };
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getKeyPlayers(teamId: string): Promise<any[]> {
    try {
      // FLAG: Implement key players retrieval (starters + key bench players)
      return [
        { id: 'player_001', name: 'Star Player', position: 'SS' },
        { id: 'player_002', name: 'Ace Pitcher', position: 'P' },
      ];
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  // Helper methods for encoding and calculations
  private encodeWindDirection(direction: string): number {
    const directions: { [key: string]: number } = {
      out: 1.0, // Blowing out to outfield
      in: 0.0, // Blowing in from outfield
      cross: 0.5, // Blowing across field
      calm: 0.25, // Little to no wind
    };

    return directions[direction] || 0.25;
  }

  private encodeGameTime(gameDate: Date): number {
    const hour = gameDate.getHours();
    if (hour < 17) return 0; // Day game
    if (hour < 20) return 0.5; // Twilight
    return 1; // Night game
  }

  private calculatePythagoreanWinPct(teamAnalytics: any): number {
    if (!teamAnalytics) return 0.5;

    const runsScored = teamAnalytics.offensiveAnalysis?.runsPerGame || 4.5;
    const runsAllowed = teamAnalytics.defensiveAnalysis?.runsAllowed || 4.5;

    return runsScored ** 2 / (runsScored ** 2 + runsAllowed ** 2);
  }

  private async calculateRestDays(
    homeTeamId: string,
    awayTeamId: string,
    gameDate: Date
  ): Promise<number> {
    // FLAG: Implement rest days calculation
    return 1; // Average rest days
  }

  // Prediction utility methods
  private getWinnerFeatureImportance(): any {
    return {
      teamStrength: 0.25,
      startingPitching: 0.2,
      recentForm: 0.15,
      homeFieldAdvantage: 0.1,
      bullpenQuality: 0.1,
      historicalMatchups: 0.08,
      weather: 0.07,
      injuries: 0.05,
    };
  }

  private getRunLineFeatureImportance(): any {
    return {
      offensivePower: 0.3,
      pitchingMatchup: 0.25,
      bullpenDepth: 0.15,
      ballparkFactor: 0.1,
      weather: 0.1,
      recentScoring: 0.1,
    };
  }

  private getTotalFeatureImportance(): any {
    return {
      teamOffense: 0.25,
      pitchingStaff: 0.25,
      weather: 0.2,
      ballparkFactor: 0.15,
      pace: 0.1,
      historicalTotals: 0.05,
    };
  }

  private getRunLineRecommendation(predictions: any[]): any {
    const bestBet = predictions.reduce((best, current) => {
      const edge = Math.abs(current.homeCoverProbability - 0.5);
      const bestEdge = Math.abs(best.homeCoverProbability - 0.5);
      return edge > bestEdge ? current : best;
    });

    return {
      line: bestBet.line,
      recommendation: bestBet.homeCoverProbability > 0.52 ? 'home' : 'away',
      probability: bestBet.homeCoverProbability,
      edge: Math.abs(bestBet.homeCoverProbability - 0.5) * 2,
    };
  }

  private getTotalRecommendation(predictions: any[]): any {
    const bestBet = predictions.reduce((best, current) => {
      const edge = Math.abs(current.overProbability - 0.5);
      const bestEdge = Math.abs(best.overProbability - 0.5);
      return edge > bestEdge ? current : best;
    });

    return {
      total: bestBet.total,
      recommendation: bestBet.overProbability > 0.52 ? 'over' : 'under',
      probability: bestBet.overProbability,
      edge: Math.abs(bestBet.overProbability - 0.5) * 2,
    };
  }

  private calculateOverallConfidence(predictions: any): number {
    const confidences = [
      predictions.winnerPrediction?.confidence || 0,
      predictions.runLinePrediction?.confidence || 0,
      predictions.totalPrediction?.confidence || 0,
    ];

    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  private calculateRunLineConfidence(expectedDifferential: number): number {
    // Higher confidence when expected differential is further from 0
    return Math.min(0.95, Math.abs(expectedDifferential) / 3.0);
  }

  private calculateTotalConfidence(expectedTotal: number): number {
    // Higher confidence when expected total is further from common betting totals
    const commonTotals = [8.5, 9.0, 9.5, 10.0];
    const closestTotal = commonTotals.reduce((closest, total) =>
      Math.abs(total - expectedTotal) < Math.abs(closest - expectedTotal) ? total : closest
    );

    return Math.min(0.95, Math.abs(expectedTotal - closestTotal) * 2);
  }

  private sanitizeFeatures(features: MLFeatures): any {
    // Remove sensitive or PII data from features before storage
    const { homeTeam, awayTeam, ...sanitized } = features;
    return sanitized;
  }

  private getModelVersions(): any {
    return {
      gameWinner: '2.1.0',
      runLine: '1.8.2',
      total: '2.0.1',
      playerPerformance: '1.5.3',
    };
  }

  private async storePrediction(prediction: GamePrediction): Promise<void> {
    try {
      await firebaseService.collection('mlb_ml_predictions').doc(prediction.gameId).set(prediction);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  // Default prediction methods for error handling
  private getDefaultWinnerPrediction(): WinnerPrediction {
    return {
      homeWinProbability: 0.54, // Slight home field advantage
      awayWinProbability: 0.46,
      predictedWinner: 'home',
      confidence: 0.54,
      modelFeatureImportance: this.getWinnerFeatureImportance(),
    };
  }

  private getDefaultRunLinePrediction(): RunLinePrediction {
    return {
      expectedRunDifferential: 0.2,
      homeExpectedRuns: 4.6,
      awayExpectedRuns: 4.4,
      runLinePredictions: [
        { line: -1.5, homeCoverProbability: 0.48 },
        { line: 1.5, homeCoverProbability: 0.52 },
      ],
      recommendedBet: { line: 1.5, recommendation: 'home', probability: 0.52, edge: 0.04 },
      confidence: 0.52,
      modelFeatureImportance: this.getRunLineFeatureImportance(),
    };
  }

  private getDefaultTotalPrediction(): TotalPrediction {
    return {
      expectedTotal: 9.0,
      homeExpectedRuns: 4.5,
      awayExpectedRuns: 4.5,
      totalPredictions: [
        { total: 8.5, overProbability: 0.52 },
        { total: 9.5, overProbability: 0.48 },
      ],
      recommendedBet: { total: 8.5, recommendation: 'over', probability: 0.52, edge: 0.04 },
      confidence: 0.52,
      weatherImpact: 0.0,
      ballparkImpact: 0.0,
      modelFeatureImportance: this.getTotalFeatureImportance(),
    };
  }

  private getDefaultPlayerPrediction(player: any): PlayerPrediction {
    return {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      predictions:
        player.position === 'P'
          ? {
              inningsPitched: 6.0,
              earnedRuns: 2,
              strikeouts: 6,
              walks: 2,
              hits: 6,
              pitchCount: 95,
              winProbability: 0.5,
              qualityStart: 0.6,
            }
          : {
              atBats: 4,
              hits: 1,
              homeRuns: 0.15,
              rbis: 0.8,
              runs: 0.6,
              walks: 0.5,
              strikeouts: 1.2,
              stolenBases: 0.1,
            },
      confidence: 0.65,
      projectedFantasyPoints: 8.5,
    };
  }

  // Individual stat prediction methods (these would use specialized models)
  private predictInningsPitched(features: any): number {
    return 6.0;
  }
  private predictEarnedRuns(features: any): number {
    return 2;
  }
  private predictStrikeouts(features: any): number {
    return 6;
  }
  private predictWalks(features: any): number {
    return 2;
  }
  private predictHitsAllowed(features: any): number {
    return 6;
  }
  private predictPitchCount(features: any): number {
    return 95;
  }
  private predictWinProbability(features: any): number {
    return 0.5;
  }
  private predictQualityStart(features: any): number {
    return 0.6;
  }
  private predictAtBats(features: any): number {
    return 4;
  }
  private predictHits(features: any): number {
    return 1;
  }
  private predictHomeRuns(features: any): number {
    return 0.15;
  }
  private predictRBIs(features: any): number {
    return 0.8;
  }
  private predictRuns(features: any): number {
    return 0.6;
  }
  private predictStolenBases(features: any): number {
    return 0.1;
  }

  private calculatePlayerConfidence(features: any): number {
    return 0.65; // Default player prediction confidence
  }

  private calculateFantasyPoints(predictions: any, playerType: 'pitcher' | 'batter'): number {
    if (playerType === 'pitcher') {
      return (
        predictions.inningsPitched * 2 +
        predictions.strikeouts * 1 -
        predictions.earnedRuns * 1 +
        (predictions.winProbability > 0.5 ? 4 : 0)
      );
    } else {
      return (
        predictions.hits * 1 +
        predictions.homeRuns * 4 +
        predictions.rbis * 1 +
        predictions.runs * 1 +
        predictions.stolenBases * 2
      );
    }
  }

  private async extractPlayerFeatures(playerId: string, gameFeatures: MLFeatures): Promise<any> {
    // FLAG: Implement player-specific feature extraction
    return gameFeatures;
  }
}

// Type definitions
interface MLFeatures {
  homeOffensiveRating: number;
  awayOffensiveRating: number;
  homeTeamBattingAverage: number;
  awayTeamBattingAverage: number;
  homeOnBasePercentage: number;
  awayOnBasePercentage: number;
  homeSluggingPercentage: number;
  awaySluggingPercentage: number;
  homeTeamERA: number;
  awayTeamERA: number;
  homeBullpenERA: number;
  awayBullpenERA: number;
  homeFieldingPercentage: number;
  awayFieldingPercentage: number;
  homeStarterERA: number;
  awayStarterERA: number;
  homeStarterWHIP: number;
  awayStarterWHIP: number;
  homeStarterStrikeoutRate: number;
  awayStarterStrikeoutRate: number;
  homeStarterInningsPitched: number;
  awayStarterInningsPitched: number;
  historicalHomeWinPercentage: number;
  historicalRunsHomeAverage: number;
  historicalRunsAwayAverage: number;
  historicalTotalAverage: number;
  gamesPlayedAgainstEachOther: number;
  homeRecentWinPercentage: number;
  awayRecentWinPercentage: number;
  homeRecentRunsPerGame: number;
  awayRecentRunsPerGame: number;
  homeRecentRunsAllowed: number;
  awayRecentRunsAllowed: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  isDome: boolean;
  homeFieldAdvantage: number;
  restDays: number;
  seasonMonth: number;
  dayOfWeek: number;
  isWeekend: boolean;
  gameTime: number;
  openingSpread: number;
  openingTotal: number;
  currentSpread: number;
  currentTotal: number;
  homeMoneyline: number;
  awayMoneyline: number;
  homeKeyInjuries: number;
  awayKeyInjuries: number;
  homeInjuryImpactScore: number;
  awayInjuryImpactScore: number;
  homePythagoreanWinPercentage: number;
  awayPythagoreanWinPercentage: number;
  homeBasePathingRuns: number;
  awayBasePathingRuns: number;
  homeDefensiveRuns: number;
  awayDefensiveRuns: number;
  homeTeam?: string;
  awayTeam?: string;
}

interface GamePrediction {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: Date;
  predictions: {
    winnerPrediction: WinnerPrediction;
    runLinePrediction: RunLinePrediction;
    totalPrediction: TotalPrediction;
    playerPredictions: PlayerPrediction[];
    pitcherMatchup: any;
    bullpenImpact: any;
    weatherImpact: any;
    situationalFactors: any;
  };
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
  modelFeatureImportance: any;
}

interface RunLinePrediction {
  expectedRunDifferential: number;
  homeExpectedRuns: number;
  awayExpectedRuns: number;
  runLinePredictions: { line: number; homeCoverProbability: number }[];
  recommendedBet: any;
  confidence: number;
  modelFeatureImportance: any;
}

interface TotalPrediction {
  expectedTotal: number;
  homeExpectedRuns: number;
  awayExpectedRuns: number;
  totalPredictions: { total: number; overProbability: number }[];
  recommendedBet: any;
  confidence: number;
  weatherImpact: number;
  ballparkImpact: number;
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
