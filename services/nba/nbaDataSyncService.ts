// =============================================================================
// NBA DATA SYNC SERVICE
// Comprehensive NBA Data Integration with Real-Time Updates
// =============================================================================

import * as Sentry from '@sentry/react-native';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  writeBatch,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import { firestore as db } from '../../config/firebase';
import { getWeatherApiKey, getApiKey } from '../../utils/apiKeys';

// NBA-specific interfaces
export interface NBATeam {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: 'Atlantic' | 'Central' | 'Southeast' | 'Northwest' | 'Pacific' | 'Southwest';
  arena: {
    name: string;
    capacity: number;
    location: {
      city: string;
      state: string;
      latitude?: number;
      longitude?: number;
    };
  };
  colors: {
    primary: string;
    secondary: string;
  };
  established: number;
  coach: {
    name: string;
    experience: number;
    winPercentage: number;
  };
  roster: NBAPlayer[];
  currentSeason: {
    wins: number;
    losses: number;
    winPercentage: number;
    streak: {
      type: 'W' | 'L';
      count: number;
    };
    homeRecord: { wins: number; losses: number };
    awayRecord: { wins: number; losses: number };
    conferenceRecord: { wins: number; losses: number };
    divisionRecord: { wins: number; losses: number };
  };
  lastUpdated: Date;
}

export interface NBAPlayer {
  id: string;
  name: string;
  jerseyNumber: number;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  height: string;
  weight: number;
  age: number;
  experience: number;
  college?: string;
  country: string;
  isRookie: boolean;
  isStarter: boolean;
  injuryStatus: {
    isInjured: boolean;
    type?: string;
    estimatedReturn?: Date;
    severity?: 'Day-to-Day' | 'Week-to-Week' | 'Month-to-Month' | 'Season-Ending';
  };
  currentSeason: {
    games: number;
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    playerEfficiencyRating: number;
  };
  advanced: {
    usageRate: number;
    trueShootingPercentage: number;
    reboundRate: number;
    assistRate: number;
    blockRate: number;
    stealRate: number;
    turnoverRate: number;
    winShares: number;
    boxPlusMinus: number;
    valueOverReplacementPlayer: number;
  };
  lastUpdated: Date;
}

export interface NBAGame {
  id: string;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  season: number;
  seasonType: 'Pre-Season' | 'Regular Season' | 'Playoffs';
  gameNumber: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'postponed' | 'cancelled';
  arena: string;
  attendance?: number;
  officials: string[];
  scores?: {
    home: number;
    away: number;
    quarters: {
      q1: { home: number; away: number };
      q2: { home: number; away: number };
      q3: { home: number; away: number };
      q4: { home: number; away: number };
      overtime?: { home: number; away: number }[];
    };
  };
  boxScore?: {
    homeTeam: TeamBoxScore;
    awayTeam: TeamBoxScore;
  };
  gameFlow?: {
    leadChanges: number;
    timesWed: number;
    biggestLead: {
      home: number;
      away: number;
    };
  };
  weather?: {
    temperature: number;
    humidity: number;
    condition: string;
  };
  broadcast: {
    tv: string[];
    radio: string[];
  };
  lastUpdated: Date;
}

export interface TeamBoxScore {
  teamId: string;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoals: { made: number; attempted: number; percentage: number };
    threePointers: { made: number; attempted: number; percentage: number };
    freeThrows: { made: number; attempted: number; percentage: number };
    fouls: number;
    timeoutsRemaining: number;
  };
  players: PlayerBoxScore[];
}

export interface PlayerBoxScore {
  playerId: string;
  name: string;
  position: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoals: { made: number; attempted: number };
  threePointers: { made: number; attempted: number };
  freeThrows: { made: number; attempted: number };
  plusMinus: number;
  isStarter: boolean;
}

export class NBADataSyncService {
  private readonly espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
  private readonly nbaStatsBaseUrl = 'https://stats.nba.com/stats';
  private readonly weatherApiKey: string;
  private readonly weatherBaseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly rateLimitDelay = 1000; // 1 second between requests to avoid rate limits
  private lastRequestTime = 0;
  private requestCount = 0;
  private readonly maxRetries = 3;

  constructor() {
    try {
      this.weatherApiKey = getWeatherApiKey();
    } catch (error) {
      Sentry.captureException(error);
      this.weatherApiKey = '';
      Sentry.addBreadcrumb({
        message: 'Weather API key not configured - weather features will be disabled',
        category: 'nba.init.weather',
        level: 'warning',
      });
    }
  }

