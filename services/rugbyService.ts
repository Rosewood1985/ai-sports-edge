import { firebaseService } from '../src/atomic/organisms/firebaseService';
import { hasPremiumAccess } from './firebaseSubscriptionService';

/**
 * Rugby match data interface
 */
export interface RugbyMatch {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  round: number | null;
  status: 'scheduled' | 'in_progress' | 'completed';
}

/**
 * Rugby team data interface
 */
export interface RugbyTeam {
  id: string;
  name: string;
  country: string;
  competition: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  tries: number;
  tablePoints: number;
}

/**
 * Rugby player data interface
 */
export interface RugbyPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  caps: number;
  tries: number;
  points: number;
}

/**
 * Rugby match prediction interface
 */
export interface RugbyPrediction {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  winProbability: {
    home: number;
    away: number;
    draw: number;
  };
  predictedScore: {
    home: number;
    away: number;
    confidence: number;
  };
  tryScorerPredictions: {
    player: string;
    team: string;
    probability: number;
  }[];
  keyMatchups: {
    position: string;
    homePlayer: string;
    awayPlayer: string;
    advantage: 'home' | 'away' | 'even';
  }[];
  generatedAt: string;
}

/**
 * Get upcoming Rugby matches
 * @returns List of upcoming matches
 */
export const getUpcomingMatches = async (): Promise<RugbyMatch[]> => {
  try {
    // In a real implementation, this would call the Rugby API
    // For now, we'll return mock data
    return [
      {
        id: 'match-2025-1',
        competition: 'Six Nations',
        homeTeam: 'England',
        awayTeam: 'France',
        date: '2025-02-08',
        time: '16:45:00Z',
        venue: 'Twickenham Stadium',
        round: 1,
        status: 'scheduled'
      },
      {
        id: 'match-2025-2',
        competition: 'Six Nations',
        homeTeam: 'Ireland',
        awayTeam: 'Wales',
        date: '2025-02-09',
        time: '15:00:00Z',
        venue: 'Aviva Stadium',
        round: 1,
        status: 'scheduled'
      },
      {
        id: 'match-2025-3',
        competition: 'Super Rugby',
        homeTeam: 'Crusaders',
        awayTeam: 'Blues',
        date: '2025-02-15',
        time: '08:35:00Z',
        venue: 'Orangetheory Stadium',
        round: 1,
        status: 'scheduled'
      }
    ];
  } catch (error) {
    console.error('Error fetching Rugby matches:', error);
    return [];
  }
};

/**
 * Get Rugby team standings for a specific competition
 * @param competition Competition name
 * @returns List of teams with their standings
 */
export const getTeamStandings = async (competition: string): Promise<RugbyTeam[]> => {
  try {
    // In a real implementation, this would call the Rugby API
    // For now, we'll return mock data for Six Nations
    if (competition === 'Six Nations') {
      return [
        {
          id: 'team-1',
          name: 'Ireland',
          country: 'Ireland',
          competition: 'Six Nations',
          position: 1,
          played: 5,
          won: 5,
          drawn: 0,
          lost: 0,
          pointsFor: 165,
          pointsAgainst: 84,
          pointsDiff: 81,
          tries: 24,
          tablePoints: 24
        },
        {
          id: 'team-2',
          name: 'France',
          country: 'France',
          competition: 'Six Nations',
          position: 2,
          played: 5,
          won: 4,
          drawn: 0,
          lost: 1,
          pointsFor: 148,
          pointsAgainst: 86,
          pointsDiff: 62,
          tries: 18,
          tablePoints: 18
        },
        {
          id: 'team-3',
          name: 'England',
          country: 'England',
          competition: 'Six Nations',
          position: 3,
          played: 5,
          won: 3,
          drawn: 0,
          lost: 2,
          pointsFor: 121,
          pointsAgainst: 107,
          pointsDiff: 14,
          tries: 14,
          tablePoints: 14
        }
      ];
    }
    
    // Return empty array for other competitions
    return [];
  } catch (error) {
    console.error('Error fetching Rugby team standings:', error);
    return [];
  }
};

/**
 * Get Rugby player statistics
 * @param teamId Team ID
 * @returns List of players with their statistics
 */
export const getPlayerStats = async (teamId: string): Promise<RugbyPlayer[]> => {
  try {
    // In a real implementation, this would call the Rugby API
    // For now, we'll return mock data for Ireland
    if (teamId === 'team-1') {
      return [
        {
          id: 'player-1',
          name: 'Johnny Sexton',
          team: 'Ireland',
          position: 'Fly-half',
          age: 38,
          height: 188,
          weight: 92,
          caps: 113,
          tries: 15,
          points: 1050
        },
        {
          id: 'player-2',
          name: 'James Lowe',
          team: 'Ireland',
          position: 'Wing',
          age: 31,
          height: 188,
          weight: 105,
          caps: 20,
          tries: 12,
          points: 60
        },
        {
          id: 'player-3',
          name: 'Tadhg Furlong',
          team: 'Ireland',
          position: 'Prop',
          age: 31,
          height: 183,
          weight: 126,
          caps: 65,
          tries: 5,
          points: 25
        }
      ];
    }
    
    // Return empty array for other teams
    return [];
  } catch (error) {
    console.error('Error fetching Rugby player statistics:', error);
    return [];
  }
};

