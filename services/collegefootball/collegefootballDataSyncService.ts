import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';
import axios from 'axios';

interface CollegeFootballGame {
  gameId: string;
  season: number;
  week: number;
  seasonType: 'regular' | 'postseason'; // regular season vs bowl games
  date: string;
  homeTeam: CollegeFootballTeam;
  awayTeam: CollegeFootballTeam;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';
  quarter?: number;
  timeRemaining?: string;
  venue: {
    venueId: string;
    name: string;
    city: string;
    state: string;
    capacity: number;
    grass: boolean;
    dome: boolean;
    timezone: string;
  };
  conference: {
    homeConference: string;
    awayConference: string;
  };
  gameType: 'conference' | 'non_conference' | 'bowl' | 'playoff' | 'championship';
  weather?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    precipitation: number;
    conditions: string;
  };
  officials?: {
    referee: string;
    umpire: string;
    linesman: string;
  };
  broadcast?: {
    network: string;
    announcers: string[];
  };
  odds?: {
    spread: number;
    overUnder: number;
    moneylineHome: number;
    moneylineAway: number;
    spreadOddsHome: number;
    spreadOddsAway: number;
  };
  drives?: Array<{
    driveId: string;
    team: string;
    startPeriod: number;
    startClock: string;
    startYardLine: number;
    endPeriod: number;
    endClock: string;
    endYardLine: number;
    plays: number;
    yards: number;
    timeOfPossession: string;
    result: 'touchdown' | 'field_goal' | 'punt' | 'turnover' | 'safety' | 'missed_fg' | 'end_half';
  }>;
  liveStats?: {
    homeStats: GameStats;
    awayStats: GameStats;
  };
}

interface CollegeFootballTeam {
  teamId: string;
  name: string;
  abbreviation: string;
  mascot: string;
  displayName: string;
  conference: string;
  division?: string;
  color: string;
  alternateColor: string;
  logos: {
    small: string;
    medium: string;
    large: string;
  };
  location: {
    city: string;
    state: string;
  };
  venue: {
    venueId: string;
    name: string;
    capacity: number;
  };
  classification: 'FBS' | 'FCS' | 'Division II' | 'Division III';
  founded: number;
  // Recruiting and program metrics
  recruiting?: {
    currentClassRank: number;
    avgRecruitRating: number;
    blueChipRatio: number; // Percentage of 4/5 star recruits
    transferPortalActivity: number;
  };
  coaching?: {
    headCoach: {
      name: string;
      experience: number;
      winPercentage: number;
      bowlRecord: string;
      recruitingReputation: number; // 1-100 scale
    };
    offensiveCoordinator?: string;
    defensiveCoordinator?: string;
    specialTeamsCoordinator?: string;
  };
  facilities?: {
    facilitiesRank: number; // National ranking of facilities
    stadiumRank: number;
    trainingRank: number;
  };
}

interface GameStats {
  totalYards: number;
  passingYards: number;
  rushingYards: number;
  firstDowns: number;
  thirdDownConversions: string; // "8/15" format
  fourthDownConversions: string;
  completionAttempts: string; // "22/35" format
  netPassingYards: number;
  rushingAttempts: number;
  penalties: string; // "7-65" format (count-yards)
  turnovers: number;
  fumblesLost: number;
  interceptionsThrown: number;
  possessionTime: string; // "MM:SS" format
  redZoneAttempts: number;
  redZoneConversions: number;
}

interface TeamSeasonStats {
  teamId: string;
  season: number;
  conference: string;
  
  // Win-Loss record
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
  
  // Offensive stats
  pointsPerGame: number;
  totalYardsPerGame: number;
  passingYardsPerGame: number;
  rushingYardsPerGame: number;
  firstDownsPerGame: number;
  thirdDownConversionPct: number;
  redZoneConversionPct: number;
  turnoversPerGame: number;
  
  // Defensive stats
  pointsAllowedPerGame: number;
  totalYardsAllowedPerGame: number;
  passingYardsAllowedPerGame: number;
  rushingYardsAllowedPerGame: number;
  firstDownsAllowedPerGame: number;
  thirdDownDefensePct: number;
  redZoneDefensePct: number;
  takeawaysPerGame: number;
  sacksPerGame: number;
  
  // Special teams
  fieldGoalPct: number;
  puntingAverage: number;
  kickoffReturnAverage: number;
  puntReturnAverage: number;
  
