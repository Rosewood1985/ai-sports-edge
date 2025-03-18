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
 * Base normalizer for all sports
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized data
 */
function normalizeBaseData(sportData) {
  const { sport, sources } = sportData;
  const games = [];
  
  console.log(`Normalizing base data for ${sport}...`);
  
  // Process ESPN data
  if (sources.espn && sources.espn.scoreboard && sources.espn.scoreboard.events) {
    sources.espn.scoreboard.events.forEach(event => {
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
        },
        // Additional data from ESPN
        espnData: {
          gameId: gameId,
          teams: {
            home: homeTeam,
            away: awayTeam
          },
          status: event.status,
          venue: event.competitions[0]?.venue
        }
      };
      
      // Add to games array
      games.push(game);
    });
  }
  
  return games;
}

/**
 * Normalize NBA data
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized games data
 */
function normalizeNBAData(sportData) {
  const { sources } = sportData;
  
  // Get base normalized data
  const games = normalizeBaseData(sportData);
  
  console.log(`Normalizing NBA-specific data...`);
  
  // Enhance with NBA-specific data
  games.forEach(game => {
    // Add NBA-specific fields
    game.nbaData = {
      conference: null,
      division: null,
      seasonType: null,
      seasonPhase: null
    };
    
    // Add team statistics if available
    if (sources.espn && sources.espn.statistics) {
      const homeTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStats) {
        game.homeTeam.stats = {
          ppg: homeTeamStats.ppg,
          rpg: homeTeamStats.rpg,
          apg: homeTeamStats.apg,
          spg: homeTeamStats.spg,
          bpg: homeTeamStats.bpg,
          tpg: homeTeamStats.tpg,
          fgp: homeTeamStats.fgp,
          tpp: homeTeamStats.tpp,
          ftp: homeTeamStats.ftp
        };
      }
      
      if (awayTeamStats) {
        game.awayTeam.stats = {
          ppg: awayTeamStats.ppg,
          rpg: awayTeamStats.rpg,
          apg: awayTeamStats.apg,
          spg: awayTeamStats.spg,
          bpg: awayTeamStats.bpg,
          tpg: awayTeamStats.tpg,
          fgp: awayTeamStats.fgp,
          tpp: awayTeamStats.tpp,
          ftp: awayTeamStats.ftp
        };
      }
    }
    
    // Add standings data if available
    if (sources.espn && sources.espn.standings) {
      const homeTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStanding) {
        game.homeTeam.standing = {
          wins: homeTeamStanding.wins,
          losses: homeTeamStanding.losses,
          winPercent: homeTeamStanding.winPercent,
          gamesBehind: homeTeamStanding.gamesBehind,
          streak: homeTeamStanding.streak
        };
        
        // Add conference and division info
        if (homeTeamStanding.conference) {
          game.nbaData.conference = homeTeamStanding.conference.name;
        }
        
        if (homeTeamStanding.division) {
          game.nbaData.division = homeTeamStanding.division.name;
        }
      }
      
      if (awayTeamStanding) {
        game.awayTeam.standing = {
          wins: awayTeamStanding.wins,
          losses: awayTeamStanding.losses,
          winPercent: awayTeamStanding.winPercent,
          gamesBehind: awayTeamStanding.gamesBehind,
          streak: awayTeamStanding.streak
        };
      }
    }
    
    // Add game details if available
    if (sources.espn && sources.espn.gameDetails) {
      const gameDetail = sources.espn.gameDetails.find(detail =>
        detail.id === game.id
      );
      
      if (gameDetail) {
        game.nbaData.seasonType = gameDetail.seasonType;
        game.nbaData.seasonPhase = gameDetail.seasonPhase;
        
        // Add player statistics
        if (gameDetail.boxscore && gameDetail.boxscore.players) {
          game.playerStats = gameDetail.boxscore.players;
        }
      }
    }
  });
  
  return games;
}

