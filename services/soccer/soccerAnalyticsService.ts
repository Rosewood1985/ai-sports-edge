import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';
import { SoccerMatch, SoccerTeam, SoccerPlayer, TeamStats, PlayerStats, TacticalFormation } from './soccerInterfaces';

interface ExpectedGoalsModel {
  xG: number;
  xGA: number;
  xGDiff: number;
  shotQuality: number;
  bigChances: number;
  bigChancesMissed: number;
}

interface TacticalAnalysis {
  formation: TacticalFormation;
  possessionStyle: 'Possession-based' | 'Counter-attacking' | 'Direct' | 'Balanced';
  defensiveStyle: 'High-press' | 'Mid-block' | 'Low-block' | 'Hybrid';
  attackingStyle: 'Wing-play' | 'Central' | 'Set-pieces' | 'Mixed';
  tempo: 'High' | 'Medium' | 'Low';
  pressing: number; // 0-100
  compactness: number; // 0-100
}

interface MatchPrediction {
  matchId: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  expectedGoals: {
    home: number;
    away: number;
  };
  bttsYesProbability: number;
  over2_5Probability: number;
  over3_5Probability: number;
  cleanSheetProbabilities: {
    home: number;
    away: number;
  };
  cornersPrediction: {
    total: number;
    home: number;
    away: number;
  };
  cardsPrediction: {
    totalYellow: number;
    totalRed: number;
  };
  confidence: number;
  keyFactors: string[];
}

interface PlayerPerformancePrediction {
  playerId: string;
  playerName: string;
  position: string;
  goalProbability: number;
  assistProbability: number;
  shotsPrediction: number;
  keyPassesPrediction: number;
  tacklesPrediction: number;
  yellowCardProbability: number;
  redCardProbability: number;
  minutesPrediction: number;
  toScoreAnytimeProbability: number;
  toScoreFirstProbability: number;
}

interface FormAnalysis {
  last5Games: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
  last10Games: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
  homeForm?: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  awayForm?: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  formTrend: 'Improving' | 'Declining' | 'Stable';
  momentumScore: number; // 0-100
}

interface HeadToHeadAnalysis {
  totalMeetings: number;
  homeTeamWins: number;
  awayTeamWins: number;
  draws: number;
  last5Meetings: {
    homeTeamWins: number;
    awayTeamWins: number;
    draws: number;
    averageGoals: number;
  };
  venueRecord: {
    homeTeamWinsAtVenue: number;
    awayTeamWinsAtVenue: number;
    drawsAtVenue: number;
  };
  goalTrends: {
    averageHomeGoals: number;
    averageAwayGoals: number;
    over2_5Frequency: number;
    bttsFrequency: number;
  };
}

interface AdvancedMetrics {
  homeTeam: {
    xG: number;
    xGA: number;
    xGDiff: number;
    possessionAvg: number;
    passAccuracy: number;
    shotsPerGame: number;
    shotsOnTargetPerGame: number;
    tacklesPerGame: number;
    interceptionsPerGame: number;
    cornersPerGame: number;
    yellowCardsPerGame: number;
    redCardsPerGame: number;
  };
  awayTeam: {
    xG: number;
    xGA: number;
    xGDiff: number;
    possessionAvg: number;
    passAccuracy: number;
    shotsPerGame: number;
    shotsOnTargetPerGame: number;
    tacklesPerGame: number;
    interceptionsPerGame: number;
    cornersPerGame: number;
    yellowCardsPerGame: number;
    redCardsPerGame: number;
  };
}

export class SoccerAnalyticsService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async analyzeMatch(matchId: string): Promise<MatchPrediction> {
    const transaction = Sentry.startTransaction({
      name: 'soccer-match-analysis',
      op: 'analytics'
    });

