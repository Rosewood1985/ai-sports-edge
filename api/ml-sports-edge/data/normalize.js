/**
 * Data Normalizer
 * Transforms data from different sources into a consistent format for ML model
 */

const fs = require('fs');
const path = require('path');

// Data directories
const RAW_DATA_DIR = path.join(__dirname, 'raw');
const NORMALIZED_DATA_DIR = path.join(__dirname, 'normalized');

// Ensure normalized data directory exists
if (!fs.existsSync(NORMALIZED_DATA_DIR)) {
  fs.mkdirSync(NORMALIZED_DATA_DIR, { recursive: true });
}

/**
 * Save normalized data to file
 * @param {string} sport - Sport key
 * @param {string} dataType - Type of data (games, teams, players)
 * @param {Array} data - Normalized data
 */
function saveNormalizedData(sport, dataType, data) {
  const filename = `${sport.toLowerCase()}_${dataType}_${new Date().toISOString().split('T')[0]}.json`;
  const filePath = path.join(NORMALIZED_DATA_DIR, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved normalized ${dataType} data for ${sport} to ${filePath}`);
}

/**
 * Load combined data for a sport
 * @param {string} sport - Sport key
 * @returns {Object} - Combined data
 */
function loadCombinedData(sport) {
  // Find the most recent combined data file for the sport
  const files = fs.readdirSync(RAW_DATA_DIR)
    .filter(file => file.startsWith(`${sport.toLowerCase()}_combined_`))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log(`No combined data found for ${sport}`);
    return null;
  }
  
  const filePath = path.join(RAW_DATA_DIR, files[0]);
  console.log(`Loading combined data for ${sport} from ${filePath}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`Error loading combined data for ${sport}:`, error);
    return null;
  }
}

/**
 * Normalize team sports data (NBA, WNBA, MLB, NHL, NCAA)
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized games data
 */