  // Advanced metrics
  strengthOfSchedule: number;
  strengthOfRecord: number;
  sagarin: number;
  massey: number;
  bcs: number;
  
  // Efficiency metrics
  offensiveEfficiency: number;
  defensiveEfficiency: number;
  specialTeamsEfficiency: number;
  
  // Situational stats
  homeRecord: string;
  awayRecord: string;
  vsRankedRecord: string;
  closeGameRecord: string; // Games decided by 7 points or less
  
  // Recruiting impact
  talentComposite: number; // 247Sports team talent composite
  experienceLevel: number; // Average years of experience
  depthChartRating: number;
}

interface CollegeFootballPlayer {
  playerId: string;
  name: string;
  position: string;
  jersey: number;
  teamId: string;
  
  // Physical attributes
  height: string;
  weight: number;
  age: number;
  
  // Academic/eligibility
  year: 'FR' | 'SO' | 'JR' | 'SR' | '5SR'; // Freshman, Sophomore, etc.
  eligibilityRemaining: number;
  academicStanding: 'good' | 'probation' | 'suspended';
  
  // Recruiting info
  recruitRating: number; // Stars (2-5)
  recruitRank: number; // National ranking
  hometown: {
    city: string;
    state: string;
    highSchool: string;
  };
  
  // Performance stats (season)
  stats?: {
    // Quarterback stats
    passingYards?: number;
    passingTouchdowns?: number;
    interceptions?: number;
    completionPercentage?: number;
    passerRating?: number;
    
    // Running back stats
    rushingYards?: number;
    rushingTouchdowns?: number;
    rushingAttempts?: number;
    yardsPerCarry?: number;
    
    // Receiver stats
    receptions?: number;
    receivingYards?: number;
    receivingTouchdowns?: number;
    yardsPerReception?: number;
    dropsCount?: number;
    
    // Defensive stats
    tackles?: number;
    assistedTackles?: number;
    tacklesForLoss?: number;
    sacks?: number;
    interceptions?: number;
    passBreakups?: number;
    forcedFumbles?: number;
    
    // Special teams stats
    fieldGoalsMade?: number;
    fieldGoalsAttempted?: number;
    extraPointsMade?: number;
    extraPointsAttempted?: number;
    puntingAverage?: number;
    kickoffReturnAverage?: number;
  };
  
  // Draft projection (for upperclassmen)
  draftProjection?: {
    round: number;
    pick: number;
    grade: string;
    strengths: string[];
    weaknesses: string[];
  };
  
  // Injury status
  injuryStatus: 'healthy' | 'questionable' | 'doubtful' | 'out';
  injuryDetails?: string;
}

interface Conference {
  conferenceId: string;
  name: string;
  abbreviation: string;
  classification: 'FBS' | 'FCS';
  divisions?: string[];
  teams: string[]; // Array of team IDs
  
  // Conference strength metrics
  sagarin: number;
  massey: number;
  rpi: number;
  
  // Historical data
  founded: number;
  championships: number;
  bowlTieIns: string[];
  playoffRepresentation: number; // CFP appearances
}

interface Rankings {
  season: number;
  week: number;
  pollType: 'AP' | 'Coaches' | 'CFP' | 'BCS';
  rankings: Array<{
    rank: number;
    teamId: string;
    points: number;
    firstPlaceVotes?: number;
    previousRank?: number;
    trend: 'up' | 'down' | 'same' | 'new' | 'out';
  }>;
  releasedDate: string;
}

export class CollegeFootballDataSyncService {
  private db: admin.firestore.Firestore;
  private espnApiKey: string;
  private sportsRadarApiKey: string;
  private cfbApiKey: string; // College Football Data API

  constructor() {
    this.db = admin.firestore();
    this.espnApiKey = process.env.ESPN_API_KEY || '';
    this.sportsRadarApiKey = process.env.SPORTSRADAR_API_KEY || '';
    this.cfbApiKey = process.env.CFB_DATA_API_KEY || '';
  }

