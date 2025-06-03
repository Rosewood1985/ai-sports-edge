/**
 * AI Input Validator - Security Layer for AI Services
 * Prevents prompt injection and validates user inputs
 * Location: /services/security/AIInputValidator.ts
 */

export interface ValidationOptions {
  maxLength?: number;
  allowNewlines?: boolean;
  allowSpecialChars?: boolean;
}

export class AIInputValidator {
  /**
   * Sanitize content to prevent prompt injection
   */
  static sanitizeContent(content: string, options: ValidationOptions = {}): string {
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content: must be a non-empty string');
    }

    const { maxLength = 5000, allowNewlines = false, allowSpecialChars = false } = options;

    let sanitized = content;

    // Remove potential prompt injection patterns
    sanitized = sanitized
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers

    // Handle newlines
    if (!allowNewlines) {
      sanitized = sanitized.replace(/\n+/g, ' ');
    } else {
      sanitized = sanitized.replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines
    }

    // Handle special characters
    if (!allowSpecialChars) {
      sanitized = sanitized.replace(/[<>{}[\]]/g, '');
    }

    // Trim and limit length
    sanitized = sanitized.trim().substring(0, maxLength);

    if (!sanitized) {
      throw new Error('Content becomes empty after sanitization');
    }

    return sanitized;
  }

  /**
   * Validate and sanitize team names
   */
  static sanitizeTeamName(teamName: string): string {
    if (!teamName || typeof teamName !== 'string') {
      return 'Team';
    }

    // Only allow alphanumeric characters, spaces, periods, hyphens, and apostrophes
    return teamName
      .replace(/[^a-zA-Z0-9\s\-\.']/g, '')
      .replace(/\s+/g, ' ') // Normalize spaces
      .substring(0, 50) // Limit length
      .trim();
  }

  /**
   * Validate language code
   */
  static validateLanguage(language: string): string {
    const validLanguages = ['en', 'es', 'fr', 'de', 'pt', 'it'];
    return validLanguages.includes(language?.toLowerCase()) ? language.toLowerCase() : 'en';
  }

  /**
   * Validate summary request parameters
   */
  static validateSummaryRequest(request: any): {
    content: string;
    maxLength: number;
    language: string;
  } {
    if (!request || typeof request !== 'object') {
      throw new Error('Invalid request object');
    }

    const content = this.sanitizeContent(request.content, {
      maxLength: 10000,
      allowNewlines: true,
    });

    const maxLength = Math.min(
      Math.max(parseInt(request.maxLength) || 150, 50), // Minimum 50
      1000 // Maximum 1000
    );

    const language = this.validateLanguage(request.language);

    return { content, maxLength, language };
  }

  /**
   * Validate numeric inputs
   */
  static validateNumber(value: any, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Invalid number');
    }
    return Math.min(Math.max(num, min), max);
  }

  /**
   * Rate limiting helper
   */
  static checkRateLimit(userId: string, limit = 100, windowMs = 3600000): boolean {
    // This would integrate with a proper rate limiting service
    // For now, return true (implement with Redis/memory cache in production)
    return true;
  }
}