function normalizeTeamSportData(sportData) {
  const { sport, sources } = sportData;
  const games = [];
  
  console.log(`Normalizing team sport data for ${sport}...`);
  
  // Process ESPN data
  if (sources.espn && sources.espn.events) {
    sources.espn.events.forEach(event => {
      const gameId = event.id;
      const date = new Date(event.date);
      const competitors = event.competitions[0]?.competitors || [];
      const homeTeam = competitors.find(team => team.homeAway === 'home')?.team || {};
      const awayTeam = competitors.find(team => team.homeAway === 'away')?.team || {};
      
      // Create base game object
      const game = {
        id: gameId,
        sport,
        date: date.toISOString(),
        timestamp: date.getTime(),
        homeTeam: {
          id: homeTeam.id,
          name: homeTeam.displayName || 'TBD',
          abbreviation: homeTeam.abbreviation,
          score: parseInt(competitors.find(team => team.homeAway === 'home')?.score) || null
        },
        awayTeam: {
          id: awayTeam.id,
          name: awayTeam.displayName || 'TBD',
          abbreviation: awayTeam.abbreviation,
          score: parseInt(competitors.find(team => team.homeAway === 'away')?.score) || null
        },
        status: {
          state: event.status?.type?.state || 'pre',
          detail: event.status?.type?.description || ''
        },
        venue: {
          name: event.competitions[0]?.venue?.fullName || '',
          city: event.competitions[0]?.venue?.address?.city || '',
          state: event.competitions[0]?.venue?.address?.state || '',
          country: event.competitions[0]?.venue?.address?.country || ''
        },
        odds: {
          spread: null,
          overUnder: null,
          homeMoneyline: null,
          awayMoneyline: null
        },
        dataSource: {
          espn: true,
          odds: false,
          sportRadar: false,
          nhlStats: false,
          ncaa: false
        }
      };
      
      // Add to games array
      games.push(game);
    });
  }
  
  // Enrich with odds data
  if (sources.odds && Array.isArray(sources.odds)) {
    sources.odds.forEach(oddsItem => {
      // Find matching game
      const game = games.find(g => 
        (g.homeTeam.name.includes(oddsItem.home_team) || oddsItem.home_team.includes(g.homeTeam.name)) &&
        (g.awayTeam.name.includes(oddsItem.away_team) || oddsItem.away_team.includes(g.awayTeam.name))
      );
      
      if (game) {
        // Mark as having odds data
        game.dataSource.odds = true;
        
        // Find the best odds (prefer FanDuel if available)
        const bookmaker = oddsItem.bookmakers.find(b => 
          b.key === 'fanduel' || b.title.toLowerCase().includes('fanduel')
        ) || oddsItem.bookmakers[0];
        
        if (bookmaker) {
          // Get spread
          const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
          if (spreadsMarket && spreadsMarket.outcomes) {
            const homeSpread = spreadsMarket.outcomes.find(o => 
              o.name.includes(game.homeTeam.name) || game.homeTeam.name.includes(o.name)
            );
            if (homeSpread) {
              game.odds.spread = homeSpread.point;
            }
          }
          
          // Get over/under
          const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');
          if (totalsMarket && totalsMarket.outcomes) {
            game.odds.overUnder = totalsMarket.outcomes[0]?.point || null;
          }
          
          // Get moneyline
          const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
          if (h2hMarket && h2hMarket.outcomes) {
            const homeOdds = h2hMarket.outcomes.find(o => 
              o.name.includes(game.homeTeam.name) || game.homeTeam.name.includes(o.name)
            );
            const awayOdds = h2hMarket.outcomes.find(o => 
              o.name.includes(game.awayTeam.name) || game.awayTeam.name.includes(o.name)
            );
            
            if (homeOdds) {
              game.odds.homeMoneyline = homeOdds.price;
            }
            
            if (awayOdds) {
              game.odds.awayMoneyline = awayOdds.price;
            }
          }
          
          // Add bookmaker info
          game.odds.provider = bookmaker.title;
          game.odds.lastUpdate = bookmaker.last_update;
        }
      }
    });
  }
  
  // Enrich with SportRadar data
  if (sources.sportRadarSchedule) {
    // Mark games as having SportRadar data
    const sportRadarGames = sources.sportRadarSchedule.games || [];
    
    sportRadarGames.forEach(srGame => {
      // Find matching game
      const game = games.find(g => {
        const homeMatch = g.homeTeam.name.includes(srGame.home.name) || srGame.home.name.includes(g.homeTeam.name);
        const awayMatch = g.awayTeam.name.includes(srGame.away.name) || srGame.away.name.includes(g.awayTeam.name);
        return homeMatch && awayMatch;
      });
      
      if (game) {
        // Mark as having SportRadar data
        game.dataSource.sportRadar = true;
        
        // Add SportRadar IDs
        game.sportRadarId = srGame.id;
        game.homeTeam.sportRadarId = srGame.home.id;
        game.awayTeam.sportRadarId = srGame.away.id;
        
        // Add additional data if available
        if (srGame.home_points !== undefined) {
          game.homeTeam.score = srGame.home_points;
        }
        
        if (srGame.away_points !== undefined) {
          game.awayTeam.score = srGame.away_points;
        }
      }
    });
  }
  
  // Sport-specific enrichment
  if (sport === 'NHL' && sources.nhlStats) {
    // Enrich with NHL stats
    if (sources.nhlStats.dates && sources.nhlStats.dates.length > 0) {
      const nhlGames = sources.nhlStats.dates[0].games || [];
      
      nhlGames.forEach(nhlGame => {
        // Find matching game
        const game = games.find(g => {
          const homeMatch = g.homeTeam.name.includes(nhlGame.teams.home.team.name) || 
                           nhlGame.teams.home.team.name.includes(g.homeTeam.name);
          const awayMatch = g.awayTeam.name.includes(nhlGame.teams.away.team.name) || 
                           nhlGame.teams.away.team.name.includes(g.awayTeam.name);
          return homeMatch && awayMatch;
        });
        
        if (game) {
          // Mark as having NHL stats data
          game.dataSource.nhlStats = true;
          
          // Add NHL stats
          game.nhlStats = {
            gameId: nhlGame.gamePk,
            homeTeamId: nhlGame.teams.home.team.id,
            awayTeamId: nhlGame.teams.away.team.id,
            homeScore: nhlGame.teams.home.score,
            awayScore: nhlGame.teams.away.score,
            period: nhlGame.linescore?.currentPeriod,
            timeRemaining: nhlGame.linescore?.currentPeriodTimeRemaining,
            homeShots: nhlGame.linescore?.teams?.home?.shotsOnGoal,
            awayShots: nhlGame.linescore?.teams?.away?.shotsOnGoal,
            homePowerPlay: nhlGame.linescore?.teams?.home?.powerPlay,
            awayPowerPlay: nhlGame.linescore?.teams?.away?.powerPlay
          };
          
          // Update scores if available
          if (nhlGame.teams.home.score !== undefined) {
            game.homeTeam.score = nhlGame.teams.home.score;
          }
          
          if (nhlGame.teams.away.score !== undefined) {
            game.awayTeam.score = nhlGame.teams.away.score;
          }
          
          // Update status if game is in progress
          if (nhlGame.status.abstractGameState === 'Live') {
            game.status.state = 'in';
            game.status.detail = `Period ${nhlGame.linescore?.currentPeriod}, ${nhlGame.linescore?.currentPeriodTimeRemaining}`;
          }
        }
      });
    }
  }
  
  // NCAA-specific enrichment
  if ((sport === 'NCAA_MENS' || sport === 'NCAA_WOMENS') && sources.ncaaSchedule) {
    // Mark games as having NCAA data
    const ncaaGames = sources.ncaaSchedule.games || [];
    
    ncaaGames.forEach(ncaaGame => {
      // Find matching game
      const game = games.find(g => {
        const homeMatch = g.homeTeam.name.includes(ncaaGame.home.name) || ncaaGame.home.name.includes(g.homeTeam.name);
        const awayMatch = g.awayTeam.name.includes(ncaaGame.away.name) || ncaaGame.away.name.includes(g.awayTeam.name);
        return homeMatch && awayMatch;
      });
      
      if (game) {
        // Mark as having NCAA data
        game.dataSource.ncaa = true;
        
        // Add NCAA-specific data
        game.ncaa = {
          tournamentRound: ncaaGame.tournament_round || null,
          bracketRegion: ncaaGame.bracket_region || null,
          isMarchMadness: isMarchMadnessPeriod()
        };
      }
    });
  }
  
  return games;
}

