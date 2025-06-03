import { hasPremiumAccess } from './firebaseSubscriptionService';
import { shouldUseMockData, logMockDataUsage } from './mockDataService';
import { auth, firestore } from '../config/firebase';

/**
 * Formula 1 race data interface
 */
export interface Formula1Race {
  id: string;
  name: string;
  circuit: string;
  date: string;
  time: string;
  country: string;
  round: number;
  season: number;
}

/**
 * Formula 1 driver data interface
 */
export interface Formula1Driver {
  id: string;
  name: string;
  number: number;
  code: string;
  team: string;
  nationality: string;
  points: number;
  position: number;
  wins: number;
  podiums: number;
}

/**
 * Formula 1 team data interface
 */
export interface Formula1Team {
  id: string;
  name: string;
  nationality: string;
  points: number;
  position: number;
  championships: number;
}

/**
 * Formula 1 race prediction interface
 */
export interface Formula1Prediction {
  raceId: string;
  raceName: string;
  predictions: {
    position: number;
    driverId: string;
    driverName: string;
    team: string;
    confidence: number;
  }[];
  podiumPrediction: {
    first: string;
    second: string;
    third: string;
    confidence: number;
  };
  fastestLapPrediction: {
    driver: string;
    confidence: number;
  };
  generatedAt: string;
}

/**
 * Get upcoming Formula 1 races
 * @returns List of upcoming races
 */
export const getUpcomingRaces = async (): Promise<Formula1Race[]> => {
  try {
    // Log if using mock data
    if (shouldUseMockData(firestore)) {
      logMockDataUsage('getUpcomingRaces');
    }

    // In a real implementation, this would call the Formula 1 API
    // For now, we'll return mock data
    return [
      {
        id: 'race-2025-1',
        name: 'Australian Grand Prix',
        circuit: 'Albert Park Circuit',
        date: '2025-03-23',
        time: '05:00:00Z',
        country: 'Australia',
        round: 1,
        season: 2025,
      },
      {
        id: 'race-2025-2',
        name: 'Bahrain Grand Prix',
        circuit: 'Bahrain International Circuit',
        date: '2025-04-06',
        time: '15:00:00Z',
        country: 'Bahrain',
        round: 2,
        season: 2025,
      },
      {
        id: 'race-2025-3',
        name: 'Chinese Grand Prix',
        circuit: 'Shanghai International Circuit',
        date: '2025-04-20',
        time: '07:00:00Z',
        country: 'China',
        round: 3,
        season: 2025,
      },
    ];
  } catch (error) {
    console.error('Error fetching Formula 1 races:', error);
    return [];
  }
};

/**
 * Get Formula 1 driver standings
 * @returns List of drivers with their standings
 */
export const getDriverStandings = async (): Promise<Formula1Driver[]> => {
  try {
    // Production Formula 1 API integration
    const response = await fetch('https://ergast.com/api/f1/current/driverStandings.json');

    if (!response.ok) {
      throw new Error(`Formula 1 API error: ${response.status}`);
    }

    const data = await response.json();
    const standings = data.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];

    return standings.map((standing: any, index: number) => ({
      id: `driver-${standing.Driver.driverId}`,
      name: `${standing.Driver.givenName} ${standing.Driver.familyName}`,
      number: parseInt(standing.Driver.permanentNumber) || index + 1,
      code: standing.Driver.code || standing.Driver.driverId.toUpperCase().slice(0, 3),
      team: standing.Constructors?.[0]?.name || 'Unknown Team',
      nationality: standing.Driver.nationality || 'Unknown',
      points: parseInt(standing.points) || 0,
      position: parseInt(standing.position) || index + 1,
      wins: parseInt(standing.wins) || 0,
      podiums: 0, // Note: Ergast API doesn't provide podiums in standings, would need separate call
    }));
  } catch (error) {
    console.error('Error fetching Formula 1 driver standings:', error);
    return [];
  }
};

/**
 * Get Formula 1 team standings
 * @returns List of teams with their standings
 */