/**
 * Get match prediction for a specific Rugby match
 * @param matchId Match ID
 * @param userId User ID
 * @returns Match prediction or null if user doesn't have access
 */
export const getMatchPrediction = async (
  matchId: string,
  userId: string = firebaseService.auth.instance.currentUser?.uid || ''
): Promise<RugbyPrediction | null> => {
  try {
    // Check if user has premium access or has purchased this prediction
    const hasPremium = await hasPremiumAccess(userId);
    
    if (!hasPremium) {
      // Check if user has purchased this specific prediction
      const purchasesSnapshot = await firebaseService.firestore.getCollection(
        `users/${userId}/purchases`,
        [
          firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('productId', '==', 'rugby-match-prediction'),
          firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('matchId', '==', matchId),
          firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('status', '==', 'succeeded'),
          firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.limit(1)
        ]
      );
      
      if (purchasesSnapshot.length === 0) {
        return null; // User doesn't have access
      }
    }
    
    // In a real implementation, this would call the Rugby API or a machine learning service
    // For now, we'll return mock data
    return {
      matchId,
      homeTeam: 'England',
      awayTeam: 'France',
      winProbability: {
        home: 0.55,
        away: 0.40,
        draw: 0.05
      },
      predictedScore: {
        home: 24,
        away: 21,
        confidence: 0.65
      },
      tryScorerPredictions: [
        {
          player: 'Anthony Watson',
          team: 'England',
          probability: 0.35
        },
        {
          player: 'Damian Penaud',
          team: 'France',
          probability: 0.30
        },
        {
          player: 'Maro Itoje',
          team: 'England',
          probability: 0.15
        }
      ],
      keyMatchups: [
        {
          position: 'Fly-half',
          homePlayer: 'Owen Farrell',
          awayPlayer: 'Romain Ntamack',
          advantage: 'home'
        },
        {
          position: 'Scrum-half',
          homePlayer: 'Ben Youngs',
          awayPlayer: 'Antoine Dupont',
          advantage: 'away'
        },
        {
          position: 'Number 8',
          homePlayer: 'Billy Vunipola',
          awayPlayer: 'Gregory Alldritt',
          advantage: 'even'
        }
      ],
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching Rugby match prediction:', error);
    return null;
  }
};

/**
 * Get team analysis for a specific Rugby team
 * @param teamId Team ID
 * @param userId User ID
 * @returns Team analysis or null if user doesn't have access
 */
export const getTeamAnalysis = async (
  teamId: string,
  userId: string = firebaseService.auth.instance.currentUser?.uid || ''
): Promise<any | null> => {
  try {
    // Check if user has premium access or has purchased this analysis
    const hasPremium = await hasPremiumAccess(userId);
    
    if (!hasPremium) {
      // Check if user has purchased this specific analysis
      const purchasesSnapshot = await firebaseService.firestore.getCollection(
        `users/${userId}/purchases`,
        [
          firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('productId', '==', 'rugby-team-analysis'),
          firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('teamId', '==', teamId),
          firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('status', '==', 'succeeded'),
          firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.limit(1)
        ]
      );
      
      if (purchasesSnapshot.length === 0) {
        return null; // User doesn't have access
      }
    }
    
    // In a real implementation, this would call the Rugby API or a machine learning service
    // For now, we'll return mock data
    return {
      teamId,
      teamName: 'Ireland',
      strengths: [
        'Set piece dominance',
        'Defensive organization',
        'Attacking variety'
      ],
      weaknesses: [
        'Vulnerability to counter-attack',
        'Discipline under pressure'
      ],
      keyPlayers: [
        {
          name: 'Johnny Sexton',
          role: 'Playmaker and goal-kicker',
          importance: 'Critical'
        },
        {
          name: 'Tadhg Furlong',
          role: 'Scrum anchor',
          importance: 'High'
        }
      ],
      playstyle: 'Ireland employs a balanced approach with strong set-piece fundamentals and a varied attacking game. They excel at maintaining possession through multiple phases and creating pressure through territorial kicking.',
      upcomingMatchStrategy: 'Expect Ireland to target Wales\' lineout and use their superior kicking game to pin Wales in their own half.',
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching Rugby team analysis:', error);
    return null;
  }
};

export default {
  getUpcomingMatches,
  getTeamStandings,
  getPlayerStats,
  getMatchPrediction,
  getTeamAnalysis
};