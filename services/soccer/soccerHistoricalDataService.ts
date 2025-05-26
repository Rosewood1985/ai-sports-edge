import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';
import axios from 'axios';
import { SoccerMatch, SoccerTeam, SoccerPlayer } from './soccerInterfaces';

interface HistoricalMatch {
  matchId: string;
  season: string;
  competition: string;
  date: string;
  homeTeam: SoccerTeam;
  awayTeam: SoccerTeam;
  homeScore: number;
  awayScore: number;
  homeXG?: number;
  awayXG?: number;
  attendance?: number;
  referee?: string;
  venue: {
    venueId: string;
    name: string;
    city: string;
  };
  events: MatchEvent[];
  lineups: {
    home: PlayerLineup[];
    away: PlayerLineup[];
  };
  stats: MatchStats;
  dataQuality: {
    source: 'football-data.org' | 'espn' | 'manual';
    completeness: number; // 0-100%
    lastVerified: string;
    missingFields: string[];
  };
}

interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty' | 'own_goal';
  playerId: string;
  playerName: string;
  team: 'home' | 'away';
  assistPlayerId?: string;
  details?: string;
}

interface PlayerLineup {
  playerId: string;
  playerName: string;
  position: string;
  shirtNumber: number;
  starter: boolean;
  minutesPlayed?: number;
  rating?: number;
}

interface MatchStats {
  possession: {
    home: number;
    away: number;
  };
  shots: {
    home: number;
    away: number;
  };
  shotsOnTarget: {
    home: number;
    away: number;
  };
  corners: {
    home: number;
    away: number;
  };
  fouls: {
    home: number;
    away: number;
  };
  yellowCards: {
    home: number;
    away: number;
  };
  redCards: {
    home: number;
    away: number;
  };
  passes?: {
    home: number;
    away: number;
  };
  passAccuracy?: {
    home: number;
    away: number;
  };
}

interface PlayerTransfer {
  transferId: string;
  playerId: string;
  playerName: string;
  fromTeamId: string;
  fromTeamName: string;
  toTeamId: string;
  toTeamName: string;
  transferDate: string;
  transferType: 'permanent' | 'loan' | 'free_transfer' | 'contract_expiry';
  fee?: number;
  currency?: string;
  season: string;
  loanDuration?: number;
  dataSource: string;
  verified: boolean;
}

interface SeasonStandings {
  season: string;
  competition: string;
  standings: Array<{
    position: number;
    teamId: string;
    teamName: string;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    form?: string;
    homeRecord?: {
      wins: number;
      draws: number;
      losses: number;
    };
    awayRecord?: {
      wins: number;
      draws: number;
      losses: number;
    };
  }>;
  lastUpdated: string;
  dataSource: 'football-data.org' | 'espn' | 'manual';
}

interface PlayerCareerStats {
  playerId: string;
  playerName: string;
  seasonStats: Array<{
    season: string;
    teamId: string;
    teamName: string;
    competition: string;
    appearances: number;
    starts: number;
    minutesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    averageRating?: number;
    position: string;
    dataSource: string;
    lastUpdated: string;
  }>;
  careerTotals: {
    totalAppearances: number;
    totalGoals: number;
    totalAssists: number;
    totalMinutes: number;
    clubsPlayed: number;
    seasonsActive: number;
  };
  transferHistory: PlayerTransfer[];
  dataQuality: {
    completeness: number;
    lastVerified: string;
    sources: string[];
  };
}

interface CompetitionHistory {
  competitionId: string;
  competitionName: string;
  seasons: Array<{
    season: string;
    winner: string;
    runnerUp: string;
    topScorer?: {
      playerId: string;
      playerName: string;
      goals: number;
    };
    finalTable?: SeasonStandings;
    dataSource: string;
    verified: boolean;
  }>;
}

interface DataSourceConfiguration {
  footballDataOrg: {
    apiKey: string;
    baseUrl: 'https://api.football-data.org/v4';
    rateLimit: number; // requests per minute
    competitions: string[]; // supported competition codes
  };
  espn: {
    baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer';
    rateLimit: number;
    leagues: string[];
  };
}

export class SoccerHistoricalDataService {
  private db: admin.firestore.Firestore;
  private dataSourceConfig: DataSourceConfiguration;

