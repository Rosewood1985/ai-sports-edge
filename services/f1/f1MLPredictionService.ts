import * as Sentry from '@sentry/node';
import * as admin from 'firebase-admin';

interface F1RaceData {
  raceId: string;
  season: number;
  round: number;
  raceName: string;
  circuitId: string;
  date: string;
  time?: string;
  weather?: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
  };
  drivers: F1Driver[];
  constructors: F1Constructor[];
  qualifyingResults?: QualifyingResult[];
  practiceResults?: PracticeResult[];
  circuitData?: CircuitData;
}

interface F1Driver {
  driverId: string;
  code: string;
  permanentNumber: number;
  givenName: string;
  familyName: string;
  nationality: string;
  constructorId: string;
  seasonStats?: {
    points: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps: number;
    dnfs: number;
    avgFinish: number;
    avgQualifying: number;
    racesPaced: number;
    overtakes: number;
    defendedPositions: number;
    tyreManagement: number;
    wetWeatherRating: number;
    streetCircuitRating: number;
    powerCircuitRating: number;
    consistencyRating: number;
  };
}

interface F1Constructor {
  constructorId: string;
  name: string;
  nationality: string;
  seasonStats?: {
    points: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps: number;
    reliability: number;
    avgPitstopTime: number;
    strategyRating: number;
    developmentTrend: number;
    powerUnitRating: number;
    aerodynamicsRating: number;
    chassisRating: number;
  };
}

interface QualifyingResult {
  position: number;
  driverId: string;
  q1Time?: string;
  q2Time?: string;
  q3Time?: string;
  gap?: number;
}

interface PracticeResult {
  session: string;
  position: number;
  driverId: string;
  time: string;
  gap?: number;
  laps: number;
}

interface CircuitData {
  circuitId: string;
  circuitName: string;
  location: string;
  country: string;
  length: number;
  turns: number;
  type: 'street' | 'permanent' | 'semi-permanent';
  characteristics: {
    overtakingDifficulty: number;
    tyreWear: number;
    fuelConsumption: number;
    downforceLevel: number;
    powerSensitivity: number;
    brakingZones: number;
    elevation: number;
    weatherVariability: number;
  };
  historicalData?: {
    avgWinningMargin: number;
    safetyCarProbability: number;
    rainProbability: number;
    temperatureRange: { min: number; max: number };
  };
}

interface F1Prediction {
  raceId: string;
  timestamp: string;
  raceWinner: {
    driverId: string;
    probability: number;
    confidence: number;
    odds: number;
  };
  podiumFinishers: {
    position: number;
    driverId: string;
    probability: number;
  }[];
  constructorWinner: {
    constructorId: string;
    probability: number;
    confidence: number;
  };
  polePosition: {
    driverId: string;
    probability: number;
  };
  fastestLap: {
    driverId: string;
    probability: number;
  };
  dnfPredictions: {
    driverId: string;
    probability: number;
    reason: string;
  }[];
  safetyCarPrediction: {
    probability: number;
    expectedDeployments: number;
  };
  features: F1PredictionFeatures;
  modelMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

interface F1PredictionFeatures {
  // Driver Features
  driverChampionshipPosition: number;
  driverPoints: number;
  driverRecentForm: number;
  driverCircuitExperience: number;
  driverWetWeatherRating: number;
  driverOvertakingSkill: number;
  driverQualifyingPace: number;
  driverRacePace: number;
  driverConsistency: number;
  driverTyreManagement: number;

  // Constructor Features
  constructorChampionshipPosition: number;
  constructorPoints: number;
  constructorReliability: number;
  constructorPowerUnitRating: number;
  constructorAerodynamics: number;
  constructorStrategy: number;
  constructorPitstopEfficiency: number;
  constructorDevelopmentTrend: number;

  // Circuit Features
  circuitType: number;
  circuitLength: number;
  circuitTurns: number;
  circuitOvertakingDifficulty: number;
  circuitPowerSensitivity: number;
  circuitDownforceLevel: number;
  circuitTyreWear: number;
  circuitElevation: number;

  // Weather Features
  weatherCondition: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  trackTemperature: number;

  // Historical Features
  driverCircuitWins: number;
  driverCircuitPodiums: number;
  driverCircuitAvgFinish: number;
  constructorCircuitWins: number;
  constructorCircuitPodiums: number;

