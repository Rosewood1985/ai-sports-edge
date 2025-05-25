/**
 * NASCAR Data Service
 * Handles NASCAR data acquisition from NASCAR.data GitHub repository
 * Part of Phase 1: Racing Data Integration Plan
 */

import { cacheService } from '../cacheService';

// NASCAR data interfaces
export interface NascarRaceData {
  id: string;
  raceId: number;
  series: 'Cup' | 'Xfinity' | 'Truck';
  season: number;
  raceNumber: number;
  raceName: string;
  track: string;
  trackType: 'superspeedway' | 'intermediate' | 'short' | 'road_course' | 'dirt';
  date: string;
  weather: {
    temperature?: number;
    windSpeed?: number;
    precipitation?: boolean;
    condition: string;
  };
  totalLaps: number;
  distance: number; // in miles
  results: NascarDriverResult[];
}

export interface NascarDriverResult {
  driverId: string;
  driverName: string;
  carNumber: number;
  team: string;
  manufacturer: 'Ford' | 'Chevrolet' | 'Toyota';
  startPosition: number;
  finishPosition: number;
  lapsCompleted: number;
  lapsLed: number;
  status: 'running' | 'accident' | 'engine' | 'transmission' | 'other';
  points: number;
  winnings: number;
  averageSpeed?: number;
  fastestLap?: number;
  qualifyingSpeed?: number;
  qualifyingPosition?: number;
}

export interface NascarDriverStats {
  driverId: string;
  driverName: string;
  season: number;
  series: 'Cup' | 'Xfinity' | 'Truck';
  totalRaces: number;
  wins: number;
  top5: number;
  top10: number;
  poles: number;
  lapsLed: number;
  points: number;
  position: number;
  winnings: number;
  averageFinish: number;
  averageStart: number;
  dnfCount: number;
  winPercentage: number;
  top5Percentage: number;
  top10Percentage: number;
}

export interface NascarSeasonData {
  season: number;
  series: 'Cup' | 'Xfinity' | 'Truck';
  races: NascarRaceData[];
  driverStats: NascarDriverStats[];
  championshipStandings: {
    driverId: string;
    driverName: string;
    points: number;
    position: number;
    wins: number;
    playoffPoints?: number;
  }[];
}

/**
 * NASCAR Data Service Class
 * Provides methods for fetching and processing NASCAR data
 */
class NascarDataService {
  private readonly CACHE_PREFIX = 'nascar_data';
  private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
  private readonly NASCAR_API_BASE = 'https://api.github.com/repos/NASCAR/nascar-data';
  
