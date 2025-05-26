// =============================================================================
// BOXING DATA SYNC SERVICE
// Comprehensive Boxing and MMA Data Integration with Fight Analytics
// =============================================================================

// Firebase admin types for TypeScript compatibility
interface FirestoreFieldValue {
  increment: (value: number) => any;
}

interface AdminFirestore {
  firestore: {
    FieldValue: FirestoreFieldValue;
  };
}

// Mock Firebase admin for development
const admin: AdminFirestore = {
  firestore: {
    FieldValue: {
      increment: (value: number) => ({ _increment: value })
    }
  }
};

// Simple Sentry placeholder for monitoring
const Sentry = {
  addBreadcrumb: (options: any) => console.log('Sentry breadcrumb:', options.message),
  captureException: (error: any) => console.error('Sentry error:', error)
};

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
};

export interface BoxingFighter {
  id: string;
  name: string;
  nickname?: string;
  record: {
    wins: number;
    losses: number;
    draws: number;
    knockouts: number;
    technicalKnockouts: number;
  };
  physicalStats: {
    height: string; // e.g., "6'2\""
    reach: string; // e.g., "78\""
    weight: number; // Current weight
    stance: 'Orthodox' | 'Southpaw' | 'Switch';
    age: number;
  };
  weightClass: string;
  rankings: {
    wba?: number;
    wbc?: number;
    ibf?: number;
    wbo?: number;
    ring?: number;
    boxrec?: number;
  };
  nationality: string;
  turnedPro: Date;
  lastFight: Date;
  careerEarnings: number;
  promoter?: string;
  manager?: string;
  trainer?: string;
  gym?: string;
}

export interface BoxingFight {
  id: string;
  fighter1: string; // Fighter ID
  fighter2: string; // Fighter ID
  date: Date;
  venue: {
    name: string;
    city: string;
    state?: string;
    country: string;
    capacity: number;
  };
  weightClass: string;
  scheduledRounds: number;
  titles: string[]; // Championship titles at stake
  network?: string; // TV/Streaming network
  promoter: string;
  status: 'scheduled' | 'postponed' | 'cancelled' | 'completed';
  result?: {
    winner: string; // Fighter ID
    method: 'KO' | 'TKO' | 'UD' | 'MD' | 'SD' | 'DQ' | 'NC' | 'Draw';
    round?: number;
    time?: string; // MM:SS format
    details?: string;
  };
  betting: {
    fighter1Odds: number;
    fighter2Odds: number;
    totalRounds?: {
      over: number;
      under: number;
      line: number;
    };
    methodOdds?: {
      ko: number;
      decision: number;
      draw: number;
    };
  };
  fightCard: 'main-event' | 'co-main' | 'undercard' | 'prelims';
  attendance?: number;
  purse?: {
    fighter1: number;
    fighter2: number;
  };
}

export interface BoxingEvent {
  id: string;
  name: string;
  date: Date;
  venue: {
    name: string;
    city: string;
    state?: string;
    country: string;
    capacity: number;
  };
  promoter: string;
  network?: string;
  ppvPrice?: number;
  fights: string[]; // Fight IDs
  mainEvent: string; // Fight ID
  ticketSales?: {
    sold: number;
    revenue: number;
    averagePrice: number;
  };
}

export interface WeightClass {
  name: string;
  limit: number; // in pounds
  champions: {
    wba?: string; // Fighter ID
    wbc?: string;
    ibf?: string;
    wbo?: string;
  };
  topContenders: string[]; // Fighter IDs
}

export interface BoxingPromotion {
  id: string;
  name: string;
  fighters: string[]; // Fighter IDs
  upcomingEvents: string[]; // Event IDs
  totalRevenue: number;
  primaryNetworks: string[];
  regions: string[];
}

export class BoxingDataSyncService {
  private db: any; // Firebase Firestore instance
  private readonly baseUrl = 'https://api.boxrec.com/v2'; // Placeholder API
  private readonly rateLimitDelay = 2000; // 30 requests per minute
  private lastRequestTime = 0;