/**
 * Normalize NFL data
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized games data
 */
function normalizeNFLData(sportData) {
  const { sources } = sportData;
  
  // Get base normalized data
  const games = normalizeBaseData(sportData);
  
  console.log(`Normalizing NFL-specific data...`);
  
  // Enhance with NFL-specific data
  games.forEach(game => {
    // Add NFL-specific fields
    game.nflData = {
      conference: null,
      division: null,
      seasonType: null,
      week: null
    };
    
    // Add team statistics if available
    if (sources.espn && sources.espn.statistics) {
      const homeTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStats) {
        game.homeTeam.stats = {
          ppg: homeTeamStats.ppg,
          ypg: homeTeamStats.ypg,
          passingYpg: homeTeamStats.passingYpg,
          rushingYpg: homeTeamStats.rushingYpg,
          defensiveYpg: homeTeamStats.defensiveYpg,
          defensivePassingYpg: homeTeamStats.defensivePassingYpg,
          defensiveRushingYpg: homeTeamStats.defensiveRushingYpg,
          turnovers: homeTeamStats.turnovers,
          takeaways: homeTeamStats.takeaways
        };
      }
      
      if (awayTeamStats) {
        game.awayTeam.stats = {
          ppg: awayTeamStats.ppg,
          ypg: awayTeamStats.ypg,
          passingYpg: awayTeamStats.passingYpg,
          rushingYpg: awayTeamStats.rushingYpg,
          defensiveYpg: awayTeamStats.defensiveYpg,
          defensivePassingYpg: awayTeamStats.defensivePassingYpg,
          defensiveRushingYpg: awayTeamStats.defensiveRushingYpg,
          turnovers: awayTeamStats.turnovers,
          takeaways: awayTeamStats.takeaways
        };
      }
    }
    
    // Add standings data if available
    if (sources.espn && sources.espn.standings) {
      const homeTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStanding) {
        game.homeTeam.standing = {
          wins: homeTeamStanding.wins,
          losses: homeTeamStanding.losses,
          ties: homeTeamStanding.ties,
          winPercent: homeTeamStanding.winPercent,
          pointsFor: homeTeamStanding.pointsFor,
          pointsAgainst: homeTeamStanding.pointsAgainst
        };
        
        // Add conference and division info
        if (homeTeamStanding.conference) {
          game.nflData.conference = homeTeamStanding.conference.name;
        }
        
        if (homeTeamStanding.division) {
          game.nflData.division = homeTeamStanding.division.name;
        }
      }
      
      if (awayTeamStanding) {
        game.awayTeam.standing = {
          wins: awayTeamStanding.wins,
          losses: awayTeamStanding.losses,
          ties: awayTeamStanding.ties,
          winPercent: awayTeamStanding.winPercent,
          pointsFor: awayTeamStanding.pointsFor,
          pointsAgainst: awayTeamStanding.pointsAgainst
        };
      }
    }
    
    // Add game details if available
    if (sources.espn && sources.espn.gameDetails) {
      const gameDetail = sources.espn.gameDetails.find(detail =>
        detail.id === game.id
      );
      
      if (gameDetail) {
        game.nflData.seasonType = gameDetail.seasonType;
        game.nflData.week = gameDetail.week;
        
        // Add player statistics
        if (gameDetail.boxscore && gameDetail.boxscore.players) {
          game.playerStats = gameDetail.boxscore.players;
        }
      }
    }
  });
  
  return games;
}

/**
 * Normalize MLB data
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized games data
 */
