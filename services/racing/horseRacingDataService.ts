/**
 * Horse Racing Data Service
 * Handles Horse Racing data acquisition using rpscrape for UK/Ireland data
 * Part of Phase 1: Racing Data Integration Plan
 */

import {
  Race,
  Horse,
  Track,
  Jockey,
  Trainer,
  RaceStatus,
  TrackCondition,
  RaceType,
  RaceGrade,
} from '../../types/horseRacing';
import { cacheService } from '../cacheService';

// Enhanced interfaces for data acquisition
export interface RpscrapeMeeting {
  course: string;
  date: string;
  races: RpscrapeRace[];
}

export interface RpscrapeRace {
  time: string;
  race_name: string;
  race_type: string;
  distance: string;
  going: string;
  race_class: string;
  runners: RpscrapeRunner[];
  result?: RpscrapeResult[];
}

export interface RpscrapeRunner {
  horse_name: string;
  horse_age: number;
  jockey_name: string;
  trainer_name: string;
  weight: string;
  or: number; // Official rating
  rpr: number; // Racing Post rating
  ts: number; // Top speed
  odds: string;
  form: string;
  draw: number;
}

export interface RpscrapeResult {
  position: number;
  horse_name: string;
  jockey_name: string;
  trainer_name: string;
  age: number;
  weight: string;
  odds: string;
  time?: string;
  margin?: string;
}

export interface HorseRacingMLFeatures {
  raceId: string;
  horseId: string;
  features: {
    // Horse features
    age: number;
    weight: number;
    officialRating: number;
    racingPostRating: number;
    topSpeed: number;
    formFigures: number[];
    daysSinceLastRace: number;

    // Jockey features
    jockeyWinRate: number;
    jockeyPlaceRate: number;
    jockeyClaimingAllowance: number;

    // Trainer features
    trainerWinRate: number;
    trainerStrikeRate: number;
    trainerROI: number;

    // Track/conditions features
    trackWinRate: number;
    goingPreference: number;
    distancePreference: number;
    classAdjustment: number;

    // Market features
    oddsImpliedProbability: number;
    marketPosition: number;

    // Historical performance
    last5Avg: number;
    careerWins: number;
    careerRuns: number;
    earnings: number;
  };
}

/**
 * Horse Racing Data Service Class
 * Integrates with rpscrape for UK/Ireland racing data
 */
class HorseRacingDataService {
  private readonly CACHE_PREFIX = 'horse_racing_data';
  private readonly CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
  private readonly UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

  constructor() {
    this.scheduleDataUpdates();
  }