  /**
   * Get NASCAR season data
   * @param season Season year
   * @param series NASCAR series
   * @returns Season data with races and standings
   */
  async getSeasonData(season: number, series: 'Cup' | 'Xfinity' | 'Truck' = 'Cup'): Promise<NascarSeasonData> {
    const cacheKey = `${this.CACHE_PREFIX}_season_${season}_${series}`;
    
    try {
      // Check cache first
      const cachedData = await cacheService.get<NascarSeasonData>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch from NASCAR.data repository
      const [races, driverStats, standings] = await Promise.all([
        this.fetchSeasonRaces(season, series),
        this.fetchDriverStats(season, series),
        this.fetchStandings(season, series)
      ]);
      
      const seasonData: NascarSeasonData = {
        season,
        series,
        races,
        driverStats,
        championshipStandings: standings
      };
      
      // Cache the results
      await cacheService.set(cacheKey, seasonData, this.CACHE_TTL);
      
      return seasonData;
    } catch (error) {
      console.error(`Error fetching NASCAR season ${season} ${series} data:`, error);
      throw new Error(`Failed to fetch NASCAR season data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get specific race data
   * @param raceId Race ID
   * @param season Season year
   * @param series NASCAR series
   * @returns Race data with results
   */
  async getRaceData(raceId: number, season: number, series: 'Cup' | 'Xfinity' | 'Truck' = 'Cup'): Promise<NascarRaceData | null> {
    const cacheKey = `${this.CACHE_PREFIX}_race_${raceId}_${season}_${series}`;
    
    try {
      // Check cache first
      const cachedData = await cacheService.get<NascarRaceData>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch from NASCAR.data repository
      const raceData = await this.fetchRaceById(raceId, season, series);
      
      if (raceData) {
        // Cache the results
        await cacheService.set(cacheKey, raceData, this.CACHE_TTL);
      }
      
      return raceData;
    } catch (error) {
      console.error(`Error fetching NASCAR race ${raceId} data:`, error);
      return null;
    }
  }
  
  /**
   * Get driver performance history
   * @param driverId Driver ID
   * @param seasons Array of seasons to analyze
   * @param series NASCAR series
   * @returns Driver performance data across seasons
   */
  async getDriverHistory(driverId: string, seasons: number[], series: 'Cup' | 'Xfinity' | 'Truck' = 'Cup'): Promise<NascarDriverStats[]> {
    const cacheKey = `${this.CACHE_PREFIX}_driver_${driverId}_${seasons.join('_')}_${series}`;
    
    try {
      // Check cache first
      const cachedData = await cacheService.get<NascarDriverStats[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch driver stats for each season
      const driverHistory = await Promise.all(
        seasons.map(season => this.fetchDriverStatsForSeason(driverId, season, series))
      );
      
      // Filter out null results
      const validHistory = driverHistory.filter(stats => stats !== null) as NascarDriverStats[];
      
      // Cache the results
      await cacheService.set(cacheKey, validHistory, this.CACHE_TTL);
      
      return validHistory;
    } catch (error) {
      console.error(`Error fetching NASCAR driver ${driverId} history:`, error);
      return [];
    }
  }
  
  /**
   * Get track performance analysis
   * @param trackName Track name
   * @param seasons Array of seasons to analyze
   * @param series NASCAR series
   * @returns Track performance data
   */
  async getTrackPerformance(trackName: string, seasons: number[], series: 'Cup' | 'Xfinity' | 'Truck' = 'Cup') {
    const cacheKey = `${this.CACHE_PREFIX}_track_${trackName}_${seasons.join('_')}_${series}`;
    
    try {
      // Check cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch track-specific race data
      const trackRaces = await this.fetchTrackRaces(trackName, seasons, series);
      const trackStats = this.calculateTrackStatistics(trackRaces);
      
      // Cache the results
      await cacheService.set(cacheKey, trackStats, this.CACHE_TTL);
      
      return trackStats;
    } catch (error) {
      console.error(`Error fetching track ${trackName} performance:`, error);
      return null;
    }
  }
  
  /**
   * Private method to fetch season races from NASCAR.data
   */
  private async fetchSeasonRaces(season: number, series: string): Promise<NascarRaceData[]> {
    if (!process.env.NASCAR_DATA_REPO_URL && !process.env.GITHUB_TOKEN) {
      console.warn('NASCAR data API integration not configured. Using fallback data.');
      return this.generateFallbackRaceData(season, series);
    }
    
    try {
      const apiUrl = process.env.NASCAR_DATA_REPO_URL || this.NASCAR_API_BASE;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Sports-Edge-App'
      };
      
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }
      
      // Fetch race data from repository contents
      const response = await fetch(`${apiUrl}/contents/data/${season}/${series}/races`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API responded with status: ${response.status}`);
      }
      
      const files = await response.json();
      const racePromises = files.map(async (file: any) => {
        if (file.name.endsWith('.json')) {
          const raceResponse = await fetch(file.download_url);
          return await raceResponse.json();
        }
        return null;
      });
      
      const races = await Promise.all(racePromises);
      return races.filter(race => race !== null).map(race => this.normalizeRaceData(race));
    } catch (error) {
      console.error('Error fetching NASCAR race data:', error);
      return this.generateFallbackRaceData(season, series);
    }
  }
  
  /**
   * Private method to fetch driver stats from NASCAR.data
   */
  private async fetchDriverStats(season: number, series: string): Promise<NascarDriverStats[]> {
    // Implementation for fetching driver statistics
    // This would connect to the NASCAR.data repository structure
    // For now, return processed driver stats from race results
    try {
      const races = await this.fetchSeasonRaces(season, series);
      return this.calculateDriverStatsFromRaces(races, season, series as 'Cup' | 'Xfinity' | 'Truck');
    } catch (error) {
      console.error('Error calculating driver stats:', error);
      return [];
    }
  }
  
  /**
   * Private method to fetch championship standings
   */
  private async fetchStandings(season: number, series: string) {
    try {
      const driverStats = await this.fetchDriverStats(season, series);
      return driverStats
        .sort((a, b) => b.points - a.points)
        .map((driver, index) => ({
          driverId: driver.driverId,
          driverName: driver.driverName,
          points: driver.points,
          position: index + 1,
          wins: driver.wins
        }));
    } catch (error) {
      console.error('Error fetching standings:', error);
      return [];
    }
  }
  
  /**
   * Private method to fetch specific race by ID
   */
  private async fetchRaceById(raceId: number, season: number, series: string): Promise<NascarRaceData | null> {
    try {
      const races = await this.fetchSeasonRaces(season, series);
      return races.find(race => race.raceId === raceId) || null;
    } catch (error) {
      console.error(`Error fetching race ${raceId}:`, error);
      return null;
    }
  }
  
  /**
   * Private method to fetch driver stats for specific season
   */
  private async fetchDriverStatsForSeason(driverId: string, season: number, series: string): Promise<NascarDriverStats | null> {
    try {
      const driverStats = await this.fetchDriverStats(season, series);
      return driverStats.find(stats => stats.driverId === driverId) || null;
    } catch (error) {
      console.error(`Error fetching driver ${driverId} stats for ${season}:`, error);
      return null;
    }
  }
  
  /**
   * Private method to fetch track-specific races
   */
  private async fetchTrackRaces(trackName: string, seasons: number[], series: string): Promise<NascarRaceData[]> {
    try {
      const allRaces = await Promise.all(
        seasons.map(season => this.fetchSeasonRaces(season, series))
      );
      
      return allRaces
        .flat()
        .filter(race => race.track.toLowerCase().includes(trackName.toLowerCase()));
    } catch (error) {
      console.error(`Error fetching track ${trackName} races:`, error);
      return [];
    }
  }
  
  /**
   * Private method to calculate driver statistics from race results
   */
  private calculateDriverStatsFromRaces(races: NascarRaceData[], season: number, series: 'Cup' | 'Xfinity' | 'Truck'): NascarDriverStats[] {
    const driverMap = new Map<string, Partial<NascarDriverStats>>();
    
    races.forEach(race => {
      race.results.forEach(result => {
        const driverId = result.driverId;
        
        if (!driverMap.has(driverId)) {
          driverMap.set(driverId, {
            driverId,
            driverName: result.driverName,
            season,
            series,
            totalRaces: 0,
            wins: 0,
            top5: 0,
            top10: 0,
            poles: 0,
            lapsLed: 0,
            points: 0,
            winnings: 0,
            dnfCount: 0,
            averageFinish: 0,
            averageStart: 0
          });
        }
        
        const stats = driverMap.get(driverId)!;
        stats.totalRaces = (stats.totalRaces || 0) + 1;
        stats.points = (stats.points || 0) + result.points;
        stats.winnings = (stats.winnings || 0) + result.winnings;
        stats.lapsLed = (stats.lapsLed || 0) + result.lapsLed;
        
        if (result.finishPosition === 1) stats.wins = (stats.wins || 0) + 1;
        if (result.finishPosition <= 5) stats.top5 = (stats.top5 || 0) + 1;
        if (result.finishPosition <= 10) stats.top10 = (stats.top10 || 0) + 1;
        if (result.qualifyingPosition === 1) stats.poles = (stats.poles || 0) + 1;
        if (result.status !== 'running') stats.dnfCount = (stats.dnfCount || 0) + 1;
      });
    });
    
    // Calculate percentages and averages
    return Array.from(driverMap.values()).map(stats => {
      const totalRaces = stats.totalRaces || 1; // Avoid division by zero
      return {
        ...stats,
        winPercentage: ((stats.wins || 0) / totalRaces) * 100,
        top5Percentage: ((stats.top5 || 0) / totalRaces) * 100,
        top10Percentage: ((stats.top10 || 0) / totalRaces) * 100,
        position: 0 // Will be calculated when sorting by points
      } as NascarDriverStats;
    }).sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((stats, index) => ({ ...stats, position: index + 1 }));
  }
  
  /**
   * Private method to calculate track statistics
   */
  private calculateTrackStatistics(races: NascarRaceData[]) {
    if (races.length === 0) return null;
    
    const totalRaces = races.length;
    const averageLaps = races.reduce((sum, race) => sum + race.totalLaps, 0) / totalRaces;
    const averageDistance = races.reduce((sum, race) => sum + race.distance, 0) / totalRaces;
    
    // Find most frequent winners
    const winnerCount = new Map<string, number>();
    races.forEach(race => {
      const winner = race.results.find(result => result.finishPosition === 1);
      if (winner) {
        winnerCount.set(winner.driverName, (winnerCount.get(winner.driverName) || 0) + 1);
      }
    });
    
    const topWinners = Array.from(winnerCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([driver, wins]) => ({ driver, wins }));
    
    return {
      trackName: races[0].track,
      totalRaces,
      averageLaps,
      averageDistance,
      trackType: races[0].trackType,
      topWinners,
      races: races.map(race => ({
        id: race.id,
        raceName: race.raceName,
        date: race.date,
        winner: race.results.find(r => r.finishPosition === 1)?.driverName || 'Unknown'
      }))
    };
  }
  
  /**
   * Private method to normalize race data from various sources
   */
  private normalizeRaceData(rawRaceData: any): NascarRaceData {
    return {
      id: rawRaceData.id || `race_${rawRaceData.race_id}_${rawRaceData.season}`,
      raceId: rawRaceData.race_id || rawRaceData.raceId,
      series: rawRaceData.series || 'Cup',
      season: rawRaceData.season || new Date().getFullYear(),
      raceNumber: rawRaceData.race_number || rawRaceData.raceNumber,
      raceName: rawRaceData.race_name || rawRaceData.raceName,
      track: rawRaceData.track || rawRaceData.track_name,
      trackType: this.determineTrackType(rawRaceData.track),
      date: rawRaceData.date || rawRaceData.race_date,
      weather: {
        temperature: rawRaceData.weather?.temperature,
        windSpeed: rawRaceData.weather?.wind_speed,
        precipitation: rawRaceData.weather?.precipitation,
        condition: rawRaceData.weather?.condition || 'Unknown'
      },
      totalLaps: rawRaceData.total_laps || rawRaceData.totalLaps,
      distance: rawRaceData.distance || rawRaceData.race_distance,
      results: rawRaceData.results?.map(this.normalizeDriverResult) || []
    };
  }
  
  /**
   * Private method to normalize driver result data
   */
  private normalizeDriverResult = (rawResult: any): NascarDriverResult => {
    return {
      driverId: rawResult.driver_id || rawResult.driverId || `driver_${rawResult.driver_name}`,
      driverName: rawResult.driver_name || rawResult.driverName,
      carNumber: rawResult.car_number || rawResult.carNumber,
      team: rawResult.team || rawResult.team_name,
      manufacturer: rawResult.manufacturer || 'Unknown',
      startPosition: rawResult.start_position || rawResult.startPosition,
      finishPosition: rawResult.finish_position || rawResult.finishPosition,
      lapsCompleted: rawResult.laps_completed || rawResult.lapsCompleted,
      lapsLed: rawResult.laps_led || rawResult.lapsLed || 0,
      status: rawResult.status || 'running',
      points: rawResult.points || 0,
      winnings: rawResult.winnings || 0,
      averageSpeed: rawResult.average_speed || rawResult.averageSpeed,
      fastestLap: rawResult.fastest_lap || rawResult.fastestLap,
      qualifyingSpeed: rawResult.qualifying_speed || rawResult.qualifyingSpeed,
      qualifyingPosition: rawResult.qualifying_position || rawResult.qualifyingPosition
    };
  };
  
  /**
   * Private method to determine track type
   */
  private determineTrackType(trackName: string): 'superspeedway' | 'intermediate' | 'short' | 'road_course' | 'dirt' {
    const track = trackName.toLowerCase();
    
    if (track.includes('daytona') || track.includes('talladega')) {
      return 'superspeedway';
    } else if (track.includes('road') || track.includes('course') || track.includes('glen') || track.includes('roval')) {
      return 'road_course';
    } else if (track.includes('bristol') || track.includes('martinsville') || track.includes('richmond')) {
      return 'short';
    } else if (track.includes('dirt') || track.includes('eldora')) {
      return 'dirt';
    } else {
      return 'intermediate';
    }
  }
  
  /**
   * Private method to generate fallback data when API is unavailable
   */
  private generateFallbackRaceData(season: number, series: string): NascarRaceData[] {
    // Return minimal fallback data structure
    return [{
      id: `fallback_race_${season}_${series}`,
      raceId: 1,
      series: series as 'Cup' | 'Xfinity' | 'Truck',
      season,
      raceNumber: 1,
      raceName: 'Fallback Race Data',
      track: 'Configuration Required',
      trackType: 'intermediate',
      date: new Date().toISOString().split('T')[0],
      weather: {
        condition: 'API Configuration Required'
      },
      totalLaps: 0,
      distance: 0,
      results: []
    }];
  }
}

// Export singleton instance
export const nascarDataService = new NascarDataService();