    try {
      const match = await this.getMatchData(matchId);
      if (!match) {
        throw new Error(`Match not found: ${matchId}`);
      }

      const [homeTeamStats, awayTeamStats] = await Promise.all([
        this.getTeamStats(match.homeTeam.teamId, match.competition),
        this.getTeamStats(match.awayTeam.teamId, match.competition)
      ]);

      const [homeForm, awayForm] = await Promise.all([
        this.analyzeForm(match.homeTeam.teamId, match.competition),
        this.analyzeForm(match.awayTeam.teamId, match.competition)
      ]);

      const headToHead = await this.analyzeHeadToHead(
        match.homeTeam.teamId,
        match.awayTeam.teamId,
        match.competition
      );

      const advancedMetrics = await this.calculateAdvancedMetrics(
        match.homeTeam.teamId,
        match.awayTeam.teamId,
        match.competition
      );

      const tacticalAnalysis = await this.analyzeTacticalMatchup(
        match.homeTeam.teamId,
        match.awayTeam.teamId
      );

      const prediction = await this.generateMatchPrediction(
        match,
        homeTeamStats,
        awayTeamStats,
        homeForm,
        awayForm,
        headToHead,
        advancedMetrics,
        tacticalAnalysis
      );

      await this.storePrediction(matchId, prediction);
      
      transaction.setStatus('ok');
      return prediction;

    } catch (error) {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  private async getMatchData(matchId: string): Promise<SoccerMatch | null> {
    const matchDoc = await this.db.collection('soccer_matches').doc(matchId).get();
    return matchDoc.exists ? matchDoc.data() as SoccerMatch : null;
  }

  private async getTeamStats(teamId: string, competition: string): Promise<TeamStats> {
    const statsDoc = await this.db
      .collection('soccer_team_stats')
      .doc(`${teamId}_${competition}`)
      .get();

    if (!statsDoc.exists) {
      throw new Error(`Team stats not found: ${teamId} in ${competition}`);
    }

    return statsDoc.data() as TeamStats;
  }

  private async analyzeForm(teamId: string, competition: string): Promise<FormAnalysis> {
    const recentMatches = await this.db
      .collection('soccer_matches')
      .where('competition', '==', competition)
      .where('status', '==', 'FINISHED')
      .orderBy('dateTime', 'desc')
      .limit(10)
      .get();

    const teamMatches = recentMatches.docs
      .map(doc => doc.data() as SoccerMatch)
      .filter(match => 
        match.homeTeam.teamId === teamId || match.awayTeam.teamId === teamId
      );

    const last5 = teamMatches.slice(0, 5);
    const last10 = teamMatches;

    const analyzeGames = (games: SoccerMatch[]) => {
      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

      games.forEach(match => {
        const isHome = match.homeTeam.teamId === teamId;
        const teamScore = isHome ? match.homeScore || 0 : match.awayScore || 0;
        const opponentScore = isHome ? match.awayScore || 0 : match.homeScore || 0;

        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) wins++;
        else if (teamScore === opponentScore) draws++;
        else losses++;
      });

      return { wins, draws, losses, goalsFor, goalsAgainst, points: wins * 3 + draws };
    };

    const last5Analysis = analyzeGames(last5);
    const last10Analysis = analyzeGames(last10);

    // Calculate momentum score based on recent performance
    const recentPoints = last5Analysis.points;
    const maxPoints = 15; // 5 wins
    const momentumScore = Math.round((recentPoints / maxPoints) * 100);

    // Determine form trend
    const firstHalfPoints = analyzeGames(last10.slice(5)).points;
    const secondHalfPoints = last5Analysis.points;
    let formTrend: 'Improving' | 'Declining' | 'Stable';

    if (secondHalfPoints > firstHalfPoints + 2) formTrend = 'Improving';
    else if (secondHalfPoints < firstHalfPoints - 2) formTrend = 'Declining';
    else formTrend = 'Stable';

    return {
      last5Games: last5Analysis,
      last10Games: last10Analysis,
      formTrend,
      momentumScore
    };
  }

