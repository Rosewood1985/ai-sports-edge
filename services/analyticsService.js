/**
 * Analytics Service
 * 
 * This service handles data collection, processing, and retrieval for the analytics dashboard.
 * It provides methods for tracking events, retrieving metrics, and generating reports.
 */

import { firebase } from '../config/firebase';
import { microtransactionService } from './microtransactionService';
import { fanduelCookieService } from './fanduelCookieService';

// Event types
export const EVENT_TYPES = {
  IMPRESSION: 'impression',
  CLICK: 'click',
  PURCHASE: 'purchase',
  REDIRECT: 'redirect',
  CONVERSION: 'conversion',
  COOKIE_INIT: 'cookie_init',
  COOKIE_PERSIST: 'cookie_persist',
};

// Metric types
export const METRIC_TYPES = {
  REVENUE: 'revenue',
  CONVERSION_RATE: 'conversion_rate',
  COOKIE_SUCCESS: 'cookie_success',
  ACTIVE_USERS: 'active_users',
  ARPU: 'arpu',
};

// Time periods
export const TIME_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  CUSTOM: 'custom',
};

class AnalyticsService {
  constructor() {
    this.analytics = firebase.analytics();
    this.firestore = firebase.firestore();
    this.eventsCollection = this.firestore.collection('analytics_events');
    this.metricsCollection = this.firestore.collection('analytics_metrics');
    this.reportsCollection = this.firestore.collection('analytics_reports');
  }

  /**
   * Track an event
   * @param {string} eventName Event name
   * @param {Object} eventData Event data
   * @returns {Promise<void>}
   */
  async trackEvent(eventName, eventData = {}) {
    try {
      // Log to Firebase Analytics
      this.analytics.logEvent(eventName, eventData);
      
      // Store in Firestore for custom analytics
      await this.eventsCollection.add({
        event_name: eventName,
        event_data: eventData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        user_id: eventData.userId || 'anonymous',
        session_id: eventData.sessionId || 'unknown',
      });
      
      // Process event for real-time metrics
      this.processEventForMetrics(eventName, eventData);
      
      return true;
    } catch (error) {
      console.error('Error tracking event:', error);
      return false;
    }
  }
  
  /**
   * Process event for real-time metrics
   * @param {string} eventName Event name
   * @param {Object} eventData Event data
   * @private
   */
  async processEventForMetrics(eventName, eventData) {
    try {
      // Get current date for metrics
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // Update metrics based on event type
      switch (eventName) {
        case EVENT_TYPES.IMPRESSION:
          await this.incrementMetric('impressions', dateKey, eventData);
          break;
        case EVENT_TYPES.CLICK:
          await this.incrementMetric('clicks', dateKey, eventData);
          break;
        case EVENT_TYPES.PURCHASE:
          await this.incrementMetric('purchases', dateKey, eventData);
          if (eventData.price) {
            await this.incrementMetric('revenue', dateKey, eventData, eventData.price);
          }
          break;
        case EVENT_TYPES.REDIRECT:
          await this.incrementMetric('redirects', dateKey, eventData);
          break;
        case EVENT_TYPES.CONVERSION:
          await this.incrementMetric('conversions', dateKey, eventData);
          break;
        case EVENT_TYPES.COOKIE_INIT:
          await this.incrementMetric('cookie_inits', dateKey, eventData);
          break;
        case EVENT_TYPES.COOKIE_PERSIST:
          await this.incrementMetric('cookie_persists', dateKey, eventData);
          break;
      }
    } catch (error) {
      console.error('Error processing event for metrics:', error);
    }
  }
  
