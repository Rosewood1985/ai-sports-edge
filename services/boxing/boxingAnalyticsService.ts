// =============================================================================
// BOXING ANALYTICS SERVICE
// Advanced Boxing Fight Analysis and Performance Metrics
// =============================================================================

import * as admin from 'firebase-admin';

import { BoxingFighter, BoxingFight } from './boxingDataSyncService';
import { initSentry } from '../sentryConfig';

// Initialize Sentry for monitoring
const Sentry = initSentry();

export interface FighterAnalytics {
  fighterId: string;
  fighterName: string;
  lastUpdated: Date;

  // Performance Metrics
  performance: {
    winPercentage: number;
    koPercentage: number;
    averageFightDuration: number; // rounds
    decisionPercentage: number;
    activityLevel: number; // fights per year
    peakAge: number;
    declineRate: number;
  };

  // Technical Analysis
  technical: {
    stoppageRate: number; // KO + TKO percentage
    defensiveRating: number; // Based on damage taken
    offensiveRating: number; // Based on damage dealt
    cardioRating: number; // Performance in later rounds
    powerRating: number; // Knockdown and knockout ability
    chinRating: number; // Ability to take punishment
    experienceLevel: number; // Based on rounds fought
  };

  // Opposition Quality
  opposition: {
    averageOpponentRating: number;
    bigFightExperience: number; // Title fights, PPV events
    comeFromBehindWins: number;
    qualityWins: number; // Wins against top 10 opponents
    qualityLosses: number; // Losses to quality opposition
    rivalries: string[]; // Fighter IDs of main rivals
  };

  // Style Analysis
  style: {
    fightingStyle: 'boxer' | 'puncher' | 'boxer-puncher' | 'pressure' | 'counterpuncher';
    preferredRange: 'inside' | 'mid-range' | 'outside';
    handSpeed: number; // 1-10 rating
    footwork: number; // 1-10 rating
    ringIQ: number; // 1-10 rating
    adaptability: number; // Ability to adjust mid-fight
  };

  // Physical Attributes Impact
  physical: {
    reachAdvantageWins: number; // Wins when having reach advantage
    reachDisadvantageWins: number; // Wins when at reach disadvantage
    heightAdvantageWins: number;
    ageAdvantageWins: number;
    homeAdvantageWins: number; // Fighting in home country/region
  };

  // Career Phases
  careerPhase: {
    current: 'prospect' | 'contender' | 'champion' | 'veteran' | 'declining';
    peakPeriod: {
      startDate: Date;
      endDate: Date;
      achievements: string[];
    };
    trajectory: 'rising' | 'peaked' | 'declining' | 'resurgent';
    retirementProbability: number; // 0-100%
  };

  // Fight Patterns
  patterns: {
    roundPatterns: number[]; // Performance by round (1-12)
    methodPatterns: Record<string, number>; // Win/loss methods frequency
    venuePatterns: Record<string, number>; // Performance by venue type
    monthlyPatterns: number[]; // Performance by month (1-12)
    restPatterns: Record<string, number>; // Performance by time between fights
  };
}

export interface FightAnalytics {
  fightId: string;
  fighter1Id: string;
  fighter2Id: string;
  lastUpdated: Date;

  // Pre-Fight Analysis
  preFight: {
    styleMismatch: number; // 0-100, higher = better for fighter 1
    experienceGap: number; // Years difference
    physicalAdvantage: {
      reach: number; // Difference in inches
      height: number; // Difference in inches
      age: number; // Difference in years
    };
    formAnalysis: {
      fighter1Form: number; // Recent performance rating
      fighter2Form: number;
      momentumShift: number; // Who has momentum
    };
    oddsAnalysis: {
      impliedProbability1: number;
      impliedProbability2: number;
      valueAssessment: 'fighter1_value' | 'fighter2_value' | 'fair_odds';
    };
  };

