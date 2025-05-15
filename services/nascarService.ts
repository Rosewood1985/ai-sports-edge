import { firebaseService } from '../src/atomic/organisms/firebaseService';
import '../config/firebase';
import { hasPremiumAccess } from './firebaseSubscriptionService';

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
  try {
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
  } catch (error) {
    console.error('Error fetching NASCAR races:', error);
    return [];
  }
};

/**
 * Get NASCAR driver standings
 * @returns List of drivers with their standings
 */
export const getDriverStandings = async (): Promise<NascarDriver[]> => {
  try {
    // In a real implementation, this would call the NASCAR API
    // For now, we'll return mock data
    return [
      {
        id: 'driver-1',
        name: 'Kyle Larson',
        number: 5,
        team: 'Hendrick Motorsports',
        manufacturer: 'Chevrolet',
        points: 2400,
        position: 1,
        wins: 6,
        top5: 15,
        top10: 20
      },
      {
        id: 'driver-2',
        name: 'Denny Hamlin',
        number: 11,
        team: 'Joe Gibbs Racing',
        manufacturer: 'Toyota',
        points: 2350,
        position: 2,
        wins: 5,
        top5: 14,
        top10: 19
      },
      {
        id: 'driver-3',
        name: 'Joey Logano',
        number: 22,
        team: 'Team Penske',
        manufacturer: 'Ford',
        points: 2300,
        position: 3,
        wins: 4,
        top5: 12,
        top10: 18
      }
    ];
  } catch (error) {
    console.error('Error fetching NASCAR driver standings:', error);
    return [];
  }
};

/**
 * Get NASCAR team standings
 * @returns List of teams with their standings
 */
export const getTeamStandings = async (): Promise<NascarTeam[]> => {
  try {
    // In a real implementation, this would call the NASCAR API
    // For now, we'll return mock data
    return [
      {
        id: 'team-1',
        name: 'Hendrick Motorsports',
        manufacturer: 'Chevrolet',
        drivers: ['Kyle Larson', 'Chase Elliott', 'William Byron', 'Alex Bowman'],
        points: 4500,
        position: 1,
        wins: 12
      },
      {
        id: 'team-2',
        name: 'Joe Gibbs Racing',
        manufacturer: 'Toyota',
        drivers: ['Denny Hamlin', 'Martin Truex Jr.', 'Christopher Bell', 'Ty Gibbs'],
        points: 4300,
        position: 2,
        wins: 10
      },
      {
        id: 'team-3',
        name: 'Team Penske',
        manufacturer: 'Ford',
        drivers: ['Joey Logano', 'Ryan Blaney', 'Austin Cindric'],
        points: 4100,
        position: 3,
        wins: 8
      }
    ];
  } catch (error) {
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
  try {
    // Check if user has premium access or has purchased this prediction
    const hasPremium = await hasPremiumAccess(userId);
    
    if (!hasPremium) {
      // Check if user has purchased this specific prediction
      const db = firestore;
      const purchasesSnapshot = await db.firebaseService.firestore.firebaseService.firestore.collection('users').firebaseService.firestore.firebaseService.firestore.doc(userId)
        .firebaseService.firestore.firebaseService.firestore.collection('purchases')
        .firebaseService.firestore.firebaseService.firestore.where('productId', '==', 'nascar-race-prediction')
        .firebaseService.firestore.firebaseService.firestore.where('raceId', '==', raceId)
        .firebaseService.firestore.firebaseService.firestore.where('status', '==', 'succeeded')
        .firebaseService.firestore.firebaseService.firestore.limit(1)
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
  } catch (error) {
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