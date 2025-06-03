/**
 * UFC Real-Time Data Integration Service
 *
 * Replaces mock data in ufcDataSyncService.ts with real UFC API integration
 * Provides live fight results, round-by-round scoring, and real-time updates
 */

import * as Sentry from '@sentry/react-native';

import apiKeys from '../../utils/apiKeys';
import { oddsCacheService } from '../oddsCacheService';
import { realTimeDataService, REALTIME_EVENTS } from '../realTimeDataService';

// UFC API configuration
const UFC_API_CONFIG = {
  baseUrl: 'https://api.sportsdata.io/v3/mma',
  officialUrl: 'https://api.ufc.com/v1',
  apiKey: apiKeys.getSportsDataApiKey(),
  timeout: 15000,
};

// UFC fighter interface
interface UFCFighter {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  weightClass: string;
  record: {
    wins: number;
    losses: number;
    draws: number;
    nc?: number;
  };
  rank?: number;
  isActive: boolean;
  height?: string;
  weight?: string;
  reach?: string;
  stance?: string;
  birthDate?: string;
  birthPlace?: string;
  lastUpdated: string;
}

// UFC event interface
interface UFCEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  location: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  fights: UFCFight[];
  lastUpdated: string;
}

// UFC fight interface
interface UFCFight {
  id: string;
  eventId: string;
  fighter1: UFCFighter;
  fighter2: UFCFighter;
  weightClass: string;
  fightType: 'main' | 'co-main' | 'preliminary' | 'early-preliminary';
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  result?: {
    winner: string;
    method: 'KO/TKO' | 'submission' | 'decision' | 'disqualification' | 'no-contest';
    round: number;
    time: string;
    details?: string;
  };
  liveStats?: {
    currentRound: number;
    timeElapsed: string;
    fighter1Stats: UFCLiveStats;
    fighter2Stats: UFCLiveStats;
  };
  lastUpdated: string;
}

// Live fight statistics
interface UFCLiveStats {
  significantStrikes: number;
  totalStrikes: number;
  takedowns: number;
  submissionAttempts: number;
  knockdowns: number;
  controlTime: string;
}

// UFC rankings interface
interface UFCRankings {
  division: string;
  date: string;
  rankings: {
    rank: number;
    fighterId: string;
    name: string;
    record: string;
  }[];
  lastUpdated: string;
}

/**
 * UFC Real-Time Data Integration Service
 * Replaces all mock data with real UFC API integration
 */
export class UFCRealTimeDataService {
  private isInitialized: boolean = false;
  private subscribedFights: Set<string> = new Set();
  private subscribedEvents: Set<string> = new Set();

  constructor() {
    this.setupRealTimeListeners();
  }

