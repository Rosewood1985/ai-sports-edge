/**
 * Performance Metrics Normalization Utility
 * Phase 2: Data Transformation Pipeline
 * Standardizes performance metrics across NASCAR and Horse Racing
 */

import { 
  RacingSport, 
  PerformanceNormalizer, 
  NormalizedPerformance, 
  RelativePerformance, 
  PerformanceTrend 
} from '../../types/racing/commonTypes';
import { StandardizedNascarDriver, StandardizedNascarResult } from '../../types/racing/nascarTypes';
import { StandardizedHorse, StandardizedHorseRaceResult } from '../../types/racing/horseRacingTypes';

/**
 * Performance Normalizer Service
 * Converts different racing sport metrics to standardized 0-1 scale
 */
export class RacingPerformanceNormalizer implements PerformanceNormalizer {
  
  /**
   * Normalize performance metrics across different racing formats
   */
  normalizePerformance(sport: RacingSport, rawMetrics: any): NormalizedPerformance {
    switch (sport) {
      case 'nascar':
        return this.normalizeNascarPerformance(rawMetrics);
      case 'horse_racing':
        return this.normalizeHorseRacingPerformance(rawMetrics);
      default:
        throw new Error(`Unsupported racing sport: ${sport}`);
    }
  }

  /**
   * Calculate relative performance within peer group
   */
  calculateRelativePerformance(
    performance: NormalizedPerformance, 
    peerGroup: NormalizedPerformance[]
  ): RelativePerformance {
    if (peerGroup.length === 0) {
      throw new Error('Peer group cannot be empty');
    }

    // Calculate peer group statistics
    const peerStats = this.calculatePeerGroupStats(peerGroup);
    
    // Calculate rankings
    const rankings = this.calculateRankings(performance, peerGroup);
    
    // Calculate performance gaps
    const gaps = this.calculatePerformanceGaps(performance, peerStats);

    return {
      participantId: performance.participantId,
      peerGroupId: this.generatePeerGroupId(peerGroup),
      calculatedAt: new Date().toISOString(),
      rankings,
      gaps,
      peerGroup: {
        size: peerGroup.length,
        averagePerformance: peerStats.average,
        topPerformer: peerStats.top,
        standardDeviation: peerStats.standardDeviation
      }
    };
  }

  /**
   * Generate performance trend analysis
   */
  analyzeTrends(historicalPerformance: NormalizedPerformance[]): PerformanceTrend {
    if (historicalPerformance.length < 2) {
      throw new Error('At least 2 performance data points required for trend analysis');
    }

    const participantId = historicalPerformance[0].participantId;
    const sortedPerformance = historicalPerformance.sort((a, b) => 
      new Date(a.normalizedAt).getTime() - new Date(b.normalizedAt).getTime()
    );

    // Calculate overall trend
    const overallTrend = this.calculateOverallTrend(sortedPerformance);
    
    // Analyze cycles and seasonality
    const cycles = this.analyzeCycles(sortedPerformance);
    
    // Generate forecast
    const forecast = this.generateForecast(sortedPerformance);
    
    // Detect change points
    const changePoints = this.detectChangePoints(sortedPerformance);

    return {
      participantId,
      analyzedAt: new Date().toISOString(),
      periodCovered: {
        startDate: sortedPerformance[0].normalizedAt,
        endDate: sortedPerformance[sortedPerformance.length - 1].normalizedAt,
        dataPoints: sortedPerformance.length
      },
      trends: overallTrend,
      cycles,
      forecast,
      changePoints
    };
  }

