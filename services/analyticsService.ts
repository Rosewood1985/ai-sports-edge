import { Platform } from 'react-native';

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

/**
 * Analytics service for tracking user behavior and app usage
 */
class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private sessionId: string = '';
  private appVersion: string = '1.0.0';
  
  /**
   * Initialize the analytics service
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Set user ID if provided
      if (userId) {
        this.userId = userId;
      }
      
      // Generate session ID
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Track app start event
      this.trackEvent('app_start', {
        platform: Platform.OS,
        version: this.appVersion,
      });
      
      // Set up periodic flush
      setInterval(() => {
        this.flush();
      }, 30000); // Flush every 30 seconds
      
      this.isInitialized = true;
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Error initializing analytics service:', error);
    }
  }
  
  /**
   * Track an event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    try {
      // Create event object
      const event: AnalyticsEvent = {
        name: eventName,
        properties: {
          ...properties,
          userId: this.userId,
          sessionId: this.sessionId,
          platform: Platform.OS,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };
      
      // Add to events queue
      this.events.push(event);
      
      // Flush if queue is getting large
      if (this.events.length >= 20) {
        this.flush();
      }
      
      // Log event in development
      if (__DEV__) {
        console.log('Analytics event:', eventName, properties);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
  
  /**
   * Flush events to backend
   */
  private async flush(): Promise<void> {
    if (this.events.length === 0) {
      return;
    }
    
    try {
      // Clone events to send
      const eventsToSend = [...this.events];
      
      // Clear events queue
      this.events = [];
      
      // In a real app, we would send these events to a backend
      // For now, we'll just log them in development
      if (__DEV__) {
        console.log('Flushing analytics events:', eventsToSend.length);
      }
      
      // Here you would make an API call to send the events
      // Example:
      // await fetch('https://api.aisportsedge.app/analytics', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     events: eventsToSend,
      //   }),
      // });
    } catch (error) {
      console.error('Error flushing analytics events:', error);
      
      // Put events back in queue
      this.events = [...this.events, ...this.events];
    }
  }
  
  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    
    // Track user identification
    this.trackEvent('user_identified', {
      userId,
    });
  }
  
  /**
   * Track screen view
   */
  trackScreenView(screenName: string, properties?: Record<string, any>): void {
    this.trackEvent('screen_view', {
      screenName,
      ...properties,
    });
  }
  
  /**
   * Track user action
   */
  trackUserAction(action: string, properties?: Record<string, any>): void {
    this.trackEvent('user_action', {
      action,
      ...properties,
    });
  }
  
  /**
   * Track error
   */
  trackError(error: Error, properties?: Record<string, any>): void {
    this.trackEvent('error', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      ...properties,
    });
  }
  
  /**
   * Track app performance
   */
  trackPerformance(metricName: string, durationMs: number, properties?: Record<string, any>): void {
    this.trackEvent('performance', {
      metricName,
      durationMs,
      ...properties,
    });
  }
}

export const analyticsService = new AnalyticsService();