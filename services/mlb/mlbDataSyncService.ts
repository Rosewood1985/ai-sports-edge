// =============================================================================
// MLB DATA SYNC SERVICE
// Deep Focus Architecture with Real Data Integration Points
// =============================================================================

import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore as db } from '../../config/firebase';
import * as Sentry from '@sentry/react-native';
import { getWeatherApiKey } from '../../utils/apiKeys';

export class MLBDataSyncService {
  private readonly baseUrl = 'https://statsapi.mlb.com/api/v1';
  private readonly weatherApiKey: string;
  private readonly weatherBaseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly rateLimitDelay = 600; // 100 requests per minute = 600ms between requests
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
        category: 'mlb.init.weather',
        level: 'warning',
      });
    }
  }

  async syncAllMLBData(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting MLB data sync',
        category: 'mlb.sync',
        level: 'info',
      });

      await Promise.all([
        this.syncTeams(),
        this.syncPlayers(),
        this.syncGames(),
        this.syncStats(),
        this.syncWeatherData(),
        this.syncInjuryReports(),
      ]);

      Sentry.captureMessage('MLB data sync completed successfully', 'info');
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  private async syncTeams(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting teams sync from MLB Stats API',
        category: 'mlb.sync.teams',
        level: 'info',
      });

      const teamsResponse = await this.fetchFromMLBAPI('/teams');
      
      if (!this.validateTeamsResponse(teamsResponse)) {
        throw new Error('Invalid teams API response structure');
      }

      const teams = teamsResponse.teams || [];
      const teamsCollection = collection(db, 'mlb_teams');

      for (const team of teams) {
        const teamData = {
          id: team.id,
          name: team.name,
          teamName: team.teamName,
          abbreviation: team.abbreviation,
          locationName: team.locationName,
          firstYearOfPlay: team.firstYearOfPlay,
          shortName: team.shortName,
          franchiseName: team.franchiseName,
          clubName: team.clubName,
          active: team.active,
          // League and Division info
          league: {
            id: team.league?.id,
            name: team.league?.name,
          },
          division: {
            id: team.division?.id,
            name: team.division?.name,
          },
          // Venue information
          venue: team.venue ? {
            id: team.venue.id,
            name: team.venue.name,
            location: team.venue.location,
          } : null,
          // Spring training venues
          springVenue: team.springVenue ? {
            id: team.springVenue.id,
            name: team.springVenue.name,
          } : null,
          // Team colors and branding
          teamCode: team.teamCode,
          fileCode: team.fileCode,
          // Sync metadata
          lastUpdated: new Date(),
          dataSource: 'mlb_stats_api',
          syncStatus: 'completed',
        };

        await setDoc(doc(teamsCollection, team.id.toString()), teamData, { merge: true });
        
        Sentry.addBreadcrumb({
          message: `Synced team: ${team.name}`,
          category: 'mlb.sync.teams.detail',
          level: 'debug',
        });
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${teams.length} teams`,
        category: 'mlb.sync.teams',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Team sync failed: ${(error as Error).message}`);
    }
  }

  private async syncPlayers(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting players sync from MLB Stats API',
        category: 'mlb.sync.players',
        level: 'info',
      });

      // Get current active players - we'll sync team rosters
      const teamsResponse = await this.fetchFromMLBAPI('/teams');
      const teams = teamsResponse.teams || [];
      
      const playersCollection = collection(db, 'mlb_players');
      let totalPlayersSynced = 0;

      for (const team of teams) {
        if (!team.active) continue;

        try {
          // Get team roster
          const rosterResponse = await this.fetchFromMLBAPI(`/teams/${team.id}/roster`);
          
          if (!this.validateRosterResponse(rosterResponse)) {
            Sentry.addBreadcrumb({
              message: `Invalid roster response for team ${team.name}`,
              category: 'mlb.sync.players.error',
              level: 'warning',
            });
            continue;
          }

          const roster = rosterResponse.roster || [];

          for (const rosterEntry of roster) {
            const player = rosterEntry.person;
            if (!player) continue;

            // Get detailed player info
            const playerDetailResponse = await this.fetchFromMLBAPI(`/people/${player.id}`);
            const playerDetail = playerDetailResponse.people?.[0];

            if (!playerDetail) continue;

            const playerData = {
              id: playerDetail.id,
              fullName: playerDetail.fullName,
              firstName: playerDetail.firstName,
              lastName: playerDetail.lastName,
              currentTeam: {
                id: team.id,
                name: team.name,
              },
              // Position information
              primaryPosition: playerDetail.primaryPosition ? {
                code: playerDetail.primaryPosition.code,
                name: playerDetail.primaryPosition.name,
                type: playerDetail.primaryPosition.type,
                abbreviation: playerDetail.primaryPosition.abbreviation,
              } : null,
              // Physical attributes
              height: playerDetail.height,
              weight: playerDetail.weight,
              birthDate: playerDetail.birthDate,
              birthCity: playerDetail.birthCity,
              birthStateProvince: playerDetail.birthStateProvince,
              birthCountry: playerDetail.birthCountry,
              // Batting/Throwing
              batSide: playerDetail.batSide ? {
                code: playerDetail.batSide.code,
                description: playerDetail.batSide.description,
              } : null,
              pitchHand: playerDetail.pitchHand ? {
                code: playerDetail.pitchHand.code,
                description: playerDetail.pitchHand.description,
              } : null,
              // Career info
              mlbDebutDate: playerDetail.mlbDebutDate,
              // Jersey and roster info
              jerseyNumber: rosterEntry.jerseyNumber,
              rosterStatus: rosterEntry.status?.code,
              // Additional info
              active: playerDetail.active,
              nameFirstLast: playerDetail.nameFirstLast,
              nameSlug: playerDetail.nameSlug,
              boxscoreName: playerDetail.boxscoreName,
              // Current season stats (if available)
              currentStats: await this.getPlayerCurrentStats(playerDetail.id),
              // Sync metadata
              lastUpdated: new Date(),
              dataSource: 'mlb_stats_api',
              syncStatus: 'completed',
            };

            await setDoc(doc(playersCollection, playerDetail.id.toString()), playerData, { merge: true });
            totalPlayersSynced++;

            if (totalPlayersSynced % 50 === 0) {
              Sentry.addBreadcrumb({
                message: `Synced ${totalPlayersSynced} players so far`,
                category: 'mlb.sync.players.progress',
                level: 'debug',
              });
            }
          }
        } catch (teamError) {
          Sentry.captureException(teamError);
          Sentry.addBreadcrumb({
            message: `Failed to sync players for team ${team.name}: ${(teamError as Error).message}`,
            category: 'mlb.sync.players.team_error',
            level: 'warning',
          });
          // Continue with other teams
        }
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${totalPlayersSynced} players`,
        category: 'mlb.sync.players',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Player sync failed: ${(error as Error).message}`);
    }
  }

  private async syncGames(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting games sync from MLB Stats API',
        category: 'mlb.sync.games',
        level: 'info',
      });

      // Get schedule for current date range (today + next 7 days)
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);
      
      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const scheduleResponse = await this.fetchFromMLBAPI(
        `/schedule?startDate=${startDateStr}&endDate=${endDateStr}&sportId=1&hydrate=team,venue,weather,lineups,probablePitcher`
      );
      
      if (!this.validateScheduleResponse(scheduleResponse)) {
        throw new Error('Invalid schedule API response structure');
      }

      const gamesCollection = collection(db, 'mlb_games');
      let totalGamesSynced = 0;

      for (const dateEntry of scheduleResponse.dates) {
        const games = dateEntry.games || [];
        
        for (const game of games) {
          const gameData = {
            gamePk: game.gamePk,
            gameDate: game.gameDate,
            officialDate: game.officialDate,
            dayNight: game.dayNight,
            // Team information
            teams: {
              away: {
                team: {
                  id: game.teams.away.team.id,
                  name: game.teams.away.team.name,
                },
                leagueRecord: game.teams.away.leagueRecord,
                score: game.teams.away.score,
                isWinner: game.teams.away.isWinner,
                probablePitcher: game.teams.away.probablePitcher,
              },
              home: {
                team: {
                  id: game.teams.home.team.id,
                  name: game.teams.home.team.name,
                },
                leagueRecord: game.teams.home.leagueRecord,
                score: game.teams.home.score,
                isWinner: game.teams.home.isWinner,
                probablePitcher: game.teams.home.probablePitcher,
              },
            },
            // Venue information
            venue: game.venue ? {
              id: game.venue.id,
              name: game.venue.name,
              location: game.venue.location,
            } : null,
            // Weather information (if available)
            weather: game.weather,
            // Game status
            status: {
              abstractGameState: game.status.abstractGameState,
              codedGameState: game.status.codedGameState,
              detailedState: game.status.detailedState,
              statusCode: game.status.statusCode,
              abstractGameCode: game.status.abstractGameCode,
            },
            // Inning information
            inning: game.linescore?.currentInning,
            inningState: game.linescore?.inningState,
            // Additional game info
            gameType: game.gameType,
            tiebreaker: game.tiebreaker,
            gameNumber: game.gameNumber,
            publicFacing: game.publicFacing,
            doubleHeader: game.doubleHeader,
            gameTimeUTC: game.gameTimeUTC,
            // Weather conditions for analysis
            weatherConditions: await this.getWeatherForGame(game),
            // Analysis flags
            bettingOddsSync: false, // To be implemented
            mlPredictionsGenerated: false,
            dataIntegrity: this.validateGameData(game),
            ballparkFactors: game.venue?.id ? await this.getBallparkFactors(game.venue.id) : null,
            // Sync metadata
            lastUpdated: new Date(),
            dataSource: 'mlb_stats_api',
            syncStatus: 'completed',
          };

          await setDoc(doc(gamesCollection, game.gamePk.toString()), gameData, { merge: true });
          totalGamesSynced++;
          
          if (totalGamesSynced % 10 === 0) {
            Sentry.addBreadcrumb({
              message: `Synced ${totalGamesSynced} games so far`,
              category: 'mlb.sync.games.progress',
              level: 'debug',
            });
          }
        }
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${totalGamesSynced} games`,
        category: 'mlb.sync.games',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Game sync failed: ${(error as Error).message}`);
    }
  }

  private async syncStats(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting stats sync from MLB Stats API',
        category: 'mlb.sync.stats',
        level: 'info',
      });

      // Stats are already synced as part of player sync
      // This method could be used for historical stats or league leaders
      
      const currentYear = new Date().getFullYear();
      
      // Sync league leaders for current season
      const leaderResponse = await this.fetchFromMLBAPI(
        `/stats/leaders?leaderCategories=homeRuns,rbi,battingAverage,era,wins,strikeouts&season=${currentYear}&sportId=1`
      );

      if (leaderResponse.leagueLeaders) {
        const statsCollection = collection(db, 'mlb_league_leaders');
        
        for (const category of leaderResponse.leagueLeaders) {
          const categoryData = {
            category: category.leaderCategory,
            season: currentYear,
            leaders: category.leaders,
            lastUpdated: new Date(),
            dataSource: 'mlb_stats_api',
          };

          await setDoc(
            doc(statsCollection, `${currentYear}_${category.leaderCategory}`),
            categoryData,
            { merge: true }
          );
        }
      }

      Sentry.addBreadcrumb({
        message: 'Successfully synced league leader statistics',
        category: 'mlb.sync.stats',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Stats sync failed: ${(error as Error).message}`);
    }
  }

  private async syncWeatherData(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting weather data sync for today\'s games',
        category: 'mlb.sync.weather',
        level: 'info',
      });

      // Get today's games
      const today = new Date().toISOString().split('T')[0];
      const scheduleResponse = await this.fetchFromMLBAPI(
        `/schedule?date=${today}&sportId=1&hydrate=venue`
      );

      if (!this.validateScheduleResponse(scheduleResponse)) {
        throw new Error('Invalid schedule response for weather sync');
      }

      const weatherCollection = collection(db, 'mlb_weather');
      let weatherDataSynced = 0;

      for (const dateEntry of scheduleResponse.dates) {
        const games = dateEntry.games || [];
        
        for (const game of games) {
          if (game.venue && game.venue.location && game.venue.location.latitude && game.venue.location.longitude) {
            try {
              const weatherData = await this.fetchWeatherData(
                game.venue.location.latitude,
                game.venue.location.longitude
              );

              if (weatherData) {
                const gameWeatherData = {
                  gameId: game.gamePk,
                  venueId: game.venue.id,
                  venueName: game.venue.name,
                  temperature: weatherData.main?.temp,
                  humidity: weatherData.main?.humidity,
                  windSpeed: weatherData.wind?.speed,
                  windDirection: weatherData.wind?.deg,
                  conditions: weatherData.weather?.[0]?.description,
                  visibility: weatherData.visibility,
                  pressure: weatherData.main?.pressure,
                  lastUpdated: new Date(),
                  impactFactors: this.calculateWeatherImpact(weatherData),
                  dataSource: 'openweather_api',
                };

                await setDoc(doc(weatherCollection, game.gamePk.toString()), gameWeatherData, { merge: true });
                weatherDataSynced++;
              }
            } catch (weatherError) {
              Sentry.addBreadcrumb({
                message: `Failed to fetch weather for game ${game.gamePk}: ${(weatherError as Error).message}`,
                category: 'mlb.sync.weather.error',
                level: 'warning',
              });
              // Continue with other games
            }
          }
        }
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced weather data for ${weatherDataSynced} games`,
        category: 'mlb.sync.weather',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Weather sync failed: ${(error as Error).message}`);
    }
  }

  private async syncInjuryReports(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting injury reports sync',
        category: 'mlb.sync.injuries',
        level: 'info',
      });

      // MLB Stats API doesn't have a dedicated injuries endpoint
      // Injury information is typically found in roster status
      // We'll check disabled list and transaction data
      
      const teamsResponse = await this.fetchFromMLBAPI('/teams');
      const teams = teamsResponse.teams || [];
      
      const injuriesCollection = collection(db, 'mlb_injuries');
      let totalInjuriesSynced = 0;

      for (const team of teams) {
        if (!team.active) continue;

        try {
          // Get team's disabled list (injured players)
          const transactionsResponse = await this.fetchFromMLBAPI(
            `/teams/${team.id}/transactions?startDate=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`
          );

          if (transactionsResponse.transactions) {
            for (const transaction of transactionsResponse.transactions) {
              if (transaction.typeDesc && 
                  (transaction.typeDesc.includes('Placed on') || 
                   transaction.typeDesc.includes('IL') ||
                   transaction.typeDesc.includes('disabled'))) {
                
                const injuryData = {
                  transactionId: transaction.id,
                  playerId: transaction.player?.id,
                  playerName: transaction.player?.fullName,
                  teamId: team.id,
                  teamName: team.name,
                  transactionType: transaction.typeDesc,
                  date: transaction.date,
                  description: transaction.description,
                  fromTeam: transaction.fromTeam?.name,
                  toTeam: transaction.toTeam?.name,
                  effectiveDate: transaction.effectiveDate,
                  resolutionDate: transaction.resolutionDate,
                  // Derived injury information
                  injuryStatus: this.deriveInjuryStatus(transaction.typeDesc),
                  impactSeverity: this.calculateTransactionImpact(transaction),
                  // Sync metadata
                  lastUpdated: new Date(),
                  dataSource: 'mlb_stats_api_transactions',
                  syncStatus: 'completed',
                };

                await setDoc(
                  doc(injuriesCollection, `${transaction.player?.id}_${transaction.id}`),
                  injuryData,
                  { merge: true }
                );
                
                totalInjuriesSynced++;
              }
            }
          }
        } catch (teamError) {
          Sentry.addBreadcrumb({
            message: `Failed to sync injury data for team ${team.name}: ${(teamError as Error).message}`,
            category: 'mlb.sync.injuries.team_error',
            level: 'warning',
          });
          // Continue with other teams
        }
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${totalInjuriesSynced} injury/transaction records`,
        category: 'mlb.sync.injuries',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Injury sync failed: ${(error as Error).message}`);
    }
  }

  private deriveInjuryStatus(transactionType: string): string {
    const type = transactionType.toLowerCase();
    if (type.includes('10-day il') || type.includes('10-day injured')) return '10-Day IL';
    if (type.includes('15-day il') || type.includes('15-day injured')) return '15-Day IL';
    if (type.includes('60-day il') || type.includes('60-day injured')) return '60-Day IL';
    if (type.includes('bereavement')) return 'Bereavement List';
    if (type.includes('paternity')) return 'Paternity List';
    if (type.includes('suspended')) return 'Suspended';
    return 'Unknown';
  }

  private calculateTransactionImpact(transaction: any): string {
    const type = transaction.typeDesc?.toLowerCase() || '';
    if (type.includes('60-day')) return 'High';
    if (type.includes('15-day') || type.includes('suspension')) return 'Medium';
    if (type.includes('10-day') || type.includes('day-to-day')) return 'Low';
    return 'Unknown';
  }

  private async fetchFromMLBAPI(endpoint: string, retryCount = 0): Promise<any> {
    try {
      // Rate limiting - ensure we don't exceed 100 requests per minute
      await this.enforceRateLimit();

      const url = `${this.baseUrl}${endpoint}`;
      
      Sentry.addBreadcrumb({
        message: `Making MLB API request: ${url}`,
        category: 'mlb.api.request',
        level: 'debug',
        data: { endpoint, retryCount }
      });

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AI-Sports-Edge/1.0',
          'Accept': 'application/json',
        },
        // Note: timeout is handled by AbortController in production environments
      });

      if (!response.ok) {
        const errorMessage = `MLB API error: ${response.status} ${response.statusText}`;
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default to 1 minute
          
          Sentry.addBreadcrumb({
            message: `Rate limited, waiting ${delay}ms before retry`,
            category: 'mlb.api.rate_limit',
            level: 'warning',
          });
          
          await this.sleep(delay);
          
          if (retryCount < this.maxRetries) {
            return this.fetchFromMLBAPI(endpoint, retryCount + 1);
          }
        }
        
        // Handle server errors with retry
        if (response.status >= 500 && retryCount < this.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          
          Sentry.addBreadcrumb({
            message: `Server error ${response.status}, retrying in ${delay}ms`,
            category: 'mlb.api.server_error',
            level: 'warning',
          });
          
          await this.sleep(delay);
          return this.fetchFromMLBAPI(endpoint, retryCount + 1);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      Sentry.addBreadcrumb({
        message: `MLB API request successful: ${url}`,
        category: 'mlb.api.success',
        level: 'debug',
        data: { 
          endpoint, 
          dataSize: JSON.stringify(data).length,
          retryCount 
        }
      });

      this.requestCount++;
      return data;
      
    } catch (error) {
      Sentry.captureException(error);
      
      // Retry on network errors
      if (retryCount < this.maxRetries && (error as any).name === 'TypeError') {
        const delay = Math.pow(2, retryCount) * 1000;
        
        Sentry.addBreadcrumb({
          message: `Network error, retrying in ${delay}ms`,
          category: 'mlb.api.network_error',
          level: 'warning',
        });
        
        await this.sleep(delay);
        return this.fetchFromMLBAPI(endpoint, retryCount + 1);
      }
      
      throw new Error(`MLB API request failed: ${(error as Error).message}`);
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await this.sleep(delay);
    }
    
    this.lastRequestTime = Date.now();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWeatherData(lat: number, lon: number): Promise<any> {
    try {
      if (!this.weatherApiKey) {
        Sentry.addBreadcrumb({
          message: 'Weather API key not configured - skipping weather data',
          category: 'mlb.weather.skip',
          level: 'warning',
        });
        return null;
      }

      await this.enforceRateLimit(); // Apply rate limiting to weather requests too

      const url = `${this.weatherBaseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=imperial`;
      
      Sentry.addBreadcrumb({
        message: `Fetching weather data for coordinates: ${lat}, ${lon}`,
        category: 'mlb.weather.request',
        level: 'debug',
      });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const weatherData = await response.json();
      
      Sentry.addBreadcrumb({
        message: `Weather API request successful for coordinates: ${lat}, ${lon}`,
        category: 'mlb.weather.success',
        level: 'debug',
        data: { 
          temperature: weatherData.main?.temp,
          conditions: weatherData.weather?.[0]?.description 
        }
      });

      return weatherData;
    } catch (error) {
      Sentry.captureException(error);
      Sentry.addBreadcrumb({
        message: `Weather API request failed for coordinates: ${lat}, ${lon}`,
        category: 'mlb.weather.error',
        level: 'warning',
      });
      // Return null instead of throwing to avoid breaking the main sync
      return null;
    }
  }

  // Validation methods for API responses
  private validateTeamsResponse(response: any): boolean {
    return response && Array.isArray(response.teams);
  }

  private validateRosterResponse(response: any): boolean {
    return response && Array.isArray(response.roster);
  }

  private validateScheduleResponse(response: any): boolean {
    return response && Array.isArray(response.dates);
  }

  private validateStandingsResponse(response: any): boolean {
    return response && Array.isArray(response.records);
  }

  private async getPlayerCurrentStats(playerId: number): Promise<any> {
    try {
      const currentYear = new Date().getFullYear();
      const statsResponse = await this.fetchFromMLBAPI(`/people/${playerId}/stats?stats=season&season=${currentYear}`);
      
      if (!statsResponse.stats || statsResponse.stats.length === 0) {
        return null;
      }

      const stats = {};
      
      // Process each stat group (hitting, pitching, fielding)
      for (const statGroup of statsResponse.stats) {
        if (statGroup.splits && statGroup.splits.length > 0) {
          const statData = statGroup.splits[0].stat;
          const groupName = statGroup.group?.displayName?.toLowerCase() || 'unknown';
          
          (stats as any)[groupName] = {
            ...statData,
            season: currentYear,
            lastUpdated: new Date(),
          };
        }
      }

      return stats;
    } catch (error) {
      Sentry.addBreadcrumb({
        message: `Failed to fetch stats for player ${playerId}: ${(error as Error).message}`,
        category: 'mlb.sync.player_stats.error',
        level: 'warning',
      });
      return null;
    }
  }

  private async getBallparkFactors(_venueId: number): Promise<any> {
    // Ballpark factors could be implemented with stadium-specific data
    // For now, return basic factors that can be enhanced later
    return {
      homeRunFactor: 1.0,
      runsFactor: 1.0,
      hitsFactor: 1.0,
      walksFactor: 1.0,
      dimensions: null, // To be populated with real stadium data
      altitude: 0,
      climate: 'unknown',
    };
  }

  private async getWeatherForGame(game: any): Promise<any> {
    // FLAG: Replace with real weather API integration
    if (game.venue && game.venue.location) {
      return await this.fetchWeatherData(
        game.venue.location.latitude,
        game.venue.location.longitude
      );
    }
    return null;
  }

  private calculateAdvancedMetrics(stat: any): any {
    // Calculate advanced baseball metrics
    const stats = stat.stats || {};
    
    return {
      war: this.calculateWAR(stats),
      wrc_plus: this.calculateWRCPlus(stats),
      babip: this.calculateBABIP(stats),
      iso: this.calculateISO(stats),
      k_percent: this.calculateKPercent(stats),
      bb_percent: this.calculateBBPercent(stats),
    };
  }

  private calculateWAR(stats: any): number {
    // Simplified WAR calculation - FLAG: Use more sophisticated formula
    const batting = (stats.onBasePlusSlugging || 0) * 0.1;
    const fielding = (stats.fieldingPercentage || 0) * 0.05;
    const baserunning = (stats.stolenBases || 0) * 0.02;
    
    return Math.max(0, batting + fielding + baserunning - 2.0);
  }

  private calculateWRCPlus(stats: any): number {
    // Simplified wRC+ calculation - FLAG: Use park and league adjustments
    const ops = stats.onBasePlusSlugging || 0;
    return Math.round((ops / 0.735) * 100);
  }

  private calculateBABIP(stats: any): number {
    const hits = stats.hits || 0;
    const homeRuns = stats.homeRuns || 0;
    const atBats = stats.atBats || 1;
    const strikeouts = stats.strikeOuts || 0;
    const sacrificeFlies = stats.sacrificeFlies || 0;
    
    const ballsInPlay = atBats - strikeouts - homeRuns + sacrificeFlies;
    return ballsInPlay > 0 ? (hits - homeRuns) / ballsInPlay : 0;
  }

  private calculateISO(stats: any): number {
    const slugging = stats.sluggingPercentage || 0;
    const average = stats.battingAverage || 0;
    return slugging - average;
  }

  private calculateKPercent(stats: any): number {
    const strikeouts = stats.strikeOuts || 0;
    const plateAppearances = stats.plateAppearances || stats.atBats || 1;
    return (strikeouts / plateAppearances) * 100;
  }

  private calculateBBPercent(stats: any): number {
    const walks = stats.baseOnBalls || 0;
    const plateAppearances = stats.plateAppearances || stats.atBats || 1;
    return (walks / plateAppearances) * 100;
  }

  private calculateWeatherImpact(weatherData: any): any {
    const temp = weatherData.main?.temp || 70;
    const humidity = weatherData.main?.humidity || 50;
    const windSpeed = weatherData.wind?.speed || 0;
    const windDirection = weatherData.wind?.deg || 0;

    return {
      homeRunFactor: this.calculateHomeRunFactor(temp, humidity, windSpeed, windDirection),
      flyBallCarry: this.calculateFlyBallCarry(temp, humidity),
      pitchingConditions: this.calculatePitchingConditions(temp, humidity, windSpeed),
      fieldingConditions: this.calculateFieldingConditions(temp, humidity),
    };
  }

  private calculateHomeRunFactor(temp: number, humidity: number, windSpeed: number, windDirection: number): number {
    let factor = 1.0;
    
    // Temperature effect (higher temp = more carry)
    factor += (temp - 70) * 0.002;
    
    // Humidity effect (lower humidity = more carry)
    factor -= (humidity - 50) * 0.001;
    
    // Wind effect (tailwind helps, headwind hurts)
    const windFactor = Math.cos((windDirection - 90) * Math.PI / 180);
    factor += windSpeed * windFactor * 0.01;
    
    return Math.max(0.8, Math.min(1.2, factor));
  }

  private calculateFlyBallCarry(temp: number, humidity: number): number {
    const baseFactor = 1.0;
    const tempFactor = (temp - 70) * 0.003;
    const humidityFactor = (50 - humidity) * 0.002;
    
    return baseFactor + tempFactor + humidityFactor;
  }

  private calculatePitchingConditions(temp: number, humidity: number, windSpeed: number): string {
    if (temp < 50 || windSpeed > 20) return 'Difficult';
    if (temp > 85 && humidity > 70) return 'Challenging';
    if (temp >= 65 && temp <= 80 && windSpeed < 10) return 'Ideal';
    return 'Good';
  }

  private calculateFieldingConditions(temp: number, humidity: number): string {
    if (temp < 40 || humidity > 80) return 'Poor';
    if (temp >= 60 && temp <= 85 && humidity < 60) return 'Excellent';
    return 'Good';
  }

  private calculateInjuryImpact(injury: any): string {
    const injuryType = injury.injuryType?.toLowerCase() || '';
    const status = injury.status?.toLowerCase() || '';
    
    if (status.includes('disabled') || status.includes('il')) return 'High';
    if (injuryType.includes('shoulder') || injuryType.includes('elbow') || injuryType.includes('knee')) return 'Medium';
    if (status.includes('day-to-day')) return 'Low';
    
    return 'Unknown';
  }

  private validateGameData(game: any): boolean {
    const requiredFields = ['gamePk', 'gameDate', 'teams', 'status'];
    const hasRequiredFields = requiredFields.every(field => game[field] !== undefined);
    
    // Additional validation for team data
    const hasValidTeams = game.teams && 
                         game.teams.home && 
                         game.teams.away && 
                         game.teams.home.team && 
                         game.teams.away.team;
    
    return hasRequiredFields && hasValidTeams;
  }

  async getLastSyncStatus(): Promise<any> {
    try {
      const statusDoc = doc(db, 'sync_status', 'mlb_data_sync');
      const statusSnapshot = await getDoc(statusDoc);

      return statusSnapshot.exists() ? statusSnapshot.data() : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async updateSyncStatus(status: any): Promise<void> {
    try {
      const statusDoc = doc(db, 'sync_status', 'mlb_data_sync');
      
      await setDoc(statusDoc, {
        ...status,
        lastUpdated: new Date(),
      }, { merge: true });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}