  constructor() {
    this.db = admin.firestore();
    this.dataSourceConfig = {
      footballDataOrg: {
        apiKey: process.env.FOOTBALL_DATA_API_KEY || '',
        baseUrl: 'https://api.football-data.org/v4',
        rateLimit: 10, // free tier: 10 requests per minute
        competitions: ['PL', 'BL1', 'SA', 'PD', 'FL1', 'CL', 'EC'], // Premier League, Bundesliga, Serie A, La Liga, Ligue 1, Champions League, Europa Conference League
      },
      espn: {
        baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer',
        rateLimit: 100, // estimated
        leagues: ['eng.1', 'ger.1', 'ita.1', 'esp.1', 'fra.1'], // ESPN league codes
      },
    };

    if (!this.dataSourceConfig.footballDataOrg.apiKey) {
      console.error(
        '❌ CRITICAL: FOOTBALL_DATA_API_KEY not configured. Historical data collection will fail.'
      );
      Sentry.captureMessage('Football-Data.org API key not configured', 'error');
    }
  }

  async collectHistoricalData(startSeason: string, endSeason: string): Promise<void> {
    const transaction = Sentry.startTransaction({
      name: 'soccer-historical-data-collection',
      op: 'data-collection',
    });

    try {
      if (!this.dataSourceConfig.footballDataOrg.apiKey) {
        throw new Error(
          '❌ BLOCKED: Football-Data.org API key not available. Cannot collect historical data.'
        );
      }

      console.log(`🔄 Starting historical data collection from ${startSeason} to ${endSeason}`);
      console.log(`📊 Data sources: Football-Data.org (primary), ESPN Soccer (secondary)`);

      // Collect data sequentially to respect rate limits
      await this.collectHistoricalMatches(startSeason, endSeason);
      await this.collectSeasonStandings(startSeason, endSeason);

      // These require additional data sources that may not be available
      try {
        await this.collectTransferHistory(startSeason, endSeason);
      } catch (error) {
        console.warn(
          '⚠️ Transfer history collection failed - data source may be unavailable:',
          error
        );
        Sentry.captureMessage('Transfer history collection failed', 'warning');
      }

      try {
        await this.collectPlayerCareerStats(startSeason, endSeason);
      } catch (error) {
        console.warn(
          '⚠️ Player career stats collection failed - detailed player APIs may not be available:',
          error
        );
        Sentry.captureMessage('Player career stats collection failed', 'warning');
      }

      await this.collectCompetitionHistory(startSeason, endSeason);

      console.log('✅ Historical data collection completed successfully');
      transaction.setStatus('ok');
    } catch (error) {
      console.error('❌ Historical data collection failed:', error);
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async collectHistoricalMatches(startSeason: string, endSeason: string): Promise<void> {
    const span = Sentry.startSpan({ name: 'collect-historical-matches' });

    try {
      if (!this.dataSourceConfig.footballDataOrg.apiKey) {
        throw new Error('❌ BLOCKED: Football-Data.org API key required for historical matches');
      }

      const competitions = this.dataSourceConfig.footballDataOrg.competitions;
      console.log(`📋 Collecting historical matches for competitions: ${competitions.join(', ')}`);

      for (const competition of competitions) {
        console.log(`🔄 Processing competition: ${competition}`);

        const seasons = this.generateSeasonRange(startSeason, endSeason);

        for (const season of seasons) {
          try {
            await this.collectSeasonMatches(competition, season);

            // Respect API rate limits (10 requests per minute for free tier)
            await this.delay(6000); // 6 seconds between requests
          } catch (error) {
            console.error(`❌ Failed to collect matches for ${competition} ${season}:`, error);
            // Continue with other seasons/competitions
          }
        }
      }

      console.log('✅ Historical matches collection completed');
    } catch (error) {
      console.error('❌ Error collecting historical matches:', error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private async collectSeasonMatches(competition: string, season: string): Promise<void> {
    try {
      const response = await axios.get(
        `${this.dataSourceConfig.footballDataOrg.baseUrl}/competitions/${competition}/matches`,
        {
          headers: {
            'X-Auth-Token': this.dataSourceConfig.footballDataOrg.apiKey,
          },
          params: {
            season: season,
            status: 'FINISHED',
          },
          timeout: 15000,
        }
      );

      if (!response.data || !response.data.matches) {
        console.warn(`⚠️ No match data returned for ${competition} ${season}`);
        return;
      }

      const matches = response.data.matches;
      console.log(`📊 Found ${matches.length} matches for ${competition} ${season}`);

      const batch = this.db.batch();
      let batchCount = 0;
      let successCount = 0;

      for (const matchData of matches) {
        try {
          const historicalMatch = await this.mapHistoricalMatchFromFootballData(
            matchData,
            competition
          );

          if (historicalMatch) {
            const matchRef = this.db
              .collection('soccer_historical_matches')
              .doc(historicalMatch.matchId);
            batch.set(matchRef, {
              ...historicalMatch,
              collectedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            successCount++;
            batchCount++;

            if (batchCount === 500) {
              await batch.commit();
              console.log(`💾 Committed batch of ${batchCount} matches`);
              batchCount = 0;
            }
          }
        } catch (error) {
          console.error(`❌ Failed to process match ${matchData.id}:`, error);
          // Continue with other matches
        }
      }

      if (batchCount > 0) {
        await batch.commit();
        console.log(`💾 Final commit: ${batchCount} matches`);
      }

      console.log(
        `✅ Successfully processed ${successCount}/${matches.length} matches for ${competition} ${season}`
      );
    } catch (error) {
      if (error.response?.status === 429) {
        console.error(
          `❌ Rate limit exceeded for ${competition} ${season}. Implement exponential backoff.`
        );
        // In production, implement exponential backoff retry logic
        await this.delay(60000); // Wait 1 minute
        throw new Error('Rate limit exceeded - retry needed');
      } else if (error.response?.status === 403) {
        console.error(
          `❌ API access forbidden for ${competition} ${season}. Check API key permissions.`
        );
        throw new Error('API access forbidden - check credentials');
      } else {
        console.error(`❌ API error for ${competition} ${season}:`, error.message);
        throw error;
      }
    }
  }

  private async mapHistoricalMatchFromFootballData(
    matchData: any,
    competition: string
  ): Promise<HistoricalMatch | null> {
    try {
      if (!matchData.homeTeam || !matchData.awayTeam || !matchData.score?.fullTime) {
        console.warn(`⚠️ Incomplete match data for match ${matchData.id}`);
        return null;
      }

      const missingFields: string[] = [];
      if (!matchData.attendance) missingFields.push('attendance');
      if (!matchData.venue) missingFields.push('venue');
      if (!matchData.referees || matchData.referees.length === 0) missingFields.push('referee');

      // Get additional match details if available from ESPN
      let detailedStats = null;
      try {
        detailedStats = await this.getESPNMatchDetails(
          matchData.homeTeam.name,
          matchData.awayTeam.name,
          matchData.utcDate
        );
      } catch (error) {
        console.warn(`⚠️ Could not fetch ESPN details for match ${matchData.id}`);
      }

      const historicalMatch: HistoricalMatch = {
        matchId: matchData.id.toString(),
        season: matchData.season.startDate.substring(0, 4),
        competition: competition,
        date: matchData.utcDate,
        homeTeam: {
          teamId: matchData.homeTeam.id.toString(),
          name: matchData.homeTeam.name,
          abbreviation:
            matchData.homeTeam.tla || this.generateAbbreviation(matchData.homeTeam.name),
          crestUrl: matchData.homeTeam.crest || '',
          country: 'Unknown', // Football-Data doesn't provide this directly
          founded: 1900, // Default value
          venue: 'Unknown', // Default value
        },
        awayTeam: {
          teamId: matchData.awayTeam.id.toString(),
          name: matchData.awayTeam.name,
          abbreviation:
            matchData.awayTeam.tla || this.generateAbbreviation(matchData.awayTeam.name),
          crestUrl: matchData.awayTeam.crest || '',
          country: 'Unknown',
          founded: 1900,
          venue: 'Unknown',
        },
        homeScore: matchData.score.fullTime.home || 0,
        awayScore: matchData.score.fullTime.away || 0,
        attendance: matchData.attendance || undefined,
        referee: matchData.referees?.[0]?.name || undefined,
        venue: {
          venueId: matchData.venue?.id?.toString() || 'unknown',
          name: matchData.venue?.name || 'Unknown Stadium',
          city: matchData.venue?.city || 'Unknown',
        },
        events: [], // Football-Data.org free tier doesn't include detailed events
        lineups: { home: [], away: [] }, // Not available in free tier
        stats: detailedStats || this.createEmptyMatchStats(),
        dataQuality: {
          source: 'football-data.org',
          completeness: this.calculateDataCompleteness(matchData, missingFields),
          lastVerified: new Date().toISOString(),
          missingFields,
        },
      };

      return historicalMatch;
    } catch (error) {
      console.error('❌ Error mapping historical match:', error);
      return null;
    }
  }

  private generateAbbreviation(teamName: string): string {
    // Generate 3-letter abbreviation from team name
    const words = teamName.split(' ');
    if (words.length >= 2) {
      return (
        words
          .slice(0, 2)
          .map(word => word.charAt(0))
          .join('') + words[0].charAt(1)
      );
    }
    return teamName.substring(0, 3).toUpperCase();
  }

  private calculateDataCompleteness(matchData: any, missingFields: string[]): number {
    const totalFields = 10; // Based on expected match data fields
    const presentFields = totalFields - missingFields.length;
    return Math.round((presentFields / totalFields) * 100);
  }

  private createEmptyMatchStats(): MatchStats {
    return {
      possession: { home: 0, away: 0 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
    };
  }

  private async getESPNMatchDetails(
    homeTeam: string,
    awayTeam: string,
    matchDate: string
  ): Promise<MatchStats | null> {
    try {
      // ⚠️ ESPN Soccer API endpoints for detailed match stats are not publicly documented
      // This would require investigation of available endpoints
      console.warn('⚠️ ESPN Soccer detailed match stats not implemented - API endpoints unclear');
      return null;
    } catch (error) {
      return null;
    }
  }

  async collectTransferHistory(startSeason: string, endSeason: string): Promise<void> {
    const span = Sentry.startSpan({ name: 'collect-transfer-history' });

    try {
      console.log('⚠️ WARNING: No verified public API for soccer transfer history');
      console.log(
        '❌ BLOCKED: Transfer history collection requires premium data source or manual data entry'
      );

      // Flag this as a data source limitation
      await this.db
        .collection('soccer_data_source_status')
        .doc('transfer_history')
        .set({
          status: 'unavailable',
          reason: 'No verified public API for comprehensive transfer data',
          lastChecked: admin.firestore.FieldValue.serverTimestamp(),
          alternatives: [
            'Transfermarkt (requires scraping)',
            'Premium sports data providers',
            'Manual data entry',
          ],
        });

      throw new Error('❌ Transfer history data source not available');
    } catch (error) {
      console.error('❌ Transfer history collection blocked:', error.message);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  async collectSeasonStandings(startSeason: string, endSeason: string): Promise<void> {
    const span = Sentry.startSpan({ name: 'collect-season-standings' });

    try {
      if (!this.dataSourceConfig.footballDataOrg.apiKey) {
        throw new Error('❌ BLOCKED: Football-Data.org API key required for season standings');
      }

      console.log('📊 Collecting season standings...');

      const competitions = this.dataSourceConfig.footballDataOrg.competitions.filter(
        comp => !['CL', 'EC'].includes(comp) // Exclude tournaments, focus on leagues
      );
      const seasons = this.generateSeasonRange(startSeason, endSeason);

      for (const competition of competitions) {
        for (const season of seasons) {
          try {
            await this.collectCompetitionStandings(competition, season);
            await this.delay(6000); // Respect rate limits
          } catch (error) {
            console.error(`❌ Failed to collect standings for ${competition} ${season}:`, error);
            // Continue with other competitions/seasons
          }
        }
      }

      console.log('✅ Season standings collection completed');
    } catch (error) {
      console.error('❌ Error collecting season standings:', error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private async collectCompetitionStandings(competition: string, season: string): Promise<void> {
    try {
      const response = await axios.get(
        `${this.dataSourceConfig.footballDataOrg.baseUrl}/competitions/${competition}/standings`,
        {
          headers: {
            'X-Auth-Token': this.dataSourceConfig.footballDataOrg.apiKey,
          },
          params: {
            season: season,
          },
          timeout: 15000,
        }
      );

      if (!response.data?.standings?.[0]?.table) {
        console.warn(`⚠️ No standings data for ${competition} ${season}`);
        return;
      }

      const standingsData = response.data.standings[0];

      const standings: SeasonStandings = {
        season: season,
        competition: competition,
        standings: standingsData.table.map((team: any) => ({
          position: team.position,
          teamId: team.team.id.toString(),
          teamName: team.team.name,
          matchesPlayed: team.playedGames,
          wins: team.won,
          draws: team.draw,
          losses: team.lost,
          goalsFor: team.goalsFor,
          goalsAgainst: team.goalsAgainst,
          goalDifference: team.goalDifference,
          points: team.points,
          form: team.form || undefined, // May not be available in all seasons
        })),
        lastUpdated: new Date().toISOString(),
        dataSource: 'football-data.org',
      };

      await this.db
        .collection('soccer_season_standings')
        .doc(`${competition}_${season}`)
        .set({
          ...standings,
          collectedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(
        `✅ Collected standings for ${competition} ${season} (${standings.standings.length} teams)`
      );
    } catch (error) {
      if (error.response?.status === 429) {
        console.error(`❌ Rate limit exceeded for standings ${competition} ${season}`);
        await this.delay(60000);
        throw new Error('Rate limit exceeded - retry needed');
      } else {
        console.error(`❌ Error collecting standings for ${competition} ${season}:`, error.message);
        throw error;
      }
    }
  }

  async collectPlayerCareerStats(startSeason: string, endSeason: string): Promise<void> {
    const span = Sentry.startSpan({ name: 'collect-player-career-stats' });

    try {
      console.log('⚠️ WARNING: Detailed player career statistics require premium APIs');
      console.log(
        '❌ BLOCKED: Football-Data.org free tier does not include detailed player statistics'
      );

      // Flag this as a data source limitation
      await this.db
        .collection('soccer_data_source_status')
        .doc('player_career_stats')
        .set({
          status: 'limited',
          reason: 'Free tier APIs do not include detailed player statistics',
          lastChecked: admin.firestore.FieldValue.serverTimestamp(),
          alternatives: [
            'SportsRadar (premium)',
            'ESPN API (limited availability)',
            'FotMob API (unofficial)',
            'Manual data collection',
          ],
        });

      throw new Error('❌ Player career stats require premium data source');
    } catch (error) {
      console.error('❌ Player career stats collection blocked:', error.message);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  async collectCompetitionHistory(startSeason: string, endSeason: string): Promise<void> {
    const span = Sentry.startSpan({ name: 'collect-competition-history' });

    try {
      console.log('📚 Collecting competition history from available standings data...');

      const competitions = [
        { id: 'PL', name: 'Premier League' },
        { id: 'BL1', name: 'Bundesliga' },
        { id: 'SA', name: 'Serie A' },
        { id: 'PD', name: 'La Liga' },
        { id: 'FL1', name: 'Ligue 1' },
        { id: 'CL', name: 'Champions League' },
      ];

      for (const competition of competitions) {
        try {
          const competitionHistory: CompetitionHistory = {
            competitionId: competition.id,
            competitionName: competition.name,
            seasons: await this.generateCompetitionSeasonsFromStandings(
              competition.id,
              startSeason,
              endSeason
            ),
          };

          if (competitionHistory.seasons.length > 0) {
            await this.db
              .collection('soccer_competition_history')
              .doc(competition.id)
              .set({
                ...competitionHistory,
                collectedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

            console.log(
              `✅ Collected history for ${competition.name} (${competitionHistory.seasons.length} seasons)`
            );
          } else {
            console.warn(`⚠️ No historical data available for ${competition.name}`);
          }
        } catch (error) {
          console.error(`❌ Failed to collect history for ${competition.name}:`, error);
        }
      }

      console.log('✅ Competition history collection completed');
    } catch (error) {
      console.error('❌ Error collecting competition history:', error);
      Sentry.captureException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  private async generateCompetitionSeasonsFromStandings(
    competitionId: string,
    startSeason: string,
    endSeason: string
  ): Promise<any[]> {
    const seasons = this.generateSeasonRange(startSeason, endSeason);
    const competitionSeasons: any[] = [];

    for (const season of seasons) {
      try {
        // Try to get standings data for this season
        const standingsDoc = await this.db
          .collection('soccer_season_standings')
          .doc(`${competitionId}_${season}`)
          .get();

        if (standingsDoc.exists) {
          const standingsData = standingsDoc.data() as SeasonStandings;

          if (standingsData.standings && standingsData.standings.length > 0) {
            const winner = standingsData.standings.find(team => team.position === 1);
            const runnerUp = standingsData.standings.find(team => team.position === 2);

            competitionSeasons.push({
              season: season,
              winner: winner?.teamName || 'Unknown',
              runnerUp: runnerUp?.teamName || 'Unknown',
              dataSource: standingsData.dataSource,
              verified: true,
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ No standings data available for ${competitionId} ${season}`);
      }
    }

    return competitionSeasons;
  }

  private generateSeasonRange(startSeason: string, endSeason: string): string[] {
    const seasons: string[] = [];
    const start = parseInt(startSeason);
    const end = parseInt(endSeason);

    for (let year = start; year <= end; year++) {
      seasons.push(year.toString());
    }

    return seasons;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for accessing historical data
  async getHistoricalMatches(
    competition: string,
    season: string,
    teamId?: string
  ): Promise<HistoricalMatch[]> {
    let query = this.db
      .collection('soccer_historical_matches')
      .where('competition', '==', competition)
      .where('season', '==', season);

    if (teamId) {
      // Create composite query for team matches
      const homeMatches = await this.db
        .collection('soccer_historical_matches')
        .where('competition', '==', competition)
        .where('season', '==', season)
        .where('homeTeam.teamId', '==', teamId)
        .limit(25)
        .get();

      const awayMatches = await this.db
        .collection('soccer_historical_matches')
        .where('competition', '==', competition)
        .where('season', '==', season)
        .where('awayTeam.teamId', '==', teamId)
        .limit(25)
        .get();

      const allMatches = [
        ...homeMatches.docs.map(doc => doc.data() as HistoricalMatch),
        ...awayMatches.docs.map(doc => doc.data() as HistoricalMatch),
      ];

      return allMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    const snapshot = await query.limit(100).get();
    return snapshot.docs.map(doc => doc.data() as HistoricalMatch);
  }

  async getPlayerTransferHistory(playerId: string): Promise<PlayerTransfer[]> {
    // Check if transfer data is available
    const statusDoc = await this.db
      .collection('soccer_data_source_status')
      .doc('transfer_history')
      .get();

    if (!statusDoc.exists || statusDoc.data()?.status === 'unavailable') {
      throw new Error('❌ Transfer history data source not available');
    }

    const snapshot = await this.db
      .collection('soccer_transfers')
      .where('playerId', '==', playerId)
      .orderBy('transferDate', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as PlayerTransfer);
  }

  async getSeasonStandings(competition: string, season: string): Promise<SeasonStandings | null> {
    const doc = await this.db
      .collection('soccer_season_standings')
      .doc(`${competition}_${season}`)
      .get();
    return doc.exists ? (doc.data() as SeasonStandings) : null;
  }

  async getPlayerCareerStats(playerId: string): Promise<PlayerCareerStats | null> {
    // Check if player stats data is available
    const statusDoc = await this.db
      .collection('soccer_data_source_status')
      .doc('player_career_stats')
      .get();

    if (!statusDoc.exists || statusDoc.data()?.status === 'unavailable') {
      throw new Error('❌ Player career stats data source not available');
    }

    const doc = await this.db.collection('soccer_player_career_stats').doc(playerId).get();
    return doc.exists ? (doc.data() as PlayerCareerStats) : null;
  }

  async getCompetitionHistory(competitionId: string): Promise<CompetitionHistory | null> {
    const doc = await this.db.collection('soccer_competition_history').doc(competitionId).get();
    return doc.exists ? (doc.data() as CompetitionHistory) : null;
  }

  async searchHistoricalMatches(criteria: {
    homeTeamId?: string;
    awayTeamId?: string;
    dateFrom?: string;
    dateTo?: string;
    competition?: string;
    season?: string;
  }): Promise<HistoricalMatch[]> {
    let query = this.db.collection('soccer_historical_matches') as any;

    if (criteria.competition) {
      query = query.where('competition', '==', criteria.competition);
    }
    if (criteria.season) {
      query = query.where('season', '==', criteria.season);
    }
    if (criteria.dateFrom) {
      query = query.where('date', '>=', criteria.dateFrom);
    }
    if (criteria.dateTo) {
      query = query.where('date', '<=', criteria.dateTo);
    }

    // Handle team queries separately due to Firestore limitations
    if (criteria.homeTeamId || criteria.awayTeamId) {
      const results: HistoricalMatch[] = [];

      if (criteria.homeTeamId) {
        const homeQuery = query.where('homeTeam.teamId', '==', criteria.homeTeamId);
        const homeSnapshot = await homeQuery.limit(50).get();
        results.push(...homeSnapshot.docs.map((doc: any) => doc.data() as HistoricalMatch));
      }

      if (criteria.awayTeamId) {
        const awayQuery = query.where('awayTeam.teamId', '==', criteria.awayTeamId);
        const awaySnapshot = await awayQuery.limit(50).get();
        results.push(...awaySnapshot.docs.map((doc: any) => doc.data() as HistoricalMatch));
      }

      // Remove duplicates if both home and away team are specified
      const uniqueMatches = results.filter(
        (match, index, self) => index === self.findIndex(m => m.matchId === match.matchId)
      );

      return uniqueMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    query = query.limit(100).orderBy('date', 'desc');
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as HistoricalMatch);
  }

  async getHeadToHeadHistory(
    team1Id: string,
    team2Id: string,
    limit: number = 10
  ): Promise<HistoricalMatch[]> {
    // Get matches where team1 was home and team2 was away
    const homeMatches = await this.db
      .collection('soccer_historical_matches')
      .where('homeTeam.teamId', '==', team1Id)
      .where('awayTeam.teamId', '==', team2Id)
      .orderBy('date', 'desc')
      .limit(Math.ceil(limit / 2))
      .get();

    // Get matches where team2 was home and team1 was away
    const awayMatches = await this.db
      .collection('soccer_historical_matches')
      .where('homeTeam.teamId', '==', team2Id)
      .where('awayTeam.teamId', '==', team1Id)
      .orderBy('date', 'desc')
      .limit(Math.ceil(limit / 2))
      .get();

    const allMatches = [
      ...homeMatches.docs.map(doc => doc.data() as HistoricalMatch),
      ...awayMatches.docs.map(doc => doc.data() as HistoricalMatch),
    ];

    // Sort by date and return most recent matches
    return allMatches
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getDataSourceStatus(): Promise<Record<string, any>> {
    const statusSnapshot = await this.db.collection('soccer_data_source_status').get();
    const status: Record<string, any> = {};

    statusSnapshot.docs.forEach(doc => {
      status[doc.id] = doc.data();
    });

    return status;
  }

  async validateDataSources(): Promise<{
    footballDataOrg: { available: boolean; error?: string };
    espn: { available: boolean; error?: string };
  }> {
    const results = {
      footballDataOrg: { available: false, error: undefined as string | undefined },
      espn: { available: false, error: undefined as string | undefined },
    };

    // Test Football-Data.org API
    try {
      if (!this.dataSourceConfig.footballDataOrg.apiKey) {
        results.footballDataOrg.error = 'API key not configured';
      } else {
        const response = await axios.get(
          `${this.dataSourceConfig.footballDataOrg.baseUrl}/competitions`,
          {
            headers: {
              'X-Auth-Token': this.dataSourceConfig.footballDataOrg.apiKey,
            },
            timeout: 10000,
          }
        );

        if (response.status === 200) {
          results.footballDataOrg.available = true;
        }
      }
    } catch (error: any) {
      results.footballDataOrg.error = error.message;
    }

    // Test ESPN Soccer API
    try {
      const response = await axios.get(`${this.dataSourceConfig.espn.baseUrl}/leagues`, {
        timeout: 10000,
      });

      if (response.status === 200) {
        results.espn.available = true;
      }
    } catch (error: any) {
      results.espn.error = error.message;
    }

    return results;
  }
}