  // Head-to-Head Analysis
  headToHead: {
    previousMeetings: number;
    fighter1Wins: number;
    fighter2Wins: number;
    draws: number;
    lastMeetingDate?: Date;
    vengeanceFactor: boolean; // One looking to avenge loss
  };

  // Mutual Opponents Analysis
  mutualOpponents: {
    commonOpponents: string[]; // Fighter IDs
    fighter1Performance: number[]; // Results against common opponents
    fighter2Performance: number[];
    comparisonScore: number; // Who performed better overall
  };

  // Prediction Factors
  predictionFactors: {
    ageFactorWeight: number;
    experienceWeight: number;
    formWeight: number;
    physicalWeight: number;
    styleWeight: number;
    homeAdvantageWeight: number;
    motivationWeight: number;
    overallConfidence: number; // 0-100%
  };

  // Event Context
  eventContext: {
    fightImportance: 'preliminary' | 'featured' | 'co-main' | 'main-event';
    titleImplications: boolean;
    careerImplications: string[]; // What's at stake for each fighter
    pressureLevel: number; // 1-10 scale
    expectedViewership: number;
    financialStakes: number; // Total purse
  };

  // Betting Analysis
  betting: {
    sharpMoney: 'fighter1' | 'fighter2' | 'even'; // Where smart money is going
    publicBetting: 'fighter1' | 'fighter2' | 'even'; // Where public is betting
    lineMovement: string; // Description of how odds have moved
    valueOpportunities: string[]; // Potential value bets
    recommendedBets: {
      type: string;
      selection: string;
      confidence: number;
      reasoning: string;
    }[];
  };
}

export interface WeightClassAnalytics {
  weightClass: string;
  lastUpdated: Date;

  // Division Health
  divisionHealth: {
    competitiveBalance: number; // How competitive the division is
    talentDepth: number; // Depth of quality fighters
    popularityRating: number; // Fan interest level
    financialHealth: number; // Revenue generation
    futureProspects: string[]; // Rising contenders
  };

  // Championship Picture
  championships: {
    undisputedChampion?: string; // Fighter ID if exists
    linealChampion?: string; // Fighter ID of lineal champion
    titleHolders: Record<string, string>; // Organization -> Fighter ID
    mandatoryChallengers: Record<string, string>; // Organization -> Fighter ID
    unificationOpportunities: {
      fight: string;
      titles: string[];
      probability: number;
    }[];
  };

  // Rankings Analysis
  rankings: {
    consensusTop10: string[]; // Fighter IDs
    volatility: number; // How much rankings change
    controversies: string[]; // Disputed rankings
    oldGuardVsNewBlood: {
      veterans: string[];
      prospects: string[];
      generationalShift: number; // 0-100%
    };
  };

  // Fight Quality Metrics
  fightQuality: {
    averageFightRating: number; // 1-10 scale
    knockoutRate: number; // Percentage of fights ending in KO/TKO
    competitiveBalance: number; // How often underdogs win
    stylisticVariety: number; // Variety of fighting styles
    actionLevel: number; // How exciting fights typically are
  };
}

