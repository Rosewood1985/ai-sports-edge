import { auth, firestore } from '../config/firebase';
import { hasPremiumAccess } from './firebaseSubscriptionService';
import { nascarDataService } from './racing/nascarDataService';
import { sentryService } from './sentryService';

/**
 * NASCAR race data interface
 */
export interface NascarRace {
  id: string;
  name: string;
  track: string;
  date: string;
  time: string;
  location: string;
  series: 'Cup' | 'Xfinity' | 'Truck';
  distance: number; // in miles
  laps: number;
}

/**
 * NASCAR driver data interface
 */
export interface NascarDriver {
  id: string;
  name: string;
  number: number;
  team: string;
  manufacturer: string;
  points: number;
  position: number;
  wins: number;
  top5: number;
  top10: number;
}

/**
 * NASCAR team data interface
 */
export interface NascarTeam {
  id: string;
  name: string;
  manufacturer: string;
  drivers: string[];
  points: number;
  position: number;
  wins: number;
}

/**
 * NASCAR race prediction interface
 */
export interface NascarPrediction {
  raceId: string;
  raceName: string;
  predictions: {
    position: number;
    driverId: string;
    driverName: string;
    team: string;
    confidence: number;
  }[];
  winnerPrediction: {
    driver: string;
    confidence: number;
  };
  top5Prediction: string[];
  polePositionPrediction: {
    driver: string;
    confidence: number;
  };
  generatedAt: string;
}

/**
 * Get upcoming NASCAR races
 * @returns List of upcoming races
 */
export const getUpcomingRaces = async (): Promise<NascarRace[]> => {
  const transaction = sentryService.startTransaction('nascar-get-upcoming-races', 'query', 'Fetch upcoming NASCAR races');
  const startTime = Date.now();
  
  try {
    sentryService.trackRacingOperation('get_upcoming_races', 'nascar', { source: 'nascar_api' });
    
    // In a real implementation, this would call the NASCAR API
    // For now, we'll return mock data
    return [
      {
        id: 'race-2025-1',
        name: 'Daytona 500',
        track: 'Daytona International Speedway',
        date: '2025-02-16',
        time: '14:30:00Z',
        location: 'Daytona Beach, FL',
        series: 'Cup',
        distance: 500,
        laps: 200
      },
      {
        id: 'race-2025-2',
        name: 'Pennzoil 400',
        track: 'Las Vegas Motor Speedway',
        date: '2025-03-02',
        time: '15:30:00Z',
        location: 'Las Vegas, NV',
        series: 'Cup',
        distance: 400,
        laps: 267
      },
      {
        id: 'race-2025-3',
        name: 'Food City 500',
        track: 'Bristol Motor Speedway',
        date: '2025-03-16',
        time: '15:00:00Z',
        location: 'Bristol, TN',
        series: 'Cup',
        distance: 500,
        laps: 500
      }
    ];
    
    const duration = Date.now() - startTime;
    sentryService.trackAPIPerformance('/api/nascar/races', 'GET', 200, duration);
    transaction?.finish();
    
    return mockRaces;
  } catch (error) {
    const duration = Date.now() - startTime;
    sentryService.captureError(error as Error, {
      feature: 'nascar',
      action: 'get_upcoming_races',
      additionalData: { duration, source: 'nascar_api' }
    });
    
    transaction?.setStatus('internal_error');
    transaction?.finish();
    
    console.error('Error fetching NASCAR races:', error);
    return [];
  }
};

/**
 * Get NASCAR driver standings
 * @returns List of drivers with their standings
 */
export const getDriverStandings = async (): Promise<NascarDriver[]> => {
  const transaction = sentryService.startTransaction('nascar-get-driver-standings', 'query', 'Fetch NASCAR driver standings');
  const startTime = Date.now();
  
  try {
    sentryService.trackRacingOperation('get_driver_standings', 'nascar', { season: new Date().getFullYear() });
    
    // Use the NASCAR data service
    
    // Get current season standings
    const currentSeason = new Date().getFullYear();
    const seasonData = await nascarDataService.getSeasonData(currentSeason, 'Cup');
    
    // Convert to legacy format for compatibility
    return seasonData.driverStats.map(stats => ({
      id: stats.driverId,
      name: stats.driverName,
      number: 0, // Would need additional data mapping
      team: '', // Would need additional data mapping
      manufacturer: 'Unknown' as 'Ford' | 'Chevrolet' | 'Toyota',
      points: stats.points,
      position: stats.position,
      wins: stats.wins,
      top5: stats.top5,
      top10: stats.top10
    }));
    
    const duration = Date.now() - startTime;
    sentryService.trackAPIPerformance('/api/nascar/standings/drivers', 'GET', 200, duration);
    sentryService.trackRacingOperation('driver_standings_success', 'nascar', { 
      driverCount: seasonData.driverStats.length,
      season: currentSeason,
      duration 
    });
    transaction?.finish();
    
    return standings;
  } catch (error) {
    const duration = Date.now() - startTime;
    sentryService.captureError(error as Error, {
      feature: 'nascar',
      action: 'get_driver_standings',
      additionalData: { 
        season: new Date().getFullYear(),
        duration,
        dataSource: 'nascar_data_service'
      }
    });
    
    transaction?.setStatus('internal_error');
    transaction?.finish();
    
    console.error('Error fetching NASCAR driver standings:', error);
    
    // Fallback: check if legacy environment variables are configured
    if (!process.env.NASCAR_API_KEY && !process.env.SPORTS_DATA_API_KEY && !process.env.NASCAR_DATA_REPO_URL) {
      console.warn('NASCAR data sources not configured. Please set NASCAR_DATA_REPO_URL, NASCAR_API_KEY, or SPORTS_DATA_API_KEY.');
    }
    
    return [];
  }
};