function normalizeMLBData(sportData) {
  const { sources } = sportData;
  
  // Get base normalized data
  const games = normalizeBaseData(sportData);
  
  console.log(`Normalizing MLB-specific data...`);
  
  // Enhance with MLB-specific data
  games.forEach(game => {
    // Add MLB-specific fields
    game.mlbData = {
      league: null,
      division: null,
      seasonType: null,
      inning: null,
      isTopInning: null
    };
    
    // Add team statistics if available
    if (sources.espn && sources.espn.statistics) {
      const homeTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStats) {
        game.homeTeam.stats = {
          avg: homeTeamStats.avg,
          runs: homeTeamStats.runs,
          homeRuns: homeTeamStats.homeRuns,
          rbi: homeTeamStats.rbi,
          obp: homeTeamStats.obp,
          slg: homeTeamStats.slg,
          ops: homeTeamStats.ops,
          era: homeTeamStats.era,
          whip: homeTeamStats.whip,
          strikeouts: homeTeamStats.strikeouts
        };
      }
      
      if (awayTeamStats) {
        game.awayTeam.stats = {
          avg: awayTeamStats.avg,
          runs: awayTeamStats.runs,
          homeRuns: awayTeamStats.homeRuns,
          rbi: awayTeamStats.rbi,
          obp: awayTeamStats.obp,
          slg: awayTeamStats.slg,
          ops: awayTeamStats.ops,
          era: awayTeamStats.era,
          whip: awayTeamStats.whip,
          strikeouts: awayTeamStats.strikeouts
        };
      }
    }
    
    // Add standings data if available
    if (sources.espn && sources.espn.standings) {
      const homeTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStanding) {
        game.homeTeam.standing = {
          wins: homeTeamStanding.wins,
          losses: homeTeamStanding.losses,
          winPercent: homeTeamStanding.winPercent,
          gamesBehind: homeTeamStanding.gamesBehind,
          streak: homeTeamStanding.streak
        };
        
        // Add league and division info
        if (homeTeamStanding.league) {
          game.mlbData.league = homeTeamStanding.league.name;
        }
        
        if (homeTeamStanding.division) {
          game.mlbData.division = homeTeamStanding.division.name;
        }
      }
      
      if (awayTeamStanding) {
        game.awayTeam.standing = {
          wins: awayTeamStanding.wins,
          losses: awayTeamStanding.losses,
          winPercent: awayTeamStanding.winPercent,
          gamesBehind: awayTeamStanding.gamesBehind,
          streak: awayTeamStanding.streak
        };
      }
    }
    
    // Add game details if available
    if (sources.espn && sources.espn.gameDetails) {
      const gameDetail = sources.espn.gameDetails.find(detail =>
        detail.id === game.id
      );
      
      if (gameDetail) {
        game.mlbData.seasonType = gameDetail.seasonType;
        
        // Add inning information
        if (gameDetail.status && gameDetail.status.type === 'STATUS_IN_PROGRESS') {
          game.mlbData.inning = gameDetail.status.period;
          game.mlbData.isTopInning = gameDetail.status.isTopInning;
        }
        
        // Add player statistics
        if (gameDetail.boxscore && gameDetail.boxscore.players) {
          game.playerStats = gameDetail.boxscore.players;
        }
      }
    }
  });
  
  return games;
}

/**
 * Normalize NHL data
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized games data
 */
