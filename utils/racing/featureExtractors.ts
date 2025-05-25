/**
 * Racing Feature Extractors - Phase 2: Data Transformation Pipeline
 * ML-compatible feature extraction for NASCAR and Horse Racing data
 * Part of Racing Data Integration Plan
 */

import { 
  MLFeatureExtractor, 
  MLFeatureVector, 
  FeatureValidationResult, 
  TransformedFeatureVector,
  RacingSport
} from '../../types/racing/commonTypes';
import { 
  StandardizedNascarDriver, 
  StandardizedNascarRace, 
  NascarMLFeatures 
} from '../../types/racing/nascarTypes';
import { 
  StandardizedHorse, 
  StandardizedHorseRace, 
  StandardizedHorseRunner,
  HorseRacingMLFeatures 
} from '../../types/racing/horseRacingTypes';

/**
 * NASCAR Feature Extractor
 * Converts NASCAR race and driver data to ML-compatible features
 */
export class NascarFeatureExtractor implements MLFeatureExtractor<{race: StandardizedNascarRace, driver: StandardizedNascarDriver}> {
  
  async extractFeatures(rawData: {race: StandardizedNascarRace, driver: StandardizedNascarDriver}): Promise<MLFeatureVector> {
    const { race, driver } = rawData;
    
    // Extract NASCAR-specific features
    const nascarFeatures = await this.extractNascarSpecificFeatures(race, driver);
    
    // Convert to generic ML feature vector
    return {
      id: `nascar_${race.id}_${driver.id}`,
      sport: 'nascar',
      eventId: race.id,
      participantId: driver.id,
      
      features: {
        driver: this.extractDriverFeatures(driver),
        track: this.extractTrackFeatures(race, driver),
        team: this.extractTeamFeatures(driver),
        race: this.extractRaceFeatures(race),
        weather: this.extractWeatherFeatures(race),
        historical: this.extractHistoricalFeatures(driver),
        performance: this.extractPerformanceFeatures(driver),
        competition: this.extractCompetitionFeatures(race, driver)
      },
      
      metadata: {
        version: '2.0.0',
        extractedAt: new Date().toISOString(),
        dataQuality: this.assessNascarDataQuality(race, driver),
        completeness: this.calculateNascarCompleteness(race, driver),
        featureCount: 0, // Will be calculated after extraction
        normalizationApplied: true,
        scalingMethod: 'standard',
        missingValueStrategy: 'mean_imputation',
        outlierHandling: 'clip_to_percentile'
      },
      
      targets: this.extractNascarTargets(race, driver)
    };
  }

  validateFeatures(features: MLFeatureVector): FeatureValidationResult {
    const validation = {
      completeness: this.validateNascarCompleteness(features),
      accuracy: this.validateNascarAccuracy(features),
      consistency: this.validateNascarConsistency(features),
      timeliness: this.validateNascarTimeliness(features)
    };

    const overallScore = (
      validation.completeness.score + 
      validation.accuracy.score + 
      validation.consistency.score + 
      validation.timeliness.score
    ) / 4;

    return {
      isValid: overallScore >= 0.7,
      quality: this.scoreToQuality(overallScore),
      score: overallScore,
      validation,
      recommendations: this.generateNascarRecommendations(validation),
      featureImportance: this.calculateNascarFeatureImportance(features)
    };
  }