  // Weight classes in boxing
  private readonly WEIGHT_CLASSES: WeightClass[] = [
    { name: 'Heavyweight', limit: 999, champions: {}, topContenders: [] },
    { name: 'Cruiserweight', limit: 200, champions: {}, topContenders: [] },
    { name: 'Light Heavyweight', limit: 175, champions: {}, topContenders: [] },
    { name: 'Super Middleweight', limit: 168, champions: {}, topContenders: [] },
    { name: 'Middleweight', limit: 160, champions: {}, topContenders: [] },
    { name: 'Super Welterweight', limit: 154, champions: {}, topContenders: [] },
    { name: 'Welterweight', limit: 147, champions: {}, topContenders: [] },
    { name: 'Super Lightweight', limit: 140, champions: {}, topContenders: [] },
    { name: 'Lightweight', limit: 135, champions: {}, topContenders: [] },
    { name: 'Super Featherweight', limit: 130, champions: {}, topContenders: [] },
    { name: 'Featherweight', limit: 126, champions: {}, topContenders: [] },
    { name: 'Super Bantamweight', limit: 122, champions: {}, topContenders: [] },
    { name: 'Bantamweight', limit: 118, champions: {}, topContenders: [] },
    { name: 'Super Flyweight', limit: 115, champions: {}, topContenders: [] },
    { name: 'Flyweight', limit: 112, champions: {}, topContenders: [] },
    { name: 'Light Flyweight', limit: 108, champions: {}, topContenders: [] },
    { name: 'Minimumweight', limit: 105, champions: {}, topContenders: [] },
  ];

  constructor() {
    // Mock database for development - replace with actual Firebase connection in production
    this.db = {
      collection: (name: string) => ({
        doc: (id: string) => ({
          set: (data: any, options?: any) => Promise.resolve(),
          get: () => Promise.resolve({ exists: false, data: () => null }),
          update: (data: any) => Promise.resolve()
        }),
        where: (field: string, op: string, value: any) => ({
          where: (field2: string, op2: string, value2: any) => ({
            orderBy: (field3: string) => ({
              get: () => Promise.resolve({ docs: [] })
            }),
            get: () => Promise.resolve({ docs: [] })
          }),
          get: () => Promise.resolve({ docs: [] })
        }),
        get: () => Promise.resolve({ docs: [] })
      })
    };
  }