function normalizeNHLData(sportData) {
  const { sources } = sportData;
  
  // Get base normalized data
  const games = normalizeBaseData(sportData);
  
  console.log(`Normalizing NHL-specific data...`);
  
  // Enhance with NHL-specific data
  games.forEach(game => {
    // Add NHL-specific fields
    game.nhlData = {
      conference: null,
      division: null,
      seasonType: null,
      period: null,
      timeRemaining: null,
      powerPlay: {
        home: false,
        away: false
      }
    };
    
    // Add NHL stats if available
    if (sources.nhlStats) {
      const nhlGame = sources.nhlStats.dates?.[0]?.games?.find(g => {
        const homeMatch = g.teams.home.team.name.includes(game.homeTeam.name) ||
                         game.homeTeam.name.includes(g.teams.home.team.name);
        const awayMatch = g.teams.away.team.name.includes(game.awayTeam.name) ||
                         game.awayTeam.name.includes(g.teams.away.team.name);
        return homeMatch && awayMatch;
      });
      
      if (nhlGame) {
        game.nhlData.period = nhlGame.linescore?.currentPeriod;
        game.nhlData.timeRemaining = nhlGame.linescore?.currentPeriodTimeRemaining;
        game.nhlData.powerPlay.home = nhlGame.linescore?.teams?.home?.powerPlay || false;
        game.nhlData.powerPlay.away = nhlGame.linescore?.teams?.away?.powerPlay || false;
        
        // Add shots on goal
        game.homeTeam.shots = nhlGame.linescore?.teams?.home?.shotsOnGoal;
        game.awayTeam.shots = nhlGame.linescore?.teams?.away?.shotsOnGoal;
      }
    }
    
    // Add team statistics if available
    if (sources.espn && sources.espn.statistics) {
      const homeTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStats) {
        game.homeTeam.stats = {
          goalsPerGame: homeTeamStats.goalsPerGame,
          goalsAgainstPerGame: homeTeamStats.goalsAgainstPerGame,
          powerPlayPct: homeTeamStats.powerPlayPct,
          penaltyKillPct: homeTeamStats.penaltyKillPct,
          shotsPerGame: homeTeamStats.shotsPerGame,
          shotsAgainstPerGame: homeTeamStats.shotsAgainstPerGame,
          faceoffWinPct: homeTeamStats.faceoffWinPct
        };
      }
      
      if (awayTeamStats) {
        game.awayTeam.stats = {
          goalsPerGame: awayTeamStats.goalsPerGame,
          goalsAgainstPerGame: awayTeamStats.goalsAgainstPerGame,
          powerPlayPct: awayTeamStats.powerPlayPct,
          penaltyKillPct: awayTeamStats.penaltyKillPct,
          shotsPerGame: awayTeamStats.shotsPerGame,
          shotsAgainstPerGame: awayTeamStats.shotsAgainstPerGame,
          faceoffWinPct: awayTeamStats.faceoffWinPct
        };
      }
    }
    
    // Add standings data if available
    if (sources.espn && sources.espn.standings) {
      const homeTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStanding) {
        game.homeTeam.standing = {
          wins: homeTeamStanding.wins,
          losses: homeTeamStanding.losses,
          otLosses: homeTeamStanding.otLosses,
          points: homeTeamStanding.points,
          goalsFor: homeTeamStanding.goalsFor,
          goalsAgainst: homeTeamStanding.goalsAgainst
        };
        
        // Add conference and division info
        if (homeTeamStanding.conference) {
          game.nhlData.conference = homeTeamStanding.conference.name;
        }
        
        if (homeTeamStanding.division) {
          game.nhlData.division = homeTeamStanding.division.name;
        }
      }
      
      if (awayTeamStanding) {
        game.awayTeam.standing = {
          wins: awayTeamStanding.wins,
          losses: awayTeamStanding.losses,
          otLosses: awayTeamStanding.otLosses,
          points: awayTeamStanding.points,
          goalsFor: awayTeamStanding.goalsFor,
          goalsAgainst: awayTeamStanding.goalsAgainst
        };
      }
    }
  });
  
  return games;
}

/**
 * Normalize NCAA basketball data
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized games data
 */