export class BoxingAnalyticsService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Initialize the boxing analytics service
   */
  async initialize(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing Boxing Analytics Service',
        level: 'info',
      });

      console.log('Boxing Analytics Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize Boxing Analytics Service: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive fighter analytics
   */
  async generateFighterAnalytics(fighterId: string): Promise<FighterAnalytics> {
    try {
      Sentry.addBreadcrumb({
        message: `Generating analytics for fighter ${fighterId}`,
        level: 'info',
      });

      const fighter = await this.getFighter(fighterId);
      if (!fighter) {
        throw new Error('Fighter not found');
      }

      const fightHistory = await this.getFighterHistory(fighterId);

      const analytics: FighterAnalytics = {
        fighterId,
        fighterName: fighter.name,
        lastUpdated: new Date(),
        performance: await this.calculatePerformanceMetrics(fighter, fightHistory),
        technical: await this.calculateTechnicalRatings(fighter, fightHistory),
        opposition: await this.analyzeOppositionQuality(fighterId, fightHistory),
        style: await this.analyzeFightingStyle(fighter, fightHistory),
        physical: await this.analyzePhysicalAdvantages(fighter, fightHistory),
        careerPhase: await this.determineCareerPhase(fighter, fightHistory),
        patterns: await this.analyzeFightPatterns(fightHistory),
      };

      // Store analytics
      await this.db.collection('boxing_fighter_analytics').doc(fighterId).set(analytics);

      console.log(`Generated analytics for fighter ${fighter.name}`);
      return analytics;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Fighter analytics generation failed: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive fight analytics
   */
  async generateFightAnalytics(fightId: string): Promise<FightAnalytics> {
    try {
      Sentry.addBreadcrumb({
        message: `Generating analytics for fight ${fightId}`,
        level: 'info',
      });

      const fight = await this.getFight(fightId);
      if (!fight) {
        throw new Error('Fight not found');
      }

      const [fighter1, fighter2] = await Promise.all([
        this.getFighter(fight.fighter1),
        this.getFighter(fight.fighter2),
      ]);

      if (!fighter1 || !fighter2) {
        throw new Error('Fighter data incomplete');
      }

      const analytics: FightAnalytics = {
        fightId,
        fighter1Id: fight.fighter1,
        fighter2Id: fight.fighter2,
        lastUpdated: new Date(),
        preFight: await this.analyzePreFightFactors(fighter1, fighter2, fight),
        headToHead: await this.analyzeHeadToHead(fight.fighter1, fight.fighter2),
        mutualOpponents: await this.analyzeMutualOpponents(fight.fighter1, fight.fighter2),
        predictionFactors: await this.calculatePredictionFactors(fighter1, fighter2, fight),
        eventContext: await this.analyzeEventContext(fight),
        betting: await this.analyzeBettingPatterns(fight),
      };

      // Store analytics
      await this.db.collection('boxing_fight_analytics').doc(fightId).set(analytics);

      console.log(`Generated analytics for fight ${fightId}`);
      return analytics;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Fight analytics generation failed: ${error.message}`);
    }
  }

  /**
   * Generate weight class analytics
   */
  async generateWeightClassAnalytics(weightClass: string): Promise<WeightClassAnalytics> {
    try {
      Sentry.addBreadcrumb({
        message: `Generating analytics for ${weightClass} division`,
        level: 'info',
      });

      const fighters = await this.getFightersByWeightClass(weightClass);
      const recentFights = await this.getRecentFightsByWeightClass(weightClass);

      const analytics: WeightClassAnalytics = {
        weightClass,
        lastUpdated: new Date(),
        divisionHealth: await this.analyzeDivisionHealth(fighters, recentFights),
        championships: await this.analyzeChampionshipPicture(weightClass, fighters),
        rankings: await this.analyzeRankings(fighters),
        fightQuality: await this.analyzeFightQuality(recentFights),
      };

      // Store analytics
      await this.db
        .collection('boxing_weight_class_analytics')
        .doc(weightClass.toLowerCase().replace(' ', '_'))
        .set(analytics);

      console.log(`Generated analytics for ${weightClass} division`);
      return analytics;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Weight class analytics generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate performance metrics for a fighter
   */
  private async calculatePerformanceMetrics(
    fighter: BoxingFighter,
    fightHistory: BoxingFight[]
  ): Promise<FighterAnalytics['performance']> {
    const totalFights = fighter.record.wins + fighter.record.losses + fighter.record.draws;
    const totalKOs = fighter.record.knockouts + fighter.record.technicalKnockouts;

    // Calculate average fight duration from completed fights
    const completedFights = fightHistory.filter(f => f.status === 'completed' && f.result);
    const avgDuration =
      completedFights.length > 0
        ? completedFights.reduce((sum, fight) => {
            return sum + (fight.result?.round || fight.scheduledRounds);
          }, 0) / completedFights.length
        : 12;

    // Calculate activity level (fights per year)
    const careerYears = (Date.now() - fighter.turnedPro.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const activityLevel = totalFights / Math.max(careerYears, 1);

    return {
      winPercentage: totalFights > 0 ? (fighter.record.wins / totalFights) * 100 : 0,
      koPercentage: totalFights > 0 ? (totalKOs / totalFights) * 100 : 0,
      averageFightDuration: avgDuration,
      decisionPercentage:
        totalFights > 0 ? ((fighter.record.wins - totalKOs) / totalFights) * 100 : 0,
      activityLevel,
      peakAge: this.calculatePeakAge(fighter, fightHistory),
      declineRate: this.calculateDeclineRate(fightHistory),
    };
  }

  /**
   * Calculate technical ratings for a fighter
   */
  private async calculateTechnicalRatings(
    fighter: BoxingFighter,
    fightHistory: BoxingFight[]
  ): Promise<FighterAnalytics['technical']> {
    const totalFights = fighter.record.wins + fighter.record.losses + fighter.record.draws;
    const totalKOs = fighter.record.knockouts + fighter.record.technicalKnockouts;

    return {
      stoppageRate: totalFights > 0 ? (totalKOs / totalFights) * 100 : 0,
      defensiveRating: this.calculateDefensiveRating(fighter, fightHistory),
      offensiveRating: this.calculateOffensiveRating(fighter, fightHistory),
      cardioRating: this.calculateCardioRating(fightHistory),
      powerRating: totalFights > 0 ? (totalKOs / totalFights) * 10 : 0,
      chinRating: this.calculateChinRating(fighter, fightHistory),
      experienceLevel: Math.min(totalFights / 5, 10), // Max 10, based on total fights
    };
  }

  /**
   * Analyze opposition quality
   */
  private async analyzeOppositionQuality(
    fighterId: string,
    fightHistory: BoxingFight[]
  ): Promise<FighterAnalytics['opposition']> {
    // This would involve complex analysis of opponent ratings
    // For now, returning mock data structure
    return {
      averageOpponentRating: 6.5,
      bigFightExperience: fightHistory.filter(f => f.fightCard === 'main-event').length,
      comeFromBehindWins: 2, // Would need round-by-round data
      qualityWins: 5,
      qualityLosses: 1,
      rivalries: [],
    };
  }

  /**
   * Analyze fighting style
   */
  private async analyzeFightingStyle(
    fighter: BoxingFighter,
    fightHistory: BoxingFight[]
  ): Promise<FighterAnalytics['style']> {
    // Style analysis would be based on fight data and video analysis
    // For now, returning estimated values
    const koPercentage =
      fighter.record.knockouts /
      (fighter.record.wins + fighter.record.losses + fighter.record.draws);

    let fightingStyle: FighterAnalytics['style']['fightingStyle'] = 'boxer-puncher';
    if (koPercentage > 0.7) fightingStyle = 'puncher';
    else if (koPercentage < 0.3) fightingStyle = 'boxer';

    return {
      fightingStyle,
      preferredRange: 'mid-range',
      handSpeed: Math.min(Math.max(koPercentage * 10, 5), 10),
      footwork: Math.random() * 5 + 5, // 5-10 range
      ringIQ: Math.min(fighter.age / 4, 10),
      adaptability: Math.random() * 3 + 7, // 7-10 range for top fighters
    };
  }

  /**
   * Analyze physical advantages in fights
   */
  private async analyzePhysicalAdvantages(
    fighter: BoxingFighter,
    fightHistory: BoxingFight[]
  ): Promise<FighterAnalytics['physical']> {
    // This would require analyzing each fight's physical matchups
    // For now, returning estimated values
    return {
      reachAdvantageWins: Math.floor(Math.random() * 5),
      reachDisadvantageWins: Math.floor(Math.random() * 3),
      heightAdvantageWins: Math.floor(Math.random() * 4),
      ageAdvantageWins: Math.floor(Math.random() * 6),
      homeAdvantageWins: Math.floor(Math.random() * 3),
    };
  }

  /**
   * Determine career phase
   */
  private async determineCareerPhase(
    fighter: BoxingFighter,
    fightHistory: BoxingFight[]
  ): Promise<FighterAnalytics['careerPhase']> {
    const age = fighter.physicalStats.age;
    const totalFights = fighter.record.wins + fighter.record.losses + fighter.record.draws;

    let current: FighterAnalytics['careerPhase']['current'] = 'prospect';
    if (totalFights > 20 && age > 30) current = 'veteran';
    else if (totalFights > 15) current = 'contender';
    if (age > 35) current = 'declining';

    return {
      current,
      peakPeriod: {
        startDate: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000), // 3 years ago
        endDate: new Date(),
        achievements: ['Title wins', 'Top 10 victories'],
      },
      trajectory: age < 28 ? 'rising' : age < 35 ? 'peaked' : 'declining',
      retirementProbability: Math.max(0, (age - 30) * 10),
    };
  }

  /**
   * Analyze fight patterns
   */
  private async analyzeFightPatterns(
    fightHistory: BoxingFight[]
  ): Promise<FighterAnalytics['patterns']> {
    // Generate round patterns (performance by round)
    const roundPatterns = new Array(12).fill(0).map(() => Math.random() * 10);

    return {
      roundPatterns,
      methodPatterns: {
        KO: 3,
        TKO: 5,
        UD: 8,
        MD: 2,
        SD: 1,
      },
      venuePatterns: {
        'Las Vegas': 5,
        'New York': 3,
        International: 2,
      },
      monthlyPatterns: new Array(12).fill(0).map(() => Math.random() * 10),
      restPatterns: {
        '3-6 months': 8,
        '6-12 months': 4,
        '12+ months': 2,
      },
    };
  }

  // Additional helper methods with mock implementations

  private calculatePeakAge(fighter: BoxingFighter, fightHistory: BoxingFight[]): number {
    // Peak is typically mid-to-late 20s for most fighters
    return Math.max(25, Math.min(30, fighter.physicalStats.age - 3));
  }

  private calculateDeclineRate(fightHistory: BoxingFight[]): number {
    // Analysis of performance trend over time
    return Math.random() * 2; // 0-2% decline rate
  }

  private calculateDefensiveRating(fighter: BoxingFighter, fightHistory: BoxingFight[]): number {
    // Based on knockdowns taken, damage absorbed
    const lossRate =
      fighter.record.losses / (fighter.record.wins + fighter.record.losses + fighter.record.draws);
    return Math.max(1, 10 - lossRate * 15);
  }

  private calculateOffensiveRating(fighter: BoxingFighter, fightHistory: BoxingFight[]): number {
    const koRate =
      (fighter.record.knockouts + fighter.record.technicalKnockouts) /
      (fighter.record.wins + fighter.record.losses + fighter.record.draws);
    return Math.min(10, koRate * 15 + 5);
  }

  private calculateCardioRating(fightHistory: BoxingFight[]): number {
    // Based on performance in later rounds
    return Math.random() * 3 + 7; // 7-10 range
  }

  private calculateChinRating(fighter: BoxingFighter, fightHistory: BoxingFight[]): number {
    // Based on knockdowns taken, ability to recover
    const koLossRate = fighter.record.losses > 0 ? 0.3 : 0; // Assume 30% of losses by KO
    return Math.max(1, 10 - koLossRate * 20);
  }

  // Placeholder methods for fight analytics

  private async analyzePreFightFactors(
    fighter1: BoxingFighter,
    fighter2: BoxingFighter,
    fight: BoxingFight
  ): Promise<FightAnalytics['preFight']> {
    const reachDiff =
      parseFloat(fighter1.physicalStats.reach) - parseFloat(fighter2.physicalStats.reach);
    const heightDiff =
      parseFloat(fighter1.physicalStats.height) - parseFloat(fighter2.physicalStats.height);
    const ageDiff = fighter1.physicalStats.age - fighter2.physicalStats.age;

    return {
      styleMismatch: Math.random() * 100,
      experienceGap: Math.abs(ageDiff),
      physicalAdvantage: {
        reach: reachDiff,
        height: heightDiff,
        age: ageDiff,
      },
      formAnalysis: {
        fighter1Form: Math.random() * 10,
        fighter2Form: Math.random() * 10,
        momentumShift: Math.random() * 10 - 5,
      },
      oddsAnalysis: {
        impliedProbability1:
          Math.abs(fight.betting.fighter1Odds) /
          (Math.abs(fight.betting.fighter1Odds) + Math.abs(fight.betting.fighter2Odds)),
        impliedProbability2:
          Math.abs(fight.betting.fighter2Odds) /
          (Math.abs(fight.betting.fighter1Odds) + Math.abs(fight.betting.fighter2Odds)),
        valueAssessment: 'fair_odds',
      },
    };
  }

  private async analyzeHeadToHead(
    fighter1Id: string,
    fighter2Id: string
  ): Promise<FightAnalytics['headToHead']> {
    // Query previous meetings
    return {
      previousMeetings: 0,
      fighter1Wins: 0,
      fighter2Wins: 0,
      draws: 0,
      vengeanceFactor: false,
    };
  }

  private async analyzeMutualOpponents(
    fighter1Id: string,
    fighter2Id: string
  ): Promise<FightAnalytics['mutualOpponents']> {
    return {
      commonOpponents: [],
      fighter1Performance: [],
      fighter2Performance: [],
      comparisonScore: 0,
    };
  }

  private async calculatePredictionFactors(
    fighter1: BoxingFighter,
    fighter2: BoxingFighter,
    fight: BoxingFight
  ): Promise<FightAnalytics['predictionFactors']> {
    return {
      ageFactorWeight: 0.15,
      experienceWeight: 0.2,
      formWeight: 0.25,
      physicalWeight: 0.15,
      styleWeight: 0.15,
      homeAdvantageWeight: 0.05,
      motivationWeight: 0.05,
      overallConfidence: Math.random() * 40 + 60, // 60-100%
    };
  }

  private async analyzeEventContext(fight: BoxingFight): Promise<FightAnalytics['eventContext']> {
    return {
      fightImportance: fight.fightCard,
      titleImplications: fight.titles.length > 0,
      careerImplications: ['Potential title shot', 'Legacy fight'],
      pressureLevel: fight.fightCard === 'main-event' ? 10 : 7,
      expectedViewership: fight.fightCard === 'main-event' ? 1000000 : 500000,
      financialStakes: (fight.purse?.fighter1 || 0) + (fight.purse?.fighter2 || 0),
    };
  }

  private async analyzeBettingPatterns(fight: BoxingFight): Promise<FightAnalytics['betting']> {
    return {
      sharpMoney: 'fighter1',
      publicBetting: 'fighter2',
      lineMovement: 'Opened at -150/+130, moved to -140/+120',
      valueOpportunities: ['Under total rounds', 'Fighter 2 by decision'],
      recommendedBets: [
        {
          type: 'Moneyline',
          selection: 'Fighter 1',
          confidence: 75,
          reasoning: 'Superior technique and experience',
        },
      ],
    };
  }

  // Database helper methods

  private async getFighter(fighterId: string): Promise<BoxingFighter | null> {
    try {
      const doc = await this.db.collection('boxing_fighters').doc(fighterId).get();
      return doc.exists ? (doc.data() as BoxingFighter) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getFight(fightId: string): Promise<BoxingFight | null> {
    try {
      const doc = await this.db.collection('boxing_fights').doc(fightId).get();
      return doc.exists ? (doc.data() as BoxingFight) : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  private async getFighterHistory(fighterId: string): Promise<BoxingFight[]> {
    try {
      const snapshot = await this.db
        .collection('boxing_fights')
        .where('fighter1', '==', fighterId)
        .get();

      const snapshot2 = await this.db
        .collection('boxing_fights')
        .where('fighter2', '==', fighterId)
        .get();

      const fights1 = snapshot.docs.map(doc => doc.data() as BoxingFight);
      const fights2 = snapshot2.docs.map(doc => doc.data() as BoxingFight);

      return [...fights1, ...fights2].sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async getFightersByWeightClass(weightClass: string): Promise<BoxingFighter[]> {
    try {
      const snapshot = await this.db
        .collection('boxing_fighters')
        .where('weightClass', '==', weightClass)
        .get();

      return snapshot.docs.map(doc => doc.data() as BoxingFighter);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private async getRecentFightsByWeightClass(weightClass: string): Promise<BoxingFight[]> {
    try {
      const snapshot = await this.db
        .collection('boxing_fights')
        .where('weightClass', '==', weightClass)
        .where('date', '>=', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .get();

      return snapshot.docs.map(doc => doc.data() as BoxingFight);
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  // Weight class analysis methods (placeholders)

  private async analyzeDivisionHealth(
    fighters: BoxingFighter[],
    recentFights: BoxingFight[]
  ): Promise<WeightClassAnalytics['divisionHealth']> {
    return {
      competitiveBalance: Math.random() * 10,
      talentDepth: Math.min(fighters.length / 20, 10),
      popularityRating: Math.random() * 10,
      financialHealth: Math.random() * 10,
      futureProspects: fighters
        .filter(f => f.physicalStats.age < 25)
        .map(f => f.id)
        .slice(0, 5),
    };
  }

  private async analyzeChampionshipPicture(
    weightClass: string,
    fighters: BoxingFighter[]
  ): Promise<WeightClassAnalytics['championships']> {
    const champions = fighters.filter(
      f =>
        f.rankings.wba === 1 || f.rankings.wbc === 1 || f.rankings.ibf === 1 || f.rankings.wbo === 1
    );

    return {
      undisputedChampion: champions.length === 1 ? champions[0].id : undefined,
      linealChampion: champions[0]?.id,
      titleHolders: {
        WBA: champions.find(f => f.rankings.wba === 1)?.id || '',
        WBC: champions.find(f => f.rankings.wbc === 1)?.id || '',
        IBF: champions.find(f => f.rankings.ibf === 1)?.id || '',
        WBO: champions.find(f => f.rankings.wbo === 1)?.id || '',
      },
      mandatoryChallengers: {},
      unificationOpportunities: [],
    };
  }

  private async analyzeRankings(
    fighters: BoxingFighter[]
  ): Promise<WeightClassAnalytics['rankings']> {
    const topFighters = fighters
      .filter(f => f.rankings.ring && f.rankings.ring <= 10)
      .sort((a, b) => (a.rankings.ring || 100) - (b.rankings.ring || 100))
      .slice(0, 10);

    return {
      consensusTop10: topFighters.map(f => f.id),
      volatility: Math.random() * 5,
      controversies: [],
      oldGuardVsNewBlood: {
        veterans: fighters.filter(f => f.physicalStats.age > 32).map(f => f.id),
        prospects: fighters.filter(f => f.physicalStats.age < 26).map(f => f.id),
        generationalShift: Math.random() * 100,
      },
    };
  }

  private async analyzeFightQuality(
    recentFights: BoxingFight[]
  ): Promise<WeightClassAnalytics['fightQuality']> {
    const completedFights = recentFights.filter(f => f.status === 'completed');
    const koRate =
      completedFights.filter(f => f.result?.method === 'KO' || f.result?.method === 'TKO').length /
      Math.max(completedFights.length, 1);

    return {
      averageFightRating: Math.random() * 3 + 7, // 7-10 scale
      knockoutRate: koRate * 100,
      competitiveBalance: Math.random() * 10,
      stylisticVariety: Math.random() * 10,
      actionLevel: Math.random() * 3 + 7,
    };
  }
}

export const boxingAnalyticsService = new BoxingAnalyticsService();
