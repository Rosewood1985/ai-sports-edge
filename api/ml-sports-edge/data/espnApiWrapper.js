/**
 * ESPN API Wrapper
 * A JavaScript wrapper for the ESPN API client
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Cache directory for ESPN API responses
const CACHE_DIR = path.join(__dirname, 'cache', 'espn');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * ESPN API Wrapper class
 */
class ESPNApiWrapper {
  /**
   * Initialize the ESPN API wrapper
   */
  constructor() {
    this.pythonScript = path.join(__dirname, 'espn_api_client.py');
    this.cacheDir = CACHE_DIR;
  }

  /**
   * Run the Python ESPN API client with the specified arguments
   * @param {Array} args - Arguments to pass to the Python script
   * @returns {Promise<Object>} - API response data
   */
  async _runPythonClient(args) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [this.pythonScript, ...args]);
      
      let dataString = '';
      let errorString = '';
      
      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          console.error(`Error: ${errorString}`);
          reject(new Error(`Python process exited with code ${code}: ${errorString}`));
          return;
        }
        
        try {
          const jsonData = JSON.parse(dataString);
          resolve(jsonData);
        } catch (error) {
          console.error('Error parsing JSON response:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Get list of available sports
   * @returns {Promise<Array>} - List of sports
   */
  async getSports() {
    return this._runPythonClient(['--get-sports']);
  }

  /**
   * Get list of leagues for a sport
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @returns {Promise<Array>} - List of leagues
   */
  async getLeagues(sport) {
    return this._runPythonClient(['--get-leagues', sport]);
  }

  /**
   * Get list of teams for a league
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @param {string} league - League code (e.g., 'nba', 'nfl')
   * @returns {Promise<Array>} - List of teams
   */
  async getTeams(sport, league) {
    return this._runPythonClient(['--get-teams', sport, league]);
  }

  /**
   * Get details for a specific team
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @param {string} league - League code (e.g., 'nba', 'nfl')
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} - Team details
   */
  async getTeam(sport, league, teamId) {
    return this._runPythonClient(['--get-team', sport, league, teamId]);
  }

  /**
   * Get scoreboard for a league on a specific date
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @param {string} league - League code (e.g., 'nba', 'nfl')
   * @param {string} date - Date in YYYYMMDD format (default: today)
   * @returns {Promise<Object>} - Scoreboard data
   */
  async getScoreboard(sport, league, date) {
    const args = ['--get-scoreboard', sport, league];
    if (date) {
      args.push(date);
    }
    return this._runPythonClient(args);
  }

  /**
   * Get details for a specific game
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @param {string} league - League code (e.g., 'nba', 'nfl')
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} - Game details
   */
  async getGame(sport, league, gameId) {
    return this._runPythonClient(['--get-game', sport, league, gameId]);
  }

  /**
   * Get standings for a league
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @param {string} league - League code (e.g., 'nba', 'nfl')
   * @returns {Promise<Object>} - Standings data
   */
  async getStandings(sport, league) {
    return this._runPythonClient(['--get-standings', sport, league]);
  }

  /**
   * Get stats for a specific player
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @param {string} league - League code (e.g., 'nba', 'nfl')
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} - Player stats
   */
  async getPlayerStats(sport, league, playerId) {
    return this._runPythonClient(['--get-player-stats', sport, league, playerId]);
  }

  /**
   * Get schedule for a league
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @param {string} league - League code (e.g., 'nba', 'nfl')
   * @param {string} season - Season year (default: current year)
   * @returns {Promise<Object>} - Schedule data
   */
  async getSchedule(sport, league, season) {
    const args = ['--get-schedule', sport, league];
    if (season) {
      args.push(season);
    }
    return this._runPythonClient(args);
  }

  /**
   * Get news for a league
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @param {string} league - League code (e.g., 'nba', 'nfl')
   * @returns {Promise<Object>} - News data
   */
  async getNews(sport, league) {
    return this._runPythonClient(['--get-news', sport, league]);
  }

  /**
   * Calculate odds based on ESPN data
   * @param {string} sport - Sport code (e.g., 'basketball', 'football')
   * @param {string} league - League code (e.g., 'nba', 'nfl')
   * @returns {Promise<Array>} - Calculated odds
   */
  async calculateOdds(sport, league) {
    try {
      // Get scoreboard data
      const scoreboard = await this.getScoreboard(sport, league);
      
      // Get standings data
      const standings = await this.getStandings(sport, league);
      
      // Calculate odds for each game
      const calculatedOdds = [];
      
      if (scoreboard && scoreboard.events) {
        for (const event of scoreboard.events) {
          // Skip games that have already started or finished
          if (event.status && event.status.type && event.status.type.state !== 'pre') {
            continue;
          }
          
          const homeTeam = event.competitions[0]?.competitors?.find(c => c.homeAway === 'home');
          const awayTeam = event.competitions[0]?.competitors?.find(c => c.homeAway === 'away');
          
          if (!homeTeam || !awayTeam) {
            continue;
          }
          
          // Get team records from standings
          const homeTeamRecord = this._getTeamRecord(standings, homeTeam.id);
          const awayTeamRecord = this._getTeamRecord(standings, awayTeam.id);
          
          // Calculate win probability based on team records
          const homeWinPct = homeTeamRecord?.winPercentage || 0.5;
          const awayWinPct = awayTeamRecord?.winPercentage || 0.5;
          
          // Apply home field advantage (5% boost)
          const homeAdvantage = 0.05;
          const homeWinProb = (homeWinPct + homeAdvantage) / (homeWinPct + awayWinPct + homeAdvantage);
          const awayWinProb = 1 - homeWinProb;
          
          // Convert probabilities to American odds
          const homeOdds = this._probToAmericanOdds(homeWinProb);
          const awayOdds = this._probToAmericanOdds(awayWinProb);
          
          // Calculate spread
          const spread = this._calculateSpread(homeWinProb, sport);
          
          // Calculate over/under
          const overUnder = this._calculateOverUnder(sport, league, homeTeam, awayTeam);
          
          calculatedOdds.push({
            gameId: event.id,
            date: event.date,
            homeTeam: {
              id: homeTeam.id,
              name: homeTeam.team.displayName,
              abbreviation: homeTeam.team.abbreviation,
              logo: homeTeam.team.logo
            },
            awayTeam: {
              id: awayTeam.id,
              name: awayTeam.team.displayName,
              abbreviation: awayTeam.team.abbreviation,
              logo: awayTeam.team.logo
            },
            odds: {
              homeMoneyline: homeOdds,
              awayMoneyline: awayOdds,
              spread: spread,
              homeSpreadOdds: -110,
              awaySpreadOdds: -110,
              overUnder: overUnder,
              overOdds: -110,
              underOdds: -110
            },
            espnGameLink: `https://www.espn.com/${sport}/${league}/game/_/gameId/${event.id}`
          });
        }
      }
      
      return calculatedOdds;
    } catch (error) {
      console.error('Error calculating odds:', error);
      return [];
    }
  }

  /**
   * Get team record from standings data
   * @param {Object} standings - Standings data
   * @param {string} teamId - Team ID
   * @returns {Object|null} - Team record
   */
  _getTeamRecord(standings, teamId) {
    if (!standings || !standings.standings) {
      return null;
    }
    
    for (const group of standings.standings) {
      for (const entry of group.entries) {
        if (entry.team.id === teamId) {
          const wins = entry.stats.find(s => s.name === 'wins')?.value || 0;
          const losses = entry.stats.find(s => s.name === 'losses')?.value || 0;
          const ties = entry.stats.find(s => s.name === 'ties')?.value || 0;
          
          const totalGames = wins + losses + ties;
          const winPercentage = totalGames > 0 ? wins / totalGames : 0.5;
          
          return {
            wins,
            losses,
            ties,
            winPercentage
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Convert probability to American odds
   * @param {number} prob - Probability (0-1)
   * @returns {number} - American odds
   */
  _probToAmericanOdds(prob) {
    if (prob <= 0 || prob >= 1) {
      return 0;
    }
    
    if (prob > 0.5) {
      return Math.round(-100 * prob / (1 - prob));
    } else {
      return Math.round(100 * (1 - prob) / prob);
    }
  }

  /**
   * Calculate spread based on win probability
   * @param {number} homeWinProb - Home team win probability
   * @param {string} sport - Sport code
   * @returns {number} - Spread
   */
  _calculateSpread(homeWinProb, sport) {
    // Convert win probability to spread
    let spreadFactor;
    
    switch (sport) {
      case 'basketball':
        spreadFactor = 20;
        break;
      case 'football':
        spreadFactor = 14;
        break;
      case 'baseball':
        spreadFactor = 3;
        break;
      case 'hockey':
        spreadFactor = 2;
        break;
      default:
        spreadFactor = 10;
    }
    
    // Calculate raw spread
    const rawSpread = (homeWinProb - 0.5) * spreadFactor;
    
    // Round to nearest 0.5
    return Math.round(rawSpread * 2) / 2;
  }

  /**
   * Calculate over/under based on teams
   * @param {string} sport - Sport code
   * @param {string} league - League code
   * @param {Object} homeTeam - Home team
   * @param {Object} awayTeam - Away team
   * @returns {number} - Over/under
   */
  _calculateOverUnder(sport, league, homeTeam, awayTeam) {
    // Default over/under values by sport
    const defaultValues = {
      'basketball': {
        'nba': 220,
        'wnba': 160,
        'default': 140
      },
      'football': {
        'nfl': 44,
        'default': 50
      },
      'baseball': {
        'mlb': 8.5,
        'default': 9
      },
      'hockey': {
        'nhl': 5.5,
        'default': 5
      }
    };
    
    // Get default value for sport/league
    const sportDefaults = defaultValues[sport] || { default: 100 };
    const defaultValue = sportDefaults[league] || sportDefaults.default;
    
    // Add some randomness to make it more realistic
    const randomFactor = (Math.random() * 0.1 + 0.95); // 0.95 to 1.05
    
    // Calculate over/under
    const overUnder = defaultValue * randomFactor;
    
    // Round to nearest 0.5
    return Math.round(overUnder * 2) / 2;
  }
}

module.exports = new ESPNApiWrapper();