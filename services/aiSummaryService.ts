import axios from 'axios';
import { functions } from '../config/firebase';
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
      maxLength: request.maxLength || 150
    });

    // Track the event with sanitized data
    await trackEvent('ai_summary_generated', {
      focus: request.focusOn || 'betting',
      content_length: validatedRequest.content.length
    });
    
    // Generate secure summary using template system
    return generateSecureSummary(validatedRequest);
  } catch (error) {
    console.error('Error summarizing with AI:', error);
    // Return safe fallback
    return 'Unable to generate summary at this time. Please try again later.';
  }
};

/**
 * Generate a secure summary using template system
 * @param request Validated summary request
 * @returns Secure summary
 */
const generateSecureSummary = (request: { content: string; maxLength: number; language: string }): string => {
  // Use secure template system instead of direct content processing
  return PromptTemplate.createSummary(request.content, request.language, request.maxLength);
};

/**
 * Generate a mock summary for development (DEPRECATED - use generateSecureSummary)
 * @param request Summary request
 * @returns Mock summary
 */
const generateMockSummary = (request: SummaryRequest): string => {
  try {
    // Sanitize content before processing
    const sanitizedContent = AIInputValidator.sanitizeContent(request.content, {
      maxLength: 1000,
      allowNewlines: false
    });
    
    const maxLength = AIInputValidator.validateNumber(request.maxLength || 150, 50, 500);
    const focusOn = request.focusOn || 'betting';
  
    // Generate different summaries based on the sanitized content and focus
    if (sanitizedContent.includes('injury')) {
    if (focusOn === 'betting') {
      return `This injury significantly impacts betting odds. Teams missing key players typically see point spreads shift by 2-4 points. Consider how this absence affects team dynamics before placing bets. Historical performance without this player suggests decreased offensive efficiency.`;
    } else if (focusOn === 'fantasy') {
      return `Fantasy impact: Consider benching this player immediately and monitor injury reports. Look for backup players who will see increased minutes/touches as potential waiver wire pickups. Expect reduced production even upon return.`;
    } else {
      return `Key player injury that will impact team performance in upcoming games. Recovery timeline suggests a multi-week absence. Team will need to adjust strategy and rotations accordingly.`;
    }
  } else if (sanitizedContent.includes('lineup')) {
    if (focusOn === 'betting') {
      return `Lineup changes suggest value in the underdog for this matchup. New starters typically create defensive mismatches that can be exploited. Consider betting the over as defensive chemistry may be disrupted with new rotations.`;
    } else if (focusOn === 'fantasy') {
      return `Fantasy alert: New starters represent immediate waiver wire opportunities. Expect increased minutes and usage rates for promoted players. Monitor performance closely in first game with new role.`;
    } else {
      return `Strategic lineup adjustments that could impact team performance. New starters bring different skillsets that may change offensive and defensive approaches. Watch for chemistry issues in early stages.`;
    }
  } else if (sanitizedContent.includes('trade')) {
    if (focusOn === 'betting') {
      return `This trade creates immediate betting opportunities. The receiving team typically sees a short-term boost in performance, suggesting value on money lines. Long-term implications may shift championship futures odds significantly.`;
    } else if (focusOn === 'fantasy') {
      return `Major fantasy implications from this trade. Player value often increases in new systems with different usage rates. Consider selling high on complementary players who may see reduced touches with new addition.`;
    } else {
      return `Significant trade that reshapes competitive landscape. Both teams addressing specific needs through this deal. Short-term adjustment period expected before full integration of new players.`;
    }
  } else {
    if (focusOn === 'betting') {
      return `This development has subtle betting implications that the market may not have fully priced in. Look for value in prop bets and alternative lines. Historical trends in similar situations suggest opportunity for informed bettors.`;
    } else if (focusOn === 'fantasy') {
      return `Fantasy managers should monitor this situation closely. Potential for significant shifts in player values and roles. Consider proactive roster moves to capitalize on information before it's widely recognized.`;
    } else {
      return `Important development that could impact future games and strategies. Teams will need to adapt to these changes. Fans should watch for ripple effects throughout the league.`;
    }
  } catch (error) {
    console.error('Error in generateMockSummary:', error);
    return 'Unable to generate summary. Please try again.';
  }
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
      allowNewlines: true
    });
    
    const validMaxLength = AIInputValidator.validateNumber(maxLength, 50, 500);
    
    // Create secure summary request
    const secureRequest = {
      content: sanitizedContent,
      maxLength: validMaxLength,
      language: 'en' // Default language
    };
    
    // Use secure summary generation
    return generateSecureSummary(secureRequest);
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return 'Unable to generate summary at this time. Please try again later.';
  }
};

export default {
  summarizeWithAI,
  generateAISummary
};