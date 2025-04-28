import { Platform } from 'react-native';
import { captureException } from './errorTrackingService';
import { info, error, LogCategory } from './loggingService';
import { logEvent, AnalyticsEvent } from './analyticsService';

/**
 * Feedback Service
 * 
 * This service provides functionality for collecting and managing user feedback.
 */

// Feedback types
export enum FeedbackType {
  APP_EXPERIENCE = 'app_experience',
  PREDICTION_QUALITY = 'prediction_quality',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  CONTENT_QUALITY = 'content_quality',
  SUBSCRIPTION = 'subscription',
  OTHER = 'other',
}

// Feedback priorities
export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Feedback status
export enum FeedbackStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

// Feedback interface
export interface Feedback {
  id?: string;
  userId: string;
  type: FeedbackType;
  title: string;
  description: string;
  priority?: FeedbackPriority;
  status?: FeedbackStatus;
  rating?: number;
  tags?: string[];
  screenshots?: string[];
  deviceInfo?: {
    platform: string;
    version: string;
    model?: string;
    appVersion: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Bug report interface
export interface BugReport extends Feedback {
  type: FeedbackType.BUG_REPORT;
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  reproducibility?: 'always' | 'sometimes' | 'rarely' | 'once';
  logs?: string;
}

// Feature request interface
export interface FeatureRequest extends Feedback {
  type: FeedbackType.FEATURE_REQUEST;
  useCase?: string;
  benefits?: string[];
  alternatives?: string;
}

// Feedback response interface
export interface FeedbackResponse {
  id: string;
  feedbackId: string;
  message: string;
  createdAt: string;
  createdBy: string;
}

/**
 * Submit feedback
 * @param feedback Feedback to submit
 * @returns Promise that resolves to the submitted feedback
 */
export const submitFeedback = async (feedback: Feedback): Promise<Feedback> => {
  try {
    info(LogCategory.APP, 'Submitting feedback', { type: feedback.type });
    
    // Add device information
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
      appVersion: '1.0.0', // Replace with actual app version
    };
    
    // Add timestamps
    const now = new Date().toISOString();
    
    // Prepare feedback for submission
    const feedbackToSubmit: Feedback = {
      ...feedback,
      deviceInfo,
      status: FeedbackStatus.SUBMITTED,
      createdAt: now,
      updatedAt: now,
    };
    
    // In a real implementation, this would send the feedback to a server
    // For now, we'll just log it and return a mock response
    
    // Log the feedback submission event
    logEvent(AnalyticsEvent.CUSTOM, {
      event_name: 'feedback_submitted',
      feedback_type: feedback.type,
      feedback_priority: feedback.priority,
    });
    
    // Generate a mock ID
    const mockId = `feedback-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Return the submitted feedback with the mock ID
    return {
      ...feedbackToSubmit,
      id: mockId,
    };
  } catch (err) {
    error(LogCategory.APP, 'Failed to submit feedback', err as Error);
    captureException(err as Error);
    throw err;
  }
};

/**
 * Submit a bug report
 * @param bugReport Bug report to submit
 * @returns Promise that resolves to the submitted bug report
 */
export const submitBugReport = async (bugReport: BugReport): Promise<BugReport> => {
  try {
    info(LogCategory.APP, 'Submitting bug report', { title: bugReport.title });
    
    // Ensure the type is BUG_REPORT
    const bugReportToSubmit: BugReport = {
      ...bugReport,
      type: FeedbackType.BUG_REPORT,
    };
    
    // Submit the bug report as feedback
    const submittedFeedback = await submitFeedback(bugReportToSubmit);
    
    // Return the submitted bug report
    return submittedFeedback as BugReport;
  } catch (err) {
    error(LogCategory.APP, 'Failed to submit bug report', err as Error);
    captureException(err as Error);
    throw err;
  }
};

/**
 * Submit a feature request
 * @param featureRequest Feature request to submit
 * @returns Promise that resolves to the submitted feature request
 */
export const submitFeatureRequest = async (featureRequest: FeatureRequest): Promise<FeatureRequest> => {
  try {
    info(LogCategory.APP, 'Submitting feature request', { title: featureRequest.title });
    
    // Ensure the type is FEATURE_REQUEST
    const featureRequestToSubmit: FeatureRequest = {
      ...featureRequest,
      type: FeedbackType.FEATURE_REQUEST,
    };
    
    // Submit the feature request as feedback
    const submittedFeedback = await submitFeedback(featureRequestToSubmit);
    
    // Return the submitted feature request
    return submittedFeedback as FeatureRequest;
  } catch (err) {
    error(LogCategory.APP, 'Failed to submit feature request', err as Error);
    captureException(err as Error);
    throw err;
  }
};

/**
 * Submit app rating
 * @param userId User ID
 * @param rating Rating (1-5)
 * @param comment Optional comment
 * @returns Promise that resolves when the rating is submitted
 */
export const submitAppRating = async (
  userId: string,
  rating: number,
  comment?: string
): Promise<boolean> => {
  try {
    info(LogCategory.APP, 'Submitting app rating', { rating, comment });
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Prepare feedback
    const feedback: Feedback = {
      userId,
      type: FeedbackType.APP_EXPERIENCE,
      title: `App Rating: ${rating}/5`,
      description: comment || '',
      rating,
    };
    
    // Submit the feedback
    await submitFeedback(feedback);
    
    // Log the rating event
    logEvent(AnalyticsEvent.CUSTOM, {
      event_name: 'app_rated',
      rating,
      has_comment: !!comment,
    });
    
    // If rating is high (4-5), prompt for app store review
    if (rating >= 4) {
      // In a real implementation, this would prompt for an app store review
      info(LogCategory.APP, 'Would prompt for app store review');
    }
    
    return true;
  } catch (err) {
    error(LogCategory.APP, 'Failed to submit app rating', err as Error);
    captureException(err as Error);
    return false;
  }
};

/**
 * Submit prediction feedback
 * @param userId User ID
 * @param predictionId Prediction ID
 * @param rating Rating (1-5)
 * @param comment Optional comment
 * @returns Promise that resolves when the feedback is submitted
 */
export const submitPredictionFeedback = async (
  userId: string,
  predictionId: string,
  rating: number,
  comment?: string
): Promise<boolean> => {
  try {
    info(LogCategory.APP, 'Submitting prediction feedback', { predictionId, rating, comment });
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Prepare feedback
    const feedback: Feedback = {
      userId,
      type: FeedbackType.PREDICTION_QUALITY,
      title: `Prediction Feedback: ${rating}/5`,
      description: comment || '',
      rating,
      tags: [predictionId],
    };
    
    // Submit the feedback
    await submitFeedback(feedback);
    
    // Log the prediction feedback event
    logEvent(AnalyticsEvent.CUSTOM, {
      event_name: 'prediction_rated',
      prediction_id: predictionId,
      rating,
      has_comment: !!comment,
    });
    
    return true;
  } catch (err) {
    error(LogCategory.APP, 'Failed to submit prediction feedback', err as Error);
    captureException(err as Error);
    return false;
  }
};

/**
 * Get feedback by ID
 * @param feedbackId Feedback ID
 * @returns Promise that resolves to the feedback
 */
export const getFeedbackById = async (feedbackId: string): Promise<Feedback | null> => {
  try {
    info(LogCategory.APP, 'Getting feedback by ID', { feedbackId });
    
    // In a real implementation, this would fetch the feedback from a server
    // For now, we'll just return a mock response
    
    // Mock feedback
    const mockFeedback: Feedback = {
      id: feedbackId,
      userId: 'user-123',
      type: FeedbackType.APP_EXPERIENCE,
      title: 'Great App!',
      description: 'I love using this app for my sports betting predictions.',
      priority: FeedbackPriority.MEDIUM,
      status: FeedbackStatus.RESOLVED,
      rating: 5,
      tags: ['positive', 'app experience'],
      createdAt: '2025-03-01T12:00:00Z',
      updatedAt: '2025-03-02T14:30:00Z',
    };
    
    return mockFeedback;
  } catch (err) {
    error(LogCategory.APP, 'Failed to get feedback by ID', err as Error);
    captureException(err as Error);
    return null;
  }
};

/**
 * Get feedback responses
 * @param feedbackId Feedback ID
 * @returns Promise that resolves to an array of feedback responses
 */
export const getFeedbackResponses = async (feedbackId: string): Promise<FeedbackResponse[]> => {
  try {
    info(LogCategory.APP, 'Getting feedback responses', { feedbackId });
    
    // In a real implementation, this would fetch the feedback responses from a server
    // For now, we'll just return a mock response
    
    // Mock responses
    const mockResponses: FeedbackResponse[] = [
      {
        id: 'response-1',
        feedbackId,
        message: 'Thank you for your feedback! We appreciate your positive review.',
        createdAt: '2025-03-02T14:30:00Z',
        createdBy: 'AI Sports Edge Support',
      },
    ];
    
    return mockResponses;
  } catch (err) {
    error(LogCategory.APP, 'Failed to get feedback responses', err as Error);
    captureException(err as Error);
    return [];
  }
};

/**
 * Add response to feedback
 * @param feedbackId Feedback ID
 * @param message Response message
 * @param createdBy Response creator
 * @returns Promise that resolves to the created response
 */
export const addFeedbackResponse = async (
  feedbackId: string,
  message: string,
  createdBy: string
): Promise<FeedbackResponse | null> => {
  try {
    info(LogCategory.APP, 'Adding feedback response', { feedbackId, message });
    
    // In a real implementation, this would send the response to a server
    // For now, we'll just return a mock response
    
    // Generate a mock ID
    const responseId = `response-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create the response
    const response: FeedbackResponse = {
      id: responseId,
      feedbackId,
      message,
      createdAt: new Date().toISOString(),
      createdBy,
    };
    
    return response;
  } catch (err) {
    error(LogCategory.APP, 'Failed to add feedback response', err as Error);
    captureException(err as Error);
    return null;
  }
};

/**
 * Update feedback status
 * @param feedbackId Feedback ID
 * @param status New status
 * @returns Promise that resolves when the status is updated
 */
export const updateFeedbackStatus = async (
  feedbackId: string,
  status: FeedbackStatus
): Promise<boolean> => {
  try {
    info(LogCategory.APP, 'Updating feedback status', { feedbackId, status });
    
    // In a real implementation, this would update the status on a server
    // For now, we'll just return success
    
    return true;
  } catch (err) {
    error(LogCategory.APP, 'Failed to update feedback status', err as Error);
    captureException(err as Error);
    return false;
  }
};

/**
 * Get user feedback
 * @param userId User ID
 * @returns Promise that resolves to an array of feedback
 */
export const getUserFeedback = async (userId: string): Promise<Feedback[]> => {
  try {
    info(LogCategory.APP, 'Getting user feedback', { userId });
    
    // In a real implementation, this would fetch the user's feedback from a server
    // For now, we'll just return a mock response
    
    // Mock feedback
    const mockFeedback: Feedback[] = [
      {
        id: 'feedback-1',
        userId,
        type: FeedbackType.APP_EXPERIENCE,
        title: 'Great App!',
        description: 'I love using this app for my sports betting predictions.',
        priority: FeedbackPriority.MEDIUM,
        status: FeedbackStatus.RESOLVED,
        rating: 5,
        tags: ['positive', 'app experience'],
        createdAt: '2025-03-01T12:00:00Z',
        updatedAt: '2025-03-02T14:30:00Z',
      },
      {
        id: 'feedback-2',
        userId,
        type: FeedbackType.FEATURE_REQUEST,
        title: 'Add Live Betting Odds',
        description: 'It would be great if you could add live betting odds to the app.',
        priority: FeedbackPriority.HIGH,
        status: FeedbackStatus.UNDER_REVIEW,
        tags: ['feature request', 'betting odds'],
        createdAt: '2025-03-05T09:15:00Z',
        updatedAt: '2025-03-05T09:15:00Z',
      },
    ];
    
    return mockFeedback;
  } catch (err) {
    error(LogCategory.APP, 'Failed to get user feedback', err as Error);
    captureException(err as Error);
    return [];
  }
};