/**
 * Normalize Formula 1 data
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized races data
 */
function normalizeFormula1Data(sportData) {
  const { sources } = sportData;
  const races = [];
  
  console.log('Normalizing Formula 1 data...');
  
  // Process ESPN data
  if (sources.espn && sources.espn.events) {
    sources.espn.events.forEach(event => {
      const raceId = event.id;
      const date = new Date(event.date);
      const raceName = event.name || 'Formula 1 Race';
      const trackName = event.circuit?.fullName || 'TBD';
      const location = event.circuit?.address?.city ? 
        `${event.circuit.address.city}, ${event.circuit.address.country}` : 'TBD';
      
      // Create base race object
      const race = {
        id: raceId,
        sport: 'FORMULA1',
        date: date.toISOString(),
        timestamp: date.getTime(),
        raceName: raceName,
        trackName: trackName,
        location: location,
        status: {
          state: event.status?.type?.state || 'pre',
          detail: event.status?.type?.description || ''
        },
        drivers: [],
        odds: {
          provider: null,
          lastUpdate: null,
          driverOdds: []
        },
        dataSource: {
          espn: true,
          odds: false
        }
      };
      
      // Add to races array
      races.push(race);
    });
  }
  
  // Enrich with odds data
  if (sources.odds && Array.isArray(sources.odds)) {
    sources.odds.forEach(oddsItem => {
      // Find matching race
      const race = races.find(r => 
        r.raceName.includes(oddsItem.description) || 
        oddsItem.description.includes(r.raceName)
      );
      
      if (race) {
        // Mark as having odds data
        race.dataSource.odds = true;
        
        // Find the best odds (prefer FanDuel if available)
        const bookmaker = oddsItem.bookmakers.find(b => 
          b.key === 'fanduel' || b.title.toLowerCase().includes('fanduel')
        ) || oddsItem.bookmakers[0];
        
        if (bookmaker) {
          // Get driver odds
          const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
          if (h2hMarket && h2hMarket.outcomes) {
            race.odds.driverOdds = h2hMarket.outcomes.map(outcome => ({
              driverName: outcome.name,
              odds: outcome.price
            }));
          }
          
          // Add bookmaker info
          race.odds.provider = bookmaker.title;
          race.odds.lastUpdate = bookmaker.last_update;
        }
      }
    });
  }
  
  return races;
}

/**
 * Normalize UFC/MMA data
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized fights data
 */
