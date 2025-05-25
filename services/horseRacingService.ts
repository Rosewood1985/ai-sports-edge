import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Race, 
  Track, 
  Horse, 
  BetType, 
  BettingOption, 
  UserBet, 
  RaceStatus,
  TrackCondition,
  RaceType,
  RaceGrade,
  RacePrediction
} from '../types/horseRacing';
import { horseRacingDataService } from './racing/horseRacingDataService';

// Storage keys
const RACES_CACHE_KEY = 'races_cache';
const TRACKS_CACHE_KEY = 'tracks_cache';
const USER_BETS_KEY = 'user_bets';
const CACHE_EXPIRY = 1000 * 60 * 15; // 15 minutes

/**
 * Horse Racing Service
 * 
 * This service provides methods for fetching horse racing data:
 * - Tracks
 * - Races
 * - Horses
 * - Betting options
 * - User bets
 * - AI predictions
 */
class HorseRacingService {
  /**
   * Fetch all available tracks
   * @returns Array of tracks
   */
  async fetchTracks(): Promise<Track[]> {
    try {
      // Check cache first
      const cachedData = await this.getCachedData<Track[]>(TRACKS_CACHE_KEY);
      if (cachedData) {
        return cachedData;
      }
      
      // In a real app, we would fetch from an API
      // For now, return mock data
      const tracks = this.getMockTracks();
      
      // Cache the data
      await this.cacheData(TRACKS_CACHE_KEY, tracks);
      
      return tracks;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw error;
    }
  }
  
