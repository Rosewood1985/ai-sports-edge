/**
 * Possible outcomes of a fight
 */
export enum FightOutcome {
  KO = 'KO',
  TKO = 'TKO',
  SUBMISSION = 'Submission',
  DECISION = 'Decision',
  DQ = 'Disqualification',
  DRAW = 'Draw',
  NO_CONTEST = 'No Contest',
}

/**
 * Fight status
 */
export enum FightStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

/**
 * Fighter information
 */
export interface UFCFighter {
  id: string;
  name: string;
  nickname?: string;
  weightClass: string;
  record: string;
  imageUrl?: string;
  country?: string;
  isActive: boolean;
}

/**
 * UFC event information
 */
export interface UFCEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue?: string;
  location?: string;
  mainCard: UFCFight[];
  prelimCard?: UFCFight[];
}

/**
 * Round betting option
 */
export interface RoundBettingOption {
  id: string;
  fightId: string;
  fighterId: string;
  round: number;
  outcome: FightOutcome;
  odds: number;
}

/**
 * UFC fight information
 */
export interface UFCFight {
  id: string;
  fighter1: UFCFighter;
  fighter2: UFCFighter;
  weightClass: string;
  isTitleFight: boolean;
  rounds: number;

  // New properties for round betting
  roundBettingOptions?: RoundBettingOption[];
  startTime?: string;
  status?: FightStatus;
  winner?: string; // Fighter ID of the winner
  winMethod?: FightOutcome;
  winRound?: number;
}