function normalizeUFCData(sportData) {
  const { sources } = sportData;
  const fights = [];
  
  console.log('Normalizing UFC/MMA data...');
  
  // Process Sherdog events data
  if (sources.sherdogEvents && Array.isArray(sources.sherdogEvents)) {
    sources.sherdogEvents.forEach(event => {
      // Only process upcoming events
      const eventDate = new Date(event.date);
      if (eventDate < new Date()) {
        return;
      }
      
      // Process each fight in the event
      event.fights.forEach((fight, index) => {
        // Create base fight object
        const fightObj = {
          id: `${event.id}-${index}`,
          sport: 'UFC',
          eventId: event.id,
          eventName: event.name,
          date: eventDate.toISOString(),
          timestamp: eventDate.getTime(),
          fighter1: {
            id: fight.fighter1?.id,
            name: fight.fighter1?.name || 'TBD',
            record: fight.fighter1?.record
          },
          fighter2: {
            id: fight.fighter2?.id,
            name: fight.fighter2?.name || 'TBD',
            record: fight.fighter2?.record
          },
          weightClass: fight.weightClass || '',
          isMainEvent: index === 0,
          isTitleFight: fight.isTitleFight || false,
          rounds: fight.rounds || 3,
          status: {
            state: 'pre',
            detail: ''
          },
          odds: {
            fighter1: null,
            fighter2: null,
            provider: null,
            lastUpdate: null
          },
          dataSource: {
            sherdog: true,
            odds: false
          }
        };
        
        // Add to fights array
        fights.push(fightObj);
      });
    });
  }
  
  // Enrich with odds data
  if (sources.odds && Array.isArray(sources.odds)) {
    sources.odds.forEach(oddsItem => {
      // Find matching fight
      const fight = fights.find(f => {
        const fighter1Match = f.fighter1.name.includes(oddsItem.home_team) || 
                             oddsItem.home_team.includes(f.fighter1.name);
        const fighter2Match = f.fighter2.name.includes(oddsItem.away_team) || 
                             oddsItem.away_team.includes(f.fighter2.name);
        return fighter1Match && fighter2Match;
      });
      
      if (fight) {
        // Mark as having odds data
        fight.dataSource.odds = true;
        
        // Find the best odds (prefer FanDuel if available)
        const bookmaker = oddsItem.bookmakers.find(b => 
          b.key === 'fanduel' || b.title.toLowerCase().includes('fanduel')
        ) || oddsItem.bookmakers[0];
        
        if (bookmaker) {
          // Get moneyline odds
          const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
          if (h2hMarket && h2hMarket.outcomes) {
            const fighter1Odds = h2hMarket.outcomes.find(o => 
              o.name.includes(fight.fighter1.name) || fight.fighter1.name.includes(o.name)
            );
            const fighter2Odds = h2hMarket.outcomes.find(o => 
              o.name.includes(fight.fighter2.name) || fight.fighter2.name.includes(o.name)
            );
            
            if (fighter1Odds) {
              fight.odds.fighter1 = fighter1Odds.price;
            }
            
            if (fighter2Odds) {
              fight.odds.fighter2 = fighter2Odds.price;
            }
          }
          
          // Add bookmaker info
          fight.odds.provider = bookmaker.title;
          fight.odds.lastUpdate = bookmaker.last_update;
        }
      }
    });
  }
  
  return fights;
}

/**
 * Check if current date is during March Madness
 * @returns {boolean} - True if during March Madness
 */
function isMarchMadnessPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const marchMadnessStart = new Date(year, 2, 1); // March 1st
  const marchMadnessEnd = new Date(year, 3, 15);  // April 15th
  
  return now >= marchMadnessStart && now <= marchMadnessEnd;
}

/**
 * Normalize data for a specific sport
 * @param {string} sport - Sport key
 * @returns {Object} - Normalized data
 */
function normalizeData(sport) {
  console.log(`Normalizing data for ${sport}...`);
  
  // Load combined data
  const combinedData = loadCombinedData(sport);
  if (!combinedData) {
    console.log(`No data to normalize for ${sport}`);
    return null;
  }
  
  let normalizedData;
  
  // Normalize based on sport type
  if (sport === 'FORMULA1') {
    normalizedData = normalizeFormula1Data(combinedData);
    saveNormalizedData(sport, 'races', normalizedData);
  } else if (sport === 'UFC') {
    normalizedData = normalizeUFCData(combinedData);
    saveNormalizedData(sport, 'fights', normalizedData);
  } else {
    // Team sports (NBA, WNBA, MLB, NHL, NCAA)
    normalizedData = normalizeTeamSportData(combinedData);
    saveNormalizedData(sport, 'games', normalizedData);
  }
  
  console.log(`Normalized ${normalizedData.length} records for ${sport}`);
  return normalizedData;
}

/**
 * Normalize data for all sports
 */
async function normalizeAllSportsData() {
  console.log('Starting data normalization process...');
  
  // List of sports to normalize
  const sports = ['NBA', 'WNBA', 'MLB', 'NHL', 'NCAA_MENS', 'NCAA_WOMENS', 'FORMULA1', 'UFC'];
  
  // Normalize data for each sport
  for (const sport of sports) {
    try {
      normalizeData(sport);
    } catch (error) {
      console.error(`Error normalizing data for ${sport}:`, error);
      // Continue with next sport
    }
  }
  
  console.log('Data normalization process completed');
}

// Execute if run directly
if (require.main === module) {
  normalizeAllSportsData()
    .then(() => {
      console.log('Data normalization script completed successfully');
    })
    .catch(error => {
      console.error('Error in data normalization script:', error);
      process.exit(1);
    });
}

module.exports = {
  normalizeData,
  normalizeAllSportsData,
  normalizeTeamSportData,
  normalizeFormula1Data,
  normalizeUFCData
};