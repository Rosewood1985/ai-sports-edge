import { trackEvent } from './analyticsService';
import { AIInputValidator } from './security/AIInputValidator';
import { PromptTemplate } from './security/PromptTemplate';

/**
 * Summary request interface
 */
export interface SummaryRequest {
  content: string;
  maxLength?: number;
  focusOn?: 'betting' | 'fantasy' | 'general';
}

/**
 * Summarize content using AI
 * @param request Summary request
 * @returns AI-generated summary
 */
export const summarizeWithAI = async (request: SummaryRequest): Promise<string> => {
  try {
    // Validate and sanitize input
    const validatedRequest = AIInputValidator.validateSummaryRequest({
      ...request,
      maxLength: request.maxLength || 150,
    });

    // Track the event with sanitized data
    await trackEvent('ai_summary_generated', {
      focus: request.focusOn || 'betting',
      content_length: validatedRequest.content.length,
    });

    // Generate secure summary using template system
    return generateSecureSummary(validatedRequest);
  } catch (error) {
    // Track error for monitoring
    trackEvent('ai_summary_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Return safe fallback
    return 'Unable to generate summary at this time. Please try again later.';
  }
};

/**
 * Generate a secure summary using template system
 * @param request Validated summary request
 * @returns Secure summary
 */
const generateSecureSummary = (request: {
  content: string;
  maxLength: number;
  language: string;
}): string => {
  // Use secure template system instead of direct content processing
  return PromptTemplate.createSummary(request.content, request.language, request.maxLength);
};

/**
 * Call Firebase function to generate AI summary
 * @param content Content to summarize
 * @param maxLength Maximum length of summary
 * @param focusOn Focus area for summary
 * @returns AI-generated summary
 */
export const generateAISummary = async (
  content: string,
  maxLength: number = 150,
  focusOn: 'betting' | 'fantasy' | 'general' = 'betting'
): Promise<string> => {
  try {
    // Validate and sanitize inputs
    const sanitizedContent = AIInputValidator.sanitizeContent(content, {
      maxLength: 5000,
      allowNewlines: true,
    });

    const validMaxLength = AIInputValidator.validateNumber(maxLength, 50, 500);

    // Create secure summary request
    const secureRequest = {
      content: sanitizedContent,
      maxLength: validMaxLength,
      language: 'en', // Default language
    };

    // Use secure summary generation
    return generateSecureSummary(secureRequest);
  } catch (error) {
    // Track error for monitoring
    trackEvent('ai_summary_generation_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 'Unable to generate summary at this time. Please try again later.';
  }
};

export default {
  summarizeWithAI,
  generateAISummary,
};
