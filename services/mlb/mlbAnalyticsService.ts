// =============================================================================
// MLB ANALYTICS SERVICE
// Deep Focus Architecture with Advanced Baseball Analysis
// Following UFC Analytics Pattern for Consistency
// =============================================================================

import { firebaseService } from '../firebaseService';
import * as Sentry from '@sentry/node';

export class MLBAnalyticsService {
  async analyzePlayerPerformance(playerId: string): Promise<PlayerAnalysis> {
    try {
      Sentry.addBreadcrumb({
        message: `Analyzing MLB player performance: ${playerId}`,
        category: 'mlb.analytics',
        level: 'info',
      });

      const player = await firebaseService.collection('mlb_players').doc(playerId).get();

      if (!player.exists) {
        throw new Error(`Player not found: ${playerId}`);
      }

      const gameHistory = await this.getGameHistory(playerId);

      const analysis: PlayerAnalysis = {
        playerId,
        battingAnalysis: await this.analyzeBatting(gameHistory),
        pitchingAnalysis: await this.analyzePitching(gameHistory),
        fieldingAnalysis: await this.analyzeFielding(gameHistory),
        baserunningAnalysis: await this.analyzeBaserunning(gameHistory),
        clutchPerformance: await this.analyzeClutchPerformance(gameHistory),
        injuryRisk: await this.assessInjuryRisk(gameHistory),
        overallRating: 0, // Will be calculated
        lastUpdated: new Date(),
      };

      analysis.overallRating = this.calculateOverallRating(analysis);

      // Store analysis in database
      await this.storeAnalysis(playerId, analysis);

      return analysis;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Player analysis failed: ${error.message}`);
    }
  }

  private async analyzeBatting(gameHistory: any[]): Promise<BattingAnalysis> {
    try {
      const battingStats = gameHistory.map(game => ({
        atBats: game.atBats || 0,
        hits: game.hits || 0,
        homeRuns: game.homeRuns || 0,
        rbis: game.rbis || 0,
        walks: game.walks || 0,
        strikeouts: game.strikeouts || 0,
        doubles: game.doubles || 0,
        triples: game.triples || 0,
        stolenBases: game.stolenBases || 0,
        battingAverage: game.battingAverage || 0,
        onBasePercentage: game.onBasePercentage || 0,
        sluggingPercentage: game.sluggingPercentage || 0,
      }));

      const analysis: BattingAnalysis = {
        averageBattingAverage: this.calculateAverage(battingStats, 'battingAverage'),
        powerTrend: this.calculateTrend(battingStats, 'homeRuns'),
        plateApproach: this.analyzePlateApproach(battingStats),
        hotZones: this.analyzeHotZones(gameHistory),
        situationalHitting: this.analyzeSituationalHitting(gameHistory),
        streakAnalysis: this.analyzeHittingStreaks(battingStats),
        clutchFactor: this.calculateClutchFactor(gameHistory),
        pitcherMatchups: this.analyzePitcherMatchups(gameHistory),
      };

      return analysis;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  private async analyzePitching(gameHistory: any[]): Promise<PitchingAnalysis> {
    try {
      const pitchingStats = gameHistory.map(game => ({
        inningsPitched: game.inningsPitched || 0,
        earnedRuns: game.earnedRuns || 0,
        strikeouts: game.strikeouts || 0,
        walks: game.walks || 0,
        hits: game.hitsAllowed || 0,
        homeRuns: game.homeRunsAllowed || 0,
        pitchCount: game.pitchCount || 0,
        era: game.era || 0,
        whip: game.whip || 0,
      }));

      return {
        eraConsistency: this.calculateERAConsistency(pitchingStats),
        strikeoutRate: this.calculateStrikeoutRate(pitchingStats),
        commandControl: this.analyzeCommandControl(pitchingStats),
        pitchRepertoire: this.analyzePitchRepertoire(gameHistory),
        stamina: this.analyzeStamina(pitchingStats),
        clutchPitching: this.analyzeClutchPitching(gameHistory),
        ballparkFactors: this.analyzeBallparkFactors(gameHistory),
        batterHandedness: this.analyzeBatterHandedness(gameHistory),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultPitchingAnalysis();
    }
  }

  private async analyzeFielding(gameHistory: any[]): Promise<FieldingAnalysis> {
    try {
      const fieldingStats = gameHistory.map(game => ({
        assists: game.assists || 0,
        putouts: game.putouts || 0,
        errors: game.errors || 0,
        fieldingPercentage: game.fieldingPercentage || 0,
        range: game.range || 0,
        armStrength: game.armStrength || 0,
      }));

      return {
        fieldingPercentage: this.calculateAverage(fieldingStats, 'fieldingPercentage'),
        rangeAnalysis: this.analyzeRange(fieldingStats),
        armStrengthRating: this.calculateArmStrength(fieldingStats),
        positionSpecificMetrics: this.analyzePositionMetrics(gameHistory),
        doublePlayTurning: this.analyzeDoublePlayTurning(gameHistory),
        errorPatterns: this.analyzeErrorPatterns(fieldingStats),
        defensiveRuns: this.calculateDefensiveRuns(gameHistory),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultFieldingAnalysis();
    }
  }

  private async analyzeBaserunning(gameHistory: any[]): Promise<BaserunningAnalysis> {
    try {
      const baserunningStats = gameHistory.map(game => ({
        stolenBases: game.stolenBases || 0,
        caughtStealing: game.caughtStealing || 0,
        extraBases: game.extraBases || 0,
        speed: game.speed || 0,
      }));

      return {
        stealSuccess: this.calculateStealSuccess(baserunningStats),
        speedRating: this.calculateSpeedRating(baserunningStats),
        baserunningIQ: this.analyzeBaserunningIQ(gameHistory),
        situationalAwareness: this.analyzeSituationalAwareness(gameHistory),
        extraBasePercentage: this.calculateExtraBasePercentage(baserunningStats),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultBaserunningAnalysis();
    }
  }

  private async analyzeClutchPerformance(gameHistory: any[]): Promise<ClutchAnalysis> {
    try {
      const clutchSituations = gameHistory.filter(game => 
        game.leverage && game.leverage > 1.5 // High leverage situations
      );

      return {
        clutchBattingAverage: this.calculateClutchBattingAverage(clutchSituations),
        rbiOpportunities: this.analyzeRBIOpportunities(clutchSituations),
        pressureSituations: this.analyzePressureSituations(clutchSituations),
        walkOffPerformance: this.analyzeWalkOffPerformance(gameHistory),
        postseasonPerformance: this.analyzePostseasonPerformance(gameHistory),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultClutchAnalysis();
    }
  }

  async analyzeTeamPerformance(teamId: string): Promise<TeamAnalysis> {
    try {
      Sentry.addBreadcrumb({
        message: `Analyzing team performance: ${teamId}`,
        category: 'mlb.analytics.team',
        level: 'info',
      });

      const team = await firebaseService.collection('mlb_teams').doc(teamId).get();
      const teamGames = await this.getTeamGameHistory(teamId);

      const analysis: TeamAnalysis = {
        teamId,
        offensiveAnalysis: await this.analyzeTeamOffense(teamGames),
        defensiveAnalysis: await this.analyzeTeamDefense(teamGames),
        pitchingStaffAnalysis: await this.analyzePitchingStaff(teamGames),
        bullpenAnalysis: await this.analyzeBullpen(teamGames),
        managerialAnalysis: await this.analyzeManagerialDecisions(teamGames),
        homeFieldAdvantage: await this.analyzeHomeFieldAdvantage(teamGames),
        divisionPerformance: await this.analyzeDivisionPerformance(teamGames),
        weatherImpact: await this.analyzeWeatherImpact(teamGames),
        lastUpdated: new Date(),
      };

      await this.storeTeamAnalysis(teamId, analysis);
      return analysis;

    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Team analysis failed: ${error.message}`);
    }
  }

  private async analyzeTeamOffense(teamGames: any[]): Promise<OffensiveAnalysis> {
    return {
      runsPerGame: this.calculateAverage(teamGames, 'runsScored'),
      teamBattingAverage: this.calculateAverage(teamGames, 'teamBattingAverage'),
      onBasePercentage: this.calculateAverage(teamGames, 'teamOBP'),
      sluggingPercentage: this.calculateAverage(teamGames, 'teamSLG'),
      powerNumbers: this.analyzePowerNumbers(teamGames),
      clutchHitting: this.analyzeTeamClutchHitting(teamGames),
      baserunning: this.analyzeTeamBaserunning(teamGames),
      plateDisciple: this.analyzeTeamPlateDisciple(teamGames),
    };
  }

  private async analyzeTeamDefense(teamGames: any[]): Promise<DefensiveAnalysis> {
    return {
      fieldingPercentage: this.calculateAverage(teamGames, 'teamFieldingPercentage'),
      defensiveEfficiency: this.calculateDefensiveEfficiency(teamGames),
      doublePlayRate: this.calculateDoublePlayRate(teamGames),
      stolenBaseAllowed: this.calculateStolenBasesAllowed(teamGames),
      errorDistribution: this.analyzeErrorDistribution(teamGames),
      defensiveShifts: this.analyzeDefensiveShifts(teamGames),
    };
  }

  private async analyzePitchingStaff(teamGames: any[]): Promise<PitchingStaffAnalysis> {
    return {
      starterERA: this.calculateStarterERA(teamGames),
      starterInnings: this.calculateStarterInnings(teamGames),
      qualityStarts: this.calculateQualityStarts(teamGames),
      rotationDepth: this.analyzeRotationDepth(teamGames),
      injuryImpact: this.analyzePitchingInjuries(teamGames),
    };
  }

  private async analyzeBullpen(teamGames: any[]): Promise<BullpenAnalysis> {
    return {
      bullpenERA: this.calculateBullpenERA(teamGames),
      savePercentage: this.calculateSavePercentage(teamGames),
      holdPercentage: this.calculateHoldPercentage(teamGames),
      leveragePerformance: this.analyzeLeveragePerformance(teamGames),
      bullpenUsage: this.analyzeBullpenUsage(teamGames),
    };
  }

  async generateGamePrediction(homeTeamId: string, awayTeamId: string): Promise<GamePrediction> {
    try {
      const homeTeamAnalysis = await this.analyzeTeamPerformance(homeTeamId);
      const awayTeamAnalysis = await this.analyzeTeamPerformance(awayTeamId);

      const prediction: GamePrediction = {
        homeTeam: homeTeamId,
        awayTeam: awayTeamId,
        winProbability: this.calculateWinProbability(homeTeamAnalysis, awayTeamAnalysis),
        runLineRecommendation: this.calculateRunLineRecommendation(homeTeamAnalysis, awayTeamAnalysis),
        totalRecommendation: this.calculateTotalRecommendation(homeTeamAnalysis, awayTeamAnalysis),
        keyMatchups: this.identifyKeyMatchups(homeTeamAnalysis, awayTeamAnalysis),
        weatherFactor: await this.calculateWeatherFactor(homeTeamId),
        confidence: 0,
        lastUpdated: new Date(),
      };

      prediction.confidence = this.calculatePredictionConfidence(prediction);

      return prediction;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Game prediction failed: ${error.message}`);
    }
  }

  // Utility methods
  private calculateAverage(stats: any[], field: string): number {
    const validStats = stats.filter(stat => stat[field] !== undefined && stat[field] !== null);
    if (validStats.length === 0) return 0;
    
    const sum = validStats.reduce((acc, stat) => acc + stat[field], 0);
    return sum / validStats.length;
  }

  private calculateTrend(stats: any[], field: string): string {
    if (stats.length < 2) return 'Insufficient Data';
    
    const recent = stats.slice(-10); // Last 10 games
    const early = stats.slice(0, 10); // First 10 games
    
    const recentAvg = this.calculateAverage(recent, field);
    const earlyAvg = this.calculateAverage(early, field);
    
    if (recentAvg > earlyAvg * 1.1) return 'Improving';
    if (recentAvg < earlyAvg * 0.9) return 'Declining';
    return 'Stable';
  }

  private calculateOverallRating(analysis: PlayerAnalysis): number {
    // Weighted rating based on multiple factors
    let rating = 0;
    let weight = 0;

    if (analysis.battingAnalysis) {
      rating += analysis.battingAnalysis.averageBattingAverage * 100 * 0.3;
      weight += 0.3;
    }

    if (analysis.pitchingAnalysis) {
      rating += (5.00 - analysis.pitchingAnalysis.eraConsistency) * 20 * 0.3;
      weight += 0.3;
    }

    if (analysis.fieldingAnalysis) {
      rating += analysis.fieldingAnalysis.fieldingPercentage * 100 * 0.2;
      weight += 0.2;
    }

    if (analysis.clutchPerformance) {
      rating += analysis.clutchPerformance.clutchBattingAverage * 100 * 0.2;
      weight += 0.2;
    }

    return weight > 0 ? Math.round(rating / weight) : 50;
  }

  // Helper methods for specific analysis
  private analyzePlateApproach(battingStats: any[]): PlateApproachAnalysis {
    return {
      walkRate: this.calculateWalkRate(battingStats),
      strikeoutRate: this.calculateStrikeoutRate(battingStats),
      swingRate: this.calculateSwingRate(battingStats),
      contactRate: this.calculateContactRate(battingStats),
      chaseRate: this.calculateChaseRate(battingStats),
    };
  }

  private analyzeHotZones(gameHistory: any[]): HotZoneAnalysis {
    // FLAG: Implement hot zone analysis with spray charts
    return {
      pullField: 0.3,
      centerField: 0.4,
      oppositeField: 0.3,
      innerHalf: 0.6,
      outerHalf: 0.4,
    };
  }

  private analyzeSituationalHitting(gameHistory: any[]): SituationalHittingAnalysis {
    return {
      runnersInScoringPosition: this.calculateRISPAverage(gameHistory),
      twoOutHitting: this.calculateTwoOutAverage(gameHistory),
      basesLoadedPerformance: this.calculateBasesLoadedAverage(gameHistory),
      lateInningPerformance: this.calculateLateInningAverage(gameHistory),
    };
  }

  private analyzeHittingStreaks(battingStats: any[]): StreakAnalysis {
    return {
      currentStreak: this.calculateCurrentStreak(battingStats),
      longestHittingStreak: this.calculateLongestHittingStreak(battingStats),
      streakConsistency: this.calculateStreakConsistency(battingStats),
    };
  }

  private calculateClutchFactor(gameHistory: any[]): number {
    const clutchSituations = gameHistory.filter(game => game.leverage > 1.5);
    return this.calculateAverage(clutchSituations, 'battingAverage');
  }

  private analyzePitcherMatchups(gameHistory: any[]): PitcherMatchupAnalysis {
    return {
      vsLefty: this.calculateVsLeftyStats(gameHistory),
      vsRighty: this.calculateVsRightyStats(gameHistory),
      vsFastball: this.calculateVsFastballStats(gameHistory),
      vsBreakingBall: this.calculateVsBreakingBallStats(gameHistory),
    };
  }

  // Pitching analysis methods
  private calculateERAConsistency(pitchingStats: any[]): number {
    const eras = pitchingStats.map(stat => stat.era).filter(era => era > 0);
    if (eras.length === 0) return 0;
    
    const mean = eras.reduce((sum, era) => sum + era, 0) / eras.length;
    const variance = eras.reduce((sum, era) => sum + Math.pow(era - mean, 2), 0) / eras.length;
    return Math.sqrt(variance);
  }

  private analyzeCommandControl(pitchingStats: any[]): CommandControlAnalysis {
    return {
      strikePercentage: this.calculateStrikePercentage(pitchingStats),
      firstPitchStrike: this.calculateFirstPitchStrikePercentage(pitchingStats),
      walkRate: this.calculatePitcherWalkRate(pitchingStats),
      swingingStrike: this.calculateSwingingStrikePercentage(pitchingStats),
    };
  }

  private analyzePitchRepertoire(gameHistory: any[]): PitchRepertoireAnalysis {
    // FLAG: Implement pitch type analysis
    return {
      fastballVelocity: 92.5,
      curveball: true,
      slider: true,
      changeup: true,
      cutter: false,
      splitter: false,
    };
  }

  private analyzeStamina(pitchingStats: any[]): StaminaAnalysis {
    return {
      averageInnings: this.calculateAverageInnings(pitchingStats),
      pitchCountPerInning: this.calculatePitchCountPerInning(pitchingStats),
      lateInningPerformance: this.calculateLateInningPitchingPerformance(pitchingStats),
    };
  }

  // Data retrieval methods
  private async getGameHistory(playerId: string): Promise<any[]> {
    try {
      const gamesRef = firebaseService.collection('mlb_games')
        .where('players', 'array-contains', playerId)
        .orderBy('date', 'desc')
        .limit(162); // Full season

      const gamesSnapshot = await gamesRef.get();
      return gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async getTeamGameHistory(teamId: string): Promise<any[]> {
    try {
      const gamesRef = firebaseService.collection('mlb_games')
        .where('teams', 'array-contains', teamId)
        .orderBy('date', 'desc')
        .limit(162); // Full season

      const gamesSnapshot = await gamesRef.get();
      return gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async storeAnalysis(playerId: string, analysis: PlayerAnalysis): Promise<void> {
    try {
      await firebaseService.collection('mlb_player_analytics').doc(playerId).set(analysis);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  private async storeTeamAnalysis(teamId: string, analysis: TeamAnalysis): Promise<void> {
    try {
      await firebaseService.collection('mlb_team_analytics').doc(teamId).set(analysis);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  // Default analysis methods for error handling
  private getDefaultPitchingAnalysis(): PitchingAnalysis {
    return {
      eraConsistency: 4.50,
      strikeoutRate: 0.20,
      commandControl: {
        strikePercentage: 0.65,
        firstPitchStrike: 0.60,
        walkRate: 0.08,
        swingingStrike: 0.10,
      },
      pitchRepertoire: {
        fastballVelocity: 92.0,
        curveball: true,
        slider: false,
        changeup: true,
        cutter: false,
        splitter: false,
      },
      stamina: {
        averageInnings: 6.0,
        pitchCountPerInning: 16,
        lateInningPerformance: 0.75,
      },
      clutchPitching: {
        leverageIndex: 1.0,
        clutchERA: 4.50,
      },
      ballparkFactors: {},
      batterHandedness: {
        vsLefty: 0.250,
        vsRighty: 0.260,
      },
    };
  }

  private getDefaultFieldingAnalysis(): FieldingAnalysis {
    return {
      fieldingPercentage: 0.985,
      rangeAnalysis: {
        above: 0,
        average: 1,
        below: 0,
      },
      armStrengthRating: 6,
      positionSpecificMetrics: {},
      doublePlayTurning: 0.85,
      errorPatterns: [],
      defensiveRuns: 0,
    };
  }

  private getDefaultBaserunningAnalysis(): BaserunningAnalysis {
    return {
      stealSuccess: 0.75,
      speedRating: 5,
      baserunningIQ: 7,
      situationalAwareness: 6,
      extraBasePercentage: 0.45,
    };
  }

  private getDefaultClutchAnalysis(): ClutchAnalysis {
    return {
      clutchBattingAverage: 0.250,
      rbiOpportunities: 0.30,
      pressureSituations: 0.275,
      walkOffPerformance: 0.300,
      postseasonPerformance: 0.250,
    };
  }

  // Calculation methods - these would contain actual statistical calculations
  private calculateWalkRate(battingStats: any[]): number {
    // FLAG: Implement walk rate calculation
    return 0.08;
  }

  private calculateStrikeoutRate(stats: any[]): number {
    // FLAG: Implement strikeout rate calculation  
    return 0.20;
  }

  private calculateSwingRate(battingStats: any[]): number {
    // FLAG: Implement swing rate calculation
    return 0.45;
  }

  private calculateContactRate(battingStats: any[]): number {
    // FLAG: Implement contact rate calculation
    return 0.78;
  }

  private calculateChaseRate(battingStats: any[]): number {
    // FLAG: Implement chase rate calculation
    return 0.28;
  }

  private calculateRISPAverage(gameHistory: any[]): number {
    // FLAG: Implement RISP average calculation
    return 0.275;
  }

  private calculateTwoOutAverage(gameHistory: any[]): number {
    // FLAG: Implement two out average calculation
    return 0.245;
  }

  private calculateBasesLoadedAverage(gameHistory: any[]): number {
    // FLAG: Implement bases loaded average calculation
    return 0.290;
  }

  private calculateLateInningAverage(gameHistory: any[]): number {
    // FLAG: Implement late inning average calculation
    return 0.255;
  }

  private calculateCurrentStreak(battingStats: any[]): number {
    // FLAG: Implement current streak calculation
    return 3;
  }

  private calculateLongestHittingStreak(battingStats: any[]): number {
    // FLAG: Implement longest hitting streak calculation
    return 12;
  }

  private calculateStreakConsistency(battingStats: any[]): number {
    // FLAG: Implement streak consistency calculation
    return 0.65;
  }

  private calculateVsLeftyStats(gameHistory: any[]): any {
    // FLAG: Implement vs lefty stats calculation
    return { average: 0.265, ops: 0.750 };
  }

  private calculateVsRightyStats(gameHistory: any[]): any {
    // FLAG: Implement vs righty stats calculation
    return { average: 0.275, ops: 0.780 };
  }

  private calculateVsFastballStats(gameHistory: any[]): any {
    // FLAG: Implement vs fastball stats calculation
    return { average: 0.285, slugging: 0.450 };
  }

  private calculateVsBreakingBallStats(gameHistory: any[]): any {
    // FLAG: Implement vs breaking ball stats calculation
    return { average: 0.235, slugging: 0.380 };
  }

  // Additional calculation methods would be implemented here
  // FLAG: Implement remaining 50+ calculation methods for comprehensive analysis

  private calculateWinProbability(homeTeam: TeamAnalysis, awayTeam: TeamAnalysis): number {
    // FLAG: Implement win probability calculation
    return 0.52; // Slight home field advantage
  }

  private calculateRunLineRecommendation(homeTeam: TeamAnalysis, awayTeam: TeamAnalysis): string {
    // FLAG: Implement run line recommendation
    return 'Home -1.5';
  }

  private calculateTotalRecommendation(homeTeam: TeamAnalysis, awayTeam: TeamAnalysis): string {
    // FLAG: Implement total recommendation
    return 'Over 8.5';
  }

  private identifyKeyMatchups(homeTeam: TeamAnalysis, awayTeam: TeamAnalysis): any[] {
    // FLAG: Implement key matchup identification
    return [
      { type: 'Pitcher vs Lineup', advantage: 'Home' },
      { type: 'Bullpen Depth', advantage: 'Away' },
      { type: 'Power vs Power', advantage: 'Even' },
    ];
  }

  private async calculateWeatherFactor(teamId: string): Promise<number> {
    // FLAG: Implement weather factor calculation
    return 1.0; // Neutral weather impact
  }

  private calculatePredictionConfidence(prediction: GamePrediction): number {
    // FLAG: Implement prediction confidence calculation
    return 0.75;
  }

  // Additional team analysis methods
  private analyzePowerNumbers(teamGames: any[]): any {
    // FLAG: Implement power numbers analysis
    return { homeRuns: 200, slugging: 0.450, iso: 0.180 };
  }

  private analyzeTeamClutchHitting(teamGames: any[]): any {
    // FLAG: Implement team clutch hitting analysis
    return { rispAverage: 0.275, lateInning: 0.260 };
  }

  private analyzeTeamBaserunning(teamGames: any[]): any {
    // FLAG: Implement team baserunning analysis
    return { stolenBases: 120, successRate: 0.78 };
  }

  private analyzeTeamPlateDisciple(teamGames: any[]): any {
    // FLAG: Implement team plate discipline analysis
    return { walkRate: 0.085, strikeoutRate: 0.22 };
  }

  // All remaining methods would be implemented following the same pattern...
  // FLAG: Implement remaining 100+ analysis methods for complete MLB analytics
}

// Type definitions
interface PlayerAnalysis {
  playerId: string;
  battingAnalysis?: BattingAnalysis;
  pitchingAnalysis?: PitchingAnalysis;
  fieldingAnalysis?: FieldingAnalysis;
  baserunningAnalysis?: BaserunningAnalysis;
  clutchPerformance?: ClutchAnalysis;
  injuryRisk: number;
  overallRating: number;
  lastUpdated: Date;
}

interface BattingAnalysis {
  averageBattingAverage: number;
  powerTrend: string;
  plateApproach: PlateApproachAnalysis;
  hotZones: HotZoneAnalysis;
  situationalHitting: SituationalHittingAnalysis;
  streakAnalysis: StreakAnalysis;
  clutchFactor: number;
  pitcherMatchups: PitcherMatchupAnalysis;
}

interface PitchingAnalysis {
  eraConsistency: number;
  strikeoutRate: number;
  commandControl: CommandControlAnalysis;
  pitchRepertoire: PitchRepertoireAnalysis;
  stamina: StaminaAnalysis;
  clutchPitching: any;
  ballparkFactors: any;
  batterHandedness: any;
}

interface FieldingAnalysis {
  fieldingPercentage: number;
  rangeAnalysis: any;
  armStrengthRating: number;
  positionSpecificMetrics: any;
  doublePlayTurning: number;
  errorPatterns: any[];
  defensiveRuns: number;
}

interface BaserunningAnalysis {
  stealSuccess: number;
  speedRating: number;
  baserunningIQ: number;
  situationalAwareness: number;
  extraBasePercentage: number;
}

interface ClutchAnalysis {
  clutchBattingAverage: number;
  rbiOpportunities: number;
  pressureSituations: number;
  walkOffPerformance: number;
  postseasonPerformance: number;
}

interface TeamAnalysis {
  teamId: string;
  offensiveAnalysis: OffensiveAnalysis;
  defensiveAnalysis: DefensiveAnalysis;
  pitchingStaffAnalysis: PitchingStaffAnalysis;
  bullpenAnalysis: BullpenAnalysis;
  managerialAnalysis: any;
  homeFieldAdvantage: any;
  divisionPerformance: any;
  weatherImpact: any;
  lastUpdated: Date;
}

interface OffensiveAnalysis {
  runsPerGame: number;
  teamBattingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  powerNumbers: any;
  clutchHitting: any;
  baserunning: any;
  plateDisciple: any;
}

interface DefensiveAnalysis {
  fieldingPercentage: number;
  defensiveEfficiency: number;
  doublePlayRate: number;
  stolenBaseAllowed: number;
  errorDistribution: any;
  defensiveShifts: any;
}

interface PitchingStaffAnalysis {
  starterERA: number;
  starterInnings: number;
  qualityStarts: number;
  rotationDepth: any;
  injuryImpact: any;
}

interface BullpenAnalysis {
  bullpenERA: number;
  savePercentage: number;
  holdPercentage: number;
  leveragePerformance: any;
  bullpenUsage: any;
}

interface GamePrediction {
  homeTeam: string;
  awayTeam: string;
  winProbability: number;
  runLineRecommendation: string;
  totalRecommendation: string;
  keyMatchups: any[];
  weatherFactor: number;
  confidence: number;
  lastUpdated: Date;
}

// Additional type definitions for sub-analyses
interface PlateApproachAnalysis {
  walkRate: number;
  strikeoutRate: number;
  swingRate: number;
  contactRate: number;
  chaseRate: number;
}

interface HotZoneAnalysis {
  pullField: number;
  centerField: number;
  oppositeField: number;
  innerHalf: number;
  outerHalf: number;
}

interface SituationalHittingAnalysis {
  runnersInScoringPosition: number;
  twoOutHitting: number;
  basesLoadedPerformance: number;
  lateInningPerformance: number;
}

interface StreakAnalysis {
  currentStreak: number;
  longestHittingStreak: number;
  streakConsistency: number;
}

interface PitcherMatchupAnalysis {
  vsLefty: any;
  vsRighty: any;
  vsFastball: any;
  vsBreakingBall: any;
}

interface CommandControlAnalysis {
  strikePercentage: number;
  firstPitchStrike: number;
  walkRate: number;
  swingingStrike: number;
}

interface PitchRepertoireAnalysis {
  fastballVelocity: number;
  curveball: boolean;
  slider: boolean;
  changeup: boolean;
  cutter: boolean;
  splitter: boolean;
}

interface StaminaAnalysis {
  averageInnings: number;
  pitchCountPerInning: number;
  lateInningPerformance: number;
}