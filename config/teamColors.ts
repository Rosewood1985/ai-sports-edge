/**
 * Team colors database for major sports leagues
 * Includes primary and secondary colors with neon variants for UI
 */

export interface TeamColor {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  neonPrimaryColor: string;
  neonSecondaryColor: string;
}

export interface TeamColorsDatabase {
  nba: Record<string, TeamColor>;
  nfl: Record<string, TeamColor>;
  mlb: Record<string, TeamColor>;
  nhl: Record<string, TeamColor>;
  wnba: Record<string, TeamColor>;
  ncaab: Record<string, TeamColor>;
}

// Helper function to generate neon variant of a color
export const generateNeonVariant = (hexColor: string): string => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Brighten the color for neon effect
  const brightenFactor = 0.3;
  const nr = Math.min(255, r + (255 - r) * brightenFactor);
  const ng = Math.min(255, g + (255 - g) * brightenFactor);
  const nb = Math.min(255, b + (255 - b) * brightenFactor);
  
  // Convert back to hex
  return `#${Math.round(nr).toString(16).padStart(2, '0')}${Math.round(ng).toString(16).padStart(2, '0')}${Math.round(nb).toString(16).padStart(2, '0')}`;
};

// Team colors database
export const teamColorsData: TeamColorsDatabase = {
  nba: {
    lakers: {
      name: "Los Angeles Lakers",
      primaryColor: "#552583",
      secondaryColor: "#FDB927",
      neonPrimaryColor: "#7747A3",
      neonSecondaryColor: "#FFDB8C"
    },
    warriors: {
      name: "Golden State Warriors",
      primaryColor: "#1D428A",
      secondaryColor: "#FFC72C",
      neonPrimaryColor: "#3D62AA",
      neonSecondaryColor: "#FFD74C"
    },
    celtics: {
      name: "Boston Celtics",
      primaryColor: "#007A33",
      secondaryColor: "#BA9653",
      neonPrimaryColor: "#20AA53",
      neonSecondaryColor: "#DAB673"
    },
    // Add more NBA teams as needed
  },
  nfl: {
    chiefs: {
      name: "Kansas City Chiefs",
      primaryColor: "#E31837",
      secondaryColor: "#FFB81C",
      neonPrimaryColor: "#FF3857",
      neonSecondaryColor: "#FFD83C"
    },
    fortyniners: {
      name: "San Francisco 49ers",
      primaryColor: "#AA0000",
      secondaryColor: "#B3995D",
      neonPrimaryColor: "#CA2020",
      neonSecondaryColor: "#D3B97D"
    },
    // Add more NFL teams as needed
  },
  mlb: {
    yankees: {
      name: "New York Yankees",
      primaryColor: "#0C2340",
      secondaryColor: "#FFFFFF",
      neonPrimaryColor: "#2C4360",
      neonSecondaryColor: "#FFFFFF"
    },
    dodgers: {
      name: "Los Angeles Dodgers",
      primaryColor: "#005A9C",
      secondaryColor: "#A5ACAF",
      neonPrimaryColor: "#207ABC",
      neonSecondaryColor: "#C5CCCF"
    },
    // Add more MLB teams as needed
  },
  nhl: {
    goldenknights: {
      name: "Vegas Golden Knights",
      primaryColor: "#B4975A",
      secondaryColor: "#333F42",
      neonPrimaryColor: "#D4B77A",
      neonSecondaryColor: "#535F62"
    },
    rangers: {
      name: "New York Rangers",
      primaryColor: "#0038A8",
      secondaryColor: "#CE1126",
      neonPrimaryColor: "#2058C8",
      neonSecondaryColor: "#EE3146"
    },
    // Add more NHL teams as needed
  },
  wnba: {
    liberty: {
      name: "New York Liberty",
      primaryColor: "#6ECEB2",
      secondaryColor: "#000000",
      neonPrimaryColor: "#8EEED2",
      neonSecondaryColor: "#404040"
    },
    aces: {
      name: "Las Vegas Aces",
      primaryColor: "#000000",
      secondaryColor: "#A9A9A9",
      neonPrimaryColor: "#404040",
      neonSecondaryColor: "#C9C9C9"
    },
    // Add more WNBA teams as needed
  },
  ncaab: {
    gonzaga: {
      name: "Gonzaga Bulldogs",
      primaryColor: "#041E42",
      secondaryColor: "#C8102E",
      neonPrimaryColor: "#243E62",
      neonSecondaryColor: "#E8304E"
    },
    duke: {
      name: "Duke Blue Devils",
      primaryColor: "#001A57",
      secondaryColor: "#FFFFFF",
      neonPrimaryColor: "#203A77",
      neonSecondaryColor: "#FFFFFF"
    },
    // Add more NCAA teams as needed
  }
};

// Export a function to get team colors by ID
export const getTeamColors = (teamId: string): TeamColor | null => {
  // Extract league and team from ID (format: "league-team")
  const [league, team] = teamId.split('-');
  
  if (!league || !team) return null;
  
  // Get team colors from database
  const leagueData = teamColorsData[league as keyof TeamColorsDatabase];
  if (!leagueData) return null;
  
  return leagueData[team] || null;
};

// Export a function to get all teams for a league
export const getLeagueTeams = (league: string): Array<TeamColor & { id: string }> => {
  const leagueData = teamColorsData[league as keyof TeamColorsDatabase];
  if (!leagueData) return [];
  
  return Object.entries(leagueData).map(([id, team]) => ({
    id: `${league}-${id}`,
    ...team,
  }));
};

// Export a function to get all teams
export const getAllTeams = (): Array<TeamColor & { id: string; league: string }> => {
  const teams: Array<TeamColor & { id: string; league: string }> = [];
  
  Object.entries(teamColorsData).forEach(([league, leagueData]) => {
    Object.entries(leagueData).forEach(([id, teamData]) => {
      const team = teamData as TeamColor;
      teams.push({
        id: `${league}-${id}`,
        league,
        name: team.name,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        neonPrimaryColor: team.neonPrimaryColor,
        neonSecondaryColor: team.neonSecondaryColor
      });
    });
  });
  
  return teams;
};

export default {
  teamColorsData,
  getTeamColors,
  getLeagueTeams,
  getAllTeams,
  generateNeonVariant
};