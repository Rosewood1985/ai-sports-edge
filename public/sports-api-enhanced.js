/**
 * Enhanced Sports API Integration
 * Version 1.0.0
 * 
 * Includes support for:
 * - NBA, MLB, NHL (existing)
 * - WNBA (new)
 * - NCAA Men's and Women's Basketball (new)
 * - Formula 1 (new)
 * 
 * Integrates with FanDuel for betting odds
 */

// Configuration
const CONFIG = {
  // API endpoints
  API_ENDPOINTS: {
    NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    WNBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
    MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    NCAA_MENS: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
    NCAA_WOMENS: 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard',
    FORMULA1: 'https://site.api.espn.com/apis/site/v2/racing/f1/scoreboard'
  },
  
  // NHL Stats API endpoints (no auth required)
  NHL_API: {
    BASE_URL: 'https://api-web.nhl.com',
    LEGACY_URL: 'https://statsapi.web.nhl.com',
    ENDPOINTS: {
      SCHEDULE: '/api/v1/schedule',
      TEAMS: '/api/v1/teams',
      STANDINGS: '/api/v1/standings',
      PLAYER_STATS: '/api/v1/people',
      GAME_STATS: '/api/v1/game'
    }
  },
  
  // Odds API configuration
  ODDS_API: {
    BASE_URL: 'https://api.the-odds-api.com/v4',
    API_KEY: 'fdf4ad2d50a6b6d2ca77e52734851aa4', // User-provided API key
    SPORTS: {
      NBA: 'basketball_nba',
      WNBA: 'basketball_wnba',
      MLB: 'baseball_mlb',
      NHL: 'icehockey_nhl',
      NCAA_MENS: 'basketball_ncaa',
      NCAA_WOMENS: 'basketball_ncaaw',
      FORMULA1: 'motorsport_f1'
    }
  },
  
  // FanDuel affiliate configuration
  FANDUEL: {
    BASE_URL: 'https://account.sportsbook.fanduel.com/join',
    AFFILIATE_ID: 'ai-sports-edge',
    DEEP_LINK_BASE: 'https://sportsbook.fanduel.com/navigation/'
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_WNBA: true,
    ENABLE_NCAA: true,
    ENABLE_FORMULA1: true,
    ENABLE_FANDUEL_LINKS: true,
    PREMIUM_PREDICTIONS: true
  },
  
  // Cache settings
  CACHE: {
    EXPIRY_MINUTES: 15
  }
};

// Main class for sports data handling
class SportsDataService {
  constructor() {
    this.cache = {};
    this.oddsCache = {};
    this.activeSports = this.getActiveSports();
    
    // Initialize cache
    this.activeSports.forEach(sport => {
      this.cache[sport] = {
        data: null,
        timestamp: null
      };
      
      this.oddsCache[sport] = {
        data: null,
        timestamp: null
      };
    });
  }
  
  // Get list of active sports based on feature flags and season
  getActiveSports() {
    const sports = ['NBA', 'MLB', 'NHL']; // Base sports
    
    if (CONFIG.FEATURES.ENABLE_WNBA) {
      sports.push('WNBA');
    }
    
    if (CONFIG.FEATURES.ENABLE_NCAA) {
      sports.push('NCAA_MENS', 'NCAA_WOMENS');
    }
    
    if (CONFIG.FEATURES.ENABLE_FORMULA1) {
      sports.push('FORMULA1');
    }
    
    return sports;
  }
  
  // Check if cache is valid
  isCacheValid(sport, cacheType = 'cache') {
    const cache = cacheType === 'oddsCache' ? this.oddsCache : this.cache;
    
    if (!cache[sport] || !cache[sport].timestamp) {
      return false;
    }
    
    const now = new Date();
    const cacheTime = new Date(cache[sport].timestamp);
    const diffMinutes = Math.floor((now - cacheTime) / (1000 * 60));
    
    return diffMinutes < CONFIG.CACHE.EXPIRY_MINUTES;
  }
  
