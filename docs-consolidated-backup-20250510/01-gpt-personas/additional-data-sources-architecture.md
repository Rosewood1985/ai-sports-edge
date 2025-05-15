# Additional Data Sources Integration Architecture

## Overview

This document outlines the architecture for integrating additional sports data APIs into AI Sports Edge to provide more comprehensive statistics. The goal is to enrich the app's data ecosystem with diverse, high-quality sports data to enhance user insights and predictions.

## Goals

1. Integrate with multiple sports data APIs to provide comprehensive statistics
2. Create a unified data model that normalizes data from different sources
3. Implement efficient caching and synchronization strategies
4. Provide a seamless user experience with rich, detailed sports data

## Architecture Components

### 1. Data Source Integration Layer

A flexible layer for integrating with various sports data providers.

```typescript
// services/dataSourceService.ts

export interface DataSourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  apiKeyHeader?: string;
  defaultParams?: Record<string, string>;
  rateLimitPerMinute: number;
  endpoints: Record<string, EndpointConfig>;
  transformers: Record<string, string>; // Function names for data transformation
  enabled: boolean;
}

export interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST';
  params?: Record<string, string>;
  responseType: 'json' | 'xml';
  cacheTTL: number; // Time to live in seconds
}

export class DataSourceManager {
  private dataSources: Map<string, DataSourceConfig> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  
  constructor() {
    // Load data source configurations
    this.loadDataSourceConfigs();
  }
  
  private async loadDataSourceConfigs() {
    try {
      const configs = await firestore.collection('dataSourceConfigs').get();
      configs.forEach(doc => {
        const config = doc.data() as DataSourceConfig;
        this.dataSources.set(config.id, config);
        this.rateLimiters.set(config.id, new RateLimiter(config.rateLimitPerMinute));
      });
    } catch (error) {
      console.error('Error loading data source configs:', error);
    }
  }
  
  public async fetchData<T>(
    sourceId: string,
    endpointId: string,
    params?: Record<string, string>
  ): Promise<T> {
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Data source not found: ${sourceId}`);
    }
    
    if (!source.enabled) {
      throw new Error(`Data source is disabled: ${sourceId}`);
    }
    
    const endpoint = source.endpoints[endpointId];
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }
    
    // Check cache first
    const cacheKey = this.generateCacheKey(sourceId, endpointId, params);
    const cachedData = await cacheService.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Apply rate limiting
    const rateLimiter = this.rateLimiters.get(sourceId);
    await rateLimiter.waitForToken();
    
    // Prepare request
    const url = `${source.baseUrl}${endpoint.path}`;
    const headers: Record<string, string> = {};
    
    if (source.apiKey && source.apiKeyHeader) {
      headers[source.apiKeyHeader] = source.apiKey;
    }
    
    const mergedParams = {
      ...source.defaultParams,
      ...endpoint.params,
      ...params
    };
    
    // Make request
    try {
      const response = await axios({
        method: endpoint.method,
        url,
        headers,
        params: mergedParams
      });
      
      // Transform data if needed
      let data = response.data;
      if (source.transformers[endpointId]) {
        const transformer = this.getTransformer(source.transformers[endpointId]);
        data = transformer(data);
      }
      
      // Cache result
      await cacheService.set(cacheKey, data, endpoint.cacheTTL);
      
      return data as T;
    } catch (error) {
      console.error(`Error fetching data from ${sourceId}/${endpointId}:`, error);
      throw error;
    }
  }
  
  private generateCacheKey(
    sourceId: string,
    endpointId: string,
    params?: Record<string, string>
  ): string {
    return `datasource:${sourceId}:${endpointId}:${JSON.stringify(params || {})}`;
  }
  
  private getTransformer(transformerName: string): (data: any) => any {
    return dataTransformers[transformerName];
  }
}
```

### 2. Unified Data Model

A consistent data model that normalizes data from different sources.

```typescript
// models/unifiedSportsData.ts