  /**
   * Normalize NASCAR driver performance
   */
  private normalizeNascarPerformance(driver: StandardizedNascarDriver): NormalizedPerformance {
    // NASCAR-specific normalization constants
    const NASCAR_MAX_WINS_SEASON = 36; // Theoretical maximum wins in a season
    const NASCAR_AVERAGE_FIELD_SIZE = 36;
    const NASCAR_TOP_FINISH_THRESHOLD = 10;

    return {
      participantId: driver.id,
      sport: 'nascar',
      normalizedAt: new Date().toISOString(),
      
      core: {
        winRate: Math.min(driver.stats.winRate / 100, 1), // Convert percentage to 0-1
        successRate: Math.min(driver.stats.top10Rate / 100, 1), // Top 10 as success
        consistency: this.calculateNascarConsistency(driver),
        improvement: this.calculateNascarImprovement(driver)
      },
      
      sportSpecific: {
        // NASCAR-specific metrics (normalized to 0-1)
        avgFinishNormalized: Math.max(0, 1 - (driver.stats.averageFinish / NASCAR_AVERAGE_FIELD_SIZE)),
        polePercentage: driver.stats.poles > 0 ? driver.stats.poles / 36 : 0, // Assuming 36 races max
        lapsLedPercentage: Math.min(driver.stats.lapsLed / 10000, 1), // Normalize to reasonable max
        dnfRateInverted: Math.max(0, 1 - (driver.stats.dnfRate / 100)), // Lower DNF rate is better
        
        // Points-based metrics
        pointsPerRace: driver.currentPoints / Math.max(driver.seasonPosition * 10, 1), // Rough normalization
        championshipPosition: Math.max(0, 1 - (driver.seasonPosition / 40)), // Top 40 normalization
        
        // Recent form
        recentFormScore: this.calculateNascarRecentFormScore(driver.recentForm),
        
        // Competition metrics
        manufacturerPerformance: this.getNascarManufacturerStrength(driver.manufacturer),
        teamQuality: this.estimateNascarTeamQuality(driver.team)
      },
      
      context: {
        competitionLevel: 0.9, // NASCAR is highly competitive
        conditionsRating: 0.8, // Standardized conditions
        experienceLevel: this.calculateNascarExperience(driver),
        equipmentRating: this.estimateNascarEquipmentQuality(driver)
      },
      
      reliability: {
        sampleSize: Math.max(driver.stats.wins + driver.stats.top5Finishes + driver.stats.top10Finishes, 1),
        dataQuality: 0.95, // NASCAR has high-quality data
        confidenceInterval: this.calculateConfidenceInterval(driver.stats.winRate, driver.seasonPosition),
        statisticalSignificance: this.calculateStatisticalSignificance(driver.stats)
      }
    };
  }

  /**
   * Normalize Horse Racing performance
   */
  private normalizeHorseRacingPerformance(horse: StandardizedHorse): NormalizedPerformance {
    // Horse racing normalization constants
    const HORSE_RACING_EXCELLENT_WIN_RATE = 30; // 30% win rate is excellent
    const HORSE_RACING_GOOD_STRIKE_RATE = 60; // 60% in-the-money rate is good
    const HORSE_RACING_MAX_EARNINGS_PER_START = 50000; // Reasonable maximum

    return {
      participantId: horse.id,
      sport: 'horse_racing',
      normalizedAt: new Date().toISOString(),
      
      core: {
        winRate: Math.min(horse.stats.winRate / HORSE_RACING_EXCELLENT_WIN_RATE, 1),
        successRate: Math.min(horse.stats.strikeRate / HORSE_RACING_GOOD_STRIKE_RATE, 1),
        consistency: this.calculateHorseConsistency(horse),
        improvement: this.calculateHorseImprovement(horse)
      },
      
      sportSpecific: {
        // Horse racing specific metrics
        placeRate: Math.min(horse.stats.placeRate / 50, 1), // 50% place rate normalization
        showRate: Math.min(horse.stats.showRate / 70, 1), // 70% show rate normalization
        earningsPerStartNormalized: Math.min(horse.stats.earningsPerStart / HORSE_RACING_MAX_EARNINGS_PER_START, 1),
        
        // Career progression
        careerProgression: this.calculateHorseCareerProgression(horse),
        seasonPerformance: this.calculateHorseSeasonPerformance(horse),
        
        // Physical and form factors
        ageFactorNormalized: this.calculateHorseAgeFactor(horse.age),
        conditionScore: horse.physical.condition / 10, // Already 1-10 scale
        formScore: horse.form.formRating / 100, // Assuming 0-100 form rating
        
        // Class and competition
        classRating: this.estimateHorseClassRating(horse),
        competitionQuality: this.estimateHorseCompetitionQuality(horse),
        
        // Breeding and genetics
        breedingIndex: this.calculateHorseBreedingIndex(horse.pedigree),
        
        // Track and distance suitability
        versatility: this.calculateHorseVersatility(horse.preferences)
      },
      
      context: {
        competitionLevel: this.estimateHorseCompetitionLevel(horse),
        conditionsRating: 0.7, // Variable track conditions
        experienceLevel: this.calculateHorseExperience(horse),
        equipmentRating: 0.8 // Less equipment variation than motorsports
      },
      
      reliability: {
        sampleSize: horse.stats.careerStarts,
        dataQuality: 0.85, // Horse racing data can be less standardized
        confidenceInterval: this.calculateConfidenceInterval(horse.stats.winRate, horse.stats.careerStarts),
        statisticalSignificance: this.calculateStatisticalSignificance(horse.stats)
      }
    };
  }

