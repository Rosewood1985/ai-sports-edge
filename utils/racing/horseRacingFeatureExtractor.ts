/**
 * Horse Racing Feature Extractor - Phase 2: Data Transformation Pipeline
 * ML-compatible feature extraction for Horse Racing data
 * Part of Racing Data Integration Plan
 */

import {
  MLFeatureExtractor,
  MLFeatureVector,
  FeatureValidationResult,
  TransformedFeatureVector,
} from '../../types/racing/commonTypes';
import {
  StandardizedHorseRace,
  StandardizedHorseRunner,
  HorseRacingMLFeatures,
} from '../../types/racing/horseRacingTypes';

/**
 * Horse Racing Feature Extractor
 * Converts horse racing data to ML-compatible features
 */
export class HorseRacingFeatureExtractor
  implements MLFeatureExtractor<{ race: StandardizedHorseRace; runner: StandardizedHorseRunner }>
{
  async extractFeatures(rawData: {
    race: StandardizedHorseRace;
    runner: StandardizedHorseRunner;
  }): Promise<MLFeatureVector> {
    const { race, runner } = rawData;

    return {
      id: `horse_racing_${race.id}_${runner.horseId}`,
      sport: 'horse_racing',
      eventId: race.id,
      participantId: runner.horseId,

      features: {
        horse: this.extractHorseFeatures(runner.horse, race),
        jockey: this.extractJockeyFeatures(runner.jockey, race),
        trainer: this.extractTrainerFeatures(runner.trainer, race),
        race: this.extractRaceContextFeatures(race, runner),
        market: this.extractMarketFeatures(runner, race),
        track: this.extractTrackDistanceFeatures(race, runner),
        breeding: this.extractBreedingFeatures(runner.horse),
        preparation: this.extractPreparationFeatures(runner),
        situational: this.extractSituationalFeatures(race, runner),
        form: this.extractFormFeatures(runner.horse, race),
      },

      metadata: {
        version: '2.0.0',
        extractedAt: new Date().toISOString(),
        dataQuality: this.assessHorseRacingDataQuality(race, runner),
        completeness: this.calculateHorseRacingCompleteness(race, runner),
        featureCount: 0, // Will be calculated
        normalizationApplied: true,
        scalingMethod: 'standard',
        missingValueStrategy: 'domain_specific',
        outlierHandling: 'clip_to_percentile',
      },

      targets: this.extractHorseRacingTargets(race, runner),
    };
  }

  validateFeatures(features: MLFeatureVector): FeatureValidationResult {
    const validation = {
      completeness: this.validateHorseRacingCompleteness(features),
      accuracy: this.validateHorseRacingAccuracy(features),
      consistency: this.validateHorseRacingConsistency(features),
      timeliness: this.validateHorseRacingTimeliness(features),
    };

    const overallScore =
      (validation.completeness.score +
        validation.accuracy.score +
        validation.consistency.score +
        validation.timeliness.score) /
      4;

    return {
      isValid: overallScore >= 0.7,
      quality: this.scoreToQuality(overallScore),
      score: overallScore,
      validation,
      recommendations: this.generateHorseRacingRecommendations(validation),
      featureImportance: this.calculateHorseRacingFeatureImportance(features),
    };
  }

  async transformForModel(
    features: MLFeatureVector,
    modelType: string
  ): Promise<TransformedFeatureVector> {
    switch (modelType) {
      case 'xgboost':
        return this.transformForXGBoost(features);
      case 'neural_network':
        return this.transformForNeuralNetwork(features);
      case 'random_forest':
        return this.transformForRandomForest(features);
      case 'logistic_regression':
        return this.transformForLogisticRegression(features);
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  /**
   * Feature extraction methods
   */
  private extractHorseFeatures(horse: any, race: StandardizedHorseRace) {
    return {
      // Basic attributes
      age: horse.age,
      sexEncoded: this.encodeSex(horse.sex),
      weight: horse.physical?.weight || 0,
      condition: horse.physical?.condition || 5,

      // Performance statistics
      careerWinRate: horse.stats?.careerWinRate || 0,
      careerPlaceRate: horse.stats?.careerPlaceRate || 0,
      careerShowRate: horse.stats?.careerShowRate || 0,
      careerEarningsPerStart: horse.stats?.careerEarningsPerStart || 0,
      careerStrikeRate: horse.stats?.careerStrikeRate || 0,

      // Current season performance
      seasonWinRate: horse.stats?.seasonWinRate || 0,
      seasonPlaceRate: horse.stats?.seasonPlaceRate || 0,
      seasonEarningsPerStart: horse.stats?.seasonEarningsPerStart || 0,
      seasonStarts: horse.stats?.seasonStarts || 0,

      // Recent form
      formRating: horse.form?.formRating || 50,
      formTrend: this.encodeFormTrend(horse.form?.trend),
      daysSinceLastRace: horse.form?.daysSinceLastRace || 30,
      last5AveragePosition: this.calculateLast5Average(horse.form?.last5Positions),

      // Class and experience
      classRating: this.calculateClassRating(horse),
      experienceScore: this.calculateExperienceScore(horse),
      consistencyScore: this.calculateHorseConsistency(horse),

      // Distance and surface preferences
      distancePreference: this.calculateDistancePreference(horse, race.raceInfo.distance),
      surfacePreference: this.calculateSurfacePreference(horse, race.raceInfo.surface),
      goingPreference: this.calculateGoingPreference(horse, race.conditions.going),
    };
  }

  private extractJockeyFeatures(jockey: any, race: StandardizedHorseRace) {
    return {
      careerWinRate: jockey.stats?.careerWinRate || 0,
      careerPlaceRate: jockey.stats?.careerPlaceRate || 0,
      seasonWinRate: jockey.stats?.seasonWinRate || 0,
      recentFormWinRate: jockey.stats?.last14DaysWinRate || 0,
      claimingAllowance: jockey.claimingAllowance || 0,

      // Partnerships and specializations
      winRateWithTrainer: this.getJockeyTrainerWinRate(jockey),
      winRateWithHorse: this.getJockeyHorseWinRate(jockey),
      ridesWithHorse: this.getJockeyHorseRides(jockey),

      // Track and conditions specialization
      trackWinRate: this.getJockeyTrackWinRate(jockey, race.meeting.trackId),
      distanceWinRate: this.getJockeyDistanceWinRate(jockey, race.raceInfo.distance),
      goingWinRate: this.getJockeyGoingWinRate(jockey, race.conditions.going),

      // Experience factors
      experienceRating: this.calculateJockeyExperience(jockey),
      pressureHandling: this.calculatePressureHandling(jockey, race),
    };
  }

  private extractTrainerFeatures(trainer: any, race: StandardizedHorseRace) {
    return {
      careerWinRate: trainer.stats?.careerWinRate || 0,
      careerROI: trainer.stats?.careerROI || 0,
      seasonWinRate: trainer.stats?.seasonWinRate || 0,
      recentFormWinRate: trainer.stats?.last30DaysWinRate || 0,

      // Specializations
      ageGroupWinRate: this.getTrainerAgeGroupWinRate(trainer, race),
      distanceWinRate: this.getTrainerDistanceWinRate(trainer, race.raceInfo.distance),
      raceTypeWinRate: this.getTrainerRaceTypeWinRate(trainer, race.raceInfo.raceType),
      classWinRate: this.getTrainerClassWinRate(trainer, race.raceInfo.class),

      // Stable management
      stableSize: trainer.stableInfo?.averageStableSize || 20,
      stableQuality: this.calculateStableQuality(trainer),
      resourceRating: this.calculateTrainerResources(trainer),
    };
  }

  private extractRaceContextFeatures(race: StandardizedHorseRace, runner: StandardizedHorseRunner) {
    return {
      // Basic race information
      distance: race.raceInfo.distance,
      numberOfRunners: race.field.numberOfRunners,
      raceClassEncoded: this.encodeRaceClass(race.raceInfo.class),
      purse: Math.log10(race.raceInfo.purse + 1), // Log transform large values
      surfaceEncoded: this.encodeSurface(race.raceInfo.surface),
      raceTypeEncoded: this.encodeRaceType(race.raceInfo.raceType),

      // Conditions
      goingEncoded: this.encodeGoing(race.conditions.going),
      weatherImpact: this.calculateWeatherImpact(race.conditions.weather),
      trackBias: this.encodeTrackBias(race.conditions.trackBias),

      // Competition level
      fieldStrength: this.calculateFieldStrength(race),
      competitionLevel: this.calculateHorseRacingCompetitionLevel(race),
      classDropRaise: this.calculateClassChange(runner, race),

      // Race dynamics
      paceSetup: this.calculatePaceSetup(race),
      expectedPace: this.encodeExpectedPace(race),
    };
  }

  private extractMarketFeatures(runner: StandardizedHorseRunner, race: StandardizedHorseRace) {
    return {
      morningLineOdds: Math.log10(runner.market.morningLineOdds + 1),
      currentOdds: Math.log10(runner.market.currentOdds + 1),
      oddsMovement: runner.market.currentOdds / Math.max(runner.market.morningLineOdds, 0.1),
      impliedProbability: runner.market.impliedProbability,
      marketRank: runner.market.marketRank,
      publicSupport: runner.market.publicSupport,

      // Market efficiency indicators
      marketEfficiency: this.calculateMarketEfficiency(race),
      valueScore: this.calculateValueScore(runner),
      overlayUnderlay: this.calculateOverlayUnderlay(runner),

      // Betting patterns
      moneyFlow: this.calculateMoneyFlow(runner),
      sharpMoney: this.detectSharpMoney(runner),
      publicMoney: this.detectPublicMoney(runner),
    };
  }

  private extractTrackDistanceFeatures(
    race: StandardizedHorseRace,
    runner: StandardizedHorseRunner
  ) {
    const horse = runner.horse;

    return {
      // Track-specific performance
      horseTrackWinRate: this.getHorseTrackWinRate(horse, race.meeting.trackId),
      horseTrackPlaceRate: this.getHorseTrackPlaceRate(horse, race.meeting.trackId),
      horseTrackStarts: this.getHorseTrackStarts(horse, race.meeting.trackId),

      // Distance suitability
      horseDistanceWinRate: this.getHorseDistanceWinRate(horse, race.raceInfo.distance),
      horseDistanceStarts: this.getHorseDistanceStarts(horse, race.raceInfo.distance),
      optimalDistance: horse.preferences?.preferredDistance?.optimal || race.raceInfo.distance,
      distanceVariance: this.calculateDistanceVariance(horse, race.raceInfo.distance),

      // Going and surface preferences
      horseGoingWinRate: this.getHorseGoingWinRate(horse, race.conditions.going),
      horseGoingStarts: this.getHorseGoingStarts(horse, race.conditions.going),
      goingPreference: this.calculateGoingPreference(horse, race.conditions.going),
      horseSurfaceWinRate: this.getHorseSurfaceWinRate(horse, race.raceInfo.surface),
      horseSurfaceStarts: this.getHorseSurfaceStarts(horse, race.raceInfo.surface),
    };
  }

  private extractBreedingFeatures(horse: any) {
    const pedigree = horse.pedigree || {};

    return {
      sireWinRate: pedigree.sireWinRate || 0,
      damProgenyWinRate: pedigree.damProgenyWinRate || 0,
      inbreedingCoefficient: pedigree.inbreeding || 0,

      // Aptitude from pedigree
      pedigreeDistanceAptitude: this.calculatePedigreeDistanceAptitude(pedigree),
      pedigreeSurfaceAptitude: this.calculatePedigreeSurfaceAptitude(pedigree),
      pedigreeClassAptitude: this.calculatePedigreeClassAptitude(pedigree),

      // Genetic factors
      earlySpeedIndex: this.calculateEarlySpeedIndex(pedigree),
      staminaIndex: this.calculateStaminaIndex(pedigree),
      versatilityIndex: this.calculateVersatilityIndex(pedigree),
    };
  }

  private extractPreparationFeatures(runner: StandardizedHorseRunner) {
    const preparation = runner.preparation || {};

    return {
      workoutRecency: this.calculateWorkoutRecency(preparation),
      workoutQuality: this.calculateWorkoutQuality(preparation),
      workoutFrequency: this.calculateWorkoutFrequency(preparation),

      // Fitness indicators
      peakFormIndicator: this.calculatePeakFormIndicator(runner),
      fitnessScore: this.calculateFitnessScore(runner),
      readinessScore: this.calculateReadinessScore(runner),

      // Layoff effects
      layoffDays: preparation.daysSinceLastRace || 30,
      layoffType: this.encodeLayoffType(preparation),
      firstTimeStarter: runner.horse.stats?.careerStarts === 0 ? 1 : 0,
    };
  }

  private extractSituationalFeatures(race: StandardizedHorseRace, runner: StandardizedHorseRunner) {
    return {
      // Post position effects
      postPosition: runner.postPosition,
      postPositionAdvantage: this.calculatePostPositionAdvantage(runner, race),

      // Pace scenario
      earlyPaceSetup: this.calculateEarlyPaceSetup(race),
      paceAdvantage: this.calculatePaceAdvantage(runner, race),
      runningStyle: this.encodeRunningStyle(runner),

      // Equipment and changes
      equipmentChanges: this.encodeEquipmentChanges(runner),
      medicationChanges: this.encodeMedicationChanges(runner),

      // Human factors
      jockeyChange: this.detectJockeyChange(runner) ? 1 : 0,
      trainerChange: this.detectTrainerChange(runner) ? 1 : 0,
      ownershipChange: this.detectOwnershipChange(runner) ? 1 : 0,

      // Race circumstances
      raceImportance: this.calculateRaceImportance(race),
      pressureLevel: this.calculatePressureLevel(race, runner),
    };
  }

  private extractFormFeatures(horse: any, race: StandardizedHorseRace) {
    const form = horse.form || {};

    return {
      lastRacePosition: this.getLastRacePosition(form),
      lastRaceMargin: this.getLastRaceMargin(form),
      lastRaceClass: this.getLastRaceClass(form),
      lastRaceDistance: this.getLastRaceDistance(form),

      // Form progression
      formProgression: this.calculateFormProgression(form),
      improvementTrend: this.calculateImprovementTrend(form),
      consistencyIndex: this.calculateFormConsistency(form),

      // Class changes
      classProgression: this.calculateClassProgression(form, race),
      competitionQuality: this.calculateRecentCompetitionQuality(form),
    };
  }

  private extractHorseRacingTargets(race: StandardizedHorseRace, runner: StandardizedHorseRunner) {
    // These would be filled for training data
    return {
      finishPosition: undefined,
      willWin: undefined,
      willPlace: undefined,
      willShow: undefined,
      beatsFavorite: undefined,
      finishTime: undefined,
      speedFigure: undefined,
    };
  }

  /**
   * Encoding methods
   */
  private encodeSex(sex: string): number {
    const sexMap: { [key: string]: number } = {
      colt: 0,
      filly: 1,
      mare: 2,
      stallion: 3,
      gelding: 4,
    };
    return sexMap[sex] || 4;
  }

  private encodeFormTrend(trend?: string): number {
    const trendMap: { [key: string]: number } = {
      declining: -1,
      stable: 0,
      improving: 1,
    };
    return trendMap[trend || 'stable'] || 0;
  }

  private encodeRaceClass(raceClass: string): number {
    const classMap: { [key: string]: number } = {
      'Group 1': 6,
      'Group 2': 5,
      'Group 3': 4,
      Listed: 3,
      Handicap: 2,
      Maiden: 1,
      Claiming: 0,
    };
    return classMap[raceClass] || 2;
  }

  private encodeSurface(surface: string): number {
    const surfaceMap: { [key: string]: number } = {
      turf: 0,
      dirt: 1,
      synthetic: 2,
    };
    return surfaceMap[surface] || 0;
  }

  private encodeRaceType(raceType: string): number {
    const typeMap: { [key: string]: number } = {
      flat: 0,
      hurdle: 1,
      steeplechase: 2,
      harness: 3,
    };
    return typeMap[raceType] || 0;
  }

  private encodeGoing(going: string): number {
    const goingMap: { [key: string]: number } = {
      firm: 0,
      good: 1,
      good_firm: 2,
      soft: 3,
      heavy: 4,
    };
    return goingMap[going.toLowerCase().replace(' ', '_')] || 1;
  }

  private encodeTrackBias(bias?: string): number {
    if (!bias) return 0;
    const biasMap: { [key: string]: number } = {
      none: 0,
      rail: 1,
      wide: -1,
      speed: 2,
      stamina: -2,
    };
    return biasMap[bias] || 0;
  }

  private encodeExpectedPace(race: StandardizedHorseRace): number {
    // Simplified pace encoding
    return 1; // Would analyze runners' running styles
  }

  private encodeLayoffType(preparation: any): number {
    // Simplified layoff type encoding
    return 0;
  }

  private encodeRunningStyle(runner: StandardizedHorseRunner): number {
    // Would analyze past running positions
    return 1; // 0=front, 1=stalker, 2=closer
  }

  private encodeEquipmentChanges(runner: StandardizedHorseRunner): number {
    return (runner.raceInfo.equipment?.length || 0) > 0 ? 1 : 0;
  }

  private encodeMedicationChanges(runner: StandardizedHorseRunner): number {
    return (runner.raceInfo.medication?.length || 0) > 0 ? 1 : 0;
  }

  /**
   * Calculation methods
   */
  private calculateLast5Average(positions?: number[]): number {
    if (!positions || positions.length === 0) return 10;
    return positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
  }

  private calculateClassRating(horse: any): number {
    const earnings = horse.stats?.careerEarningsPerStart || 0;
    // Convert earnings to class rating (0-1 scale)
    return Math.min(earnings / 50000, 1);
  }

  private calculateExperienceScore(horse: any): number {
    const starts = horse.stats?.careerStarts || 0;
    return Math.min(starts / 30, 1); // 30 starts = experienced
  }

  private calculateHorseConsistency(horse: any): number {
    const strikeRate = horse.stats?.careerStrikeRate || 0;
    return strikeRate / 100; // Convert percentage to 0-1
  }

  private calculateDistancePreference(horse: any, raceDistance: number): number {
    const optimal = horse.preferences?.preferredDistance?.optimal || raceDistance;
    const variance = Math.abs(raceDistance - optimal) / optimal;
    return Math.max(0, 1 - variance);
  }

  private calculateSurfacePreference(horse: any, surface: string): number {
    const preferred = horse.preferences?.preferredTrackType || [];
    return preferred.includes(surface) ? 1 : 0.5;
  }

  private calculateGoingPreference(horse: any, going: string): number {
    const preferred = horse.preferences?.preferredGoing || [];
    return preferred.includes(going) ? 1 : 0.5;
  }

  private calculateWeatherImpact(weather?: any): number {
    if (!weather) return 0;
    let impact = 0;
    if (weather.precipitation) impact += 0.5;
    if (weather.windSpeed > 20) impact += 0.3;
    return Math.min(impact, 1);
  }

  private calculateFieldStrength(race: StandardizedHorseRace): number {
    // Average class rating of field
    return 0.7; // Simplified
  }

  private calculateHorseRacingCompetitionLevel(race: StandardizedHorseRace): number {
    const classMultiplier = this.encodeRaceClass(race.raceInfo.class) / 6;
    const purseMultiplier = Math.min(Math.log10(race.raceInfo.purse) / 6, 1);
    return (classMultiplier + purseMultiplier) / 2;
  }

  private calculateClassChange(
    runner: StandardizedHorseRunner,
    race: StandardizedHorseRace
  ): number {
    // Would compare with last race class
    return 0; // Simplified
  }

  private calculatePaceSetup(race: StandardizedHorseRace): number {
    // Analyze runners for pace setup
    return 0.5; // Neutral pace
  }

  /**
   * Market calculation methods
   */
  private calculateMarketEfficiency(race: StandardizedHorseRace): number {
    // Measure of how efficient the betting market is
    return 0.8; // Generally efficient
  }

  private calculateValueScore(runner: StandardizedHorseRunner): number {
    // Model probability vs market probability
    return 0.5; // Neutral value
  }

  private calculateOverlayUnderlay(runner: StandardizedHorseRunner): number {
    return runner.market.currentOdds / runner.market.morningLineOdds;
  }

  private calculateMoneyFlow(runner: StandardizedHorseRunner): number {
    return runner.market.publicSupport;
  }

  private detectSharpMoney(runner: StandardizedHorseRunner): number {
    // Detect professional betting patterns
    return 0; // Simplified
  }

  private detectPublicMoney(runner: StandardizedHorseRunner): number {
    return runner.market.publicSupport;
  }

  /**
   * Track and distance calculation methods
   */
  private getHorseTrackWinRate(horse: any, trackId: string): number {
    // Would lookup actual track statistics
    return horse.stats?.winRate || 0;
  }

  private getHorseTrackPlaceRate(horse: any, trackId: string): number {
    return horse.stats?.placeRate || 0;
  }

  private getHorseTrackStarts(horse: any, trackId: string): number {
    return 0; // Would be actual data
  }

  private getHorseDistanceWinRate(horse: any, distance: number): number {
    return horse.stats?.winRate || 0;
  }

  private getHorseDistanceStarts(horse: any, distance: number): number {
    return 0;
  }

  private calculateDistanceVariance(horse: any, raceDistance: number): number {
    const optimal = horse.preferences?.preferredDistance?.optimal || raceDistance;
    return Math.abs(raceDistance - optimal) / optimal;
  }

  private getHorseGoingWinRate(horse: any, going: string): number {
    return horse.stats?.winRate || 0;
  }

  private getHorseGoingStarts(horse: any, going: string): number {
    return 0;
  }

  private getHorseSurfaceWinRate(horse: any, surface: string): number {
    return horse.stats?.winRate || 0;
  }

  private getHorseSurfaceStarts(horse: any, surface: string): number {
    return 0;
  }

  /**
   * Jockey-specific methods
   */
  private getJockeyTrainerWinRate(jockey: any): number {
    return jockey.partnerships?.trainerCombos?.[0]?.winRateWithTrainer || 0;
  }

  private getJockeyHorseWinRate(jockey: any): number {
    return jockey.partnerships?.horseCombos?.[0]?.winRateWithHorse || 0;
  }

  private getJockeyHorseRides(jockey: any): number {
    return jockey.partnerships?.horseCombos?.[0]?.ridesWithHorse || 0;
  }

  private getJockeyTrackWinRate(jockey: any, trackId: string): number {
    return jockey.specialties?.trackSpecialty?.[0]?.winRate || jockey.stats?.careerWinRate || 0;
  }

  private getJockeyDistanceWinRate(jockey: any, distance: number): number {
    return jockey.specialties?.distanceSpecialty?.[0]?.winRate || jockey.stats?.careerWinRate || 0;
  }

  private getJockeyGoingWinRate(jockey: any, going: string): number {
    return jockey.specialties?.goingSpecialty?.[0]?.winRate || jockey.stats?.careerWinRate || 0;
  }

  private calculateJockeyExperience(jockey: any): number {
    const rides = jockey.stats?.careerRides || 0;
    return Math.min(rides / 1000, 1); // 1000 rides = experienced
  }

  private calculatePressureHandling(jockey: any, race: StandardizedHorseRace): number {
    // Based on performance in important races
    return 0.7; // Simplified
  }

  /**
   * Trainer-specific methods
   */
  private getTrainerAgeGroupWinRate(trainer: any, race: StandardizedHorseRace): number {
    return (
      trainer.specialties?.ageGroupSpecialty?.[0]?.winRate || trainer.stats?.careerWinRate || 0
    );
  }

  private getTrainerDistanceWinRate(trainer: any, distance: number): number {
    return (
      trainer.specialties?.distanceSpecialty?.[0]?.winRate || trainer.stats?.careerWinRate || 0
    );
  }

  private getTrainerRaceTypeWinRate(trainer: any, raceType: string): number {
    return (
      trainer.specialties?.raceTypeSpecialty?.[0]?.winRate || trainer.stats?.careerWinRate || 0
    );
  }

  private getTrainerClassWinRate(trainer: any, raceClass: string): number {
    return trainer.stats?.careerWinRate || 0;
  }

  private calculateStableQuality(trainer: any): number {
    const winRate = trainer.stats?.careerWinRate || 0;
    const roi = trainer.stats?.careerROI || 0;
    return (winRate + Math.max(roi, 0)) / 2;
  }

  private calculateTrainerResources(trainer: any): number {
    const stableSize = trainer.stableInfo?.averageStableSize || 20;
    return Math.min(stableSize / 50, 1); // 50 horses = well-resourced
  }

  /**
   * Breeding-specific methods
   */
  private calculatePedigreeDistanceAptitude(pedigree: any): number {
    return 0.5; // Would analyze sire/dam distance preferences
  }

  private calculatePedigreeSurfaceAptitude(pedigree: any): number {
    return 0.5; // Would analyze sire/dam surface preferences
  }

  private calculatePedigreeClassAptitude(pedigree: any): number {
    return 0.5; // Would analyze sire/dam class levels
  }

  private calculateEarlySpeedIndex(pedigree: any): number {
    return 0.5; // Would analyze early speed in pedigree
  }

  private calculateStaminaIndex(pedigree: any): number {
    return 0.5; // Would analyze stamina in pedigree
  }

  private calculateVersatilityIndex(pedigree: any): number {
    return 0.5; // Would analyze versatility in pedigree
  }

  /**
   * Preparation-specific methods
   */
  private calculateWorkoutRecency(preparation: any): number {
    const workouts = preparation.workouts || [];
    if (workouts.length === 0) return 14; // Default 2 weeks

    const lastWorkout = new Date(workouts[0].date);
    const now = new Date();
    return (now.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24);
  }

  private calculateWorkoutQuality(preparation: any): number {
    return 0.7; // Would analyze workout times and patterns
  }

  private calculateWorkoutFrequency(preparation: any): number {
    const workouts = preparation.workouts || [];
    return workouts.length; // In last 30 days
  }

  private calculatePeakFormIndicator(runner: StandardizedHorseRunner): number {
    return 0.7; // Would analyze various form indicators
  }

  private calculateFitnessScore(runner: StandardizedHorseRunner): number {
    return runner.horse.physical?.condition || 5;
  }

  private calculateReadinessScore(runner: StandardizedHorseRunner): number {
    const daysSince = runner.preparation?.daysSinceLastRace || 30;
    const workoutQuality = this.calculateWorkoutQuality(runner.preparation);

    // Optimal readiness around 14-21 days
    let readiness = 1 - Math.abs(daysSince - 17.5) / 17.5;
    readiness = Math.max(0, readiness);

    return (readiness + workoutQuality) / 2;
  }

  /**
   * Situational methods
   */
  private calculatePostPositionAdvantage(
    runner: StandardizedHorseRunner,
    race: StandardizedHorseRace
  ): number {
    // Post position bias varies by track and distance
    const fieldSize = race.field.numberOfRunners;
    const postPosition = runner.postPosition;

    // Inside posts generally advantageous for shorter distances
    if (race.raceInfo.distance < 8) {
      // Sprint distances
      return Math.max(0, 1 - postPosition / fieldSize);
    } else {
      // Route distances
      // Middle posts often best
      const ideal = fieldSize / 2;
      return Math.max(0, 1 - Math.abs(postPosition - ideal) / ideal);
    }
  }

  private calculateEarlyPaceSetup(race: StandardizedHorseRace): number {
    // Would analyze runners' running styles
    return 0.5; // Neutral pace setup
  }

  private calculatePaceAdvantage(
    runner: StandardizedHorseRunner,
    race: StandardizedHorseRace
  ): number {
    // Would analyze runner's style vs likely pace scenario
    return 0.5;
  }

  private calculateRaceImportance(race: StandardizedHorseRace): number {
    const classLevel = this.encodeRaceClass(race.raceInfo.class) / 6;
    const purseLevel = Math.min(Math.log10(race.raceInfo.purse) / 6, 1);
    return (classLevel + purseLevel) / 2;
  }

  private calculatePressureLevel(
    race: StandardizedHorseRace,
    runner: StandardizedHorseRunner
  ): number {
    const raceImportance = this.calculateRaceImportance(race);
    const marketExpectation = 1 / runner.market.currentOdds; // Higher for favorites
    return (raceImportance + marketExpectation) / 2;
  }

  /**
   * Change detection methods
   */
  private detectJockeyChange(runner: StandardizedHorseRunner): boolean {
    // Would compare with previous races
    return false;
  }

  private detectTrainerChange(runner: StandardizedHorseRunner): boolean {
    return false;
  }

  private detectOwnershipChange(runner: StandardizedHorseRunner): boolean {
    return false;
  }

  /**
   * Form analysis methods
   */
  private getLastRacePosition(form: any): number {
    const positions = form.last5Positions || [];
    return positions[0] || 10;
  }

  private getLastRaceMargin(form: any): number {
    // Would get actual margin data
    return 0;
  }

  private getLastRaceClass(form: any): number {
    // Would get actual class data
    return 2;
  }

  private getLastRaceDistance(form: any): number {
    // Would get actual distance data
    return 8;
  }

  private calculateFormProgression(form: any): number {
    const positions = form.last5Positions || [];
    if (positions.length < 2) return 0;

    // Calculate improvement trend
    let improvement = 0;
    for (let i = 1; i < positions.length; i++) {
      improvement += positions[i] - positions[i - 1]; // Negative = improvement
    }

    return Math.max(-1, Math.min(1, -improvement / (positions.length - 1) / 5));
  }

  private calculateImprovementTrend(form: any): number {
    return this.encodeFormTrend(form.trend);
  }

  private calculateFormConsistency(form: any): number {
    const positions = form.last5Positions || [];
    if (positions.length < 2) return 0.5;

    const avg = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    const variance =
      positions.reduce((sum, pos) => sum + Math.pow(pos - avg, 2), 0) / positions.length;

    // Lower variance = higher consistency
    return Math.max(0, 1 - variance / 25); // 25 = reasonable max variance
  }

  private calculateClassProgression(form: any, race: StandardizedHorseRace): number {
    // Would compare current race class with recent races
    return 0;
  }

  private calculateRecentCompetitionQuality(form: any): number {
    // Would analyze quality of recent opposition
    return 0.7;
  }

  /**
   * Data quality and validation methods
   */
  private assessHorseRacingDataQuality(
    race: StandardizedHorseRace,
    runner: StandardizedHorseRunner
  ): number {
    let quality = 1.0;

    // Check for missing critical data
    if (!race.raceInfo.distance) quality -= 0.1;
    if (!race.field.numberOfRunners) quality -= 0.1;
    if (!runner.market.currentOdds) quality -= 0.2;
    if (!runner.horse.age) quality -= 0.1;
    if (!runner.horse.stats) quality -= 0.2;

    return Math.max(quality, 0);
  }

  private calculateHorseRacingCompleteness(
    race: StandardizedHorseRace,
    runner: StandardizedHorseRunner
  ): number {
    const requiredFields = [
      race.id,
      race.raceInfo.distance,
      race.field.numberOfRunners,
      runner.horseId,
      runner.horse.age,
      runner.market.currentOdds,
      runner.jockey.id,
      runner.trainer.id,
    ];

    const presentFields = requiredFields.filter(
      field => field !== undefined && field !== null
    ).length;
    return presentFields / requiredFields.length;
  }

  private validateHorseRacingCompleteness(features: MLFeatureVector) {
    const requiredCategories = ['horse', 'jockey', 'trainer', 'race', 'market'];
    const presentCategories = requiredCategories.filter(cat => features.features[cat]).length;

    return {
      score: presentCategories / requiredCategories.length,
      missingFeatures: requiredCategories.filter(cat => !features.features[cat]),
      missingPercentage:
        ((requiredCategories.length - presentCategories) / requiredCategories.length) * 100,
    };
  }

  private validateHorseRacingAccuracy(features: MLFeatureVector) {
    const outliers: string[] = [];
    const anomalies: string[] = [];

    // Check horse features
    if (features.features.horse?.age > 15) anomalies.push('horse.age');
    if (features.features.horse?.careerWinRate > 1) outliers.push('horse.careerWinRate');

    return {
      score: Math.max(0, 1 - (outliers.length + anomalies.length) * 0.1),
      outliers,
      anomalies,
      suspiciousValues: [],
    };
  }

  private validateHorseRacingConsistency(features: MLFeatureVector) {
    const inconsistencies: string[] = [];

    // Check for logical consistency
    if (features.features.horse?.careerWinRate > features.features.horse?.careerPlaceRate) {
      inconsistencies.push('winRate > placeRate');
    }

    return {
      score: Math.max(0, 1 - inconsistencies.length * 0.2),
      inconsistencies,
      logicalErrors: inconsistencies,
    };
  }

  private validateHorseRacingTimeliness(features: MLFeatureVector) {
    const lastUpdated = new Date(features.metadata.extractedAt);
    const ageHours = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

    return {
      score: Math.max(0, 1 - ageHours / 24), // 1 day = full penalty
      staleFeatures: ageHours > 6 ? ['all'] : [],
      lastUpdated: { all: features.metadata.extractedAt },
    };
  }

  private generateHorseRacingRecommendations(validation: any) {
    const recommendations = {
      critical: [] as string[],
      warning: [] as string[],
      info: [] as string[],
    };

    if (validation.completeness.score < 0.8) {
      recommendations.critical.push('Missing critical feature categories');
    }

    if (validation.accuracy.score < 0.9) {
      recommendations.warning.push('Data accuracy issues detected');
    }

    if (validation.timeliness.score < 0.9) {
      recommendations.info.push('Consider updating data more frequently');
    }

    return recommendations;
  }

  private calculateHorseRacingFeatureImportance(features: MLFeatureVector) {
    return {
      'horse.careerWinRate': 0.15,
      'horse.formRating': 0.12,
      'jockey.careerWinRate': 0.1,
      'market.currentOdds': 0.1,
      'trainer.careerWinRate': 0.08,
      'horse.classRating': 0.08,
      'race.fieldStrength': 0.07,
      'track.distancePreference': 0.06,
      'situational.postPosition': 0.05,
      'preparation.readinessScore': 0.05,
      'breeding.pedigreeDistanceAptitude': 0.04,
      'form.formProgression': 0.04,
      'market.valueScore': 0.03,
      'situational.paceAdvantage': 0.03,
    };
  }

  /**
   * Model transformation methods
   */
  private async transformForXGBoost(features: MLFeatureVector): Promise<TransformedFeatureVector> {
    const flatFeatures: number[] = [];
    const featureNames: string[] = [];

    Object.entries(features.features).forEach(([category, categoryFeatures]) => {
      Object.entries(categoryFeatures).forEach(([featureName, value]) => {
        flatFeatures.push(typeof value === 'number' ? value : value ? 1 : 0);
        featureNames.push(`${category}.${featureName}`);
      });
    });

    return {
      originalId: features.id,
      modelType: 'xgboost',
      transformedAt: new Date().toISOString(),
      numericFeatures: flatFeatures,
      categoricalFeatures: [],
      featureNames,
      categoricalIndices: [],
      numericIndices: Array.from({ length: flatFeatures.length }, (_, i) => i),
      transformations: {
        normalization: { method: 'none', parameters: {} },
        encoding: { categoricalEncoding: 'none', encodingMaps: {} },
        scaling: { method: 'none', scalingFactors: {} },
      },
    };
  }

  private async transformForNeuralNetwork(
    features: MLFeatureVector
  ): Promise<TransformedFeatureVector> {
    const flatFeatures: number[] = [];
    const featureNames: string[] = [];

    Object.entries(features.features).forEach(([category, categoryFeatures]) => {
      Object.entries(categoryFeatures).forEach(([featureName, value]) => {
        let normalizedValue: number;
        if (typeof value === 'number') {
          normalizedValue = Math.min(Math.max(value, 0), 1);
        } else {
          normalizedValue = value ? 1 : 0;
        }
        flatFeatures.push(normalizedValue);
        featureNames.push(`${category}.${featureName}`);
      });
    });

    return {
      originalId: features.id,
      modelType: 'neural_network',
      transformedAt: new Date().toISOString(),
      numericFeatures: flatFeatures,
      categoricalFeatures: [],
      featureNames,
      categoricalIndices: [],
      numericIndices: Array.from({ length: flatFeatures.length }, (_, i) => i),
      transformations: {
        normalization: { method: 'minmax', parameters: { min: 0, max: 1 } },
        encoding: { categoricalEncoding: 'none', encodingMaps: {} },
        scaling: { method: 'minmax', scalingFactors: {} },
      },
    };
  }

  private async transformForRandomForest(
    features: MLFeatureVector
  ): Promise<TransformedFeatureVector> {
    return this.transformForXGBoost(features);
  }

  private async transformForLogisticRegression(
    features: MLFeatureVector
  ): Promise<TransformedFeatureVector> {
    return this.transformForNeuralNetwork(features);
  }

  private scoreToQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'unusable' {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.7) return 'fair';
    if (score >= 0.5) return 'poor';
    return 'unusable';
  }
}

// Export the Horse Racing feature extractor
export const horseRacingFeatureExtractor = new HorseRacingFeatureExtractor();