// Core entities
export interface Team {
  id: string;
  sourceIds: Record<string, string>; // Map of source ID to source-specific ID
  name: string;
  abbreviation: string;
  location: string;
  mascot?: string;
  conference?: string;
  division?: string;
  logo?: string;
  colors?: string[];
  venueId?: string;
  stats?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Player {
  id: string;
  sourceIds: Record<string, string>;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  jerseyNumber?: string;
  height?: number; // in cm
  weight?: number; // in kg
  birthDate?: Date;
  college?: string;
  rookie?: boolean;
  teamId: string;
  status?: string;
  injuryStatus?: string;
  photoUrl?: string;
  stats?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Game {
  id: string;
  sourceIds: Record<string, string>;
  sport: string;
  league: string;
  season: string;
  seasonType: 'preseason' | 'regular' | 'postseason';
  homeTeamId: string;
  awayTeamId: string;
  venueId?: string;
  startTime: Date;
  status: 'scheduled' | 'inProgress' | 'final' | 'postponed' | 'cancelled';
  clock?: string;
  period?: number;
  homeScore?: number;
  awayScore?: number;
  weather?: Weather;
  attendance?: number;
  broadcasts?: string[];
  odds?: GameOdds[];
  stats?: GameStats;
  metadata?: Record<string, any>;
}

// Supporting types
export interface Weather {
  condition: string;
  temperature: number; // in Celsius
  humidity: number; // percentage
  windSpeed: number; // in km/h
  windDirection: string;
}

export interface GameOdds {
  provider: string;
  homeMoneyline: number;
  awayMoneyline: number;
  homeSpread: number;
  homeSpreadOdds: number;
  awaySpreadOdds: number;
  over: number;
  overOdds: number;
  under: number;
  underOdds: number;
  updateTime: Date;
}

export interface GameStats {
  home: Record<string, any>;
  away: Record<string, any>;
  players: Record<string, Record<string, any>>;
}

// Sport-specific extensions
export interface BasketballGameStats extends GameStats {
  home: BasketballTeamStats;
  away: BasketballTeamStats;
  players: Record<string, BasketballPlayerStats>;
}

export interface BasketballTeamStats {
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  threePointsMade: number;
  threePointsAttempted: number;
  threePointPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  pointsByQuarter: number[];
}

export interface BasketballPlayerStats {
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointsMade: number;
  threePointsAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  plusMinus: number;
  starter: boolean;
}
```

### 3. Data Synchronization Service

A service for keeping data synchronized across different sources.

```typescript
// services/dataSyncService.ts

export interface SyncConfig {
  entityType: 'teams' | 'players' | 'games' | 'venues' | 'stats';
  sources: string[];
  frequency: number; // in minutes
  priority: 'low' | 'medium' | 'high';
  lastSync?: Date;
  enabled: boolean;
}

export class DataSyncManager {
  private syncConfigs: SyncConfig[] = [];
  private syncJobs: Map<string, NodeJS.Timeout> = new Map();
  private dataSourceManager: DataSourceManager;
  private entityMappers: Record<string, EntityMapper> = {};
  
  constructor(dataSourceManager: DataSourceManager) {
    this.dataSourceManager = dataSourceManager;
    this.initializeEntityMappers();
    this.loadSyncConfigs();
  }
  
  private initializeEntityMappers() {
    this.entityMappers = {
      teams: new TeamMapper(),
      players: new PlayerMapper(),
      games: new GameMapper(),
      venues: new VenueMapper(),
      stats: new StatsMapper()
    };
  }
  
  private async loadSyncConfigs() {
    try {
      const configs = await firestore.collection('syncConfigs').get();
      this.syncConfigs = configs.docs.map(doc => doc.data() as SyncConfig);
      
      // Start sync jobs
      this.startSyncJobs();
    } catch (error) {
      console.error('Error loading sync configs:', error);
    }
  }
  
  private startSyncJobs() {
    // Clear existing jobs
    this.syncJobs.forEach(job => clearInterval(job));
    this.syncJobs.clear();
    
    // Start new jobs
    this.syncConfigs.forEach(config => {
      if (config.enabled) {
        const jobId = `${config.entityType}:${config.sources.join(',')}`;
        const interval = config.frequency * 60 * 1000; // Convert to milliseconds
        
        const job = setInterval(() => this.syncEntity(config), interval);
        this.syncJobs.set(jobId, job);
        
        // Run initial sync
        this.syncEntity(config);
      }
    });
  }
  
  private async syncEntity(config: SyncConfig) {
    try {
      console.log(`Starting sync for ${config.entityType} from sources: ${config.sources.join(', ')}`);
      
      // Get mapper for entity type
      const mapper = this.entityMappers[config.entityType];
      if (!mapper) {
        throw new Error(`No mapper found for entity type: ${config.entityType}`);
      }
      
      // Fetch data from each source
      const sourceData = await Promise.all(
        config.sources.map(async sourceId => {
          try {
            const data = await this.dataSourceManager.fetchData(
              sourceId,
              `get${config.entityType}`,
              {}
            );
            return { sourceId, data };
          } catch (error) {
            console.error(`Error fetching ${config.entityType} from ${sourceId}:`, error);
            return { sourceId, data: null, error };
          }
        })
      );
      
      // Filter out failed sources
      const validSourceData = sourceData.filter(item => item.data !== null);
      
      if (validSourceData.length === 0) {
        throw new Error(`No valid data sources for ${config.entityType}`);
      }
      
      // Map and merge data
      const entities = mapper.mapAndMerge(validSourceData);
      
      // Update database
      await this.updateDatabase(config.entityType, entities);
      
      // Update last sync time
      await this.updateSyncTime(config);
      
      console.log(`Completed sync for ${config.entityType}: ${entities.length} entities updated`);
    } catch (error) {
      console.error(`Error syncing ${config.entityType}:`, error);
    }
  }
  
  private async updateDatabase(entityType: string, entities: any[]) {
    const batch = firestore.batch();
    const collection = firestore.collection(entityType);
    
    for (const entity of entities) {
      const docRef = collection.doc(entity.id);
      batch.set(docRef, entity, { merge: true });
    }
    
    await batch.commit();
  }
  
  private async updateSyncTime(config: SyncConfig) {
    const configRef = firestore.collection('syncConfigs').where('entityType', '==', config.entityType);
    const snapshot = await configRef.get();
    
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        lastSync: new Date()
      });
    }
  }
  
  public async forceSyncEntity(entityType: string, sources?: string[]) {
    const config = this.syncConfigs.find(c => c.entityType === entityType);
    
    if (!config) {
      throw new Error(`No sync config found for entity type: ${entityType}`);
    }
    
    // Override sources if provided
    if (sources && sources.length > 0) {
      config.sources = sources;
    }
    
    await this.syncEntity(config);
  }
}
```

### 4. Entity Mappers

Mappers for transforming source-specific data to the unified model.

```typescript
// services/entityMappers.ts