  /**
   * NASCAR-specific helper methods
   */
  private calculateNascarConsistency(driver: StandardizedNascarDriver): number {
    // Consistency based on standard deviation of finishes and DNF rate
    const topFinishConsistency = (driver.stats.top5Finishes + driver.stats.top10Finishes) / Math.max(driver.seasonPosition, 1);
    const reliabilityFactor = Math.max(0, 1 - (driver.stats.dnfRate / 100));
    return Math.min((topFinishConsistency * reliabilityFactor) / 2, 1);
  }

  private calculateNascarImprovement(driver: StandardizedNascarDriver): number {
    if (!driver.recentForm || driver.recentForm.positions.length < 3) {
      return 0.5; // Neutral if insufficient data
    }
    
    // Calculate trend from recent form
    const positions = driver.recentForm.positions;
    const trend = positions.reduce((acc, pos, index) => {
      const weight = (index + 1) / positions.length; // More weight to recent races
      const normalizedPos = Math.max(0, 1 - (pos / 40)); // Normalize position
      return acc + (normalizedPos * weight);
    }, 0) / positions.length;
    
    return Math.min(Math.max(trend, 0), 1);
  }

  private calculateNascarRecentFormScore(recentForm: any): number {
    if (!recentForm || !recentForm.positions || recentForm.positions.length === 0) {
      return 0.5;
    }
    
    const avgPosition = recentForm.positions.reduce((sum, pos) => sum + pos, 0) / recentForm.positions.length;
    return Math.max(0, 1 - (avgPosition / 40)); // Normalize to 40-car field
  }

  private getNascarManufacturerStrength(manufacturer: string): number {
    // Historical manufacturer performance (could be data-driven)
    const manufacturerStrengths: { [key: string]: number } = {
      'Chevrolet': 0.85,
      'Ford': 0.80,
      'Toyota': 0.82
    };
    return manufacturerStrengths[manufacturer] || 0.75;
  }

  private estimateNascarTeamQuality(team: string): number {
    // Could be enhanced with actual team performance data
    const topTeams = ['Hendrick Motorsports', 'Joe Gibbs Racing', 'Team Penske', 'Stewart-Haas Racing'];
    return topTeams.includes(team) ? 0.9 : 0.7;
  }

  private calculateNascarExperience(driver: StandardizedNascarDriver): number {
    // Estimate experience from career statistics
    const careerRaces = driver.stats.wins + driver.stats.top5Finishes + driver.stats.top10Finishes;
    return Math.min(careerRaces / 500, 1); // 500 races as full experience
  }

  private estimateNascarEquipmentQuality(driver: StandardizedNascarDriver): number {
    // Combine team quality and manufacturer strength
    const teamQuality = this.estimateNascarTeamQuality(driver.team);
    const manufacturerStrength = this.getNascarManufacturerStrength(driver.manufacturer);
    return (teamQuality + manufacturerStrength) / 2;
  }

  /**
   * Horse Racing-specific helper methods
   */
  private calculateHorseConsistency(horse: StandardizedHorse): number {
    if (horse.stats.careerStarts === 0) return 0;
    
    // Consistency based on strike rate and form variation
    const strikeRateConsistency = horse.stats.strikeRate / 100;
    const formConsistency = horse.form.formRating / 100;
    
    return (strikeRateConsistency + formConsistency) / 2;
  }

  private calculateHorseImprovement(horse: StandardizedHorse): number {
    const trendMap = {
      'improving': 0.8,
      'stable': 0.5,
      'declining': 0.2
    };
    return trendMap[horse.form.trend] || 0.5;
  }

  private calculateHorseCareerProgression(horse: StandardizedHorse): number {
    if (horse.stats.careerStarts === 0) return 0;
    
    const winProgression = horse.stats.careerWins / horse.stats.careerStarts;
    const earningsProgression = horse.stats.careerEarnings / (horse.stats.careerStarts * 10000); // Normalize
    
    return Math.min((winProgression + earningsProgression) / 2, 1);
  }

  private calculateHorseSeasonPerformance(horse: StandardizedHorse): number {
    if (horse.stats.seasonStarts === 0) return 0.5;
    
    const seasonWinRate = horse.stats.seasonWins / horse.stats.seasonStarts;
    const seasonValue = horse.stats.seasonEarnings / (horse.stats.seasonStarts * 5000); // Normalize
    
    return Math.min((seasonWinRate + seasonValue) / 2, 1);
  }

