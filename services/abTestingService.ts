/**
 * A/B Testing Service
 * 
 * This service provides A/B testing functionality for the app.
 * It supports creating experiments, assigning users to variants, and tracking results.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from './analyticsService';
import { firebaseService } from '../src/atomic/organisms/firebaseService';

// Define analytics types if not exported from analyticsService
type AnalyticsProperties = Record<string, any>;
enum AnalyticsEventType {
  EXPERIMENT_VIEWED = 'experiment_viewed',
  EXPERIMENT_INTERACTED = 'experiment_interacted',
  CUSTOM = 'custom'
}

// Use Firebase auth from the atomic architecture
const { auth } = firebaseService;

// Experiment interface
export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  isActive: boolean;
  startDate: number;
  endDate?: number;
  targetAudience?: TargetAudience;
}

// Variant interface
export interface Variant {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100, percentage chance of being assigned
  properties: Record<string, any>;
}

// Target audience interface
export interface TargetAudience {
  isPremium?: boolean;
  platforms?: ('ios' | 'android' | 'web')[];
  minAppVersion?: string;
  countries?: string[];
  languages?: string[];
  userProperties?: Record<string, any>;
}

// User assignment interface
export interface UserAssignment {
  userId: string;
  deviceId: string;
  experimentId: string;
  variantId: string;
  assignmentDate: number;
  hasConverted: boolean;
  conversionDate?: number;
  conversionValue?: number;
  impressions: number;
  interactions: number;
  lastImpressionDate?: number;
  lastInteractionDate?: number;
}

// Experiment result interface
export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  impressions: number;
  interactions: number;
  conversions: number;
  conversionRate: number;
  averageConversionValue: number;
}

class ABTestingService {
  private static instance: ABTestingService;
  private experiments: Map<string, Experiment> = new Map();
  private userAssignments: Map<string, UserAssignment> = new Map();
  private isInitialized: boolean = false;
  private deviceId: string = '';
  private readonly STORAGE_KEYS = {
    EXPERIMENTS: 'ab_testing_experiments',
    USER_ASSIGNMENTS: 'ab_testing_user_assignments',
    DEVICE_ID: 'analytics_device_id' // Shared with analytics service
  };
  
  // Get singleton instance
  public static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }
  
  // Initialize A/B testing service
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load device ID
      await this.loadDeviceId();
      
      // Load experiments
      await this.loadExperiments();
      
      // Load user assignments
      await this.loadUserAssignments();
      
      this.isInitialized = true;
      
      console.log('A/B testing service initialized');
    } catch (error) {
      console.error('Error initializing A/B testing service:', error);
    }
  }
  
  // Create a new experiment
  public async createExperiment(experiment: Omit<Experiment, 'id' | 'startDate'>): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Generate experiment ID
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create experiment
    const newExperiment: Experiment = {
      ...experiment,
      id: experimentId,
      startDate: Date.now()
    };
    
    // Add experiment to map
    this.experiments.set(experimentId, newExperiment);
    
    // Save experiments
    await this.saveExperiments();
    
    return experimentId;
  }
  
  // Get an experiment by ID
  public async getExperiment(experimentId: string): Promise<Experiment | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.experiments.get(experimentId) || null;
  }
  
  // Get all experiments
  public async getExperiments(): Promise<Experiment[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return Array.from(this.experiments.values());
  }
  
  // Update an experiment
  public async updateExperiment(experiment: Experiment): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Check if experiment exists
    if (!this.experiments.has(experiment.id)) {
      console.warn(`Experiment with ID ${experiment.id} not found`);
      return false;
    }
    
    // Update experiment
    this.experiments.set(experiment.id, experiment);
    
    // Save experiments
    await this.saveExperiments();
    
    return true;
  }
  
  // Delete an experiment
  public async deleteExperiment(experimentId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Check if experiment exists
    if (!this.experiments.has(experimentId)) {
      console.warn(`Experiment with ID ${experimentId} not found`);
      return false;
    }
    
    // Delete experiment
    this.experiments.delete(experimentId);
    
    // Save experiments
    await this.saveExperiments();
    
    return true;
  }
  
  // Get variant for user
  public async getVariantForUser(experimentId: string): Promise<Variant | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Get experiment
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      console.warn(`Experiment with ID ${experimentId} not found`);
      return null;
    }
    
    // Check if experiment is active
    if (!experiment.isActive) {
      return null;
    }
    
    // Check if user is in target audience
    if (experiment.targetAudience && !this.isUserInTargetAudience(experiment.targetAudience)) {
      return null;
    }
    
    // Get user ID or device ID
    const userId = auth.instance.currentUser?.uid;
    const assignmentKey = `${experimentId}_${userId || this.deviceId}`;
    
    // Check if user is already assigned to a variant
    let userAssignment = this.userAssignments.get(assignmentKey);
    
    if (userAssignment) {
      // Increment impressions
      userAssignment.impressions += 1;
      userAssignment.lastImpressionDate = Date.now();
      
      // Save user assignments
      await this.saveUserAssignments();
      
      // Get variant
      const variant = experiment.variants.find(v => v.id === userAssignment!.variantId);
      
      if (variant) {
        // Track experiment view
        await this.trackExperimentView(experiment, variant);
        
        return variant;
      }
    }
    
    // Assign user to a variant
    const variant = this.assignUserToVariant(experiment);
    
    if (!variant) {
      return null;
    }
    
    // Create user assignment
    userAssignment = {
      userId: userId || '',
      deviceId: this.deviceId,
      experimentId,
      variantId: variant.id,
      assignmentDate: Date.now(),
      hasConverted: false,
      impressions: 1,
      interactions: 0,
      lastImpressionDate: Date.now()
    };
    
    // Add user assignment to map
    this.userAssignments.set(assignmentKey, userAssignment);
    
    // Save user assignments
    await this.saveUserAssignments();
    
    // Track experiment view
    await this.trackExperimentView(experiment, variant);
    
    return variant;
  }
  
  // Track interaction with variant
  public async trackInteraction(experimentId: string, properties: AnalyticsProperties = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Get experiment
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      console.warn(`Experiment with ID ${experimentId} not found`);
      return;
    }
    
    // Get user ID or device ID
    const userId = auth.instance.currentUser?.uid;
    const assignmentKey = `${experimentId}_${userId || this.deviceId}`;
    
    // Check if user is assigned to a variant
    const userAssignment = this.userAssignments.get(assignmentKey);
    
    if (!userAssignment) {
      console.warn(`User not assigned to experiment ${experimentId}`);
      return;
    }
    
    // Get variant
    const variant = experiment.variants.find(v => v.id === userAssignment.variantId);
    
    if (!variant) {
      console.warn(`Variant ${userAssignment.variantId} not found in experiment ${experimentId}`);
      return;
    }
    
    // Increment interactions
    userAssignment.interactions += 1;
    userAssignment.lastInteractionDate = Date.now();
    
    // Save user assignments
    await this.saveUserAssignments();
    
    // Track experiment interaction
    await analyticsService.trackEvent(AnalyticsEventType.EXPERIMENT_INTERACTED, {
      experiment_id: experimentId,
      experiment_name: experiment.name,
      variant_id: variant.id,
      variant_name: variant.name,
      ...properties
    });
  }
  
  // Track conversion
  public async trackConversion(
    experimentId: string,
    conversionValue: number = 1,
    properties: AnalyticsProperties = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Get experiment
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      console.warn(`Experiment with ID ${experimentId} not found`);
      return;
    }
    
    // Get user ID or device ID
    const userId = auth.instance.currentUser?.uid;
    const assignmentKey = `${experimentId}_${userId || this.deviceId}`;
    
    // Check if user is assigned to a variant
    const userAssignment = this.userAssignments.get(assignmentKey);
    
    if (!userAssignment) {
      console.warn(`User not assigned to experiment ${experimentId}`);
      return;
    }
    
    // Get variant
    const variant = experiment.variants.find(v => v.id === userAssignment.variantId);
    
    if (!variant) {
      console.warn(`Variant ${userAssignment.variantId} not found in experiment ${experimentId}`);
      return;
    }
    
    // Mark as converted
    userAssignment.hasConverted = true;
    userAssignment.conversionDate = Date.now();
    userAssignment.conversionValue = conversionValue;
    
    // Save user assignments
    await this.saveUserAssignments();
    
    // Track conversion in analytics
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'experiment_conversion',
      experiment_id: experimentId,
      experiment_name: experiment.name,
      variant_id: variant.id,
      variant_name: variant.name,
      conversion_value: conversionValue,
      ...properties
    });
  }
  
  // Get experiment results
  public async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Get experiment
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      console.warn(`Experiment with ID ${experimentId} not found`);
      return [];
    }
    
    // Initialize results
    const results: ExperimentResult[] = experiment.variants.map(variant => ({
      experimentId,
      variantId: variant.id,
      impressions: 0,
      interactions: 0,
      conversions: 0,
      conversionRate: 0,
      averageConversionValue: 0
    }));
    
    // Calculate results
    for (const assignment of this.userAssignments.values()) {
      if (assignment.experimentId === experimentId) {
        const result = results.find(r => r.variantId === assignment.variantId);
        
        if (result) {
          result.impressions += assignment.impressions;
          result.interactions += assignment.interactions;
          
          if (assignment.hasConverted) {
            result.conversions += 1;
            result.averageConversionValue += assignment.conversionValue || 0;
          }
        }
      }
    }
    
    // Calculate rates
    for (const result of results) {
      result.conversionRate = result.impressions > 0 ? (result.conversions / result.impressions) * 100 : 0;
      result.averageConversionValue = result.conversions > 0 ? result.averageConversionValue / result.conversions : 0;
    }
    
    return results;
  }
  
  // Get winning variant
  public async getWinningVariant(experimentId: string): Promise<Variant | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Get experiment
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      console.warn(`Experiment with ID ${experimentId} not found`);
      return null;
    }
    
    // Get results
    const results = await this.getExperimentResults(experimentId);
    
    if (results.length === 0) {
      return null;
    }
    
    // Find variant with highest conversion rate
    const winningResult = results.reduce((prev, current) => {
      return current.conversionRate > prev.conversionRate ? current : prev;
    });
    
    // Get winning variant
    const winningVariant = experiment.variants.find(v => v.id === winningResult.variantId);
    
    return winningVariant || null;
  }
  
  // End experiment
  public async endExperiment(experimentId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Get experiment
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      console.warn(`Experiment with ID ${experimentId} not found`);
      return false;
    }
    
    // Update experiment
    experiment.isActive = false;
    experiment.endDate = Date.now();
    
    // Save experiments
    await this.saveExperiments();
    
    return true;
  }
  
  // Load device ID from storage
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
  
  // Load experiments from storage
  private async loadExperiments(): Promise<void> {
    try {
      const experimentsString = await AsyncStorage.getItem(this.STORAGE_KEYS.EXPERIMENTS);
      
      if (experimentsString) {
        const experiments: Experiment[] = JSON.parse(experimentsString);
        
        // Clear existing experiments
        this.experiments.clear();
        
        // Add experiments to map
        experiments.forEach(experiment => {
          this.experiments.set(experiment.id, experiment);
        });
      }
    } catch (error) {
      console.error('Error loading experiments:', error);
    }
  }
  
  // Save experiments to storage
  private async saveExperiments(): Promise<void> {
    try {
      const experiments = Array.from(this.experiments.values());
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.EXPERIMENTS,
        JSON.stringify(experiments)
      );
    } catch (error) {
      console.error('Error saving experiments:', error);
    }
  }
  
  // Load user assignments from storage
  private async loadUserAssignments(): Promise<void> {
    try {
      const userAssignmentsString = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_ASSIGNMENTS);
      
      if (userAssignmentsString) {
        const userAssignments: [string, UserAssignment][] = JSON.parse(userAssignmentsString);
        
        // Clear existing user assignments
        this.userAssignments.clear();
        
        // Add user assignments to map
        userAssignments.forEach(([key, assignment]) => {
          this.userAssignments.set(key, assignment);
        });
      }
    } catch (error) {
      console.error('Error loading user assignments:', error);
    }
  }
  
  // Save user assignments to storage
  private async saveUserAssignments(): Promise<void> {
    try {
      const userAssignments = Array.from(this.userAssignments.entries());
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_ASSIGNMENTS,
        JSON.stringify(userAssignments)
      );
    } catch (error) {
      console.error('Error saving user assignments:', error);
    }
  }
  
  // Check if user is in target audience
  private isUserInTargetAudience(targetAudience: TargetAudience): boolean {
    // Check premium status
    if (targetAudience.isPremium !== undefined) {
      const isPremium = auth.instance.currentUser !== null; // Simplified check, replace with actual premium check
      if (targetAudience.isPremium !== isPremium) {
        return false;
      }
    }
    
    // Check platform
    if (targetAudience.platforms && targetAudience.platforms.length > 0) {
      const platform = require('react-native').Platform.OS;
      if (!targetAudience.platforms.includes(platform)) {
        return false;
      }
    }
    
    // More sophisticated checks can be added here
    
    return true;
  }
  
  // Assign user to a variant based on weights
  private assignUserToVariant(experiment: Experiment): Variant | null {
    if (experiment.variants.length === 0) {
      return null;
    }
    
    // Calculate total weight
    const totalWeight = experiment.variants.reduce((sum, variant) => sum + variant.weight, 0);
    
    if (totalWeight === 0) {
      // If all weights are 0, assign randomly
      const randomIndex = Math.floor(Math.random() * experiment.variants.length);
      return experiment.variants[randomIndex];
    }
    
    // Generate random number between 0 and total weight
    const random = Math.random() * totalWeight;
    
    // Find variant based on weight
    let cumulativeWeight = 0;
    
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      
      if (random < cumulativeWeight) {
        return variant;
      }
    }
    
    // Fallback to last variant
    return experiment.variants[experiment.variants.length - 1];
  }
  
  // Track experiment view
  private async trackExperimentView(experiment: Experiment, variant: Variant): Promise<void> {
    await analyticsService.trackEvent(AnalyticsEventType.EXPERIMENT_VIEWED, {
      experiment_id: experiment.id,
      experiment_name: experiment.name,
      variant_id: variant.id,
      variant_name: variant.name
    });
  }
}

// Export singleton instance
export const abTestingService = ABTestingService.getInstance();