export interface EntityMapper {
  mapAndMerge(sourceData: Array<{ sourceId: string; data: any }>): any[];
}

export class TeamMapper implements EntityMapper {
  mapAndMerge(sourceData: Array<{ sourceId: string; data: any }>): Team[] {
    // Map teams from each source to unified model
    const teamsBySourceId: Record<string, Record<string, Team>> = {};
    
    // First pass: map each source's teams to unified model
    sourceData.forEach(({ sourceId, data }) => {
      teamsBySourceId[sourceId] = {};
      
      data.teams.forEach(sourceTeam => {
        const team: Team = {
          id: '', // Will be set during merging
          sourceIds: { [sourceId]: sourceTeam.id },
          name: sourceTeam.name,
          abbreviation: sourceTeam.abbreviation || sourceTeam.short_name || '',
          location: sourceTeam.location || sourceTeam.city || '',
          mascot: sourceTeam.mascot || sourceTeam.nickname || '',
          conference: sourceTeam.conference || '',
          division: sourceTeam.division || '',
          logo: sourceTeam.logo_url || sourceTeam.logo || '',
          colors: sourceTeam.colors || [],
          venueId: sourceTeam.venue_id || sourceTeam.stadium_id || '',
          stats: sourceTeam.stats || {},
          metadata: {
            source: sourceId,
            raw: sourceTeam
          }
        };
        
        teamsBySourceId[sourceId][sourceTeam.id] = team;
      });
    });
    
    // Second pass: merge teams across sources
    const mergedTeams: Record<string, Team> = {};
    const teamMappings: Record<string, Record<string, string>> = {};
    
    // Load team mappings from database
    // This would map IDs across different sources
    // e.g., { "espn": { "1": "nba_1" }, "sportRadar": { "sr_123": "nba_1" } }
    
    // Merge teams based on mappings
    Object.entries(teamsBySourceId).forEach(([sourceId, teams]) => {
      Object.entries(teams).forEach(([sourceTeamId, team]) => {
        const mappings = teamMappings[sourceId] || {};
        const unifiedId = mappings[sourceTeamId] || `${sourceId}_${sourceTeamId}`;
        
        if (mergedTeams[unifiedId]) {
          // Merge with existing team
          const existingTeam = mergedTeams[unifiedId];
          existingTeam.sourceIds[sourceId] = sourceTeamId;
          
          // Merge other fields (prefer more complete data)
          if (!existingTeam.logo && team.logo) existingTeam.logo = team.logo;
          if (!existingTeam.colors.length && team.colors.length) existingTeam.colors = team.colors;
          if (!existingTeam.venueId && team.venueId) existingTeam.venueId = team.venueId;
          
          // Merge stats
          existingTeam.stats = { ...existingTeam.stats, ...team.stats };
          
          // Add source-specific metadata
          existingTeam.metadata[sourceId] = team.metadata.raw;
        } else {
          // Create new merged team
          team.id = unifiedId;
          mergedTeams[unifiedId] = team;
        }
      });
    });
    
    return Object.values(mergedTeams);
  }
}