  private calculateHorseAgeFactor(age: number): number {
    // Age curve for horses - peak around 4-6 years
    if (age <= 2) return 0.6; // Young and developing
    if (age <= 4) return 0.9; // Improving
    if (age <= 6) return 1.0; // Peak
    if (age <= 8) return 0.8; // Still competitive
    return 0.6; // Veteran
  }

  private estimateHorseClassRating(horse: StandardizedHorse): number {
    // Estimate class based on earnings per start
    const earningsPerStart = horse.stats.earningsPerStart;
    if (earningsPerStart > 25000) return 1.0; // Elite class
    if (earningsPerStart > 15000) return 0.8; // High class
    if (earningsPerStart > 8000) return 0.6; // Medium class
    if (earningsPerStart > 3000) return 0.4; // Lower class
    return 0.2; // Bottom class
  }

  private estimateHorseCompetitionQuality(horse: StandardizedHorse): number {
    // Estimate based on earnings and win rate combination
    const competitionIndicator = (horse.stats.winRate / 100) * (horse.stats.earningsPerStart / 10000);
    return Math.min(competitionIndicator, 1);
  }

  private calculateHorseBreedingIndex(pedigree: any): number {
    if (!pedigree.sireWinRate && !pedigree.damProgenyWinRate) return 0.5;
    
    const sireContribution = (pedigree.sireWinRate || 0) / 100;
    const damContribution = (pedigree.damProgenyWinRate || 0) / 100;
    
    return (sireContribution + damContribution) / 2;
  }

  private calculateHorseVersatility(preferences: any): number {
    // Versatility based on range of preferred conditions
    const distanceRange = (preferences.preferredDistance.max - preferences.preferredDistance.min) / 10;
    const surfaceCount = preferences.preferredTrackType?.length || 1;
    const goingCount = preferences.preferredGoing?.length || 1;
    
    return Math.min((distanceRange + surfaceCount + goingCount) / 15, 1);
  }

  private estimateHorseCompetitionLevel(horse: StandardizedHorse): number {
    // Estimate competition level from class and earnings
    return this.estimateHorseClassRating(horse);
  }

  private calculateHorseExperience(horse: StandardizedHorse): number {
    // Experience based on career starts
    return Math.min(horse.stats.careerStarts / 50, 1); // 50 starts as full experience
  }

  /**
   * Common helper methods
   */
  private calculatePeerGroupStats(peerGroup: NormalizedPerformance[]) {
    const coreMetrics = ['winRate', 'successRate', 'consistency', 'improvement'];
    
    // Calculate averages
    const avgCore: any = {};
    coreMetrics.forEach(metric => {
      avgCore[metric] = peerGroup.reduce((sum, peer) => sum + peer.core[metric as keyof typeof peer.core], 0) / peerGroup.length;
    });

    // Find top performer
    const topPerformer = peerGroup.reduce((best, current) => {
      const bestScore = (best.core.winRate + best.core.successRate + best.core.consistency + best.core.improvement) / 4;
      const currentScore = (current.core.winRate + current.core.successRate + current.core.consistency + current.core.improvement) / 4;
      return currentScore > bestScore ? current : best;
    });

    // Calculate standard deviations
    const standardDeviation: any = {};
    coreMetrics.forEach(metric => {
      const variance = peerGroup.reduce((sum, peer) => {
        const diff = peer.core[metric as keyof typeof peer.core] - avgCore[metric];
        return sum + (diff * diff);
      }, 0) / peerGroup.length;
      standardDeviation[metric] = Math.sqrt(variance);
    });

    return {
      average: {
        ...peerGroup[0], // Copy structure
        core: avgCore
      } as NormalizedPerformance,
      top: topPerformer,
      standardDeviation
    };
  }

  private calculateRankings(performance: NormalizedPerformance, peerGroup: NormalizedPerformance[]) {
    const overallScore = (performance.core.winRate + performance.core.successRate + 
                         performance.core.consistency + performance.core.improvement) / 4;
    
    const peerScores = peerGroup.map(peer => 
      (peer.core.winRate + peer.core.successRate + peer.core.consistency + peer.core.improvement) / 4
    );
    
    const rank = peerScores.filter(score => score > overallScore).length + 1;
    const percentile = ((peerGroup.length - rank + 1) / peerGroup.length) * 100;
    
    const mean = peerScores.reduce((sum, score) => sum + score, 0) / peerScores.length;
    const variance = peerScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / peerScores.length;
    const std = Math.sqrt(variance);
    const zScore = std > 0 ? (overallScore - mean) / std : 0;

    return {
      overall: rank,
      percentile,
      zScore,
      byMetric: {} // Could be expanded for metric-specific rankings
    };
  }