  // Fetch odds data from the Odds API
  async fetchOddsData(sport) {
    // Check if we have a valid mapping for this sport
    const sportKey = CONFIG.ODDS_API.SPORTS[sport];
    if (!sportKey) {
      console.log(`No Odds API mapping for ${sport}`);
      return null;
    }
    
    // Check cache first
    if (this.oddsCache[sport] && this.oddsCache[sport].data && this.isCacheValid(sport, 'oddsCache')) {
      console.log(`Using cached odds data for ${sport}`);
      return this.oddsCache[sport].data;
    }
    
    try {
      const url = `${CONFIG.ODDS_API.BASE_URL}/sports/${sportKey}/odds?apiKey=${CONFIG.ODDS_API.API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
      
      console.log(`Fetching odds data for ${sport}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Odds API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update odds cache
      this.oddsCache[sport] = {
        data: data,
        timestamp: new Date()
      };
      
      return data;
    } catch (error) {
      console.error(`Error fetching odds data for ${sport}:`, error);
      return null;
    }
  }
  
  // Merge odds data with game data
  mergeOddsWithGames(games, oddsData, sport) {
    return games.map(game => {
      // Try to find matching odds
      const matchingOdds = this.findMatchingOdds(game, oddsData, sport);
      
      if (matchingOdds) {
        // Get the best odds from FanDuel if available, otherwise use the first bookmaker
        const fanduelOdds = matchingOdds.bookmakers.find(b =>
          b.key === 'fanduel' || b.title.toLowerCase().includes('fanduel')
        );
        
        const bookmaker = fanduelOdds || matchingOdds.bookmakers[0];
        
        if (bookmaker) {
          // Get spread
          const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
          const spread = spreadsMarket ? this.getSpreadValue(spreadsMarket.outcomes, game.homeTeam) : null;
          
          // Get over/under
          const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');
          const overUnder = totalsMarket ? totalsMarket.outcomes[0].point : null;
          
          // Get moneyline
          const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
          const homeOdds = h2hMarket ? this.getTeamOdds(h2hMarket.outcomes, game.homeTeam) : null;
          const awayOdds = h2hMarket ? this.getTeamOdds(h2hMarket.outcomes, game.awayTeam) : null;
          
          return {
            ...game,
            spread: spread !== null ? spread.toString() : game.spread,
            overUnder: overUnder !== null ? overUnder.toString() : game.overUnder,
            homeOdds: homeOdds,
            awayOdds: awayOdds,
            oddsProvider: bookmaker.title,
            hasRealOdds: true
          };
        }
      }
      
      return game;
    });
  }
  
  // Find matching odds for a game
  findMatchingOdds(game, oddsData, sport) {
    if (sport === 'FORMULA1') {
      // For F1, match by race name
      return oddsData.find(odds =>
        odds.home_team?.includes(game.raceName) ||
        odds.away_team?.includes(game.raceName) ||
        odds.description?.includes(game.raceName)
      );
    } else {
      // For team sports, match by team names
      return oddsData.find(odds => {
        const homeMatch = this.isTeamMatch(odds.home_team, game.homeTeam);
        const awayMatch = this.isTeamMatch(odds.away_team, game.awayTeam);
        return homeMatch && awayMatch;
      });
    }
  }
  
  // Check if team names match (handling variations in team names)
  isTeamMatch(oddsTeam, gameTeam) {
    if (!oddsTeam || !gameTeam) return false;
    
    const normalize = (name) => name.toLowerCase().replace(/\s+/g, '');
    const oddsNormalized = normalize(oddsTeam);
    const gameNormalized = normalize(gameTeam);
    
    return oddsNormalized.includes(gameNormalized) || gameNormalized.includes(oddsNormalized);
  }
  
  // Get spread value for a team
  getSpreadValue(outcomes, teamName) {
    if (!outcomes || !outcomes.length) return null;
    
    const teamOutcome = outcomes.find(outcome => this.isTeamMatch(outcome.name, teamName));
    return teamOutcome ? teamOutcome.point : null;
  }
  
  // Get moneyline odds for a team
  getTeamOdds(outcomes, teamName) {
    if (!outcomes || !outcomes.length) return null;
    
    const teamOutcome = outcomes.find(outcome => this.isTeamMatch(outcome.name, teamName));
    return teamOutcome ? teamOutcome.price : null;
  }
  
