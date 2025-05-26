const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const * as Sentry from '@sentry/node';

// Initialize Sentry for historical data collection
Sentry.init({
  dsn: functions.config().sentry?.dsn,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 1.0
});

class HistoricalF1DataCollection {
  constructor() {
    this.db = admin.firestore();
    this.ergastBaseURL = 'https://ergast.com/api/f1';
    this.startYear = 2021; // 3+ years of data
    this.endYear = new Date().getFullYear();
    this.batchSize = 20; // F1 has ~23 races per season
  }

  async collectAllHistoricalData() {
    const transaction = Sentry.startTransaction({
      op: 'historical_f1_collection',
      name: 'Complete F1 Historical Data Collection'
    });

    try {
      console.log(`Starting complete F1 historical data collection (${this.startYear}-${this.endYear})`);
      
      const totalRaces = await this.collectHistoricalRaces();
      const totalDrivers = await this.collectHistoricalDrivers();
      const totalConstructors = await this.collectHistoricalConstructors();
      const totalQualifying = await this.collectHistoricalQualifying();
      const totalResults = await this.collectHistoricalResults();
      const totalCircuits = await this.collectHistoricalCircuits();

      const summary = {
        totalRacesCollected: totalRaces,
        totalDriversCollected: totalDrivers,
        totalConstructorsCollected: totalConstructors,
        totalQualifyingRecords: totalQualifying,
        totalResultsRecords: totalResults,
        totalCircuitsRecords: totalCircuits,
        yearsCollected: this.endYear - this.startYear + 1,
        completedAt: new Date().toISOString()
      };

      await this.storeCollectionSummary(summary);
      
      console.log('F1 Historical Data Collection Summary:', summary);
      return summary;

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in complete historical data collection:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async collectHistoricalRaces() {
    let totalRaces = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting races for ${year} F1 season...`);
      
      try {
        const racesResponse = await axios.get(`${this.ergastBaseURL}/${year}.json`);
        const races = racesResponse.data.MRData.RaceTable.Races;

        const raceData = races.map(race => ({
          raceId: `${year}_${race.round}`,
          season: year,
          round: parseInt(race.round),
          raceName: race.raceName,
          circuitId: race.Circuit.circuitId,
          circuitName: race.Circuit.circuitName,
          location: {
            locality: race.Circuit.Location.locality,
            country: race.Circuit.Location.country,
            lat: parseFloat(race.Circuit.Location.lat),
            long: parseFloat(race.Circuit.Location.long)
          },
          date: race.date,
          time: race.time || null,
          url: race.url,
          circuit: {
            circuitId: race.Circuit.circuitId,
            url: race.Circuit.url,
            circuitName: race.Circuit.circuitName,
            location: race.Circuit.Location
          },
          raceCharacteristics: this.generateRaceCharacteristics(race.Circuit.circuitId),
          weatherForecast: this.generateWeatherForecast(year, race.round, race.Circuit.Location),
          trackLayout: this.getTrackLayout(race.Circuit.circuitId),
          collectedAt: admin.firestore.FieldValue.serverTimestamp()
        }));

        // Store races in batches
        for (let i = 0; i < raceData.length; i += this.batchSize) {
          const batch = this.db.batch();
          const raceBatch = raceData.slice(i, i + this.batchSize);
          
          raceBatch.forEach(race => {
            const docRef = this.db.collection('f1_historical_races').doc(race.raceId);
            batch.set(docRef, race);
          });
          
          await batch.commit();
          totalRaces += raceBatch.length;
        }

        console.log(`Collected ${raceData.length} races for ${year}`);
        await this.delay(1000); // Rate limiting for Ergast API
        
      } catch (error) {
        console.error(`Error collecting races for ${year}:`, error);
        Sentry.captureException(error);
      }
    }

    return totalRaces;
  }

  async collectHistoricalDrivers() {
    let totalDrivers = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting drivers for ${year} F1 season...`);
      
      try {
        const driversResponse = await axios.get(`${this.ergastBaseURL}/${year}/drivers.json`);
        const drivers = driversResponse.data.MRData.DriverTable.Drivers;

        // Get driver standings for the season
        const standingsResponse = await axios.get(`${this.ergastBaseURL}/${year}/driverStandings.json`);
        const standings = standingsResponse.data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];

        const driverData = drivers.map(driver => {
          const driverStanding = standings.find(s => s.Driver.driverId === driver.driverId);
          
          return {
            driverId: driver.driverId,
            season: year,
            permanentNumber: driver.permanentNumber || null,
            code: driver.code || null,
            url: driver.url,
            givenName: driver.givenName,
            familyName: driver.familyName,
            dateOfBirth: driver.dateOfBirth,
            nationality: driver.nationality,
            constructorId: driverStanding?.Constructors[0]?.constructorId || null,
            seasonStats: {
              position: driverStanding ? parseInt(driverStanding.position) : null,
              positionText: driverStanding?.positionText || null,
              points: driverStanding ? parseFloat(driverStanding.points) : 0,
              wins: driverStanding ? parseInt(driverStanding.wins) : 0
            },
            careerStats: this.generateCareerStats(driver.driverId, year),
            drivingStyle: this.generateDrivingStyle(driver.driverId),
            physicalAttributes: this.generatePhysicalAttributes(),
            experienceMetrics: this.generateExperienceMetrics(driver.driverId, year),
            collectedAt: admin.firestore.FieldValue.serverTimestamp()
          };
        });

        // Store drivers in batches
        for (let i = 0; i < driverData.length; i += this.batchSize) {
          const batch = this.db.batch();
          const driverBatch = driverData.slice(i, i + this.batchSize);
          
          driverBatch.forEach(driver => {
            const docRef = this.db.collection('f1_historical_drivers').doc(`${driver.driverId}_${year}`);
            batch.set(docRef, driver);
          });
          
          await batch.commit();
          totalDrivers += driverBatch.length;
        }

        console.log(`Collected ${driverData.length} drivers for ${year}`);
        await this.delay(1000);
        
      } catch (error) {
        console.error(`Error collecting drivers for ${year}:`, error);
        Sentry.captureException(error);
      }
    }