  private calculatePerformanceGaps(performance: NormalizedPerformance, peerStats: any) {
    const performanceScore = (performance.core.winRate + performance.core.successRate + 
                            performance.core.consistency + performance.core.improvement) / 4;
    const averageScore = (peerStats.average.core.winRate + peerStats.average.core.successRate + 
                         peerStats.average.core.consistency + peerStats.average.core.improvement) / 4;
    const topScore = (peerStats.top.core.winRate + peerStats.top.core.successRate + 
                     peerStats.top.core.consistency + peerStats.top.core.improvement) / 4;

    return {
      toAverage: averageScore - performanceScore,
      toLeader: topScore - performanceScore,
      toNext: 0.05, // Simplified - would need actual ranking calculation
      improvementPotential: Math.max(0, topScore - performanceScore) * 0.7, // 70% of gap to leader
      achievableGoals: {
        winRate: Math.min(performance.core.winRate + 0.1, 1),
        successRate: Math.min(performance.core.successRate + 0.15, 1)
      }
    };
  }

  private calculateOverallTrend(performances: NormalizedPerformance[]) {
    // Simplified trend calculation
    const scores = performances.map(p => 
      (p.core.winRate + p.core.successRate + p.core.consistency + p.core.improvement) / 4
    );
    
    // Linear regression for trend
    const n = scores.length;
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * scores[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const direction = Math.sign(slope);
    
    let trend: 'improving' | 'declining' | 'stable' | 'volatile' = 'stable';
    if (Math.abs(slope) > 0.02) {
      trend = slope > 0 ? 'improving' : 'declining';
    }
    
    // Check for volatility
    const variance = scores.reduce((sum, score, i) => {
      const expected = (slope * i) + (sumY / n) - (slope * sumX / n);
      return sum + Math.pow(score - expected, 2);
    }, 0) / n;
    
    if (variance > 0.01) {
      trend = 'volatile';
    }

    return {
      overall: trend,
      direction,
      momentum: slope,
      acceleration: 0, // Simplified
      byMetric: {} // Could be expanded
    };
  }

  private analyzeCycles(performances: NormalizedPerformance[]) {
    // Simplified cycle analysis
    return {
      seasonality: {
        detected: false,
        period: 0,
        amplitude: 0,
        phase: 0
      },
      peaks: [],
      troughs: []
    };
  }

  private generateForecast(performances: NormalizedPerformance[]) {
    const recentPerformance = performances[performances.length - 1];
    const recentScore = (recentPerformance.core.winRate + recentPerformance.core.successRate + 
                        recentPerformance.core.consistency + recentPerformance.core.improvement) / 4;
    
    return {
      nextPeriod: recentScore, // Simplified - maintain current level
      confidence: 0.7,
      range: [recentScore * 0.9, recentScore * 1.1] as [number, number],
      factors: ['Recent form', 'Historical performance', 'Peer group comparison']
    };
  }

  private detectChangePoints(performances: NormalizedPerformance[]) {
    // Simplified change point detection
    return [];
  }

  private generatePeerGroupId(peerGroup: NormalizedPerformance[]): string {
    // Generate a hash-like ID for the peer group
    const ids = peerGroup.map(p => p.participantId).sort().join('');
    return `peer_group_${ids.substring(0, 8)}_${peerGroup.length}`;
  }

  private calculateConfidenceInterval(rate: number, sampleSize: number): [number, number] {
    // Simplified confidence interval calculation
    const margin = 1.96 * Math.sqrt((rate * (100 - rate)) / Math.max(sampleSize, 1)) / 100;
    return [Math.max(0, rate - margin), Math.min(1, rate + margin)];
  }

  private calculateStatisticalSignificance(stats: any): number {
    // Simplified significance calculation based on sample size
    const sampleSize = stats.careerStarts || stats.totalRaces || 1;
    return Math.min(sampleSize / 30, 1); // 30 as benchmark for significance
  }
}

// Export singleton instance
export const racingPerformanceNormalizer = new RacingPerformanceNormalizer();