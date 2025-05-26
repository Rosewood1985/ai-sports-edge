// =============================================================================
// UFC ANALYTICS SERVICE
// Deep Focus Architecture with Advanced Fighter Analysis
// =============================================================================

import { firebaseService } from '../firebaseService';
import * as Sentry from '@sentry/node';

export class UFCAnalyticsService {
  async analyzeFighterPerformance(fighterId: string): Promise<FighterAnalysis> {
    try {
      Sentry.addBreadcrumb({
        message: `Analyzing fighter performance: ${fighterId}`,
        category: 'ufc.analytics',
        level: 'info',
      });

      const fighter = await firebaseService.collection('ufc_fighters').doc(fighterId).get();

      if (!fighter.exists) {
        throw new Error(`Fighter not found: ${fighterId}`);
      }

      const fightHistory = await this.getFightHistory(fighterId);

      const analysis: FighterAnalysis = {
        fighterId,
        strikingAnalysis: await this.analyzeStriking(fightHistory),
        grapplingAnalysis: await this.analyzeGrappling(fightHistory),
        cardioAnalysis: await this.analyzeCardio(fightHistory),
        mentalAnalysis: await this.analyzeMental(fightHistory),
        injuryRisk: await this.assessInjuryRisk(fightHistory),
        overallRating: 0, // Will be calculated
        lastUpdated: new Date(),
      };

      analysis.overallRating = this.calculateOverallRating(analysis);

      // Store analysis in database
      await this.storeAnalysis(fighterId, analysis);

      return analysis;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Fighter analysis failed: ${error.message}`);
    }
  }

  private async analyzeStriking(fightHistory: any[]): Promise<StrikingAnalysis> {
    try {
      const strikingStats = fightHistory.map(fight => ({
        accuracy: fight.strikingAccuracy || 0,
        significantStrikes: fight.significantStrikes || 0,
        defense: fight.strikingDefense || 0,
        knockdowns: fight.knockdowns || 0,
        headStrikes: fight.headStrikes || 0,
        bodyStrikes: fight.bodyStrikes || 0,
        legStrikes: fight.legStrikes || 0,
      }));

      const analysis: StrikingAnalysis = {
        averageAccuracy: this.calculateAverage(strikingStats, 'accuracy'),
        powerTrend: this.calculateTrend(strikingStats, 'significantStrikes'),
        defensiveRating: this.calculateDefensiveRating(strikingStats),
        knockdownRate: this.calculateKnockdownRate(strikingStats),
        targetDistribution: this.analyzeTargetDistribution(strikingStats),
        reachAdvantageImpact: this.analyzeReachImpact(fightHistory),
        pressureRating: this.calculatePressureRating(strikingStats),
      };

      return analysis;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  private async analyzeGrappling(fightHistory: any[]): Promise<GrapplingAnalysis> {
    try {
      const grapplingStats = fightHistory.map(fight => ({
        takedowns: fight.takedowns || 0,
        takedownAttempts: fight.takedownAttempts || 0,
        takedownDefense: fight.takedownDefense || 0,
        submissionAttempts: fight.submissionAttempts || 0,
        controlTime: fight.controlTime || 0,
        guardPasses: fight.guardPasses || 0,
      }));

      return {
        takedownAccuracy: this.calculateTakedownAccuracy(grapplingStats),
        takedownDefenseRate: this.calculateAverage(grapplingStats, 'takedownDefense'),
        submissionThreat: this.calculateSubmissionThreat(grapplingStats),
        groundControl: this.calculateGroundControl(grapplingStats),
        scrambleSuccess: this.calculateScrambleSuccess(grapplingStats),
        positionAdvancement: this.analyzePositionAdvancement(grapplingStats),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultGrapplingAnalysis();
    }
  }

  private async analyzeCardio(fightHistory: any[]): Promise<CardioAnalysis> {
    try {
      const cardioStats = fightHistory.map(fight => ({
        round: fight.rounds || 0,
        strikesPerRound: this.calculateStrikesPerRound(fight),
        activityDecline: this.calculateActivityDecline(fight),
        lateRoundPerformance: fight.lateRoundStats || {},
      }));

      return {
        enduranceRating: this.calculateEnduranceRating(cardioStats),
        paceManagement: this.analyzePaceManagement(cardioStats),
        lateRoundEffectiveness: this.calculateLateRoundEffectiveness(cardioStats),
        recoveryAbility: this.analyzeRecoveryAbility(fightHistory),
        workRate: this.calculateWorkRate(cardioStats),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultCardioAnalysis();
    }
  }

  private async analyzeMental(fightHistory: any[]): Promise<MentalAnalysis> {
    try {
      const mentalStats = fightHistory.map(fight => ({
        adversityResponse: fight.adversityResponse || 0,
        comebackWins: fight.comebackWin || false,
        pressureFighting: fight.pressureFighting || 0,
        adaptability: fight.adaptability || 0,
      }));

      return {
        clutchPerformance: this.calculateClutchPerformance(mentalStats),
        adaptabilityRating: this.calculateAdaptability(mentalStats),
        pressureHandling: this.analyzePressureHandling(mentalStats),
        mentalResilience: this.calculateMentalResilience(mentalStats),
        fightIQ: this.calculateFightIQ(fightHistory),
      };
    } catch (error) {
      Sentry.captureException(error);
      return this.getDefaultMentalAnalysis();
    }
  }

  private async assessInjuryRisk(fightHistory: any[]): Promise<InjuryRisk> {
    try {
      const riskFactors: string[] = [];
      let riskScore = 0;

      // Analyze damage taken
      const damageTaken = fightHistory.reduce((total, fight) => {
        return total + (fight.damageTaken || 0);
      }, 0);

      if (damageTaken > 1000) {
        riskFactors.push('High cumulative damage');
        riskScore += 2;
      }

      // Analyze recent activity
      const recentFights = fightHistory.slice(0, 3);
      const avgTimeBetweenFights = this.calculateAvgTimeBetweenFights(recentFights);

      if (avgTimeBetweenFights < 90) {
        riskFactors.push('Short recovery periods');
        riskScore += 1;
      }

      // Analyze age and fight mileage
      const totalFights = fightHistory.length;
      if (totalFights > 25) {
        riskFactors.push('High fight mileage');
        riskScore += 1;
      }

      let level: 'low' | 'medium' | 'high' = 'low';
      if (riskScore >= 3) level = 'high';
      else if (riskScore >= 2) level = 'medium';

      return {
        level,
        factors: riskFactors,
        score: riskScore,
        recommendation: this.generateInjuryRiskRecommendation(level, riskFactors),
      };
    } catch (error) {
      Sentry.captureException(error);
      return { level: 'low', factors: [], score: 0, recommendation: '' };
    }
  }

  private calculateAverage(data: any[], field: string): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return Number((sum / data.length).toFixed(2));
  }

  private calculateTrend(data: any[], field: string): 'improving' | 'declining' | 'stable' {
    if (data.length < 3) return 'stable';

    const recent = data.slice(-3);
    const older = data.slice(-6, -3);

    if (older.length === 0) return 'stable';

    const recentAvg = this.calculateAverage(recent, field);
    const olderAvg = this.calculateAverage(older, field);

    const difference = recentAvg - olderAvg;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private calculateDefensiveRating(strikingStats: any[]): number {
    if (strikingStats.length === 0) return 0;

    const avgDefense = this.calculateAverage(strikingStats, 'defense');
    const consistencyBonus = this.calculateConsistency(strikingStats, 'defense');

    return Math.min(100, avgDefense + consistencyBonus);
  }

  private calculateConsistency(data: any[], field: string): number {
    if (data.length < 2) return 0;

    const values = data.map(item => item[field] || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency = bonus points
    return Math.max(0, 10 - standardDev);
  }

  private async getFightHistory(fighterId: string): Promise<any[]> {
    try {
      const fightsSnapshot = await firebaseService
        .collection('ufc_fights')
        .where('participants', 'array-contains', fighterId)
        .orderBy('date', 'desc')
        .limit(20) // Analyze last 20 fights
        .get();

      return fightsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private calculateKnockdownRate(strikingStats: any[]): number {
    if (strikingStats.length === 0) return 0;

    const totalKnockdowns = strikingStats.reduce((sum, stat) => sum + (stat.knockdowns || 0), 0);
    return Number((totalKnockdowns / strikingStats.length).toFixed(2));
  }

  private analyzeTargetDistribution(strikingStats: any[]): any {
    if (strikingStats.length === 0) return { head: 0, body: 0, legs: 0 };

    const totals = strikingStats.reduce(
      (acc, stat) => ({
        head: acc.head + (stat.headStrikes || 0),
        body: acc.body + (stat.bodyStrikes || 0),
        legs: acc.legs + (stat.legStrikes || 0),
      }),
      { head: 0, body: 0, legs: 0 }
    );

    const total = totals.head + totals.body + totals.legs;
    if (total === 0) return { head: 0, body: 0, legs: 0 };

    return {
      head: Number(((totals.head / total) * 100).toFixed(1)),
      body: Number(((totals.body / total) * 100).toFixed(1)),
      legs: Number(((totals.legs / total) * 100).toFixed(1)),
    };
  }

  private analyzeReachImpact(fightHistory: any[]): number {
    // FLAG: Implement reach advantage analysis
    return 0;
  }

  private calculatePressureRating(strikingStats: any[]): number {
    // FLAG: Implement pressure fighting analysis
    return 0;
  }

  private calculateTakedownAccuracy(grapplingStats: any[]): number {
    if (grapplingStats.length === 0) return 0;

    const totalTakedowns = grapplingStats.reduce((sum, stat) => sum + (stat.takedowns || 0), 0);
    const totalAttempts = grapplingStats.reduce(
      (sum, stat) => sum + (stat.takedownAttempts || 0),
      0
    );

    if (totalAttempts === 0) return 0;
    return Number(((totalTakedowns / totalAttempts) * 100).toFixed(1));
  }

  private calculateSubmissionThreat(grapplingStats: any[]): number {
    if (grapplingStats.length === 0) return 0;

    const avgSubmissionAttempts = this.calculateAverage(grapplingStats, 'submissionAttempts');
    return Math.min(100, avgSubmissionAttempts * 20); // Scale to 0-100
  }

  private calculateGroundControl(grapplingStats: any[]): number {
    return this.calculateAverage(grapplingStats, 'controlTime');
  }

  private calculateScrambleSuccess(grapplingStats: any[]): number {
    // FLAG: Implement scramble success analysis
    return 0;
  }

  private analyzePositionAdvancement(grapplingStats: any[]): number {
    return this.calculateAverage(grapplingStats, 'guardPasses');
  }

  private calculateStrikesPerRound(fight: any): number[] {
    // FLAG: Implement round-by-round strike analysis
    return [];
  }

  private calculateActivityDecline(fight: any): number {
    // FLAG: Implement activity decline analysis
    return 0;
  }

  private calculateEnduranceRating(cardioStats: any[]): number {
    // FLAG: Implement endurance rating calculation
    return 0;
  }

  private analyzePaceManagement(cardioStats: any[]): number {
    // FLAG: Implement pace management analysis
    return 0;
  }

  private calculateLateRoundEffectiveness(cardioStats: any[]): number {
    // FLAG: Implement late round effectiveness analysis
    return 0;
  }

  private analyzeRecoveryAbility(fightHistory: any[]): number {
    // FLAG: Implement recovery ability analysis
    return 0;
  }

  private calculateWorkRate(cardioStats: any[]): number {
    // FLAG: Implement work rate calculation
    return 0;
  }

  private calculateClutchPerformance(mentalStats: any[]): number {
    // FLAG: Implement clutch performance calculation
    return 0;
  }

  private calculateAdaptability(mentalStats: any[]): number {
    return this.calculateAverage(mentalStats, 'adaptability');
  }

  private analyzePressureHandling(mentalStats: any[]): number {
    return this.calculateAverage(mentalStats, 'pressureFighting');
  }

  private calculateMentalResilience(mentalStats: any[]): number {
    return this.calculateAverage(mentalStats, 'adversityResponse');
  }

  private calculateFightIQ(fightHistory: any[]): number {
    // FLAG: Implement fight IQ calculation
    return 0;
  }

  private calculateAvgTimeBetweenFights(fights: any[]): number {
    if (fights.length < 2) return 365; // Default to 1 year if insufficient data

    const timeDiffs: number[] = [];
    for (let i = 0; i < fights.length - 1; i++) {
      const date1 = new Date(fights[i].date);
      const date2 = new Date(fights[i + 1].date);
      const diffDays = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
      timeDiffs.push(diffDays);
    }

    return timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  }

  private generateInjuryRiskRecommendation(level: string, factors: string[]): string {
    switch (level) {
      case 'high':
        return 'Extended recovery period recommended. Consider medical evaluation.';
      case 'medium':
        return 'Monitor closely. Standard recovery protocols should be followed.';
      default:
        return 'Low risk. Normal training and competition schedule acceptable.';
    }
  }

  private calculateOverallRating(analysis: FighterAnalysis): number {
    // Weighted average of all analysis components
    const weights = {
      striking: 0.3,
      grappling: 0.25,
      cardio: 0.2,
      mental: 0.15,
      injuryRisk: 0.1,
    };

    let score = 0;
    score += (analysis.strikingAnalysis.averageAccuracy || 0) * weights.striking;
    score += (analysis.grapplingAnalysis.takedownAccuracy || 0) * weights.grappling;
    score += (analysis.cardioAnalysis.enduranceRating || 0) * weights.cardio;
    score += (analysis.mentalAnalysis.fightIQ || 0) * weights.mental;

    // Injury risk penalty
    const injuryPenalty =
      analysis.injuryRisk.level === 'high' ? 10 : analysis.injuryRisk.level === 'medium' ? 5 : 0;
    score -= injuryPenalty;

    return Math.max(0, Math.min(100, score));
  }

  private async storeAnalysis(fighterId: string, analysis: FighterAnalysis): Promise<void> {
    try {
      await firebaseService
        .collection('ufc_fighter_analytics')
        .doc(fighterId)
        .set(analysis, { merge: true });
    } catch (error) {
      Sentry.captureException(error);
      // Don't throw - analysis generation is more important than storage
    }
  }

  private getDefaultGrapplingAnalysis(): GrapplingAnalysis {
    return {
      takedownAccuracy: 0,
      takedownDefenseRate: 0,
      submissionThreat: 0,
      groundControl: 0,
      scrambleSuccess: 0,
      positionAdvancement: 0,
    };
  }

  private getDefaultCardioAnalysis(): CardioAnalysis {
    return {
      enduranceRating: 0,
      paceManagement: 0,
      lateRoundEffectiveness: 0,
      recoveryAbility: 0,
      workRate: 0,
    };
  }

  private getDefaultMentalAnalysis(): MentalAnalysis {
    return {
      clutchPerformance: 0,
      adaptabilityRating: 0,
      pressureHandling: 0,
      mentalResilience: 0,
      fightIQ: 0,
    };
  }
}

// =============================================================================
// INTERFACES
// =============================================================================

interface FighterAnalysis {
  fighterId: string;
  strikingAnalysis: StrikingAnalysis;
  grapplingAnalysis: GrapplingAnalysis;
  cardioAnalysis: CardioAnalysis;
  mentalAnalysis: MentalAnalysis;
  injuryRisk: InjuryRisk;
  overallRating: number;
  lastUpdated: Date;
}

interface StrikingAnalysis {
  averageAccuracy: number;
  powerTrend: 'improving' | 'declining' | 'stable';
  defensiveRating: number;
  knockdownRate: number;
  targetDistribution: any;
  reachAdvantageImpact: number;
  pressureRating: number;
}

interface GrapplingAnalysis {
  takedownAccuracy: number;
  takedownDefenseRate: number;
  submissionThreat: number;
  groundControl: number;
  scrambleSuccess: number;
  positionAdvancement: number;
}

interface CardioAnalysis {
  enduranceRating: number;
  paceManagement: number;
  lateRoundEffectiveness: number;
  recoveryAbility: number;
  workRate: number;
}

interface MentalAnalysis {
  clutchPerformance: number;
  adaptabilityRating: number;
  pressureHandling: number;
  mentalResilience: number;
  fightIQ: number;
}

interface InjuryRisk {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  score: number;
  recommendation: string;
}
