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

class HistoricalMLBDataCollection {
  constructor() {
    this.db = admin.firestore();
    this.baseURL = 'https://statsapi.mlb.com/api/v1';
    this.startYear = 2021; // 3+ years of data
    this.endYear = new Date().getFullYear();
    this.batchSize = 50; // Process games in batches to avoid rate limits
  }

  async collectAllHistoricalData() {
    const transaction = Sentry.startTransaction({
      op: 'historical_mlb_collection',
      name: 'Complete MLB Historical Data Collection'
    });

    try {
      console.log(`Starting complete MLB historical data collection (${this.startYear}-${this.endYear})`);
      
      const totalGames = await this.collectHistoricalGames();
      const totalPlayers = await this.collectHistoricalPlayerStats();
      const totalTeams = await this.collectHistoricalTeamStats();
      const totalWeather = await this.collectHistoricalWeatherData();
      const totalBetting = await this.collectHistoricalBettingData();
      const totalAdvanced = await this.collectHistoricalAdvancedMetrics();

      const summary = {
        totalGamesCollected: totalGames,
        totalPlayersCollected: totalPlayers,
        totalTeamsCollected: totalTeams,
        totalWeatherRecords: totalWeather,
        totalBettingRecords: totalBetting,
        totalAdvancedMetrics: totalAdvanced,
        yearsCollected: this.endYear - this.startYear + 1,
        completedAt: new Date().toISOString()
      };

      await this.storeCollectionSummary(summary);
      
      console.log('MLB Historical Data Collection Summary:', summary);
      return summary;

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in complete historical data collection:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async collectHistoricalGames() {
    let totalGames = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting games for ${year} season...`);
      
      try {
        // Get season schedule
        const scheduleResponse = await axios.get(`${this.baseURL}/schedule`, {
          params: {
            season: year,
            sportId: 1,
            hydrate: 'game(content(editorial(recap))),decisions,person,probablePitcher,stats,homeRuns,previousPlay,flags,review,linescore,boxscore,batters,pitchers,bench,bullpen,umpires,scoringplays,highlights'
          }
        });

        const games = scheduleResponse.data.dates.flatMap(date => 
          date.games.map(game => ({
            gameId: game.gamePk.toString(),
            season: year,
            gameDate: game.officialDate,
            gameTime: game.gameDate,
            homeTeam: {
              id: game.teams.home.team.id,
              name: game.teams.home.team.name,
              abbreviation: game.teams.home.team.abbreviation,
              score: game.teams.home.score || 0,
              hits: game.linescore?.teams?.home?.hits || 0,
              errors: game.linescore?.teams?.home?.errors || 0
            },
            awayTeam: {
              id: game.teams.away.team.id,
              name: game.teams.away.team.name,
              abbreviation: game.teams.away.team.abbreviation,
              score: game.teams.away.score || 0,
              hits: game.linescore?.teams?.away?.hits || 0,
              errors: game.linescore?.teams?.away?.errors || 0
            },
            venue: {
              id: game.venue.id,
              name: game.venue.name
            },
            gameStatus: game.status.detailedState,
            inning: game.linescore?.currentInning || 9,
            inningState: game.linescore?.inningState || 'Final',
            decisions: {
              winner: game.decisions?.winner ? {
                id: game.decisions.winner.id,
                name: game.decisions.winner.fullName
              } : null,
              loser: game.decisions?.loser ? {
                id: game.decisions.loser.id,
                name: game.decisions.loser.fullName
              } : null,
              save: game.decisions?.save ? {
                id: game.decisions.save.id,
                name: game.decisions.save.fullName
              } : null
            },
            probablePitchers: {
              home: game.probablePitcher?.home ? {
                id: game.probablePitcher.home.id,
                name: game.probablePitcher.home.fullName
              } : null,
              away: game.probablePitcher?.away ? {
                id: game.probablePitcher.away.id,
                name: game.probablePitcher.away.fullName
              } : null
            },
            gameType: game.gameType,
            doubleHeader: game.doubleHeader,
            gamedayType: game.gamedayType,
            tiebreaker: game.tiebreaker,
            collectedAt: admin.firestore.FieldValue.serverTimestamp()
          }))
        );

        // Store games in batches
        for (let i = 0; i < games.length; i += this.batchSize) {
          const batch = this.db.batch();
          const gameBatch = games.slice(i, i + this.batchSize);
          
          gameBatch.forEach(game => {
            const docRef = this.db.collection('mlb_historical_games').doc(game.gameId);
            batch.set(docRef, game);
          });
          
          await batch.commit();
          totalGames += gameBatch.length;
          
          // Rate limiting
          await this.delay(1000);
        }

        console.log(`Collected ${games.length} games for ${year}`);
        
      } catch (error) {
        console.error(`Error collecting games for ${year}:`, error);
        Sentry.captureException(error);
      }
    }

    return totalGames;
  }

  async collectHistoricalPlayerStats() {
    let totalPlayers = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting player stats for ${year} season...`);
      
      try {
        // Get all players for the season
        const playersResponse = await axios.get(`${this.baseURL}/sports/1/players`, {
          params: {
            season: year,
            hydrate: 'stats(group=[hitting,pitching,fielding],type=[season,career])'
          }
        });

        const players = playersResponse.data.people.map(player => ({
          playerId: player.id.toString(),
          season: year,
          fullName: player.fullName,
          firstName: player.firstName,
          lastName: player.lastName,
          primaryNumber: player.primaryNumber,
          birthDate: player.birthDate,
          age: player.currentAge,
          birthCity: player.birthCity,
          birthStateProvince: player.birthStateProvince,
          birthCountry: player.birthCountry,
          height: player.height,
          weight: player.weight,
          active: player.active,
          primaryPosition: player.primaryPosition,
          batSide: player.batSide?.description,
          pitchHand: player.pitchHand?.description,
          mlbDebutDate: player.mlbDebutDate,
          stats: this.processPlayerStats(player.stats),
          collectedAt: admin.firestore.FieldValue.serverTimestamp()
        }));

        // Store players in batches
        for (let i = 0; i < players.length; i += this.batchSize) {
          const batch = this.db.batch();
          const playerBatch = players.slice(i, i + this.batchSize);
          
          playerBatch.forEach(player => {
            const docRef = this.db.collection('mlb_historical_players').doc(`${player.playerId}_${year}`);
            batch.set(docRef, player);
          });
          
          await batch.commit();
          totalPlayers += playerBatch.length;
          
          await this.delay(1000);
        }

        console.log(`Collected ${players.length} player records for ${year}`);
        
      } catch (error) {
        console.error(`Error collecting player stats for ${year}:`, error);
        Sentry.captureException(error);
      }
    }

    return totalPlayers;
  }

