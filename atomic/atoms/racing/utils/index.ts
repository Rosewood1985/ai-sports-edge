/**
 * Racing Atomic Utilities
 * Core utility functions for racing features
 * Part of Phase 1: Racing Data Integration Plan
 */

// Date and time utilities
export const formatRaceTime = (time: string): string => {
  try {
    const date = new Date(`1970-01-01T${time}:00.000Z`);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'UTC'
    });
  } catch {
    return time;
  }
};

export const isRaceToday = (raceDate: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return raceDate === today;
};

export const isRaceUpcoming = (raceDate: string, raceTime?: string): boolean => {
  const now = new Date();
  const raceDateTime = new Date(`${raceDate}T${raceTime || '00:00:00'}`);
  return raceDateTime > now;
};

// Odds utilities
export const parseOdds = (oddsStr: string): number => {
  if (typeof oddsStr === 'number') return oddsStr;
  
  const odds = oddsStr.toLowerCase().trim();
  
  if (odds === 'evens' || odds === 'even') return 2.0;
  if (odds === 'sp' || odds === 'starting price') return 0;
  
  // Handle fractional odds (e.g., "5/1", "7/2")
  if (odds.includes('/')) {
    const [numerator, denominator] = odds.split('/').map(Number);
    if (numerator && denominator) {
      return (numerator / denominator) + 1;
    }
  }
  
  // Handle decimal odds
  const decimal = parseFloat(odds);
  if (!isNaN(decimal) && decimal > 0) {
    return decimal;
  }
  
  return 2.0; // Default fallback
};

export const oddsToImpliedProbability = (odds: number): number => {
  if (odds <= 1) return 0;
  return 1 / odds;
};

export const probabilityToOdds = (probability: number): number => {
  if (probability <= 0 || probability >= 1) return 1;
  return 1 / probability;
};

// Weight utilities (for horse racing)
export const parseWeight = (weightStr: string): number => {
  if (typeof weightStr === 'number') return weightStr;
  
  // Parse UK weight format "9-2" (9 stone 2 pounds)
  if (weightStr.includes('-')) {
    const [stones, pounds] = weightStr.split('-').map(Number);
    return (stones * 14) + (pounds || 0);
  }
  
  // Parse US weight format "126" (pounds)
  const pounds = parseInt(weightStr);
  return isNaN(pounds) ? 126 : pounds; // Default to 126 lbs
};

export const formatWeight = (pounds: number, format: 'uk' | 'us' = 'uk'): string => {
  if (format === 'us') {
    return `${pounds} lbs`;
  }
  
  // UK format: convert to stones and pounds
  const stones = Math.floor(pounds / 14);
  const remainingPounds = pounds % 14;
  return `${stones}-${remainingPounds}`;
};

// Distance utilities
export const parseDistance = (distanceStr: string): number => {
  if (typeof distanceStr === 'number') return distanceStr;
  
  let furlongs = 0;
  const distance = distanceStr.toLowerCase();
  
  // Parse miles (1m = 8 furlongs)
  const milesMatch = distance.match(/(\d+(?:\.\d+)?)m/);
  if (milesMatch) {
    furlongs += parseFloat(milesMatch[1]) * 8;
  }
  
  // Parse furlongs
  const furlongsMatch = distance.match(/(\d+(?:\.\d+)?)f/);
  if (furlongsMatch) {
    furlongs += parseFloat(furlongsMatch[1]);
  }
  
  // Parse yards (220 yards = 1 furlong)
  const yardsMatch = distance.match(/(\d+)y/);
  if (yardsMatch) {
    furlongs += parseInt(yardsMatch[1]) / 220;
  }
  
  return furlongs || 6; // Default to 6 furlongs
};

export const formatDistance = (furlongs: number, format: 'uk' | 'us' = 'uk'): string => {
  if (format === 'us') {
    const miles = furlongs / 8;
    if (miles >= 1) {
      const wholeMiles = Math.floor(miles);
      const remainingFurlongs = furlongs % 8;
      if (remainingFurlongs === 0) {
        return `${wholeMiles} mile${wholeMiles !== 1 ? 's' : ''}`;
      } else {
        return `${wholeMiles}m ${remainingFurlongs}f`;
      }
    }
    return `${furlongs}f`;
  }
  
  // UK format
  const miles = Math.floor(furlongs / 8);
  const remainingFurlongs = furlongs % 8;
  
  if (miles > 0 && remainingFurlongs > 0) {
    return `${miles}m ${remainingFurlongs}f`;
  } else if (miles > 0) {
    return `${miles}m`;
  } else {
    return `${furlongs}f`;
  }
};

