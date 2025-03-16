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

export interface UFCFight {
  id: string;
  fighter1: UFCFighter;
  fighter2: UFCFighter;
  weightClass: string;
  isTitleFight: boolean;
  rounds: number;
}