  async syncAllData(): Promise<void> {
    const transaction = Sentry.startTransaction({
      name: 'college-football-full-sync',
      op: 'data-sync'
    });

    try {
      await Promise.all([
        this.syncTeams(),
        this.syncConferences(),
        this.syncVenues(),
        this.syncCurrentWeekGames(),
        this.syncRankings(),
        this.syncRecruitingData()
      ]);

      console.log('College Football data sync completed successfully');
      transaction.setStatus('ok');

    } catch (error) {
      console.error('College Football data sync failed:', error);
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async syncTeams(): Promise<void> {
    const span = Sentry.startSpan({ name: 'sync-cfb-teams' });

    try {
      // Use ESPN API for team data
      const response = await axios.get(
        'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams',
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'AI-Sports-Edge/1.0',
          }
        }
      );

      const teams = response.data.sports[0].leagues[0].teams;
      const batch = this.db.batch();
      let batchCount = 0;

      for (const teamData of teams) {
        const team = teamData.team;
        
        // Get additional recruiting and coaching data
        const additionalData = await this.getTeamAdditionalData(team.id);
        
        const cfbTeam: CollegeFootballTeam = {
          teamId: team.id,
          name: team.name,
          abbreviation: team.abbreviation,
          mascot: team.nickname || team.name,
          displayName: team.displayName,
          conference: team.conference?.name || 'Independent',
          division: team.conference?.division,
          color: team.color,
          alternateColor: team.alternateColor,
          logos: {
            small: team.logos?.[0]?.href || '',
            medium: team.logos?.[1]?.href || team.logos?.[0]?.href || '',
            large: team.logos?.[2]?.href || team.logos?.[1]?.href || team.logos?.[0]?.href || ''
          },
          location: {
            city: team.location?.city || '',
            state: team.location?.state || ''
          },
          venue: {
            venueId: team.venue?.id || '',
            name: team.venue?.fullName || '',
            capacity: team.venue?.capacity || 0
          },
          classification: this.determineClassification(team.conference?.name),
          founded: team.founded || 1900,
          recruiting: additionalData.recruiting,
          coaching: additionalData.coaching,
          facilities: additionalData.facilities
        };

        const teamRef = this.db.collection('cfb_teams').doc(team.id);
        batch.set(teamRef, {
          ...cfbTeam,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        batchCount++;
        if (batchCount === 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`Synced ${teams.length} college football teams`);

    } catch (error) {
      console.error('Error syncing CFB teams:', error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private async getTeamAdditionalData(teamId: string): Promise<any> {
    try {
      // In production, integrate with 247Sports API, Rivals API, etc.
      // For now, return placeholder data
      return {
        recruiting: {
          currentClassRank: Math.floor(Math.random() * 130) + 1,
          avgRecruitRating: 85 + Math.random() * 15,
          blueChipRatio: Math.random() * 100,
          transferPortalActivity: Math.floor(Math.random() * 20)
        },
        coaching: {
          headCoach: {
            name: 'Head Coach',
            experience: Math.floor(Math.random() * 20) + 1,
            winPercentage: 0.5 + Math.random() * 0.4,
            bowlRecord: '5-3',
            recruitingReputation: 60 + Math.random() * 40
          }
        },
        facilities: {
          facilitiesRank: Math.floor(Math.random() * 130) + 1,
          stadiumRank: Math.floor(Math.random() * 130) + 1,
          trainingRank: Math.floor(Math.random() * 130) + 1
        }
      };
    } catch (error) {
      return {
        recruiting: undefined,
        coaching: undefined,
        facilities: undefined
      };
    }
  }

  private determineClassification(conferenceName?: string): 'FBS' | 'FCS' | 'Division II' | 'Division III' {
    const fbsConferences = [
      'SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12', 'American Athletic',
      'Mountain West', 'Conference USA', 'MAC', 'Sun Belt', 'FBS Independents'
    ];
    
    if (!conferenceName) return 'FBS';
    
    return fbsConferences.some(conf => conferenceName.includes(conf)) ? 'FBS' : 'FCS';
  }

  async syncConferences(): Promise<void> {
    const span = Sentry.startSpan({ name: 'sync-cfb-conferences' });

    try {
      const response = await axios.get(
        'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams',
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'AI-Sports-Edge/1.0',
          }
        }
      );

      const teams = response.data.sports[0].leagues[0].teams;
      const conferenceMap = new Map<string, any>();

      // Group teams by conference
      teams.forEach((teamData: any) => {
        const team = teamData.team;
        const confName = team.conference?.name;
        
        if (confName && !conferenceMap.has(confName)) {
          conferenceMap.set(confName, {
            conferenceId: team.conference.id || confName.toLowerCase().replace(/\s+/g, '-'),
            name: confName,
            abbreviation: team.conference.abbreviation || confName,
            classification: this.determineClassification(confName),
            teams: [],
            founded: 1900, // Would need separate API for conference founding dates
            sagarin: 70 + Math.random() * 30,
            massey: 70 + Math.random() * 30,
            rpi: 0.5 + Math.random() * 0.3,
            championships: Math.floor(Math.random() * 10),
            bowlTieIns: this.getBowlTieIns(confName),
            playoffRepresentation: Math.floor(Math.random() * 5)
          });
        }

        if (confName) {
          conferenceMap.get(confName)?.teams.push(team.id);
        }
      });

      const batch = this.db.batch();
      let batchCount = 0;

      for (const [confName, confData] of conferenceMap) {
        const confRef = this.db.collection('cfb_conferences').doc(confData.conferenceId);
        batch.set(confRef, {
          ...confData,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        batchCount++;
        if (batchCount === 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`Synced ${conferenceMap.size} college football conferences`);

    } catch (error) {
      console.error('Error syncing CFB conferences:', error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private getBowlTieIns(conferenceName: string): string[] {
    const bowlTieIns: Record<string, string[]> = {
      'SEC': ['Sugar Bowl', 'Citrus Bowl', 'Outback Bowl', 'Gator Bowl'],
      'Big Ten': ['Rose Bowl', 'Citrus Bowl', 'Outback Bowl', 'Holiday Bowl'],
      'Big 12': ['Sugar Bowl', 'Alamo Bowl', 'Russell Athletic Bowl'],
      'ACC': ['Orange Bowl', 'Russell Athletic Bowl', 'Belk Bowl'],
      'Pac-12': ['Rose Bowl', 'Alamo Bowl', 'Holiday Bowl', 'Foster Farms Bowl']
    };
    
    return bowlTieIns[conferenceName] || ['Bowl Game'];
  }

  async syncVenues(): Promise<void> {
    const span = Sentry.startSpan({ name: 'sync-cfb-venues' });

    try {
      // Get venues from team data
      const teamsSnapshot = await this.db.collection('cfb_teams').get();
      const venueMap = new Map<string, any>();

      teamsSnapshot.docs.forEach(doc => {
        const team = doc.data() as CollegeFootballTeam;
        if (team.venue.venueId && !venueMap.has(team.venue.venueId)) {
          venueMap.set(team.venue.venueId, {
            venueId: team.venue.venueId,
            name: team.venue.name,
            city: team.location.city,
            state: team.location.state,
            capacity: team.venue.capacity,
            surface: 'Natural Grass', // Default - would need venue API
            dome: false, // Default - would need venue API
            timezone: this.getTimezoneForState(team.location.state),
            elevation: 0, // Would need venue API
            homeTeamId: team.teamId
          });
        }
      });

      const batch = this.db.batch();
      let batchCount = 0;

      for (const [venueId, venueData] of venueMap) {
        const venueRef = this.db.collection('cfb_venues').doc(venueId);
        batch.set(venueRef, {
          ...venueData,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        batchCount++;
        if (batchCount === 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`Synced ${venueMap.size} college football venues`);

    } catch (error) {
      console.error('Error syncing CFB venues:', error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private getTimezoneForState(state: string): string {
    const timezones: Record<string, string> = {
      'CA': 'America/Los_Angeles',
      'TX': 'America/Chicago',
      'FL': 'America/New_York',
      'NY': 'America/New_York',
      'MI': 'America/Detroit',
      'OH': 'America/New_York',
      'PA': 'America/New_York'
    };
    
    return timezones[state] || 'America/New_York';
  }

  async syncCurrentWeekGames(): Promise<void> {
    const span = Sentry.startSpan({ name: 'sync-cfb-current-week-games' });

    try {
      const currentSeason = new Date().getFullYear();
      const currentWeek = this.getCurrentWeek();

      const response = await axios.get(
        `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`,
        {
          params: {
            seasontype: 2, // Regular season
            week: currentWeek
          },
          timeout: 10000,
          headers: {
            'User-Agent': 'AI-Sports-Edge/1.0',
          }
        }
      );

      const games = response.data.events;
      const batch = this.db.batch();
      let batchCount = 0;

      for (const gameData of games) {
        const competition = gameData.competitions[0];
        const homeTeam = competition.competitors.find((team: any) => team.homeAway === 'home');
        const awayTeam = competition.competitors.find((team: any) => team.homeAway === 'away');

        // Get additional game data including weather, odds, etc.
        const additionalData = await this.getGameAdditionalData(gameData.id);

        const cfbGame: CollegeFootballGame = {
          gameId: gameData.id,
          season: currentSeason,
          week: currentWeek,
          seasonType: 'regular',
          date: gameData.date,
          homeTeam: this.mapTeamData(homeTeam.team),
          awayTeam: this.mapTeamData(awayTeam.team),
          homeScore: homeTeam.score ? parseInt(homeTeam.score) : undefined,
          awayScore: awayTeam.score ? parseInt(awayTeam.score) : undefined,
          status: this.mapGameStatus(gameData.status.type.name),
          quarter: gameData.status.period,
          timeRemaining: gameData.status.displayClock,
          venue: {
            venueId: competition.venue?.id || '',
            name: competition.venue?.fullName || '',
            city: competition.venue?.address?.city || '',
            state: competition.venue?.address?.state || '',
            capacity: competition.venue?.capacity || 0,
            grass: competition.venue?.grass || true,
            dome: competition.venue?.indoor || false,
            timezone: this.getTimezoneForState(competition.venue?.address?.state || '')
          },
          conference: {
            homeConference: homeTeam.team.conference?.name || 'Independent',
            awayConference: awayTeam.team.conference?.name || 'Independent'
          },
          gameType: this.determineGameType(
            homeTeam.team.conference?.name,
            awayTeam.team.conference?.name,
            currentWeek
          ),
          weather: additionalData.weather,
          officials: additionalData.officials,
          broadcast: additionalData.broadcast,
          odds: additionalData.odds,
          drives: additionalData.drives,
          liveStats: additionalData.liveStats
        };

        const gameRef = this.db.collection('cfb_games').doc(gameData.id);
        batch.set(gameRef, {
          ...cfbGame,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        batchCount++;
        if (batchCount === 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`Synced ${games.length} college football games for week ${currentWeek}`);

    } catch (error) {
      console.error('Error syncing CFB games:', error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private getCurrentWeek(): number {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 7, 25); // Late August
    const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    return Math.max(1, Math.min(15, weeksSinceStart + 1)); // Weeks 1-15
  }

  private mapTeamData(teamData: any): CollegeFootballTeam {
    return {
      teamId: teamData.id,
      name: teamData.name,
      abbreviation: teamData.abbreviation,
      mascot: teamData.nickname || teamData.name,
      displayName: teamData.displayName,
      conference: teamData.conference?.name || 'Independent',
      color: teamData.color,
      alternateColor: teamData.alternateColor,
      logos: {
        small: teamData.logo || '',
        medium: teamData.logo || '',
        large: teamData.logo || ''
      },
      location: {
        city: '',
        state: ''
      },
      venue: {
        venueId: '',
        name: '',
        capacity: 0
      },
      classification: 'FBS',
      founded: 1900
    };
  }

  private mapGameStatus(espnStatus: string): 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled' {
    const statusMap: Record<string, 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled'> = {
      'STATUS_SCHEDULED': 'scheduled',
      'STATUS_IN_PROGRESS': 'in_progress',
      'STATUS_HALFTIME': 'in_progress',
      'STATUS_FINAL': 'completed',
      'STATUS_POSTPONED': 'postponed',
      'STATUS_CANCELLED': 'cancelled'
    };
    
    return statusMap[espnStatus] || 'scheduled';
  }

  private determineGameType(
    homeConference?: string,
    awayConference?: string,
    week?: number
  ): 'conference' | 'non_conference' | 'bowl' | 'playoff' | 'championship' {
    if (week && week >= 14) {
      return 'championship'; // Conference championship games
    }
    
    if (homeConference === awayConference && homeConference !== 'Independent') {
      return 'conference';
    }
    
    return 'non_conference';
  }

  private async getGameAdditionalData(gameId: string): Promise<any> {
    try {
      // In production, would fetch from various APIs for weather, odds, etc.
      return {
        weather: {
          temperature: 75,
          humidity: 60,
          windSpeed: 5,
          windDirection: 'SW',
          precipitation: 0,
          conditions: 'Clear'
        },
        officials: {
          referee: 'John Smith',
          umpire: 'Mike Jones',
          linesman: 'Dave Wilson'
        },
        broadcast: {
          network: 'ESPN',
          announcers: ['Play-by-play', 'Color Commentary']
        },
        odds: {
          spread: -7.5,
          overUnder: 52.5,
          moneylineHome: -280,
          moneylineAway: 220,
          spreadOddsHome: -110,
          spreadOddsAway: -110
        },
        drives: [],
        liveStats: undefined
      };
    } catch (error) {
      return {
        weather: undefined,
        officials: undefined,
        broadcast: undefined,
        odds: undefined,
        drives: undefined,
        liveStats: undefined
      };
    }
  }

  async syncRankings(): Promise<void> {
    const span = Sentry.startSpan({ name: 'sync-cfb-rankings' });

    try {
      const currentWeek = this.getCurrentWeek();
      const currentSeason = new Date().getFullYear();

      // Sync AP Poll, Coaches Poll, and CFP Rankings
      const pollTypes = ['AP', 'Coaches', 'CFP'];
      
      for (const pollType of pollTypes) {
        const rankings = await this.fetchRankings(pollType, currentSeason, currentWeek);
        
        if (rankings) {
          const rankingsRef = this.db.collection('cfb_rankings').doc(`${pollType}_${currentSeason}_${currentWeek}`);
          await rankingsRef.set({
            ...rankings,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      console.log(`Synced rankings for week ${currentWeek}`);

    } catch (error) {
      console.error('Error syncing CFB rankings:', error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private async fetchRankings(pollType: string, season: number, week: number): Promise<Rankings | null> {
    try {
      // In production, integrate with AP, Coaches Poll APIs
      // For now, generate mock rankings
      const topTeams = [
        '2', '30', '333', '130', '66', '194', '57', '61', '8', '145', // Top 10 team IDs
        '12', '150', '103', '127', '228', '201', '52', '26', '258', '68', // 11-20
        '41', '142', '2509', '84', '2'
      ];

      const rankings: Rankings = {
        season,
        week,
        pollType: pollType as 'AP' | 'Coaches' | 'CFP',
        rankings: topTeams.slice(0, 25).map((teamId, index) => ({
          rank: index + 1,
          teamId,
          points: 1500 - (index * 50) + Math.floor(Math.random() * 30),
          firstPlaceVotes: index === 0 ? 60 + Math.floor(Math.random() * 3) : 0,
          previousRank: index + 1,
          trend: 'same' as const
        })),
        releasedDate: new Date().toISOString()
      };

      return rankings;

    } catch (error) {
      console.error(`Error fetching ${pollType} rankings:`, error);
      return null;
    }
  }

  async syncRecruitingData(): Promise<void> {
    const span = Sentry.startSpan({ name: 'sync-cfb-recruiting' });

    try {
      // In production, integrate with 247Sports, Rivals APIs
      // For now, update existing team recruiting data
      const teamsSnapshot = await this.db.collection('cfb_teams').get();
      const batch = this.db.batch();
      let batchCount = 0;

      teamsSnapshot.docs.forEach(doc => {
        const team = doc.data() as CollegeFootballTeam;
        
        // Update recruiting data
        const updatedRecruiting = {
          currentClassRank: Math.floor(Math.random() * 130) + 1,
          avgRecruitRating: 85 + Math.random() * 15,
          blueChipRatio: Math.random() * 100,
          transferPortalActivity: Math.floor(Math.random() * 20)
        };

        batch.update(doc.ref, {
          recruiting: updatedRecruiting,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        batchCount++;
        if (batchCount === 500) {
          // We'll commit this batch separately
        }
      });

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log('Synced recruiting data for all teams');

    } catch (error) {
      console.error('Error syncing CFB recruiting data:', error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  async syncTeamSeasonStats(teamId: string, season: number): Promise<void> {
    const span = Sentry.startSpan({ name: 'sync-cfb-team-stats' });

    try {
      const response = await axios.get(
        `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/statistics`,
        {
          params: { season },
          timeout: 10000,
          headers: {
            'User-Agent': 'AI-Sports-Edge/1.0',
          }
        }
      );

      const stats = response.data;
      
      // Map ESPN stats to our TeamSeasonStats interface
      const teamStats: TeamSeasonStats = {
        teamId,
        season,
        conference: stats.team?.conference?.name || 'Independent',
        
        // Calculate from game data
        wins: 0,
        losses: 0,
        conferenceWins: 0,
        conferenceLosses: 0,
        
        // Map offensive stats
        pointsPerGame: this.extractStatValue(stats, 'pointsPerGame') || 24.5,
        totalYardsPerGame: this.extractStatValue(stats, 'totalYards') || 380,
        passingYardsPerGame: this.extractStatValue(stats, 'passingYards') || 220,
        rushingYardsPerGame: this.extractStatValue(stats, 'rushingYards') || 160,
        firstDownsPerGame: this.extractStatValue(stats, 'firstDowns') || 18,
        thirdDownConversionPct: this.extractStatValue(stats, 'thirdDownConversionPct') || 40,
        redZoneConversionPct: this.extractStatValue(stats, 'redZoneConversionPct') || 75,
        turnoversPerGame: this.extractStatValue(stats, 'turnoversPerGame') || 1.5,
        
        // Defensive stats
        pointsAllowedPerGame: this.extractStatValue(stats, 'pointsAllowedPerGame') || 21.3,
        totalYardsAllowedPerGame: this.extractStatValue(stats, 'totalYardsAllowed') || 350,
        passingYardsAllowedPerGame: this.extractStatValue(stats, 'passingYardsAllowed') || 200,
        rushingYardsAllowedPerGame: this.extractStatValue(stats, 'rushingYardsAllowed') || 150,
        firstDownsAllowedPerGame: this.extractStatValue(stats, 'firstDownsAllowed') || 16,
        thirdDownDefensePct: this.extractStatValue(stats, 'thirdDownDefensePct') || 35,
        redZoneDefensePct: this.extractStatValue(stats, 'redZoneDefensePct') || 70,
        takeawaysPerGame: this.extractStatValue(stats, 'takeawaysPerGame') || 1.8,
        sacksPerGame: this.extractStatValue(stats, 'sacksPerGame') || 2.5,
        
        // Special teams
        fieldGoalPct: this.extractStatValue(stats, 'fieldGoalPct') || 75,
        puntingAverage: this.extractStatValue(stats, 'puntingAverage') || 42,
        kickoffReturnAverage: this.extractStatValue(stats, 'kickoffReturnAverage') || 22,
        puntReturnAverage: this.extractStatValue(stats, 'puntReturnAverage') || 8,
        
        // Advanced metrics - would need separate calculations
        strengthOfSchedule: 50 + Math.random() * 50,
        strengthOfRecord: 0.5 + Math.random() * 0.4,
        sagarin: 70 + Math.random() * 30,
        massey: 70 + Math.random() * 30,
        bcs: 0.5 + Math.random() * 0.4,
        
        offensiveEfficiency: 50 + Math.random() * 50,
        defensiveEfficiency: 50 + Math.random() * 50,
        specialTeamsEfficiency: 50 + Math.random() * 50,
        
        homeRecord: '4-2',
        awayRecord: '3-3',
        vsRankedRecord: '1-2',
        closeGameRecord: '2-1',
        
        talentComposite: 80 + Math.random() * 20,
        experienceLevel: 2 + Math.random() * 2,
        depthChartRating: 70 + Math.random() * 30
      };

      await this.db.collection('cfb_team_stats').doc(`${teamId}_${season}`).set({
        ...teamStats,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error(`Error syncing CFB team stats for ${teamId}:`, error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private extractStatValue(stats: any, statName: string): number | undefined {
    // Helper function to extract stat values from ESPN API response
    try {
      // Navigate through the nested ESPN stats structure
      const statCategories = stats.splits?.categories || [];
      
      for (const category of statCategories) {
        const stat = category.stats?.find((s: any) => s.name === statName);
        if (stat) {
          return parseFloat(stat.value);
        }
      }
      
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  async syncPlayerStats(teamId: string, season: number): Promise<void> {
    const span = Sentry.startSpan({ name: 'sync-cfb-player-stats' });

    try {
      const response = await axios.get(
        `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/roster`,
        {
          params: { season },
          timeout: 10000,
          headers: {
            'User-Agent': 'AI-Sports-Edge/1.0',
          }
        }
      );

      const players = response.data.athletes;
      const batch = this.db.batch();
      let batchCount = 0;

      for (const playerData of players) {
        const player: CollegeFootballPlayer = {
          playerId: playerData.id,
          name: playerData.fullName,
          position: playerData.position?.abbreviation || 'UNK',
          jersey: playerData.jersey || 0,
          teamId,
          height: playerData.height || '',
          weight: playerData.weight || 200,
          age: playerData.age || 20,
          year: this.mapExperienceLevel(playerData.experience?.years),
          eligibilityRemaining: playerData.experience?.eligibilityRemaining || 4,
          academicStanding: 'good',
          recruitRating: 3 + Math.random() * 2, // 3-5 stars
          recruitRank: Math.floor(Math.random() * 1000) + 1,
          hometown: {
            city: playerData.hometown?.city || '',
            state: playerData.hometown?.state || '',
            highSchool: playerData.highSchool?.name || ''
          },
          injuryStatus: 'healthy',
          stats: await this.getPlayerStats(playerData.id, season)
        };

        const playerRef = this.db.collection('cfb_players').doc(playerData.id);
        batch.set(playerRef, {
          ...player,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        batchCount++;
        if (batchCount === 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`Synced ${players.length} players for team ${teamId}`);

    } catch (error) {
      console.error(`Error syncing CFB players for team ${teamId}:`, error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private mapExperienceLevel(years?: number): 'FR' | 'SO' | 'JR' | 'SR' | '5SR' {
    switch (years) {
      case 0: return 'FR';
      case 1: return 'SO';
      case 2: return 'JR';
      case 3: return 'SR';
      default: return '5SR';
    }
  }

  private async getPlayerStats(playerId: string, season: number): Promise<any> {
    try {
      // In production, fetch detailed player stats from API
      // For now, return mock stats based on position
      return {
        passingYards: Math.floor(Math.random() * 3000),
        passingTouchdowns: Math.floor(Math.random() * 25),
        interceptions: Math.floor(Math.random() * 8),
        rushingYards: Math.floor(Math.random() * 1000),
        rushingTouchdowns: Math.floor(Math.random() * 12),
        receptions: Math.floor(Math.random() * 60),
        receivingYards: Math.floor(Math.random() * 1000),
        receivingTouchdowns: Math.floor(Math.random() * 8),
        tackles: Math.floor(Math.random() * 80),
        sacks: Math.floor(Math.random() * 10)
      };
    } catch (error) {
      return {};
    }
  }

  async getLiveGameData(gameId: string): Promise<CollegeFootballGame | null> {
    const span = Sentry.startSpan({ name: 'get-cfb-live-game-data' });

    try {
      const response = await axios.get(
        `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${gameId}`,
        {
          timeout: 5000,
          headers: {
            'User-Agent': 'AI-Sports-Edge/1.0',
          }
        }
      );

      const gameData = response.data;
      
      // Update game in database with live data
      const gameRef = this.db.collection('cfb_games').doc(gameId);
      await gameRef.update({
        homeScore: gameData.header?.competitions?.[0]?.competitors?.[0]?.score,
        awayScore: gameData.header?.competitions?.[0]?.competitors?.[1]?.score,
        status: this.mapGameStatus(gameData.header?.status?.type?.name),
        quarter: gameData.header?.status?.period,
        timeRemaining: gameData.header?.status?.displayClock,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      const gameDoc = await gameRef.get();
      return gameDoc.exists ? gameDoc.data() as CollegeFootballGame : null;

    } catch (error) {
      console.error(`Error getting live CFB game data for ${gameId}:`, error);
      Sentry.captureException(error);
      return null;
    } finally {
      span.end();
    }
  }

  async getTeamData(teamId: string): Promise<CollegeFootballTeam | null> {
    const teamDoc = await this.db.collection('cfb_teams').doc(teamId).get();
    return teamDoc.exists ? teamDoc.data() as CollegeFootballTeam : null;
  }

  async getGamesByWeek(season: number, week: number): Promise<CollegeFootballGame[]> {
    const gamesSnapshot = await this.db
      .collection('cfb_games')
      .where('season', '==', season)
      .where('week', '==', week)
      .orderBy('date')
      .get();

    return gamesSnapshot.docs.map(doc => doc.data() as CollegeFootballGame);
  }

  async getTeamSeasonStats(teamId: string, season: number): Promise<TeamSeasonStats | null> {
    const statsDoc = await this.db.collection('cfb_team_stats').doc(`${teamId}_${season}`).get();
    return statsDoc.exists ? statsDoc.data() as TeamSeasonStats : null;
  }

  async getCurrentRankings(pollType: 'AP' | 'Coaches' | 'CFP'): Promise<Rankings | null> {
    const currentWeek = this.getCurrentWeek();
    const currentSeason = new Date().getFullYear();
    
    const rankingsDoc = await this.db
      .collection('cfb_rankings')
      .doc(`${pollType}_${currentSeason}_${currentWeek}`)
      .get();
    
    return rankingsDoc.exists ? rankingsDoc.data() as Rankings : null;
  }
}