  /**
   * Increment a metric
   * @param {string} metricName Metric name
   * @param {string} dateKey Date key (YYYY-MM-DD)
   * @param {Object} dimensions Dimension values
   * @param {number} value Value to increment by (default: 1)
   * @private
   */
  async incrementMetric(metricName, dateKey, dimensions = {}, value = 1) {
    try {
      // Create dimension key
      const dimensionKey = this.createDimensionKey(dimensions);
      
      // Reference to metric document
      const metricRef = this.metricsCollection
        .doc(`${metricName}_${dateKey}_${dimensionKey}`);
      
      // Update or create metric
      await metricRef.set({
        metric_name: metricName,
        date_key: dateKey,
        dimensions,
        value: firebase.firestore.FieldValue.increment(value),
        last_updated: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error incrementing metric:', error);
    }
  }
  
  /**
   * Create a dimension key from dimensions object
   * @param {Object} dimensions Dimension values
   * @returns {string} Dimension key
   * @private
   */
  createDimensionKey(dimensions) {
    // Sort keys to ensure consistent key generation
    const sortedKeys = Object.keys(dimensions).sort();
    
    // Create key-value pairs
    const pairs = sortedKeys.map(key => {
      const value = dimensions[key];
      return `${key}:${value}`;
    });
    
    // Join pairs with underscore
    return pairs.join('_');
  }
  
  /**
   * Get metrics for a specific time period
   * @param {string} metricName Metric name
   * @param {string} timePeriod Time period
   * @param {Object} dimensions Dimension filters
   * @returns {Promise<Object>} Metrics data
   */
  async getMetrics(metricName, timePeriod = TIME_PERIODS.LAST_7_DAYS, dimensions = {}) {
    try {
      // Calculate date range
      const { startDate, endDate } = this.getDateRangeForTimePeriod(timePeriod);
      
      // Generate date keys for range
      const dateKeys = this.generateDateKeysForRange(startDate, endDate);
      
      // Create dimension key
      const dimensionKey = this.createDimensionKey(dimensions);
      
      // Query metrics
      let query = this.metricsCollection
        .where('metric_name', '==', metricName);
      
      // Add date filter
      if (dateKeys.length === 1) {
        query = query.where('date_key', '==', dateKeys[0]);
      } else {
        query = query.where('date_key', 'in', dateKeys);
      }
      
      // Execute query
      const snapshot = await query.get();
      
      // Process results
      const results = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        results[data.date_key] = data.value;
      });
      
      return {
        metric_name: metricName,
        time_period: timePeriod,
        dimensions,
        data: results,
        total: Object.values(results).reduce((sum, value) => sum + value, 0),
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      return {
        metric_name: metricName,
        time_period: timePeriod,
        dimensions,
        data: {},
        total: 0,
        error: error.message,
      };
    }
  }
  
  /**
   * Get date range for time period
   * @param {string} timePeriod Time period
   * @returns {Object} Start and end dates
   * @private
   */
  getDateRangeForTimePeriod(timePeriod) {
    const now = new Date();
    let startDate, endDate;
    
    switch (timePeriod) {
      case TIME_PERIODS.TODAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = now;
        break;
      case TIME_PERIODS.YESTERDAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case TIME_PERIODS.LAST_7_DAYS:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        endDate = now;
        break;
      case TIME_PERIODS.LAST_30_DAYS:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        endDate = now;
        break;
      case TIME_PERIODS.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case TIME_PERIODS.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        endDate = now;
    }
    
    return { startDate, endDate };
  }
  
  /**
   * Generate date keys for date range
   * @param {Date} startDate Start date
   * @param {Date} endDate End date
   * @returns {Array<string>} Array of date keys
   * @private
   */
  generateDateKeysForRange(startDate, endDate) {
    const dateKeys = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      dateKeys.push(dateKey);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateKeys;
  }
  
  /**
   * Get conversion rate
   * @param {string} sourceMetric Source metric name
   * @param {string} targetMetric Target metric name
   * @param {string} timePeriod Time period
   * @param {Object} dimensions Dimension filters
   * @returns {Promise<Object>} Conversion rate data
   */
  async getConversionRate(sourceMetric, targetMetric, timePeriod = TIME_PERIODS.LAST_7_DAYS, dimensions = {}) {
    try {
      // Get source and target metrics
      const sourceData = await this.getMetrics(sourceMetric, timePeriod, dimensions);
      const targetData = await this.getMetrics(targetMetric, timePeriod, dimensions);
      
      // Calculate conversion rate
      const conversionRate = sourceData.total > 0 ? (targetData.total / sourceData.total) * 100 : 0;
      
      return {
        source_metric: sourceMetric,
        target_metric: targetMetric,
        time_period: timePeriod,
        dimensions,
        conversion_rate: conversionRate,
        source_total: sourceData.total,
        target_total: targetData.total,
      };
    } catch (error) {
      console.error('Error calculating conversion rate:', error);
      return {
        source_metric: sourceMetric,
        target_metric: targetMetric,
        time_period: timePeriod,
        dimensions,
        conversion_rate: 0,
        source_total: 0,
        target_total: 0,
        error: error.message,
      };
    }
  }
  
  /**
   * Get revenue metrics
   * @param {string} timePeriod Time period
   * @param {Object} dimensions Dimension filters
   * @returns {Promise<Object>} Revenue metrics
   */
  async getRevenueMetrics(timePeriod = TIME_PERIODS.LAST_7_DAYS, dimensions = {}) {
    try {
      // Get revenue metrics
      const revenueData = await this.getMetrics('revenue', timePeriod, dimensions);
      
      // Get active users
      const activeUsersData = await this.getMetrics('active_users', timePeriod, dimensions);
      
      // Calculate ARPU
      const arpu = activeUsersData.total > 0 ? revenueData.total / activeUsersData.total : 0;
      
      return {
        time_period: timePeriod,
        dimensions,
        total_revenue: revenueData.total,
        active_users: activeUsersData.total,
        arpu,
        daily_data: revenueData.data,
      };
    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      return {
        time_period: timePeriod,
        dimensions,
        total_revenue: 0,
        active_users: 0,
        arpu: 0,
        daily_data: {},
        error: error.message,
      };
    }
  }
  
  /**
   * Get cookie performance metrics
   * @param {string} timePeriod Time period
   * @returns {Promise<Object>} Cookie performance metrics
   */
  async getCookiePerformanceMetrics(timePeriod = TIME_PERIODS.LAST_7_DAYS) {
    try {
      // Get cookie initialization metrics
      const initData = await this.getMetrics('cookie_inits', timePeriod);
      
      // Get cookie persistence metrics
      const persistData = await this.getMetrics('cookie_persists', timePeriod);
      
      // Get redirect metrics
      const redirectData = await this.getMetrics('redirects', timePeriod);
      
      // Get conversion metrics
      const conversionData = await this.getMetrics('conversions', timePeriod);
      
      // Calculate rates
      const persistRate = initData.total > 0 ? (persistData.total / initData.total) * 100 : 0;
      const redirectSuccessRate = redirectData.total > 0 ? (conversionData.total / redirectData.total) * 100 : 0;
      
      return {
        time_period: timePeriod,
        cookie_inits: initData.total,
        cookie_persists: persistData.total,
        redirects: redirectData.total,
        conversions: conversionData.total,
        persist_rate: persistRate,
        redirect_success_rate: redirectSuccessRate,
        daily_data: {
          inits: initData.data,
          persists: persistData.data,
          redirects: redirectData.data,
          conversions: conversionData.data,
        },
      };
    } catch (error) {
      console.error('Error getting cookie performance metrics:', error);
      return {
        time_period: timePeriod,
        cookie_inits: 0,
        cookie_persists: 0,
        redirects: 0,
        conversions: 0,
        persist_rate: 0,
        redirect_success_rate: 0,
        daily_data: {},
        error: error.message,
      };
    }
  }
  
  /**
   * Get microtransaction performance metrics
   * @param {string} timePeriod Time period
   * @returns {Promise<Object>} Microtransaction performance metrics
   */
  async getMicrotransactionPerformanceMetrics(timePeriod = TIME_PERIODS.LAST_7_DAYS) {
    try {
      // Get metrics for each microtransaction type
      const microtransactionTypes = Object.values(microtransactionService.MICROTRANSACTION_TYPES);
      
      const results = {};
      let totalRevenue = 0;
      
      // Get metrics for each type
      for (const type of microtransactionTypes) {
        const impressions = await this.getMetrics('impressions', timePeriod, { type });
        const clicks = await this.getMetrics('clicks', timePeriod, { type });
        const purchases = await this.getMetrics('purchases', timePeriod, { type });
        const revenue = await this.getMetrics('revenue', timePeriod, { type });
        
        // Calculate rates
        const clickRate = impressions.total > 0 ? (clicks.total / impressions.total) * 100 : 0;
        const conversionRate = clicks.total > 0 ? (purchases.total / clicks.total) * 100 : 0;
        
        results[type] = {
          impressions: impressions.total,
          clicks: clicks.total,
          purchases: purchases.total,
          revenue: revenue.total,
          click_rate: clickRate,
          conversion_rate: conversionRate,
        };
        
        totalRevenue += revenue.total;
      }
      
      return {
        time_period: timePeriod,
        total_revenue: totalRevenue,
        by_type: results,
      };
    } catch (error) {
      console.error('Error getting microtransaction performance metrics:', error);
      return {
        time_period: timePeriod,
        total_revenue: 0,
        by_type: {},
        error: error.message,
      };
    }
  }
  
  /**
   * Get user journey metrics
   * @param {string} timePeriod Time period
   * @returns {Promise<Object>} User journey metrics
   */
  async getUserJourneyMetrics(timePeriod = TIME_PERIODS.LAST_7_DAYS) {
    try {
      // Get metrics for each stage
      const impressions = await this.getMetrics('impressions', timePeriod);
      const clicks = await this.getMetrics('clicks', timePeriod);
      const purchases = await this.getMetrics('purchases', timePeriod);
      const redirects = await this.getMetrics('redirects', timePeriod);
      const conversions = await this.getMetrics('conversions', timePeriod);
      
      // Calculate drop-off rates
      const impressionToClickDropoff = impressions.total > 0 ? 
        ((impressions.total - clicks.total) / impressions.total) * 100 : 0;
      
      const clickToPurchaseDropoff = clicks.total > 0 ? 
        ((clicks.total - purchases.total) / clicks.total) * 100 : 0;
      
      const purchaseToRedirectDropoff = purchases.total > 0 ? 
        ((purchases.total - redirects.total) / purchases.total) * 100 : 0;
      
      const redirectToConversionDropoff = redirects.total > 0 ? 
        ((redirects.total - conversions.total) / redirects.total) * 100 : 0;
      
      return {
        time_period: timePeriod,
        stages: {
          impressions: impressions.total,
          clicks: clicks.total,
          purchases: purchases.total,
          redirects: redirects.total,
          conversions: conversions.total,
        },
        dropoff_rates: {
          impression_to_click: impressionToClickDropoff,
          click_to_purchase: clickToPurchaseDropoff,
          purchase_to_redirect: purchaseToRedirectDropoff,
          redirect_to_conversion: redirectToConversionDropoff,
        },
        completion_rate: impressions.total > 0 ? 
          (conversions.total / impressions.total) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting user journey metrics:', error);
      return {
        time_period: timePeriod,
        stages: {
          impressions: 0,
          clicks: 0,
          purchases: 0,
          redirects: 0,
          conversions: 0,
        },
        dropoff_rates: {
          impression_to_click: 0,
          click_to_purchase: 0,
          purchase_to_redirect: 0,
          redirect_to_conversion: 0,
        },
        completion_rate: 0,
        error: error.message,
      };
    }
  }
  
  /**
   * Get dashboard data
   * @param {string} timePeriod Time period
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(timePeriod = TIME_PERIODS.LAST_7_DAYS) {
    try {
      // Get revenue metrics
      const revenueMetrics = await this.getRevenueMetrics(timePeriod);
      
      // Get cookie performance metrics
      const cookieMetrics = await this.getCookiePerformanceMetrics(timePeriod);
      
      // Get microtransaction performance metrics
      const microtransactionMetrics = await this.getMicrotransactionPerformanceMetrics(timePeriod);
      
      // Get user journey metrics
      const userJourneyMetrics = await this.getUserJourneyMetrics(timePeriod);
      
      return {
        time_period: timePeriod,
        revenue: revenueMetrics,
        cookies: cookieMetrics,
        microtransactions: microtransactionMetrics,
        user_journey: userJourneyMetrics,
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return {
        time_period: timePeriod,
        error: error.message,
      };
    }
  }
}

export const analyticsService = new AnalyticsService();