  private async analyzeHeadToHead(
    homeTeamId: string,
    awayTeamId: string,
    competition: string
  ): Promise<HeadToHeadAnalysis> {
    const h2hMatches = await this.db
      .collection('soccer_matches')
      .where('competition', '==', competition)
      .where('status', '==', 'FINISHED')
      .orderBy('dateTime', 'desc')
      .limit(20)
      .get();

    const relevantMatches = h2hMatches.docs
      .map(doc => doc.data() as SoccerMatch)
      .filter(match => 
        (match.homeTeam.teamId === homeTeamId && match.awayTeam.teamId === awayTeamId) ||
        (match.homeTeam.teamId === awayTeamId && match.awayTeam.teamId === homeTeamId)
      );

    const last5Meetings = relevantMatches.slice(0, 5);
    
    let homeTeamWins = 0, awayTeamWins = 0, draws = 0;
    let homeTeamWinsAtVenue = 0, awayTeamWinsAtVenue = 0, drawsAtVenue = 0;
    let totalGoals = 0;
    let over2_5Count = 0, bttsCount = 0;

    relevantMatches.forEach(match => {
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;
      totalGoals += homeScore + awayScore;

      if (homeScore + awayScore > 2.5) over2_5Count++;
      if (homeScore > 0 && awayScore > 0) bttsCount++;

      const isCurrentHomeTeamHome = match.homeTeam.teamId === homeTeamId;
      
      if (homeScore > awayScore) {
        if (isCurrentHomeTeamHome) {
          homeTeamWins++;
          homeTeamWinsAtVenue++;
        } else {
          awayTeamWins++;
          awayTeamWinsAtVenue++;
        }
      } else if (homeScore === awayScore) {
        draws++;
        drawsAtVenue++;
      } else {
        if (isCurrentHomeTeamHome) {
          awayTeamWins++;
          awayTeamWinsAtVenue++;
        } else {
          homeTeamWins++;
          homeTeamWinsAtVenue++;
        }
      }
    });

    // Analyze last 5 meetings
    let last5HomeWins = 0, last5AwayWins = 0, last5Draws = 0, last5Goals = 0;
    last5Meetings.forEach(match => {
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;
      last5Goals += homeScore + awayScore;

      const isCurrentHomeTeamHome = match.homeTeam.teamId === homeTeamId;
      
      if (homeScore > awayScore) {
        if (isCurrentHomeTeamHome) last5HomeWins++;
        else last5AwayWins++;
      } else if (homeScore === awayScore) {
        last5Draws++;
      } else {
        if (isCurrentHomeTeamHome) last5AwayWins++;
        else last5HomeWins++;
      }
    });

    return {
      totalMeetings: relevantMatches.length,
      homeTeamWins,
      awayTeamWins,
      draws,
      last5Meetings: {
        homeTeamWins: last5HomeWins,
        awayTeamWins: last5AwayWins,
        draws: last5Draws,
        averageGoals: last5Meetings.length > 0 ? last5Goals / last5Meetings.length : 0
      },
      venueRecord: {
        homeTeamWinsAtVenue,
        awayTeamWinsAtVenue,
        drawsAtVenue
      },
      goalTrends: {
        averageHomeGoals: 0, // Calculate based on historical data
        averageAwayGoals: 0, // Calculate based on historical data
        over2_5Frequency: relevantMatches.length > 0 ? (over2_5Count / relevantMatches.length) * 100 : 0,
        bttsFrequency: relevantMatches.length > 0 ? (bttsCount / relevantMatches.length) * 100 : 0
      }
    };
  }

  private async calculateAdvancedMetrics(
    homeTeamId: string,
    awayTeamId: string,
    competition: string
  ): Promise<AdvancedMetrics> {
    const [homeStats, awayStats] = await Promise.all([
      this.getTeamAdvancedStats(homeTeamId, competition),
      this.getTeamAdvancedStats(awayTeamId, competition)
    ]);

    return {
      homeTeam: homeStats,
      awayTeam: awayStats
    };
  }

  private async getTeamAdvancedStats(teamId: string, competition: string) {
    const statsDoc = await this.db
      .collection('soccer_advanced_stats')
      .doc(`${teamId}_${competition}`)
      .get();

    if (statsDoc.exists) {
      return statsDoc.data();
    }

    // Calculate from recent matches if advanced stats don't exist
    const recentMatches = await this.db
      .collection('soccer_matches')
      .where('competition', '==', competition)
      .where('status', '==', 'FINISHED')
      .orderBy('dateTime', 'desc')
      .limit(10)
      .get();

    // Default values - in production, calculate from match data
    return {
      xG: 1.5,
      xGA: 1.2,
      xGDiff: 0.3,
      possessionAvg: 52,
      passAccuracy: 83,
      shotsPerGame: 12,
      shotsOnTargetPerGame: 4.5,
      tacklesPerGame: 18,
      interceptionsPerGame: 12,
      cornersPerGame: 5.5,
      yellowCardsPerGame: 2.1,
      redCardsPerGame: 0.1
    };
  }

  private async analyzeTacticalMatchup(homeTeamId: string, awayTeamId: string): Promise<any> {
    // Tactical analysis would involve formation compatibility, style matchups, etc.
    // For now, return a basic structure
    return {
      homeTeamAdvantage: 'Moderate',
      awayTeamAdvantage: 'Slight',
      keyBattles: ['Midfield dominance', 'Wing play vs full-backs'],
      tacticalEdge: 'Home team'
    };
  }

