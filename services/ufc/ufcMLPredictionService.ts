// =============================================================================
// UFC ML PREDICTION SERVICE
// Deep Focus Architecture with Advanced Machine Learning Integration
// =============================================================================

import * as Sentry from '@sentry/node';

import { firebaseService } from '../firebaseService';
import { UFCAnalyticsService } from './ufcAnalyticsService';

export class UFCMLPredictionService {
  private analyticsService: UFCAnalyticsService;

  constructor() {
    this.analyticsService = new UFCAnalyticsService();
  }

  async predictFightOutcome(
    fighter1Id: string,
    fighter2Id: string,
    fightDetails: FightDetails
  ): Promise<UFCFightPrediction> {
    try {
      Sentry.addBreadcrumb({
        message: `Generating fight prediction: ${fighter1Id} vs ${fighter2Id}`,
        category: 'ufc.ml.prediction',
        level: 'info',
      });

      const [fighter1Analysis, fighter2Analysis] = await Promise.all([
        this.analyticsService.analyzeFighterPerformance(fighter1Id),
        this.analyticsService.analyzeFighterPerformance(fighter2Id),
      ]);

      const features = this.extractMLFeatures(fighter1Analysis, fighter2Analysis, fightDetails);

      // FLAG: Replace with real ML model inference
      const predictions = await this.runMLModel(features);

      const fightPrediction: UFCFightPrediction = {
        fightId: `${fighter1Id}_vs_${fighter2Id}`,
        fighter1Id,
        fighter2Id,
        predictions: {
          winProbability: {
            fighter1: predictions.fighter1Win,
            fighter2: predictions.fighter2Win,
          },
          methodPrediction: {
            knockout: predictions.koProb,
            submission: predictions.subProb,
            decision: predictions.decisionProb,
          },
          roundPrediction: predictions.roundProbs,
        },
        bettingIntelligence: await this.generateBettingInsights(predictions, fightDetails),
        confidence: predictions.confidence,
        modelVersion: '2.1.0',
        features,
        lastUpdated: new Date(),
      };

      // Store prediction in database
      await this.storePrediction(fightPrediction);

      Sentry.addBreadcrumb({
        message: `Fight prediction generated with confidence: ${predictions.confidence}`,
        category: 'ufc.ml.prediction',
        level: 'info',
      });

      return fightPrediction;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Fight prediction failed: ${error.message}`);
    }
  }

  private extractMLFeatures(fighter1: any, fighter2: any, fightDetails: FightDetails): MLFeatures {
    try {
      const features: MLFeatures = {
        // Fighter 1 striking features
        f1_striking_accuracy: fighter1.strikingAnalysis?.averageAccuracy || 0,
        f1_power_trend: this.encodeTrend(fighter1.strikingAnalysis?.powerTrend || 'stable'),
        f1_defensive_rating: fighter1.strikingAnalysis?.defensiveRating || 0,
        f1_knockdown_rate: fighter1.strikingAnalysis?.knockdownRate || 0,

        // Fighter 1 grappling features
        f1_takedown_accuracy: fighter1.grapplingAnalysis?.takedownAccuracy || 0,
        f1_takedown_defense: fighter1.grapplingAnalysis?.takedownDefenseRate || 0,
        f1_submission_threat: fighter1.grapplingAnalysis?.submissionThreat || 0,

        // Fighter 1 conditioning features
        f1_cardio_rating: fighter1.cardioAnalysis?.enduranceRating || 0,
        f1_late_round_effectiveness: fighter1.cardioAnalysis?.lateRoundEffectiveness || 0,

        // Fighter 1 mental features
        f1_fight_iq: fighter1.mentalAnalysis?.fightIQ || 0,
        f1_pressure_handling: fighter1.mentalAnalysis?.pressureHandling || 0,
        f1_adaptability: fighter1.mentalAnalysis?.adaptabilityRating || 0,

        // Fighter 1 risk factors
        f1_injury_risk: this.encodeInjuryRisk(fighter1.injuryRisk),
        f1_overall_rating: fighter1.overallRating || 0,

        // Fighter 2 features (mirror of fighter 1)
        f2_striking_accuracy: fighter2.strikingAnalysis?.averageAccuracy || 0,
        f2_power_trend: this.encodeTrend(fighter2.strikingAnalysis?.powerTrend || 'stable'),
        f2_defensive_rating: fighter2.strikingAnalysis?.defensiveRating || 0,
        f2_knockdown_rate: fighter2.strikingAnalysis?.knockdownRate || 0,
        f2_takedown_accuracy: fighter2.grapplingAnalysis?.takedownAccuracy || 0,
        f2_takedown_defense: fighter2.grapplingAnalysis?.takedownDefenseRate || 0,
        f2_submission_threat: fighter2.grapplingAnalysis?.submissionThreat || 0,
        f2_cardio_rating: fighter2.cardioAnalysis?.enduranceRating || 0,
        f2_late_round_effectiveness: fighter2.cardioAnalysis?.lateRoundEffectiveness || 0,
        f2_fight_iq: fighter2.mentalAnalysis?.fightIQ || 0,
        f2_pressure_handling: fighter2.mentalAnalysis?.pressureHandling || 0,
        f2_adaptability: fighter2.mentalAnalysis?.adaptabilityRating || 0,
        f2_injury_risk: this.encodeInjuryRisk(fighter2.injuryRisk),
        f2_overall_rating: fighter2.overallRating || 0,

        // Fight context features
        weight_class: this.encodeWeightClass(fightDetails.weightClass),
        rounds: fightDetails.rounds,
        is_title_fight: fightDetails.isTitleFight ? 1 : 0,
        is_main_event: fightDetails.isMainEvent ? 1 : 0,
        venue_altitude: fightDetails.venue?.altitude || 0,
        crowd_factor: this.encodeCrowdFactor(fightDetails.venue?.location || ''),

        // Stylistic matchup features
        striking_differential: Math.abs(
          (fighter1.strikingAnalysis?.averageAccuracy || 0) -
            (fighter2.strikingAnalysis?.averageAccuracy || 0)
        ),
        grappling_differential: Math.abs(
          (fighter1.grapplingAnalysis?.takedownAccuracy || 0) -
            (fighter2.grapplingAnalysis?.takedownAccuracy || 0)
        ),
        experience_differential: this.calculateExperienceDifferential(fighter1, fighter2),

        // Historical head-to-head
        previous_encounters: await this.getPreviousEncounters(
          fighter1.fighterId,
          fighter2.fighterId
        ),
      };

      return features;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Feature extraction failed: ${error.message}`);
    }
  }

  private async runMLModel(features: MLFeatures): Promise<any> {
    try {
      // TODO: Replace with real TensorFlow.js or cloud ML model
      // FLAG: Implement actual ML model inference

      // For now, use a sophisticated heuristic model
      const prediction = this.generateHeuristicPrediction(features);

      /*
      // Example of real ML model integration:
      
      const modelUrl = process.env.UFC_ML_MODEL_URL;
      if (!modelUrl) {
        throw new Error('ML model URL not configured');
      }

      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ML_API_KEY}`,
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        throw new Error(`ML model request failed: ${response.statusText}`);
      }

      const prediction = await response.json();
      */

      return prediction;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`ML model inference failed: ${error.message}`);
    }
  }

  private generateHeuristicPrediction(features: MLFeatures): any {
    // Sophisticated heuristic model as fallback/placeholder

    const f1Score = this.calculateFighterScore(features, 'f1');
    const f2Score = this.calculateFighterScore(features, 'f2');

    const totalScore = f1Score + f2Score;
    const fighter1Win = totalScore > 0 ? f1Score / totalScore : 0.5;
    const fighter2Win = 1 - fighter1Win;

    // Method prediction based on fighter styles
    const strikingBias = (features.f1_striking_accuracy + features.f2_striking_accuracy) / 2;
    const grapplingBias = (features.f1_takedown_accuracy + features.f2_takedown_accuracy) / 2;

    const koProb = 0.25 + strikingBias * 0.3;
    const subProb = 0.15 + grapplingBias * 0.2;
    const decisionProb = 1 - koProb - subProb;

    // Round prediction
    const cardioAvg = (features.f1_cardio_rating + features.f2_cardio_rating) / 2;
    const roundProbs = this.generateRoundProbabilities(cardioAvg, features.rounds);

    // Confidence calculation
    const confidence = Math.min(0.95, 0.5 + Math.abs(fighter1Win - 0.5));

    return {
      fighter1Win,
      fighter2Win,
      koProb,
      subProb,
      decisionProb,
      roundProbs,
      confidence,
    };
  }

  private calculateFighterScore(features: MLFeatures, prefix: string): number {
    const weights = {
      striking_accuracy: 0.2,
      defensive_rating: 0.15,
      takedown_accuracy: 0.15,
      cardio_rating: 0.15,
      fight_iq: 0.1,
      overall_rating: 0.15,
      injury_risk: -0.1, // Negative weight
    };

    let score = 0;
    score += (features[`${prefix}_striking_accuracy`] || 0) * weights.striking_accuracy;
    score += (features[`${prefix}_defensive_rating`] || 0) * weights.defensive_rating;
    score += (features[`${prefix}_takedown_accuracy`] || 0) * weights.takedown_accuracy;
    score += (features[`${prefix}_cardio_rating`] || 0) * weights.cardio_rating;
    score += (features[`${prefix}_fight_iq`] || 0) * weights.fight_iq;
    score += (features[`${prefix}_overall_rating`] || 0) * weights.overall_rating;
    score += (features[`${prefix}_injury_risk`] || 0) * weights.injury_risk;

    return score;
  }

  private generateRoundProbabilities(cardioAvg: number, maxRounds: number): number[] {
    const roundProbs: number[] = [];
    const baseProb = 0.8; // 80% chance to survive early rounds

    for (let round = 1; round <= maxRounds; round++) {
      const survivalProb = Math.max(0.1, baseProb - (round - 1) * (0.2 - cardioAvg * 0.001));
      roundProbs.push(Number(survivalProb.toFixed(3)));
    }

    return roundProbs;
  }

  private encodeTrend(trend: string): number {
    const trendMap = { improving: 1, stable: 0, declining: -1 };
    return trendMap[trend as keyof typeof trendMap] || 0;
  }

  private encodeInjuryRisk(risk: any): number {
    if (!risk) return 0;
    const riskMap = { low: 0, medium: 1, high: 2 };
    return riskMap[risk.level as keyof typeof riskMap] || 0;
  }

  private encodeWeightClass(weightClass: string): number {
    const weightClassMap = {
      strawweight: 1,
      flyweight: 2,
      bantamweight: 3,
      featherweight: 4,
      lightweight: 5,
      welterweight: 6,
      middleweight: 7,
      light_heavyweight: 8,
      heavyweight: 9,
    };
    return weightClassMap[weightClass as keyof typeof weightClassMap] || 0;
  }

  private encodeCrowdFactor(location: string): number {
    // Home country advantage
    const homeAdvantageMap: { [key: string]: number } = {
      usa: 0.1,
      brazil: 0.15,
      ireland: 0.1,
      russia: 0.1,
    };

    const normalizedLocation = location.toLowerCase();
    return homeAdvantageMap[normalizedLocation] || 0;
  }

  private calculateExperienceDifferential(fighter1: any, fighter2: any): number {
    const f1Experience = fighter1.careerStats?.totalFights || 0;
    const f2Experience = fighter2.careerStats?.totalFights || 0;
    return Math.abs(f1Experience - f2Experience);
  }

  private async getPreviousEncounters(fighter1Id: string, fighter2Id: string): Promise<number> {
    try {
      const encountersSnapshot = await firebaseService
        .collection('ufc_fights')
        .where('participants', 'array-contains-any', [fighter1Id, fighter2Id])
        .get();

      const encounters = encountersSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.participants?.includes(fighter1Id) && data.participants?.includes(fighter2Id);
      });

      return encounters.length;
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }

  private async generateBettingInsights(
    predictions: any,
    fightDetails: FightDetails
  ): Promise<BettingInsight[]> {
    try {
      const insights: BettingInsight[] = [];

      // Value betting insight
      if (predictions.confidence > 0.7) {
        insights.push({
          type: 'high_confidence_pick',
          value: predictions.fighter1Win > 0.6 ? 1 : 2,
          confidence: predictions.confidence,
          description: 'Model shows high confidence in outcome',
          expectedValue: this.calculateExpectedValue(predictions),
        });
      }

      // Method betting insight
      if (predictions.koProb > 0.4) {
        insights.push({
          type: 'knockout_likely',
          value: predictions.koProb,
          confidence: predictions.confidence * 0.8,
          description: 'High probability of knockout finish',
          expectedValue: predictions.koProb * 2 - 1, // Simple EV calculation
        });
      }

      // Round betting insight
      const earlyFinishProb = predictions.roundProbs
        .slice(0, 2)
        .reduce((sum: number, prob: number) => sum + prob, 0);
      if (earlyFinishProb > 0.6) {
        insights.push({
          type: 'early_finish',
          value: earlyFinishProb,
          confidence: predictions.confidence * 0.7,
          description: 'Fight likely to end in first 2 rounds',
          expectedValue: earlyFinishProb * 1.5 - 1,
        });
      }

      // FLAG: Add real sportsbook odds comparison
      /*
      const marketOdds = await this.getMarketOdds(fightDetails.fightId);
      const valueOpportunities = this.findValueBets(predictions, marketOdds);
      insights.push(...valueOpportunities);
      */

      return insights;
    } catch (error) {
      Sentry.captureException(error);
      return [];
    }
  }

  private calculateExpectedValue(predictions: any): number {
    // Simplified EV calculation
    const winProb = Math.max(predictions.fighter1Win, predictions.fighter2Win);
    return winProb * 2 - 1; // Assumes even odds
  }

  private async storePrediction(prediction: UFCFightPrediction): Promise<void> {
    try {
      await firebaseService
        .collection('ufc_fight_predictions')
        .doc(prediction.fightId)
        .set(prediction, { merge: true });

      Sentry.addBreadcrumb({
        message: `Stored prediction for fight: ${prediction.fightId}`,
        category: 'ufc.ml.storage',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      // Don't throw - prediction generation is more important than storage
    }
  }

  async batchPredictEvent(eventId: string): Promise<UFCFightPrediction[]> {
    try {
      const event = await firebaseService.collection('ufc_events').doc(eventId).get();

      if (!event.exists) {
        throw new Error(`Event not found: ${eventId}`);
      }

      const eventData = event.data();
      const fights = eventData?.fights || [];

      const predictions: UFCFightPrediction[] = [];

      for (const fight of fights) {
        try {
          const prediction = await this.predictFightOutcome(
            fight.fighter1Id,
            fight.fighter2Id,
            fight
          );
          predictions.push(prediction);
        } catch (error) {
          Sentry.captureException(error);
          console.error(`Failed to predict fight ${fight.id}:`, error.message);
        }
      }

      Sentry.addBreadcrumb({
        message: `Generated ${predictions.length} predictions for event ${eventId}`,
        category: 'ufc.ml.batch',
        level: 'info',
      });

      return predictions;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Batch prediction failed: ${error.message}`);
    }
  }
}

// =============================================================================
// INTERFACES
// =============================================================================

interface FightDetails {
  fightId?: string;
  weightClass: string;
  rounds: number;
  isTitleFight: boolean;
  isMainEvent: boolean;
  venue?: {
    name: string;
    location: string;
    altitude: number;
  };
}

interface MLFeatures {
  // Fighter 1 features
  f1_striking_accuracy: number;
  f1_power_trend: number;
  f1_defensive_rating: number;
  f1_knockdown_rate: number;
  f1_takedown_accuracy: number;
  f1_takedown_defense: number;
  f1_submission_threat: number;
  f1_cardio_rating: number;
  f1_late_round_effectiveness: number;
  f1_fight_iq: number;
  f1_pressure_handling: number;
  f1_adaptability: number;
  f1_injury_risk: number;
  f1_overall_rating: number;

  // Fighter 2 features
  f2_striking_accuracy: number;
  f2_power_trend: number;
  f2_defensive_rating: number;
  f2_knockdown_rate: number;
  f2_takedown_accuracy: number;
  f2_takedown_defense: number;
  f2_submission_threat: number;
  f2_cardio_rating: number;
  f2_late_round_effectiveness: number;
  f2_fight_iq: number;
  f2_pressure_handling: number;
  f2_adaptability: number;
  f2_injury_risk: number;
  f2_overall_rating: number;

  // Fight context features
  weight_class: number;
  rounds: number;
  is_title_fight: number;
  is_main_event: number;
  venue_altitude: number;
  crowd_factor: number;

  // Stylistic matchup features
  striking_differential: number;
  grappling_differential: number;
  experience_differential: number;

  // Historical data
  previous_encounters: number;
}

interface UFCFightPrediction {
  fightId: string;
  fighter1Id: string;
  fighter2Id: string;
  predictions: {
    winProbability: {
      fighter1: number;
      fighter2: number;
    };
    methodPrediction: {
      knockout: number;
      submission: number;
      decision: number;
    };
    roundPrediction: number[];
  };
  bettingIntelligence: BettingInsight[];
  confidence: number;
  modelVersion: string;
  features: MLFeatures;
  lastUpdated: Date;
}

interface BettingInsight {
  type: string;
  value: number;
  confidence: number;
  description: string;
  expectedValue: number;
}
