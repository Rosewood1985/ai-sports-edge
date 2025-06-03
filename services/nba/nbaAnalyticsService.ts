// =============================================================================
// NBA ANALYTICS SERVICE
// Comprehensive NBA Analytics with Advanced Basketball Metrics
// =============================================================================

import * as Sentry from '@sentry/react-native';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';

import { NBATeam, NBAPlayer, NBAGame } from './nbaDataSyncService';
import { firestore as db } from '../../config/firebase';

// NBA-specific analytics interfaces
export interface NBATeamAnalytics {
  teamId: string;
  season: number;
  lastUpdated: Date;

  // Offensive Metrics
  offensiveMetrics: {
    pointsPerGame: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    assistsPerGame: number;
    turnoversPerGame: number;
    offensiveReboundsPerGame: number;
    possessions: number;
    offensiveRating: number; // Points per 100 possessions
    trueShootingPercentage: number;
    effectiveFieldGoalPercentage: number;
    assistToTurnoverRatio: number;
    pace: number; // Possessions per 48 minutes
  };

  // Defensive Metrics
  defensiveMetrics: {
    opponentPointsPerGame: number;
    opponentFieldGoalPercentage: number;
    opponentThreePointPercentage: number;
    defensiveReboundsPerGame: number;
    stealsPerGame: number;
    blocksPerGame: number;
    defensiveRating: number; // Opponent points per 100 possessions
    deflections: number;
    contests: number;
    forcedTurnovers: number;
  };

  // Advanced Team Metrics
  advancedMetrics: {
    netRating: number; // Offensive rating - Defensive rating
    winPercentage: number;
    strengthOfSchedule: number;
    clutchRecord: { wins: number; losses: number }; // Games within 5 points in last 5 minutes
    homeAdvantage: number; // Home win% - Away win%
    recentForm: number[]; // Last 10 games (1 = win, 0 = loss)
    marginOfVictory: number;
    consistency: number; // Standard deviation of point differential
  };

  // Basketball-Specific Analytics
  basketballMetrics: {
    reboundRate: { offensive: number; defensive: number; total: number };
    turnoverRate: number; // Turnovers per 100 possessions
    freeThrowRate: number; // Free throw attempts per field goal attempt
    threePointRate: number; // Three-point attempts per field goal attempt
    shootingEfficiency: {
      restrictedArea: number; // FG% at rim
      paintNonRA: number; // FG% in paint outside restricted area
      midRange: number; // FG% from mid-range
      cornerThree: number; // FG% from corner threes
      aboveBreakThree: number; // FG% from above-the-break threes
    };
    ballMovement: {
      passesPerGame: number;
      assistPercentage: number;
      secondaryAssists: number;
      potentialAssists: number;
    };
  };

  // Situational Performance
  situationalMetrics: {
    clutchPerformance: {
      offensiveRating: number;
      defensiveRating: number;
      netRating: number;
      fieldGoalPercentage: number;
    };
    restAdvantage: {
      backToBackGames: { wins: number; losses: number };
      restDifferential: number; // Performance vs teams with different rest
    };
    homeAwayDifferential: {
      home: { offensiveRating: number; defensiveRating: number };
      away: { offensiveRating: number; defensiveRating: number };
    };
    quarterPerformance: {
      q1: { scoringMargin: number; shootingPercentage: number };
      q2: { scoringMargin: number; shootingPercentage: number };
      q3: { scoringMargin: number; shootingPercentage: number };
      q4: { scoringMargin: number; shootingPercentage: number };
    };
  };

  // Player Impact Metrics
  playerImpactMetrics: {
    starPlayerDependency: number; // Team performance difference with/without best player
    benchContribution: number; // Bench points as percentage of total
    injuryImpact: number; // Performance impact of key injuries
    rotationStability: number; // Consistency of rotation usage
    leadershipMetrics: {
      veteranPresence: number; // Games played by veterans
      clutchPlayers: string[]; // Players with high clutch performance
    };
  };

