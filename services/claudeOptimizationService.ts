/**
 * Claude 3.7 Optimization Service
 *
 * This service provides optimization strategies for Claude 3.7 LLM usage:
 * - Response caching
 * - Rate limiting
 * - Prompt optimization
 * - Usage monitoring
 * - Cost alerts
 * - Model switching (Claude vs GPT)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';

import { trackEvent } from './analyticsService';
import { firestore, auth } from '../config/firebase';

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  SUMMARY: 7 * 24 * 60 * 60 * 1000, // 7 days
  PREDICTION: 24 * 60 * 60 * 1000, // 24 hours
  NEWS_ANALYSIS: 3 * 24 * 60 * 60 * 1000, // 3 days
  PERSONALIZED: 24 * 60 * 60 * 1000, // 24 hours
};

// Rate limit constants
const RATE_LIMITS = {
  SUMMARY: 5, // 5 requests per hour
  PREDICTION: 10, // 10 requests per hour
  NEWS_ANALYSIS: 5, // 5 requests per hour
  PERSONALIZED: 3, // 3 requests per hour
};

// Claude usage tiers
export enum ClaudeUsageTier {
  FREE = 'free',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

// Claude request types
export enum ClaudeRequestType {
  SUMMARY = 'summary',
  PREDICTION = 'prediction',
  NEWS_ANALYSIS = 'news_analysis',
  PERSONALIZED = 'personalized',
}

// Claude request interface
export interface ClaudeRequest {
  type: ClaudeRequestType;
  prompt: string;
  params?: any;
  userId?: string;
}

// Claude response interface
export interface ClaudeResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  timestamp: number;
  cacheHit?: boolean;
}

// Claude usage stats interface
export interface ClaudeUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  requestsByType: {
    [key in ClaudeRequestType]: number;
  };
  tokensByType: {
    [key in ClaudeRequestType]: number;
  };
  costByType: {
    [key in ClaudeRequestType]: number;
  };
  cacheHitRate: number;
  lastUpdated: number;
}

class ClaudeOptimizationService {
  private static instance: ClaudeOptimizationService;
  private readonly CLAUDE_USAGE_COLLECTION = 'claudeUsage';
  private readonly CLAUDE_CACHE_COLLECTION = 'claudeCache';
  private readonly CLAUDE_RATE_LIMIT_COLLECTION = 'claudeRateLimit';
  private readonly CLAUDE_COST_PER_1K_TOKENS = 0.015; // $0.015 per 1K tokens for Claude 3.7 Sonnet
  private readonly GPT_COST_PER_1K_TOKENS = 0.01; // $0.01 per 1K tokens for GPT-4o

  /**
   * Get singleton instance
   * @returns ClaudeOptimizationService instance
   */
  public static getInstance(): ClaudeOptimizationService {
    if (!ClaudeOptimizationService.instance) {
      ClaudeOptimizationService.instance = new ClaudeOptimizationService();
    }
    return ClaudeOptimizationService.instance;
  }

  /**
   * Generate a cache key for a Claude request
   * @param request Claude request
   * @returns Cache key
   */
  private async generateCacheKey(request: ClaudeRequest): Promise<string> {
    // Create a string representation of the request
    const requestString = JSON.stringify({
      type: request.type,
      prompt: request.prompt,
      params: request.params || {},
    });

    // Generate a hash of the request string
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, requestString);
  }

  /**
   * Check if a cached response exists and is valid
   * @param cacheKey Cache key
   * @param type Request type
   * @returns Cached response or null
   */
  private async getCachedResponse(
    cacheKey: string,
    type: ClaudeRequestType
  ): Promise<ClaudeResponse | null> {
    try {
      // Try to get from local storage first (faster)
      const localCache = await AsyncStorage.getItem(`claude_cache_${cacheKey}`);

      if (localCache) {
        const cachedResponse = JSON.parse(localCache) as ClaudeResponse;

        // Check if cache is still valid based on TTL
        const ttl = this.getTTLForType(type);
        if (Date.now() - cachedResponse.timestamp < ttl) {
          // Mark as cache hit
          cachedResponse.cacheHit = true;

          // Track cache hit
          await this.trackCacheHit(type);

          return cachedResponse;
        }
      }

      // If not in local storage or expired, check Firestore
      const cacheRef = doc(firestore, this.CLAUDE_CACHE_COLLECTION, cacheKey);
      const cacheDoc = await getDoc(cacheRef);

      if (cacheDoc.exists()) {
        const cachedResponse = cacheDoc.data() as ClaudeResponse;

        // Check if cache is still valid based on TTL
        const ttl = this.getTTLForType(type);
        if (Date.now() - cachedResponse.timestamp < ttl) {
          // Store in local storage for faster access next time
          await AsyncStorage.setItem(`claude_cache_${cacheKey}`, JSON.stringify(cachedResponse));

          // Mark as cache hit
          cachedResponse.cacheHit = true;

          // Track cache hit
          await this.trackCacheHit(type);

          return cachedResponse;
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking cache:', error);
      return null;
    }
  }

  /**
   * Store a response in the cache
   * @param cacheKey Cache key
   * @param response Claude response
   */
  private async cacheResponse(cacheKey: string, response: ClaudeResponse): Promise<void> {
    try {
      // Add timestamp if not present
      if (!response.timestamp) {
        response.timestamp = Date.now();
      }

      // Store in local storage for faster access
      await AsyncStorage.setItem(`claude_cache_${cacheKey}`, JSON.stringify(response));

      // Store in Firestore for persistence
      const cacheRef = doc(firestore, this.CLAUDE_CACHE_COLLECTION, cacheKey);
      await setDoc(cacheRef, response);
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Get TTL for a request type
   * @param type Request type
   * @returns TTL in milliseconds
   */
  private getTTLForType(type: ClaudeRequestType): number {
    switch (type) {
      case ClaudeRequestType.SUMMARY:
        return CACHE_TTL.SUMMARY;
      case ClaudeRequestType.PREDICTION:
        return CACHE_TTL.PREDICTION;
      case ClaudeRequestType.NEWS_ANALYSIS:
        return CACHE_TTL.NEWS_ANALYSIS;
      case ClaudeRequestType.PERSONALIZED:
        return CACHE_TTL.PERSONALIZED;
      default:
        return 24 * 60 * 60 * 1000; // Default: 24 hours
    }
  }

  /**
   * Check if user has exceeded rate limit for a request type
   * @param userId User ID
   * @param type Request type
   * @returns Whether rate limit is exceeded
   */
  private async checkRateLimit(userId: string, type: ClaudeRequestType): Promise<boolean> {
    try {
      // Get user's usage tier
      const tier = await this.getUserTier(userId);

      // Premium users have no rate limits
      if (tier === ClaudeUsageTier.PREMIUM) {
        return false;
      }

      // Get rate limit for this request type
      const rateLimit = this.getRateLimitForType(type, tier);

      // Get current hour timestamp (floor to hour)
      const currentHour = Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000;

      // Check rate limit in Firestore
      const rateLimitRef = doc(
        firestore,
        this.CLAUDE_RATE_LIMIT_COLLECTION,
        `${userId}_${type}_${currentHour}`
      );
      const rateLimitDoc = await getDoc(rateLimitRef);

      if (rateLimitDoc.exists()) {
        const count = rateLimitDoc.data().count || 0;
        return count >= rateLimit;
      }

      return false;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false; // Default to not rate limited on error
    }
  }

  /**
   * Increment rate limit counter for a user and request type
   * @param userId User ID
   * @param type Request type
   */
  private async incrementRateLimit(userId: string, type: ClaudeRequestType): Promise<void> {
    try {
      // Get current hour timestamp (floor to hour)
      const currentHour = Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000;

      // Get rate limit document
      const rateLimitRef = doc(
        firestore,
        this.CLAUDE_RATE_LIMIT_COLLECTION,
        `${userId}_${type}_${currentHour}`
      );
      const rateLimitDoc = await getDoc(rateLimitRef);

      if (rateLimitDoc.exists()) {
        // Increment existing counter
        await updateDoc(rateLimitRef, {
          count: (rateLimitDoc.data().count || 0) + 1,
          lastUpdated: Date.now(),
        });
      } else {
        // Create new counter
        await setDoc(rateLimitRef, {
          userId,
          type,
          hour: currentHour,
          count: 1,
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error incrementing rate limit:', error);
    }
  }

  /**
   * Get rate limit for a request type and user tier
   * @param type Request type
   * @param tier User tier
   * @returns Rate limit
   */
  private getRateLimitForType(type: ClaudeRequestType, tier: ClaudeUsageTier): number {
    // Premium users have no rate limits
    if (tier === ClaudeUsageTier.PREMIUM) {
      return Number.MAX_SAFE_INTEGER;
    }

    // Standard users have higher limits
    const multiplier = tier === ClaudeUsageTier.STANDARD ? 2 : 1;

    switch (type) {
      case ClaudeRequestType.SUMMARY:
        return RATE_LIMITS.SUMMARY * multiplier;
      case ClaudeRequestType.PREDICTION:
        return RATE_LIMITS.PREDICTION * multiplier;
      case ClaudeRequestType.NEWS_ANALYSIS:
        return RATE_LIMITS.NEWS_ANALYSIS * multiplier;
      case ClaudeRequestType.PERSONALIZED:
        return RATE_LIMITS.PERSONALIZED * multiplier;
      default:
        return 5 * multiplier; // Default: 5 requests per hour
    }
  }

  /**
   * Get user's subscription tier
   * @param userId User ID
   * @returns User tier
   */
  private async getUserTier(userId: string): Promise<ClaudeUsageTier> {
    try {
      // In a real implementation, this would check the user's subscription status
      // For now, we'll return a mock tier

      // Check if user has premium access
      const hasPremium = await this.checkPremiumAccess(userId);

      if (hasPremium) {
        return ClaudeUsageTier.PREMIUM;
      }

      // Check if user has standard access
      const hasStandard = await this.checkStandardAccess(userId);

      if (hasStandard) {
        return ClaudeUsageTier.STANDARD;
      }

      return ClaudeUsageTier.FREE;
    } catch (error) {
      console.error('Error getting user tier:', error);
      return ClaudeUsageTier.FREE; // Default to free tier on error
    }
  }

  /**
   * Check if user has premium access
   * @param userId User ID
   * @returns Whether user has premium access
   */
  private async checkPremiumAccess(userId: string): Promise<boolean> {
    // In a real implementation, this would check the user's subscription status
    // For now, we'll return a mock value
    return Math.random() > 0.7; // 30% chance of premium
  }

  /**
   * Check if user has standard access
   * @param userId User ID
   * @returns Whether user has standard access
   */
  private async checkStandardAccess(userId: string): Promise<boolean> {
    // In a real implementation, this would check the user's subscription status
    // For now, we'll return a mock value
    return Math.random() > 0.4; // 60% chance of at least standard
  }

  /**
   * Track a cache hit
   * @param type Request type
   */
  private async trackCacheHit(type: ClaudeRequestType): Promise<void> {
    try {
      // Track event
      await trackEvent('claude_cache_hit', {
        request_type: type,
      });

      // Update cache hit stats in Firestore
      const statsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, 'cache_stats');
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        const stats = statsDoc.data();
        const hits = stats.hits || {};
        const total = stats.total || {};

        // Increment hit count for this type
        hits[type] = (hits[type] || 0) + 1;

        // Increment total count for this type
        total[type] = (total[type] || 0) + 1;

        await updateDoc(statsRef, {
          hits,
          total,
          lastUpdated: Date.now(),
        });
      } else {
        // Create new stats document
        const hits: { [key: string]: number } = {};
        const total: { [key: string]: number } = {};

        hits[type] = 1;
        total[type] = 1;

        await setDoc(statsRef, {
          hits,
          total,
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error tracking cache hit:', error);
    }
  }

  /**
   * Track a cache miss
   * @param type Request type
   */
  private async trackCacheMiss(type: ClaudeRequestType): Promise<void> {
    try {
      // Track event
      await trackEvent('claude_cache_miss', {
        request_type: type,
      });

      // Update cache miss stats in Firestore
      const statsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, 'cache_stats');
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        const stats = statsDoc.data();
        const misses = stats.misses || {};
        const total = stats.total || {};

        // Increment miss count for this type
        misses[type] = (misses[type] || 0) + 1;

        // Increment total count for this type
        total[type] = (total[type] || 0) + 1;

        await updateDoc(statsRef, {
          misses,
          total,
          lastUpdated: Date.now(),
        });
      } else {
        // Create new stats document
        const misses: { [key: string]: number } = {};
        const total: { [key: string]: number } = {};

        misses[type] = 1;
        total[type] = 1;

        await setDoc(statsRef, {
          misses,
          total,
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error tracking cache miss:', error);
    }
  }

  /**
   * Optimize a prompt for Claude
   * @param prompt Original prompt
   * @param type Request type
   * @returns Optimized prompt
   */
  private optimizePrompt(prompt: string, type: ClaudeRequestType): string {
    // Remove unnecessary verbosity
    let optimizedPrompt = prompt.trim();

    // Replace common verbose phrases
    const verbosePhrases = [
      { from: 'I would like you to', to: 'Please' },
      { from: 'Can you please', to: 'Please' },
      { from: 'I want you to', to: 'Please' },
      { from: 'I need you to', to: 'Please' },
      { from: 'It would be great if you could', to: 'Please' },
    ];

    for (const { from, to } of verbosePhrases) {
      optimizedPrompt = optimizedPrompt.replace(new RegExp(from, 'gi'), to);
    }

    // Add type-specific optimizations
    switch (type) {
      case ClaudeRequestType.SUMMARY:
        // For summaries, focus on brevity
        optimizedPrompt = `Summarize concisely: ${optimizedPrompt}`;
        break;
      case ClaudeRequestType.PREDICTION:
        // For predictions, focus on key factors
        optimizedPrompt = `Predict based on key factors: ${optimizedPrompt}`;
        break;
      case ClaudeRequestType.NEWS_ANALYSIS:
        // For news analysis, focus on betting implications
        optimizedPrompt = `Analyze betting implications: ${optimizedPrompt}`;
        break;
      case ClaudeRequestType.PERSONALIZED:
        // For personalized content, focus on actionable advice
        optimizedPrompt = `Provide actionable betting advice: ${optimizedPrompt}`;
        break;
    }

    return optimizedPrompt;
  }

  /**
   * Determine whether to use Claude or GPT for a request
   * @param type Request type
   * @returns Whether to use Claude
   */
  private shouldUseClaudeForType(type: ClaudeRequestType): boolean {
    // For critical predictions and personalized content, always use Claude
    if (type === ClaudeRequestType.PREDICTION || type === ClaudeRequestType.PERSONALIZED) {
      return true;
    }

    // For summaries and news analysis, use GPT 50% of the time for A/B testing
    return Math.random() > 0.5;
  }

  /**
   * Process a Claude request with optimization
   * @param request Claude request
   * @returns Claude response
   */
  public async processRequest(request: ClaudeRequest): Promise<ClaudeResponse> {
    try {
      const userId = request.userId || auth.currentUser?.uid;

      // Check rate limit if user is logged in
      if (userId) {
        const isRateLimited = await this.checkRateLimit(userId, request.type);

        if (isRateLimited) {
          throw new Error(`Rate limit exceeded for ${request.type}`);
        }
      }

      // Generate cache key
      const cacheKey = await this.generateCacheKey(request);

      // Check cache
      const cachedResponse = await this.getCachedResponse(cacheKey, request.type);

      if (cachedResponse) {
        return cachedResponse;
      }

      // Track cache miss
      await this.trackCacheMiss(request.type);

      // Optimize prompt
      const optimizedPrompt = this.optimizePrompt(request.prompt, request.type);

      // Determine whether to use Claude or GPT
      const useClaudeForThisRequest = this.shouldUseClaudeForType(request.type);

      // Call appropriate model
      let response: ClaudeResponse;

      if (useClaudeForThisRequest) {
        // Call Claude API
        response = await this.callClaudeAPI(optimizedPrompt, request.type);
      } else {
        // Call GPT API
        response = await this.callGPTAPI(optimizedPrompt, request.type);
      }

      // Cache response
      await this.cacheResponse(cacheKey, response);

      // Track usage
      await this.trackUsage(request, response);

      // Increment rate limit if user is logged in
      if (userId) {
        await this.incrementRateLimit(userId, request.type);
      }

      return response;
    } catch (error) {
      console.error('Error processing Claude request:', error);
      throw error;
    }
  }

  /**
   * Call Claude API
   * @param prompt Optimized prompt
   * @param type Request type
   * @returns Claude response
   */
  private async callClaudeAPI(prompt: string, type: ClaudeRequestType): Promise<ClaudeResponse> {
    try {
      // In a real implementation, this would call the Claude API
      // For now, we'll return a mock response

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate token usage based on prompt length
      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(promptTokens * 0.7);
      const totalTokens = promptTokens + completionTokens;

      // Calculate cost
      const cost = totalTokens * (this.CLAUDE_COST_PER_1K_TOKENS / 1000);

      return {
        content: `Mock Claude response for ${type}`,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          cost,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }

  /**
   * Call GPT API
   * @param prompt Optimized prompt
   * @param type Request type
   * @returns Claude response (for compatibility)
   */
  private async callGPTAPI(prompt: string, type: ClaudeRequestType): Promise<ClaudeResponse> {
    try {
      // In a real implementation, this would call the GPT API
      // For now, we'll return a mock response

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate token usage based on prompt length
      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(promptTokens * 0.6);
      const totalTokens = promptTokens + completionTokens;

      // Calculate cost
      const cost = totalTokens * (this.GPT_COST_PER_1K_TOKENS / 1000);

      return {
        content: `Mock GPT response for ${type}`,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          cost,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error calling GPT API:', error);
      throw error;
    }
  }

  /**
   * Track Claude usage
   * @param request Claude request
   * @param response Claude response
   */
  private async trackUsage(request: ClaudeRequest, response: ClaudeResponse): Promise<void> {
    try {
      const userId = request.userId || auth.currentUser?.uid;

      if (!userId) {
        return;
      }

      // Track event
      await trackEvent('claude_request', {
        request_type: request.type,
        prompt_tokens: response.usage.promptTokens,
        completion_tokens: response.usage.completionTokens,
        total_tokens: response.usage.totalTokens,
        cost: response.usage.cost,
        cache_hit: response.cacheHit || false,
      });

      // Update user's usage stats
      const userStatsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, userId);
      const userStatsDoc = await getDoc(userStatsRef);

      const month = new Date().toISOString().slice(0, 7); // YYYY-MM

      if (userStatsDoc.exists()) {
        const stats = userStatsDoc.data();
        const monthlyStats = stats.monthly || {};
        const currentMonthStats = monthlyStats[month] || {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          requestsByType: {},
          tokensByType: {},
          costByType: {},
        };

        // Update stats
        currentMonthStats.totalRequests += 1;
        currentMonthStats.totalTokens += response.usage.totalTokens;
        currentMonthStats.totalCost += response.usage.cost;

        // Update type-specific stats
        currentMonthStats.requestsByType[request.type] =
          (currentMonthStats.requestsByType[request.type] || 0) + 1;
        currentMonthStats.tokensByType[request.type] =
          (currentMonthStats.tokensByType[request.type] || 0) + response.usage.totalTokens;
        currentMonthStats.costByType[request.type] =
          (currentMonthStats.costByType[request.type] || 0) + response.usage.cost;

        // Update monthly stats
        monthlyStats[month] = currentMonthStats;

        await updateDoc(userStatsRef, {
          monthly: monthlyStats,
          lastUpdated: Date.now(),
        });
      } else {
        // Create new stats document
        const monthlyStats: { [key: string]: any } = {};
        monthlyStats[month] = {
          totalRequests: 1,
          totalTokens: response.usage.totalTokens,
          totalCost: response.usage.cost,
          requestsByType: {
            [request.type]: 1,
          },
          tokensByType: {
            [request.type]: response.usage.totalTokens,
          },
          costByType: {
            [request.type]: response.usage.cost,
          },
        };

        await setDoc(userStatsRef, {
          userId,
          monthly: monthlyStats,
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  /**
   * Get usage report for a specific month
   * @param month Month in YYYY-MM format
   * @returns Usage report
   */
  public async getMonthlyUsageReport(
    month: string = new Date().toISOString().slice(0, 7)
  ): Promise<any> {
    try {
      // Get global stats
      const globalStatsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, 'global');
      const globalStatsDoc = await getDoc(globalStatsRef);

      if (!globalStatsDoc.exists()) {
        return {
          month,
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          requestsByType: {},
          tokensByType: {},
          costByType: {},
          cacheHitRate: 0,
        };
      }

      const stats = globalStatsDoc.data();
      const monthlyStats = stats.monthly || {};
      const currentMonthStats = monthlyStats[month] || {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        requestsByType: {},
        tokensByType: {},
        costByType: {},
      };

      // Get cache stats
      const cacheStatsRef = doc(firestore, this.CLAUDE_USAGE_COLLECTION, 'cache_stats');
      const cacheStatsDoc = await getDoc(cacheStatsRef);

      let cacheHitRate = 0;

      if (cacheStatsDoc.exists()) {
        const cacheStats = cacheStatsDoc.data();
        const hits = cacheStats.hits || {};
        const total = cacheStats.total || {};

        // Calculate cache hit rate
        let totalHits = 0;
        let totalRequests = 0;

        Object.values(hits).forEach((count: any) => {
          totalHits += count as number;
        });

        Object.values(total).forEach((count: any) => {
          totalRequests += count as number;
        });

        cacheHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
      }

      return {
        month,
        ...currentMonthStats,
        cacheHitRate,
      };
    } catch (error) {
      console.error('Error getting monthly usage report:', error);
      return null;
    }
  }
}

// Export singleton instance
export const claudeOptimizationService = ClaudeOptimizationService.getInstance();

export default claudeOptimizationService;