  private async generateMatchPrediction(
    match: SoccerMatch,
    homeStats: TeamStats,
    awayStats: TeamStats,
    homeForm: FormAnalysis,
    awayForm: FormAnalysis,
    headToHead: HeadToHeadAnalysis,
    advancedMetrics: AdvancedMetrics,
    tacticalAnalysis: any
  ): Promise<MatchPrediction> {
    // ML-based prediction algorithm
    const homeStrength = this.calculateTeamStrength(homeStats, homeForm, advancedMetrics.homeTeam, true);
    const awayStrength = this.calculateTeamStrength(awayStats, awayForm, advancedMetrics.awayTeam, false);

    // Apply head-to-head adjustments
    const h2hAdjustment = this.calculateH2HAdjustment(headToHead);
    
    // Calculate base probabilities
    const strengthDiff = homeStrength - awayStrength + h2hAdjustment;
    
    // Use sigmoid function to convert strength difference to probabilities
    const homeWinProb = this.sigmoid(strengthDiff + 0.3); // Home advantage
    const awayWinProb = this.sigmoid(-strengthDiff - 0.1);
    const drawProb = 1 - homeWinProb - awayWinProb;

    // Normalize probabilities
    const total = homeWinProb + drawProb + awayWinProb;
    const homeWinProbability = Math.round((homeWinProb / total) * 100) / 100;
    const drawProbability = Math.round((drawProb / total) * 100) / 100;
    const awayWinProbability = Math.round((awayWinProb / total) * 100) / 100;

    // Expected goals calculation
    const homeExpectedGoals = Math.max(0.1, advancedMetrics.homeTeam.xG * (1 + homeForm.momentumScore / 200));
    const awayExpectedGoals = Math.max(0.1, advancedMetrics.awayTeam.xG * (1 + awayForm.momentumScore / 200));

    // Other market predictions
    const totalExpectedGoals = homeExpectedGoals + awayExpectedGoals;
    const over2_5Probability = this.poissonProbability(totalExpectedGoals, 2.5, 'over');
    const over3_5Probability = this.poissonProbability(totalExpectedGoals, 3.5, 'over');
    const bttsYesProbability = (1 - this.poissonProbability(homeExpectedGoals, 0, 'equal')) * 
                               (1 - this.poissonProbability(awayExpectedGoals, 0, 'equal'));

    // Clean sheet probabilities
    const homeCleanSheetProbability = this.poissonProbability(awayExpectedGoals, 0, 'equal');
    const awayCleanSheetProbability = this.poissonProbability(homeExpectedGoals, 0, 'equal');

    // Confidence calculation
    const confidence = this.calculateConfidence(
      homeWinProbability,
      drawProbability,
      awayWinProbability,
      homeForm,
      awayForm,
      headToHead
    );

    const keyFactors = this.identifyKeyFactors(
      homeStats,
      awayStats,
      homeForm,
      awayForm,
      headToHead,
      advancedMetrics
    );

    return {
      matchId: match.matchId,
      homeWinProbability,
      drawProbability,
      awayWinProbability,
      expectedGoals: {
        home: Math.round(homeExpectedGoals * 100) / 100,
        away: Math.round(awayExpectedGoals * 100) / 100
      },
      bttsYesProbability: Math.round(bttsYesProbability * 100) / 100,
      over2_5Probability: Math.round(over2_5Probability * 100) / 100,
      over3_5Probability: Math.round(over3_5Probability * 100) / 100,
      cleanSheetProbabilities: {
        home: Math.round(homeCleanSheetProbability * 100) / 100,
        away: Math.round(awayCleanSheetProbability * 100) / 100
      },
      cornersPrediction: {
        total: 10,
        home: 5.5,
        away: 4.5
      },
      cardsPrediction: {
        totalYellow: 4.2,
        totalRed: 0.2
      },
      confidence: Math.round(confidence * 100) / 100,
      keyFactors
    };
  }