  /**
   * Initialize the NBA data sync service
   */
  async initialize(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing NBA Data Sync Service',
        category: 'nba.init',
        level: 'info',
      });

      // Validate API access
      await this.validateApiAccess();

      console.log('NBA Data Sync Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize NBA Data Sync Service: ${error.message}`);
    }
  }

  /**
   * Validate API access before starting sync operations
   */
  private async validateApiAccess(): Promise<void> {
    try {
      // Test ESPN API access
      const response = await this.makeApiCall(`${this.espnBaseUrl}/teams`);
      if (!response || !response.sports) {
        throw new Error('ESPN NBA API access validation failed');
      }

      Sentry.addBreadcrumb({
        message: 'API access validation successful',
        category: 'nba.validation',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`API validation failed: ${error.message}`);
    }
  }

  /**
   * Comprehensive NBA data synchronization
   */
  async syncAllNBAData(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting comprehensive NBA data sync',
        category: 'nba.sync.start',
        level: 'info',
      });

      // Phase 1: Core data sync
      await this.syncTeams();
      await this.syncPlayers();

      // Phase 2: Game data sync
      await this.syncCurrentSeasonGames();
      await this.syncRecentGames();

      // Phase 3: Enhanced data sync
      await this.syncInjuryReports();
      await this.syncCoachingStaff();
      await this.syncArenaInformation();

      // Phase 4: Analytics data
      await this.syncAdvancedStats();
      await this.syncTeamRankings();

      Sentry.addBreadcrumb({
        message: 'NBA data sync completed successfully',
        category: 'nba.sync.complete',
        level: 'info',
      });

      console.log('NBA comprehensive data sync completed');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`NBA data sync failed: ${error.message}`);
    }
  }

  /**
   * Sync all NBA teams with comprehensive information
   */
  async syncTeams(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing NBA teams',
        category: 'nba.sync.teams',
        level: 'info',
      });

      const teamsData = await this.makeApiCall(`${this.espnBaseUrl}/teams`);

      if (!teamsData || !teamsData.sports || !teamsData.sports[0].leagues) {
        throw new Error('Invalid teams data structure from ESPN API');
      }

      const teams = teamsData.sports[0].leagues[0].teams;
      const batch = writeBatch(db);
      let syncedCount = 0;

      for (const teamData of teams) {
        try {
          const team = teamData.team;

          // Get detailed team information
          const detailedTeamData = await this.makeApiCall(`${this.espnBaseUrl}/teams/${team.id}`);
          const roster = await this.makeApiCall(`${this.espnBaseUrl}/teams/${team.id}/roster`);

          const nbaTeam: NBATeam = {
            id: team.id,
            name: team.displayName,
            city: team.location,
            abbreviation: team.abbreviation,
            conference: this.determineConference(team.id),
            division: this.determineDivision(team.id),
            arena: {
              name: detailedTeamData?.team?.venue?.fullName || 'Unknown Arena',
              capacity: detailedTeamData?.team?.venue?.capacity || 0,
              location: {
                city: detailedTeamData?.team?.venue?.address?.city || team.location,
                state: detailedTeamData?.team?.venue?.address?.state || 'Unknown',
                latitude: detailedTeamData?.team?.venue?.latitude,
                longitude: detailedTeamData?.team?.venue?.longitude,
              },
            },
            colors: {
              primary: team.color || '#000000',
              secondary: team.alternateColor || '#FFFFFF',
            },
            established: team.founded || 1946,
            coach: await this.getHeadCoach(team.id),
            roster: await this.processRoster(roster),
            currentSeason: await this.getCurrentSeasonRecord(team.id),
            lastUpdated: new Date(),
          };

          const teamRef = doc(db, 'nba_teams', team.id);
          batch.set(teamRef, nbaTeam);
          syncedCount++;

          // Rate limiting
          await this.enforceRateLimit();
        } catch (error) {
          Sentry.captureException(error);
          console.error(`Error syncing team ${teamData.team?.displayName}:`, error.message);
          continue;
        }
      }

      await batch.commit();
      console.log(`Successfully synced ${syncedCount} NBA teams`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to sync NBA teams: ${error.message}`);
    }
  }

  /**
   * Sync comprehensive player data for all NBA players
   */
  async syncPlayers(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing NBA players',
        category: 'nba.sync.players',
        level: 'info',
      });

      // Get all teams first
      const teamsSnapshot = await getDocs(collection(db, 'nba_teams'));
      const batch = writeBatch(db);
      let syncedCount = 0;

      for (const teamDoc of teamsSnapshot.docs) {
        try {
          const teamId = teamDoc.id;

          // Get roster data
          const rosterData = await this.makeApiCall(`${this.espnBaseUrl}/teams/${teamId}/roster`);

          if (rosterData?.athletes) {
            for (const athleteData of rosterData.athletes) {
              try {
                const player = athleteData.athlete;

                // Get detailed player stats
                const playerStats = await this.getPlayerStats(player.id);
                const advancedStats = await this.getAdvancedPlayerStats(player.id);

                const nbaPlayer: NBAPlayer = {
                  id: player.id,
                  name: player.displayName,
                  jerseyNumber: athleteData.jersey ? parseInt(athleteData.jersey) : 0,
                  position: athleteData.position?.abbreviation || 'G',
                  height: player.height || 'Unknown',
                  weight: player.weight || 0,
                  age: player.age || 0,
                  experience: player.experience?.years || 0,
                  college: player.college?.name,
                  country: player.birthPlace?.country || 'USA',
                  isRookie: (player.experience?.years || 0) === 0,
                  isStarter: athleteData.starter || false,
                  injuryStatus: await this.getPlayerInjuryStatus(player.id),
                  currentSeason: playerStats,
                  advanced: advancedStats,
                  lastUpdated: new Date(),
                };

                const playerRef = doc(db, 'nba_players', player.id);
                batch.set(playerRef, nbaPlayer);
                syncedCount++;

                // Rate limiting
                await this.enforceRateLimit();
              } catch (error) {
                Sentry.captureException(error);
                console.error(
                  `Error syncing player ${athleteData.athlete?.displayName}:`,
                  error.message
                );
                continue;
              }
            }
          }
        } catch (error) {
          Sentry.captureException(error);
          console.error(`Error syncing roster for team ${teamId}:`, error.message);
          continue;
        }
      }

      await batch.commit();
      console.log(`Successfully synced ${syncedCount} NBA players`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to sync NBA players: ${error.message}`);
    }
  }

  /**
   * Sync current season games
   */
  async syncCurrentSeasonGames(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing NBA current season games',
        category: 'nba.sync.games',
        level: 'info',
      });

      const currentSeason = new Date().getFullYear();
      const scoreboardData = await this.makeApiCall(`${this.espnBaseUrl}/scoreboard`);

      if (!scoreboardData?.events) {
        throw new Error('Invalid scoreboard data from ESPN API');
      }

      const batch = writeBatch(db);
      let syncedCount = 0;

      for (const event of scoreboardData.events) {
        try {
          const game: NBAGame = {
            id: event.id,
            date: new Date(event.date),
            homeTeam:
              event.competitions[0].competitors.find(c => c.homeAway === 'home')?.team?.id || '',
            awayTeam:
              event.competitions[0].competitors.find(c => c.homeAway === 'away')?.team?.id || '',
            season: currentSeason,
            seasonType: this.determineSeasonType(event.date),
            gameNumber: event.week || 1,
            status: this.mapGameStatus(event.status.type.name),
            arena: event.competitions[0].venue?.fullName || 'Unknown Arena',
            attendance: event.competitions[0].attendance,
            officials: event.competitions[0].officials?.map(o => o.displayName) || [],
            scores: event.competitions[0].competitors[0].score
              ? {
                  home: parseInt(
                    event.competitions[0].competitors.find(c => c.homeAway === 'home')?.score || '0'
                  ),
                  away: parseInt(
                    event.competitions[0].competitors.find(c => c.homeAway === 'away')?.score || '0'
                  ),
                  quarters: await this.getQuarterScores(event.id),
                }
              : undefined,
            boxScore:
              event.status.type.name === 'STATUS_FINAL'
                ? await this.getBoxScore(event.id)
                : undefined,
            gameFlow:
              event.status.type.name === 'STATUS_FINAL'
                ? await this.getGameFlow(event.id)
                : undefined,
            weather: await this.getGameWeather(event.competitions[0].venue),
            broadcast: {
              tv: event.competitions[0].broadcasts?.map(b => b.names?.join(', ')) || [],
              radio: [],
            },
            lastUpdated: new Date(),
          };

          const gameRef = doc(db, 'nba_games', event.id);
          batch.set(gameRef, game);
          syncedCount++;

          // Rate limiting
          await this.enforceRateLimit();
        } catch (error) {
          Sentry.captureException(error);
          console.error(`Error syncing game ${event.id}:`, error.message);
          continue;
        }
      }

      await batch.commit();
      console.log(`Successfully synced ${syncedCount} NBA games`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to sync NBA games: ${error.message}`);
    }
  }

  /**
   * Get recent games for analytics
   */
  async syncRecentGames(): Promise<void> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get recent completed games for analysis
      const gamesQuery = query(
        collection(db, 'nba_games'),
        where('date', '>=', oneWeekAgo),
        where('status', '==', 'completed')
      );

      const gamesSnapshot = await getDocs(gamesQuery);
      console.log(`Found ${gamesSnapshot.size} recent NBA games for analysis`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to sync recent NBA games: ${error.message}`);
    }
  }

  /**
   * Helper methods for data processing
   */

  private determineConference(teamId: string): 'Eastern' | 'Western' {
    // Eastern Conference team IDs (ESPN IDs)
    const easternTeams = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
    ];
    return easternTeams.includes(teamId) ? 'Eastern' : 'Western';
  }

  private determineDivision(
    teamId: string
  ): 'Atlantic' | 'Central' | 'Southeast' | 'Northwest' | 'Pacific' | 'Southwest' {
    const divisions = {
      Atlantic: ['1', '2', '3', '4', '5'], // Celtics, Nets, Knicks, 76ers, Raptors
      Central: ['6', '7', '8', '9', '10'], // Bulls, Cavaliers, Pistons, Pacers, Bucks
      Southeast: ['11', '12', '13', '14', '15'], // Hawks, Hornets, Heat, Magic, Wizards
      Northwest: ['16', '17', '18', '19', '20'], // Nuggets, Timberwolves, Thunder, Blazers, Jazz
      Pacific: ['21', '22', '23', '24', '25'], // Warriors, Clippers, Lakers, Suns, Kings
      Southwest: ['26', '27', '28', '29', '30'], // Mavericks, Rockets, Grizzlies, Pelicans, Spurs
    };

    for (const [division, teams] of Object.entries(divisions)) {
      if (teams.includes(teamId)) {
        return division as any;
      }
    }
    return 'Atlantic'; // Default
  }

  private determineSeasonType(dateString: string): 'Pre-Season' | 'Regular Season' | 'Playoffs' {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // 1-12

    if (month >= 10 || month <= 4) {
      return 'Regular Season';
    } else if (month >= 5 && month <= 6) {
      return 'Playoffs';
    } else {
      return 'Pre-Season';
    }
  }

  private mapGameStatus(
    status: string
  ): 'scheduled' | 'in-progress' | 'completed' | 'postponed' | 'cancelled' {
    switch (status) {
      case 'STATUS_SCHEDULED':
        return 'scheduled';
      case 'STATUS_IN_PROGRESS':
        return 'in-progress';
      case 'STATUS_FINAL':
        return 'completed';
      case 'STATUS_POSTPONED':
        return 'postponed';
      case 'STATUS_CANCELLED':
        return 'cancelled';
      default:
        return 'scheduled';
    }
  }

  /**
   * Rate limiting and API call management
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private async makeApiCall(url: string, retryCount = 0): Promise<any> {
    try {
      await this.enforceRateLimit();

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AI-Sports-Edge/1.0',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.warn(`API call failed, retrying (${retryCount + 1}/${this.maxRetries}): ${url}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.makeApiCall(url, retryCount + 1);
      }

      Sentry.captureException(error);
      throw error;
    }
  }

  // Placeholder methods for additional functionality (to be implemented)
  private async getHeadCoach(teamId: string): Promise<any> {
    return { name: 'TBD', experience: 0, winPercentage: 0 };
  }

  private async processRoster(roster: any): Promise<NBAPlayer[]> {
    return [];
  }

  private async getCurrentSeasonRecord(teamId: string): Promise<any> {
    return {
      wins: 0,
      losses: 0,
      winPercentage: 0,
      streak: { type: 'W' as const, count: 0 },
      homeRecord: { wins: 0, losses: 0 },
      awayRecord: { wins: 0, losses: 0 },
      conferenceRecord: { wins: 0, losses: 0 },
      divisionRecord: { wins: 0, losses: 0 },
    };
  }

  private async getPlayerStats(playerId: string): Promise<any> {
    return {
      games: 0,
      minutes: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fieldGoalPercentage: 0,
      threePointPercentage: 0,
      freeThrowPercentage: 0,
      playerEfficiencyRating: 0,
    };
  }

  private async getAdvancedPlayerStats(playerId: string): Promise<any> {
    return {
      usageRate: 0,
      trueShootingPercentage: 0,
      reboundRate: 0,
      assistRate: 0,
      blockRate: 0,
      stealRate: 0,
      turnoverRate: 0,
      winShares: 0,
      boxPlusMinus: 0,
      valueOverReplacementPlayer: 0,
    };
  }

  private async getPlayerInjuryStatus(playerId: string): Promise<any> {
    return { isInjured: false };
  }

  private async getQuarterScores(gameId: string): Promise<any> {
    return {
      q1: { home: 0, away: 0 },
      q2: { home: 0, away: 0 },
      q3: { home: 0, away: 0 },
      q4: { home: 0, away: 0 },
    };
  }

  private async getBoxScore(gameId: string): Promise<any> {
    return undefined;
  }

  private async getGameFlow(gameId: string): Promise<any> {
    return undefined;
  }

  private async getGameWeather(venue: any): Promise<any> {
    return undefined;
  }

  private async syncInjuryReports(): Promise<void> {
    console.log('Syncing NBA injury reports...');
  }

  private async syncCoachingStaff(): Promise<void> {
    console.log('Syncing NBA coaching staff...');
  }

  private async syncArenaInformation(): Promise<void> {
    console.log('Syncing NBA arena information...');
  }

  private async syncAdvancedStats(): Promise<void> {
    console.log('Syncing NBA advanced statistics...');
  }

  private async syncTeamRankings(): Promise<void> {
    console.log('Syncing NBA team rankings...');
  }

  /**
   * Public utility methods
   */

  async getAllActiveTeams(): Promise<NBATeam[]> {
    try {
      const teamsSnapshot = await getDocs(collection(db, 'nba_teams'));
      return teamsSnapshot.docs.map(doc => doc.data() as NBATeam);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get NBA teams: ${error.message}`);
    }
  }

  async getTeamById(teamId: string): Promise<NBATeam | null> {
    try {
      const teamDoc = await getDoc(doc(db, 'nba_teams', teamId));
      return teamDoc.exists() ? (teamDoc.data() as NBATeam) : null;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get NBA team ${teamId}: ${error.message}`);
    }
  }

  async getUpcomingGames(days: number = 7): Promise<NBAGame[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      const gamesQuery = query(
        collection(db, 'nba_games'),
        where('date', '>=', now),
        where('date', '<=', futureDate),
        where('status', '==', 'scheduled')
      );

      const gamesSnapshot = await getDocs(gamesQuery);
      return gamesSnapshot.docs.map(doc => doc.data() as NBAGame);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get upcoming NBA games: ${error.message}`);
    }
  }

  async getRecentGames(days: number = 7): Promise<NBAGame[]> {
    try {
      const now = new Date();
      const pastDate = new Date();
      pastDate.setDate(now.getDate() - days);

      const gamesQuery = query(
        collection(db, 'nba_games'),
        where('date', '>=', pastDate),
        where('date', '<=', now),
        where('status', '==', 'completed')
      );

      const gamesSnapshot = await getDocs(gamesQuery);
      return gamesSnapshot.docs.map(doc => doc.data() as NBAGame);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get recent NBA games: ${error.message}`);
    }
  }

  async getTeamUpcomingGames(teamId: string, count: number = 5): Promise<NBAGame[]> {
    try {
      const now = new Date();

      const gamesQuery = query(collection(db, 'nba_games'), where('date', '>=', now));

      const gamesSnapshot = await getDocs(gamesQuery);
      const teamGames = gamesSnapshot.docs
        .map(doc => doc.data() as NBAGame)
        .filter(game => game.homeTeam === teamId || game.awayTeam === teamId)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, count);

      return teamGames;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get upcoming games for team ${teamId}: ${error.message}`);
    }
  }
}

export const nbaDataSyncService = new NBADataSyncService();