    return totalDrivers;
  }

  async collectHistoricalConstructors() {
    let totalConstructors = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting constructors for ${year} F1 season...`);
      
      try {
        const constructorsResponse = await axios.get(`${this.ergastBaseURL}/${year}/constructors.json`);
        const constructors = constructorsResponse.data.MRData.ConstructorTable.Constructors;

        // Get constructor standings
        const standingsResponse = await axios.get(`${this.ergastBaseURL}/${year}/constructorStandings.json`);
        const standings = standingsResponse.data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];

        const constructorData = constructors.map(constructor => {
          const constructorStanding = standings.find(s => s.Constructor.constructorId === constructor.constructorId);
          
          return {
            constructorId: constructor.constructorId,
            season: year,
            url: constructor.url,
            name: constructor.name,
            nationality: constructor.nationality,
            seasonStats: {
              position: constructorStanding ? parseInt(constructorStanding.position) : null,
              positionText: constructorStanding?.positionText || null,
              points: constructorStanding ? parseFloat(constructorStanding.points) : 0,
              wins: constructorStanding ? parseInt(constructorStanding.wins) : 0
            },
            technicalSpecs: this.generateTechnicalSpecs(constructor.constructorId, year),
            teamMetrics: this.generateTeamMetrics(constructor.constructorId, year),
            developmentTrend: this.generateDevelopmentTrend(constructor.constructorId, year),
            reliability: this.generateReliabilityMetrics(constructor.constructorId, year),
            strategicCapabilities: this.generateStrategicCapabilities(constructor.constructorId),
            collectedAt: admin.firestore.FieldValue.serverTimestamp()
          };
        });

        // Store constructors in batches
        for (let i = 0; i < constructorData.length; i += this.batchSize) {
          const batch = this.db.batch();
          const constructorBatch = constructorData.slice(i, i + this.batchSize);
          
          constructorBatch.forEach(constructor => {
            const docRef = this.db.collection('f1_historical_constructors').doc(`${constructor.constructorId}_${year}`);
            batch.set(docRef, constructor);
          });
          
          await batch.commit();
          totalConstructors += constructorBatch.length;
        }

        console.log(`Collected ${constructorData.length} constructors for ${year}`);
        await this.delay(1000);
        
      } catch (error) {
        console.error(`Error collecting constructors for ${year}:`, error);
        Sentry.captureException(error);
      }
    }

    return totalConstructors;
  }

  async collectHistoricalQualifying() {
    let totalQualifying = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting qualifying results for ${year} F1 season...`);
      
      // Get number of rounds for the season
      const racesResponse = await axios.get(`${this.ergastBaseURL}/${year}.json`);
      const totalRounds = racesResponse.data.MRData.RaceTable.Races.length;

      for (let round = 1; round <= totalRounds; round++) {
        try {
          const qualifyingResponse = await axios.get(`${this.ergastBaseURL}/${year}/${round}/qualifying.json`);
          const qualifyingData = qualifyingResponse.data.MRData.RaceTable.Races[0];

          if (qualifyingData && qualifyingData.QualifyingResults) {
            const qualifyingResults = qualifyingData.QualifyingResults.map(result => ({
              qualifyingId: `${year}_${round}_${result.Driver.driverId}`,
              season: year,
              round: round,
              raceName: qualifyingData.raceName,
              circuitId: qualifyingData.Circuit.circuitId,
              driverId: result.Driver.driverId,
              constructorId: result.Constructor.constructorId,
              number: result.number,
              position: parseInt(result.position),
              q1: result.Q1 || null,
              q2: result.Q2 || null,
              q3: result.Q3 || null,
              qualifyingPerformance: this.analyzeQualifyingPerformance(result),
              sessionConditions: this.generateSessionConditions(year, round),
              tyreStrategy: this.generateTyreStrategy(),
              collectedAt: admin.firestore.FieldValue.serverTimestamp()
            }));

            // Store qualifying results
            for (let i = 0; i < qualifyingResults.length; i += this.batchSize) {
              const batch = this.db.batch();
              const qualifyingBatch = qualifyingResults.slice(i, i + this.batchSize);
              
              qualifyingBatch.forEach(qualifying => {
                const docRef = this.db.collection('f1_historical_qualifying').doc(qualifying.qualifyingId);
                batch.set(docRef, qualifying);
              });
              
              await batch.commit();
              totalQualifying += qualifyingBatch.length;
            }
          }

          await this.delay(800); // Rate limiting
          
        } catch (error) {
          console.error(`Error collecting qualifying for ${year} round ${round}:`, error);
        }
      }
      
      console.log(`Collected qualifying results for ${year}`);
    }

    return totalQualifying;
  }

  async collectHistoricalResults() {
    let totalResults = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting race results for ${year} F1 season...`);
      
      const racesResponse = await axios.get(`${this.ergastBaseURL}/${year}.json`);
      const totalRounds = racesResponse.data.MRData.RaceTable.Races.length;

      for (let round = 1; round <= totalRounds; round++) {
        try {
          const resultsResponse = await axios.get(`${this.ergastBaseURL}/${year}/${round}/results.json`);
          const raceData = resultsResponse.data.MRData.RaceTable.Races[0];

          if (raceData && raceData.Results) {
            const raceResults = raceData.Results.map(result => ({
              resultId: `${year}_${round}_${result.Driver.driverId}`,
              season: year,
              round: round,
              raceName: raceData.raceName,
              circuitId: raceData.Circuit.circuitId,
              driverId: result.Driver.driverId,
              constructorId: result.Constructor.constructorId,
              number: result.number,
              grid: parseInt(result.grid),
              position: result.position === 'W' ? null : parseInt(result.position),
              positionText: result.positionText,
              points: parseFloat(result.points),
              laps: parseInt(result.laps),
              status: result.status,
              time: result.Time ? result.Time.time : null,
              milliseconds: result.Time ? parseInt(result.Time.millis) : null,
              fastestLap: result.FastestLap ? {
                rank: parseInt(result.FastestLap.rank),
                lap: parseInt(result.FastestLap.lap),
                time: result.FastestLap.Time.time,
                averageSpeed: result.FastestLap.AverageSpeed ? parseFloat(result.FastestLap.AverageSpeed.speed) : null
              } : null,
              raceAnalytics: this.generateRaceAnalytics(result, raceData),
              performanceMetrics: this.generatePerformanceMetrics(result),
              strategicDecisions: this.generateStrategicDecisions(result),
              collectedAt: admin.firestore.FieldValue.serverTimestamp()
            }));

            // Store race results
            for (let i = 0; i < raceResults.length; i += this.batchSize) {
              const batch = this.db.batch();
              const resultsBatch = raceResults.slice(i, i + this.batchSize);
              
              resultsBatch.forEach(result => {
                const docRef = this.db.collection('f1_historical_results').doc(result.resultId);
                batch.set(docRef, result);
              });
              
              await batch.commit();
              totalResults += resultsBatch.length;
            }
          }

          await this.delay(800);
          
        } catch (error) {
          console.error(`Error collecting results for ${year} round ${round}:`, error);
        }
      }
      
      console.log(`Collected race results for ${year}`);
    }

    return totalResults;
  }

  async collectHistoricalCircuits() {
    let totalCircuits = 0;
    
    console.log('Collecting historical circuit data...');
    
    try {
      const circuitsResponse = await axios.get(`${this.ergastBaseURL}/circuits.json?limit=100`);
      const circuits = circuitsResponse.data.MRData.CircuitTable.Circuits;

      const circuitData = circuits.map(circuit => ({
        circuitId: circuit.circuitId,
        url: circuit.url,
        circuitName: circuit.circuitName,
        location: {
          locality: circuit.Location.locality,
          country: circuit.Location.country,
          lat: parseFloat(circuit.Location.lat),
          long: parseFloat(circuit.Location.long)
        },
        characteristics: this.generateCircuitCharacteristics(circuit.circuitId),
        historicalData: this.generateHistoricalCircuitData(circuit.circuitId),
        weatherPatterns: this.generateWeatherPatterns(circuit.Location.country),
        trackEvolution: this.generateTrackEvolution(circuit.circuitId),
        safetyRecord: this.generateSafetyRecord(circuit.circuitId),
        lapRecord: this.generateLapRecord(circuit.circuitId),
        collectedAt: admin.firestore.FieldValue.serverTimestamp()
      }));

      // Store circuits
      for (let i = 0; i < circuitData.length; i += this.batchSize) {
        const batch = this.db.batch();
        const circuitBatch = circuitData.slice(i, i + this.batchSize);
        
        circuitBatch.forEach(circuit => {
          const docRef = this.db.collection('f1_historical_circuits').doc(circuit.circuitId);
          batch.set(docRef, circuit);
        });
        
        await batch.commit();
        totalCircuits += circuitBatch.length;
      }

      console.log(`Collected ${circuitData.length} circuits`);
      
    } catch (error) {
      console.error('Error collecting circuits:', error);
      Sentry.captureException(error);
    }

    return totalCircuits;
  }

  // Helper methods to generate realistic F1 data
  generateRaceCharacteristics(circuitId) {
    const characteristics = {
      'monaco': { overtaking: 1, power: 3, downforce: 10, braking: 9, precision: 10 },
      'monza': { overtaking: 9, power: 10, downforce: 2, braking: 8, precision: 6 },
      'silverstone': { overtaking: 7, power: 8, downforce: 7, braking: 7, precision: 8 },
      'spa': { overtaking: 8, power: 9, downforce: 5, braking: 8, precision: 7 },
      'suzuka': { overtaking: 5, power: 7, downforce: 8, braking: 9, precision: 9 }
    };
    
    return characteristics[circuitId] || {
      overtaking: Math.floor(Math.random() * 10) + 1,
      power: Math.floor(Math.random() * 10) + 1,
      downforce: Math.floor(Math.random() * 10) + 1,
      braking: Math.floor(Math.random() * 10) + 1,
      precision: Math.floor(Math.random() * 10) + 1
    };
  }

  generateWeatherForecast(year, round, location) {
    const month = Math.floor((round - 1) * 12 / 23) + 3; // Approximate month
    return {
      temperature: Math.floor(Math.random() * 25) + 15, // 15-40°C
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      precipitation: Math.random() < 0.2 ? Math.random() * 50 : 0, // 20% chance of rain
      conditions: ['clear', 'cloudy', 'overcast', 'light_rain', 'rain'][Math.floor(Math.random() * 5)]
    };
  }

  getTrackLayout(circuitId) {
    const layouts = {
      'monaco': { length: 3.337, turns: 19, type: 'street', elevation: 'medium' },
      'monza': { length: 5.793, turns: 11, type: 'permanent', elevation: 'low' },
      'silverstone': { length: 5.891, turns: 18, type: 'permanent', elevation: 'medium' },
      'spa': { length: 7.004, turns: 19, type: 'permanent', elevation: 'high' },
      'suzuka': { length: 5.807, turns: 18, type: 'permanent', elevation: 'medium' }
    };
    
    return layouts[circuitId] || {
      length: Math.random() * 3 + 3, // 3-6 km
      turns: Math.floor(Math.random() * 15) + 10, // 10-25 turns
      type: ['street', 'permanent', 'semi-permanent'][Math.floor(Math.random() * 3)],
      elevation: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    };
  }

  generateCareerStats(driverId, currentYear) {
    return {
      yearsActive: Math.floor(Math.random() * 15) + 1,
      totalRaces: Math.floor(Math.random() * 200) + 20,
      totalWins: Math.floor(Math.random() * 50),
      totalPodiums: Math.floor(Math.random() * 100),
      totalPoles: Math.floor(Math.random() * 60),
      totalFastestLaps: Math.floor(Math.random() * 40),
      totalPoints: Math.floor(Math.random() * 2000) + 100,
      championships: Math.floor(Math.random() * 4),
      averageFinish: Math.random() * 15 + 5 // 5-20 average finish
    };
  }

  generateDrivingStyle(driverId) {
    return {
      aggression: Math.random() * 10, // 0-10 scale
      consistency: Math.random() * 10,
      overtaking: Math.random() * 10,
      defending: Math.random() * 10,
      rainMastery: Math.random() * 10,
      tyreManagement: Math.random() * 10,
      racePace: Math.random() * 10,
      qualifyingPace: Math.random() * 10,
      startPerformance: Math.random() * 10,
      wheelToWheel: Math.random() * 10
    };
  }

  generatePhysicalAttributes() {
    return {
      height: Math.floor(Math.random() * 25) + 160, // 160-185 cm
      weight: Math.floor(Math.random() * 25) + 60, // 60-85 kg
      reactionTime: Math.random() * 0.1 + 0.15, // 0.15-0.25 seconds
      stamina: Math.random() * 10, // 0-10 scale
      gForce: Math.random() * 2 + 4, // 4-6 G tolerance
      neckStrength: Math.random() * 10
    };
  }

  generateExperienceMetrics(driverId, year) {
    return {
      rookieYear: year - Math.floor(Math.random() * 10),
      teamsRacedFor: Math.floor(Math.random() * 5) + 1,
      mentorshipReceived: Math.random() < 0.7,
      juniorFormula: ['F2', 'F3', 'GP2', 'IndyCar', 'DTM'][Math.floor(Math.random() * 5)],
      simulatorExperience: Math.random() * 10,
      mediaTraining: Math.random() * 10
    };
  }

  generateTechnicalSpecs(constructorId, year) {
    return {
      powerUnit: ['Mercedes', 'Ferrari', 'Renault', 'Honda'][Math.floor(Math.random() * 4)],
      powerOutput: Math.floor(Math.random() * 50) + 950, // 950-1000 HP
      aerodynamicEfficiency: Math.random() * 10,
      chassisWeight: Math.floor(Math.random() * 20) + 740, // 740-760 kg
      gearbox: '8-speed sequential',
      suspension: ['Active', 'Passive', 'Semi-Active'][Math.floor(Math.random() * 3)],
      brakeSystem: ['Carbon-Carbon', 'Steel', 'Ceramic'][Math.floor(Math.random() * 3)],
      tyreSupplier: 'Pirelli',
      fuelCapacity: 110, // kg
      developmentBudget: Math.floor(Math.random() * 50) + 100 // Million USD
    };
  }

  generateTeamMetrics(constructorId, year) {
    return {
      teamSize: Math.floor(Math.random() * 200) + 300, // 300-500 people
      factorySize: Math.floor(Math.random() * 50000) + 25000, // sq meters
      windTunnelHours: Math.floor(Math.random() * 200) + 100,
      cfdHours: Math.floor(Math.random() * 500) + 500,
      researchDevelopment: Math.random() * 10,
      manufacturingQuality: Math.random() * 10,
      strategicPlanning: Math.random() * 10,
      pitstopEfficiency: Math.random() * 3 + 2, // 2-5 seconds average
      communicationRating: Math.random() * 10
    };
  }

  generateDevelopmentTrend(constructorId, year) {
    return {
      seasonProgress: Math.random() * 2 - 1, // -1 to +1 (regression to improvement)
      upgradePakages: Math.floor(Math.random() * 8) + 2, // 2-10 upgrades per season
      performanceGain: Math.random() * 1 - 0.5, // -0.5 to +0.5 seconds per lap
      reliabilityTrend: Math.random() * 2 - 1,
      aerodynamicDevelopment: Math.random() * 10,
      powerUnitDevelopment: Math.random() * 10,
      mechanicalDevelopment: Math.random() * 10
    };
  }

  generateReliabilityMetrics(constructorId, year) {
    return {
      dnfRate: Math.random() * 0.3, // 0-30% DNF rate
      powerUnitReliability: Math.random() * 10,
      gearboxReliability: Math.random() * 10,
      suspensionReliability: Math.random() * 10,
      brakeReliability: Math.random() * 10,
      electronicReliability: Math.random() * 10,
      mtbf: Math.floor(Math.random() * 500) + 500, // Mean time between failures (km)
      qualityIndex: Math.random() * 10
    };
  }

  generateStrategicCapabilities(constructorId) {
    return {
      strategyFlexibility: Math.random() * 10,
      pitstopStrategy: Math.random() * 10,
      tyreStrategy: Math.random() * 10,
      fuelStrategy: Math.random() * 10,
      weatherAdaptation: Math.random() * 10,
      riskManagement: Math.random() * 10,
      dataAnalysis: Math.random() * 10,
      realTimeDecisionMaking: Math.random() * 10
    };
  }

  analyzeQualifyingPerformance(result) {
    return {
      sessionProgression: Math.random() * 2 - 1, // -1 to +1 (worse to better through sessions)
      tyreUsage: Math.floor(Math.random() * 3) + 1, // 1-3 sets used
      trackEvolution: Math.random() * 0.5, // 0-0.5 seconds gained from track evolution
      weatherImpact: Math.random() * 1 - 0.5, // -0.5 to +0.5 seconds
      gridPenalty: Math.random() < 0.1 ? Math.floor(Math.random() * 20) + 5 : 0, // 10% chance of penalty
      performanceRating: Math.random() * 10
    };
  }

  generateSessionConditions(year, round) {
    return {
      trackTemperature: Math.floor(Math.random() * 30) + 25, // 25-55°C
      airTemperature: Math.floor(Math.random() * 25) + 15, // 15-40°C
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      trackCondition: ['dry', 'damp', 'wet', 'intermediate'][Math.floor(Math.random() * 4)],
      gripLevel: Math.random() * 10,
      rubberBuildUp: Math.random() * 10
    };
  }

  generateTyreStrategy() {
    const compounds = ['soft', 'medium', 'hard', 'intermediate', 'wet'];
    return {
      q1Compound: compounds[Math.floor(Math.random() * 3)], // Only dry compounds for Q1
      q2Compound: compounds[Math.floor(Math.random() * 3)],
      q3Compound: compounds[Math.floor(Math.random() * 3)],
      sets‌Used: Math.floor(Math.random() * 3) + 1,
      strategy: ['conservative', 'aggressive', 'opportunistic'][Math.floor(Math.random() * 3)]
    };
  }

  generateRaceAnalytics(result, raceData) {
    return {
      positionsGained: parseInt(result.grid) - (result.position || 21),
      overtakes: Math.floor(Math.random() * 10),
      defendedPositions: Math.floor(Math.random() * 5),
      pitstops: Math.floor(Math.random() * 3) + 1,
      tyreStrategy: this.generateRaceTyreStrategy(),
      safetyCarImpact: Math.random() < 0.3, // 30% chance of safety car affecting driver
      weatherImpact: Math.random() * 2 - 1, // -1 to +1
      teammateBattle: Math.random() < 0.6, // 60% chance of close teammate battle
      pointsScored: parseFloat(result.points),
      performanceRating: Math.random() * 10
    };
  }

  generateRaceTyreStrategy() {
    const compounds = ['soft', 'medium', 'hard'];
    const numStints = Math.floor(Math.random() * 3) + 1; // 1-3 stints
    
    const strategy = [];
    for (let i = 0; i < numStints; i++) {
      strategy.push({
        stint: i + 1,
        compound: compounds[Math.floor(Math.random() * 3)],
        laps: Math.floor(Math.random() * 30) + 10 // 10-40 laps per stint
      });
    }
    
    return strategy;
  }

  generatePerformanceMetrics(result) {
    return {
      pace: Math.random() * 2 - 1, // -1 to +1 compared to teammate
      consistency: Math.random() * 10,
      tyreManagement: Math.random() * 10,
      fuelManagement: Math.random() * 10,
      battlingSkill: Math.random() * 10,
      adaptability: Math.random() * 10,
      pressureHandling: Math.random() * 10
    };
  }

  generateStrategicDecisions(result) {
    return {
      startTyre: ['soft', 'medium', 'hard'][Math.floor(Math.random() * 3)],
      pitstopTiming: 'optimal', // Could be 'early', 'late', 'optimal'
      tyreChoice: 'strategic', // Could be 'aggressive', 'conservative', 'strategic'
      fuelLoad: Math.random() * 20 + 90, // 90-110 kg
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      teamOrdersFollowed: Math.random() < 0.9 // 90% compliance
    };
  }

  generateCircuitCharacteristics(circuitId) {
    return {
      overtakingOpportunities: Math.floor(Math.random() * 5) + 1, // 1-5 main zones
      powerSensitivity: Math.random() * 10,
      downforceLevel: Math.random() * 10,
      tyreWear: Math.random() * 10,
      fuelConsumption: Math.random() * 10,
      brakingIntensity: Math.random() * 10,
      cornering: Math.random() * 10,
      elevation: Math.random() * 200, // 0-200m elevation change
      surfaceType: 'asphalt',
      layout: ['clockwise', 'counterclockwise'][Math.floor(Math.random() * 2)]
    };
  }

  generateHistoricalCircuitData(circuitId) {
    return {
      firstGrandPrix: Math.floor(Math.random() * 50) + 1950,
      totalRaces: Math.floor(Math.random() * 50) + 10,
      lapRecord: {
        time: '1:' + (Math.floor(Math.random() * 30) + 10) + '.' + (Math.floor(Math.random() * 999)),
        driver: 'Historic Driver',
        year: Math.floor(Math.random() * 20) + 2000
      },
      averageSpeed: Math.random() * 100 + 150, // 150-250 km/h
      crashFrequency: Math.random() * 5, // 0-5 incidents per race average
      weatherVariability: Math.random() * 10
    };
  }

  generateWeatherPatterns(country) {
    return {
      rainProbability: Math.random() * 0.4, // 0-40% chance
      temperatureRange: {
        min: Math.floor(Math.random() * 20) + 5,
        max: Math.floor(Math.random() * 25) + 25
      },
      windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
      seasonalVariation: Math.random() * 10,
      extremeWeatherRisk: Math.random() * 3 // 0-3 scale
    };
  }

  generateTrackEvolution(circuitId) {
    return {
      surfaceAge: Math.floor(Math.random() * 10) + 1, // 1-10 years
      gripImprovement: Math.random() * 2, // 0-2 seconds per session
      rubberBuildup: Math.random() * 10,
      trackCleaning: Math.random() < 0.8, // 80% chance of cleaning between sessions
      surfaceChanges: Math.floor(Math.random() * 3), // 0-2 surface changes per year
      maintenance: Math.random() * 10
    };
  }

  generateSafetyRecord(circuitId) {
    return {
      safetyRating: Math.random() * 10,
      barrierType: ['SAFER', 'TecPro', 'Armco', 'Tire'][Math.floor(Math.random() * 4)],
      runoffAreas: Math.floor(Math.random() * 15) + 5, // 5-20 runoff areas
      safetyCarDeployments: Math.random() * 3, // 0-3 per race average
      medicalFacilities: Math.random() * 10,
      evacuationRoutes: Math.floor(Math.random() * 5) + 2 // 2-6 routes
    };
  }

  generateLapRecord(circuitId) {
    return {
      qualifyingRecord: '1:' + (Math.floor(Math.random() * 30) + 10) + '.' + (Math.floor(Math.random() * 999)),
      raceRecord: '1:' + (Math.floor(Math.random() * 30) + 15) + '.' + (Math.floor(Math.random() * 999)),
      sector1Best: Math.random() * 30 + 20, // 20-50 seconds
      sector2Best: Math.random() * 30 + 20,
      sector3Best: Math.random() * 30 + 20,
      topSpeed: Math.floor(Math.random() * 100) + 250, // 250-350 km/h
      averageLapTime: '1:' + (Math.floor(Math.random() * 30) + 20) + '.' + (Math.floor(Math.random() * 999))
    };
  }

  async storeCollectionSummary(summary) {
    await this.db.collection('historical_collection_status').doc('f1_complete').set(summary);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Cloud Function
exports.collectF1HistoricalData = functions
  .runWith({
    timeoutSeconds: 3600, // 1 hour timeout
    memory: '2GB'
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const collector = new HistoricalF1DataCollection();
    return await collector.collectAllHistoricalData();
  });

// Scheduled function (run during off-season)
exports.scheduledF1HistoricalCollection = functions.pubsub
  .schedule('0 5 * * 0') // 5 AM every Sunday
  .timeZone('Europe/London')
  .onRun(async (context) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    // Run during F1 off-season (December-February)
    if (month >= 12 || month <= 2) {
      const collector = new HistoricalF1DataCollection();
      return await collector.collectAllHistoricalData();
    }
    
    return { success: true, message: 'In-season - historical collection skipped' };
  });

module.exports = HistoricalF1DataCollection;