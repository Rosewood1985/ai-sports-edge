// =============================================================================
// FORMULA 1 DATA SYNC SERVICE
// Deep Focus Architecture with Real Data Integration Points
// Following MLB Pattern Exactly for Consistency - Using Ergast F1 API
// =============================================================================

import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore as db } from '../../config/firebase';
import * as Sentry from '@sentry/react-native';
import { getWeatherApiKey } from '../../utils/apiKeys';

export class F1DataSyncService {
  private readonly baseUrl = 'http://ergast.com/api/f1';
  private readonly weatherApiKey: string;
  private readonly weatherBaseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly rateLimitDelay = 2000; // Ergast API has 4 requests per second limit
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
        category: 'f1.init.weather',
        level: 'warning',
      });
    }
  }

  async syncAllF1Data(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting F1 data sync',
        category: 'f1.sync',
        level: 'info',
      });

      await Promise.all([
        this.syncSeasons(),
        this.syncDrivers(),
        this.syncConstructors(),
        this.syncCircuits(),
        this.syncRaces(),
        this.syncResults(),
        this.syncStandings(),
        this.syncWeatherData(),
      ]);

      Sentry.captureMessage('F1 data sync completed successfully', 'info');
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  private async syncSeasons(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting seasons sync from Ergast F1 API',
        category: 'f1.sync.seasons',
        level: 'info',
      });

      // Get last 3 seasons for historical data
      const currentYear = new Date().getFullYear();
      const seasons = [currentYear - 2, currentYear - 1, currentYear];
      
      const seasonsCollection = collection(db, 'f1_seasons');

      for (const year of seasons) {
        const seasonResponse = await this.fetchFromF1API(`/${year}.json`);
        
        if (!this.validateSeasonResponse(seasonResponse)) {
          Sentry.addBreadcrumb({
            message: `Invalid season response for ${year}`,
            category: 'f1.sync.seasons.error',
            level: 'warning',
          });
          continue;
        }

        const seasonData = {
          year: year,
          url: seasonResponse.MRData?.url,
          totalRounds: seasonResponse.MRData?.total,
          // Get race schedule for this season
          raceSchedule: await this.getRaceSchedule(year),
          // Season statistics
          seasonStats: await this.getSeasonStats(year),
          // Championship standings
          driverStandings: await this.getDriverStandings(year),
          constructorStandings: await this.getConstructorStandings(year),
          // Sync metadata
          lastUpdated: new Date(),
          dataSource: 'ergast_f1_api',
          syncStatus: 'completed',
        };

        await setDoc(doc(seasonsCollection, year.toString()), seasonData, { merge: true });
        
        Sentry.addBreadcrumb({
          message: `Synced season: ${year}`,
          category: 'f1.sync.seasons.detail',
          level: 'debug',
        });
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${seasons.length} seasons`,
        category: 'f1.sync.seasons',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Season sync failed: ${(error as Error).message}`);
    }
  }

  private async syncDrivers(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting drivers sync from Ergast F1 API',
        category: 'f1.sync.drivers',
        level: 'info',
      });

      const currentYear = new Date().getFullYear();
      const driversResponse = await this.fetchFromF1API(`/${currentYear}/drivers.json`);
      
      if (!this.validateDriversResponse(driversResponse)) {
        throw new Error('Invalid drivers API response structure');
      }

      const drivers = driversResponse.MRData?.DriverTable?.Drivers || [];
      const driversCollection = collection(db, 'f1_drivers');

      for (const driver of drivers) {
        const driverData = {
          driverId: driver.driverId,
          permanentNumber: driver.permanentNumber,
          code: driver.code,
          givenName: driver.givenName,
          familyName: driver.familyName,
          dateOfBirth: driver.dateOfBirth,
          nationality: driver.nationality,
          url: driver.url,
          // Driver performance data
          currentTeam: await this.getCurrentTeam(driver.driverId, currentYear),
          careerStats: await this.getDriverCareerStats(driver.driverId),
          currentSeasonStats: await this.getDriverSeasonStats(driver.driverId, currentYear),
          // Historical performance
          raceResults: await this.getDriverRaceResults(driver.driverId, currentYear),
          qualifyingResults: await this.getDriverQualifyingResults(driver.driverId, currentYear),
          // Physical attributes and style
          drivingStyle: await this.analyzeDriverStyle(driver.driverId),
          // Championship history
          championshipHistory: await this.getDriverChampionshipHistory(driver.driverId),
          // Current form analysis
          formAnalysis: await this.analyzeDriverForm(driver.driverId),
          // Sync metadata
          lastUpdated: new Date(),
          dataSource: 'ergast_f1_api',
          syncStatus: 'completed',
        };

        await setDoc(doc(driversCollection, driver.driverId), driverData, { merge: true });
        
        Sentry.addBreadcrumb({
          message: `Synced driver: ${driver.givenName} ${driver.familyName}`,
          category: 'f1.sync.drivers.detail',
          level: 'debug',
        });
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${drivers.length} drivers`,
        category: 'f1.sync.drivers',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Driver sync failed: ${(error as Error).message}`);
    }
  }

  private async syncConstructors(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting constructors sync from Ergast F1 API',
        category: 'f1.sync.constructors',
        level: 'info',
      });

      const currentYear = new Date().getFullYear();
      const constructorsResponse = await this.fetchFromF1API(`/${currentYear}/constructors.json`);
      
      if (!this.validateConstructorsResponse(constructorsResponse)) {
        throw new Error('Invalid constructors API response structure');
      }

      const constructors = constructorsResponse.MRData?.ConstructorTable?.Constructors || [];
      const constructorsCollection = collection(db, 'f1_constructors');

      for (const constructor of constructors) {
        const constructorData = {
          constructorId: constructor.constructorId,
          name: constructor.name,
          nationality: constructor.nationality,
          url: constructor.url,
          // Team performance data
          currentDrivers: await this.getConstructorDrivers(constructor.constructorId, currentYear),
          teamStats: await this.getConstructorSeasonStats(constructor.constructorId, currentYear),
          careerStats: await this.getConstructorCareerStats(constructor.constructorId),
          // Technical data
          carSpecifications: await this.getCarSpecifications(constructor.constructorId, currentYear),
          engineSupplier: await this.getEngineSupplier(constructor.constructorId, currentYear),
          // Championship history
          championshipHistory: await this.getConstructorChampionshipHistory(constructor.constructorId),
          // Current form and performance
          formAnalysis: await this.analyzeConstructorForm(constructor.constructorId),
          developmentTrend: await this.analyzeConstructorDevelopment(constructor.constructorId),
          // Reliability statistics
          reliabilityStats: await this.getConstructorReliabilityStats(constructor.constructorId, currentYear),
          // Sync metadata
          lastUpdated: new Date(),
          dataSource: 'ergast_f1_api',
          syncStatus: 'completed',
        };

        await setDoc(doc(constructorsCollection, constructor.constructorId), constructorData, { merge: true });
        
        Sentry.addBreadcrumb({
          message: `Synced constructor: ${constructor.name}`,
          category: 'f1.sync.constructors.detail',
          level: 'debug',
        });
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${constructors.length} constructors`,
        category: 'f1.sync.constructors',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Constructor sync failed: ${(error as Error).message}`);
    }
  }

  private async syncCircuits(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting circuits sync from Ergast F1 API',
        category: 'f1.sync.circuits',
        level: 'info',
      });

      const currentYear = new Date().getFullYear();
      const circuitsResponse = await this.fetchFromF1API(`/${currentYear}/circuits.json`);
      
      if (!this.validateCircuitsResponse(circuitsResponse)) {
        throw new Error('Invalid circuits API response structure');
      }

      const circuits = circuitsResponse.MRData?.CircuitTable?.Circuits || [];
      const circuitsCollection = collection(db, 'f1_circuits');

      for (const circuit of circuits) {
        const circuitData = {
          circuitId: circuit.circuitId,
          circuitName: circuit.circuitName,
          location: {
            lat: parseFloat(circuit.Location.lat),
            long: parseFloat(circuit.Location.long),
            locality: circuit.Location.locality,
            country: circuit.Location.country,
          },
          url: circuit.url,
          // Circuit characteristics
          trackLength: await this.getTrackLength(circuit.circuitId),
          lapRecord: await this.getLapRecord(circuit.circuitId),
          trackType: await this.getTrackType(circuit.circuitId),
          // Weather patterns
          weatherHistory: await this.getCircuitWeatherHistory(circuit.circuitId),
          // Performance data
          overtakingDifficulty: await this.getOvertakingDifficulty(circuit.circuitId),
          tireStrategy: await this.getTypicalTireStrategy(circuit.circuitId),
          fuelConsumption: await this.getFuelConsumptionData(circuit.circuitId),
          // Safety information
          safetyRating: await this.getSafetyRating(circuit.circuitId),
          drsZones: await this.getDRSZones(circuit.circuitId),
          // Historical data
          raceHistory: await this.getCircuitRaceHistory(circuit.circuitId),
          // Sync metadata
          lastUpdated: new Date(),
          dataSource: 'ergast_f1_api',
          syncStatus: 'completed',
        };

        await setDoc(doc(circuitsCollection, circuit.circuitId), circuitData, { merge: true });
        
        Sentry.addBreadcrumb({
          message: `Synced circuit: ${circuit.circuitName}`,
          category: 'f1.sync.circuits.detail',
          level: 'debug',
        });
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${circuits.length} circuits`,
        category: 'f1.sync.circuits',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Circuit sync failed: ${(error as Error).message}`);
    }
  }

  private async syncRaces(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting races sync from Ergast F1 API',
        category: 'f1.sync.races',
        level: 'info',
      });

      const currentYear = new Date().getFullYear();
      const racesResponse = await this.fetchFromF1API(`/${currentYear}.json`);
      
      if (!this.validateRacesResponse(racesResponse)) {
        throw new Error('Invalid races API response structure');
      }

      const races = racesResponse.MRData?.RaceTable?.Races || [];
      const racesCollection = collection(db, 'f1_races');

      for (const race of races) {
        const raceData = {
          season: race.season,
          round: race.round,
          raceName: race.raceName,
          circuit: {
            circuitId: race.Circuit.circuitId,
            circuitName: race.Circuit.circuitName,
            location: race.Circuit.Location,
          },
          date: race.date,
          time: race.time,
          url: race.url,
          // Session information
          sessions: {
            firstPractice: race.FirstPractice,
            secondPractice: race.SecondPractice,
            thirdPractice: race.ThirdPractice,
            qualifying: race.Qualifying,
            sprint: race.Sprint,
          },
          // Race results
          raceResults: await this.getRaceResults(race.season, race.round),
          qualifyingResults: await this.getQualifyingResults(race.season, race.round),
          sprintResults: await this.getSprintResults(race.season, race.round),
          // Weather conditions
          weatherConditions: await this.getRaceWeatherConditions(race),
          // Betting and predictions
          preRaceOdds: await this.getPreRaceOdds(race.season, race.round),
          // Race analytics
          raceAnalytics: {
            totalLaps: await this.getTotalLaps(race.Circuit.circuitId),
            expectedLapTime: await this.getExpectedLapTime(race.Circuit.circuitId),
            strategicVariables: await this.getStrategicVariables(race.Circuit.circuitId),
            overtakingOpportunities: await this.getOvertakingOpportunities(race.Circuit.circuitId),
          },
          // Championship impact
          championshipImpact: await this.calculateChampionshipImpact(race.season, race.round),
          // Analysis flags
          mlPredictionsGenerated: false,
          dataIntegrity: this.validateRaceData(race),
          // Sync metadata
          lastUpdated: new Date(),
          dataSource: 'ergast_f1_api',
          syncStatus: 'completed',
        };

        await setDoc(doc(racesCollection, `${race.season}_${race.round}`), raceData, { merge: true });
        
        Sentry.addBreadcrumb({
          message: `Synced race: ${race.raceName} ${race.season}`,
          category: 'f1.sync.races.detail',
          level: 'debug',
        });
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced ${races.length} races`,
        category: 'f1.sync.races',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Race sync failed: ${(error as Error).message}`);
    }
  }

  private async syncResults(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting results sync from Ergast F1 API',
        category: 'f1.sync.results',
        level: 'info',
      });

      const currentYear = new Date().getFullYear();
      const years = [currentYear - 2, currentYear - 1, currentYear];
      
      const resultsCollection = collection(db, 'f1_results');

      for (const year of years) {
        // Get all race results for the year
        const resultsResponse = await this.fetchFromF1API(`/${year}/results.json?limit=1000`);
        
        if (!this.validateResultsResponse(resultsResponse)) {
          continue;
        }

        const races = resultsResponse.MRData?.RaceTable?.Races || [];
        
        for (const race of races) {
          const results = race.Results || [];
          
          for (const result of results) {
            const resultData = {
              id: `${race.season}_${race.round}_${result.Driver.driverId}`,
              season: race.season,
              round: race.round,
              raceName: race.raceName,
              circuitId: race.Circuit.circuitId,
              // Driver information
              driver: {
                driverId: result.Driver.driverId,
                permanentNumber: result.Driver.permanentNumber,
                code: result.Driver.code,
                givenName: result.Driver.givenName,
                familyName: result.Driver.familyName,
              },
              constructor: {
                constructorId: result.Constructor.constructorId,
                name: result.Constructor.name,
              },
              // Race result data
              number: result.number,
              position: result.position,
              positionText: result.positionText,
              points: parseFloat(result.points),
              grid: result.grid,
              laps: parseInt(result.laps),
              status: result.status,
              // Timing data
              time: result.Time,
              fastestLap: result.FastestLap,
              // Performance metrics
              performanceMetrics: await this.calculatePerformanceMetrics(result),
              // Sync metadata
              lastUpdated: new Date(),
              dataSource: 'ergast_f1_api',
            };

            await setDoc(doc(resultsCollection, resultData.id), resultData, { merge: true });
          }
        }
      }

      Sentry.addBreadcrumb({
        message: 'Successfully synced F1 race results',
        category: 'f1.sync.results',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Results sync failed: ${(error as Error).message}`);
    }
  }

  private async syncStandings(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting standings sync from Ergast F1 API',
        category: 'f1.sync.standings',
        level: 'info',
      });

      const currentYear = new Date().getFullYear();
      
      // Get driver standings
      const driverStandingsResponse = await this.fetchFromF1API(`/${currentYear}/driverStandings.json`);
      // Get constructor standings
      const constructorStandingsResponse = await this.fetchFromF1API(`/${currentYear}/constructorStandings.json`);
      
      const standingsCollection = collection(db, 'f1_standings');

      // Process driver standings
      if (this.validateStandingsResponse(driverStandingsResponse)) {
        const standingsTable = driverStandingsResponse.MRData?.StandingsTable?.StandingsLists?.[0];
        if (standingsTable) {
          const driverStandingsData = {
            type: 'driver',
            season: standingsTable.season,
            round: standingsTable.round,
            standings: standingsTable.DriverStandings,
            lastUpdated: new Date(),
            dataSource: 'ergast_f1_api',
          };

          await setDoc(
            doc(standingsCollection, `driver_${standingsTable.season}`),
            driverStandingsData,
            { merge: true }
          );
        }
      }

      // Process constructor standings
      if (this.validateStandingsResponse(constructorStandingsResponse)) {
        const standingsTable = constructorStandingsResponse.MRData?.StandingsTable?.StandingsLists?.[0];
        if (standingsTable) {
          const constructorStandingsData = {
            type: 'constructor',
            season: standingsTable.season,
            round: standingsTable.round,
            standings: standingsTable.ConstructorStandings,
            lastUpdated: new Date(),
            dataSource: 'ergast_f1_api',
          };

          await setDoc(
            doc(standingsCollection, `constructor_${standingsTable.season}`),
            constructorStandingsData,
            { merge: true }
          );
        }
      }

      Sentry.addBreadcrumb({
        message: 'Successfully synced F1 standings',
        category: 'f1.sync.standings',
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
        message: 'Starting weather data sync for F1 circuits',
        category: 'f1.sync.weather',
        level: 'info',
      });

      const currentYear = new Date().getFullYear();
      const racesResponse = await this.fetchFromF1API(`/${currentYear}.json`);
      
      if (!this.validateRacesResponse(racesResponse)) {
        throw new Error('Invalid races response for weather sync');
      }

      const weatherCollection = collection(db, 'f1_weather');
      let weatherDataSynced = 0;

      const races = racesResponse.MRData?.RaceTable?.Races || [];
      
      for (const race of races) {
        if (race.Circuit?.Location?.lat && race.Circuit?.Location?.long) {
          try {
            const weatherData = await this.fetchWeatherData(
              parseFloat(race.Circuit.Location.lat),
              parseFloat(race.Circuit.Location.long)
            );

            if (weatherData) {
              const raceWeatherData = {
                raceId: `${race.season}_${race.round}`,
                circuitId: race.Circuit.circuitId,
                circuitName: race.Circuit.circuitName,
                raceDate: race.date,
                // Basic weather data
                temperature: weatherData.main?.temp,
                humidity: weatherData.main?.humidity,
                windSpeed: weatherData.wind?.speed,
                windDirection: weatherData.wind?.deg,
                conditions: weatherData.weather?.[0]?.description,
                precipitation: weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0,
                visibility: weatherData.visibility,
                pressure: weatherData.main?.pressure,
                // F1-specific weather impact analysis
                impactFactors: this.calculateF1WeatherImpact(weatherData),
                // Tire strategy impact
                tireStrategyImpact: this.calculateTireStrategyImpact(weatherData),
                // Aerodynamic impact
                aerodynamicImpact: this.calculateAerodynamicImpact(weatherData),
                lastUpdated: new Date(),
                dataSource: 'openweather_api',
              };

              await setDoc(doc(weatherCollection, raceWeatherData.raceId), raceWeatherData, { merge: true });
              weatherDataSynced++;
            }
          } catch (weatherError) {
            Sentry.addBreadcrumb({
              message: `Failed to fetch weather for race ${race.raceName}: ${(weatherError as Error).message}`,
              category: 'f1.sync.weather.error',
              level: 'warning',
            });
            // Continue with other races
          }
        }
      }

      Sentry.addBreadcrumb({
        message: `Successfully synced weather data for ${weatherDataSynced} races`,
        category: 'f1.sync.weather',
        level: 'info',
      });
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Weather sync failed: ${(error as Error).message}`);
    }
  }

  // API and utility methods following MLB pattern
  private async fetchFromF1API(endpoint: string, retryCount = 0): Promise<any> {
    try {
      // Rate limiting - ensure we don't exceed 4 requests per second
      await this.enforceRateLimit();

      const url = `${this.baseUrl}${endpoint}`;
      
      Sentry.addBreadcrumb({
        message: `Making F1 API request: ${url}`,
        category: 'f1.api.request',
        level: 'debug',
        data: { endpoint, retryCount }
      });

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AI-Sports-Edge/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = `F1 API error: ${response.status} ${response.statusText}`;
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          
          await this.sleep(delay);
          
          if (retryCount < this.maxRetries) {
            return this.fetchFromF1API(endpoint, retryCount + 1);
          }
        }
        
        // Handle server errors with retry
        if (response.status >= 500 && retryCount < this.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          await this.sleep(delay);
          return this.fetchFromF1API(endpoint, retryCount + 1);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      this.requestCount++;
      return data;
      
    } catch (error) {
      Sentry.captureException(error);
      
      // Retry on network errors
      if (retryCount < this.maxRetries && (error as any).name === 'TypeError') {
        const delay = Math.pow(2, retryCount) * 1000;
        await this.sleep(delay);
        return this.fetchFromF1API(endpoint, retryCount + 1);
      }
      
      throw new Error(`F1 API request failed: ${(error as Error).message}`);
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
        return null;
      }

      await this.enforceRateLimit();

      const url = `${this.weatherBaseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=metric`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  // Validation methods
  private validateSeasonResponse(response: any): boolean {
    return response && response.MRData;
  }

  private validateDriversResponse(response: any): boolean {
    return response && response.MRData?.DriverTable?.Drivers;
  }

  private validateConstructorsResponse(response: any): boolean {
    return response && response.MRData?.ConstructorTable?.Constructors;
  }

  private validateCircuitsResponse(response: any): boolean {
    return response && response.MRData?.CircuitTable?.Circuits;
  }

  private validateRacesResponse(response: any): boolean {
    return response && response.MRData?.RaceTable?.Races;
  }

  private validateResultsResponse(response: any): boolean {
    return response && response.MRData?.RaceTable?.Races;
  }

  private validateStandingsResponse(response: any): boolean {
    return response && response.MRData?.StandingsTable;
  }

  private validateRaceData(race: any): boolean {
    const requiredFields = ['season', 'round', 'raceName', 'Circuit', 'date'];
    return requiredFields.every(field => race[field] !== undefined);
  }

  // F1-specific helper methods
  private calculateF1WeatherImpact(weatherData: any): any {
    const temp = weatherData.main?.temp || 20;
    const humidity = weatherData.main?.humidity || 50;
    const windSpeed = weatherData.wind?.speed || 0;
    const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;

    return {
      gripLevels: this.calculateGripImpact(temp, humidity, precipitation),
      aerodynamicEffect: this.calculateAeroEffect(temp, windSpeed),
      tirePerformance: this.calculateTirePerformanceImpact(temp, precipitation),
      engineCooling: this.calculateEngineCoolingImpact(temp, humidity),
      visibilityImpact: this.calculateVisibilityImpact(precipitation),
    };
  }

  private calculateTireStrategyImpact(weatherData: any): string {
    const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;
    const temp = weatherData.main?.temp || 20;
    
    if (precipitation > 0.5) return 'Wet/Intermediate tires required';
    if (temp > 30) return 'Hard compounds favored';
    if (temp < 15) return 'Soft compounds favored';
    return 'Normal strategy applies';
  }

  private calculateAerodynamicImpact(weatherData: any): string {
    const windSpeed = weatherData.wind?.speed || 0;
    const temp = weatherData.main?.temp || 20;
    
    if (windSpeed > 15) return 'Significant aerodynamic disruption';
    if (temp > 35) return 'Reduced downforce efficiency';
    return 'Minimal aerodynamic impact';
  }

  private calculateGripImpact(temp: number, humidity: number, precipitation: number): string {
    if (precipitation > 0.1) return 'Very Low - Wet conditions';
    if (temp < 10 || temp > 40) return 'Low - Temperature extreme';
    if (humidity > 80) return 'Reduced - High humidity';
    return 'Optimal';
  }

  private calculateAeroEffect(temp: number, windSpeed: number): string {
    if (windSpeed > 20) return 'High Impact - Strong winds';
    if (temp > 35) return 'Reduced efficiency - High temperature';
    return 'Normal';
  }

  private calculateTirePerformanceImpact(temp: number, precipitation: number): string {
    if (precipitation > 0.1) return 'Wet tire compounds required';
    if (temp > 30) return 'Hard compounds optimal';
    if (temp < 15) return 'Soft compounds optimal';
    return 'Medium compounds optimal';
  }

  private calculateEngineCoolingImpact(temp: number, humidity: number): string {
    if (temp > 35 && humidity > 70) return 'Critical - Overheating risk';
    if (temp > 30) return 'Challenging - Extra cooling needed';
    return 'Normal cooling requirements';
  }

  private calculateVisibilityImpact(precipitation: number): string {
    if (precipitation > 2) return 'Severely reduced - Heavy rain';
    if (precipitation > 0.5) return 'Reduced - Light rain';
    return 'Clear visibility';
  }

  // Helper methods for data retrieval (these would be implemented with actual data)
  private async getRaceSchedule(year: number): Promise<any> {
    // FLAG: Implement race schedule retrieval
    return [];
  }

  private async getSeasonStats(year: number): Promise<any> {
    // FLAG: Implement season statistics
    return {};
  }

  private async getDriverStandings(year: number): Promise<any> {
    // FLAG: Implement driver standings retrieval
    return [];
  }

  private async getConstructorStandings(year: number): Promise<any> {
    // FLAG: Implement constructor standings retrieval
    return [];
  }

  private async getCurrentTeam(driverId: string, year: number): Promise<any> {
    // FLAG: Implement current team retrieval
    return null;
  }

  private async getDriverCareerStats(driverId: string): Promise<any> {
    // FLAG: Implement driver career statistics
    return {};
  }

  private async getDriverSeasonStats(driverId: string, year: number): Promise<any> {
    // FLAG: Implement driver season statistics
    return {};
  }

  private async getDriverRaceResults(driverId: string, year: number): Promise<any> {
    // FLAG: Implement driver race results
    return [];
  }

  private async getDriverQualifyingResults(driverId: string, year: number): Promise<any> {
    // FLAG: Implement driver qualifying results
    return [];
  }

  private async analyzeDriverStyle(driverId: string): Promise<any> {
    // FLAG: Implement driver style analysis
    return {};
  }

  private async getDriverChampionshipHistory(driverId: string): Promise<any> {
    // FLAG: Implement championship history
    return [];
  }

  private async analyzeDriverForm(driverId: string): Promise<any> {
    // FLAG: Implement driver form analysis
    return {};
  }

  private async getConstructorDrivers(constructorId: string, year: number): Promise<any> {
    // FLAG: Implement constructor drivers retrieval
    return [];
  }

  private async getConstructorSeasonStats(constructorId: string, year: number): Promise<any> {
    // FLAG: Implement constructor season stats
    return {};
  }

  private async getConstructorCareerStats(constructorId: string): Promise<any> {
    // FLAG: Implement constructor career stats
    return {};
  }

  private async getCarSpecifications(constructorId: string, year: number): Promise<any> {
    // FLAG: Implement car specifications
    return {};
  }

  private async getEngineSupplier(constructorId: string, year: number): Promise<any> {
    // FLAG: Implement engine supplier info
    return null;
  }

  private async getConstructorChampionshipHistory(constructorId: string): Promise<any> {
    // FLAG: Implement constructor championship history
    return [];
  }

  private async analyzeConstructorForm(constructorId: string): Promise<any> {
    // FLAG: Implement constructor form analysis
    return {};
  }

  private async analyzeConstructorDevelopment(constructorId: string): Promise<any> {
    // FLAG: Implement constructor development analysis
    return {};
  }

  private async getConstructorReliabilityStats(constructorId: string, year: number): Promise<any> {
    // FLAG: Implement reliability statistics
    return {};
  }

  private async getTrackLength(circuitId: string): Promise<number> {
    // FLAG: Implement track length retrieval
    return 0;
  }

  private async getLapRecord(circuitId: string): Promise<any> {
    // FLAG: Implement lap record retrieval
    return null;
  }

  private async getTrackType(circuitId: string): Promise<string> {
    // FLAG: Implement track type classification
    return 'Unknown';
  }

  private async getCircuitWeatherHistory(circuitId: string): Promise<any> {
    // FLAG: Implement weather history
    return [];
  }

  private async getOvertakingDifficulty(circuitId: string): Promise<string> {
    // FLAG: Implement overtaking difficulty assessment
    return 'Medium';
  }

  private async getTypicalTireStrategy(circuitId: string): Promise<any> {
    // FLAG: Implement tire strategy analysis
    return {};
  }

  private async getFuelConsumptionData(circuitId: string): Promise<any> {
    // FLAG: Implement fuel consumption data
    return {};
  }

  private async getSafetyRating(circuitId: string): Promise<string> {
    // FLAG: Implement safety rating
    return 'Good';
  }

  private async getDRSZones(circuitId: string): Promise<any> {
    // FLAG: Implement DRS zones data
    return [];
  }

  private async getCircuitRaceHistory(circuitId: string): Promise<any> {
    // FLAG: Implement circuit race history
    return [];
  }

  private async getRaceResults(season: string, round: string): Promise<any> {
    // FLAG: Implement race results retrieval
    return [];
  }

  private async getQualifyingResults(season: string, round: string): Promise<any> {
    // FLAG: Implement qualifying results retrieval
    return [];
  }

  private async getSprintResults(season: string, round: string): Promise<any> {
    // FLAG: Implement sprint results retrieval
    return [];
  }

  private async getRaceWeatherConditions(race: any): Promise<any> {
    // FLAG: Implement race weather conditions
    return null;
  }

  private async getPreRaceOdds(season: string, round: string): Promise<any> {
    // FLAG: Implement pre-race odds
    return {};
  }

  private async getTotalLaps(circuitId: string): Promise<number> {
    // FLAG: Implement total laps calculation
    return 50;
  }

  private async getExpectedLapTime(circuitId: string): Promise<string> {
    // FLAG: Implement expected lap time
    return '1:30.000';
  }

  private async getStrategicVariables(circuitId: string): Promise<any> {
    // FLAG: Implement strategic variables
    return {};
  }

  private async getOvertakingOpportunities(circuitId: string): Promise<number> {
    // FLAG: Implement overtaking opportunities count
    return 3;
  }

  private async calculateChampionshipImpact(season: string, round: string): Promise<any> {
    // FLAG: Implement championship impact calculation
    return {};
  }

  private async calculatePerformanceMetrics(result: any): Promise<any> {
    // FLAG: Implement performance metrics calculation
    return {};
  }

  async getLastSyncStatus(): Promise<any> {
    try {
      const statusDoc = doc(db, 'sync_status', 'f1_data_sync');
      const statusSnapshot = await getDoc(statusDoc);
      return statusSnapshot.exists() ? statusSnapshot.data() : null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async updateSyncStatus(status: any): Promise<void> {
    try {
      const statusDoc = doc(db, 'sync_status', 'f1_data_sync');
      
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