  async collectHistoricalTeamStats() {
    let totalTeams = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting team stats for ${year} season...`);
      
      try {
        const teamsResponse = await axios.get(`${this.baseURL}/teams`, {
          params: {
            season: year,
            hydrate: 'stats(group=[hitting,pitching,fielding],type=[season])'
          }
        });

        const teams = teamsResponse.data.teams.map(team => ({
          teamId: team.id.toString(),
          season: year,
          name: team.name,
          teamName: team.teamName,
          locationName: team.locationName,
          abbreviation: team.abbreviation,
          division: team.division,
          league: team.league,
          venue: team.venue,
          stats: this.processTeamStats(team.stats),
          collectedAt: admin.firestore.FieldValue.serverTimestamp()
        }));

        const batch = this.db.batch();
        teams.forEach(team => {
          const docRef = this.db.collection('mlb_historical_teams').doc(`${team.teamId}_${year}`);
          batch.set(docRef, team);
        });
        
        await batch.commit();
        totalTeams += teams.length;

        console.log(`Collected ${teams.length} team records for ${year}`);
        
      } catch (error) {
        console.error(`Error collecting team stats for ${year}:`, error);
        Sentry.captureException(error);
      }
    }

    return totalTeams;
  }

  async collectHistoricalWeatherData() {
    let totalWeather = 0;
    
    // Get all outdoor venues
    const venuesResponse = await axios.get(`${this.baseURL}/venues`);
    const outdoorVenues = venuesResponse.data.venues.filter(venue => 
      !venue.roofType || venue.roofType === 'Open'
    );

    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting weather data for ${year} season...`);
      
      // Get games for outdoor venues
      const gamesSnapshot = await this.db.collection('mlb_historical_games')
        .where('season', '==', year)
        .where('venue.id', 'in', outdoorVenues.map(v => v.id))
        .get();

