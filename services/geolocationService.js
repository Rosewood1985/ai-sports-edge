const axios = require('axios');

const geoipService = require('../utils/geoip');

const IPGEOLOCATION_API_KEY = process.env.REACT_APP_IPGEOLOCATION_API_KEY;
const IPGEOLOCATION_API_URL = 'https://api.ipgeolocation.io/ipgeo';

/**
 * Service for handling geolocation functionality
 */
class GeolocationService {
  /**
   * Get the client's IP address
   * @returns {Promise<string>} Client IP address
   */
  async getClientIP() {
    try {
      // Try to get the IP from ipify.org
      const response = await axios.get('https://api.ipify.org?format=json');

      if (response.status === 200 && response.data && response.data.ip) {
        return response.data.ip;
      }

      // Fallback to another service if ipify.org fails
      const fallbackResponse = await axios.get('https://api64.ipify.org?format=json');

      if (fallbackResponse.status === 200 && fallbackResponse.data && fallbackResponse.data.ip) {
        return fallbackResponse.data.ip;
      }

      // If all else fails, return a default IP for testing
      console.warn('Could not determine client IP, using default IP for testing');
      return '8.8.8.8'; // Google DNS IP for testing
    } catch (error) {
      console.error('Error getting client IP:', error);
      return '8.8.8.8'; // Google DNS IP for testing
    }
  }
  /**
   * Get user location based on IP address
   * @param {boolean} useGPS - Whether to attempt to use device GPS (not implemented yet)
   * @param {boolean} forceIPLookup - Whether to force IP-based lookup even if cached data exists
   * @returns {Promise<Object>} User location data
   */
  async getUserLocation(useGPS = false, forceIPLookup = false) {
    try {
      // Check if we have cached location data
      const cachedLocation = localStorage.getItem('userLocation');
      const cachedTimestamp = localStorage.getItem('userLocationTimestamp');

      // If we have cached data and it's less than 24 hours old, use it (unless forceIPLookup is true)
      if (!forceIPLookup && cachedLocation && cachedTimestamp) {
        const now = Date.now();
        const timestamp = parseInt(cachedTimestamp, 10);

        if (now - timestamp < 24 * 60 * 60 * 1000) {
          return JSON.parse(cachedLocation);
        }
      }

      // Try to use GPS-based location if useGPS is true
      if (useGPS) {
        try {
          // Import Expo Location dynamically to avoid issues in environments where it's not available
          let Location;
          try {
            Location = require('expo-location');
          } catch (importError) {
            console.warn('Expo Location not available in this environment');
            throw new Error('Expo Location not available');
          }

          // Request permission to access the device's location
          const { status } = await Location.requestForegroundPermissionsAsync();

          if (status === 'granted') {
            // Get the current position
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });

            // Get the address from the coordinates
            const [address] = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });

            if (address) {
              const locationData = {
                city: address.city || 'Unknown',
                state: address.region || address.subregion || 'Unknown',
                country: address.country || 'Unknown',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                accuracy: location.coords.accuracy,
                source: 'gps',
              };

              // Cache the location data
              localStorage.setItem('userLocation', JSON.stringify(locationData));
              localStorage.setItem('userLocationTimestamp', Date.now().toString());

              return locationData;
            }
          } else {
            console.warn('Location permission not granted, falling back to IP-based geolocation');
          }
        } catch (gpsError) {
          console.warn(
            'Error getting GPS location, falling back to IP-based geolocation:',
            gpsError
          );
        }
      }

      // If GPS failed or is not enabled, try to use the GeoIP service (MaxMind database)
      try {
        // Get the client's IP address
        const clientIP = await this.getClientIP();

        // Initialize the GeoIP service if not already initialized
        if (!geoipService.isInitialized()) {
          await geoipService.initialize();
        }

        // Get location data from the GeoIP service
        const geoIPLocation = await geoipService.getLocationFromIP(clientIP);

        if (geoIPLocation) {
          const locationData = {
            city: geoIPLocation.city,
            state: geoIPLocation.state,
            country: geoIPLocation.country,
            latitude: geoIPLocation.latitude,
            longitude: geoIPLocation.longitude,
            timezone: geoIPLocation.timezone,
          };

          // Cache the location data
          localStorage.setItem('userLocation', JSON.stringify(locationData));
          localStorage.setItem('userLocationTimestamp', Date.now().toString());

          return locationData;
        }
      } catch (geoIPError) {
        console.warn('GeoIP service failed, falling back to IPGeolocation API:', geoIPError);
      }

      // If GeoIP service fails, fall back to IPGeolocation API
      const response = await axios.get(IPGEOLOCATION_API_URL, {
        params: {
          apiKey: IPGEOLOCATION_API_KEY,
        },
      });

      if (response.status !== 200) {
        throw new Error(`Status code ${response.status}`);
      }

      const locationData = {
        city: response.data.city,
        state: response.data.state_prov,
        country: response.data.country_name,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        timezone: response.data.time_zone.name,
      };

      // Cache the location data
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      localStorage.setItem('userLocationTimestamp', Date.now().toString());

      return locationData;
    } catch (error) {
      console.error('Error getting user location:', error);
      return null;
    }
  }

  /**
   * Get local teams based on user location
   * @param {Object} location - User location data
   * @returns {Promise<Array>} Local teams
   */
  async getLocalTeams(location) {
    try {
      // This would typically involve a database lookup or API call
      // For now, we'll use a simplified mapping of locations to teams

      const { city, state } = location;

      // Example mapping of cities to local teams
      const cityTeamMap = {
        'New York': [
          'New York Yankees',
          'New York Mets',
          'New York Giants',
          'New York Jets',
          'New York Knicks',
          'Brooklyn Nets',
        ],
        'Los Angeles': [
          'Los Angeles Dodgers',
          'Los Angeles Angels',
          'Los Angeles Rams',
          'Los Angeles Chargers',
          'Los Angeles Lakers',
          'Los Angeles Clippers',
        ],
        Chicago: ['Chicago Cubs', 'Chicago White Sox', 'Chicago Bears', 'Chicago Bulls'],
        Boston: ['Boston Red Sox', 'New England Patriots', 'Boston Celtics', 'Boston Bruins'],
        Philadelphia: [
          'Philadelphia Phillies',
          'Philadelphia Eagles',
          'Philadelphia 76ers',
          'Philadelphia Flyers',
        ],
        Dallas: ['Dallas Cowboys', 'Dallas Mavericks', 'Dallas Stars', 'Texas Rangers'],
        'San Francisco': ['San Francisco 49ers', 'San Francisco Giants', 'Golden State Warriors'],
        Washington: [
          'Washington Nationals',
          'Washington Commanders',
          'Washington Wizards',
          'Washington Capitals',
        ],
        Houston: ['Houston Astros', 'Houston Texans', 'Houston Rockets'],
        Atlanta: ['Atlanta Braves', 'Atlanta Falcons', 'Atlanta Hawks'],
        Miami: ['Miami Marlins', 'Miami Dolphins', 'Miami Heat'],
        Denver: ['Denver Broncos', 'Denver Nuggets', 'Colorado Rockies', 'Colorado Avalanche'],
        Phoenix: ['Arizona Cardinals', 'Phoenix Suns', 'Arizona Diamondbacks', 'Arizona Coyotes'],
        Seattle: ['Seattle Seahawks', 'Seattle Mariners', 'Seattle Kraken'],
        Detroit: ['Detroit Tigers', 'Detroit Lions', 'Detroit Pistons', 'Detroit Red Wings'],
        Minneapolis: [
          'Minnesota Twins',
          'Minnesota Vikings',
          'Minnesota Timberwolves',
          'Minnesota Wild',
        ],
        'St. Louis': ['St. Louis Cardinals', 'St. Louis Blues'],
        Tampa: ['Tampa Bay Buccaneers', 'Tampa Bay Rays', 'Tampa Bay Lightning'],
        Pittsburgh: ['Pittsburgh Steelers', 'Pittsburgh Pirates', 'Pittsburgh Penguins'],
        Cleveland: ['Cleveland Browns', 'Cleveland Guardians', 'Cleveland Cavaliers'],
      };

      // Check if we have teams for the user's city
      if (cityTeamMap[city]) {
        return cityTeamMap[city];
      }

      // If not, check for teams in the user's state
      // This would involve a more complex lookup in a real implementation
      const stateTeams = [];
      Object.entries(cityTeamMap).forEach(([cityName, teams]) => {
        // This is a simplified approach - in a real implementation,
        // you would have a mapping of cities to states
        if (cityName.includes(state) || state.includes(cityName)) {
          stateTeams.push(...teams);
        }
      });

      if (stateTeams.length > 0) {
        return stateTeams;
      }

      return [];
    } catch (error) {
      console.error('Error getting local teams:', error);
      return [];
    }
  }

  /**
   * Get localized odds suggestions
   * @param {Object} location - User location data
   * @returns {Promise<Array>} Localized odds suggestions
   */
  async getLocalizedOddsSuggestions(location) {
    try {
      // Get local teams
      const localTeams = await this.getLocalTeams(location);

      if (localTeams.length === 0) {
        return [];
      }

      // Try to fetch real odds data if available
      try {
        // This would be replaced with a real API call in production
        const oddsResponse = await fetch('/api/odds/local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ teams: localTeams, location }),
        });

        if (oddsResponse.ok) {
          const realOdds = await oddsResponse.json();
          return realOdds;
        }
      } catch (oddsError) {
        console.warn('Could not fetch real odds data, using simulated data instead:', oddsError);
      }

      // If real odds data is not available, generate simulated odds
      return localTeams.map(team => {
        // Generate a more realistic opponent based on team name
        const opponent = this.generateOpponent(team);

        // Generate more realistic odds based on team popularity
        const baseOdds = 2.0;
        const popularityFactor = team.includes('Yankees') || team.includes('Lakers') ? 0.8 : 1.2;
        const odds = baseOdds * popularityFactor * (0.9 + Math.random() * 0.4);

        // Generate a more informed suggestion
        const suggestion = odds < 2.0 ? 'bet' : 'avoid';

        return {
          team,
          game: `${team} vs. ${opponent}`,
          odds,
          suggestion,
          timestamp: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Error getting localized odds suggestions:', error);
      return [];
    }
  }

  /**
   * Generate a realistic opponent for a team
   * @param {string} team - Team name
   * @returns {string} Opponent name
   */
  generateOpponent(team) {
    // Simple mapping of teams to common opponents
    const rivalries = {
      'New York Yankees': ['Boston Red Sox', 'Tampa Bay Rays'],
      'Boston Red Sox': ['New York Yankees', 'Toronto Blue Jays'],
      'Los Angeles Lakers': ['Los Angeles Clippers', 'Golden State Warriors'],
      'Golden State Warriors': ['Los Angeles Lakers', 'Phoenix Suns'],
      'Dallas Cowboys': ['Philadelphia Eagles', 'New York Giants'],
      'New England Patriots': ['Buffalo Bills', 'Miami Dolphins'],
    };

    // Check if we have a known rivalry
    for (const [teamName, opponents] of Object.entries(rivalries)) {
      if (team.includes(teamName)) {
        return opponents[Math.floor(Math.random() * opponents.length)];
      }
    }

    // Default opponents by sport
    const sportOpponents = {
      Yankees: 'Red Sox',
      Mets: 'Phillies',
      Giants: 'Eagles',
      Jets: 'Patriots',
      Knicks: 'Celtics',
      Nets: 'Raptors',
      Dodgers: 'Giants',
      Angels: 'Athletics',
      Rams: 'Seahawks',
      Chargers: 'Raiders',
      Lakers: 'Celtics',
      Clippers: 'Warriors',
    };

    // Try to find a matching opponent
    for (const [teamKey, opponent] of Object.entries(sportOpponents)) {
      if (team.includes(teamKey)) {
        return opponent;
      }
    }

    // Generic opponent as fallback
    return 'Rival Team';
  }

  /**
   * Filter games to find those involving local teams
   * @param {Array} games - Array of games
   * @param {Object} location - User location
   * @returns {Array} Array of games involving local teams
   */
  async filterLocalGames(games, location) {
    try {
      const localTeams = await this.getLocalTeams(location);

      if (localTeams.length === 0) {
        return [];
      }

      return games.filter(game => {
        // Check if either home or away team is a local team
        const homeTeamIsLocal = localTeams.some(team =>
          game.homeTeam.toLowerCase().includes(team.toLowerCase())
        );

        const awayTeamIsLocal = localTeams.some(team =>
          game.awayTeam.toLowerCase().includes(team.toLowerCase())
        );

        return homeTeamIsLocal || awayTeamIsLocal;
      });
    } catch (error) {
      console.error('Error filtering local games:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using the Haversine formula
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Clear cached location data
   */
  clearCache() {
    try {
      localStorage.removeItem('userLocation');
      localStorage.removeItem('userLocationTimestamp');
      console.log('Geolocation cache cleared');
    } catch (error) {
      console.error('Error clearing geolocation cache:', error);
    }
  }
}

// Create and export a singleton instance
const geolocationService = new GeolocationService();
module.exports = geolocationService;