  // Fetch data for a specific sport
  async fetchSportData(sport) {
    if (this.isCacheValid(sport)) {
      console.log(`Using cached data for ${sport}`);
      return this.cache[sport].data;
    }
    
    try {
      const endpoint = CONFIG.API_ENDPOINTS[sport];
      if (!endpoint) {
        throw new Error(`No endpoint configured for ${sport}`);
      }
      
      console.log(`Fetching ${sport} data from API`);
      const response = await fetch(endpoint);
      const data = await response.json();
      
      // Process data based on sport type
      let processedData;
      if (sport === 'FORMULA1') {
        processedData = this.processFormula1Data(data);
      } else if (sport.includes('NCAA')) {
        processedData = this.processNCAAData(data, sport);
      } else {
        processedData = this.processTeamSportData(data, sport);
      }
      
      // Fetch odds data if available
      const oddsData = await this.fetchOddsData(sport);
      
      // Merge odds data with game data
      if (oddsData && oddsData.length > 0) {
        processedData = this.mergeOddsWithGames(processedData, oddsData, sport);
      }
      
      // Update cache
      this.cache[sport] = {
        data: processedData,
        timestamp: new Date()
      };
      
      return processedData;
    } catch (error) {
      console.error(`Error fetching ${sport} data:`, error);
      // Return fallback data if available
      return this.getFallbackData(sport);
    }
  }
  
  // Process team sports data (NBA, WNBA, MLB, NHL, NCAA)
  processTeamSportData(data, sportType) {
    if (!data.events || !Array.isArray(data.events)) {
      return [];
    }
    
    const games = data.events.map(event => {
      const date = new Date(event.date);
      const competitors = event.competitions[0]?.competitors || [];
      const homeTeam = competitors.find(team => team.homeAway === 'home')?.team.displayName || 'TBD';
      const awayTeam = competitors.find(team => team.homeAway === 'away')?.team.displayName || 'TBD';
      
      // Get odds if available
      const odds = event.competitions[0]?.odds?.[0] || null;
      const spread = odds?.spread || null;
      const overUnder = odds?.overUnder || null;
      
      // Get team IDs for NHL stats API
      const homeTeamId = competitors.find(team => team.homeAway === 'home')?.team.id;
      const awayTeamId = competitors.find(team => team.homeAway === 'away')?.team.id;
      
      return {
        id: event.id,
        date: date,
        formattedDate: this.formatDate(date),
        formattedTime: this.formatTime(date),
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        league: sportType,
        status: event.status?.type?.state || 'pre',
        spread: spread,
        overUnder: overUnder,
        // Generate FanDuel link if enabled
        fanduelLink: CONFIG.FEATURES.ENABLE_FANDUEL_LINKS ?
          this.generateFanduelLink(sportType, event.id, homeTeam, awayTeam) : null,
        isPremium: this.isPremiumGame(sportType, homeTeam, awayTeam),
        // Additional stats will be populated for NHL games
        stats: null
      };
    });
    
    // If this is NHL data, fetch additional stats
    if (sportType === 'NHL') {
      this.enrichWithNHLStats(games);
    }
    
    return games;
  }
  