export const getTeamStandings = async (): Promise<Formula1Team[]> => {
  try {
    // Log if using mock data
    if (shouldUseMockData(firestore)) {
      logMockDataUsage('getTeamStandings');
    }

    // Production Formula 1 API integration for constructor standings
    const response = await fetch('https://ergast.com/api/f1/current/constructorStandings.json');

    if (!response.ok) {
      throw new Error(`Formula 1 API error: ${response.status}`);
    }

    const data = await response.json();
    const standings = data.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

    return standings.map((standing: any) => ({
      id: `team-${standing.Constructor.constructorId}`,
      name: standing.Constructor.name,
      nationality: standing.Constructor.nationality || 'Unknown',
      points: parseInt(standing.points) || 0,
      position: parseInt(standing.position) || 0,
      championships: 0, // Note: Ergast API doesn't provide championship count in standings
    }));
  } catch (error) {
    console.error('Error fetching Formula 1 team standings:', error);
    return [];
  }
};

/**
 * Get race prediction for a specific Formula 1 race
 * @param raceId Race ID
 * @param userId User ID
 * @returns Race prediction or null if user doesn't have access
 */
export const getRacePrediction = async (
  raceId: string,
  userId: string = auth?.currentUser?.uid || ''
): Promise<Formula1Prediction | null> => {
  try {
    // In development mode or if Firebase is not initialized, return mock data
    if (shouldUseMockData(firestore)) {
      logMockDataUsage('getRacePrediction');

      // Return mock prediction data
      return {
        raceId,
        raceName: 'Australian Grand Prix',
        predictions: [
          {
            position: 1,
            driverId: 'driver-1',
            driverName: 'Max Verstappen',
            team: 'Red Bull Racing',
            confidence: 0.85,
          },
          {
            position: 2,
            driverId: 'driver-2',
            driverName: 'Lewis Hamilton',
            team: 'Mercedes',
            confidence: 0.75,
          },
          {
            position: 3,
            driverId: 'driver-3',
            driverName: 'Charles Leclerc',
            team: 'Ferrari',
            confidence: 0.65,
          },
        ],
        podiumPrediction: {
          first: 'Max Verstappen',
          second: 'Lewis Hamilton',
          third: 'Charles Leclerc',
          confidence: 0.7,
        },
        fastestLapPrediction: {
          driver: 'Max Verstappen',
          confidence: 0.65,
        },
        generatedAt: new Date().toISOString(),
      };
    }

    // Check if user has premium access or has purchased this prediction
    const hasPremium = await hasPremiumAccess(userId);

    if (!hasPremium) {
      // Check if user has purchased this specific prediction
      const db = firestore;
      if (!db) return null;

      const purchasesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('purchases')
        .where('productId', '==', 'formula1-race-prediction')
        .where('raceId', '==', raceId)
        .where('status', '==', 'succeeded')
        .limit(1)
        .get();

      if (purchasesSnapshot.empty) {
        return null; // User doesn't have access
      }
    }

    // In a real implementation, this would call the Formula 1 API or a machine learning service
    // For now, we'll return mock data
    return {
      raceId,
      raceName: 'Australian Grand Prix',
      predictions: [
        {
          position: 1,
          driverId: 'driver-1',
          driverName: 'Max Verstappen',
          team: 'Red Bull Racing',
          confidence: 0.85,
        },
        {
          position: 2,
          driverId: 'driver-2',
          driverName: 'Lewis Hamilton',
          team: 'Mercedes',
          confidence: 0.75,
        },
        {
          position: 3,
          driverId: 'driver-3',
          driverName: 'Charles Leclerc',
          team: 'Ferrari',
          confidence: 0.65,
        },
      ],
      podiumPrediction: {
        first: 'Max Verstappen',
        second: 'Lewis Hamilton',
        third: 'Charles Leclerc',
        confidence: 0.7,
      },
      fastestLapPrediction: {
        driver: 'Max Verstappen',
        confidence: 0.65,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Formula 1 race prediction:', error);
    return null;
  }
};

export default {
  getUpcomingRaces,
  getDriverStandings,
  getTeamStandings,
  getRacePrediction,
};