function normalizeNCAABasketballData(sportData) {
  const { sport, sources } = sportData;
  
  // Get base normalized data
  const games = normalizeBaseData(sportData);
  
  console.log(`Normalizing NCAA basketball data for ${sport}...`);
  
  // Enhance with NCAA-specific data
  games.forEach(game => {
    // Add NCAA-specific fields
    game.ncaaData = {
      conference: null,
      tournamentRound: null,
      bracketRegion: null,
      isMarchMadness: isMarchMadnessPeriod()
    };
    
    // Add NCAA data if available
    if (sources.ncaaSchedule) {
      const ncaaGame = sources.ncaaSchedule.games?.find(g => {
        const homeMatch = g.home.name.includes(game.homeTeam.name) ||
                         game.homeTeam.name.includes(g.home.name);
        const awayMatch = g.away.name.includes(game.awayTeam.name) ||
                         game.awayTeam.name.includes(g.away.name);
        return homeMatch && awayMatch;
      });
      
      if (ncaaGame) {
        game.ncaaData.tournamentRound = ncaaGame.tournament_round || null;
        game.ncaaData.bracketRegion = ncaaGame.bracket_region || null;
      }
    }
    
    // Add team statistics if available
    if (sources.espn && sources.espn.statistics) {
      const homeTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStats = sources.espn.statistics?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStats) {
        game.homeTeam.stats = {
          ppg: homeTeamStats.ppg,
          rpg: homeTeamStats.rpg,
          apg: homeTeamStats.apg,
          spg: homeTeamStats.spg,
          bpg: homeTeamStats.bpg,
          tpg: homeTeamStats.tpg,
          fgp: homeTeamStats.fgp,
          tpp: homeTeamStats.tpp,
          ftp: homeTeamStats.ftp
        };
      }
      
      if (awayTeamStats) {
        game.awayTeam.stats = {
          ppg: awayTeamStats.ppg,
          rpg: awayTeamStats.rpg,
          apg: awayTeamStats.apg,
          spg: awayTeamStats.spg,
          bpg: awayTeamStats.bpg,
          tpg: awayTeamStats.tpg,
          fgp: awayTeamStats.fgp,
          tpp: awayTeamStats.tpp,
          ftp: awayTeamStats.ftp
        };
      }
    }
    
    // Add standings data if available
    if (sources.espn && sources.espn.standings) {
      const homeTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.homeTeam.id
      );
      
      const awayTeamStanding = sources.espn.standings?.teams?.find(team =>
        team.id === game.awayTeam.id
      );
      
      if (homeTeamStanding) {
        game.homeTeam.standing = {
          wins: homeTeamStanding.wins,
          losses: homeTeamStanding.losses,
          winPercent: homeTeamStanding.winPercent,
          conferenceWins: homeTeamStanding.conferenceWins,
          conferenceLosses: homeTeamStanding.conferenceLosses
        };
        
        // Add conference info
        if (homeTeamStanding.conference) {
          game.ncaaData.conference = homeTeamStanding.conference.name;
        }
      }
      
      if (awayTeamStanding) {
        game.awayTeam.standing = {
          wins: awayTeamStanding.wins,
          losses: awayTeamStanding.losses,
          winPercent: awayTeamStanding.winPercent,
          conferenceWins: awayTeamStanding.conferenceWins,
          conferenceLosses: awayTeamStanding.conferenceLosses
        };
      }
    }
  });
  
  return games;
}

/**
 * Normalize team sports data (NBA, WNBA, MLB, NHL, NCAA)
 * @param {Object} sportData - Combined sport data
 * @returns {Array} - Normalized games data
 */
function normalizeTeamSportData(sportData) {
  const { sport } = sportData;
  
  // Use sport-specific normalizers
  switch (sport) {
    case 'NBA':
      return normalizeNBAData(sportData);
    case 'WNBA':
      return normalizeNBAData(sportData); // Use NBA normalizer for WNBA
    case 'MLB':
      return normalizeMLBData(sportData);
    case 'NHL':
      return normalizeNHLData(sportData);
    case 'NCAA_MENS':
    case 'NCAA_WOMENS':
      return normalizeNCAABasketballData(sportData);
    default:
      // Fallback to base normalizer
      return normalizeBaseData(sportData);
  }
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
  normalizeBaseData,
  normalizeTeamSportData,
  normalizeNBAData,
  normalizeNFLData,
  normalizeMLBData,
  normalizeNHLData,
  normalizeNCAABasketballData,
  normalizeFormula1Data,
  normalizeUFCData
};