  // Fetch NHL stats and enrich game data
  async enrichWithNHLStats(games) {
    try {
      // Only process games that have valid team IDs
      const validGames = games.filter(game => game.homeTeamId && game.awayTeamId);
      
      if (validGames.length === 0) {
        console.log('No valid NHL games to enrich with stats');
        return;
      }
      
      // Get today's date in YYYY-MM-DD format for the NHL API
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      // Fetch schedule with stats
      const scheduleUrl = `${CONFIG.NHL_API.BASE_URL}${CONFIG.NHL_API.ENDPOINTS.SCHEDULE}?date=${dateStr}&expand=schedule.linescore`;
      console.log(`Fetching NHL schedule from: ${scheduleUrl}`);
      
      const response = await fetch(scheduleUrl);
      const data = await response.json();
      
      if (!data.dates || !data.dates[0] || !data.dates[0].games) {
        console.log('No NHL games found in schedule');
        return;
      }
      
      // Process each game and add stats
      const nhlGames = data.dates[0].games;
      
      for (const game of validGames) {
        // Find matching NHL game
        const nhlGame = nhlGames.find(ng => {
          const homeTeam = ng.teams.home.team.name;
          const awayTeam = ng.teams.away.team.name;
          
          return (homeTeam.includes(game.homeTeam) || game.homeTeam.includes(homeTeam)) &&
                 (awayTeam.includes(game.awayTeam) || game.awayTeam.includes(awayTeam));
        });
        
        if (nhlGame) {
          // Add stats to the game object
          game.stats = {
            homeGoals: nhlGame.teams.home.score,
            awayGoals: nhlGame.teams.away.score,
            period: nhlGame.linescore?.currentPeriod,
            timeRemaining: nhlGame.linescore?.currentPeriodTimeRemaining,
            homeShots: nhlGame.linescore?.teams?.home?.shotsOnGoal,
            awayShots: nhlGame.linescore?.teams?.away?.shotsOnGoal,
            homePowerPlay: nhlGame.linescore?.teams?.home?.powerPlay,
            awayPowerPlay: nhlGame.linescore?.teams?.away?.powerPlay
          };
          
          // If the game is in progress, update the status
          if (nhlGame.status.abstractGameState === 'Live') {
            game.status = 'in';
          }
        }
      }
      
      console.log('NHL games enriched with stats');
    } catch (error) {
      console.error('Error enriching NHL games with stats:', error);
    }
  }
  