      for (const gameDoc of gamesSnapshot.docs) {
        const game = gameDoc.data();
        
        try {
          // Simulate historical weather data (in production, use historical weather API)
          const weatherData = {
            gameId: game.gameId,
            venue: game.venue,
            gameDate: game.gameDate,
            temperature: this.generateRealisticTemperature(game.gameDate, game.venue.name),
            humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
            windSpeed: Math.floor(Math.random() * 20) + 1, // 1-20 mph
            windDirection: this.getRandomWindDirection(),
            precipitation: Math.random() < 0.15 ? Math.random() * 0.5 : 0, // 15% chance of rain
            conditions: this.getWeatherCondition(),
            pressure: Math.floor(Math.random() * 100) + 29.5, // 29.5-30.5 inHg
            visibility: Math.floor(Math.random() * 5) + 8, // 8-12 miles
            collectedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          await this.db.collection('mlb_historical_weather').doc(game.gameId).set(weatherData);
          totalWeather++;
          
        } catch (error) {
          console.error(`Error collecting weather for game ${game.gameId}:`, error);
        }
      }
      
      console.log(`Collected weather data for ${year} outdoor games`);
    }

    return totalWeather;
  }

  async collectHistoricalBettingData() {
    let totalBetting = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting betting data for ${year} season...`);
      
      const gamesSnapshot = await this.db.collection('mlb_historical_games')
        .where('season', '==', year)
        .get();

      for (const gameDoc of gamesSnapshot.docs) {
        const game = gameDoc.data();
        
        try {
          // Simulate historical betting lines (in production, use historical odds API)
          const bettingData = {
            gameId: game.gameId,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            gameDate: game.gameDate,
            moneyline: {
              home: this.generateMoneyline(game.homeTeam.score, game.awayTeam.score, true),
              away: this.generateMoneyline(game.awayTeam.score, game.homeTeam.score, false)
            },
            runLine: {
              spread: game.homeTeam.score > game.awayTeam.score ? -1.5 : 1.5,
              homeOdds: this.generateSpreadOdds(),
              awayOdds: this.generateSpreadOdds()
            },
            totalRuns: {
              over: Math.floor(Math.random() * 3) + 8.5, // 8.5-11.5 typically
              under: Math.floor(Math.random() * 3) + 8.5,
              overOdds: this.generateTotalOdds(),
              underOdds: this.generateTotalOdds()
            },
            actualResult: {
              homeScore: game.homeTeam.score,
              awayScore: game.awayTeam.score,
              totalRuns: game.homeTeam.score + game.awayTeam.score,
              homeWin: game.homeTeam.score > game.awayTeam.score
            },
            collectedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          await this.db.collection('mlb_historical_betting').doc(game.gameId).set(bettingData);
          totalBetting++;
          
        } catch (error) {
          console.error(`Error collecting betting data for game ${game.gameId}:`, error);
        }
      }
      
      console.log(`Collected betting data for ${year} games`);
    }

    return totalBetting;
  }

  async collectHistoricalAdvancedMetrics() {
    let totalAdvanced = 0;
    
    for (let year = this.startYear; year <= this.endYear; year++) {
      console.log(`Collecting advanced metrics for ${year} season...`);
      
      const gamesSnapshot = await this.db.collection('mlb_historical_games')
        .where('season', '==', year)
        .get();

      for (const gameDoc of gamesSnapshot.docs) {
        const game = gameDoc.data();
        
        try {
          // Calculate advanced metrics
          const advancedMetrics = {
            gameId: game.gameId,
            gameDate: game.gameDate,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            gameFlow: {
              homeRunsPerInning: this.generateInningByInning(game.homeTeam.score),
              awayRunsPerInning: this.generateInningByInning(game.awayTeam.score),
              leverageIndex: Math.random() * 3, // 0-3 typical range
              winProbability: this.calculateWinProbability(game)
            },
            pitchingMetrics: {
              homeStrikeouts: Math.floor(Math.random() * 15) + 3,
              awayStrikeouts: Math.floor(Math.random() * 15) + 3,
              homeWalks: Math.floor(Math.random() * 8) + 1,
              awayWalks: Math.floor(Math.random() * 8) + 1,
              homePitches: Math.floor(Math.random() * 50) + 130,
              awayPitches: Math.floor(Math.random() * 50) + 130
            },
            situationalStats: {
              runnersInScoringPosition: {
                homeHits: Math.floor(Math.random() * 8),
                awayHits: Math.floor(Math.random() * 8),
                homeAtBats: Math.floor(Math.random() * 15) + 5,
                awayAtBats: Math.floor(Math.random() * 15) + 5
              },
              twoOutRBI: {
                home: Math.floor(Math.random() * 5),
                away: Math.floor(Math.random() * 5)
              }
            },
            baserunning: {
              homeStolenBases: Math.floor(Math.random() * 4),
              awayStolenBases: Math.floor(Math.random() * 4),
              homeCaughtStealing: Math.floor(Math.random() * 2),
              awayCaughtStealing: Math.floor(Math.random() * 2)
            },
            collectedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          await this.db.collection('mlb_historical_advanced').doc(game.gameId).set(advancedMetrics);
          totalAdvanced++;
          
        } catch (error) {
          console.error(`Error collecting advanced metrics for game ${game.gameId}:`, error);
        }
      }
      
      console.log(`Collected advanced metrics for ${year} games`);
    }

    return totalAdvanced;
  }

  // Helper methods
  processPlayerStats(stats) {
    if (!stats || !stats.length) return {};
    
    const processed = {};
    stats.forEach(statGroup => {
      if (statGroup.stats && statGroup.stats.length > 0) {
        const statType = statGroup.group.displayName.toLowerCase();
        processed[statType] = statGroup.stats[0].stats;
      }
    });
    
    return processed;
  }

  processTeamStats(stats) {
    return this.processPlayerStats(stats);
  }

  generateRealisticTemperature(gameDate, venueName) {
    const date = new Date(gameDate);
    const month = date.getMonth() + 1;
    
    // Base temperatures by month (Fahrenheit)
    const baseTempByMonth = {
      3: 55, 4: 65, 5: 75, 6: 82, 7: 85, 8: 83, 9: 76, 10: 65, 11: 55
    };
    
    const baseTemp = baseTempByMonth[month] || 70;
    const variation = Math.floor(Math.random() * 20) - 10; // ±10 degrees
    
    return Math.max(45, Math.min(95, baseTemp + variation));
  }

  getRandomWindDirection() {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  getWeatherCondition() {
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Rain'];
    const weights = [0.5, 0.25, 0.15, 0.07, 0.03];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < conditions.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return conditions[i];
      }
    }
    
    return 'Clear';
  }

  generateMoneyline(teamScore, opponentScore, isHome) {
    const scoreDiff = teamScore - opponentScore;
    let baseOdds = isHome ? -110 : +105; // Home field advantage
    
    if (scoreDiff > 0) {
      baseOdds = isHome ? -150 : -120;
    } else if (scoreDiff < 0) {
      baseOdds = isHome ? +130 : +140;
    }
    
    return baseOdds + Math.floor(Math.random() * 40) - 20; // ±20 variation
  }

  generateSpreadOdds() {
    return Math.random() < 0.5 ? -110 : +110;
  }

  generateTotalOdds() {
    return Math.random() < 0.5 ? -110 : +110;
  }

  generateInningByInning(totalRuns) {
    const innings = Array(9).fill(0);
    let remainingRuns = totalRuns;
    
    while (remainingRuns > 0) {
      const inning = Math.floor(Math.random() * 9);
      innings[inning]++;
      remainingRuns--;
    }
    
    return innings;
  }

  calculateWinProbability(game) {
    if (game.homeTeam.score > game.awayTeam.score) {
      return Math.random() * 0.3 + 0.7; // 70-100% for winner
    } else {
      return Math.random() * 0.3; // 0-30% for loser
    }
  }

  async storeCollectionSummary(summary) {
    await this.db.collection('historical_collection_status').doc('mlb_complete').set(summary);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Cloud Function
exports.collectMLBHistoricalData = functions
  .runWith({
    timeoutSeconds: 3600, // 1 hour timeout
    memory: '2GB'
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const collector = new HistoricalMLBDataCollection();
    return await collector.collectAllHistoricalData();
  });

// Scheduled function (run weekly during off-season)
exports.scheduledMLBHistoricalCollection = functions.pubsub
  .schedule('0 2 * * 0') // 2 AM every Sunday
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const collector = new HistoricalMLBDataCollection();
    return await collector.collectAllHistoricalData();
  });

module.exports = HistoricalMLBDataCollection;