// Similar mappers would be implemented for Player, Game, etc.
```

### 5. API Integration Examples

Examples of integrating with specific sports data APIs:

#### ESPN API Integration

```typescript
// services/espnApiService.ts

export const espnApiConfig: DataSourceConfig = {
  id: 'espn',
  name: 'ESPN API',
  baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
  rateLimitPerMinute: 60,
  endpoints: {
    getTeams: {
      path: '/{sport}/{league}/teams',
      method: 'GET',
      responseType: 'json',
      cacheTTL: 86400 // 24 hours
    },
    getPlayers: {
      path: '/{sport}/{league}/teams/{teamId}/roster',
      method: 'GET',
      responseType: 'json',
      cacheTTL: 86400
    },
    getGames: {
      path: '/{sport}/{league}/scoreboard',
      method: 'GET',
      params: {
        dates: '{date}',
        limit: '100'
      },
      responseType: 'json',
      cacheTTL: 300 // 5 minutes
    },
    getGameDetails: {
      path: '/{sport}/{league}/summary',
      method: 'GET',
      params: {
        event: '{gameId}'
      },
      responseType: 'json',
      cacheTTL: 300
    }
  },
  transformers: {
    getTeams: 'transformEspnTeams',
    getPlayers: 'transformEspnPlayers',
    getGames: 'transformEspnGames',
    getGameDetails: 'transformEspnGameDetails'
  },
  enabled: true
};

// Example transformer
export const transformEspnTeams = (data: any): any[] => {
  if (!data.sports || !data.sports[0] || !data.sports[0].leagues || !data.sports[0].leagues[0] || !data.sports[0].leagues[0].teams) {
    return [];
  }
  
  return data.sports[0].leagues[0].teams.map(team => {
    const teamData = team.team;
    return {
      id: teamData.id,
      name: teamData.displayName,
      abbreviation: teamData.abbreviation,
      location: teamData.location,
      mascot: teamData.name,
      logo: teamData.logos && teamData.logos.length > 0 ? teamData.logos[0].href : null,
      colors: teamData.color ? [teamData.color] : [],
      conference: teamData.conferenceId ? `conference_${teamData.conferenceId}` : '',
      division: teamData.divisionId ? `division_${teamData.divisionId}` : ''
    };
  });
};
```

#### Sports Radar API Integration

```typescript
// services/sportsRadarApiService.ts

