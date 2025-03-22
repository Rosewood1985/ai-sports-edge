/**
 * Analytics Service
 * 
 * This service provides analytics tracking functionality for the app.
 * It supports tracking events, user properties, and conversion metrics.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// Import Device from expo-device if available, otherwise use a mock
let Device: any;
try {
  Device = require('expo-device');
} catch (error) {
  // Mock Device if not available
  Device = {
    getDeviceTypeAsync: async () => 'unknown',
  };
}
import Constants from 'expo-constants';
import { auth } from '../config/firebase';

// Analytics event types
export enum AnalyticsEventType {
  // Screen views
  SCREEN_VIEW = 'screen_view',
  
  // Feature usage
  FEATURE_USED = 'feature_used',
  
  // Odds comparison events
  ODDS_VIEWED = 'odds_viewed',
  ODDS_REFRESHED = 'odds_refreshed',
  SPORT_SELECTED = 'sport_selected',
  
  // Betting events
  SPORTSBOOK_CLICKED = 'sportsbook_clicked',
  BET_PLACED = 'bet_placed',
  PARLAY_CREATED = 'parlay_created',
  PARLAY_ITEM_ADDED = 'parlay_item_added',
  PARLAY_ITEM_REMOVED = 'parlay_item_removed',
  
  // Conversion events
  CONVERSION_STARTED = 'conversion_started',
  CONVERSION_COMPLETED = 'conversion_completed',
  CONVERSION_ABANDONED = 'conversion_abandoned',
  
  // Subscription events
  SUBSCRIPTION_VIEWED = 'subscription_viewed',
  SUBSCRIPTION_STARTED = 'subscription_started',
  SUBSCRIPTION_COMPLETED = 'subscription_completed',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  
  // Error events
  ERROR_OCCURRED = 'error_occurred',
  
  // Performance events
  PERFORMANCE_METRIC = 'performance_metric',
  
  // A/B testing events
  EXPERIMENT_VIEWED = 'experiment_viewed',
  EXPERIMENT_INTERACTED = 'experiment_interacted',
  
  // Custom events
  CUSTOM = 'custom'
}

// Analytics properties interface
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

// Analytics event interface
export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  properties: AnalyticsProperties;
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceId: string;
}

// Analytics user properties interface
export interface AnalyticsUserProperties {
  userId?: string;
  email?: string;
  isPremium?: boolean;
  hasCompletedOnboarding?: boolean;
  preferredSport?: string;
  installDate?: number;
  lastLoginDate?: number;
  deviceType?: string;
  osVersion?: string;
  appVersion?: string;
  [key: string]: any;
}

// Analytics session interface
export interface AnalyticsSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: AnalyticsEvent[];
  deviceId: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  userId?: string;
}

// Analytics conversion funnel step
export enum ConversionFunnelStep {
  ODDS_VIEW = 'odds_view',
  SPORTSBOOK_CLICK = 'sportsbook_click',
  REGISTRATION = 'registration',
  SUBSCRIPTION = 'subscription',
  FIRST_BET = 'first_bet',
  PARLAY_CREATION = 'parlay_creation'
}

// Analytics conversion funnel
export interface ConversionFunnel {
  funnelId: string;
  steps: {
    step: ConversionFunnelStep;
    timestamp: number;
    completed: boolean;
    properties?: AnalyticsProperties;
  }[];
  startTime: number;
  endTime?: number;
  completed: boolean;
  userId?: string;
  sessionId: string;
  experimentId?: string;
  experimentVariant?: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private currentSession: AnalyticsSession | null = null;
  private deviceId: string = '';
  private userProperties: AnalyticsUserProperties = {};
  private activeFunnels: Map<string, ConversionFunnel> = new Map();
  private isInitialized: boolean = false;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private readonly STORAGE_KEYS = {
    DEVICE_ID: 'analytics_device_id',
    USER_PROPERTIES: 'analytics_user_properties',
    EVENTS: 'analytics_events',
    FUNNELS: 'analytics_funnels',
    SESSION: 'analytics_current_session'
  };
  
  // Get singleton instance
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }
  
  // Initialize analytics service
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load device ID or generate a new one
      await this.loadDeviceId();
      
      // Load user properties
      await this.loadUserProperties();
      
      // Start a new session
      await this.startNewSession();
      
      // Set up event flushing interval (every 60 seconds)
      this.flushInterval = setInterval(() => {
        this.flushEvents();
      }, 60000);
      
      this.isInitialized = true;
      
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Error initializing analytics service:', error);
    }
  }
  
  // Track an analytics event
  public async trackEvent(
    eventType: AnalyticsEventType,
    properties: AnalyticsProperties = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.currentSession) {
      await this.startNewSession();
    }
    
    const event: AnalyticsEvent = {
      eventType,
      properties,
      timestamp: Date.now(),
      sessionId: this.currentSession!.sessionId,
      userId: auth.currentUser?.uid,
      deviceId: this.deviceId
    };
    
    // Add event to current session
    this.currentSession!.events.push(event);
    
    // Add event to queue for flushing
    this.eventQueue.push(event);
    
    // Save session
    await this.saveCurrentSession();
    
    // If queue is getting large, flush immediately
    if (this.eventQueue.length >= 20) {
      this.flushEvents();
    }
    
    // Process funnel steps if applicable
    if (this.isFunnelEvent(eventType)) {
      this.processFunnelStep(eventType, properties);
    }
  }
  
  // Set user properties
  public async setUserProperties(properties: AnalyticsUserProperties): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Merge new properties with existing ones
    this.userProperties = {
      ...this.userProperties,
      ...properties
    };
    
    // Save user properties
    await this.saveUserProperties();
  }
  
  // Start tracking a conversion funnel
  public async startFunnel(
    funnelId: string,
    firstStep: ConversionFunnelStep,
    properties: AnalyticsProperties = {}
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.currentSession) {
      await this.startNewSession();
    }
    
    // Create a new funnel
    const funnel: ConversionFunnel = {
      funnelId,
      steps: [
        {
          step: firstStep,
          timestamp: Date.now(),
          completed: true,
          properties
        }
      ],
      startTime: Date.now(),
      completed: false,
      userId: auth.currentUser?.uid,
      sessionId: this.currentSession!.sessionId,
      experimentId: properties.experimentId as string,
      experimentVariant: properties.experimentVariant as string
    };
    
    // Add funnel to active funnels
    this.activeFunnels.set(funnelId, funnel);
    
    // Save active funnels
    await this.saveActiveFunnels();
    
    // Track funnel start event
    await this.trackEvent(AnalyticsEventType.CONVERSION_STARTED, {
      funnel_id: funnelId,
      first_step: firstStep,
      ...properties
    });
    
    return funnelId;
  }
  
  // Add a step to a conversion funnel
  public async addFunnelStep(
    funnelId: string,
    step: ConversionFunnelStep,
    properties: AnalyticsProperties = {}
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Get funnel
    const funnel = this.activeFunnels.get(funnelId);
    
    if (!funnel) {
      console.warn(`Funnel with ID ${funnelId} not found`);
      return false;
    }
    
    // Add step to funnel
    funnel.steps.push({
      step,
      timestamp: Date.now(),
      completed: true,
      properties
    });
    
    // Save active funnels
    await this.saveActiveFunnels();
    
    // Track funnel step event
    await this.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: `funnel_step_${step}`,
      funnel_id: funnelId,
      step,
      ...properties
    });
    
    return true;
  }
  
  // Complete a conversion funnel
  public async completeFunnel(
    funnelId: string,
    properties: AnalyticsProperties = {}
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Get funnel
    const funnel = this.activeFunnels.get(funnelId);
    
    if (!funnel) {
      console.warn(`Funnel with ID ${funnelId} not found`);
      return false;
    }
    
    // Mark funnel as completed
    funnel.completed = true;
    funnel.endTime = Date.now();
    
    // Remove from active funnels
    this.activeFunnels.delete(funnelId);
    
    // Save active funnels
    await this.saveActiveFunnels();
    
    // Track funnel completion event
    await this.trackEvent(AnalyticsEventType.CONVERSION_COMPLETED, {
      funnel_id: funnelId,
      duration_ms: funnel.endTime - funnel.startTime,
      steps_count: funnel.steps.length,
      ...properties
    });
    
    return true;
  }
  
  // Abandon a conversion funnel
  public async abandonFunnel(
    funnelId: string,
    reason: string,
    properties: AnalyticsProperties = {}
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Get funnel
    const funnel = this.activeFunnels.get(funnelId);
    
    if (!funnel) {
      console.warn(`Funnel with ID ${funnelId} not found`);
      return false;
    }
    
    // Mark funnel as abandoned
    funnel.completed = false;
    funnel.endTime = Date.now();
    
    // Remove from active funnels
    this.activeFunnels.delete(funnelId);
    
    // Save active funnels
    await this.saveActiveFunnels();
    
    // Track funnel abandonment event
    await this.trackEvent(AnalyticsEventType.CONVERSION_ABANDONED, {
      funnel_id: funnelId,
      reason,
      duration_ms: funnel.endTime - funnel.startTime,
      steps_completed: funnel.steps.length,
      last_step: funnel.steps[funnel.steps.length - 1].step,
      ...properties
    });
    
    return true;
  }
  
  // Track screen view
  public async trackScreenView(
    screenName: string,
    properties: AnalyticsProperties = {}
  ): Promise<void> {
    await this.trackEvent(AnalyticsEventType.SCREEN_VIEW, {
      screen_name: screenName,
      ...properties
    });
  }
  
  // Track feature usage
  public async trackFeatureUsage(
    featureName: string,
    properties: AnalyticsProperties = {}
  ): Promise<void> {
    await this.trackEvent(AnalyticsEventType.FEATURE_USED, {
      feature_name: featureName,
      ...properties
    });
  }
  
  // Track error
  public async trackError(
    errorType: string,
    errorMessage: string,
    properties: AnalyticsProperties = {}
  ): Promise<void> {
    await this.trackEvent(AnalyticsEventType.ERROR_OCCURRED, {
      error_type: errorType,
      error_message: errorMessage,
      ...properties
    });
  }
  
  // Track performance metric
  public async trackPerformanceMetric(
    metricName: string,
    value: number,
    properties: AnalyticsProperties = {}
  ): Promise<void> {
    await this.trackEvent(AnalyticsEventType.PERFORMANCE_METRIC, {
      metric_name: metricName,
      value,
      ...properties
    });
  }
  
  // End current session
  public async endSession(): Promise<void> {
    if (!this.currentSession) return;
    
    // Set end time
    this.currentSession.endTime = Date.now();
    
    // Save session
    await this.saveCurrentSession();
    
    // Track session end event
    await this.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'session_end',
      duration_ms: this.currentSession.endTime - this.currentSession.startTime,
      events_count: this.currentSession.events.length
    });
    
    // Clear current session
    this.currentSession = null;
  }
  
  // Flush events to storage and/or server
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    try {
      // In a real app, we would send events to a server here
      // For now, we'll just save them to AsyncStorage
      
      // Get existing events
      const eventsString = await AsyncStorage.getItem(this.STORAGE_KEYS.EVENTS);
      let events: AnalyticsEvent[] = [];
      
      if (eventsString) {
        events = JSON.parse(eventsString);
      }
      
      // Add new events
      events = [...events, ...this.eventQueue];
      
      // Save events
      await AsyncStorage.setItem(this.STORAGE_KEYS.EVENTS, JSON.stringify(events));
      
      // Clear event queue
      this.eventQueue = [];
      
      console.log(`Flushed ${events.length} analytics events`);
    } catch (error) {
      console.error('Error flushing analytics events:', error);
    }
  }
  
  // Start a new session
  private async startNewSession(): Promise<void> {
    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create new session
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      events: [],
      deviceId: this.deviceId,
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: Constants.expoConfig?.version || '1.0.0',
      userId: auth.currentUser?.uid
    };
    
    // Save session
    await this.saveCurrentSession();
    
    // Track session start event
    await this.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'session_start',
      platform: Platform.OS,
      os_version: Platform.Version.toString(),
      app_version: Constants.expoConfig?.version || '1.0.0',
      device_type: await Device.getDeviceTypeAsync()
    });
  }
  
  // Load device ID from storage or generate a new one
  private async loadDeviceId(): Promise<void> {
    try {
      const deviceId = await AsyncStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
      
      if (deviceId) {
        this.deviceId = deviceId;
      } else {
        // Generate a new device ID
        this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Save device ID
        await AsyncStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, this.deviceId);
      }
    } catch (error) {
      console.error('Error loading device ID:', error);
      
      // Generate a fallback device ID
      this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }
  
  // Load user properties from storage
  private async loadUserProperties(): Promise<void> {
    try {
      const userPropertiesString = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROPERTIES);
      
      if (userPropertiesString) {
        this.userProperties = JSON.parse(userPropertiesString);
      } else {
        // Initialize with default properties
        this.userProperties = {
          installDate: Date.now(),
          lastLoginDate: Date.now(),
          deviceType: await Device.getDeviceTypeAsync(),
          osVersion: Platform.Version.toString(),
          appVersion: Constants.expoConfig?.version || '1.0.0'
        };
        
        // Save user properties
        await this.saveUserProperties();
      }
    } catch (error) {
      console.error('Error loading user properties:', error);
    }
  }
  
  // Save user properties to storage
  private async saveUserProperties(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_PROPERTIES,
        JSON.stringify(this.userProperties)
      );
    } catch (error) {
      console.error('Error saving user properties:', error);
    }
  }
  
  // Save current session to storage
  private async saveCurrentSession(): Promise<void> {
    if (!this.currentSession) return;
    
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SESSION,
        JSON.stringify(this.currentSession)
      );
    } catch (error) {
      console.error('Error saving current session:', error);
    }
  }
  
  // Save active funnels to storage
  private async saveActiveFunnels(): Promise<void> {
    try {
      const funnels = Array.from(this.activeFunnels.values());
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.FUNNELS,
        JSON.stringify(funnels)
      );
    } catch (error) {
      console.error('Error saving active funnels:', error);
    }
  }
  
  // Load active funnels from storage
  private async loadActiveFunnels(): Promise<void> {
    try {
      const funnelsString = await AsyncStorage.getItem(this.STORAGE_KEYS.FUNNELS);
      
      if (funnelsString) {
        const funnels: ConversionFunnel[] = JSON.parse(funnelsString);
        
        // Clear existing funnels
        this.activeFunnels.clear();
        
        // Add funnels to map
        funnels.forEach(funnel => {
          this.activeFunnels.set(funnel.funnelId, funnel);
        });
      }
    } catch (error) {
      console.error('Error loading active funnels:', error);
    }
  }
  
  // Check if an event is related to a funnel
  private isFunnelEvent(eventType: AnalyticsEventType): boolean {
    return [
      AnalyticsEventType.ODDS_VIEWED,
      AnalyticsEventType.SPORTSBOOK_CLICKED,
      AnalyticsEventType.BET_PLACED,
      AnalyticsEventType.PARLAY_CREATED,
      AnalyticsEventType.SUBSCRIPTION_COMPLETED
    ].includes(eventType);
  }
  
  // Process funnel step based on event type
  private async processFunnelStep(
    eventType: AnalyticsEventType,
    properties: AnalyticsProperties
  ): Promise<void> {
    // Map event types to funnel steps
    const eventToStepMap: Partial<Record<AnalyticsEventType, ConversionFunnelStep>> = {
      [AnalyticsEventType.ODDS_VIEWED]: ConversionFunnelStep.ODDS_VIEW,
      [AnalyticsEventType.SPORTSBOOK_CLICKED]: ConversionFunnelStep.SPORTSBOOK_CLICK,
      [AnalyticsEventType.BET_PLACED]: ConversionFunnelStep.FIRST_BET,
      [AnalyticsEventType.PARLAY_CREATED]: ConversionFunnelStep.PARLAY_CREATION,
      [AnalyticsEventType.SUBSCRIPTION_COMPLETED]: ConversionFunnelStep.SUBSCRIPTION
    };
    
    const step = eventToStepMap[eventType];
    
    if (!step) return;
    
    // Check if this step belongs to an active funnel
    for (const [funnelId, funnel] of this.activeFunnels.entries()) {
      // Check if this step is the next logical step in the funnel
      const lastStep = funnel.steps[funnel.steps.length - 1].step;
      
      // Simple sequential funnel logic - can be made more sophisticated
      if (this.isNextLogicalStep(lastStep, step)) {
        await this.addFunnelStep(funnelId, step, properties);
        
        // Check if this completes the funnel
        if (this.isFunnelComplete(funnel, step)) {
          await this.completeFunnel(funnelId, properties);
        }
      }
    }
  }
  
  // Check if a step is the next logical step in a funnel
  private isNextLogicalStep(
    currentStep: ConversionFunnelStep,
    nextStep: ConversionFunnelStep
  ): boolean {
    // Define the funnel flow
    const funnelFlow: Record<ConversionFunnelStep, ConversionFunnelStep[]> = {
      [ConversionFunnelStep.ODDS_VIEW]: [
        ConversionFunnelStep.SPORTSBOOK_CLICK,
        ConversionFunnelStep.REGISTRATION
      ],
      [ConversionFunnelStep.SPORTSBOOK_CLICK]: [
        ConversionFunnelStep.REGISTRATION,
        ConversionFunnelStep.FIRST_BET
      ],
      [ConversionFunnelStep.REGISTRATION]: [
        ConversionFunnelStep.SUBSCRIPTION,
        ConversionFunnelStep.FIRST_BET
      ],
      [ConversionFunnelStep.SUBSCRIPTION]: [
        ConversionFunnelStep.FIRST_BET,
        ConversionFunnelStep.PARLAY_CREATION
      ],
      [ConversionFunnelStep.FIRST_BET]: [
        ConversionFunnelStep.PARLAY_CREATION
      ],
      [ConversionFunnelStep.PARLAY_CREATION]: []
    };
    
    return funnelFlow[currentStep]?.includes(nextStep) || false;
  }
  
  // Check if a funnel is complete
  private isFunnelComplete(
    funnel: ConversionFunnel,
    lastStep: ConversionFunnelStep
  ): boolean {
    // A funnel is complete if it reaches certain end steps
    const completionSteps = [
      ConversionFunnelStep.SUBSCRIPTION,
      ConversionFunnelStep.PARLAY_CREATION
    ];
    
    return completionSteps.includes(lastStep);
  }
  
  // Get analytics data for reporting
  public async getAnalyticsData(): Promise<{
    events: AnalyticsEvent[];
    funnels: ConversionFunnel[];
    userProperties: AnalyticsUserProperties;
  }> {
    // Get events from storage
    const eventsString = await AsyncStorage.getItem(this.STORAGE_KEYS.EVENTS);
    let events: AnalyticsEvent[] = [];
    
    if (eventsString) {
      events = JSON.parse(eventsString);
    }
    
    // Get funnels
    await this.loadActiveFunnels();
    const funnels = Array.from(this.activeFunnels.values());
    
    return {
      events,
      funnels,
      userProperties: this.userProperties
    };
  }
  
  // Clear analytics data (for testing or user privacy)
  public async clearAnalyticsData(): Promise<void> {
    try {
      // Clear events
      await AsyncStorage.removeItem(this.STORAGE_KEYS.EVENTS);
      
      // Clear funnels
      await AsyncStorage.removeItem(this.STORAGE_KEYS.FUNNELS);
      
      // Clear session
      await AsyncStorage.removeItem(this.STORAGE_KEYS.SESSION);
      
      // Reset in-memory data
      this.eventQueue = [];
      this.activeFunnels.clear();
      this.currentSession = null;
      
      console.log('Analytics data cleared');
    } catch (error) {
      console.error('Error clearing analytics data:', error);
    }
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();