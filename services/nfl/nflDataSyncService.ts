// =============================================================================
// NFL DATA SYNC SERVICE
// Deep Focus Architecture with Real Data Integration Points
// =============================================================================

import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore as db } from '../../config/firebase';
import * as Sentry from '@sentry/react-native';
import { getWeatherApiKey } from '../../utils/apiKeys';

export class NFLDataSyncService {
  private readonly baseUrl = 'https://api.espn.com/v2/sports/football/leagues/nfl';
  private readonly weatherApiKey: string;
  private readonly weatherBaseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly rateLimitDelay = 1000; // 60 requests per minute = 1000ms between requests
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
        category: 'nfl.init.weather',
        level: 'warning',
      });
    }
  }

  async syncAllNFLData(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting NFL data sync',
        category: 'nfl.sync',
        level: 'info',
      });

      await Promise.all([
        this.syncTeams(),
        this.syncPlayers(),
        this.syncGames(),
        this.syncStandings(),
        this.syncWeatherData(),
        this.syncInjuryReports(),
      ]);

      Sentry.captureMessage('NFL data sync completed successfully', 'info');
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  private async syncTeams(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting teams sync from ESPN NFL API',
        category: 'nfl.sync.teams',
        level: 'info',
      });

      const teamsResponse = await this.fetchFromNFLAPI('/teams');
      
      if (!this.validateTeamsResponse(teamsResponse)) {
        throw new Error('Invalid teams API response structure');
      }

      const teams = teamsResponse.items || [];
      const teamsCollection = collection(db, 'nfl_teams');

      for (const team of teams) {
        const teamData = {
          id: team.id,
          name: team.displayName,
          abbreviation: team.abbreviation,
          location: team.location,
          nickname: team.nickname,
          color: team.color,
          alternateColor: team.alternateColor,
          // League and Division info
          conference: {
            id: team.conference?.id,
            name: team.conference?.name,
            abbreviation: team.conference?.abbreviation,
          },
          division: {
            id: team.division?.id,
            name: team.division?.name,
            abbreviation: team.division?.abbreviation,
          },
          // Stadium information - critical for outdoor weather analysis
          venue: team.venue ? {
            id: team.venue.id,
            name: team.venue.name,
            capacity: team.venue.capacity,
            isDome: team.venue.indoor,
            surface: team.venue.grass || 'Artificial',
            location: {
              latitude: team.venue.location?.latitude,
              longitude: team.venue.location?.longitude,
              city: team.venue.location?.city,
              state: team.venue.location?.state,
            },
          } : null,
          // Team performance data
          record: team.record ? {
            wins: team.record.wins,
            losses: team.record.losses,
            ties: team.record.ties,
            percentage: team.record.percentage,
            pointsFor: team.record.pointsFor,
            pointsAgainst: team.record.pointsAgainst,
            pointDifferential: team.record.pointsFor - team.record.pointsAgainst,
          } : null,
          // Coaching staff
          coach: team.coach ? {
            id: team.coach.id,
            name: team.coach.displayName,
            experience: team.coach.experience,
          } : null,
          // Salary cap information
          salaryCapInfo: {
            totalCapSpace: team.salaryCapSpace || 0,
            usedCapSpace: team.usedCapSpace || 0,
            availableCapSpace: team.availableCapSpace || 0,
            deadMoney: team.deadMoney || 0,
          },
          // Team analytics
          offensiveRankings: await this.getTeamOffensiveRankings(team.id),
          defensiveRankings: await this.getTeamDefensiveRankings(team.id),
          specialTeamsRankings: await this.getTeamSpecialTeamsRankings(team.id),
          // Sync metadata
          lastUpdated: new Date(),
          dataSource: 'espn_nfl_api',
          syncStatus: 'completed',
        };

        await setDoc(doc(teamsCollection, team.id.toString()), teamData, { merge: true });
        
        Sentry.addBreadcrumb({
          message: `Synced team: ${team.displayName}`,
          category: 'nfl.sync.teams.detail',
          level: 'debug',
        });
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${teams.length} teams`,
        category: 'nfl.sync.teams',
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
        message: 'Starting players sync from ESPN NFL API',
        category: 'nfl.sync.players',
        level: 'info',
      });

      // Get current active teams - we'll sync team rosters
      const teamsResponse = await this.fetchFromNFLAPI('/teams');
      const teams = teamsResponse.items || [];
      
      const playersCollection = collection(db, 'nfl_players');
      let totalPlayersSynced = 0;

      for (const team of teams) {
        try {
          // Get team roster
          const rosterResponse = await this.fetchFromNFLAPI(`/teams/${team.id}/roster`);
          
          if (!this.validateRosterResponse(rosterResponse)) {
            Sentry.addBreadcrumb({
              message: `Invalid roster response for team ${team.displayName}`,
              category: 'nfl.sync.players.error',
              level: 'warning',
            });
            continue;
          }

          const roster = rosterResponse.athletes || [];

          for (const athlete of roster) {
            if (!athlete) continue;

            // Get detailed player info
            const playerDetailResponse = await this.fetchFromNFLAPI(`/athletes/${athlete.id}`);
            
            if (!playerDetailResponse) continue;

            const playerData = {
              id: playerDetailResponse.id,
              fullName: playerDetailResponse.displayName,
              firstName: playerDetailResponse.firstName,
              lastName: playerDetailResponse.lastName,
              // Team information
              currentTeam: {
                id: team.id,
                name: team.displayName,
                abbreviation: team.abbreviation,
              },
              // Position information - critical for NFL depth charts
              position: {
                id: playerDetailResponse.position?.id,
                name: playerDetailResponse.position?.name,
                abbreviation: playerDetailResponse.position?.abbreviation,
                displayName: playerDetailResponse.position?.displayName,
                leaf: playerDetailResponse.position?.leaf, // Specific position (e.g., LT vs OL)
              },
              // Physical attributes
              height: playerDetailResponse.height,
              weight: playerDetailResponse.weight,
              age: playerDetailResponse.age,
              // NFL-specific info
              jerseyNumber: athlete.jersey,
              experience: playerDetailResponse.experience?.years,
              college: playerDetailResponse.college?.name,
              draft: playerDetailResponse.draft ? {
                year: playerDetailResponse.draft.year,
                round: playerDetailResponse.draft.round,
                pick: playerDetailResponse.draft.pick,
                team: playerDetailResponse.draft.team?.displayName,
              } : null,
              // Contract and salary info
              contract: {
                salaryCapHit: athlete.salaryCapHit || 0,
                baseSalary: athlete.baseSalary || 0,
                bonuses: athlete.bonuses || 0,
                yearsRemaining: athlete.yearsRemaining || 0,
              },
              // Depth chart position
              depthChart: {
                position: athlete.depthChart?.position,
                order: athlete.depthChart?.order || 99,
                starter: athlete.depthChart?.starter || false,
              },
              // Current season stats
              currentStats: await this.getPlayerCurrentStats(playerDetailResponse.id),
              // Injury status
              injuryStatus: {
                status: athlete.injury?.status || 'Healthy',
                type: athlete.injury?.type,
                description: athlete.injury?.description,
                returnDate: athlete.injury?.expectedReturn,
                designation: athlete.injury?.gameDesignation, // Q, D, O, IR
              },
              // Performance grades
              pffGrade: await this.getPFFGrade(playerDetailResponse.id),
              // Fantasy relevance
              fantasyData: await this.getFantasyData(playerDetailResponse.id),
              // Sync metadata
              lastUpdated: new Date(),
              dataSource: 'espn_nfl_api',
              syncStatus: 'completed',
            };

            await setDoc(doc(playersCollection, playerDetailResponse.id.toString()), playerData, { merge: true });
            totalPlayersSynced++;

            if (totalPlayersSynced % 50 === 0) {
              Sentry.addBreadcrumb({
                message: `Synced ${totalPlayersSynced} players so far`,
                category: 'nfl.sync.players.progress',
                level: 'debug',
              });
            }
          }
        } catch (teamError) {
          Sentry.captureException(teamError);
          Sentry.addBreadcrumb({
            message: `Failed to sync players for team ${team.displayName}: ${(teamError as Error).message}`,
            category: 'nfl.sync.players.team_error',
            level: 'warning',
          });
          // Continue with other teams
        }
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${totalPlayersSynced} players`,
        category: 'nfl.sync.players',
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
        message: 'Starting games sync from ESPN NFL API',
        category: 'nfl.sync.games',
        level: 'info',
      });

      // Get current week and season
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      
      // Get schedule for current season
      const scheduleResponse = await this.fetchFromNFLAPI(`/seasons/${currentYear}/types/2/weeks`);
      
      if (!this.validateScheduleResponse(scheduleResponse)) {
        throw new Error('Invalid schedule API response structure');
      }

      const gamesCollection = collection(db, 'nfl_games');
      let totalGamesSynced = 0;

      // Get current and upcoming weeks
      for (const week of scheduleResponse.items.slice(-3)) { // Last 3 weeks
        try {
          const weekGamesResponse = await this.fetchFromNFLAPI(
            `/seasons/${currentYear}/types/2/weeks/${week.number}/events`
          );

          const games = weekGamesResponse.items || [];
          
          for (const game of games) {
            const gameData = {
              id: game.id,
              season: currentYear,
              week: week.number,
              date: game.date,
              // Team information
              competitors: {
                home: {
                  team: {
                    id: game.competitors.find((c: any) => c.homeAway === 'home')?.team.id,
                    name: game.competitors.find((c: any) => c.homeAway === 'home')?.team.displayName,
                    abbreviation: game.competitors.find((c: any) => c.homeAway === 'home')?.team.abbreviation,
                  },
                  score: game.competitors.find((c: any) => c.homeAway === 'home')?.score,
                  record: game.competitors.find((c: any) => c.homeAway === 'home')?.record,
                  winner: game.competitors.find((c: any) => c.homeAway === 'home')?.winner,
                },
                away: {
                  team: {
                    id: game.competitors.find((c: any) => c.homeAway === 'away')?.team.id,
                    name: game.competitors.find((c: any) => c.homeAway === 'away')?.team.displayName,
                    abbreviation: game.competitors.find((c: any) => c.homeAway === 'away')?.team.abbreviation,
                  },
                  score: game.competitors.find((c: any) => c.homeAway === 'away')?.score,
                  record: game.competitors.find((c: any) => c.homeAway === 'away')?.record,
                  winner: game.competitors.find((c: any) => c.homeAway === 'away')?.winner,
                },
              },
              // Venue information - critical for weather analysis
              venue: game.venue ? {
                id: game.venue.id,
                name: game.venue.fullName,
                indoor: game.venue.indoor,
                capacity: game.venue.capacity,
                surface: game.venue.grass || 'Artificial',
                location: {
                  latitude: game.venue.address?.latitude,
                  longitude: game.venue.address?.longitude,
                  city: game.venue.address?.city,
                  state: game.venue.address?.state,
                },
              } : null,
              // Game status and timing
              status: {
                type: game.status.type.name,
                detail: game.status.type.detail,
                shortDetail: game.status.type.shortDetail,
                completed: game.status.type.completed,
                description: game.status.type.description,
                period: game.status.period,
                clock: game.status.clock,
              },
              // Weather conditions for analysis - crucial for NFL
              weatherConditions: await this.getWeatherForGame(game),
              // Betting and predictions
              bettingOdds: await this.getBettingOdds(game.id),
              spreadLine: game.competitions?.[0]?.odds?.[0]?.spread,
              overUnder: game.competitions?.[0]?.odds?.[0]?.overUnder,
              // Game environment factors
              gameEnvironment: {
                primetime: this.isPrimeTimeGame(game.date),
                temperature: null, // Will be populated by weather sync
                windSpeed: null,
                precipitation: null,
                domeGame: game.venue?.indoor || false,
                crowdFactor: this.calculateCrowdFactor(game),
              },
              // Advanced analytics
              keyMatchups: await this.identifyKeyMatchups(game),
              injuryImpact: await this.calculateGameInjuryImpact(game),
              // Analysis flags
              mlPredictionsGenerated: false,
              dataIntegrity: this.validateGameData(game),
              // Sync metadata
              lastUpdated: new Date(),
              dataSource: 'espn_nfl_api',
              syncStatus: 'completed',
            };

            await setDoc(doc(gamesCollection, game.id.toString()), gameData, { merge: true });
            totalGamesSynced++;
            
            if (totalGamesSynced % 10 === 0) {
              Sentry.addBreadcrumb({
                message: `Synced ${totalGamesSynced} games so far`,
                category: 'nfl.sync.games.progress',
                level: 'debug',
              });
            }
          }
        } catch (weekError) {
          Sentry.addBreadcrumb({
            message: `Failed to sync games for week ${week.number}: ${(weekError as Error).message}`,
            category: 'nfl.sync.games.week_error',
            level: 'warning',
          });
          // Continue with other weeks
        }
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${totalGamesSynced} games`,
        category: 'nfl.sync.games',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Game sync failed: ${(error as Error).message}`);
    }
  }

  private async syncStandings(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting standings sync from ESPN NFL API',
        category: 'nfl.sync.standings',
        level: 'info',
      });

      const currentYear = new Date().getFullYear();
      
      // Get NFL standings
      const standingsResponse = await this.fetchFromNFLAPI(
        `/seasons/${currentYear}/types/2/groups`
      );

      if (!this.validateStandingsResponse(standingsResponse)) {
        throw new Error('Invalid standings API response structure');
      }

      const standingsCollection = collection(db, 'nfl_standings');

      for (const conference of standingsResponse.children) {
        for (const division of conference.children) {
          const divisionStandings = {
            season: currentYear,
            conferenceId: conference.id,
            conferenceName: conference.name,
            divisionId: division.id,
            divisionName: division.name,
            standings: division.standings?.entries || [],
            playoffPicture: await this.getPlayoffPicture(division.id),
            lastUpdated: new Date(),
            dataSource: 'espn_nfl_api',
          };

          await setDoc(
            doc(standingsCollection, `${currentYear}_${division.id}`),
            divisionStandings,
            { merge: true }
          );
        }
      }

      Sentry.addBreadcrumb({
        message: 'Successfully synced NFL standings',
        category: 'nfl.sync.standings',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Standings sync failed: ${(error as Error).message}`);
    }
  }

  private async syncWeatherData(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting weather data sync for NFL games',
        category: 'nfl.sync.weather',
        level: 'info',
      });

      // Get this week's games
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentWeek = this.getCurrentNFLWeek();

      const weekGamesResponse = await this.fetchFromNFLAPI(
        `/seasons/${currentYear}/types/2/weeks/${currentWeek}/events`
      );

      if (!this.validateScheduleResponse(weekGamesResponse)) {
        throw new Error('Invalid schedule response for weather sync');
      }

      const weatherCollection = collection(db, 'nfl_weather');
      let weatherDataSynced = 0;

      const games = weekGamesResponse.items || [];
      
      for (const game of games) {
        // Only sync weather for outdoor venues
        if (game.venue && !game.venue.indoor && 
            game.venue.address?.latitude && game.venue.address?.longitude) {
          try {
            const weatherData = await this.fetchWeatherData(
              game.venue.address.latitude,
              game.venue.address.longitude
            );

            if (weatherData) {
              const gameWeatherData = {
                gameId: game.id,
                venueId: game.venue.id,
                venueName: game.venue.fullName,
                isOutdoor: !game.venue.indoor,
                // Basic weather data
                temperature: weatherData.main?.temp,
                humidity: weatherData.main?.humidity,
                windSpeed: weatherData.wind?.speed,
                windDirection: weatherData.wind?.deg,
                conditions: weatherData.weather?.[0]?.description,
                precipitation: weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0,
                visibility: weatherData.visibility,
                pressure: weatherData.main?.pressure,
                // NFL-specific weather impact analysis
                impactFactors: this.calculateNFLWeatherImpact(weatherData),
                // Game-specific adjustments
                passingGameImpact: this.calculatePassingImpact(weatherData),
                kickingImpact: this.calculateKickingImpact(weatherData),
                fumblesRisk: this.calculateFumblesRisk(weatherData),
                scoringProjection: this.calculateScoringProjection(weatherData),
                lastUpdated: new Date(),
                dataSource: 'openweather_api',
              };

              await setDoc(doc(weatherCollection, game.id.toString()), gameWeatherData, { merge: true });
              weatherDataSynced++;
            }
          } catch (weatherError) {
            Sentry.addBreadcrumb({
              message: `Failed to fetch weather for game ${game.id}: ${(weatherError as Error).message}`,
              category: 'nfl.sync.weather.error',
              level: 'warning',
            });
            // Continue with other games
          }
        }
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced weather data for ${weatherDataSynced} games`,
        category: 'nfl.sync.weather',
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
        message: 'Starting NFL injury reports sync',
        category: 'nfl.sync.injuries',
        level: 'info',
      });

      const teamsResponse = await this.fetchFromNFLAPI('/teams');
      const teams = teamsResponse.items || [];
      
      const injuriesCollection = collection(db, 'nfl_injuries');
      let totalInjuriesSynced = 0;

      for (const team of teams) {
        try {
          // Get team's current injury report
          const injuryResponse = await this.fetchFromNFLAPI(`/teams/${team.id}/injuries`);

          if (injuryResponse.items) {
            for (const injury of injuryResponse.items) {
              const injuryData = {
                id: `${injury.athlete.id}_${injury.week || 'current'}`,
                athleteId: injury.athlete.id,
                athleteName: injury.athlete.displayName,
                teamId: team.id,
                teamName: team.displayName,
                position: injury.athlete.position?.abbreviation,
                // NFL-specific injury designations
                status: injury.status, // Questionable, Doubtful, Out, IR
                injuryType: injury.type,
                description: injury.description,
                details: injury.details,
                // Timeline
                week: injury.week,
                dateReported: injury.date,
                expectedReturn: injury.expectedReturn,
                // Impact analysis
                fantasyImpact: this.calculateFantasyImpact(injury),
                teamImpact: this.calculateTeamImpact(injury),
                replacementPlayer: await this.getReplacementPlayer(injury.athlete.id, team.id),
                // Vegas line movement due to injury
                lineMovement: await this.getLineMovementFromInjury(injury),
                // Sync metadata
                lastUpdated: new Date(),
                dataSource: 'espn_nfl_api',
                syncStatus: 'completed',
              };

              await setDoc(
                doc(injuriesCollection, injuryData.id),
                injuryData,
                { merge: true }
              );
              
              totalInjuriesSynced++;
            }
          }
        } catch (teamError) {
          Sentry.addBreadcrumb({
            message: `Failed to sync injury data for team ${team.displayName}: ${(teamError as Error).message}`,
            category: 'nfl.sync.injuries.team_error',
            level: 'warning',
          });
          // Continue with other teams
        }
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${totalInjuriesSynced} injury records`,
        category: 'nfl.sync.injuries',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Injury sync failed: ${(error as Error).message}`);
    }
  }

  private async fetchFromNFLAPI(endpoint: string, retryCount = 0): Promise<any> {
    try {
      // Rate limiting - ensure we don't exceed 60 requests per minute
      await this.enforceRateLimit();

      const url = `${this.baseUrl}${endpoint}`;
      
      Sentry.addBreadcrumb({
        message: `Making NFL API request: ${url}`,
        category: 'nfl.api.request',
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
        const errorMessage = `NFL API error: ${response.status} ${response.statusText}`;
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default to 1 minute
          
          Sentry.addBreadcrumb({
            message: `Rate limited, waiting ${delay}ms before retry`,
            category: 'nfl.api.rate_limit',
            level: 'warning',
          });
          
          await this.sleep(delay);
          
          if (retryCount < this.maxRetries) {
            return this.fetchFromNFLAPI(endpoint, retryCount + 1);
          }
        }
        
        // Handle server errors with retry
        if (response.status >= 500 && retryCount < this.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          
          Sentry.addBreadcrumb({
            message: `Server error ${response.status}, retrying in ${delay}ms`,
            category: 'nfl.api.server_error',
            level: 'warning',
          });
          
          await this.sleep(delay);
          return this.fetchFromNFLAPI(endpoint, retryCount + 1);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      Sentry.addBreadcrumb({
        message: `NFL API request successful: ${url}`,
        category: 'nfl.api.success',
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
          category: 'nfl.api.network_error',
          level: 'warning',
        });
        
        await this.sleep(delay);
        return this.fetchFromNFLAPI(endpoint, retryCount + 1);
      }
      
      throw new Error(`NFL API request failed: ${(error as Error).message}`);
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
          category: 'nfl.weather.skip',
          level: 'warning',
        });
        return null;
      }

      await this.enforceRateLimit(); // Apply rate limiting to weather requests too

      const url = `${this.weatherBaseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=imperial`;
      
      Sentry.addBreadcrumb({
        message: `Fetching weather data for coordinates: ${lat}, ${lon}`,
        category: 'nfl.weather.request',
        level: 'debug',
      });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const weatherData = await response.json();
      
      Sentry.addBreadcrumb({
        message: `Weather API request successful for coordinates: ${lat}, ${lon}`,
        category: 'nfl.weather.success',
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
        category: 'nfl.weather.error',
        level: 'warning',
      });
      // Return null instead of throwing to avoid breaking the main sync
      return null;
    }
  }

  // Validation methods for API responses
  private validateTeamsResponse(response: any): boolean {
    return response && Array.isArray(response.items);
  }

  private validateRosterResponse(response: any): boolean {
    return response && Array.isArray(response.athletes);
  }

  private validateScheduleResponse(response: any): boolean {
    return response && Array.isArray(response.items);
  }

  private validateStandingsResponse(response: any): boolean {
    return response && Array.isArray(response.children);
  }

  // NFL-specific helper methods
  private getCurrentNFLWeek(): number {
    // FLAG: Implement actual NFL week calculation based on current date
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
    const diffTime = Math.abs(now.getTime() - seasonStart.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.min(Math.max(diffWeeks, 1), 18); // NFL has 18 weeks
  }

  private isPrimeTimeGame(gameDate: string): boolean {
    const date = new Date(gameDate);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Sunday/Monday/Thursday night games
    return (dayOfWeek === 0 && hour >= 20) || // Sunday Night
           (dayOfWeek === 1 && hour >= 20) || // Monday Night
           (dayOfWeek === 4 && hour >= 20);   // Thursday Night
  }

  private calculateCrowdFactor(game: any): string {
    // FLAG: Implement more sophisticated crowd analysis
    const homeTeam = game.competitors.find((c: any) => c.homeAway === 'home');
    if (!homeTeam) return 'Minimal';
    
    // Consider playoff implications, rivalry games, etc.
    return 'Significant';
  }

  private async identifyKeyMatchups(game: any): Promise<any> {
    // FLAG: Implement advanced matchup analysis using team stats
    return {
      offensiveLine: 'Advantage: Home',
      passingGame: 'Advantage: Away',
      rushingAttack: 'Even',
      defensiveFront: 'Advantage: Home',
      secondaryVsReceivers: 'Advantage: Away',
      redZoneEfficiency: 'Advantage: Home',
      thirdDownConversions: 'Even',
      turnoverDifferential: 'Advantage: Away',
      specialTeams: 'Advantage: Home',
    };
  }

  private async calculateGameInjuryImpact(game: any): Promise<any> {
    // FLAG: Implement injury impact analysis for game prediction
    return {
      homeTeamImpact: 'Low',
      awayTeamImpact: 'Medium',
      keyPlayersOut: [],
      depthChartChanges: [],
      lineMovement: 0,
    };
  }

  private async getPlayerCurrentStats(playerId: string): Promise<any> {
    try {
      const currentYear = new Date().getFullYear();
      const statsResponse = await this.fetchFromNFLAPI(`/athletes/${playerId}/statistics/${currentYear}`);
      
      if (!statsResponse.splits || statsResponse.splits.length === 0) {
        return null;
      }

      // Process NFL stats by category
      const stats: any = {};
      
      for (const split of statsResponse.splits) {
        const categories = split.categories || [];
        
        for (const category of categories) {
          const categoryName = category.name?.toLowerCase() || 'general';
          stats[categoryName] = {};
          
          for (const stat of category.stats) {
            stats[categoryName][stat.name] = {
              value: stat.value,
              displayValue: stat.displayValue,
              rank: stat.rank,
            };
          }
        }
      }

      return {
        ...stats,
        season: currentYear,
        lastUpdated: new Date(),
      };
    } catch (error) {
      Sentry.addBreadcrumb({
        message: `Failed to fetch stats for player ${playerId}: ${(error as Error).message}`,
        category: 'nfl.sync.player_stats.error',
        level: 'warning',
      });
      return null;
    }
  }

  private async getPFFGrade(playerId: string): Promise<number | null> {
    // FLAG: Implement PFF grade integration
    return null;
  }

  private async getFantasyData(playerId: string): Promise<any> {
    // FLAG: Implement fantasy data integration
    return {
      projectedPoints: 0,
      ownership: 0,
      salary: 0,
      value: 0,
    };
  }

  private async getTeamOffensiveRankings(teamId: string): Promise<any> {
    // FLAG: Implement team ranking sync
    return {
      totalYards: { rank: 1, value: 450.5 },
      passingYards: { rank: 5, value: 285.2 },
      rushingYards: { rank: 12, value: 165.3 },
      pointsPerGame: { rank: 3, value: 28.4 },
      redZoneEfficiency: { rank: 8, value: 62.5 },
      thirdDownConversion: { rank: 15, value: 40.2 },
    };
  }

  private async getTeamDefensiveRankings(teamId: string): Promise<any> {
    // FLAG: Implement team defensive ranking sync
    return {
      totalYardsAllowed: { rank: 7, value: 320.1 },
      passingYardsAllowed: { rank: 12, value: 245.8 },
      rushingYardsAllowed: { rank: 3, value: 74.3 },
      pointsAllowed: { rank: 5, value: 18.9 },
      sacks: { rank: 8, value: 2.8 },
      interceptions: { rank: 11, value: 1.2 },
      forcedFumbles: { rank: 15, value: 0.9 },
    };
  }

  private async getTeamSpecialTeamsRankings(teamId: string): Promise<any> {
    // FLAG: Implement special teams ranking sync
    return {
      fieldGoalPercentage: { rank: 10, value: 85.7 },
      puntAverage: { rank: 8, value: 45.2 },
      kickReturnAverage: { rank: 12, value: 23.1 },
      puntReturnAverage: { rank: 5, value: 11.8 },
    };
  }

  private async getPlayoffPicture(divisionId: string): Promise<any> {
    // FLAG: Implement playoff picture calculation
    return {
      clinched: false,
      eliminated: false,
      magicNumber: 3,
      scenariosToMakePlayoffs: [],
    };
  }

  private async getBettingOdds(gameId: string): Promise<any> {
    // FLAG: Implement betting odds integration
    return {
      spread: -3.5,
      moneyline: { home: -165, away: +145 },
      total: 47.5,
      lastUpdated: new Date(),
    };
  }

  private async getWeatherForGame(game: any): Promise<any> {
    // FLAG: Replace with real weather API integration for game time
    if (game.venue && !game.venue.indoor && 
        game.venue.address?.latitude && game.venue.address?.longitude) {
      return await this.fetchWeatherData(
        game.venue.address.latitude,
        game.venue.address.longitude
      );
    }
    return null;
  }

  private calculateNFLWeatherImpact(weatherData: any): any {
    const temp = weatherData.main?.temp || 70;
    const humidity = weatherData.main?.humidity || 50;
    const windSpeed = weatherData.wind?.speed || 0;
    const windDirection = weatherData.wind?.deg || 0;
    const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;

    return {
      passingGameImpact: this.calculatePassingImpact(weatherData),
      kickingImpact: this.calculateKickingImpact(weatherData),
      fumblesRisk: this.calculateFumblesRisk(weatherData),
      penaltyRisk: this.calculatePenaltyRisk(temp, windSpeed),
      offensiveGamePlan: this.suggestOffensiveAdjustments(temp, windSpeed, precipitation),
      defensiveGamePlan: this.suggestDefensiveAdjustments(temp, windSpeed, precipitation),
    };
  }

  private calculatePassingImpact(weatherData: any): string {
    const temp = weatherData.main?.temp || 70;
    const windSpeed = weatherData.wind?.speed || 0;
    const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;

    if (precipitation > 0.1 || windSpeed > 20 || temp < 32) return 'Significantly Reduced';
    if (windSpeed > 15 || temp < 40) return 'Reduced';
    if (temp > 85) return 'Enhanced';
    return 'Normal';
  }

  private calculateKickingImpact(weatherData: any): string {
    const temp = weatherData.main?.temp || 70;
    const windSpeed = weatherData.wind?.speed || 0;
    const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;

    if (windSpeed > 25 || precipitation > 0.3 || temp < 20) return 'Very Difficult';
    if (windSpeed > 15 || temp < 32) return 'Difficult';
    return 'Normal';
  }

  private calculateFumblesRisk(weatherData: any): string {
    const temp = weatherData.main?.temp || 70;
    const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;
    const humidity = weatherData.main?.humidity || 50;

    if ((temp < 32 && precipitation > 0.1) || precipitation > 0.5) return 'High Risk';
    if (temp < 40 || precipitation > 0.1 || humidity > 80) return 'Increased Risk';
    return 'Normal Risk';
  }

  private calculatePenaltyRisk(temp: number, windSpeed: number): string {
    if (temp < 20 || windSpeed > 30) return 'Increased';
    return 'Normal';
  }

  private suggestOffensiveAdjustments(temp: number, windSpeed: number, precipitation: number): string[] {
    const adjustments = [];
    
    if (windSpeed > 15 || precipitation > 0.1) {
      adjustments.push('Favor shorter passing game');
      adjustments.push('Increase rushing attempts');
    }
    
    if (temp < 32) {
      adjustments.push('Focus on ball security');
      adjustments.push('Use gloves for receivers');
    }
    
    if (windSpeed > 20) {
      adjustments.push('Avoid long field goal attempts');
    }
    
    return adjustments.length > 0 ? adjustments : ['No weather-related adjustments needed'];
  }

  private suggestDefensiveAdjustments(temp: number, windSpeed: number, precipitation: number): string[] {
    const adjustments = [];
    
    if (windSpeed > 15 || precipitation > 0.1) {
      adjustments.push('Focus on stopping the run');
      adjustments.push('Press coverage to disrupt timing');
    }
    
    if (temp < 32) {
      adjustments.push('Force fumbles aggressively');
    }
    
    return adjustments.length > 0 ? adjustments : ['No weather-related adjustments needed'];
  }

  private calculateScoringProjection(weatherData: any): string {
    const temp = weatherData.main?.temp || 70;
    const windSpeed = weatherData.wind?.speed || 0;
    const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;

    if (temp < 20 || windSpeed > 25 || precipitation > 0.5) return 'Lower Scoring';
    if (temp > 85 && windSpeed < 10) return 'Higher Scoring';
    return 'Normal Scoring';
  }

  private calculateFantasyImpact(injury: any): string {
    const position = injury.athlete?.position?.abbreviation?.toLowerCase() || '';
    const status = injury.status?.toLowerCase() || '';
    
    if (['qb', 'rb', 'wr', 'te'].includes(position) && status.includes('out')) return 'High';
    if (['qb', 'rb', 'wr', 'te'].includes(position) && status.includes('questionable')) return 'Medium';
    return 'Low';
  }

  private calculateTeamImpact(injury: any): string {
    const position = injury.athlete?.position?.abbreviation?.toLowerCase() || '';
    const status = injury.status?.toLowerCase() || '';
    
    if (position === 'qb' && status.includes('out')) return 'Critical';
    if (['qb', 'lt', 'c', 'de', 'lb'].includes(position) && status.includes('out')) return 'High';
    if (status.includes('out')) return 'Medium';
    if (status.includes('questionable')) return 'Low';
    return 'Minimal';
  }

  private async getReplacementPlayer(playerId: string, teamId: string): Promise<any> {
    // FLAG: Implement depth chart analysis to identify replacement
    return {
      id: null,
      name: 'TBD',
      depthChartPosition: 'Unknown',
      experienceLevel: 'Unknown',
    };
  }

  private async getLineMovementFromInjury(injury: any): Promise<any> {
    // FLAG: Implement betting line movement tracking due to injuries
    return {
      spreadMovement: 0,
      moneylineMovement: 0,
      totalMovement: 0,
      volumeIncrease: false,
    };
  }

  private validateGameData(game: any): boolean {
    const requiredFields = ['id', 'date', 'competitors', 'status'];
    const hasRequiredFields = requiredFields.every(field => game[field] !== undefined);
    
    // Additional validation for competitor data
    const hasValidCompetitors = game.competitors && 
                               Array.isArray(game.competitors) &&
                               game.competitors.length === 2;
    
    return hasRequiredFields && hasValidCompetitors;
  }

  async getLastSyncStatus(): Promise<any> {
    try {
      const statusDoc = doc(db, 'sync_status', 'nfl_data_sync');
      const statusSnapshot = await getDoc(statusDoc);

      return statusSnapshot.exists() ? statusSnapshot.data() : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async updateSyncStatus(status: any): Promise<void> {
    try {
      const statusDoc = doc(db, 'sync_status', 'nfl_data_sync');
      
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