  // Coaching and Strategy Metrics
  coachingMetrics: {
    timeoutUsage: number; // Average timeouts per game
    challengeSuccess: number; // Coach's challenge success rate
    adjustments: {
      halftimeImpact: number; // 3rd quarter performance improvement
      inGameAdjustments: number; // Performance in close games
    };
    playStyle: {
      fastBreakPercentage: number;
      halfCourtSets: number;
      isolationFrequency: number;
      pickAndRollFrequency: number;
    };
  };

  // Prediction Factors
  predictionFactors: {
    momentum: number; // Weighted recent performance
    healthIndex: number; // Team health based on injury reports
    scheduleStrength: number; // Upcoming schedule difficulty
    restAdvantage: number; // Days of rest vs opponents
    homeStand: number; // Games remaining in home stand
    travelDistance: number; // Miles traveled in last week
  };
}

export interface NBAPlayerAnalytics {
  playerId: string;
  season: number;
  lastUpdated: Date;

  // Basic Performance
  basicMetrics: {
    gamesPlayed: number;
    minutesPerGame: number;
    pointsPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    stealsPerGame: number;
    blocksPerGame: number;
    turnoversPerGame: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
  };

  // Advanced Player Metrics
  advancedMetrics: {
    playerEfficiencyRating: number;
    trueShootingPercentage: number;
    usageRate: number;
    assistPercentage: number;
    reboundPercentage: number;
    blockPercentage: number;
    stealPercentage: number;
    turnoverPercentage: number;
    winShares: number;
    winSharesPer48: number;
    boxPlusMinus: number;
    valueOverReplacementPlayer: number;
  };

  // Impact Metrics
  impactMetrics: {
    onOffNetRating: number; // Team net rating with player on vs off court
    lineupNetRating: number; // Net rating of most common lineup
    clutchPerformance: number; // Performance in clutch situations
    comebackContribution: number; // Performance when team is trailing
    defenseImpact: number; // Defensive impact on opponent shooting
  };

  // Basketball-Specific
  basketballMetrics: {
    shotSelection: {
      restrictedAreaAttempts: number;
      paintAttempts: number;
      midRangeAttempts: number;
      threePointAttempts: number;
      shotQuality: number; // Expected FG% based on shot location
    };
    playmaking: {
      assistToTurnoverRatio: number;
      potentialAssists: number;
      secondaryAssists: number;
      ballHandlingTurnovers: number;
    };
    rebounding: {
      offensiveReboundPercentage: number;
      defensiveReboundPercentage: number;
      contestedRebounds: number;
      reboundOpportunities: number;
    };
  };
}

export class NBAAnalyticsService {
  private readonly analyticsVersion = '1.0';

  constructor() {
    // Initialize analytics service
  }