  /**
   * Initialize the boxing data sync service
   */
  async initialize(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Initializing Boxing Data Sync Service',
        level: 'info',
      });

      // Initialize weight classes
      await this.initializeWeightClasses();

      console.log('Boxing Data Sync Service initialized successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to initialize Boxing Data Sync Service: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Sync all boxing data comprehensively
   */
  async syncAllBoxingData(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Starting comprehensive boxing data sync',
        level: 'info',
      });

      // Phase 1: Sync fighters and rankings
      await this.syncActiveFighters();
      await this.syncFighterRankings();

      // Phase 2: Sync upcoming and recent events
      await this.syncUpcomingEvents();
      await this.syncRecentFights();

      // Phase 3: Sync weight class information
      await this.syncWeightClassChampions();

      // Phase 4: Sync betting odds and promoter information
      await this.syncFightOdds();
      await this.syncPromotions();

      console.log('Comprehensive boxing data sync completed successfully');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Boxing data sync failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Sync active fighters and their information
   */
  async syncActiveFighters(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing active fighters',
        level: 'info',
      });

      // Get top fighters from multiple weight classes in batches
      const fightersData = await this.fetchWithRateLimit('/fighters/active');
      
      const fightersCollection = this.db.collection('boxing_fighters');
      
      // Process fighters in smaller chunks to avoid memory issues
      const fighters = fightersData.fighters || [];
      const chunkSize = 50; // Process 50 fighters at a time
      
      for (let i = 0; i < fighters.length; i += chunkSize) {
        const chunk = fighters.slice(i, i + chunkSize);
        console.log(`Processing fighters batch ${Math.floor(i/chunkSize) + 1}/${Math.ceil(fighters.length/chunkSize)}`);
        
        for (const fighterData of chunk) {
        const fighter: BoxingFighter = {
          id: fighterData.id,
          name: fighterData.name,
          nickname: fighterData.nickname,
          record: {
            wins: fighterData.record?.wins || 0,
            losses: fighterData.record?.losses || 0,
            draws: fighterData.record?.draws || 0,
            knockouts: fighterData.record?.knockouts || 0,
            technicalKnockouts: fighterData.record?.technicalKnockouts || 0,
          },
          physicalStats: {
            height: fighterData.height || 'N/A',
            reach: fighterData.reach || 'N/A',
            weight: fighterData.weight || 0,
            stance: fighterData.stance || 'Orthodox',
            age: fighterData.age || 0,
          },
          weightClass: fighterData.weightClass || 'Heavyweight',
          rankings: {
            wba: fighterData.rankings?.wba,
            wbc: fighterData.rankings?.wbc,
            ibf: fighterData.rankings?.ibf,
            wbo: fighterData.rankings?.wbo,
            ring: fighterData.rankings?.ring,
            boxrec: fighterData.rankings?.boxrec,
          },
          nationality: fighterData.nationality || 'Unknown',
          turnedPro: fighterData.turnedPro ? new Date(fighterData.turnedPro) : new Date(),
          lastFight: fighterData.lastFight ? new Date(fighterData.lastFight) : new Date(),
          careerEarnings: fighterData.careerEarnings || 0,
          promoter: fighterData.promoter,
          manager: fighterData.manager,
          trainer: fighterData.trainer,
          gym: fighterData.gym,
        };

          await fightersCollection.doc(fighter.id).set(fighter, { merge: true });
        }
        
        // Add a small delay between chunks to prevent overwhelming the system
        if (i + chunkSize < fighters.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Synced ${fighters.length} active fighters in ${Math.ceil(fighters.length/chunkSize)} batches`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Fighter sync failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Sync upcoming boxing events and fights
   */
  async syncUpcomingEvents(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing upcoming boxing events',
        level: 'info',
      });

      const eventsData = await this.fetchWithRateLimit('/events/upcoming?days=90');
      
      const eventsCollection = this.db.collection('boxing_events');
      const fightsCollection = this.db.collection('boxing_fights');

      for (const eventData of eventsData.events || []) {
        // Sync event
        const event: BoxingEvent = {
          id: eventData.id,
          name: eventData.name,
          date: new Date(eventData.date),
          venue: {
            name: eventData.venue?.name || 'TBA',
            city: eventData.venue?.city || 'TBA',
            state: eventData.venue?.state,
            country: eventData.venue?.country || 'USA',
            capacity: eventData.venue?.capacity || 0,
          },
          promoter: eventData.promoter || 'Unknown',
          network: eventData.network,
          ppvPrice: eventData.ppvPrice,
          fights: eventData.fights?.map((f: any) => f.id) || [],
          mainEvent: eventData.mainEvent,
          ticketSales: eventData.ticketSales,
        };

        await eventsCollection.doc(event.id).set(event, { merge: true });

        // Sync individual fights
        for (const fightData of eventData.fights || []) {
          const fight: BoxingFight = {
            id: fightData.id,
            fighter1: fightData.fighter1,
            fighter2: fightData.fighter2,
            date: new Date(eventData.date),
            venue: event.venue,
            weightClass: fightData.weightClass || 'Heavyweight',
            scheduledRounds: fightData.scheduledRounds || 12,
            titles: fightData.titles || [],
            network: eventData.network,
            promoter: eventData.promoter || 'Unknown',
            status: fightData.status || 'scheduled',
            result: fightData.result,
            betting: {
              fighter1Odds: fightData.betting?.fighter1Odds || 0,
              fighter2Odds: fightData.betting?.fighter2Odds || 0,
              totalRounds: fightData.betting?.totalRounds,
              methodOdds: fightData.betting?.methodOdds,
            },
            fightCard: fightData.fightCard || 'undercard',
            attendance: fightData.attendance,
            purse: fightData.purse,
          };

          await fightsCollection.doc(fight.id).set(fight, { merge: true });
        }
      }

      console.log(`Synced ${eventsData.events?.length || 0} upcoming boxing events`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Upcoming events sync failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Sync recent fight results
   */
  async syncRecentFights(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing recent fight results',
        level: 'info',
      });

      const resultsData = await this.fetchWithRateLimit('/fights/recent?days=30');
      
      const fightsCollection = this.db.collection('boxing_fights');

      for (const fightData of resultsData.fights || []) {
        const fight: Partial<BoxingFight> = {
          id: fightData.id,
          status: 'completed',
          result: {
            winner: fightData.result?.winner,
            method: fightData.result?.method || 'UD',
            round: fightData.result?.round,
            time: fightData.result?.time,
            details: fightData.result?.details,
          },
          attendance: fightData.attendance,
          purse: fightData.purse,
        };

        await fightsCollection.doc(fight.id!).set(fight, { merge: true });

        // Update fighter records
        if (fightData.result?.winner) {
          await this.updateFighterRecord(fightData.fighter1, fightData.fighter2, fightData.result);
        }
      }

      console.log(`Synced ${resultsData.fights?.length || 0} recent fight results`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Recent fights sync failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Sync fighter rankings across sanctioning bodies
   */
  async syncFighterRankings(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing fighter rankings',
        level: 'info',
      });

      for (const weightClass of this.WEIGHT_CLASSES) {
        const rankingsData = await this.fetchWithRateLimit(
          `/rankings/${weightClass.name.toLowerCase().replace(' ', '-')}`
        );

        const fightersCollection = this.db.collection('boxing_fighters');

        // Update WBA rankings
        if (rankingsData.wba) {
          for (let i = 0; i < rankingsData.wba.length; i++) {
            const fighterId = rankingsData.wba[i].fighterId;
            await fightersCollection.doc(fighterId).set({
              rankings: { wba: i + 1 }
            }, { merge: true });
          }
        }

        // Update other sanctioning bodies similarly
        for (const org of ['wbc', 'ibf', 'wbo', 'ring']) {
          if (rankingsData[org]) {
            for (let i = 0; i < rankingsData[org].length; i++) {
              const fighterId = rankingsData[org][i].fighterId;
              await fightersCollection.doc(fighterId).set({
                [`rankings.${org}`]: i + 1
              }, { merge: true });
            }
          }
        }
      }

      console.log('Fighter rankings sync completed');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Rankings sync failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Sync weight class champions
   */
  async syncWeightClassChampions(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing weight class champions',
        level: 'info',
      });

      const championsData = await this.fetchWithRateLimit('/champions/current');
      
      const weightClassesCollection = this.db.collection('boxing_weight_classes');

      for (const weightClass of this.WEIGHT_CLASSES) {
        const championData = championsData[weightClass.name] || {};
        
        const updatedWeightClass: WeightClass = {
          ...weightClass,
          champions: {
            wba: championData.wba?.fighterId,
            wbc: championData.wbc?.fighterId,
            ibf: championData.ibf?.fighterId,
            wbo: championData.wbo?.fighterId,
          },
        };

        await weightClassesCollection
          .doc(weightClass.name.toLowerCase().replace(' ', '_'))
          .set(updatedWeightClass);
      }

      console.log('Weight class champions sync completed');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Champions sync failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Sync current betting odds
   */
  async syncFightOdds(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing fight betting odds',
        level: 'info',
      });

      const oddsData = await this.fetchWithRateLimit('/odds/upcoming');
      
      const fightsCollection = this.db.collection('boxing_fights');

      for (const odds of oddsData.odds || []) {
        await fightsCollection.doc(odds.fightId).set({
          betting: {
            fighter1Odds: odds.fighter1Odds,
            fighter2Odds: odds.fighter2Odds,
            totalRounds: odds.totalRounds,
            methodOdds: odds.methodOdds,
          }
        }, { merge: true });
      }

      console.log(`Synced odds for ${oddsData.odds?.length || 0} fights`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Odds sync failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Sync boxing promotions and their fighters
   */
  async syncPromotions(): Promise<void> {
    try {
      Sentry.addBreadcrumb({
        message: 'Syncing boxing promotions',
        level: 'info',
      });

      const promotionsData = await this.fetchWithRateLimit('/promotions');
      
      const promotionsCollection = this.db.collection('boxing_promotions');

      for (const promotionData of promotionsData.promotions || []) {
        const promotion: BoxingPromotion = {
          id: promotionData.id,
          name: promotionData.name,
          fighters: promotionData.fighters || [],
          upcomingEvents: promotionData.upcomingEvents || [],
          totalRevenue: promotionData.totalRevenue || 0,
          primaryNetworks: promotionData.primaryNetworks || [],
          regions: promotionData.regions || [],
        };

        await promotionsCollection.doc(promotion.id).set(promotion);
      }

      console.log(`Synced ${promotionsData.promotions?.length || 0} boxing promotions`);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Promotions sync failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get upcoming fights for a specific date range
   */
  async getUpcomingFights(days: number = 30): Promise<BoxingFight[]> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const snapshot = await this.db
        .collection('boxing_fights')
        .where('date', '>=', new Date())
        .where('date', '<=', endDate)
        .where('status', '==', 'scheduled')
        .orderBy('date')
        .get();

      return snapshot.docs.map((doc: any) => doc.data() as BoxingFight);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get upcoming fights: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get fighter by ID
   */
  async getFighterById(fighterId: string): Promise<BoxingFighter | null> {
    try {
      const doc = await this.db
        .collection('boxing_fighters')
        .doc(fighterId)
        .get();

      return doc.exists ? doc.data() as BoxingFighter : null;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get fighter: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get fighters by weight class
   */
  async getFightersByWeightClass(weightClass: string): Promise<BoxingFighter[]> {
    try {
      const snapshot = await this.db
        .collection('boxing_fighters')
        .where('weightClass', '==', weightClass)
        .get();

      return snapshot.docs.map((doc: any) => doc.data() as BoxingFighter);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get fighters by weight class: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get fight by ID
   */
  async getFightById(fightId: string): Promise<BoxingFight | null> {
    try {
      const doc = await this.db
        .collection('boxing_fights')
        .doc(fightId)
        .get();

      return doc.exists ? doc.data() as BoxingFight : null;
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Failed to get fight: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update fighter record after a fight
   */
  private async updateFighterRecord(
    fighter1Id: string, 
    fighter2Id: string, 
    result: any
  ): Promise<void> {
    try {
      const winner = result.winner;
      const method = result.method;
      
      const fightersCollection = this.db.collection('boxing_fighters');

      // Update winner's record
      const winnerUpdate: any = {
        'record.wins': admin.firestore.FieldValue.increment(1),
        lastFight: new Date(),
      };

      if (method === 'KO') {
        winnerUpdate['record.knockouts'] = admin.firestore.FieldValue.increment(1);
      } else if (method === 'TKO') {
        winnerUpdate['record.technicalKnockouts'] = admin.firestore.FieldValue.increment(1);
      }

      await fightersCollection.doc(winner).update(winnerUpdate);

      // Update loser's record
      const loserId = winner === fighter1Id ? fighter2Id : fighter1Id;
      const loserUpdate: any = {
        'record.losses': admin.firestore.FieldValue.increment(1),
        lastFight: new Date(),
      };

      await fightersCollection.doc(loserId).update(loserUpdate);

      console.log(`Updated records for fighters ${winner} (win) and ${loserId} (loss)`);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  /**
   * Initialize weight classes in database
   */
  private async initializeWeightClasses(): Promise<void> {
    try {
      const weightClassesCollection = this.db.collection('boxing_weight_classes');

      for (const weightClass of this.WEIGHT_CLASSES) {
        await weightClassesCollection
          .doc(weightClass.name.toLowerCase().replace(' ', '_'))
          .set(weightClass, { merge: true });
      }

      console.log('Weight classes initialized');
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`Weight classes initialization failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Rate-limited API fetch
   */
  private async fetchWithRateLimit(endpoint: string): Promise<any> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();

    try {
      // Placeholder for actual API call
      // In production, replace with actual boxing API endpoints
      console.log(`Fetching boxing data from ${endpoint}`);
      
      // Mock data for demonstration
      return this.getMockData(endpoint);
    } catch (error) {
      Sentry.captureException(error);
      throw new Error(`API request failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Mock data generator for demonstration
   */
  private getMockData(endpoint: string): any {
    // Generate mock data based on endpoint
    if (endpoint.includes('/fighters/active')) {
      return {
        fighters: [
          {
            id: 'canelo_alvarez',
            name: 'Canelo Alvarez',
            nickname: 'El Canelo',
            record: { wins: 59, losses: 2, draws: 2, knockouts: 39, technicalKnockouts: 5 },
            height: '5\'8\"',
            reach: '70.5\"',
            weight: 168,
            stance: 'Orthodox',
            age: 33,
            weightClass: 'Super Middleweight',
            rankings: { wba: 1, wbc: 1, ibf: 1, wbo: 1, ring: 1 },
            nationality: 'Mexico',
            turnedPro: '2005-10-29',
            lastFight: '2023-09-30',
            careerEarnings: 250000000,
          },
          // Add more mock fighters...
        ]
      };
    }

    if (endpoint.includes('/events/upcoming')) {
      return {
        events: [
          {
            id: 'canelo_vs_benavidez_2024',
            name: 'Canelo vs Benavidez',
            date: '2024-05-04',
            venue: {
              name: 'MGM Grand Garden Arena',
              city: 'Las Vegas',
              state: 'Nevada',
              country: 'USA',
              capacity: 16800,
            },
            promoter: 'Golden Boy Promotions',
            network: 'DAZN',
            fights: [
              {
                id: 'canelo_vs_benavidez_main',
                fighter1: 'canelo_alvarez',
                fighter2: 'david_benavidez',
                weightClass: 'Super Middleweight',
                scheduledRounds: 12,
                titles: ['WBA Super Middleweight', 'WBC Super Middleweight'],
                fightCard: 'main-event',
                betting: {
                  fighter1Odds: -150,
                  fighter2Odds: +130,
                },
              },
            ],
            mainEvent: 'canelo_vs_benavidez_main',
          },
        ]
      };
    }

    // Return empty data for other endpoints
    return {};
  }
}

export const boxingDataSyncService = new BoxingDataSyncService();