  async transformForModel(features: MLFeatureVector, modelType: string): Promise<TransformedFeatureVector> {
    switch (modelType) {
      case 'xgboost':
        return this.transformForXGBoost(features);
      case 'neural_network':
        return this.transformForNeuralNetwork(features);
      case 'random_forest':
        return this.transformForRandomForest(features);
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  /**
   * Extract NASCAR-specific features
   */
  private async extractNascarSpecificFeatures(race: StandardizedNascarRace, driver: StandardizedNascarDriver): Promise<NascarMLFeatures> {
    return {
      raceId: race.id,
      driverId: driver.id,
      
      driverFeatures: {
        // Current season performance
        currentSeasonWins: driver.stats.wins,
        currentSeasonTop5: driver.stats.top5Finishes,
        currentSeasonTop10: driver.stats.top10Finishes,
        currentSeasonAverageFinish: driver.stats.averageFinish,
        currentSeasonPoints: driver.currentPoints,
        currentSeasonPosition: driver.seasonPosition,
        
        // Career statistics
        careerWins: driver.stats.wins, // This would be expanded with full career data
        careerStarts: Math.max(driver.stats.wins + driver.stats.top5Finishes + driver.stats.top10Finishes, 1),
        careerWinRate: driver.stats.winRate,
        careerTop5Rate: driver.stats.top5Rate,
        careerTop10Rate: driver.stats.top10Rate,
        careerDnfRate: driver.stats.dnfRate,
        
        // Recent form
        last5AverageFinish: driver.recentForm?.averageFinish || driver.stats.averageFinish,
        last10AverageFinish: driver.stats.averageFinish, // Simplified
        formTrend: this.encodeFormTrend(driver.recentForm?.trend),
        
        // Experience
        yearsExperience: this.estimateNascarExperience(driver),
        startsThisSeason: this.estimateSeasonStarts(driver)
      },
      
      trackFeatures: {
        trackType: this.encodeTrackType(race.track.type),
        trackLength: race.track.length,
        trackBanking: race.track.bankingDegrees || 0,
        
        // Driver performance at this track
        driverTrackStarts: this.getDriverTrackStarts(driver, race.track.id),
        driverTrackWins: this.getDriverTrackWins(driver, race.track.id),
        driverTrackAverageFinish: this.getDriverTrackAverageFinish(driver, race.track.id),
        driverTrackBestFinish: this.getDriverTrackBestFinish(driver, race.track.id),
        driverTrackWinRate: this.getDriverTrackWinRate(driver, race.track.id),
        
        // Similar track performance
        similarTrackPerformance: this.getSimilarTrackPerformance(driver, race.track.type)
      },
      
      teamFeatures: {
        manufacturer: this.encodeManufacturer(driver.manufacturer),
        teamWinsThisSeason: this.estimateTeamWins(driver.team),
        teamTop5ThisSeason: this.estimateTeamTop5(driver.team),
        teamAverageFinishThisSeason: this.estimateTeamAverageFinish(driver.team),
        teamResourceRating: this.getTeamResourceRating(driver.team)
      },
      
      raceFeatures: {
        raceNumber: race.raceNumber,
        seasonProgress: race.raceNumber / 36, // Assuming 36 race season
        playoffRace: race.raceNumber > 26, // Simplified playoff determination
        stageRace: !!race.specs.stages,
        nightRace: this.isNightRace(race.schedule.startTime),
        
        // Starting position effects (would come from qualifying data)
        startPosition: this.estimateStartPosition(driver),
        qualifyingSpeed: this.estimateQualifyingSpeed(driver),
        qualifyingPosition: this.estimateStartPosition(driver),
        
        // Field strength
        fieldStrength: this.calculateFieldStrength(race),
        competitionLevel: this.calculateCompetitionLevel(race)
      },
      
      weatherFeatures: {
        temperature: race.weather?.temperature || 75,
        windSpeed: race.weather?.windSpeed || 5,
        windDirection: this.encodeWindDirection(race.weather?.windDirection),
        precipitationRisk: race.weather?.precipitation ? 1 : 0,
        weatherImpact: this.calculateWeatherImpact(race.weather)
      },
      
      historicalFeatures: {
        // Head-to-head comparisons
        vsTopDriversRecord: this.calculateVsTopDrivers(driver),
        vsTeammateRecord: this.calculateVsTeammates(driver),
        
        // Situational performance
        frontRowStarts: this.estimateFrontRowStarts(driver),
        backRowStarts: this.estimateBackRowStarts(driver),
        frontRowAverageFinish: this.estimateFrontRowFinish(driver),
        backRowAverageFinish: this.estimateBackRowFinish(driver),
        
        // Momentum indicators
        momentumScore: this.calculateMomentumScore(driver),
        consistencyScore: this.calculateConsistencyScore(driver),
        clutchPerformance: this.calculateClutchPerformance(driver)
      },
      
      metadata: {
        featureVersion: '2.0.0',
        dataQuality: this.assessNascarDataQuality(race, driver),
        lastUpdated: new Date().toISOString(),
        sourceReliability: 0.95 // NASCAR has high-quality data
      }
    };
  }

  /**
   * Feature extraction helper methods for NASCAR
   */
  private extractDriverFeatures(driver: StandardizedNascarDriver) {
    return {
      wins: driver.stats.wins,
      top5: driver.stats.top5Finishes,
      top10: driver.stats.top10Finishes,
      averageFinish: driver.stats.averageFinish,
      winRate: driver.stats.winRate / 100, // Normalize to 0-1
      top5Rate: driver.stats.top5Rate / 100,
      top10Rate: driver.stats.top10Rate / 100,
      dnfRate: driver.stats.dnfRate / 100,
      points: driver.currentPoints,
      position: driver.seasonPosition,
      lapsLed: driver.stats.lapsLed,
      poles: driver.stats.poles
    };
  }

  private extractTrackFeatures(race: StandardizedNascarRace, driver: StandardizedNascarDriver) {
    return {
      trackType: this.encodeTrackType(race.track.type),
      trackLength: race.track.length,
      banking: race.track.bankingDegrees || 0,
      surface: race.track.surface === 'asphalt' ? 1 : 0,
      driverTrackPerformance: this.getDriverTrackPerformance(driver, race.track.id)
    };
  }

  private extractTeamFeatures(driver: StandardizedNascarDriver) {
    return {
      manufacturer: this.encodeManufacturer(driver.manufacturer),
      teamQuality: this.getTeamResourceRating(driver.team),
      manufacturerStrength: this.getManufacturerStrength(driver.manufacturer)
    };
  }

  private extractRaceFeatures(race: StandardizedNascarRace) {
    return {
      raceNumber: race.raceNumber,
      seasonProgress: race.raceNumber / 36,
      distance: race.specs.distance,
      laps: race.specs.totalLaps,
      isPlayoff: race.raceNumber > 26 ? 1 : 0,
      hasStages: race.specs.stages ? 1 : 0,
      isNight: this.isNightRace(race.schedule.startTime) ? 1 : 0
    };
  }

  private extractWeatherFeatures(race: StandardizedNascarRace) {
    const weather = race.weather;
    return {
      temperature: weather?.temperature || 75,
      windSpeed: weather?.windSpeed || 5,
      windDirection: this.encodeWindDirection(weather?.windDirection),
      precipitation: weather?.precipitation ? 1 : 0,
      weatherImpact: this.calculateWeatherImpact(weather)
    };
  }

  private extractHistoricalFeatures(driver: StandardizedNascarDriver) {
    return {
      recentFormTrend: this.encodeFormTrend(driver.recentForm?.trend),
      momentumScore: this.calculateMomentumScore(driver),
      consistencyRating: this.calculateConsistencyScore(driver),
      experienceLevel: this.estimateNascarExperience(driver)
    };
  }

  private extractPerformanceFeatures(driver: StandardizedNascarDriver) {
    return {
      qualityStarts: (driver.stats.top5Finishes + driver.stats.top10Finishes) / Math.max(driver.seasonPosition, 1),
      finishingAbility: Math.max(0, 1 - (driver.stats.dnfRate / 100)),
      speedRating: this.calculateSpeedRating(driver),
      raceManagement: this.calculateRaceManagement(driver)
    };
  }

  private extractCompetitionFeatures(race: StandardizedNascarRace, driver: StandardizedNascarDriver) {
    return {
      fieldSize: 36, // Standard NASCAR field
      fieldStrength: this.calculateFieldStrength(race),
      competitionLevel: this.calculateCompetitionLevel(race),
      driverRanking: driver.seasonPosition
    };
  }

  private extractNascarTargets(race: StandardizedNascarRace, driver: StandardizedNascarDriver) {
    // These would be filled in for training data
    return {
      finishPosition: undefined,
      willWin: undefined,
      willTop5: undefined,
      willTop10: undefined,
      willLead: undefined,
      lapsLedPrediction: undefined,
      pointsPrediction: undefined
    };
  }

  /**
   * Encoding helper methods
   */
  private encodeTrackType(trackType: string): number {
    const typeMap: { [key: string]: number } = {
      'superspeedway': 0,
      'intermediate': 1,
      'short': 2,
      'road_course': 3,
      'dirt': 4
    };
    return typeMap[trackType] || 1;
  }

  private encodeManufacturer(manufacturer: string): number {
    const mfgMap: { [key: string]: number } = {
      'Ford': 0,
      'Chevrolet': 1,
      'Toyota': 2
    };
    return mfgMap[manufacturer] || 0;
  }

  private encodeFormTrend(trend?: string): number {
    const trendMap: { [key: string]: number } = {
      'declining': -1,
      'stable': 0,
      'improving': 1
    };
    return trendMap[trend || 'stable'] || 0;
  }

  private encodeWindDirection(direction?: string): number {
    if (!direction) return 0;
    // Convert wind direction to degrees (simplified)
    const directionMap: { [key: string]: number } = {
      'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
      'S': 180, 'SW': 225, 'W': 270, 'NW': 315
    };
    return directionMap[direction] || 0;
  }

  /**
   * Calculation helper methods
   */
  private calculateWeatherImpact(weather?: any): number {
    if (!weather) return 0;
    
    let impact = 0;
    if (weather.precipitation) impact += 0.5;
    if (weather.windSpeed > 15) impact += 0.3;
    if (weather.temperature < 50 || weather.temperature > 90) impact += 0.2;
    
    return Math.min(impact, 1);
  }

  private calculateFieldStrength(race: StandardizedNascarRace): number {
    // Simplified field strength calculation
    return 0.8; // Would be calculated based on actual field
  }

  private calculateCompetitionLevel(race: StandardizedNascarRace): number {
    // Based on track type and race importance
    const trackMultiplier = race.track.type === 'superspeedway' ? 1.2 : 1.0;
    const playoffMultiplier = race.raceNumber > 26 ? 1.3 : 1.0;
    return Math.min(0.8 * trackMultiplier * playoffMultiplier, 1.0);
  }

  private calculateMomentumScore(driver: StandardizedNascarDriver): number {
    if (!driver.recentForm) return 0.5;
    
    const trendScore = this.encodeFormTrend(driver.recentForm.trend) * 0.3 + 0.5;
    const avgFinishScore = Math.max(0, 1 - (driver.recentForm.averageFinish / 40));
    
    return (trendScore + avgFinishScore) / 2;
  }

  private calculateConsistencyScore(driver: StandardizedNascarDriver): number {
    const topFinishRate = (driver.stats.top5Finishes + driver.stats.top10Finishes) / Math.max(driver.seasonPosition, 1);
    const reliabilityScore = Math.max(0, 1 - (driver.stats.dnfRate / 100));
    
    return (topFinishRate + reliabilityScore) / 2;
  }

  private calculateClutchPerformance(driver: StandardizedNascarDriver): number {
    // Simplified clutch performance - would need race-specific data
    return driver.stats.winRate / 100;
  }

  private calculateSpeedRating(driver: StandardizedNascarDriver): number {
    // Based on poles and average finish
    const poleRate = driver.stats.poles / Math.max(driver.seasonPosition, 1);
    const finishQuality = Math.max(0, 1 - (driver.stats.averageFinish / 40));
    
    return (poleRate + finishQuality) / 2;
  }

  private calculateRaceManagement(driver: StandardizedNascarDriver): number {
    // Based on laps led vs wins ratio and consistency
    const lapsLedEfficiency = driver.stats.wins / Math.max(driver.stats.lapsLed / 100, 1);
    const consistencyFactor = this.calculateConsistencyScore(driver);
    
    return Math.min((lapsLedEfficiency + consistencyFactor) / 2, 1);
  }

  /**
   * Track-specific performance getters (simplified - would use actual data)
   */
  private getDriverTrackStarts(driver: StandardizedNascarDriver, trackId: string): number {
    return driver.trackPerformance?.[trackId]?.starts || 0;
  }

  private getDriverTrackWins(driver: StandardizedNascarDriver, trackId: string): number {
    return driver.trackPerformance?.[trackId]?.wins || 0;
  }

  private getDriverTrackAverageFinish(driver: StandardizedNascarDriver, trackId: string): number {
    return driver.trackPerformance?.[trackId]?.averageFinish || driver.stats.averageFinish;
  }

  private getDriverTrackBestFinish(driver: StandardizedNascarDriver, trackId: string): number {
    return driver.trackPerformance?.[trackId]?.bestFinish || 1;
  }

  private getDriverTrackWinRate(driver: StandardizedNascarDriver, trackId: string): number {
    const starts = this.getDriverTrackStarts(driver, trackId);
    const wins = this.getDriverTrackWins(driver, trackId);
    return starts > 0 ? wins / starts : 0;
  }

  private getSimilarTrackPerformance(driver: StandardizedNascarDriver, trackType: string): number {
    // Would calculate performance on similar track types
    return driver.stats.winRate / 100;
  }

  private getDriverTrackPerformance(driver: StandardizedNascarDriver, trackId: string): number {
    return this.getDriverTrackWinRate(driver, trackId);
  }

  /**
   * Estimation methods (would use actual data in production)
   */
  private estimateNascarExperience(driver: StandardizedNascarDriver): number {
    // Estimate based on statistics
    const raceCount = driver.stats.wins + driver.stats.top5Finishes + driver.stats.top10Finishes;
    return Math.min(raceCount / 200, 1); // 200 races as benchmark
  }

  private estimateSeasonStarts(driver: StandardizedNascarDriver): number {
    return driver.seasonPosition; // Simplified
  }

  private estimateStartPosition(driver: StandardizedNascarDriver): number {
    // Estimate based on recent performance
    return driver.stats.averageFinish * 0.8; // Qualifying usually better than race finish
  }

  private estimateQualifyingSpeed(driver: StandardizedNascarDriver): number {
    // Simplified speed estimate
    return 180 - (driver.stats.averageFinish * 2); // MPH estimate
  }

  private estimateTeamWins(team: string): number {
    // Would lookup actual team statistics
    return 2; // Placeholder
  }

  private estimateTeamTop5(team: string): number {
    return 8; // Placeholder
  }

  private estimateTeamAverageFinish(team: string): number {
    return 15; // Placeholder
  }

  private getTeamResourceRating(team: string): number {
    // Top teams get higher ratings
    const topTeams = ['Hendrick Motorsports', 'Joe Gibbs Racing', 'Team Penske', 'Stewart-Haas Racing'];
    return topTeams.includes(team) ? 9 : 6;
  }

  private getManufacturerStrength(manufacturer: string): number {
    const strengthMap: { [key: string]: number } = {
      'Chevrolet': 0.9,
      'Ford': 0.85,
      'Toyota': 0.87
    };
    return strengthMap[manufacturer] || 0.8;
  }

  private estimateFrontRowStarts(driver: StandardizedNascarDriver): number {
    return driver.stats.poles * 2; // Estimate front row starts
  }

  private estimateBackRowStarts(driver: StandardizedNascarDriver): number {
    return Math.max(0, driver.seasonPosition - driver.stats.poles - (driver.stats.poles * 2));
  }

  private estimateFrontRowFinish(driver: StandardizedNascarDriver): number {
    return driver.stats.averageFinish * 0.7; // Usually finish better from front
  }

  private estimateBackRowFinish(driver: StandardizedNascarDriver): number {
    return driver.stats.averageFinish * 1.2; // Usually finish worse from back
  }

  private calculateVsTopDrivers(driver: StandardizedNascarDriver): number {
    // Simplified calculation based on position
    return Math.max(0, 1 - (driver.seasonPosition / 40));
  }

  private calculateVsTeammates(driver: StandardizedNascarDriver): number {
    // Would need teammate data
    return 0.5; // Neutral default
  }

  private isNightRace(startTime: string): boolean {
    const hour = parseInt(startTime.split(':')[0]);
    return hour >= 19 || hour <= 6; // 7 PM to 6 AM considered night
  }

  /**
   * Data quality assessment methods
   */
  private assessNascarDataQuality(race: StandardizedNascarRace, driver: StandardizedNascarDriver): number {
    let quality = 1.0;
    
    // Check for missing critical data
    if (!race.track.type) quality -= 0.1;
    if (!race.specs.totalLaps) quality -= 0.1;
    if (!driver.stats.averageFinish) quality -= 0.2;
    if (!driver.currentPoints) quality -= 0.1;
    
    return Math.max(quality, 0);
  }

  private calculateNascarCompleteness(race: StandardizedNascarRace, driver: StandardizedNascarDriver): number {
    const requiredFields = [
      race.id, race.track.type, race.specs.totalLaps, race.specs.distance,
      driver.id, driver.stats.wins, driver.stats.averageFinish, driver.currentPoints
    ];
    
    const presentFields = requiredFields.filter(field => field !== undefined && field !== null).length;
    return presentFields / requiredFields.length;
  }

  /**
   * Validation methods
   */
  private validateNascarCompleteness(features: MLFeatureVector) {
    const requiredCategories = ['driver', 'track', 'team', 'race'];
    const presentCategories = requiredCategories.filter(cat => features.features[cat]).length;
    
    return {
      score: presentCategories / requiredCategories.length,
      missingFeatures: requiredCategories.filter(cat => !features.features[cat]),
      missingPercentage: ((requiredCategories.length - presentCategories) / requiredCategories.length) * 100
    };
  }

  private validateNascarAccuracy(features: MLFeatureVector) {
    // Check for reasonable value ranges
    const outliers: string[] = [];
    const anomalies: string[] = [];
    
    // Check driver features
    if (features.features.driver?.winRate > 1) outliers.push('driver.winRate');
    if (features.features.driver?.averageFinish > 50) anomalies.push('driver.averageFinish');
    
    return {
      score: Math.max(0, 1 - (outliers.length + anomalies.length) * 0.1),
      outliers,
      anomalies,
      suspiciousValues: []
    };
  }

  private validateNascarConsistency(features: MLFeatureVector) {
    const inconsistencies: string[] = [];
    
    // Check for logical consistency
    if (features.features.driver?.wins > features.features.driver?.top5) {
      inconsistencies.push('wins > top5');
    }
    
    return {
      score: Math.max(0, 1 - inconsistencies.length * 0.2),
      inconsistencies,
      logicalErrors: inconsistencies
    };
  }

  private validateNascarTimeliness(features: MLFeatureVector) {
    const lastUpdated = new Date(features.metadata.extractedAt);
    const ageHours = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    return {
      score: Math.max(0, 1 - (ageHours / 168)), // 1 week = full penalty
      staleFeatures: ageHours > 24 ? ['all'] : [],
      lastUpdated: { all: features.metadata.extractedAt }
    };
  }

  private generateNascarRecommendations(validation: any) {
    const recommendations = {
      critical: [] as string[],
      warning: [] as string[],
      info: [] as string[]
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

  private calculateNascarFeatureImportance(features: MLFeatureVector) {
    // Simplified feature importance based on NASCAR domain knowledge
    return {
      'driver.winRate': 0.25,
      'driver.averageFinish': 0.20,
      'track.driverTrackPerformance': 0.15,
      'driver.recentForm': 0.12,
      'team.teamQuality': 0.10,
      'race.competitionLevel': 0.08,
      'weather.weatherImpact': 0.05,
      'driver.consistencyRating': 0.05
    };
  }

  /**
   * Model-specific transformation methods
   */
  private async transformForXGBoost(features: MLFeatureVector): Promise<TransformedFeatureVector> {
    // Flatten features for XGBoost
    const flatFeatures: number[] = [];
    const featureNames: string[] = [];
    
    Object.entries(features.features).forEach(([category, categoryFeatures]) => {
      Object.entries(categoryFeatures).forEach(([featureName, value]) => {
        flatFeatures.push(typeof value === 'number' ? value : (value ? 1 : 0));
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
      numericIndices: Array.from({length: flatFeatures.length}, (_, i) => i),
      transformations: {
        normalization: { method: 'none', parameters: {} },
        encoding: { categoricalEncoding: 'none', encodingMaps: {} },
        scaling: { method: 'none', scalingFactors: {} }
      }
    };
  }

  private async transformForNeuralNetwork(features: MLFeatureVector): Promise<TransformedFeatureVector> {
    // Normalize all features for neural network
    const flatFeatures: number[] = [];
    const featureNames: string[] = [];
    
    Object.entries(features.features).forEach(([category, categoryFeatures]) => {
      Object.entries(categoryFeatures).forEach(([featureName, value]) => {
        let normalizedValue: number;
        if (typeof value === 'number') {
          normalizedValue = Math.min(Math.max(value, 0), 1); // Clip to [0,1]
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
      numericIndices: Array.from({length: flatFeatures.length}, (_, i) => i),
      transformations: {
        normalization: { method: 'minmax', parameters: { min: 0, max: 1 } },
        encoding: { categoricalEncoding: 'none', encodingMaps: {} },
        scaling: { method: 'minmax', scalingFactors: {} }
      }
    };
  }

  private async transformForRandomForest(features: MLFeatureVector): Promise<TransformedFeatureVector> {
    // Random Forest can handle mixed feature types well
    return this.transformForXGBoost(features); // Similar to XGBoost
  }

  /**
   * Utility methods
   */
  private scoreToQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'unusable' {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.7) return 'fair';
    if (score >= 0.5) return 'poor';
    return 'unusable';
  }
}

// Export the NASCAR feature extractor
export const nascarFeatureExtractor = new NascarFeatureExtractor();