  /**
   * Get today's UK/Ireland racing meetings
   * @returns Array of racing meetings for today
   */
  async getTodaysMeetings(): Promise<RpscrapeMeeting[]> {
    const cacheKey = `${this.CACHE_PREFIX}_todays_meetings`;
    const today = new Date().toISOString().split('T')[0];

    try {
      // Check cache first
      const cachedData = await cacheService.get<RpscrapeMeeting[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch from rpscrape
      const meetings = await this.fetchMeetingsForDate(today);

      // Cache the results
      await cacheService.set(cacheKey, meetings, this.CACHE_TTL);

      return meetings;
    } catch (error) {
      console.error("Error fetching today's meetings:", error);
      return this.generateFallbackMeetings();
    }
  }

  /**
   * Get meetings for a specific date
   * @param date Date string in YYYY-MM-DD format
   * @returns Array of racing meetings for the date
   */
  async getMeetingsForDate(date: string): Promise<RpscrapeMeeting[]> {
    const cacheKey = `${this.CACHE_PREFIX}_meetings_${date}`;

    try {
      // Check cache first
      const cachedData = await cacheService.get<RpscrapeMeeting[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch from rpscrape
      const meetings = await this.fetchMeetingsForDate(date);

      // Cache the results (longer TTL for historical data)
      const ttl = this.isHistoricalDate(date) ? 24 * 60 * 60 * 1000 : this.CACHE_TTL;
      await cacheService.set(cacheKey, meetings, ttl);

      return meetings;
    } catch (error) {
      console.error(`Error fetching meetings for ${date}:`, error);
      return [];
    }
  }

  /**
   * Get race details with ML-ready features
   * @param course Course name
   * @param date Race date
   * @param raceTime Race time
   * @returns Race with enhanced ML features
   */
  async getRaceWithMLFeatures(
    course: string,
    date: string,
    raceTime: string
  ): Promise<{ race: Race; mlFeatures: HorseRacingMLFeatures[] } | null> {
    const cacheKey = `${this.CACHE_PREFIX}_ml_features_${course}_${date}_${raceTime}`;

    try {
      // Check cache first
      const cachedData = await cacheService.get<{
        race: Race;
        mlFeatures: HorseRacingMLFeatures[];
      }>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Get the race data
      const meetings = await this.getMeetingsForDate(date);
      const meeting = meetings.find(m => m.course.toLowerCase().includes(course.toLowerCase()));
      if (!meeting) return null;

      const rpscrapeRace = meeting.races.find(r => r.time === raceTime);
      if (!rpscrapeRace) return null;

      // Convert to standardized Race format
      const race = await this.convertRpscrapeToRace(rpscrapeRace, meeting, date);

      // Generate ML features for each horse
      const mlFeatures = await this.generateMLFeatures(race, rpscrapeRace);

      const result = { race, mlFeatures };

      // Cache the results
      await cacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error(`Error fetching race with ML features:`, error);
      return null;
    }
  }

  /**
   * Get historical performance data for a horse
   * @param horseName Horse name
   * @param monthsBack Number of months to look back
   * @returns Historical performance data
   */
  async getHorseHistory(horseName: string, monthsBack: number = 12): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIX}_horse_history_${horseName}_${monthsBack}`;

    try {
      // Check cache first
      const cachedData = await cacheService.get<any[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch historical data using rpscrape
      const history = await this.fetchHorseHistory(horseName, monthsBack);

      // Cache the results (longer TTL for historical data)
      await cacheService.set(cacheKey, history, 24 * 60 * 60 * 1000);

      return history;
    } catch (error) {
      console.error(`Error fetching horse history for ${horseName}:`, error);
      return [];
    }
  }

  /**
   * Get jockey statistics
   * @param jockeyName Jockey name
   * @param monthsBack Number of months to analyze
   * @returns Jockey performance statistics
   */
  async getJockeyStats(jockeyName: string, monthsBack: number = 12): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}_jockey_stats_${jockeyName}_${monthsBack}`;

    try {
      // Check cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch jockey statistics
      const stats = await this.fetchJockeyStats(jockeyName, monthsBack);

      // Cache the results
      await cacheService.set(cacheKey, stats, 24 * 60 * 60 * 1000);

      return stats;
    } catch (error) {
      console.error(`Error fetching jockey stats for ${jockeyName}:`, error);
      return null;
    }
  }