export const sportsRadarApiConfig: DataSourceConfig = {
  id: 'sportsRadar',
  name: 'Sports Radar API',
  baseUrl: 'https://api.sportradar.us',
  apiKey: process.env.SPORTS_RADAR_API_KEY,
  apiKeyHeader: 'api_key',
  rateLimitPerMinute: 30,
  endpoints: {
    getTeams: {
      path: '/{sport}/{access_level}/{language_code}/{league}/{season}/teams.json',
      method: 'GET',
      responseType: 'json',
      cacheTTL: 86400
    },
    getPlayers: {
      path: '/{sport}/{access_level}/{language_code}/{league}/{season}/teams/{team_id}/profile.json',
      method: 'GET',
      responseType: 'json',
      cacheTTL: 86400
    },
    getGames: {
      path: '/{sport}/{access_level}/{language_code}/{league}/{season}/schedule.json',
      method: 'GET',
      responseType: 'json',
      cacheTTL: 3600 // 1 hour
    },
    getGameDetails: {
      path: '/{sport}/{access_level}/{language_code}/{league}/{season}/games/{game_id}/summary.json',
      method: 'GET',
      responseType: 'json',
      cacheTTL: 300
    }
  },
  transformers: {
    getTeams: 'transformSportsRadarTeams',
    getPlayers: 'transformSportsRadarPlayers',
    getGames: 'transformSportsRadarGames',
    getGameDetails: 'transformSportsRadarGameDetails'
  },
  enabled: true
};

// Example transformer
export const transformSportsRadarTeams = (data: any): any[] => {
  if (!data.teams) {
    return [];
  }
  
  return data.teams.map(team => {
    return {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      location: team.market,
      mascot: team.name.replace(team.market, '').trim(),
      conference: team.conference ? team.conference.name : '',
      division: team.division ? team.division.name : '',
      venueId: team.venue ? team.venue.id : null
    };
  });
};
```

#### The Odds API Integration

```typescript
// services/oddsApiService.ts

export const oddsApiConfig: DataSourceConfig = {
  id: 'oddsApi',
  name: 'The Odds API',
  baseUrl: 'https://api.the-odds-api.com/v4',
  apiKey: process.env.ODDS_API_KEY,
  apiKeyHeader: 'apiKey',
  rateLimitPerMinute: 10,
  endpoints: {
    getOdds: {
      path: '/sports/{sport}/odds',
      method: 'GET',
      params: {
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american'
      },
      responseType: 'json',
      cacheTTL: 900 // 15 minutes
    },
    getSports: {
      path: '/sports',
      method: 'GET',
      responseType: 'json',
      cacheTTL: 86400
    }
  },
  transformers: {
    getOdds: 'transformOddsApiOdds',
    getSports: 'transformOddsApiSports'
  },
  enabled: true
};

// Example transformer
export const transformOddsApiOdds = (data: any): any[] => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data.map(game => {
    const homeTeam = game.home_team;
    const awayTeam = game.away_team;
    
    const odds = game.bookmakers.map(bookmaker => {
      const markets = {};
      
      bookmaker.markets.forEach(market => {
        if (market.key === 'h2h') {
          const homeOdds = market.outcomes.find(o => o.name === homeTeam);
          const awayOdds = market.outcomes.find(o => o.name === awayTeam);
          
          markets['moneyline'] = {
            home: homeOdds ? homeOdds.price : null,
            away: awayOdds ? awayOdds.price : null
          };
        } else if (market.key === 'spreads') {
          const homeSpread = market.outcomes.find(o => o.name === homeTeam);
          const awaySpread = market.outcomes.find(o => o.name === awayTeam);
          
          markets['spread'] = {
            home: homeSpread ? { point: homeSpread.point, price: homeSpread.price } : null,
            away: awaySpread ? { point: awaySpread.point, price: awaySpread.price } : null
          };
        } else if (market.key === 'totals') {
          const over = market.outcomes.find(o => o.name === 'Over');
          const under = market.outcomes.find(o => o.name === 'Under');
          
          markets['total'] = {
            over: over ? { point: over.point, price: over.price } : null,
            under: under ? { point: under.point, price: under.price } : null
          };
        }
      });
      
      return {
        provider: bookmaker.title,
        markets
      };
    });
    
    return {
      id: game.id,
      sport: game.sport_key,
      homeTeam,
      awayTeam,
      startTime: new Date(game.commence_time * 1000),
      odds
    };
  });
};
```

### 6. Data Visualization Components

Components for displaying the enriched sports data:

```typescript
// components/EnhancedPlayerProfile.tsx