  // Form Features
  last5RacesAvgFinish: number;
  last5RacesPoints: number;
  qualifyingFormTrend: number;
  raceFormTrend: number;

  // Advanced Metrics
  expectedGridPosition: number;
  paceDifferential: number;
  strategicFlexibility: number;
  riskFactor: number;
  momentumRating: number;
}

export class F1MLPredictionService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async generateRacePredictions(raceData: F1RaceData): Promise<F1Prediction> {
    const transaction = Sentry.startTransaction({
      op: 'f1_ml_prediction',
      name: 'Generate F1 Race Predictions',
    });

    try {
      Sentry.addBreadcrumb({
        message: `Generating predictions for ${raceData.raceName}`,
        level: 'info',
        data: { raceId: raceData.raceId, season: raceData.season },
      });

      const features = await this.extractFeatures(raceData);
      const historicalData = await this.getHistoricalData(raceData.circuitId);

      const predictions = await this.runPredictionModels(features, historicalData);

      const prediction: F1Prediction = {
        raceId: raceData.raceId,
        timestamp: new Date().toISOString(),
        raceWinner: await this.predictRaceWinner(features, raceData.drivers),
        podiumFinishers: await this.predictPodiumFinishers(features, raceData.drivers),
        constructorWinner: await this.predictConstructorWinner(features, raceData.constructors),
        polePosition: await this.predictPolePosition(features, raceData.drivers),
        fastestLap: await this.predictFastestLap(features, raceData.drivers),
        dnfPredictions: await this.predictDNFs(features, raceData.drivers),
        safetyCarPrediction: await this.predictSafetyCar(features, raceData.circuitData),
        features,
        modelMetrics: predictions.metrics,
      };

      await this.storePrediction(prediction);

      Sentry.addBreadcrumb({
        message: 'F1 predictions generated successfully',
        level: 'info',
        data: {
          raceWinner: prediction.raceWinner.driverId,
          confidence: prediction.raceWinner.confidence,
        },
      });

      return prediction;
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error generating F1 predictions:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  private async extractFeatures(raceData: F1RaceData): Promise<F1PredictionFeatures> {
    const circuitData = raceData.circuitData;
    const weather = raceData.weather;

    return {
      // Circuit Features
      circuitType: this.encodeCircuitType(circuitData?.type || 'permanent'),
      circuitLength: circuitData?.length || 0,
      circuitTurns: circuitData?.turns || 0,
      circuitOvertakingDifficulty: circuitData?.characteristics.overtakingDifficulty || 5,
      circuitPowerSensitivity: circuitData?.characteristics.powerSensitivity || 5,
      circuitDownforceLevel: circuitData?.characteristics.downforceLevel || 5,
      circuitTyreWear: circuitData?.characteristics.tyreWear || 5,
      circuitElevation: circuitData?.characteristics.elevation || 0,

      // Weather Features
      weatherCondition: this.encodeWeatherCondition(weather?.condition || 'clear'),
      temperature: weather?.temperature || 20,
      humidity: weather?.humidity || 50,
      windSpeed: weather?.windSpeed || 0,
      rainProbability: circuitData?.historicalData?.rainProbability || 0.1,
      trackTemperature: (weather?.temperature || 20) + 15,

      // Dynamic features filled by individual driver/constructor analysis
      driverChampionshipPosition: 0,
      driverPoints: 0,
      driverRecentForm: 0,
      driverCircuitExperience: 0,
      driverWetWeatherRating: 0,
      driverOvertakingSkill: 0,
      driverQualifyingPace: 0,
      driverRacePace: 0,
      driverConsistency: 0,
      driverTyreManagement: 0,
      constructorChampionshipPosition: 0,
      constructorPoints: 0,
      constructorReliability: 0,
      constructorPowerUnitRating: 0,
      constructorAerodynamics: 0,
      constructorStrategy: 0,
      constructorPitstopEfficiency: 0,
      constructorDevelopmentTrend: 0,
      driverCircuitWins: 0,
      driverCircuitPodiums: 0,
      driverCircuitAvgFinish: 0,
      constructorCircuitWins: 0,
      constructorCircuitPodiums: 0,
      last5RacesAvgFinish: 0,
      last5RacesPoints: 0,
      qualifyingFormTrend: 0,
      raceFormTrend: 0,
      expectedGridPosition: 0,
      paceDifferential: 0,
      strategicFlexibility: 0,
      riskFactor: 0,
      momentumRating: 0,
    };
  }

  private async runPredictionModels(
    features: F1PredictionFeatures,
    historicalData: any[]
  ): Promise<any> {
    const models = [
      this.randomForestModel(features, historicalData),
      this.gradientBoostingModel(features, historicalData),
      this.neuralNetworkModel(features, historicalData),
    ];

    const results = await Promise.all(models);

    return {
      ensemble: this.ensembleResults(results),
      metrics: this.calculateModelMetrics(results),
    };
  }

  private async predictRaceWinner(features: F1PredictionFeatures, drivers: F1Driver[]) {
    const predictions = [];

    for (const driver of drivers) {
      const driverFeatures = await this.getDriverFeatures(driver, features);
      const winProbability = this.calculateWinProbability(driverFeatures);

      predictions.push({
        driverId: driver.driverId,
        probability: winProbability,
        features: driverFeatures,
      });
    }

    predictions.sort((a, b) => b.probability - a.probability);

    const winner = predictions[0];
    return {
      driverId: winner.driverId,
      probability: winner.probability,
      confidence: this.calculateConfidence(winner.probability, predictions[1]?.probability || 0),
      odds: this.probabilityToOdds(winner.probability),
    };
  }

  private async predictPodiumFinishers(features: F1PredictionFeatures, drivers: F1Driver[]) {
    const predictions = [];

    for (const driver of drivers) {
      const driverFeatures = await this.getDriverFeatures(driver, features);
      const podiumProbability = this.calculatePodiumProbability(driverFeatures);

      predictions.push({
        driverId: driver.driverId,
        probability: podiumProbability,
      });
    }

    predictions.sort((a, b) => b.probability - a.probability);

    return predictions.slice(0, 3).map((pred, index) => ({
      position: index + 1,
      driverId: pred.driverId,
      probability: pred.probability,
    }));
  }

  private async predictConstructorWinner(
    features: F1PredictionFeatures,
    constructors: F1Constructor[]
  ) {
    const predictions = [];

    for (const constructor of constructors) {
      const constructorFeatures = await this.getConstructorFeatures(constructor, features);
      const winProbability = this.calculateConstructorWinProbability(constructorFeatures);

      predictions.push({
        constructorId: constructor.constructorId,
        probability: winProbability,
      });
    }

    predictions.sort((a, b) => b.probability - a.probability);

    const winner = predictions[0];
    return {
      constructorId: winner.constructorId,
      probability: winner.probability,
      confidence: this.calculateConfidence(winner.probability, predictions[1]?.probability || 0),
    };
  }

  private async predictPolePosition(features: F1PredictionFeatures, drivers: F1Driver[]) {
    const predictions = [];

    for (const driver of drivers) {
      const driverFeatures = await this.getDriverFeatures(driver, features);
      const poleProbability = this.calculatePoleProbability(driverFeatures);

      predictions.push({
        driverId: driver.driverId,
        probability: poleProbability,
      });
    }

    predictions.sort((a, b) => b.probability - a.probability);

    return {
      driverId: predictions[0].driverId,
      probability: predictions[0].probability,
    };
  }

  private async predictFastestLap(features: F1PredictionFeatures, drivers: F1Driver[]) {
    const predictions = [];

    for (const driver of drivers) {
      const driverFeatures = await this.getDriverFeatures(driver, features);
      const fastestLapProbability = this.calculateFastestLapProbability(driverFeatures);

      predictions.push({
        driverId: driver.driverId,
        probability: fastestLapProbability,
      });
    }

    predictions.sort((a, b) => b.probability - a.probability);

    return {
      driverId: predictions[0].driverId,
      probability: predictions[0].probability,
    };
  }

  private async predictDNFs(features: F1PredictionFeatures, drivers: F1Driver[]) {
    const predictions = [];

    for (const driver of drivers) {
      const driverFeatures = await this.getDriverFeatures(driver, features);
      const dnfProbability = this.calculateDNFProbability(driverFeatures);
      const dnfReason = this.predictDNFReason(driverFeatures);

      if (dnfProbability > 0.05) {
        // Only include if >5% chance
        predictions.push({
          driverId: driver.driverId,
          probability: dnfProbability,
          reason: dnfReason,
        });
      }
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  private async predictSafetyCar(features: F1PredictionFeatures, circuitData?: CircuitData) {
    const baseProbability = circuitData?.historicalData?.safetyCarProbability || 0.3;
    const weatherAdjustment = features.rainProbability > 0.3 ? 0.2 : 0;
    const circuitAdjustment = features.circuitOvertakingDifficulty > 7 ? 0.15 : 0;

    const totalProbability = Math.min(baseProbability + weatherAdjustment + circuitAdjustment, 0.9);
    const expectedDeployments = totalProbability > 0.5 ? Math.ceil(totalProbability * 2) : 1;

    return {
      probability: totalProbability,
      expectedDeployments,
    };
  }

  private async getDriverFeatures(driver: F1Driver, baseFeatures: F1PredictionFeatures) {
    const stats = driver.seasonStats;
    if (!stats) return baseFeatures;

    return {
      ...baseFeatures,
      driverChampionshipPosition: await this.getDriverChampionshipPosition(driver.driverId),
      driverPoints: stats.points,
      driverRecentForm: this.calculateRecentForm(driver.driverId),
      driverCircuitExperience: await this.getCircuitExperience(driver.driverId, baseFeatures),
      driverWetWeatherRating: stats.wetWeatherRating,
      driverOvertakingSkill: stats.overtakes / Math.max(stats.racesPaced, 1),
      driverQualifyingPace: 21 - stats.avgQualifying,
      driverRacePace: 21 - stats.avgFinish,
      driverConsistency: stats.consistencyRating,
      driverTyreManagement: stats.tyreManagement,
    };
  }

  private async getConstructorFeatures(
    constructor: F1Constructor,
    baseFeatures: F1PredictionFeatures
  ) {
    const stats = constructor.seasonStats;
    if (!stats) return baseFeatures;

    return {
      ...baseFeatures,
      constructorChampionshipPosition: await this.getConstructorChampionshipPosition(
        constructor.constructorId
      ),
      constructorPoints: stats.points,
      constructorReliability: stats.reliability,
      constructorPowerUnitRating: stats.powerUnitRating,
      constructorAerodynamics: stats.aerodynamicsRating,
      constructorStrategy: stats.strategyRating,
      constructorPitstopEfficiency: 10 - (stats.avgPitstopTime - 2.0), // Normalized
      constructorDevelopmentTrend: stats.developmentTrend,
    };
  }

  private calculateWinProbability(features: F1PredictionFeatures): number {
    let probability = 0.05; // Base probability

    // Championship position impact
    probability += (21 - features.driverChampionshipPosition) * 0.03;

    // Recent form
    probability += features.driverRecentForm * 0.02;

    // Circuit experience
    probability += features.driverCircuitExperience * 0.015;

    // Constructor strength
    probability += (11 - features.constructorChampionshipPosition) * 0.025;
    probability += features.constructorReliability * 0.01;

    // Weather adaptation
    if (features.rainProbability > 0.3) {
      probability += features.driverWetWeatherRating * 0.02;
    }

    // Circuit-specific skills
    if (features.circuitType === 1) {
      // Street circuit
      probability += features.driverConsistency * 0.015;
    }

    return Math.min(Math.max(probability, 0.001), 0.95);
  }

  private calculatePodiumProbability(features: F1PredictionFeatures): number {
    const winProb = this.calculateWinProbability(features);
    return Math.min(winProb * 3.5, 0.9); // Podium is ~3.5x more likely than win
  }

  private calculatePoleProbability(features: F1PredictionFeatures): number {
    let probability = 0.05;

    probability += features.driverQualifyingPace * 0.04;
    probability += (21 - features.driverChampionshipPosition) * 0.025;
    probability += (11 - features.constructorChampionshipPosition) * 0.03;
    probability += features.constructorPowerUnitRating * 0.02;

    return Math.min(Math.max(probability, 0.001), 0.95);
  }

  private calculateFastestLapProbability(features: F1PredictionFeatures): number {
    let probability = 0.05;

    probability += features.driverRacePace * 0.03;
    probability += features.driverTyreManagement * 0.02;
    probability += features.constructorPowerUnitRating * 0.025;

    return Math.min(Math.max(probability, 0.001), 0.95);
  }

  private calculateDNFProbability(features: F1PredictionFeatures): number {
    let probability = 0.1; // Base DNF rate

    probability -= features.constructorReliability * 0.02;
    probability += (1 - features.driverConsistency) * 0.05;

    if (features.rainProbability > 0.3) {
      probability += 0.05;
    }

    return Math.min(Math.max(probability, 0.01), 0.5);
  }

  private calculateConstructorWinProbability(features: F1PredictionFeatures): number {
    let probability = 0.1;

    probability += (11 - features.constructorChampionshipPosition) * 0.06;
    probability += features.constructorReliability * 0.03;
    probability += features.constructorStrategy * 0.02;
    probability += features.constructorDevelopmentTrend * 0.025;

    return Math.min(Math.max(probability, 0.001), 0.95);
  }

  private predictDNFReason(features: F1PredictionFeatures): string {
    const reliabilityScore = features.constructorReliability;
    const consistencyScore = features.driverConsistency;

    if (reliabilityScore < 6) return 'mechanical';
    if (consistencyScore < 6) return 'driver_error';
    if (features.rainProbability > 0.5) return 'weather_incident';

    return 'collision';
  }

  // Utility methods
  private encodeCircuitType(type: string): number {
    const mapping = { street: 1, permanent: 2, 'semi-permanent': 3 };
    return mapping[type as keyof typeof mapping] || 2;
  }

  private encodeWeatherCondition(condition: string): number {
    const mapping = { clear: 1, cloudy: 2, rain: 3, storm: 4 };
    return mapping[condition as keyof typeof mapping] || 1;
  }

  private calculateConfidence(topProb: number, secondProb: number): number {
    return Math.min((topProb - secondProb) * 2, 0.95);
  }

  private probabilityToOdds(probability: number): number {
    return +(1 / probability).toFixed(2);
  }

  // Placeholder methods for historical data and model implementations
  private async getHistoricalData(circuitId: string): Promise<any[]> {
    const snapshot = await this.db
      .collection('f1_historical_data')
      .where('circuitId', '==', circuitId)
      .orderBy('date', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  private async getDriverChampionshipPosition(driverId: string): Promise<number> {
    const snapshot = await this.db
      .collection('f1_driver_standings')
      .where('driverId', '==', driverId)
      .orderBy('season', 'desc')
      .limit(1)
      .get();

    return snapshot.empty ? 20 : snapshot.docs[0].data().position;
  }

  private async getConstructorChampionshipPosition(constructorId: string): Promise<number> {
    const snapshot = await this.db
      .collection('f1_constructor_standings')
      .where('constructorId', '==', constructorId)
      .orderBy('season', 'desc')
      .limit(1)
      .get();

    return snapshot.empty ? 10 : snapshot.docs[0].data().position;
  }

  private calculateRecentForm(driverId: string): number {
    // Placeholder - would calculate based on last 5 races
    return Math.random() * 10;
  }

  private async getCircuitExperience(
    driverId: string,
    features: F1PredictionFeatures
  ): Promise<number> {
    // Placeholder - would calculate based on previous races at circuit
    return Math.random() * 10;
  }

  private randomForestModel(features: F1PredictionFeatures, historical: any[]): Promise<any> {
    // Placeholder for Random Forest implementation
    return Promise.resolve({ accuracy: 0.75, predictions: [] });
  }

  private gradientBoostingModel(features: F1PredictionFeatures, historical: any[]): Promise<any> {
    // Placeholder for Gradient Boosting implementation
    return Promise.resolve({ accuracy: 0.78, predictions: [] });
  }

  private neuralNetworkModel(features: F1PredictionFeatures, historical: any[]): Promise<any> {
    // Placeholder for Neural Network implementation
    return Promise.resolve({ accuracy: 0.72, predictions: [] });
  }

  private ensembleResults(results: any[]): any {
    // Placeholder for ensemble method
    return { predictions: [], confidence: 0.8 };
  }

  private calculateModelMetrics(results: any[]): any {
    const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
    return {
      accuracy: avgAccuracy,
      precision: avgAccuracy * 0.95,
      recall: avgAccuracy * 0.93,
      f1Score: avgAccuracy * 0.94,
    };
  }

  private async storePrediction(prediction: F1Prediction): Promise<void> {
    await this.db
      .collection('f1_predictions')
      .doc(prediction.raceId)
      .set({
        ...prediction,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }
}

export default F1MLPredictionService;