  private calculateTeamStrength(
    stats: TeamStats,
    form: FormAnalysis,
    advancedStats: any,
    isHome: boolean
  ): number {
    const baseStrength = (stats.points / stats.matchesPlayed) / 3; // Points per game as ratio
    const formBonus = form.momentumScore / 100;
    const xGDiffBonus = advancedStats.xGDiff / 5; // Normalize xG difference
    const homeAdvantage = isHome ? 0.1 : 0;

    return baseStrength + formBonus * 0.3 + xGDiffBonus * 0.2 + homeAdvantage;
  }

  private calculateH2HAdjustment(headToHead: HeadToHeadAnalysis): number {
    if (headToHead.totalMeetings < 3) return 0;

    const homeWinRate = headToHead.homeTeamWins / headToHead.totalMeetings;
    const awayWinRate = headToHead.awayTeamWins / headToHead.totalMeetings;
    
    return (homeWinRate - awayWinRate) * 0.1; // Small adjustment based on historical performance
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private poissonProbability(lambda: number, k: number, type: 'equal' | 'over' | 'under'): number {
    if (type === 'equal') {
      return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
    } else if (type === 'over') {
      let prob = 0;
      for (let i = Math.floor(k) + 1; i <= 10; i++) {
        prob += this.poissonProbability(lambda, i, 'equal');
      }
      return prob;
    } else { // under
      let prob = 0;
      for (let i = 0; i <= Math.floor(k); i++) {
        prob += this.poissonProbability(lambda, i, 'equal');
      }
      return prob;
    }
  }

  private factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }

  private calculateConfidence(
    homeWin: number,
    draw: number,
    awayWin: number,
    homeForm: FormAnalysis,
    awayForm: FormAnalysis,
    headToHead: HeadToHeadAnalysis
  ): number {
    // Higher confidence when probabilities are more decisive
    const maxProb = Math.max(homeWin, draw, awayWin);
    const probabilityConfidence = maxProb;

    // Higher confidence with more recent form data
    const formConfidence = (homeForm.last5Games.wins + homeForm.last5Games.draws + homeForm.last5Games.losses) / 5;

    // Higher confidence with more head-to-head data
    const h2hConfidence = Math.min(headToHead.totalMeetings / 10, 1);

    return (probabilityConfidence * 0.5 + formConfidence * 0.3 + h2hConfidence * 0.2);
  }

  private identifyKeyFactors(
    homeStats: TeamStats,
    awayStats: TeamStats,
    homeForm: FormAnalysis,
    awayForm: FormAnalysis,
    headToHead: HeadToHeadAnalysis,
    advancedMetrics: AdvancedMetrics
  ): string[] {
    const factors: string[] = [];

    // Form factors
    if (homeForm.formTrend === 'Improving') factors.push('Home team in excellent form');
    if (awayForm.formTrend === 'Declining') factors.push('Away team struggling recently');

    // Statistical factors
    if (advancedMetrics.homeTeam.xGDiff > 0.5) factors.push('Home team creates high-quality chances');
    if (advancedMetrics.awayTeam.xGA < 1.0) factors.push('Away team has strong defensive record');

    // Head-to-head factors
    if (headToHead.totalMeetings >= 5) {
      const homeH2HWinRate = headToHead.homeTeamWins / headToHead.totalMeetings;
      if (homeH2HWinRate > 0.6) factors.push('Home team dominates historical matchups');
      if (headToHead.goalTrends.bttsFrequency > 70) factors.push('Both teams typically score in this fixture');
    }

    return factors.slice(0, 5); // Return top 5 factors
  }