// Form parsing utilities
export const parseForm = (formStr: string): number[] => {
  if (!formStr) return [];
  
  return formStr.split('').map(char => {
    const num = parseInt(char);
    // Convert letters to numbers: F=99 (fell), U=98 (unseated), P=97 (pulled up)
    if (isNaN(num)) {
      switch (char.toLowerCase()) {
        case 'f': return 99; // Fell
        case 'u': return 98; // Unseated rider
        case 'p': return 97; // Pulled up
        case 'r': return 96; // Refused
        case 'b': return 95; // Brought down
        default: return 0;
      }
    }
    return num;
  }).slice(0, 5); // Last 5 runs
};

export const calculateFormRating = (form: number[]): number => {
  if (form.length === 0) return 0;
  
  // Weight recent form more heavily
  const weights = [0.4, 0.3, 0.2, 0.1]; // Most recent gets highest weight
  let totalScore = 0;
  let totalWeight = 0;
  
  form.forEach((position, index) => {
    if (index < weights.length && position > 0 && position <= 20) {
      const score = Math.max(0, 21 - position); // 20 points for 1st, 19 for 2nd, etc.
      const weight = weights[index];
      totalScore += score * weight;
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
};

// Track condition utilities
export const normalizeTrackCondition = (condition: string): string => {
  const normalized = condition.toLowerCase().trim();
  
  // Map various condition descriptions to standard terms
  const conditionMap: Record<string, string> = {
    'good': 'Good',
    'good to firm': 'Good to Firm',
    'firm': 'Firm',
    'soft': 'Soft',
    'heavy': 'Heavy',
    'fast': 'Fast',
    'muddy': 'Muddy',
    'sloppy': 'Sloppy',
    'yielding': 'Yielding',
    'frozen': 'Frozen'
  };
  
  return conditionMap[normalized] || condition;
};

// Cache key utilities
export const generateRacingCacheKey = (
  sport: 'nascar' | 'horse_racing',
  type: string,
  ...params: string[]
): string => {
  return `${sport}_${type}_${params.join('_')}`;
};

// Validation utilities
export const isValidRaceDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  return date >= oneYearAgo && date <= oneYearFromNow && !isNaN(date.getTime());
};

export const isValidOdds = (odds: number): boolean => {
  return odds > 1 && odds <= 1000 && isFinite(odds);
};

export const isValidWeight = (weight: number): boolean => {
  return weight >= 50 && weight <= 200; // Reasonable range for horse racing weights
};

// NASCAR specific utilities
export const calculateNascarPoints = (position: number, lapsLed: number = 0, fastestLap: boolean = false): number => {
  // 2023 NASCAR playoff points system
  let points = Math.max(1, 41 - position); // 40 points for 1st, 39 for 2nd, etc.
  
  // Bonus points
  if (position === 1) points += 5; // Winner bonus
  if (fastestLap) points += 1; // Fastest lap bonus
  if (lapsLed > 0) points += 1; // Led a lap bonus
  if (lapsLed >= 1) points += 1; // Led most laps bonus (simplified)
  
  return points;
};

export const determineNascarTrackType = (trackName: string): 'superspeedway' | 'intermediate' | 'short' | 'road_course' | 'dirt' => {
  const name = trackName.toLowerCase();
  
  if (name.includes('daytona') || name.includes('talladega')) {
    return 'superspeedway';
  }
  if (name.includes('watkins') || name.includes('sonoma') || name.includes('road') || name.includes('roval')) {
    return 'road_course';
  }
  if (name.includes('bristol') || name.includes('martinsville') || name.includes('richmond')) {
    return 'short';
  }
  if (name.includes('dirt') || name.includes('eldora')) {
    return 'dirt';
  }
  
  return 'intermediate';
};

// Error handling utilities
export const createRacingError = (message: string, type: 'validation' | 'api' | 'cache' | 'processing' = 'processing'): Error => {
  const error = new Error(message);
  error.name = `Racing${type.charAt(0).toUpperCase() + type.slice(1)}Error`;
  return error;
};

// Performance utilities
export const measureRacingApiPerformance = <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> => {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      console.log(`Racing API operation "${operationName}" completed in ${duration.toFixed(2)}ms`);
      
      resolve({ result, duration });
    } catch (error) {
      const duration = performance.now() - startTime;
      
      console.error(`Racing API operation "${operationName}" failed after ${duration.toFixed(2)}ms:`, error);
      
      reject(error);
    }
  });
};