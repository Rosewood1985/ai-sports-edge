/**
 * Secure Prompt Template System
 * Prevents prompt injection through parameterized templates
 * Location: /services/security/PromptTemplate.ts
 */

import { AIInputValidator } from './AIInputValidator';

export interface TemplateParams {
  [key: string]: string | number;
}

export class PromptTemplate {
  /**
   * Safely format template with parameters
   */
  static format(template: string, params: TemplateParams): string {
    if (!template || typeof template !== 'string') {
      throw new Error('Invalid template');
    }

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = params[key];
      if (value === undefined || value === null) {
        return match; // Keep placeholder if no value provided
      }

      return this.sanitizeParam(String(value));
    });
  }

  /**
   * Sanitize individual template parameters
   */
  private static sanitizeParam(value: string): string {
    return value
      .replace(/[<>{}[\]]/g, '') // Remove template-breaking characters
      .replace(/```/g, '') // Remove code blocks
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .substring(0, 100) // Limit length
      .trim();
  }

  /**
   * Team-specific reasoning templates (secure)
   */
  static getTeamReasoningTemplates(language: string): string[] {
    const templates = {
      en: [
        '{{team}} has won {{wins}} of their last {{games}} games.',
        '{{team}} has a strong {{stat}} rating this season.',
        '{{team}} shows consistent performance in {{category}}.',
        '{{team}} has favorable matchup statistics.',
        'Recent form suggests {{team}} is in good shape.',
      ],
      es: [
        '{{team}} ha ganado {{wins}} de sus últimos {{games}} juegos.',
        '{{team}} tiene una calificación fuerte de {{stat}} esta temporada.',
        '{{team}} muestra un rendimiento consistente en {{category}}.',
        '{{team}} tiene estadísticas favorables de enfrentamiento.',
        'La forma reciente sugiere que {{team}} está en buena forma.',
      ],
    };

    return templates[language] || templates.en;
  }

  /**
   * Safe summary generation templates
   */
  static getSummaryTemplates(language: string): string[] {
    const templates = {
      en: [
        'Analysis shows {{outcome}} based on {{factors}}.',
        'Key indicators suggest {{prediction}} with {{confidence}} confidence.',
        'Statistical analysis indicates {{result}}.',
        'Based on recent performance, {{conclusion}}.',
      ],
      es: [
        'El análisis muestra {{outcome}} basado en {{factors}}.',
        'Los indicadores clave sugieren {{prediction}} con {{confidence}} confianza.',
        'El análisis estadístico indica {{result}}.',
        'Basado en el rendimiento reciente, {{conclusion}}.',
      ],
    };

    return templates[language] || templates.en;
  }

  /**
   * Create secure reasoning with validated inputs
   */
  static createTeamReasoning(
    team: string,
    language: string,
    stats: { wins?: number; games?: number; stat?: string; category?: string } = {}
  ): string {
    const sanitizedTeam = AIInputValidator.sanitizeTeamName(team);
    const validLanguage = AIInputValidator.validateLanguage(language);

    const templates = this.getTeamReasoningTemplates(validLanguage);
    const template = templates[Math.floor(Math.random() * templates.length)];

    const params: TemplateParams = {
      team: sanitizedTeam,
      wins: stats.wins || 7,
      games: stats.games || 10,
      stat: this.sanitizeParam(stats.stat || 'offensive'),
      category: this.sanitizeParam(stats.category || 'home games'),
    };

    return this.format(template, params);
  }

  /**
   * Create secure summary with validated content
   */
  static createSummary(content: string, language: string, maxLength: number): string {
    const sanitizedContent = AIInputValidator.sanitizeContent(content, {
      maxLength: 1000,
      allowNewlines: false,
    });

    const validLanguage = AIInputValidator.validateLanguage(language);
    const validMaxLength = AIInputValidator.validateNumber(maxLength, 50, 500);

    // Simple extractive summarization (secure)
    const sentences = sanitizedContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 3).join('. ') + '.';

    return summary.substring(0, validMaxLength);
  }
}
