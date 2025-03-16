export interface League {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strCountry: string;
  strLeagueAlternate?: string;
  isCollege?: boolean;
}

export interface Team {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string;
  strLeague: string;
  strStadium?: string;
  strTeamBadge?: string; // URL to team logo
}

export interface Event {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strLeague: string;
  dateEvent: string;
  strTime: string;
  strVenue?: string;
}

export interface LeagueFilter {
  country?: string;
  sport?: string;
  isCollege?: boolean;
}