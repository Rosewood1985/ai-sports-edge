import { UFCFighter, UFCEvent, UFCFight } from '../types/ufc';
import { ApiError } from '../utils/errorHandling';
import axios from 'axios';
import {
  ODDS_API_CONFIG,
  SHERDOG_API_CONFIG,
  fetchFromSherdogApi,
  fetchUFCOdds,
  scrapeUFCData
} from '../config/ufcApi';

// Cache duration in milliseconds (30 minutes)

// Custom error handling for UFC service
function handleUfcApiError<T>(message: string, error: unknown, fallbackValue: T): T {
  console.error(`${message}:`, error);
  
  if (error instanceof ApiError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new ApiError(`${message}: ${error.message}`);
  }
  
  throw new ApiError(`${message}: ${String(error)}`);
}
const CACHE_DURATION = 30 * 60 * 1000;

// Cache storage
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class UFCService {
  private apiKey: string = 'YOUR_UFC_API_KEY'; // Replace with actual API key
  private baseUrl: string = 'https://api.ufc.com/v1'; // Replace with actual API URL
  private eventsCache: CacheItem<UFCEvent[]> | null = null;
  private fightersCache: CacheItem<UFCFighter[]> | null = null;
  private fighterDetailsCache: Map<string, CacheItem<UFCFighter>> = new Map();
  private eventDetailsCache: Map<string, CacheItem<UFCEvent>> = new Map();
  
  private isCacheValid<T>(cache: CacheItem<T> | null): boolean {
    if (!cache) return false;
    return Date.now() - cache.timestamp < CACHE_DURATION;
  }

  /**
   * Fetch upcoming UFC events
   */
  async fetchUpcomingEvents(): Promise<UFCEvent[]> {
    try {
      if (this.isCacheValid(this.eventsCache)) {
        return this.eventsCache!.data;
      }
      
      // First, try to get events from Sherdog API
      const sherdogEvents = await fetchFromSherdogApi<any>('/events/upcoming/ufc');
      
      // Then, get odds from Odds API
      const oddsData = await fetchUFCOdds();
      
      // Map Sherdog events to our UFCEvent format
      const events: UFCEvent[] = await Promise.all(
        sherdogEvents.map(async (event: any) => {
          // Find odds for this event
          const eventOdds = oddsData.find((odds: any) =>
            odds.home_team.toLowerCase().includes(event.fighter1.name.toLowerCase()) ||
            odds.away_team.toLowerCase().includes(event.fighter1.name.toLowerCase()) ||
            odds.home_team.toLowerCase().includes(event.fighter2.name.toLowerCase()) ||
            odds.away_team.toLowerCase().includes(event.fighter2.name.toLowerCase())
          );
          
          // Get fighter details
          const fighter1 = await this.fetchFighterFromSherdog(event.fighter1.id);
          const fighter2 = await this.fetchFighterFromSherdog(event.fighter2.id);
          
          // Create fight object
          const fight: UFCFight = {
            id: `fight-${event.id}`,
            fighter1,
            fighter2,
            weightClass: event.weight_class || 'Unknown',
            isTitleFight: event.is_title_fight || false,
            rounds: event.rounds || 3
          };
          
          // Create event object
          return {
            id: `event-${event.id}`,
            name: event.name,
            date: new Date(event.date).toISOString().split('T')[0],
            time: new Date(event.date).toTimeString().split(' ')[0],
            venue: event.venue || 'TBA',
            location: event.location || 'TBA',
            mainCard: [fight],
            prelimCard: []
          };
        })
      );
      
      // If no events from Sherdog, try scraping UFC website
      if (events.length === 0) {
        try {
          const scrapedEvents = await this.scrapeUFCEvents();
          if (scrapedEvents.length > 0) {
            events.push(...scrapedEvents);
          }
        } catch (scrapeError) {
          console.error('Error scraping UFC events:', scrapeError);
          // Continue with empty events if scraping fails
        }
      }
      
      // If still no events, use fallback mock data
      if (events.length === 0) {
        const mockEvents: UFCEvent[] = [
          {
            id: 'ufc-001',
            name: 'UFC 300: Legacy',
            date: '2025-04-12',
            time: '22:00:00',
            venue: 'T-Mobile Arena',
            location: 'Las Vegas, NV',
            mainCard: [
              {
                id: 'fight-001',
                fighter1: {
                  id: 'fighter-001',
                  name: 'Jon Jones',
                  nickname: 'Bones',
                  weightClass: 'Heavyweight',
                  record: '27-1-0',
                  imageUrl: 'https://example.com/jon-jones.jpg',
                  country: 'USA',
                  isActive: true
                },
                fighter2: {
                  id: 'fighter-002',
                  name: 'Stipe Miocic',
                  nickname: '',
                  weightClass: 'Heavyweight',
                  record: '20-4-0',
                  imageUrl: 'https://example.com/stipe-miocic.jpg',
                  country: 'USA',
                  isActive: true
                },
                weightClass: 'Heavyweight',
                isTitleFight: true,
                rounds: 5
              }
            ],
            prelimCard: []
          }
        ];
        events.push(...mockEvents);
      }
      
      // Update cache
      this.eventsCache = {
        data: events,
        timestamp: Date.now()
      };
      
      return events;
    } catch (error) {
      console.error('Error fetching UFC events:', error);
      // In case of error, throw the error (fallback value is not used)
      return handleUfcApiError('Error fetching UFC events', error, [] as UFCEvent[]);
    }
  }
  
  /**
   * Fetch fighter details from Sherdog
   * @private
   */
  private async fetchFighterFromSherdog(fighterId: string): Promise<UFCFighter> {
    try {
      const fighter = await fetchFromSherdogApi<any>(`/fighters/${fighterId}`);
      
      return {
        id: `fighter-${fighter.id}`,
        name: fighter.name,
        nickname: fighter.nickname || '',
        weightClass: fighter.weight_class || 'Unknown',
        record: `${fighter.wins}-${fighter.losses}-${fighter.draws}`,
        imageUrl: fighter.image_url || '',
        country: fighter.nationality || 'Unknown',
        isActive: fighter.status === 'active'
      };
    } catch (error) {
      console.error(`Error fetching fighter from Sherdog (${fighterId}):`, error);
      
      // Return a default fighter object
      return {
        id: `fighter-${fighterId}`,
        name: 'Unknown Fighter',
        weightClass: 'Unknown',
        record: '0-0-0',
        isActive: true
      };
    }
  }
  
  /**
   * Scrape UFC events from UFC website
   * @private
   */
  private async scrapeUFCEvents(): Promise<UFCEvent[]> {
    try {
      // This is a simplified version - in a real implementation, you would use a more robust scraping solution
      const html = await scrapeUFCData('/events');
      
      // In a real implementation, you would parse the HTML to extract event data
      // For now, we'll just return an empty array
      return [];
    } catch (error) {
      console.error('Error scraping UFC events:', error);
      return [];
    }
  }

  /**
   * Fetch all UFC fighters
   */
  async fetchAllFighters(): Promise<UFCFighter[]> {
    try {
      if (this.isCacheValid(this.fightersCache)) {
        return this.fightersCache!.data;
      }
      
      // Try to get fighters from Sherdog API
      const sherdogFighters = await fetchFromSherdogApi<any>('/fighters/ufc');
      
      // Map Sherdog fighters to our UFCFighter format
      const fighters: UFCFighter[] = sherdogFighters.map((fighter: any) => ({
        id: `fighter-${fighter.id}`,
        name: fighter.name,
        nickname: fighter.nickname || '',
        weightClass: fighter.weight_class || 'Unknown',
        record: `${fighter.wins}-${fighter.losses}-${fighter.draws}`,
        imageUrl: fighter.image_url || '',
        country: fighter.nationality || 'Unknown',
        isActive: fighter.status === 'active'
      }));
      
      // If no fighters from Sherdog, try scraping UFC website
      if (fighters.length === 0) {
        try {
          const scrapedFighters = await this.scrapeUFCFighters();
          if (scrapedFighters.length > 0) {
            fighters.push(...scrapedFighters);
          }
        } catch (scrapeError) {
          console.error('Error scraping UFC fighters:', scrapeError);
          // Continue with empty fighters if scraping fails
        }
      }
      
      // If still no fighters, use fallback mock data
      if (fighters.length === 0) {
        const mockFighters: UFCFighter[] = [
          {
            id: 'fighter-001',
            name: 'Jon Jones',
            nickname: 'Bones',
            weightClass: 'Heavyweight',
            record: '27-1-0',
            imageUrl: 'https://example.com/jon-jones.jpg',
            country: 'USA',
            isActive: true
          },
          {
            id: 'fighter-002',
            name: 'Stipe Miocic',
            nickname: '',
            weightClass: 'Heavyweight',
            record: '20-4-0',
            imageUrl: 'https://example.com/stipe-miocic.jpg',
            country: 'USA',
            isActive: true
          },
          {
            id: 'fighter-003',
            name: 'Leon Edwards',
            nickname: 'Rocky',
            weightClass: 'Welterweight',
            record: '21-3-0',
            imageUrl: 'https://example.com/leon-edwards.jpg',
            country: 'UK',
            isActive: true
          },
          {
            id: 'fighter-004',
            name: 'Belal Muhammad',
            nickname: 'Remember the Name',
            weightClass: 'Welterweight',
            record: '22-3-0',
            imageUrl: 'https://example.com/belal-muhammad.jpg',
            country: 'USA',
            isActive: true
          }
        ];
        fighters.push(...mockFighters);
      }
      
      // Update cache
      this.fightersCache = {
        data: fighters,
        timestamp: Date.now()
      };
      
      return fighters;
    } catch (error) {
      console.error('Error fetching UFC fighters:', error);
      return handleUfcApiError('Error fetching UFC fighters', error, [] as UFCFighter[]);
    }
  }
  
  /**
   * Scrape UFC fighters from UFC website
   * @private
   */
  private async scrapeUFCFighters(): Promise<UFCFighter[]> {
    try {
      // This is a simplified version - in a real implementation, you would use a more robust scraping solution
      const html = await scrapeUFCData('/athletes');
      
      // In a real implementation, you would parse the HTML to extract fighter data
      // For now, we'll just return an empty array
      return [];
    } catch (error) {
      console.error('Error scraping UFC fighters:', error);
      return [];
    }
  }

  /**
   * Fetch UFC fighter details
   */
  async fetchFighter(fighterId: string): Promise<UFCFighter> {
    try {
      // Check cache first
      if (this.fighterDetailsCache.has(fighterId) &&
          this.isCacheValid(this.fighterDetailsCache.get(fighterId)!)) {
        return this.fighterDetailsCache.get(fighterId)!.data;
      }
      
      // Extract the actual fighter ID from our prefixed ID format
      const sherdogId = fighterId.startsWith('fighter-') ? fighterId.substring(8) : fighterId;
      
      try {
        // Try to get fighter from Sherdog API
        const fighter = await this.fetchFighterFromSherdog(sherdogId);
        
        // Update cache
        this.fighterDetailsCache.set(fighterId, {
          data: fighter,
          timestamp: Date.now()
        });
        
        return fighter;
      } catch (sherdogError) {
        console.error(`Error fetching fighter from Sherdog (${fighterId}):`, sherdogError);
        
        // If Sherdog API fails, try to find fighter in our local cache of all fighters
        const allFighters = await this.fetchAllFighters();
        const fighter = allFighters.find(f => f.id === fighterId);
        
        if (!fighter) {
          throw new Error(`Fighter with ID ${fighterId} not found`);
        }
        
        // Update cache
        this.fighterDetailsCache.set(fighterId, {
          data: fighter,
          timestamp: Date.now()
        });
        
        return fighter;
      }
    } catch (error) {
      console.error(`Error fetching fighter ${fighterId}:`, error);
      // Create a default fighter object as fallback (though it will never be used due to throwing)
      const defaultFighter: UFCFighter = {
        id: '',
        name: '',
        weightClass: '',
        record: '',
        isActive: false
      };
      return handleUfcApiError(`Error fetching fighter ${fighterId}`, error, defaultFighter);
    }
  }

  /**
   * Fetch UFC event details
   */
  async fetchEvent(eventId: string): Promise<UFCEvent> {
    try {
      // Check cache first
      if (this.eventDetailsCache.has(eventId) &&
          this.isCacheValid(this.eventDetailsCache.get(eventId)!)) {
        return this.eventDetailsCache.get(eventId)!.data;
      }
      
      // Extract the actual event ID from our prefixed ID format
      const sherdogId = eventId.startsWith('event-') ? eventId.substring(6) : eventId;
      
      try {
        // Try to get event from Sherdog API
        const sherdogEvent = await fetchFromSherdogApi<any>(`/events/${sherdogId}`);
        
        // Get odds from Odds API
        const oddsData = await fetchUFCOdds();
        
        // Find odds for this event
        const eventOdds = oddsData.find((odds: any) => {
          const mainEvent = sherdogEvent.fights?.[0];
          if (!mainEvent) return false;
          
          return odds.home_team.toLowerCase().includes(mainEvent.fighter1.name.toLowerCase()) ||
                 odds.away_team.toLowerCase().includes(mainEvent.fighter1.name.toLowerCase()) ||
                 odds.home_team.toLowerCase().includes(mainEvent.fighter2.name.toLowerCase()) ||
                 odds.away_team.toLowerCase().includes(mainEvent.fighter2.name.toLowerCase());
        });
        
        // Create fights array
        const mainCard: UFCFight[] = await Promise.all(
          (sherdogEvent.fights || []).slice(0, 5).map(async (fight: any) => {
            const fighter1 = await this.fetchFighterFromSherdog(fight.fighter1.id);
            const fighter2 = await this.fetchFighterFromSherdog(fight.fighter2.id);
            
            return {
              id: `fight-${fight.id}`,
              fighter1,
              fighter2,
              weightClass: fight.weight_class || 'Unknown',
              isTitleFight: fight.is_title_fight || false,
              rounds: fight.rounds || 3
            };
          })
        );
        
        const prelimCard: UFCFight[] = await Promise.all(
          (sherdogEvent.fights || []).slice(5).map(async (fight: any) => {
            const fighter1 = await this.fetchFighterFromSherdog(fight.fighter1.id);
            const fighter2 = await this.fetchFighterFromSherdog(fight.fighter2.id);
            
            return {
              id: `fight-${fight.id}`,
              fighter1,
              fighter2,
              weightClass: fight.weight_class || 'Unknown',
              isTitleFight: false,
              rounds: 3
            };
          })
        );
        
        // Create event object
        const event: UFCEvent = {
          id: eventId,
          name: sherdogEvent.name,
          date: new Date(sherdogEvent.date).toISOString().split('T')[0],
          time: new Date(sherdogEvent.date).toTimeString().split(' ')[0],
          venue: sherdogEvent.venue || 'TBA',
          location: sherdogEvent.location || 'TBA',
          mainCard,
          prelimCard
        };
        
        // Update cache
        this.eventDetailsCache.set(eventId, {
          data: event,
          timestamp: Date.now()
        });
        
        return event;
      } catch (sherdogError) {
        console.error(`Error fetching event from Sherdog (${eventId}):`, sherdogError);
        
        // If Sherdog API fails, try to find event in our local cache of all events
        const allEvents = await this.fetchUpcomingEvents();
        const event = allEvents.find(e => e.id === eventId);
        
        if (!event) {
          throw new Error(`Event with ID ${eventId} not found`);
        }
        
        // Update cache
        this.eventDetailsCache.set(eventId, {
          data: event,
          timestamp: Date.now()
        });
        
        return event;
      }
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      // Create a default event object as fallback (though it will never be used due to throwing)
      const defaultEvent: UFCEvent = {
        id: '',
        name: '',
        date: '',
        time: '',
        mainCard: []
      };
      return handleUfcApiError(`Error fetching event ${eventId}`, error, defaultEvent);
    }
  }

  /**
   * Search UFC fighters
   */
  async searchFighters(query: string): Promise<UFCFighter[]> {
    try {
      // Try to search fighters directly from Sherdog API
      try {
        const searchResults = await fetchFromSherdogApi<any>('/search', { q: query, type: 'fighters' });
        
        // Map search results to our UFCFighter format
        const fighters: UFCFighter[] = await Promise.all(
          searchResults.map(async (result: any) => {
            // If the result is just a reference, fetch the full fighter details
            if (!result.record) {
              return await this.fetchFighterFromSherdog(result.id);
            }
            
            // Otherwise, map the result directly
            return {
              id: `fighter-${result.id}`,
              name: result.name,
              nickname: result.nickname || '',
              weightClass: result.weight_class || 'Unknown',
              record: result.record || '0-0-0',
              imageUrl: result.image_url || '',
              country: result.nationality || 'Unknown',
              isActive: result.status === 'active'
            };
          })
        );
        
        return fighters;
      } catch (sherdogError) {
        console.error(`Error searching fighters from Sherdog for "${query}":`, sherdogError);
        
        // If Sherdog API search fails, fall back to local search
        const allFighters = await this.fetchAllFighters();
        
        // Filter fighters based on query
        const normalizedQuery = query.toLowerCase();
        return allFighters.filter(fighter =>
          fighter.name.toLowerCase().includes(normalizedQuery) ||
          fighter.nickname?.toLowerCase().includes(normalizedQuery) ||
          fighter.weightClass.toLowerCase().includes(normalizedQuery)
        );
      }
    } catch (error) {
      console.error(`Error searching fighters for "${query}":`, error);
      return handleUfcApiError(`Error searching fighters for "${query}"`, error, [] as UFCFighter[]);
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.eventsCache = null;
    this.fightersCache = null;
    this.fighterDetailsCache.clear();
    this.eventDetailsCache.clear();
  }
}

// Export as singleton
export const ufcService = new UFCService();