  /**
   * Fetch races for a specific track
   * @param trackId Track ID
   * @returns Array of races
   */
  async fetchRacesByTrack(trackId: string): Promise<Race[]> {
    try {
      // Check cache first
      const cacheKey = `${RACES_CACHE_KEY}_${trackId}`;
      const cachedData = await this.getCachedData<Race[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Production: Fetch from real horse racing API
      const allRaces = await this.getRealRaces();
      const trackRaces = allRaces.filter(race => race.trackId === trackId);
      
      // Cache the data
      await this.cacheData(cacheKey, trackRaces);
      
      return trackRaces;
    } catch (error) {
      console.error('Error fetching races by track:', error);
      throw error;
    }
  }
  
  /**
   * Fetch all upcoming races
   * @returns Array of races
   */
  async fetchUpcomingRaces(): Promise<Race[]> {
    try {
      // Check cache first
      const cacheKey = `${RACES_CACHE_KEY}_upcoming`;
      const cachedData = await this.getCachedData<Race[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Production: Fetch from real horse racing API
      const allRaces = await this.getRealRaces();
      const upcomingRaces = allRaces.filter(race => race.status === RaceStatus.UPCOMING);
      
      // Cache the data
      await this.cacheData(cacheKey, upcomingRaces);
      
      return upcomingRaces;
    } catch (error) {
      console.error('Error fetching upcoming races:', error);
      throw error;
    }
  }
  
  /**
   * Fetch a specific race by ID
   * @param raceId Race ID
   * @returns Race or null if not found
   */
  async fetchRaceById(raceId: string): Promise<Race | null> {
    try {
      // Production: Fetch from real horse racing API
      const allRaces = await this.getRealRaces();
      const race = allRaces.find(race => race.id === raceId) || null;
      
      return race;
    } catch (error) {
      console.error('Error fetching race by ID:', error);
      throw error;
    }
  }
  
  /**
   * Fetch betting options for a race
   * @param raceId Race ID
   * @returns Array of betting options
   */
  async fetchBettingOptions(raceId: string): Promise<BettingOption[]> {
    try {
      // In a real app, we would fetch from an API
      // For now, generate mock data
      const race = await this.fetchRaceById(raceId);
      if (!race) {
        return [];
      }
      
      return this.generateMockBettingOptions(race);
    } catch (error) {
      console.error('Error fetching betting options:', error);
      throw error;
    }
  }
  
  /**
   * Place a bet
   * @param bet User bet to place
   * @returns Success status
   */
  async placeBet(bet: UserBet): Promise<boolean> {
    try {
      // Get user's bets
      const userId = bet.userId;
      const key = `${USER_BETS_KEY}_${userId}`;
      const betsData = await AsyncStorage.getItem(key);
      const bets: UserBet[] = betsData ? JSON.parse(betsData) : [];
      
      // Add new bet
      bets.push(bet);
      
      // Save updated bets
      await AsyncStorage.setItem(key, JSON.stringify(bets));
      
      return true;
    } catch (error) {
      console.error('Error placing bet:', error);
      return false;
    }
  }
  
  /**
   * Get user's betting history
   * @param userId User ID
   * @returns Array of user bets
   */
  async getBettingHistory(userId: string): Promise<UserBet[]> {
    try {
      const key = `${USER_BETS_KEY}_${userId}`;
      const betsData = await AsyncStorage.getItem(key);
      
      if (!betsData) {
        return [];
      }
      
      return JSON.parse(betsData) as UserBet[];
    } catch (error) {
      console.error('Error getting betting history:', error);
      return [];
    }
  }
  
  /**
   * Get AI prediction for a race
   * @param raceId Race ID
   * @returns Race prediction
   */
  async getRacePrediction(raceId: string): Promise<RacePrediction | null> {
    try {
      // In a real app, we would fetch from an AI service
      // For now, generate mock prediction
      const race = await this.fetchRaceById(raceId);
      if (!race) {
        return null;
      }
      
      return this.generateMockPrediction(race);
    } catch (error) {
      console.error('Error getting race prediction:', error);
      return null;
    }
  }
  
  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(RACES_CACHE_KEY) || 
        key.startsWith(TRACKS_CACHE_KEY)
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
  
  /**
   * Get cached data
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cachedItem = await AsyncStorage.getItem(key);
      
      if (!cachedItem) {
        return null;
      }
      
      const { data, timestamp } = JSON.parse(cachedItem);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return data as T;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }
  
  /**
   * Cache data
   * @param key Cache key
   * @param data Data to cache
   */
  private async cacheData<T>(key: string, data: T): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }
  
  /**
   * Get mock tracks
   * @returns Array of mock tracks
   */
  private getMockTracks(): Track[] {
    return [
      {
        id: 'track-001',
        name: 'Santa Anita Park',
        code: 'SA',
        location: 'Arcadia, California',
        country: 'USA',
        timezone: 'America/Los_Angeles',
        surface: ['dirt', 'turf']
      },
      {
        id: 'track-002',
        name: 'Churchill Downs',
        code: 'CD',
        location: 'Louisville, Kentucky',
        country: 'USA',
        timezone: 'America/New_York',
        surface: ['dirt', 'turf']
      },
      {
        id: 'track-003',
        name: 'Belmont Park',
        code: 'BEL',
        location: 'Elmont, New York',
        country: 'USA',
        timezone: 'America/New_York',
        surface: ['dirt', 'turf']
      },
      {
        id: 'track-004',
        name: 'Keeneland',
        code: 'KEE',
        location: 'Lexington, Kentucky',
        country: 'USA',
        timezone: 'America/New_York',
        surface: ['dirt', 'turf', 'synthetic']
      },
      {
        id: 'track-005',
        name: 'Del Mar',
        code: 'DMR',
        location: 'Del Mar, California',
        country: 'USA',
        timezone: 'America/Los_Angeles',
        surface: ['dirt', 'turf']
      },
      {
        id: 'track-006',
        name: 'Saratoga',
        code: 'SAR',
        location: 'Saratoga Springs, New York',
        country: 'USA',
        timezone: 'America/New_York',
        surface: ['dirt', 'turf']
      },
      {
        id: 'track-007',
        name: 'Gulfstream Park',
        code: 'GP',
        location: 'Hallandale Beach, Florida',
        country: 'USA',
        timezone: 'America/New_York',
        surface: ['dirt', 'turf']
      },
      {
        id: 'track-008',
        name: 'Aqueduct',
        code: 'AQU',
        location: 'Queens, New York',
        country: 'USA',
        timezone: 'America/New_York',
        surface: ['dirt', 'turf']
      }
    ];
  }
  
  /**
   * Get production races with real data
   * @returns Array of races with real data
   */
  private async getRealRaces(): Promise<Race[]> {
    try {
      // Use the horse racing data service
      
      // Get today's and tomorrow's meetings
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const [todayMeetings, tomorrowMeetings] = await Promise.all([
        horseRacingDataService.getMeetingsForDate(today),
        horseRacingDataService.getMeetingsForDate(tomorrow)
      ]);
      
      const allRaces: Race[] = [];
      
      // Process today's meetings
      for (const meeting of todayMeetings) {
        for (const rpscrapeRace of meeting.races) {
          const raceData = await horseRacingDataService.getRaceWithMLFeatures(
            meeting.course, 
            meeting.date, 
            rpscrapeRace.time
          );
          if (raceData) {
            allRaces.push(raceData.race);
          }
        }
      }
      
      // Process tomorrow's meetings
      for (const meeting of tomorrowMeetings) {
        for (const rpscrapeRace of meeting.races) {
          const raceData = await horseRacingDataService.getRaceWithMLFeatures(
            meeting.course, 
            meeting.date, 
            rpscrapeRace.time
          );
          if (raceData) {
            allRaces.push(raceData.race);
          }
        }
      }
      
      if (allRaces.length > 0) {
        return allRaces;
      }
    } catch (error) {
      console.error('Error fetching real horse racing data:', error);
    }
    
    // Fallback to mock data if real data unavailable
    const tracks = this.getMockTracks();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    return [
      // Santa Anita Park races
      {
        id: 'race-001',
        trackId: 'track-001',
        track: tracks[0],
        date: todayStr,
        postTime: '14:30:00',
        raceNumber: 5,
        name: 'Santa Anita Derby',
        distance: 9, // 1 1/8 miles = 9 furlongs
        surface: 'dirt',
        condition: TrackCondition.FAST,
        raceType: RaceType.FLAT,
        raceGrade: RaceGrade.GRADE_1,
        purse: 1000000,
        ageRestrictions: '3yo',
        entries: await this.fetchRaceEntries(12, 'race-001'),
        status: RaceStatus.UPCOMING,
        isStakes: true,
        isGraded: true
      },
      {
        id: 'race-002',
        trackId: 'track-001',
        track: tracks[0],
        date: todayStr,
        postTime: '15:30:00',
        raceNumber: 6,
        distance: 6, // 6 furlongs
        surface: 'turf',
        condition: TrackCondition.FIRM,
        raceType: RaceType.FLAT,
        purse: 75000,
        entries: await this.fetchRaceEntries(10, 'race-002'),
        status: RaceStatus.UPCOMING,
        isStakes: false,
        isGraded: false
      },
      {
        id: 'race-003',
        trackId: 'track-001',
        track: tracks[0],
        date: todayStr,
        postTime: '16:30:00',
        raceNumber: 7,
        distance: 7, // 7 furlongs
        surface: 'dirt',
        condition: TrackCondition.FAST,
        raceType: RaceType.FLAT,
        purse: 85000,
        entries: await this.fetchRaceEntries(8, 'race-003'),
        status: RaceStatus.UPCOMING,
        isStakes: false,
        isGraded: false
      },
      
      // Churchill Downs races
      {
        id: 'race-004',
        trackId: 'track-002',
        track: tracks[1],
        date: todayStr,
        postTime: '16:45:00',
        raceNumber: 8,
        name: 'Kentucky Derby Prep',
        distance: 8, // 1 mile = 8 furlongs
        surface: 'dirt',
        condition: TrackCondition.FAST,
        raceType: RaceType.FLAT,
        raceGrade: RaceGrade.GRADE_2,
        purse: 750000,
        ageRestrictions: '3yo',
        entries: await this.fetchRaceEntries(14, 'race-004'),
        status: RaceStatus.UPCOMING,
        isStakes: true,
        isGraded: true
      },
      {
        id: 'race-005',
        trackId: 'track-002',
        track: tracks[1],
        date: todayStr,
        postTime: '17:30:00',
        raceNumber: 9,
        distance: 6.5, // 6.5 furlongs
        surface: 'dirt',
        condition: TrackCondition.FAST,
        raceType: RaceType.FLAT,
        purse: 62000,
        entries: await this.fetchRaceEntries(9, 'race-005'),
        status: RaceStatus.UPCOMING,
        isStakes: false,
        isGraded: false
      },
      
      // Belmont Park races
      {
        id: 'race-006',
        trackId: 'track-003',
        track: tracks[2],
        date: tomorrowStr,
        postTime: '13:30:00',
        raceNumber: 3,
        name: 'Belmont Gold Cup',
        distance: 16, // 2 miles = 16 furlongs
        surface: 'turf',
        condition: TrackCondition.FIRM,
        raceType: RaceType.FLAT,
        raceGrade: RaceGrade.GRADE_2,
        purse: 400000,
        entries: await this.fetchRaceEntries(7, 'race-006'),
        status: RaceStatus.UPCOMING,
        isStakes: true,
        isGraded: true
      },
      {
        id: 'race-007',
        trackId: 'track-003',
        track: tracks[2],
        date: tomorrowStr,
        postTime: '14:15:00',
        raceNumber: 4,
        distance: 7, // 7 furlongs
        surface: 'dirt',
        condition: TrackCondition.FAST,
        raceType: RaceType.FLAT,
        purse: 90000,
        entries: await this.fetchRaceEntries(11, 'race-007'),
        status: RaceStatus.UPCOMING,
        isStakes: false,
        isGraded: false
      },
      
      // Keeneland races
      {
        id: 'race-008',
        trackId: 'track-004',
        track: tracks[3],
        date: tomorrowStr,
        postTime: '15:45:00',
        raceNumber: 6,
        name: 'Bluegrass Stakes',
        distance: 9, // 1 1/8 miles = 9 furlongs
        surface: 'dirt',
        condition: TrackCondition.FAST,
        raceType: RaceType.FLAT,
        raceGrade: RaceGrade.GRADE_1,
        purse: 1000000,
        ageRestrictions: '3yo',
        entries: await this.fetchRaceEntries(10, 'race-008'),
        status: RaceStatus.UPCOMING,
        isStakes: true,
        isGraded: true
      }
    ];
  }
  
  /**
   * Fetch real horse race entries for a specific race
   * @param count Expected number of horses (for validation)
   * @param raceId Race ID
   * @returns Array of real horses from API
   */
  private async fetchRaceEntries(count: number, raceId: string): Promise<Horse[]> {
    try {
      // Use the horse racing data service
      
      // Parse race ID to extract course, date, and time
      const parts = raceId.split('_');
      if (parts.length >= 3) {
        const course = parts[1];
        const date = parts[2];
        const time = parts[3] || '15:00';
        
        const raceData = await horseRacingDataService.getRaceWithMLFeatures(course, date, time);
        if (raceData && raceData.race.entries.length > 0) {
          return raceData.race.entries;
        }
      }
    } catch (error) {
      console.error('Error fetching real race entries:', error);
    }
    
    // Fallback: check environment variables and return empty array
    if (!process.env.HORSE_RACING_API_KEY && !process.env.SPORTS_DATA_API_KEY && !process.env.RPSCRAPE_ENABLED) {
      console.warn('Horse racing data sources not configured. Please set RPSCRAPE_ENABLED=true, HORSE_RACING_API_KEY, or SPORTS_DATA_API_KEY.');
    }
    
    return [];
  }
  
  /**
   * Generate a random form string (e.g., "1-3-4-2")
   * @returns Random form string
   */
  private generateRandomForm(): string {
    const formLength = Math.floor(Math.random() * 3) + 3; // 3-5 races
    const form: number[] = [];
    
    for (let i = 0; i < formLength; i++) {
      form.push(Math.floor(Math.random() * 10) + 1); // 1-10 position
    }
    
    return form.join('-');
  }
  
  /**
   * Generate mock betting options for a race
   * @param race Race
   * @returns Array of mock betting options
   */
  private generateMockBettingOptions(race: Race): BettingOption[] {
    const options: BettingOption[] = [];
    const horses = race.entries.filter(horse => !horse.isScratched);
    
    // Win bets
    horses.forEach(horse => {
      options.push({
        id: `bet-${race.id}-win-${horse.id}`,
        raceId: race.id,
        betType: BetType.WIN,
        selections: [horse.saddleNumber],
        odds: horse.currentOdds || horse.odds || 5,
        minBet: 2
      });
    });
    
    // Place bets
    horses.forEach(horse => {
      options.push({
        id: `bet-${race.id}-place-${horse.id}`,
        raceId: race.id,
        betType: BetType.PLACE,
        selections: [horse.saddleNumber],
        odds: (horse.currentOdds || horse.odds || 5) * 0.6, // Lower odds for place
        minBet: 2
      });
    });
    
    // Show bets
    horses.forEach(horse => {
      options.push({
        id: `bet-${race.id}-show-${horse.id}`,
        raceId: race.id,
        betType: BetType.SHOW,
        selections: [horse.saddleNumber],
        odds: (horse.currentOdds || horse.odds || 5) * 0.4, // Lower odds for show
        minBet: 2
      });
    });
    
    // Exacta bets (top 20 combinations by odds)
    const exactaCombinations: { horses: number[], odds: number }[] = [];
    
    for (let i = 0; i < horses.length; i++) {
      for (let j = 0; j < horses.length; j++) {
        if (i !== j) {
          const horse1 = horses[i];
          const horse2 = horses[j];
          const combinedOdds = (horse1.currentOdds || horse1.odds || 5) * (horse2.currentOdds || horse2.odds || 5) * 0.8;
          
          exactaCombinations.push({
            horses: [horse1.saddleNumber, horse2.saddleNumber],
            odds: combinedOdds
          });
        }
      }
    }
    
    // Sort by odds (lowest to highest) and take top 20
    exactaCombinations.sort((a, b) => a.odds - b.odds);
    exactaCombinations.slice(0, 20).forEach((combo, index) => {
      options.push({
        id: `bet-${race.id}-exacta-${index}`,
        raceId: race.id,
        betType: BetType.EXACTA,
        selections: combo.horses,
        odds: combo.odds,
        minBet: 2
      });
    });
    
    // Trifecta bets (top 10 combinations by odds)
    const trifectaCombinations: { horses: number[], odds: number }[] = [];
    
    for (let i = 0; i < horses.length; i++) {
      for (let j = 0; j < horses.length; j++) {
        for (let k = 0; k < horses.length; k++) {
          if (i !== j && i !== k && j !== k) {
            const horse1 = horses[i];
            const horse2 = horses[j];
            const horse3 = horses[k];
            const combinedOdds = (horse1.currentOdds || horse1.odds || 5) * 
                                (horse2.currentOdds || horse2.odds || 5) * 
                                (horse3.currentOdds || horse3.odds || 5) * 0.7;
            
            trifectaCombinations.push({
              horses: [horse1.saddleNumber, horse2.saddleNumber, horse3.saddleNumber],
              odds: combinedOdds
            });
          }
        }
      }
    }
    
    // Sort by odds (lowest to highest) and take top 10
    trifectaCombinations.sort((a, b) => a.odds - b.odds);
    trifectaCombinations.slice(0, 10).forEach((combo, index) => {
      options.push({
        id: `bet-${race.id}-trifecta-${index}`,
        raceId: race.id,
        betType: BetType.TRIFECTA,
        selections: combo.horses,
        odds: combo.odds,
        minBet: 1
      });
    });
    
    return options;
  }
  
  /**
   * Generate a mock prediction for a race
   * @param race Race
   * @returns Mock prediction
   */
  private generateMockPrediction(race: Race): RacePrediction {
    const horses = race.entries.filter(horse => !horse.isScratched);
    const timestamp = Date.now();
    
    // Generate predictions for each horse
    const predictions = horses.map(horse => {
      const winProbability = Math.random();
      const placeProbability = Math.random() * (1 - winProbability) + winProbability;
      const showProbability = Math.random() * (1 - placeProbability) + placeProbability;
      const expectedValue = (winProbability * (horse.currentOdds || horse.odds || 5) * 2) - 2;
      const confidenceScore = Math.random() * 100;
      
      const keyFactors = [];
      if (Math.random() > 0.5) keyFactors.push('Recent form');
      if (Math.random() > 0.5) keyFactors.push('Jockey performance');
      if (Math.random() > 0.5) keyFactors.push('Trainer statistics');
      if (Math.random() > 0.5) keyFactors.push('Track condition preference');
      if (Math.random() > 0.5) keyFactors.push('Distance suitability');
      if (Math.random() > 0.5) keyFactors.push('Post position advantage');
      
      return {
        horseId: horse.id,
        horseName: horse.name,
        winProbability,
        placeProbability,
        showProbability,
        expectedValue,
        confidenceScore,
        keyFactors
      };
    });
    
    // Sort predictions by win probability (highest to lowest)
    predictions.sort((a, b) => b.winProbability - a.winProbability);
    
    // Generate suggested bets
    const suggestedBets = [];
    
    // Win bet on top horse
    if (predictions.length > 0) {
      const topHorse = predictions[0];
      suggestedBets.push({
        betType: BetType.WIN,
        selections: [horses.find(h => h.id === topHorse.horseId)?.saddleNumber || 1],
        recommendedAmount: 10,
        expectedValue: topHorse.expectedValue,
        confidenceScore: topHorse.confidenceScore,
        reasoning: `${topHorse.horseName} has the highest win probability at ${(topHorse.winProbability * 100).toFixed(1)}%.`
      });
    }
    
    // Exacta bet on top two horses
    if (predictions.length > 1) {
      const topHorse = predictions[0];
      const secondHorse = predictions[1];
      suggestedBets.push({
        betType: BetType.EXACTA,
        selections: [
          horses.find(h => h.id === topHorse.horseId)?.saddleNumber || 1,
          horses.find(h => h.id === secondHorse.horseId)?.saddleNumber || 2
        ],
        recommendedAmount: 5,
        expectedValue: topHorse.expectedValue * secondHorse.expectedValue,
        confidenceScore: (topHorse.confidenceScore + secondHorse.confidenceScore) / 2,
        reasoning: `${topHorse.horseName} and ${secondHorse.horseName} have the highest combined win probabilities.`
      });
    }
    
    // Trifecta bet on top three horses
    if (predictions.length > 2) {
      const topHorse = predictions[0];
      const secondHorse = predictions[1];
      const thirdHorse = predictions[2];
      suggestedBets.push({
        betType: BetType.TRIFECTA,
        selections: [
          horses.find(h => h.id === topHorse.horseId)?.saddleNumber || 1,
          horses.find(h => h.id === secondHorse.horseId)?.saddleNumber || 2,
          horses.find(h => h.id === thirdHorse.horseId)?.saddleNumber || 3
        ],
        recommendedAmount: 2,
        expectedValue: topHorse.expectedValue * secondHorse.expectedValue * thirdHorse.expectedValue,
        confidenceScore: (topHorse.confidenceScore + secondHorse.confidenceScore + thirdHorse.confidenceScore) / 3,
        reasoning: `${topHorse.horseName}, ${secondHorse.horseName}, and ${thirdHorse.horseName} have the highest combined win, place, and show probabilities.`
      });
    }
    
    // Generate track bias
    const trackBias = {
      favoredRunningStyle: ['early_speed', 'stalker', 'closer', 'none'][Math.floor(Math.random() * 4)] as 'early_speed' | 'stalker' | 'closer' | 'none',
      favoredPostPositions: [] as number[],
      biasStrength: ['strong', 'moderate', 'weak', 'none'][Math.floor(Math.random() * 4)] as 'strong' | 'moderate' | 'weak' | 'none',
      notes: ''
    };
    
    // Generate favored post positions
    if (trackBias.biasStrength !== 'none') {
      const numPositions = Math.floor(Math.random() * 3) + 1; // 1-3 positions
      const positions = [];
      
      for (let i = 0; i < numPositions; i++) {
        positions.push(Math.floor(Math.random() * horses.length) + 1);
      }
      
      trackBias.favoredPostPositions = positions;
      
      // Generate notes
      if (trackBias.favoredRunningStyle !== 'none') {
        trackBias.notes = `The track appears to favor ${trackBias.favoredRunningStyle.replace('_', ' ')} horses`;
        
        if (trackBias.favoredPostPositions.length > 0) {
          trackBias.notes += ` from post positions ${trackBias.favoredPostPositions.join(', ')}`;
        }
        
        trackBias.notes += '.';
      } else if (trackBias.favoredPostPositions.length > 0) {
        trackBias.notes = `The track appears to favor post positions ${trackBias.favoredPostPositions.join(', ')}.`;
      }
    }
    
    // Generate pace scenario
    const paceScenario = {
      projectedPace: ['fast', 'moderate', 'slow'][Math.floor(Math.random() * 3)] as 'fast' | 'moderate' | 'slow',
      earlyPaceSetters: [] as string[],
      closers: [] as string[],
      paceAdvantage: ''
    };
    
    // Randomly assign horses as pace setters or closers
    horses.forEach(horse => {
      if (Math.random() > 0.7) {
        paceScenario.earlyPaceSetters.push(horse.id);
      } else if (Math.random() > 0.7) {
        paceScenario.closers.push(horse.id);
      }
    });
    
    // Determine pace advantage
    if (paceScenario.projectedPace === 'fast' && paceScenario.closers.length > 0) {
      const randomCloser = paceScenario.closers[Math.floor(Math.random() * paceScenario.closers.length)];
      paceScenario.paceAdvantage = randomCloser;
    } else if (paceScenario.projectedPace === 'slow' && paceScenario.earlyPaceSetters.length > 0) {
      const randomPaceSetter = paceScenario.earlyPaceSetters[Math.floor(Math.random() * paceScenario.earlyPaceSetters.length)];
      paceScenario.paceAdvantage = randomPaceSetter;
    } else if (paceScenario.earlyPaceSetters.length > 0 || paceScenario.closers.length > 0) {
      const allRunningStyles = [...paceScenario.earlyPaceSetters, ...paceScenario.closers];
      const randomHorse = allRunningStyles[Math.floor(Math.random() * allRunningStyles.length)];
      paceScenario.paceAdvantage = randomHorse;
    }
    
    // Generate weather impact if applicable
    let weatherImpact = undefined;
    
    if (race.weather && race.weather.condition && race.weather.condition !== 'sunny') {
      const affectedHorses: {
        horseId: string;
        impact: 'positive' | 'negative' | 'neutral';
        reason: string;
      }[] = [];
      
      horses.forEach(horse => {
        if (Math.random() > 0.7) {
          const impact = Math.random() > 0.5 ? 'positive' : 'negative';
          const reasons = [
            'past performance in similar conditions',
            'breeding suggests preference',
            'trainer statistics in these conditions',
            'running style suits conditions'
          ];
          const reason = reasons[Math.floor(Math.random() * reasons.length)];
          
          affectedHorses.push({
            horseId: horse.id,
            impact: impact as 'positive' | 'negative' | 'neutral',
            reason
          });
        }
      });
      
      if (affectedHorses.length > 0) {
        weatherImpact = {
          affectedHorses,
          overallImpact: `The ${race.weather.condition} conditions may impact the race outcome.`
        };
      }
    }
    
    return {
      raceId: race.id,
      timestamp,
      predictions,
      suggestedBets,
      trackBias,
      paceScenario,
      weatherImpact
    };
  }
}

// Export as singleton
export const horseRacingService = new HorseRacingService();