  /**
   * Get trainer statistics
   * @param trainerName Trainer name
   * @param monthsBack Number of months to analyze
   * @returns Trainer performance statistics
   */
  async getTrainerStats(trainerName: string, monthsBack: number = 12): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}_trainer_stats_${trainerName}_${monthsBack}`;

    try {
      // Check cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch trainer statistics
      const stats = await this.fetchTrainerStats(trainerName, monthsBack);

      // Cache the results
      await cacheService.set(cacheKey, stats, 24 * 60 * 60 * 1000);

      return stats;
    } catch (error) {
      console.error(`Error fetching trainer stats for ${trainerName}:`, error);
      return null;
    }
  }

  /**
   * Private method to fetch meetings using rpscrape
   */
  private async fetchMeetingsForDate(date: string): Promise<RpscrapeMeeting[]> {
    if (!this.isRpscrapeConfigured()) {
      console.warn('rpscrape not configured. Using fallback data.');
      return this.generateFallbackMeetings();
    }

    try {
      // In a real implementation, this would execute rpscrape
      // const { spawn } = require('child_process');
      // const rpscrape = spawn('rpscrape', ['-d', date, '-j']);

      // For now, simulate the rpscrape response structure
      return await this.simulateRpscrapeResponse(date);
    } catch (error) {
      console.error('Error executing rpscrape:', error);
      return this.generateFallbackMeetings();
    }
  }

  /**
   * Private method to convert rpscrape race to standardized Race format
   */
  private async convertRpscrapeToRace(
    rpscrapeRace: RpscrapeRace,
    meeting: RpscrapeMeeting,
    date: string
  ): Promise<Race> {
    const track: Track = {
      id: `track_${meeting.course.replace(/\s+/g, '_').toLowerCase()}`,
      name: meeting.course,
      code: meeting.course.substring(0, 3).toUpperCase(),
      location: `${meeting.course}, UK`,
      country: 'UK',
      timezone: 'Europe/London',
      surface: ['turf'],
    };

    const horses: Horse[] = rpscrapeRace.runners.map((runner, index) => ({
      id: `horse_${runner.horse_name.replace(/\s+/g, '_').toLowerCase()}`,
      name: runner.horse_name,
      age: runner.horse_age,
      sex: 'gelding', // Default, would need additional data source
      weight: this.parseWeight(runner.weight),
      jockey: {
        id: `jockey_${runner.jockey_name.replace(/\s+/g, '_').toLowerCase()}`,
        name: runner.jockey_name,
        wins: 0, // Would be populated from statistics
        places: 0,
        shows: 0,
        careerWinRate: 0,
        yearWinRate: 0,
        trackWinRate: 0,
      },
      trainer: {
        id: `trainer_${runner.trainer_name.replace(/\s+/g, '_').toLowerCase()}`,
        name: runner.trainer_name,
        wins: 0, // Would be populated from statistics
        winRate: 0,
        roi: 0,
      },
      form: runner.form,
      odds: this.parseOdds(runner.odds),
      currentOdds: this.parseOdds(runner.odds),
      saddleNumber: index + 1,
      postPosition: runner.draw,
      isScratched: false,
      speedFigures: [runner.rpr, runner.ts],
      equipment: [],
      medication: [],
    }));

    const race: Race = {
      id: `race_${meeting.course}_${date}_${rpscrapeRace.time}`.replace(/\s+/g, '_').toLowerCase(),
      trackId: track.id,
      track,
      date,
      postTime: rpscrapeRace.time,
      raceNumber: 0, // Would need to be determined from meeting structure
      name: rpscrapeRace.race_name,
      distance: this.parseDistance(rpscrapeRace.distance),
      surface: 'turf',
      condition: this.parseGoing(rpscrapeRace.going),
      raceType: this.parseRaceType(rpscrapeRace.race_type),
      raceGrade: this.parseRaceClass(rpscrapeRace.race_class),
      purse: 0, // Would need additional data source
      entries: horses,
      status: RaceStatus.UPCOMING,
      isStakes: false,
      isGraded: false,
    };

    return race;
  }

  /**
   * Private method to generate ML features for horses in a race
   */
  private async generateMLFeatures(
    race: Race,
    rpscrapeRace: RpscrapeRace
  ): Promise<HorseRacingMLFeatures[]> {
    const features: HorseRacingMLFeatures[] = [];

    for (let i = 0; i < race.entries.length; i++) {
      const horse = race.entries[i];
      const runner = rpscrapeRace.runners[i];

      if (!runner) continue;

      const horseFeatures: HorseRacingMLFeatures = {
        raceId: race.id,
        horseId: horse.id,
        features: {
          // Horse features
          age: horse.age,
          weight: horse.weight,
          officialRating: runner.or || 0,
          racingPostRating: runner.rpr || 0,
          topSpeed: runner.ts || 0,
          formFigures: this.parseFormFigures(runner.form),
          daysSinceLastRace: this.calculateDaysSinceLastRace(runner.form),

          // Jockey features (would be populated from statistics)
          jockeyWinRate: 0.1, // Placeholder
          jockeyPlaceRate: 0.3, // Placeholder
          jockeyClaimingAllowance: 0,

          // Trainer features (would be populated from statistics)
          trainerWinRate: 0.15, // Placeholder
          trainerStrikeRate: 0.2, // Placeholder
          trainerROI: -0.1, // Placeholder

          // Track/conditions features
          trackWinRate: 0.1, // Placeholder
          goingPreference: this.calculateGoingPreference(horse.name, race.condition),
          distancePreference: this.calculateDistancePreference(horse.name, race.distance),
          classAdjustment: this.calculateClassAdjustment(runner.or, race.raceGrade),

          // Market features
          oddsImpliedProbability: this.oddsToImpliedProbability(horse.odds),
          marketPosition: i + 1,

          // Historical performance (would be calculated from historical data)
          last5Avg: 0,
          careerWins: 0,
          careerRuns: 0,
          earnings: 0,
        },
      };

      features.push(horseFeatures);
    }

    return features;
  }

  /**
   * Private helper methods for data parsing and conversion
   */
  private parseWeight(weightStr: string): number {
    // Parse weight string like "9-2" (9 stone 2 pounds) to total pounds
    const parts = weightStr.split('-');
    const stones = parseInt(parts[0]) || 0;
    const pounds = parseInt(parts[1]) || 0;
    return stones * 14 + pounds;
  }

  private parseOdds(oddsStr: string): number {
    // Parse odds string like "5/1", "7/2", "evens" to decimal odds
    if (oddsStr.toLowerCase() === 'evens') return 2.0;
    if (oddsStr.includes('/')) {
      const [numerator, denominator] = oddsStr.split('/').map(Number);
      return numerator / denominator + 1;
    }
    return parseFloat(oddsStr) || 2.0;
  }

  private parseDistance(distanceStr: string): number {
    // Parse distance string like "1m 2f" to furlongs
    let furlongs = 0;
    if (distanceStr.includes('m')) {
      const miles = parseInt(distanceStr.match(/(\d+)m/)?.[1] || '0');
      furlongs += miles * 8;
    }
    if (distanceStr.includes('f')) {
      const extraFurlongs = parseInt(distanceStr.match(/(\d+)f/)?.[1] || '0');
      furlongs += extraFurlongs;
    }
    return furlongs;
  }

  private parseGoing(goingStr: string): TrackCondition {
    const going = goingStr.toLowerCase();
    if (going.includes('firm')) return TrackCondition.FIRM;
    if (going.includes('good')) return TrackCondition.GOOD;
    if (going.includes('soft')) return TrackCondition.SOFT;
    if (going.includes('heavy')) return TrackCondition.HEAVY;
    if (going.includes('fast')) return TrackCondition.FAST;
    return TrackCondition.GOOD;
  }

  private parseRaceType(raceTypeStr: string): RaceType {
    // Assume flat racing for UK/Ireland unless specified
    return RaceType.FLAT;
  }

  private parseRaceClass(raceClassStr: string): RaceGrade {
    const raceClass = raceClassStr.toLowerCase();
    if (raceClass.includes('group 1') || raceClass.includes('grade 1')) return RaceGrade.GRADE_1;
    if (raceClass.includes('group 2') || raceClass.includes('grade 2')) return RaceGrade.GRADE_2;
    if (raceClass.includes('group 3') || raceClass.includes('grade 3')) return RaceGrade.GRADE_3;
    if (raceClass.includes('listed')) return RaceGrade.LISTED;
    if (raceClass.includes('handicap')) return RaceGrade.HANDICAP;
    if (raceClass.includes('maiden')) return RaceGrade.MAIDEN;
    if (raceClass.includes('claiming')) return RaceGrade.CLAIMING;
    return RaceGrade.ALLOWANCE;
  }

  private parseFormFigures(formStr: string): number[] {
    return formStr
      .split('')
      .map(char => {
        const num = parseInt(char);
        return isNaN(num) ? 0 : num;
      })
      .slice(0, 5); // Last 5 runs
  }

  private calculateDaysSinceLastRace(formStr: string): number {
    // This would require additional date information from form data
    // Placeholder implementation
    return 14; // Assume 2 weeks
  }

  private calculateGoingPreference(horseName: string, condition: TrackCondition): number {
    // This would be calculated from historical performance on different going
    return 0.5; // Neutral preference
  }

  private calculateDistancePreference(horseName: string, distance: number): number {
    // This would be calculated from historical performance at different distances
    return 0.5; // Neutral preference
  }

  private calculateClassAdjustment(officialRating: number, raceGrade?: RaceGrade): number {
    // Calculate adjustment based on class of race vs horse's rating
    return 0; // No adjustment by default
  }

  private oddsToImpliedProbability(odds: number): number {
    return 1 / odds;
  }

  private async fetchHorseHistory(horseName: string, monthsBack: number): Promise<any[]> {
    // Implementation would use rpscrape to get horse's racing history
    // Placeholder for now
    return [];
  }

  private async fetchJockeyStats(jockeyName: string, monthsBack: number): Promise<any> {
    // Implementation would use rpscrape to get jockey statistics
    // Placeholder for now
    return null;
  }

  private async fetchTrainerStats(trainerName: string, monthsBack: number): Promise<any> {
    // Implementation would use rpscrape to get trainer statistics
    // Placeholder for now
    return null;
  }

  private isRpscrapeConfigured(): boolean {
    // Check if rpscrape is installed and configured
    return process.env.RPSCRAPE_ENABLED === 'true';
  }

  private isHistoricalDate(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate < today;
  }

  private scheduleDataUpdates(): void {
    // Schedule regular data updates
    setInterval(() => {
      this.updateTodaysData();
    }, this.UPDATE_INTERVAL);
  }

  private async updateTodaysData(): Promise<void> {
    try {
      console.log("Updating today's horse racing data...");
      const today = new Date().toISOString().split('T')[0];

      // Clear today's cache to force fresh data
      const cacheKey = `${this.CACHE_PREFIX}_todays_meetings`;
      await cacheService.delete(cacheKey);

      // Fetch fresh data
      await this.getTodaysMeetings();

      console.log('Horse racing data update completed.');
    } catch (error) {
      console.error('Error updating horse racing data:', error);
    }
  }

  /**
   * Private method to simulate rpscrape response for development
   */
  private async simulateRpscrapeResponse(date: string): Promise<RpscrapeMeeting[]> {
    // Simulate realistic UK racing meetings
    return [
      {
        course: 'Newmarket',
        date,
        races: [
          {
            time: '14:30',
            race_name: 'Maiden Stakes',
            race_type: 'Flat',
            distance: '1m',
            going: 'Good',
            race_class: 'Class 4',
            runners: [
              {
                horse_name: 'Thunder Bay',
                horse_age: 3,
                jockey_name: 'R. Moore',
                trainer_name: "A. P. O'Brien",
                weight: '9-0',
                or: 75,
                rpr: 80,
                ts: 85,
                odds: '3/1',
                form: '12543',
                draw: 1,
              },
              {
                horse_name: 'Lightning Strike',
                horse_age: 3,
                jockey_name: 'W. Buick',
                trainer_name: 'C. Appleby',
                weight: '9-0',
                or: 72,
                rpr: 78,
                ts: 82,
                odds: '5/2',
                form: '23164',
                draw: 2,
              },
            ],
          },
        ],
      },
    ];
  }

  private generateFallbackMeetings(): RpscrapeMeeting[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        course: 'Configuration Required',
        date: today,
        races: [
          {
            time: '15:00',
            race_name: 'Please Configure rpscrape',
            race_type: 'Configuration',
            distance: '0f',
            going: 'Configuration Required',
            race_class: 'Setup Required',
            runners: [],
          },
        ],
      },
    ];
  }
}

// Export singleton instance
export const horseRacingDataService = new HorseRacingDataService();