  /**
   * Initialize the service and set up real-time connections
   */
  async initialize(): Promise<void> {
    try {
      if (!UFC_API_CONFIG.apiKey) {
        throw new Error('UFC API key not configured');
      }

      // Initialize real-time data service
      await realTimeDataService.initialize();

      // Subscribe to UFC injury reports and fight updates
      await realTimeDataService.subscribeToInjuryReports('UFC');

      this.isInitialized = true;
      console.log('[UFC REALTIME] UFC real-time data service initialized');
    } catch (error) {
      console.error('[UFC REALTIME] Failed to initialize UFC real-time data service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Fetch all UFC fighters (replaces mock data)
   */
  async getAllFighters(): Promise<UFCFighter[]> {
    try {
      // Check cache first
      const cached = await oddsCacheService.getCachedData<UFCFighter[]>('ufc_all_fighters');
      if (cached && cached.source === 'api') {
        return cached.data;
      }

      // Fetch from API
      const response = await fetch(
        `${UFC_API_CONFIG.baseUrl}/scores/json/Fighters?key=${UFC_API_CONFIG.apiKey}`,
        { timeout: UFC_API_CONFIG.timeout }
      );

      if (!response.ok) {
        throw new Error(`UFC API error: ${response.status}`);
      }

      const apiData = await response.json();

      const fighters: UFCFighter[] = apiData.map((fighter: any) => ({
        id: fighter.FighterID?.toString() || fighter.GlobalTeamID?.toString(),
        name: `${fighter.FirstName} ${fighter.LastName}`,
        firstName: fighter.FirstName || '',
        lastName: fighter.LastName || '',
        nickname: fighter.Nickname || undefined,
        weightClass: fighter.WeightClass || 'Unknown',
        record: {
          wins: fighter.Wins || 0,
          losses: fighter.Losses || 0,
          draws: fighter.Draws || 0,
          nc: fighter.NoContests || 0,
        },
        rank: fighter.Ranking || undefined,
        isActive: fighter.Active === true,
        height: fighter.Height || undefined,
        weight: fighter.Weight || undefined,
        reach: fighter.Reach || undefined,
        stance: fighter.Stance || undefined,
        birthDate: fighter.BirthDate || undefined,
        birthPlace: fighter.BirthPlace || undefined,
        lastUpdated: new Date().toISOString(),
      }));

      // Cache the data for 1 hour
      await oddsCacheService.setCachedData('ufc_all_fighters', fighters, 3600000);

      console.log(`[UFC REALTIME] Fetched ${fighters.length} UFC fighters`);
      return fighters;
    } catch (error) {
      console.error('[UFC REALTIME] Error fetching UFC fighters:', error);
      Sentry.captureException(error);

      // Return empty array instead of crashing
      return [];
    }
  }

  /**
   * Fetch upcoming UFC events (replaces mock data)
   */
  async getUpcomingEvents(): Promise<UFCEvent[]> {
    try {
      // Check cache first
      const cached = await oddsCacheService.getCachedData<UFCEvent[]>('ufc_upcoming_events');
      if (cached && cached.source === 'api') {
        return cached.data;
      }

      // Fetch from API
      const response = await fetch(
        `${UFC_API_CONFIG.baseUrl}/scores/json/Schedule/2024?key=${UFC_API_CONFIG.apiKey}`,
        { timeout: UFC_API_CONFIG.timeout }
      );

      if (!response.ok) {
        throw new Error(`UFC API error: ${response.status}`);
      }

      const apiData = await response.json();

      // Filter for upcoming events
      const upcomingEvents = apiData.filter((event: any) => new Date(event.DateTime) > new Date());

      const events: UFCEvent[] = await Promise.all(
        upcomingEvents.map(async (event: any) => {
          const fights = await this.getEventFights(event.GameID?.toString());

          return {
            id: event.GameID?.toString() || event.GlobalGameID?.toString(),
            name: event.Title || `UFC Event ${event.GameID}`,
            date: event.DateTime,
            venue: event.VenueName || 'TBD',
            location: `${event.VenueCity || ''}, ${event.VenueCountry || ''}`.trim(),
            status: this.determineEventStatus(event),
            fights,
            lastUpdated: new Date().toISOString(),
          };
        })
      );

      // Cache for 30 minutes
      await oddsCacheService.setCachedData('ufc_upcoming_events', events, 1800000);

      console.log(`[UFC REALTIME] Fetched ${events.length} upcoming UFC events`);
      return events;
    } catch (error) {
      console.error('[UFC REALTIME] Error fetching upcoming events:', error);
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Get fights for a specific event
   */
  async getEventFights(eventId: string): Promise<UFCFight[]> {
    try {
      // Check cache first
      const cached = await oddsCacheService.getCachedData<UFCFight[]>(
        `ufc_event_fights_${eventId}`
      );
      if (cached && cached.source === 'api') {
        return cached.data;
      }

      // Fetch from API
      const response = await fetch(
        `${UFC_API_CONFIG.baseUrl}/scores/json/Fight/${eventId}?key=${UFC_API_CONFIG.apiKey}`,
        { timeout: UFC_API_CONFIG.timeout }
      );

      if (!response.ok) {
        throw new Error(`UFC API error: ${response.status}`);
      }

      const apiData = await response.json();

      const fights: UFCFight[] = apiData.map((fight: any) => ({
        id: fight.FightID?.toString() || fight.GlobalFightID?.toString(),
        eventId,
        fighter1: this.mapFighterData(fight.Fighters?.[0]),
        fighter2: this.mapFighterData(fight.Fighters?.[1]),
        weightClass: fight.WeightClass || 'Unknown',
        fightType: this.determineFightType(fight),
        status: this.determineFightStatus(fight),
        result: fight.Result ? this.mapFightResult(fight.Result) : undefined,
        liveStats: fight.LiveStats ? this.mapLiveStats(fight.LiveStats) : undefined,
        lastUpdated: new Date().toISOString(),
      }));

      // Cache for 10 minutes (shorter for fight data)
      await oddsCacheService.setCachedData(`ufc_event_fights_${eventId}`, fights, 600000);

      return fights;
    } catch (error) {
      console.error(`[UFC REALTIME] Error fetching fights for event ${eventId}:`, error);
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Get current UFC rankings (replaces mock data)
   */
  async getCurrentRankings(): Promise<UFCRankings[]> {
    try {
      // Check cache first
      const cached = await oddsCacheService.getCachedData<UFCRankings[]>('ufc_current_rankings');
      if (cached && cached.source === 'api') {
        return cached.data;
      }

      // Fetch fighters with rankings
      const fighters = await this.getAllFighters();

      // Group by weight class and create rankings
      const rankingsByDivision = new Map<string, UFCRankings>();

      fighters
        .filter(fighter => fighter.rank && fighter.isActive)
        .forEach(fighter => {
          if (!rankingsByDivision.has(fighter.weightClass)) {
            rankingsByDivision.set(fighter.weightClass, {
              division: fighter.weightClass,
              date: new Date().toISOString(),
              rankings: [],
              lastUpdated: new Date().toISOString(),
            });
          }

          const division = rankingsByDivision.get(fighter.weightClass)!;
          division.rankings.push({
            rank: fighter.rank!,
            fighterId: fighter.id,
            name: fighter.name,
            record: `${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}`,
          });
        });

      // Sort rankings within each division
      const rankings = Array.from(rankingsByDivision.values()).map(division => ({
        ...division,
        rankings: division.rankings.sort((a, b) => a.rank - b.rank),
      }));

      // Cache for 1 hour
      await oddsCacheService.setCachedData('ufc_current_rankings', rankings, 3600000);

      console.log(`[UFC REALTIME] Fetched rankings for ${rankings.length} divisions`);
      return rankings;
    } catch (error) {
      console.error('[UFC REALTIME] Error fetching UFC rankings:', error);
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Subscribe to live fight updates
   */
  async subscribeToLiveFight(fightId: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.subscribedFights.has(fightId)) {
        console.log(`[UFC REALTIME] Already subscribed to fight ${fightId}`);
        return;
      }

      // Subscribe to live scores for UFC
      await realTimeDataService.subscribeToLiveScores(fightId, 'UFC');
      this.subscribedFights.add(fightId);

      console.log(`[UFC REALTIME] Subscribed to live updates for fight ${fightId}`);
    } catch (error) {
      console.error(`[UFC REALTIME] Failed to subscribe to fight ${fightId}:`, error);
      Sentry.captureException(error);
    }
  }

  /**
   * Get recent fight results (replaces mock data)
   */
  async getRecentResults(): Promise<UFCFight[]> {
    try {
      // Check cache first
      const cached = await oddsCacheService.getCachedData<UFCFight[]>('ufc_recent_results');
      if (cached && cached.source === 'api') {
        return cached.data;
      }

      // Fetch recent completed events
      const response = await fetch(
        `${UFC_API_CONFIG.baseUrl}/scores/json/CompletedSchedule/2024?key=${UFC_API_CONFIG.apiKey}`,
        { timeout: UFC_API_CONFIG.timeout }
      );

      if (!response.ok) {
        throw new Error(`UFC API error: ${response.status}`);
      }

      const completedEvents = await response.json();

      // Get the most recent events (last 5)
      const recentEvents = completedEvents
        .sort((a: any, b: any) => new Date(b.DateTime).getTime() - new Date(a.DateTime).getTime())
        .slice(0, 5);

      const allRecentFights: UFCFight[] = [];

      for (const event of recentEvents) {
        const fights = await this.getEventFights(event.GameID?.toString());
        allRecentFights.push(...fights.filter(fight => fight.result));
      }

      // Sort by most recent first
      const recentResults = allRecentFights
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 20); // Last 20 fight results

      // Cache for 30 minutes
      await oddsCacheService.setCachedData('ufc_recent_results', recentResults, 1800000);

      console.log(`[UFC REALTIME] Fetched ${recentResults.length} recent fight results`);
      return recentResults;
    } catch (error) {
      console.error('[UFC REALTIME] Error fetching recent results:', error);
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Helper methods for data mapping
   */
  private mapFighterData(fighterData: any): UFCFighter {
    if (!fighterData) {
      return {
        id: 'unknown',
        name: 'Unknown Fighter',
        firstName: 'Unknown',
        lastName: 'Fighter',
        weightClass: 'Unknown',
        record: { wins: 0, losses: 0, draws: 0 },
        isActive: false,
        lastUpdated: new Date().toISOString(),
      };
    }

    return {
      id: fighterData.FighterID?.toString() || 'unknown',
      name: `${fighterData.FirstName} ${fighterData.LastName}`,
      firstName: fighterData.FirstName || '',
      lastName: fighterData.LastName || '',
      nickname: fighterData.Nickname,
      weightClass: fighterData.WeightClass || 'Unknown',
      record: {
        wins: fighterData.Wins || 0,
        losses: fighterData.Losses || 0,
        draws: fighterData.Draws || 0,
      },
      rank: fighterData.Ranking,
      isActive: fighterData.Active === true,
      lastUpdated: new Date().toISOString(),
    };
  }

  private determineEventStatus(event: any): 'upcoming' | 'live' | 'completed' | 'cancelled' {
    const eventDate = new Date(event.DateTime);
    const now = new Date();

    if (event.Status === 'Cancelled') return 'cancelled';
    if (eventDate > now) return 'upcoming';
    if (event.Status === 'Final') return 'completed';
    if (eventDate <= now && event.Status !== 'Final') return 'live';

    return 'upcoming';
  }

  private determineFightType(fight: any): 'main' | 'co-main' | 'preliminary' | 'early-preliminary' {
    if (fight.IsMainEvent) return 'main';
    if (fight.IsCoMainEvent) return 'co-main';
    if (fight.Card === 'Main') return 'preliminary';
    return 'early-preliminary';
  }

  private determineFightStatus(fight: any): 'scheduled' | 'live' | 'completed' | 'cancelled' {
    if (fight.Status === 'Cancelled') return 'cancelled';
    if (fight.WinnerID) return 'completed';
    if (fight.IsInProgress) return 'live';
    return 'scheduled';
  }

  private mapFightResult(result: any): any {
    return {
      winner: result.WinnerID?.toString(),
      method: result.Method || 'decision',
      round: result.Round || 1,
      time: result.Time || '5:00',
      details: result.Details,
    };
  }

  private mapLiveStats(liveStats: any): any {
    return {
      currentRound: liveStats.CurrentRound || 1,
      timeElapsed: liveStats.TimeElapsed || '0:00',
      fighter1Stats: {
        significantStrikes: liveStats.Fighter1SignificantStrikes || 0,
        totalStrikes: liveStats.Fighter1TotalStrikes || 0,
        takedowns: liveStats.Fighter1Takedowns || 0,
        submissionAttempts: liveStats.Fighter1Submissions || 0,
        knockdowns: liveStats.Fighter1Knockdowns || 0,
        controlTime: liveStats.Fighter1ControlTime || '0:00',
      },
      fighter2Stats: {
        significantStrikes: liveStats.Fighter2SignificantStrikes || 0,
        totalStrikes: liveStats.Fighter2TotalStrikes || 0,
        takedowns: liveStats.Fighter2Takedowns || 0,
        submissionAttempts: liveStats.Fighter2Submissions || 0,
        knockdowns: liveStats.Fighter2Knockdowns || 0,
        controlTime: liveStats.Fighter2ControlTime || '0:00',
      },
    };
  }

  /**
   * Setup real-time event listeners
   */
  private setupRealTimeListeners(): void {
    realTimeDataService.on(REALTIME_EVENTS.SCORE_UPDATE, scoreUpdate => {
      if (scoreUpdate.sport.toLowerCase() === 'ufc') {
        // Update cached fight data
        oddsCacheService.setCachedData(
          `ufc_live_fight_${scoreUpdate.gameId}`,
          scoreUpdate,
          5000,
          'api'
        );
        console.log(
          `[UFC REALTIME] Live fight update: ${scoreUpdate.awayTeam} vs ${scoreUpdate.homeTeam} - Round ${scoreUpdate.quarter}`
        );
      }
    });

    realTimeDataService.on(REALTIME_EVENTS.INJURY_REPORT, injuryReport => {
      if (injuryReport.sport.toLowerCase() === 'ufc') {
        console.log(
          `[UFC REALTIME] Fighter injury update: ${injuryReport.playerName} - ${injuryReport.injuryType}`
        );
      }
    });
  }

  /**
   * Get service status
   */
  getStatus(): {
    isInitialized: boolean;
    subscribedFights: string[];
    subscribedEvents: string[];
    realTimeStatus: any;
  } {
    return {
      isInitialized: this.isInitialized,
      subscribedFights: Array.from(this.subscribedFights),
      subscribedEvents: Array.from(this.subscribedEvents),
      realTimeStatus: realTimeDataService.getStatus(),
    };
  }

  /**
   * Cleanup subscriptions
   */
  async cleanup(): Promise<void> {
    for (const fightId of this.subscribedFights) {
      await realTimeDataService.unsubscribe(`scores_ufc_${fightId}`);
    }
    this.subscribedFights.clear();
    this.subscribedEvents.clear();
    console.log('[UFC REALTIME] Cleaned up UFC real-time subscriptions');
  }
}

// Export singleton instance
export const ufcRealTimeDataService = new UFCRealTimeDataService();