const EnhancedPlayerProfile: React.FC<{ playerId: string }> = ({ playerId }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('stats');
  
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        const playerData = await playerService.getPlayerById(playerId);
        setPlayer(playerData);
      } catch (error) {
        console.error('Error fetching player:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayer();
  }, [playerId]);
  
  if (loading) {
    return <LoadingIndicator />;
  }
  
  if (!player) {
    return <NotFoundMessage message="Player not found" />;
  }
  
  return (
    <View style={styles.container}>
      <PlayerHeader
        name={player.fullName}
        position={player.position}
        team={player.teamId}
        jerseyNumber={player.jerseyNumber}
        photoUrl={player.photoUrl}
      />
      
      <TabBar
        tabs={['Stats', 'Bio', 'News', 'Trends']}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />
      
      {activeTab === 'stats' && (
        <PlayerStats stats={player.stats} position={player.position} />
      )}
      
      {activeTab === 'bio' && (
        <PlayerBio
          height={player.height}
          weight={player.weight}
          birthDate={player.birthDate}
          college={player.college}
          rookie={player.rookie}
          metadata={player.metadata}
        />
      )}
      
      {activeTab === 'news' && (
        <PlayerNews playerId={playerId} />
      )}
      
      {activeTab === 'trends' && (
        <PlayerTrends playerId={playerId} />
      )}
    </View>
  );
};
```

```typescript
// components/AdvancedGameStats.tsx

const AdvancedGameStats: React.FC<{ gameId: string }> = ({ gameId }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('summary');
  
  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const gameData = await gameService.getGameById(gameId);
        setGame(gameData);
      } catch (error) {
        console.error('Error fetching game:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGame();
  }, [gameId]);
  
  if (loading) {
    return <LoadingIndicator />;
  }
  
  if (!game) {
    return <NotFoundMessage message="Game not found" />;
  }
  
  return (
    <View style={styles.container}>
      <GameHeader
        homeTeam={game.homeTeamId}
        awayTeam={game.awayTeamId}
        homeScore={game.homeScore}
        awayScore={game.awayScore}
        status={game.status}
        startTime={game.startTime}
      />
      
      <TabBar
        tabs={['Summary', 'Box Score', 'Play-by-Play', 'Team Stats', 'Player Stats']}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />
      
      {activeTab === 'summary' && (
        <GameSummary game={game} />
      )}
      
      {activeTab === 'box-score' && (
        <BoxScore stats={game.stats} />
      )}
      
      {activeTab === 'play-by-play' && (
        <PlayByPlay gameId={gameId} />
      )}
      
      {activeTab === 'team-stats' && (
        <TeamStats homeStats={game.stats?.home} awayStats={game.stats?.away} />
      )}
      
      {activeTab === 'player-stats' && (
        <PlayerStatsList playerStats={game.stats?.players} />
      )}
    </View>
  );
};
```

## Implementation Plan

1. **Phase 1: Core Integration Framework (7 days)**
   - Implement DataSourceManager
   - Create unified data model
   - Build basic API integration framework
   - Set up caching system

2. **Phase 2: Initial API Integrations (10 days)**
   - Integrate with ESPN API
   - Integrate with Sports Radar API
   - Integrate with The Odds API
   - Implement data transformers

3. **Phase 3: Data Synchronization (5 days)**
   - Implement DataSyncManager
   - Create entity mappers
   - Set up scheduled synchronization
   - Build conflict resolution system

4. **Phase 4: UI Components (7 days)**
   - Create enhanced player profile components
   - Build advanced game stats components
   - Implement team statistics views
   - Develop data visualization components

5. **Phase 5: Testing and Optimization (3 days)**
   - Test API integrations
   - Optimize caching strategies
   - Implement error handling and fallbacks
   - Performance testing

## Success Metrics

The success of this implementation will be measured by:

1. **Data Completeness**: Coverage of sports, leagues, teams, and players
2. **Data Freshness**: How quickly new data is available in the app
3. **API Efficiency**: Minimizing API calls through effective caching
4. **User Engagement**: Increase in time spent viewing statistics
5. **Feature Adoption**: Usage of new data-enriched features

## Future Enhancements

1. **Real-time Data**: Implement WebSocket connections for live updates
2. **Historical Data**: Add historical data for trend analysis
3. **Advanced Statistics**: Calculate proprietary advanced statistics
4. **Data Export**: Allow users to export statistics in various formats
5. **Custom Data Views**: Enable users to create personalized statistics dashboards