/**
 * Get NASCAR team standings
 * @returns List of teams with their standings
 */
export const getTeamStandings = async (): Promise<NascarTeam[]> => {
  const transaction = sentryService.startTransaction('nascar-get-team-standings', 'query', 'Fetch NASCAR team standings');
  const startTime = Date.now();
  
  try {
    sentryService.trackRacingOperation('get_team_standings', 'nascar', { season: new Date().getFullYear() });
    
    // Use the NASCAR data service
    
    // Get current season data
    const currentSeason = new Date().getFullYear();
    const seasonData = await nascarDataService.getSeasonData(currentSeason, 'Cup');
    
    // Aggregate team standings from driver data
    const teamMap = new Map<string, Partial<NascarTeam>>();
    
    seasonData.races.forEach(race => {
      race.results.forEach(result => {
        if (!teamMap.has(result.team)) {
          teamMap.set(result.team, {
            id: `team-${result.team.toLowerCase().replace(/\s+/g, '-')}`,
            name: result.team,
            manufacturer: result.manufacturer,
            drivers: [],
            points: 0,
            wins: 0,
            position: 0
          });
        }
        
        const team = teamMap.get(result.team)!;
        if (!team.drivers?.includes(result.driverName)) {
          team.drivers?.push(result.driverName);
        }
        team.points = (team.points || 0) + result.points;
        if (result.finishPosition === 1) {
          team.wins = (team.wins || 0) + 1;
        }
      });
    });
    
    // Convert to array and sort by points
    return Array.from(teamMap.values())
      .map(team => team as NascarTeam)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .map((team, index) => ({ ...team, position: index + 1 }));
    
    const duration = Date.now() - startTime;
    sentryService.trackAPIPerformance('/api/nascar/standings/teams', 'GET', 200, duration);
    sentryService.trackRacingOperation('team_standings_success', 'nascar', { 
      teamCount: teamStandings.length,
      season: currentSeason,
      duration 
    });
    transaction?.finish();
    
    return teamStandings;
  } catch (error) {
    const duration = Date.now() - startTime;
    sentryService.captureError(error as Error, {
      feature: 'nascar',
      action: 'get_team_standings',
      additionalData: { 
        season: new Date().getFullYear(),
        duration,
        aggregationSource: 'driver_data'
      }
    });
    
    transaction?.setStatus('internal_error');
    transaction?.finish();
    
    console.error('Error fetching NASCAR team standings:', error);
    return [];
  }
};

/**
 * Get race prediction for a specific NASCAR race
 * @param raceId Race ID
 * @param userId User ID
 * @returns Race prediction or null if user doesn't have access
 */
export const getRacePrediction = async (
  raceId: string,
  userId: string = auth.currentUser?.uid || ''
): Promise<NascarPrediction | null> => {
  const transaction = sentryService.startTransaction('nascar-get-race-prediction', 'query', 'Fetch NASCAR race prediction');
  const startTime = Date.now();
  
  try {
    sentryService.trackRacingOperation('get_race_prediction', 'nascar', { 
      raceId, 
      userId: userId ? 'authenticated' : 'anonymous'
    });
    
    // Check if user has premium access or has purchased this prediction
    const hasPremium = await hasPremiumAccess(userId);
    
    if (!hasPremium) {
      // Check if user has purchased this specific prediction
      const db = firestore;
      const purchasesSnapshot = await db.collection('users').doc(userId)
        .collection('purchases')
        .where('productId', '==', 'nascar-race-prediction')
        .where('raceId', '==', raceId)
        .where('status', '==', 'succeeded')
        .limit(1)
        .get();
      
      if (purchasesSnapshot.empty) {
        return null; // User doesn't have access
      }
    }
    
    // In a real implementation, this would call the NASCAR API or a machine learning service
    // For now, we'll return mock data
    return {
      raceId,
      raceName: 'Daytona 500',
      predictions: [
        {
          position: 1,
          driverId: 'driver-1',
          driverName: 'Kyle Larson',
          team: 'Hendrick Motorsports',
          confidence: 0.75
        },
        {
          position: 2,
          driverId: 'driver-2',
          driverName: 'Denny Hamlin',
          team: 'Joe Gibbs Racing',
          confidence: 0.70
        },
        {
          position: 3,
          driverId: 'driver-3',
          driverName: 'Joey Logano',
          team: 'Team Penske',
          confidence: 0.65
        }
      ],
      winnerPrediction: {
        driver: 'Kyle Larson',
        confidence: 0.75
      },
      top5Prediction: [
        'Kyle Larson',
        'Denny Hamlin',
        'Joey Logano',
        'Chase Elliott',
        'Ryan Blaney'
      ],
      polePositionPrediction: {
        driver: 'Denny Hamlin',
        confidence: 0.80
      },
      generatedAt: new Date().toISOString()
    };
    
    const duration = Date.now() - startTime;
    sentryService.trackAPIPerformance('/api/nascar/predictions', 'GET', 200, duration);
    sentryService.trackFeatureUsage('nascar_prediction', 'accessed', userId, {
      raceId,
      hasPremium,
      duration
    });
    transaction?.finish();
    
    return prediction;
  } catch (error) {
    const duration = Date.now() - startTime;
    sentryService.captureError(error as Error, {
      userId,
      feature: 'nascar',
      action: 'get_race_prediction',
      additionalData: { 
        raceId,
        duration,
        predictionType: 'race_outcome'
      }
    });
    
    transaction?.setStatus('internal_error');
    transaction?.finish();
    
    console.error('Error fetching NASCAR race prediction:', error);
    return null;
  }
};

export default {
  getUpcomingRaces,
  getDriverStandings,
  getTeamStandings,
  getRacePrediction
};