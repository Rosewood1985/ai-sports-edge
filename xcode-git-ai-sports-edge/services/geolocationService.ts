import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Game } from '../types/odds';
import { trackEvent } from './analyticsService';

// Geolocation types
export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  timestamp: number;
}

// Team location data
interface TeamLocation {
  team: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  sportType: string;
}

// Sample team location data (in a real app, this would be a more comprehensive database)
const TEAM_LOCATIONS: TeamLocation[] = [
  { team: 'Lakers', city: 'Los Angeles', state: 'CA', country: 'USA', latitude: 34.0430, longitude: -118.2673, sportType: 'basketball' },
  { team: 'Warriors', city: 'San Francisco', state: 'CA', country: 'USA', latitude: 37.7680, longitude: -122.3877, sportType: 'basketball' },
  { team: 'Knicks', city: 'New York', state: 'NY', country: 'USA', latitude: 40.7505, longitude: -73.9934, sportType: 'basketball' },
  { team: 'Heat', city: 'Miami', state: 'FL', country: 'USA', latitude: 25.7814, longitude: -80.1870, sportType: 'basketball' },
  { team: 'Chiefs', city: 'Kansas City', state: 'MO', country: 'USA', latitude: 39.0997, longitude: -94.5786, sportType: 'football' },
  { team: 'Eagles', city: 'Philadelphia', state: 'PA', country: 'USA', latitude: 39.9008, longitude: -75.1675, sportType: 'football' },
  { team: '49ers', city: 'San Francisco', state: 'CA', country: 'USA', latitude: 37.7139, longitude: -122.3864, sportType: 'football' },
  { team: 'Cowboys', city: 'Dallas', state: 'TX', country: 'USA', latitude: 32.7473, longitude: -97.0945, sportType: 'football' },
  { team: 'Yankees', city: 'New York', state: 'NY', country: 'USA', latitude: 40.8296, longitude: -73.9262, sportType: 'baseball' },
  { team: 'Dodgers', city: 'Los Angeles', state: 'CA', country: 'USA', latitude: 34.0739, longitude: -118.2400, sportType: 'baseball' },
  { team: 'Red Sox', city: 'Boston', state: 'MA', country: 'USA', latitude: 42.3467, longitude: -71.0972, sportType: 'baseball' },
  { team: 'Cubs', city: 'Chicago', state: 'IL', country: 'USA', latitude: 41.9484, longitude: -87.6553, sportType: 'baseball' }
];

/**
 * Get the user's current location
 * @returns User's location
 */
export const getCurrentLocation = async (): Promise<Location | null> => {
  try {
    // First check if we have a cached location
    const cachedLocationData = await AsyncStorage.getItem('user_location');
    
    if (cachedLocationData) {
      const cachedLocation = JSON.parse(cachedLocationData) as Location;
      const now = Date.now();
      
      // If the cached location is less than 1 hour old, use it
      if (now - cachedLocation.timestamp < 60 * 60 * 1000) {
        return cachedLocation;
      }
    }
    
    // For simplicity, we'll use a mock location
    // In a real app, you would use the Geolocation API from React Native or the browser
    const mockLocation: Location = {
      latitude: 37.7749,
      longitude: -122.4194,
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      timestamp: Date.now()
    };
    
    // Cache the location
    await AsyncStorage.setItem('user_location', JSON.stringify(mockLocation));
    
    // Track the event
    trackEvent('app_opened' as any, { location_updated: true });
    
    return mockLocation;
  } catch (error) {
    console.error('Error in getCurrentLocation:', error);
    return null;
  }
};

/**
 * Get city and state from coordinates using reverse geocoding
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns City and state
 */
export const getCityStateFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<{ city: string; state: string; country: string } | null> => {
  try {
    // In a real app, this would use a geocoding API like Google Maps or Mapbox
    // For now, we'll return a mock result based on the closest team location
    
    // Find the closest team location
    let closestTeam: TeamLocation | null = null;
    let closestDistance = Number.MAX_VALUE;
    
    for (const team of TEAM_LOCATIONS) {
      const distance = calculateDistance(
        latitude,
        longitude,
        team.latitude,
        team.longitude
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTeam = team;
      }
    }
    
    if (closestTeam && closestDistance < 100) { // Within 100 km
      return {
        city: closestTeam.city,
        state: closestTeam.state,
        country: closestTeam.country
      };
    }
    
    // Default to San Francisco if no close team is found
    return {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA'
    };
  } catch (error) {
    console.error('Error in getCityStateFromCoordinates:', error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude 1
 * @param lon1 Longitude 1
 * @param lat2 Latitude 2
 * @param lon2 Longitude 2
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Find local teams based on user's location
 * @param location User's location
 * @returns Array of local team names
 */
export const findLocalTeams = (location: Location): string[] => {
  if (!location.latitude || !location.longitude) {
    return [];
  }
  
  const localTeams: string[] = [];
  
  // Find teams within 100 km
  for (const team of TEAM_LOCATIONS) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      team.latitude,
      team.longitude
    );
    
    if (distance < 100) {
      localTeams.push(team.team);
    }
  }
  
  return localTeams;
};

/**
 * Filter games to find those involving local teams
 * @param games Array of games
 * @param location User's location
 * @returns Array of games involving local teams
 */
export const filterLocalGames = (games: Game[], location: Location): Game[] => {
  const localTeams = findLocalTeams(location);
  
  if (localTeams.length === 0) {
    return [];
  }
  
  return games.filter(game => {
    // Check if either home or away team is a local team
    const homeTeamIsLocal = localTeams.some(team => 
      game.home_team.toLowerCase().includes(team.toLowerCase())
    );
    
    const awayTeamIsLocal = localTeams.some(team => 
      game.away_team.toLowerCase().includes(team.toLowerCase())
    );
    
    return homeTeamIsLocal || awayTeamIsLocal;
  });
};

/**
 * Get games sorted by proximity to user's location
 * @param games Array of games
 * @param location User's location
 * @returns Array of games sorted by proximity
 */
export const getGamesByProximity = (games: Game[], location: Location): Game[] => {
  if (!location.latitude || !location.longitude) {
    return games;
  }
  
  // Create a copy of the games array with distance information
  const gamesWithDistance = games.map(game => {
    // Find team locations
    const homeTeamLocation = TEAM_LOCATIONS.find(team => 
      game.home_team.toLowerCase().includes(team.team.toLowerCase())
    );
    
    // Calculate distance to home team (if found)
    let distance = Number.MAX_VALUE;
    if (homeTeamLocation) {
      distance = calculateDistance(
        location.latitude,
        location.longitude,
        homeTeamLocation.latitude,
        homeTeamLocation.longitude
      );
    }
    
    return {
      ...game,
      distance
    };
  });
  
  // Sort by distance
  return gamesWithDistance
    .sort((a, b) => (a as any).distance - (b as any).distance)
    .map(game => {
      // Remove the distance property
      const { distance, ...rest } = game as any;
      return rest;
    });
};

export default {
  getCurrentLocation,
  getCityStateFromCoordinates,
  calculateDistance,
  findLocalTeams,
  filterLocalGames,
  getGamesByProximity
};