  // Fetch NHL team stats
  async fetchNHLTeamStats(teamId) {
    try {
      const url = `${CONFIG.NHL_API.BASE_URL}${CONFIG.NHL_API.ENDPOINTS.TEAMS}/${teamId}/stats`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.stats || !data.stats[0] || !data.stats[0].splits || !data.stats[0].splits[0]) {
        return null;
      }
      
      return data.stats[0].splits[0].stat;
    } catch (error) {
      console.error(`Error fetching NHL team stats for team ${teamId}:`, error);
      return null;
    }
  }
  
  // Fetch NHL player stats
  async fetchNHLPlayerStats(playerId) {
    try {
      const url = `${CONFIG.NHL_API.BASE_URL}${CONFIG.NHL_API.ENDPOINTS.PLAYER_STATS}/${playerId}/stats?stats=statsSingleSeason`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.stats || !data.stats[0] || !data.stats[0].splits || !data.stats[0].splits[0]) {
        return null;
      }
      
      return data.stats[0].splits[0].stat;
    } catch (error) {
      console.error(`Error fetching NHL player stats for player ${playerId}:`, error);
      return null;
    }
  }
  
  // Process NCAA basketball data
  processNCAAData(data, sportType) {
    // Similar to team sports but with tournament-specific info
    const games = this.processTeamSportData(data, sportType);
    
    // Add tournament round information if available
    return games.map(game => {
      const event = data.events.find(e => e.id === game.id);
      const tournamentInfo = event?.competitions[0]?.notes || [];
      const roundNote = tournamentInfo.find(note => note.type === 'event');
      
      return {
        ...game,
        tournamentRound: roundNote?.headline || null,
        isMarchMadness: this.isMarchMadnessPeriod(),
        bracketRegion: this.getBracketRegion(event)
      };
    });
  }
  
  // Process Formula 1 data
  processFormula1Data(data) {
    if (!data.events || !Array.isArray(data.events)) {
      return [];
    }
    
    return data.events.map(event => {
      const date = new Date(event.date);
      const raceName = event.name || 'Formula 1 Race';
      const trackName = event.circuit?.fullName || 'TBD';
      const location = event.circuit?.address?.city ? 
        `${event.circuit.address.city}, ${event.circuit.address.country}` : 'TBD';
      
      return {
        id: event.id,
        date: date,
        formattedDate: this.formatDate(date),
        formattedTime: this.formatTime(date),
        raceName: raceName,
        trackName: trackName,
        location: location,
        league: 'FORMULA1',
        status: event.status?.type?.state || 'pre',
        // Generate FanDuel link if enabled
        fanduelLink: CONFIG.FEATURES.ENABLE_FANDUEL_LINKS ? 
          this.generateFanduelLink('FORMULA1', event.id, null, null, raceName) : null,
        isPremium: true // F1 predictions are premium by default
      };
    });
  }
  
  // Check if current date is during March Madness
  isMarchMadnessPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const marchMadnessStart = new Date(year, 2, 1); // March 1st
    const marchMadnessEnd = new Date(year, 3, 15);  // April 15th
    
    return now >= marchMadnessStart && now <= marchMadnessEnd;
  }
  
  // Get bracket region for NCAA games
  getBracketRegion(event) {
    if (!event || !event.competitions || !event.competitions[0]) {
      return null;
    }
    
    const notes = event.competitions[0].notes || [];
    const bracketNote = notes.find(note => note.type === 'bracket');
    
    return bracketNote?.headline || null;
  }
  
  // Generate FanDuel deep link
  generateFanduelLink(sportType, gameId, homeTeam, awayTeam, raceName = null) {
    if (!CONFIG.FEATURES.ENABLE_FANDUEL_LINKS) {
      return null;
    }
    
    let path = '';
    
    switch (sportType) {
      case 'NBA':
        path = 'nba';
        break;
      case 'WNBA':
        path = 'wnba';
        break;
      case 'MLB':
        path = 'mlb';
        break;
      case 'NHL':
        path = 'nhl';
        break;
      case 'NCAA_MENS':
        path = 'college-basketball';
        break;
      case 'NCAA_WOMENS':
        path = 'womens-college-basketball';
        break;
      case 'FORMULA1':
        path = 'formula-1';
        break;
      default:
        path = 'all';
    }
    
    let deepLink = `${CONFIG.FANDUEL.DEEP_LINK_BASE}${path}`;
    
    // Add game-specific parameters
    if (gameId) {
      deepLink += `?gameId=${gameId}`;
    }
    
    // Add affiliate ID
    deepLink += `&affid=${CONFIG.FANDUEL.AFFILIATE_ID}`;
    
    return deepLink;
  }
  
  // Determine if a game should be marked as premium
  isPremiumGame(sportType, homeTeam, awayTeam) {
    if (!CONFIG.FEATURES.PREMIUM_PREDICTIONS) {
      return false;
    }
    
    // Mark all NCAA tournament games as premium during March Madness
    if ((sportType === 'NCAA_MENS' || sportType === 'NCAA_WOMENS') && this.isMarchMadnessPeriod()) {
      return true;
    }
    
    // Mark all WNBA playoff games as premium
    if (sportType === 'WNBA' && this.isPlayoffPeriod('WNBA')) {
      return true;
    }
    
    // For other sports, use a combination of team popularity and game importance
    const popularTeams = {
      'NBA': ['Lakers', 'Celtics', 'Warriors', 'Bucks', 'Nets'],
      'WNBA': ['Aces', 'Liberty', 'Sparks', 'Mercury', 'Sky'],
      'MLB': ['Yankees', 'Dodgers', 'Red Sox', 'Cubs', 'Braves'],
      'NHL': ['Maple Leafs', 'Rangers', 'Bruins', 'Blackhawks', 'Penguins']
    };
    
    const sportTeams = popularTeams[sportType] || [];
    
    // If both teams are popular, mark as premium
    if (sportTeams.some(team => homeTeam.includes(team)) && 
        sportTeams.some(team => awayTeam.includes(team))) {
      return true;
    }
    
    // Default to non-premium
    return false;
  }
  
  // Check if current date is during playoff period for a sport
  isPlayoffPeriod(sportType) {
    const now = new Date();
    const month = now.getMonth();
    
    switch (sportType) {
      case 'NBA':
        return month >= 3 && month <= 5; // April to June
      case 'WNBA':
        return month >= 8 && month <= 9; // September to October
      case 'MLB':
        return month >= 9 && month <= 10; // October to November
      case 'NHL':
        return month >= 3 && month <= 5; // April to June
      default:
        return false;
    }
  }
  
  // Format date as "MMM DD"
  formatDate(date) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
  
  // Format time as "h:MM AM/PM ET"
  formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm} ET`;
  }
  
  // Get fallback data for a sport
  getFallbackData(sport) {
    console.log(`Using fallback data for ${sport}`);
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    switch (sport) {
      case 'NBA':
        return [
          {
            id: 'nba1',
            date: today,
            formattedDate: this.formatDate(today),
            formattedTime: '7:30 PM ET',
            homeTeam: 'Lakers',
            awayTeam: 'Nuggets',
            league: 'NBA',
            status: 'pre',
            spread: '-3.5',
            overUnder: '224.5',
            fanduelLink: this.generateFanduelLink('NBA', 'nba1', 'Lakers', 'Nuggets'),
            isPremium: true
          },
          {
            id: 'nba2',
            date: today,
            formattedDate: this.formatDate(today),
            formattedTime: '8:00 PM ET',
            homeTeam: 'Celtics',
            awayTeam: 'Bucks',
            league: 'NBA',
            status: 'pre',
            spread: '-1.5',
            overUnder: '220.5',
            fanduelLink: this.generateFanduelLink('NBA', 'nba2', 'Celtics', 'Bucks'),
            isPremium: true
          }
        ];
        
      case 'WNBA':
        return [
          {
            id: 'wnba1',
            date: today,
            formattedDate: this.formatDate(today),
            formattedTime: '7:00 PM ET',
            homeTeam: 'Liberty',
            awayTeam: 'Aces',
            league: 'WNBA',
            status: 'pre',
            spread: '-2.5',
            overUnder: '168.5',
            fanduelLink: this.generateFanduelLink('WNBA', 'wnba1', 'Liberty', 'Aces'),
            isPremium: true
          },
          {
            id: 'wnba2',
            date: tomorrow,
            formattedDate: this.formatDate(tomorrow),
            formattedTime: '3:30 PM ET',
            homeTeam: 'Sparks',
            awayTeam: 'Mercury',
            league: 'WNBA',
            status: 'pre',
            spread: '-1.5',
            overUnder: '165.0',
            fanduelLink: this.generateFanduelLink('WNBA', 'wnba2', 'Sparks', 'Mercury'),
            isPremium: false
          }
        ];
        
      case 'MLB':
        return [
          {
            id: 'mlb1',
            date: today,
            formattedDate: this.formatDate(today),
            formattedTime: '7:05 PM ET',
            homeTeam: 'Yankees',
            awayTeam: 'Red Sox',
            league: 'MLB',
            status: 'pre',
            spread: '-1.5',
            overUnder: '8.5',
            fanduelLink: this.generateFanduelLink('MLB', 'mlb1', 'Yankees', 'Red Sox'),
            isPremium: true
          },
          {
            id: 'mlb2',
            date: tomorrow,
            formattedDate: this.formatDate(tomorrow),
            formattedTime: '1:10 PM ET',
            homeTeam: 'Dodgers',
            awayTeam: 'Giants',
            league: 'MLB',
            status: 'pre',
            spread: '-2.0',
            overUnder: '7.5',
            fanduelLink: this.generateFanduelLink('MLB', 'mlb2', 'Dodgers', 'Giants'),
            isPremium: false
          }
        ];
        
      case 'NHL':
        return [
          {
            id: 'nhl1',
            date: today,
            formattedDate: this.formatDate(today),
            formattedTime: '7:00 PM ET',
            homeTeam: 'Avalanche',
            awayTeam: 'Lightning',
            league: 'NHL',
            status: 'pre',
            spread: '-1.5',
            overUnder: '6.0',
            fanduelLink: this.generateFanduelLink('NHL', 'nhl1', 'Avalanche', 'Lightning'),
            isPremium: false
          },
          {
            id: 'nhl2',
            date: tomorrow,
            formattedDate: this.formatDate(tomorrow),
            formattedTime: '8:00 PM ET',
            homeTeam: 'Bruins',
            awayTeam: 'Maple Leafs',
            league: 'NHL',
            status: 'pre',
            spread: '-1.5',
            overUnder: '5.5',
            fanduelLink: this.generateFanduelLink('NHL', 'nhl2', 'Bruins', 'Maple Leafs'),
            isPremium: true
          }
        ];
        
      case 'NCAA_MENS':
        return [
          {
            id: 'ncaam1',
            date: today,
            formattedDate: this.formatDate(today),
            formattedTime: '7:10 PM ET',
            homeTeam: 'Duke',
            awayTeam: 'North Carolina',
            league: 'NCAA_MENS',
            status: 'pre',
            spread: '-3.5',
            overUnder: '145.5',
            fanduelLink: this.generateFanduelLink('NCAA_MENS', 'ncaam1', 'Duke', 'North Carolina'),
            isPremium: true,
            tournamentRound: 'Sweet 16',
            isMarchMadness: this.isMarchMadnessPeriod(),
            bracketRegion: 'East'
          },
          {
            id: 'ncaam2',
            date: today,
            formattedDate: this.formatDate(today),
            formattedTime: '9:40 PM ET',
            homeTeam: 'Gonzaga',
            awayTeam: 'UCLA',
            league: 'NCAA_MENS',
            status: 'pre',
            spread: '-4.5',
            overUnder: '152.0',
            fanduelLink: this.generateFanduelLink('NCAA_MENS', 'ncaam2', 'Gonzaga', 'UCLA'),
            isPremium: true,
            tournamentRound: 'Sweet 16',
            isMarchMadness: this.isMarchMadnessPeriod(),
            bracketRegion: 'West'
          }
        ];
        
      case 'NCAA_WOMENS':
        return [
          {
            id: 'ncaaw1',
            date: today,
            formattedDate: this.formatDate(today),
            formattedTime: '6:00 PM ET',
            homeTeam: 'South Carolina',
            awayTeam: 'UConn',
            league: 'NCAA_WOMENS',
            status: 'pre',
            spread: '-5.5',
            overUnder: '135.5',
            fanduelLink: this.generateFanduelLink('NCAA_WOMENS', 'ncaaw1', 'South Carolina', 'UConn'),
            isPremium: true,
            tournamentRound: 'Elite Eight',
            isMarchMadness: this.isMarchMadnessPeriod(),
            bracketRegion: 'Greenville 1'
          },
          {
            id: 'ncaaw2',
            date: tomorrow,
            formattedDate: this.formatDate(tomorrow),
            formattedTime: '8:30 PM ET',
            homeTeam: 'Stanford',
            awayTeam: 'Iowa',
            league: 'NCAA_WOMENS',
            status: 'pre',
            spread: '-2.5',
            overUnder: '142.0',
            fanduelLink: this.generateFanduelLink('NCAA_WOMENS', 'ncaaw2', 'Stanford', 'Iowa'),
            isPremium: true,
            tournamentRound: 'Elite Eight',
            isMarchMadness: this.isMarchMadnessPeriod(),
            bracketRegion: 'Seattle 4'
          }
        ];
        
      case 'FORMULA1':
        return [
          {
            id: 'f11',
            date: today,
            formattedDate: this.formatDate(today),
            formattedTime: '8:00 AM ET',
            raceName: 'Monaco Grand Prix',
            trackName: 'Circuit de Monaco',
            location: 'Monte Carlo, Monaco',
            league: 'FORMULA1',
            status: 'pre',
            fanduelLink: this.generateFanduelLink('FORMULA1', 'f11', null, null, 'Monaco Grand Prix'),
            isPremium: true
          },
          {
            id: 'f12',
            date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // Two weeks later
            formattedDate: this.formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)),
            formattedTime: '9:00 AM ET',
            raceName: 'Canadian Grand Prix',
            trackName: 'Circuit Gilles Villeneuve',
            location: 'Montreal, Canada',
            league: 'FORMULA1',
            status: 'pre',
            fanduelLink: this.generateFanduelLink('FORMULA1', 'f12', null, null, 'Canadian Grand Prix'),
            isPremium: true
          }
        ];
        
      default:
        return [];
    }
  }
  
  // Fetch all active sports data
  async fetchAllSportsData() {
    const promises = this.activeSports.map(sport => this.fetchSportData(sport));
    const results = await Promise.all(promises);
    
    // Combine all results
    let allGames = [];
    this.activeSports.forEach((sport, index) => {
      allGames = [...allGames, ...results[index]];
    });
    
    // Sort by date
    allGames.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return allGames;
  }
}

// News ticker class for displaying sports data
class SportsTicker {
  constructor(sportsDataService) {
    this.sportsDataService = sportsDataService;
    this.tickerContent = document.querySelector('.news-ticker-content');
  }
  
  // Initialize the ticker
  async initialize() {
    console.log('Initializing enhanced sports ticker with WNBA, NCAA, and Formula 1 data');
    
    if (!this.tickerContent) {
      console.error('Ticker content element not found');
      return;
    }
    
    // Clear existing content
    this.tickerContent.innerHTML = '';
    
    try {
      // Fetch all sports data
      const games = await this.sportsDataService.fetchAllSportsData();
      
      if (games.length === 0) {
        this.showLoadingMessage('No upcoming games found');
        return;
      }
      
      // Add game data to ticker
      games.forEach(game => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        if (game.league === 'FORMULA1') {
          // Formula 1 format
          newsItem.innerHTML = `
            <span class="news-date">${game.formattedDate}</span>
            <span class="news-teams">${game.raceName}</span>
            <span class="news-time">${game.formattedTime}</span>
            <span class="news-sport"> | F1</span>
            ${game.isPremium ? '<span class="news-premium">PREMIUM</span>' : ''}
          `;
        } else {
          // Team sports format
          let statsDisplay = '';
          
          // Add NHL stats if available
          if (game.league === 'NHL' && game.stats) {
            if (game.stats.homeGoals !== undefined && game.stats.awayGoals !== undefined) {
              statsDisplay = `<span class="news-nhl-stats">${game.stats.awayGoals}-${game.stats.homeGoals}`;
              
              if (game.stats.period) {
                statsDisplay += ` (${game.stats.period}${game.stats.period > 3 ? 'OT' : ''})`;
              }
              
              statsDisplay += '</span>';
            }
          }
          
          newsItem.innerHTML = `
            <span class="news-date">${game.formattedDate}</span>
            <span class="news-teams">${game.awayTeam} vs. ${game.homeTeam}</span>
            <span class="news-time">${game.formattedTime}</span>
            <span class="news-sport"> | ${this.formatLeague(game.league)}</span>
            ${statsDisplay}
            ${game.spread ? `<span class="news-odds">Spread: ${game.spread}</span>` : ''}
            ${game.isPremium ? '<span class="news-premium">PREMIUM</span>' : ''}
            ${game.hasRealOdds ? '<span class="news-live-odds">LIVE ODDS</span>' : ''}
          `;
          
          // Add data attribute for sport-specific styling
          newsItem.setAttribute('data-sport', game.league);
          
          // Add special class for NHL games with stats
          if (game.league === 'NHL' && game.stats) {
            newsItem.classList.add('has-stats');
          }
        }
        
        // Add click handler for FanDuel deep linking if available
        if (game.fanduelLink) {
          newsItem.classList.add('clickable');
          newsItem.addEventListener('click', () => {
            window.open(game.fanduelLink, '_blank');
          });
        }
        
        this.tickerContent.appendChild(newsItem);
      });
      
      // Duplicate all items multiple times for truly continuous scrolling
      this.duplicateItemsForContinuousScrolling();
      
      // Set the animation duration
      this.tickerContent.style.animation = 'ticker 60s linear infinite';
      
    } catch (error) {
      console.error('Error initializing sports ticker:', error);
      this.showLoadingMessage('Error loading sports data');
    }
  }
  
  // Format league name for display
  formatLeague(league) {
    switch (league) {
      case 'NCAA_MENS':
        return 'NCAA MEN';
      case 'NCAA_WOMENS':
        return 'NCAA WOMEN';
      case 'FORMULA1':
        return 'F1';
      default:
        return league;
    }
  }
  
  // Show loading or error message
  showLoadingMessage(message) {
    this.tickerContent.innerHTML = `
      <div class="news-item loading-message">
        <span>${message}</span>
      </div>
    `;
  }
  
  // Duplicate items for continuous scrolling
  duplicateItemsForContinuousScrolling() {
    const items = Array.from(this.tickerContent.querySelectorAll('.news-item'));
    
    if (items.length === 0) {
      return;
    }
    
    // Calculate how many duplications we need based on item count
    // More items = fewer duplications needed
    const duplicationsNeeded = Math.max(3, Math.ceil(20 / items.length));
    
    // Duplicate each item the calculated number of times
    for (let i = 0; i < duplicationsNeeded; i++) {
      items.forEach(item => {
        this.tickerContent.appendChild(item.cloneNode(true));
      });
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const sportsDataService = new SportsDataService();
  const sportsTicker = new SportsTicker(sportsDataService);
  sportsTicker.initialize();
});