  async predictPlayerPerformance(matchId: string, playerId: string): Promise<PlayerPerformancePrediction> {
    const transaction = Sentry.startTransaction({
      name: 'soccer-player-prediction',
      op: 'analytics'
    });

    try {
      const [match, playerStats] = await Promise.all([
        this.getMatchData(matchId),
        this.getPlayerStats(playerId)
      ]);

      if (!match || !playerStats) {
        throw new Error('Match or player data not found');
      }

      // Player prediction algorithm based on recent performance, opponent strength, etc.
      const prediction: PlayerPerformancePrediction = {
        playerId,
        playerName: playerStats.name,
        position: playerStats.position,
        goalProbability: this.calculateGoalProbability(playerStats, match),
        assistProbability: this.calculateAssistProbability(playerStats, match),
        shotsPrediction: this.predictShots(playerStats, match),
        keyPassesPrediction: this.predictKeyPasses(playerStats, match),
        tacklesPrediction: this.predictTackles(playerStats, match),
        yellowCardProbability: this.calculateYellowCardProbability(playerStats, match),
        redCardProbability: this.calculateRedCardProbability(playerStats, match),
        minutesPrediction: this.predictMinutes(playerStats, match),
        toScoreAnytimeProbability: this.calculateGoalProbability(playerStats, match),
        toScoreFirstProbability: this.calculateFirstGoalProbability(playerStats, match)
      };

      transaction.setStatus('ok');
      return prediction;

    } catch (error) {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  private async getPlayerStats(playerId: string): Promise<any> {
    const playerDoc = await this.db.collection('soccer_players').doc(playerId).get();
    return playerDoc.exists ? playerDoc.data() : null;
  }

  private calculateGoalProbability(playerStats: any, match: SoccerMatch): number {
    // Simplified calculation - in production, use ML model
    const baseRate = playerStats.goalsPerGame || 0.2;
    const opponentDefensiveStrength = 0.8; // Get from opponent stats
    return Math.min(0.95, baseRate / opponentDefensiveStrength);
  }

  private calculateAssistProbability(playerStats: any, match: SoccerMatch): number {
    const baseRate = playerStats.assistsPerGame || 0.15;
    return Math.min(0.9, baseRate * 1.1); // Slight adjustment for match context
  }

  private predictShots(playerStats: any, match: SoccerMatch): number {
    return playerStats.shotsPerGame || 2.5;
  }

  private predictKeyPasses(playerStats: any, match: SoccerMatch): number {
    return playerStats.keyPassesPerGame || 1.8;
  }

  private predictTackles(playerStats: any, match: SoccerMatch): number {
    return playerStats.tacklesPerGame || 2.2;
  }

  private calculateYellowCardProbability(playerStats: any, match: SoccerMatch): number {
    const baseRate = playerStats.yellowCardsPerGame || 0.15;
    const refereeStrictness = 1.0; // Get from referee data
    return Math.min(0.5, baseRate * refereeStrictness);
  }

  private calculateRedCardProbability(playerStats: any, match: SoccerMatch): number {
    return Math.min(0.1, (playerStats.redCardsPerGame || 0.01) * 1.2);
  }

  private predictMinutes(playerStats: any, match: SoccerMatch): number {
    return playerStats.averageMinutes || 75;
  }

  private calculateFirstGoalProbability(playerStats: any, match: SoccerMatch): number {
    return this.calculateGoalProbability(playerStats, match) * 0.4; // First goal is subset of anytime goal
  }

  private async storePrediction(matchId: string, prediction: MatchPrediction): Promise<void> {
    await this.db.collection('soccer_predictions').doc(matchId).set({
      ...prediction,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  async getMatchPrediction(matchId: string): Promise<MatchPrediction | null> {
    const predictionDoc = await this.db.collection('soccer_predictions').doc(matchId).get();
    return predictionDoc.exists ? predictionDoc.data() as MatchPrediction : null;
  }

  async updateLivePrediction(matchId: string, liveData: any): Promise<void> {
    const currentPrediction = await this.getMatchPrediction(matchId);
    if (!currentPrediction) return;

    // Adjust predictions based on live match events
    const adjustedPrediction = this.adjustPredictionForLiveEvents(currentPrediction, liveData);
    
    await this.db.collection('soccer_predictions').doc(matchId).update({
      ...adjustedPrediction,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isLive: true
    });
  }

  private adjustPredictionForLiveEvents(prediction: MatchPrediction, liveData: any): MatchPrediction {
    // Adjust probabilities based on current score, time, events, etc.
    // This is a simplified version - production would have sophisticated live modeling
    
    const adjustedPrediction = { ...prediction };
    
    if (liveData.currentScore) {
      const { homeScore, awayScore } = liveData.currentScore;
      const minute = liveData.minute || 0;
      
      // Adjust win probabilities based on current score and time remaining
      if (homeScore > awayScore) {
        adjustedPrediction.homeWinProbability = Math.min(0.95, prediction.homeWinProbability * 1.5);
        adjustedPrediction.awayWinProbability = Math.max(0.05, prediction.awayWinProbability * 0.5);
      } else if (awayScore > homeScore) {
        adjustedPrediction.awayWinProbability = Math.min(0.95, prediction.awayWinProbability * 1.5);
        adjustedPrediction.homeWinProbability = Math.max(0.05, prediction.homeWinProbability * 0.5);
      }
    }
    
    return adjustedPrediction;
  }
}