  /**
   * Initialize the NBA analytics service
   */
  async initialize(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing NBA Analytics Service',
        category: 'nba.analytics.init',
        level: 'info',
      });

      console.log('NBA Analytics Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize NBA Analytics Service: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive team analytics
   */
  async generateTeamAnalytics(teamId: string, season: number): Promise<NBATeamAnalytics> {
    try {
      Sentry.addBreadcrumb({
        message: `Generating analytics for NBA team ${teamId}`,
        category: 'nba.analytics.team',
        level: 'info',
      });

      // Get team data
      const team = await this.getTeamData(teamId);
      if (!team) {
        throw new Error(`Team ${teamId} not found`);
      }

      // Get team games for the season
      const teamGames = await this.getTeamGames(teamId, season);

      // Generate comprehensive analytics
      const analytics: NBATeamAnalytics = {
        teamId,
        season,
        lastUpdated: new Date(),
        offensiveMetrics: await this.calculateOffensiveMetrics(teamGames),
        defensiveMetrics: await this.calculateDefensiveMetrics(teamGames),
        advancedMetrics: await this.calculateAdvancedTeamMetrics(teamGames),
        basketballMetrics: await this.calculateBasketballMetrics(teamGames),
        situationalMetrics: await this.calculateSituationalMetrics(teamGames),
        playerImpactMetrics: await this.calculatePlayerImpactMetrics(teamId, teamGames),
        coachingMetrics: await this.calculateCoachingMetrics(teamGames),
        predictionFactors: await this.calculatePredictionFactors(teamId, teamGames),
      };

      // Store analytics in Firestore
      const analyticsRef = doc(db, 'nba_team_analytics', `${teamId}_${season}`);
      await setDoc(analyticsRef, analytics);

      console.log(`Generated analytics for NBA team ${teamId}`);
      return analytics;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to generate team analytics for ${teamId}: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive player analytics
   */
  async generatePlayerAnalytics(playerId: string, season: number): Promise<NBAPlayerAnalytics> {
    try {
      Sentry.addBreadcrumb({
        message: `Generating analytics for NBA player ${playerId}`,
        category: 'nba.analytics.player',
        level: 'info',
      });

      // Get player data
      const player = await this.getPlayerData(playerId);
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }

      // Get player games for the season
      const playerGames = await this.getPlayerGames(playerId, season);

      // Generate comprehensive analytics
      const analytics: NBAPlayerAnalytics = {
        playerId,
        season,
        lastUpdated: new Date(),
        basicMetrics: await this.calculateBasicPlayerMetrics(playerGames),
        advancedMetrics: await this.calculateAdvancedPlayerMetrics(playerGames),
        impactMetrics: await this.calculatePlayerImpactMetrics(playerId, playerGames),
        basketballMetrics: await this.calculatePlayerBasketballMetrics(playerGames),
      };

      // Store analytics in Firestore
      const analyticsRef = doc(db, 'nba_player_analytics', `${playerId}_${season}`);
      await setDoc(analyticsRef, analytics);

      console.log(`Generated analytics for NBA player ${playerId}`);
      return analytics;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to generate player analytics for ${playerId}: ${error.message}`);
    }
  }

  /**
   * Calculate offensive metrics for a team
   */
  private async calculateOffensiveMetrics(
    games: NBAGame[]
  ): Promise<NBATeamAnalytics['offensiveMetrics']> {
    try {
      const completedGames = games.filter(game => game.status === 'completed');
      if (completedGames.length === 0) {
        return this.getDefaultOffensiveMetrics();
      }

      // Calculate basic offensive stats
      let totalPoints = 0;
      let totalFieldGoals = 0;
      let totalFieldGoalAttempts = 0;
      let totalThreePointers = 0;
      let totalThreePointAttempts = 0;
      let totalFreeThrows = 0;
      let totalFreeThrowAttempts = 0;
      let totalAssists = 0;
      let totalTurnovers = 0;
      let totalOffensiveRebounds = 0;
      let totalPossessions = 0;

      for (const game of completedGames) {
        if (game.boxScore) {
          // Determine which team's stats to use (home or away)
          const teamStats = game.boxScore.homeTeam; // This would need proper team identification

          totalPoints += teamStats.stats.points;
          totalFieldGoals += teamStats.stats.fieldGoals.made;
          totalFieldGoalAttempts += teamStats.stats.fieldGoals.attempted;
          totalThreePointers += teamStats.stats.threePointers.made;
          totalThreePointAttempts += teamStats.stats.threePointers.attempted;
          totalFreeThrows += teamStats.stats.freeThrows.made;
          totalFreeThrowAttempts += teamStats.stats.freeThrows.attempted;
          totalAssists += teamStats.stats.assists;
          totalTurnovers += teamStats.stats.turnovers;
          totalOffensiveRebounds += teamStats.stats.rebounds; // This would need offensive rebounds specifically
          totalPossessions += this.estimatePossessions(teamStats.stats);
        }
      }

      const gamesCount = completedGames.length;

      return {
        pointsPerGame: totalPoints / gamesCount,
        fieldGoalPercentage:
          totalFieldGoalAttempts > 0 ? (totalFieldGoals / totalFieldGoalAttempts) * 100 : 0,
        threePointPercentage:
          totalThreePointAttempts > 0 ? (totalThreePointers / totalThreePointAttempts) * 100 : 0,
        freeThrowPercentage:
          totalFreeThrowAttempts > 0 ? (totalFreeThrows / totalFreeThrowAttempts) * 100 : 0,
        assistsPerGame: totalAssists / gamesCount,
        turnoversPerGame: totalTurnovers / gamesCount,
        offensiveReboundsPerGame: totalOffensiveRebounds / gamesCount,
        possessions: totalPossessions / gamesCount,
        offensiveRating: totalPossessions > 0 ? (totalPoints / totalPossessions) * 100 : 0,
        trueShootingPercentage: this.calculateTrueShootingPercentage(
          totalPoints,
          totalFieldGoalAttempts,
          totalFreeThrowAttempts
        ),
        effectiveFieldGoalPercentage: this.calculateEffectiveFieldGoalPercentage(
          totalFieldGoals,
          totalThreePointers,
          totalFieldGoalAttempts
        ),
        assistToTurnoverRatio: totalTurnovers > 0 ? totalAssists / totalTurnovers : 0,
        pace: this.calculatePace(totalPossessions, gamesCount),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultOffensiveMetrics();
    }
  }

  /**
   * Calculate defensive metrics for a team
   */
  private async calculateDefensiveMetrics(
    games: NBAGame[]
  ): Promise<NBATeamAnalytics['defensiveMetrics']> {
    try {
      const completedGames = games.filter(game => game.status === 'completed');
      if (completedGames.length === 0) {
        return this.getDefaultDefensiveMetrics();
      }

      // Calculate defensive stats (opponent stats)
      let totalOpponentPoints = 0;
      let totalOpponentFieldGoals = 0;
      let totalOpponentFieldGoalAttempts = 0;
      let totalOpponentThreePointers = 0;
      let totalOpponentThreePointAttempts = 0;
      let totalDefensiveRebounds = 0;
      let totalSteals = 0;
      let totalBlocks = 0;
      let totalForcedTurnovers = 0;

      for (const game of completedGames) {
        if (game.boxScore) {
          // Get opponent stats
          const opponentStats = game.boxScore.awayTeam; // This would need proper opponent identification

          totalOpponentPoints += opponentStats.stats.points;
          totalOpponentFieldGoals += opponentStats.stats.fieldGoals.made;
          totalOpponentFieldGoalAttempts += opponentStats.stats.fieldGoals.attempted;
          totalOpponentThreePointers += opponentStats.stats.threePointers.made;
          totalOpponentThreePointAttempts += opponentStats.stats.threePointers.attempted;
          totalDefensiveRebounds += opponentStats.stats.rebounds; // This would need defensive rebounds specifically
          totalSteals += opponentStats.stats.steals;
          totalBlocks += opponentStats.stats.blocks;
          totalForcedTurnovers += opponentStats.stats.turnovers;
        }
      }

      const gamesCount = completedGames.length;

      return {
        opponentPointsPerGame: totalOpponentPoints / gamesCount,
        opponentFieldGoalPercentage:
          totalOpponentFieldGoalAttempts > 0
            ? (totalOpponentFieldGoals / totalOpponentFieldGoalAttempts) * 100
            : 0,
        opponentThreePointPercentage:
          totalOpponentThreePointAttempts > 0
            ? (totalOpponentThreePointers / totalOpponentThreePointAttempts) * 100
            : 0,
        defensiveReboundsPerGame: totalDefensiveRebounds / gamesCount,
        stealsPerGame: totalSteals / gamesCount,
        blocksPerGame: totalBlocks / gamesCount,
        defensiveRating: this.calculateDefensiveRating(totalOpponentPoints, gamesCount),
        deflections: 0, // Would need specific tracking
        contests: 0, // Would need specific tracking
        forcedTurnovers: totalForcedTurnovers / gamesCount,
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultDefensiveMetrics();
    }
  }

  /**
   * Helper methods for calculations
   */

  private estimatePossessions(stats: any): number {
    // Basic possession estimation formula
    const fieldGoalAttempts = stats.fieldGoals.attempted;
    const turnovers = stats.turnovers;
    const freeThrowAttempts = stats.freeThrows.attempted;
    const offensiveRebounds = stats.rebounds; // Would need offensive rebounds specifically

    return fieldGoalAttempts + turnovers + 0.44 * freeThrowAttempts - offensiveRebounds;
  }

  private calculateTrueShootingPercentage(
    points: number,
    fieldGoalAttempts: number,
    freeThrowAttempts: number
  ): number {
    const totalShootingAttempts = fieldGoalAttempts + 0.44 * freeThrowAttempts;
    return totalShootingAttempts > 0 ? (points / (2 * totalShootingAttempts)) * 100 : 0;
  }

  private calculateEffectiveFieldGoalPercentage(
    fieldGoals: number,
    threePointers: number,
    fieldGoalAttempts: number
  ): number {
    return fieldGoalAttempts > 0
      ? ((fieldGoals + 0.5 * threePointers) / fieldGoalAttempts) * 100
      : 0;
  }

  private calculatePace(possessions: number, games: number): number {
    return games > 0 ? (possessions / games) * 48 : 0; // Possessions per 48 minutes
  }

  private calculateDefensiveRating(opponentPoints: number, games: number): number {
    return games > 0 ? opponentPoints / games : 0;
  }

  /**
   * Default metrics for error cases
   */

  private getDefaultOffensiveMetrics(): NBATeamAnalytics['offensiveMetrics'] {
    return {
      pointsPerGame: 0,
      fieldGoalPercentage: 0,
      threePointPercentage: 0,
      freeThrowPercentage: 0,
      assistsPerGame: 0,
      turnoversPerGame: 0,
      offensiveReboundsPerGame: 0,
      possessions: 0,
      offensiveRating: 0,
      trueShootingPercentage: 0,
      effectiveFieldGoalPercentage: 0,
      assistToTurnoverRatio: 0,
      pace: 0,
    };
  }

  private getDefaultDefensiveMetrics(): NBATeamAnalytics['defensiveMetrics'] {
    return {
      opponentPointsPerGame: 0,
      opponentFieldGoalPercentage: 0,
      opponentThreePointPercentage: 0,
      defensiveReboundsPerGame: 0,
      stealsPerGame: 0,
      blocksPerGame: 0,
      defensiveRating: 0,
      deflections: 0,
      contests: 0,
      forcedTurnovers: 0,
    };
  }

  /**
   * Data retrieval methods
   */

  private async getTeamData(teamId: string): Promise<NBATeam | null> {
    try {
      const teamDoc = await getDoc(doc(db, 'nba_teams', teamId));
      return teamDoc.exists() ? (teamDoc.data() as NBATeam) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getPlayerData(playerId: string): Promise<NBAPlayer | null> {
    try {
      const playerDoc = await getDoc(doc(db, 'nba_players', playerId));
      return playerDoc.exists() ? (playerDoc.data() as NBAPlayer) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getTeamGames(teamId: string, season: number): Promise<NBAGame[]> {
    try {
      const gamesQuery = query(collection(db, 'nba_games'), where('season', '==', season));

      const gamesSnapshot = await getDocs(gamesQuery);
      return gamesSnapshot.docs
        .map(doc => doc.data() as NBAGame)
        .filter(game => game.homeTeam === teamId || game.awayTeam === teamId);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async getPlayerGames(playerId: string, season: number): Promise<any[]> {
    // Placeholder for player game data
    return [];
  }

  // Placeholder methods for additional analytics calculations
  private async calculateAdvancedTeamMetrics(
    games: NBAGame[]
  ): Promise<NBATeamAnalytics['advancedMetrics']> {
    return {
      netRating: 0,
      winPercentage: 0,
      strengthOfSchedule: 0,
      clutchRecord: { wins: 0, losses: 0 },
      homeAdvantage: 0,
      recentForm: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      marginOfVictory: 0,
      consistency: 0,
    };
  }

  private async calculateBasketballMetrics(
    games: NBAGame[]
  ): Promise<NBATeamAnalytics['basketballMetrics']> {
    return {
      reboundRate: { offensive: 0, defensive: 0, total: 0 },
      turnoverRate: 0,
      freeThrowRate: 0,
      threePointRate: 0,
      shootingEfficiency: {
        restrictedArea: 0,
        paintNonRA: 0,
        midRange: 0,
        cornerThree: 0,
        aboveBreakThree: 0,
      },
      ballMovement: {
        passesPerGame: 0,
        assistPercentage: 0,
        secondaryAssists: 0,
        potentialAssists: 0,
      },
    };
  }

  private async calculateSituationalMetrics(
    games: NBAGame[]
  ): Promise<NBATeamAnalytics['situationalMetrics']> {
    return {
      clutchPerformance: {
        offensiveRating: 0,
        defensiveRating: 0,
        netRating: 0,
        fieldGoalPercentage: 0,
      },
      restAdvantage: {
        backToBackGames: { wins: 0, losses: 0 },
        restDifferential: 0,
      },
      homeAwayDifferential: {
        home: { offensiveRating: 0, defensiveRating: 0 },
        away: { offensiveRating: 0, defensiveRating: 0 },
      },
      quarterPerformance: {
        q1: { scoringMargin: 0, shootingPercentage: 0 },
        q2: { scoringMargin: 0, shootingPercentage: 0 },
        q3: { scoringMargin: 0, shootingPercentage: 0 },
        q4: { scoringMargin: 0, shootingPercentage: 0 },
      },
    };
  }

  private async calculatePlayerImpactMetrics(
    teamId: string,
    games: NBAGame[]
  ): Promise<NBATeamAnalytics['playerImpactMetrics']> {
    return {
      starPlayerDependency: 0,
      benchContribution: 0,
      injuryImpact: 0,
      rotationStability: 0,
      leadershipMetrics: {
        veteranPresence: 0,
        clutchPlayers: [],
      },
    };
  }

  private async calculateCoachingMetrics(
    games: NBAGame[]
  ): Promise<NBATeamAnalytics['coachingMetrics']> {
    return {
      timeoutUsage: 0,
      challengeSuccess: 0,
      adjustments: {
        halftimeImpact: 0,
        inGameAdjustments: 0,
      },
      playStyle: {
        fastBreakPercentage: 0,
        halfCourtSets: 0,
        isolationFrequency: 0,
        pickAndRollFrequency: 0,
      },
    };
  }

  private async calculatePredictionFactors(
    teamId: string,
    games: NBAGame[]
  ): Promise<NBATeamAnalytics['predictionFactors']> {
    return {
      momentum: 0,
      healthIndex: 0,
      scheduleStrength: 0,
      restAdvantage: 0,
      homeStand: 0,
      travelDistance: 0,
    };
  }

  private async calculateBasicPlayerMetrics(
    games: any[]
  ): Promise<NBAPlayerAnalytics['basicMetrics']> {
    return {
      gamesPlayed: 0,
      minutesPerGame: 0,
      pointsPerGame: 0,
      reboundsPerGame: 0,
      assistsPerGame: 0,
      stealsPerGame: 0,
      blocksPerGame: 0,
      turnoversPerGame: 0,
      fieldGoalPercentage: 0,
      threePointPercentage: 0,
      freeThrowPercentage: 0,
    };
  }

  private async calculateAdvancedPlayerMetrics(
    games: any[]
  ): Promise<NBAPlayerAnalytics['advancedMetrics']> {
    return {
      playerEfficiencyRating: 0,
      trueShootingPercentage: 0,
      usageRate: 0,
      assistPercentage: 0,
      reboundPercentage: 0,
      blockPercentage: 0,
      stealPercentage: 0,
      turnoverPercentage: 0,
      winShares: 0,
      winSharesPer48: 0,
      boxPlusMinus: 0,
      valueOverReplacementPlayer: 0,
    };
  }

  private async calculatePlayerImpactMetrics(
    playerId: string,
    games: any[]
  ): Promise<NBAPlayerAnalytics['impactMetrics']> {
    return {
      onOffNetRating: 0,
      lineupNetRating: 0,
      clutchPerformance: 0,
      comebackContribution: 0,
      defenseImpact: 0,
    };
  }

  private async calculatePlayerBasketballMetrics(
    games: any[]
  ): Promise<NBAPlayerAnalytics['basketballMetrics']> {
    return {
      shotSelection: {
        restrictedAreaAttempts: 0,
        paintAttempts: 0,
        midRangeAttempts: 0,
        threePointAttempts: 0,
        shotQuality: 0,
      },
      playmaking: {
        assistToTurnoverRatio: 0,
        potentialAssists: 0,
        secondaryAssists: 0,
        ballHandlingTurnovers: 0,
      },
      rebounding: {
        offensiveReboundPercentage: 0,
        defensiveReboundPercentage: 0,
        contestedRebounds: 0,
        reboundOpportunities: 0,
      },
    };
  }

  /**
   * Public utility methods
   */

  async getTeamAnalytics(teamId: string, season: number): Promise<NBATeamAnalytics | null> {
    try {
      const analyticsDoc = await getDoc(doc(db, 'nba_team_analytics', `${teamId}_${season}`));
      return analyticsDoc.exists() ? (analyticsDoc.data() as NBATeamAnalytics) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async getPlayerAnalytics(playerId: string, season: number): Promise<NBAPlayerAnalytics | null> {
    try {
      const analyticsDoc = await getDoc(doc(db, 'nba_player_analytics', `${playerId}_${season}`));
      return analyticsDoc.exists() ? (analyticsDoc.data() as NBAPlayerAnalytics) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async getLeagueLeaders(category: string, season: number, limit: number = 10): Promise<any[]> {
    try {
      // This would need to be implemented based on specific stat categories
      return [];
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  async getTeamComparison(teamId1: string, teamId2: string, season: number): Promise<any> {
    try {
      const [team1Analytics, team2Analytics] = await Promise.all([
        this.getTeamAnalytics(teamId1, season),
        this.getTeamAnalytics(teamId2, season),
      ]);

      if (!team1Analytics || !team2Analytics) {
        throw new Error('Unable to retrieve analytics for comparison');
      }

      return {
        team1: team1Analytics,
        team2: team2Analytics,
        comparison: this.compareTeams(team1Analytics, team2Analytics),
      };
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to compare teams: ${error.message}`);
    }
  }

  private compareTeams(team1: NBATeamAnalytics, team2: NBATeamAnalytics): any {
    return {
      offensiveRatingDiff:
        team1.offensiveMetrics.offensiveRating - team2.offensiveMetrics.offensiveRating,
      defensiveRatingDiff:
        team1.defensiveMetrics.defensiveRating - team2.defensiveMetrics.defensiveRating,
      netRatingDiff: team1.advancedMetrics.netRating - team2.advancedMetrics.netRating,
      paceDiff: team1.offensiveMetrics.pace - team2.offensiveMetrics.pace,
    };
  }
}

export const nbaAnalyticsService = new NBAAnalyticsService();
