// Odds Conversion Utilities
// Form Validation Utilities
import { SPORTSBOOK_CONFIG } from '../config/sportsbook';
import { BetLeg, BetSlip } from '../types/betting';

// Analytics Calculation Utilities
import { PerformanceMetrics } from '../types/betting';

// OCR Text Processing Utilities

export class OddsConverter {
  static americanToDecimal(american: number): number {
    if (american > 0) {
      return american / 100 + 1;
    } else {
      return 100 / Math.abs(american) + 1;
    }
  }

  static decimalToAmerican(decimal: number): number {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1));
    }
  }

  static fractionalToAmerican(numerator: number, denominator: number): number {
    const decimal = numerator / denominator + 1;
    return this.decimalToAmerican(decimal);
  }

  static parseOdds(
    oddsString: string,
    format: 'american' | 'decimal' | 'fractional' = 'american'
  ): number {
    const cleaned = oddsString.replace(/[^\d.+\-/]/g, '');

    switch (format) {
      case 'american':
        return parseInt(cleaned);

      case 'decimal':
        const decimal = parseFloat(cleaned);
        return this.decimalToAmerican(decimal);

      case 'fractional':
        const [num, den] = cleaned.split('/').map(n => parseInt(n));
        return this.fractionalToAmerican(num, den);

      default:
        return parseInt(cleaned);
    }
  }

  static calculatePayout(odds: number | string, stake: number): number {
    const americanOdds = typeof odds === 'string' ? this.parseOdds(odds) : odds;

    if (americanOdds > 0) {
      return (stake * americanOdds) / 100;
    } else {
      return (stake * 100) / Math.abs(americanOdds);
    }
  }

  static calculateImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }
}

export class BetSlipValidator {
  static validateBetLeg(leg: Partial<BetLeg>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!leg.sport) errors.sport = 'Sport is required';
    if (!leg.league) errors.league = 'League is required';
    if (!leg.eventName?.trim()) errors.eventName = 'Event name is required';
    if (!leg.betType) errors.betType = 'Bet type is required';
    if (!leg.selection?.trim()) errors.selection = 'Selection is required';
    if (!leg.odds?.trim()) errors.odds = 'Odds are required';

    // Validate stake
    const stake = parseFloat(leg.stake as any);
    if (!stake || stake <= 0) {
      errors.stake = 'Valid stake amount is required';
    } else if (stake > 100000) {
      errors.stake = 'Stake amount is too large';
    }

    // Validate odds format
    try {
      OddsConverter.parseOdds(leg.odds as string, leg.oddsFormat);
    } catch (e) {
      errors.odds = 'Invalid odds format';
    }

    // Validate event name format
    if (leg.eventName && !/^.+\s+(vs?|@|v)\s+.+$/i.test(leg.eventName)) {
      errors.eventName = 'Event should be in format "Team A vs Team B"';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateBetSlip(betSlip: Partial<BetSlip>): {
    isValid: boolean;
    errors: Record<string, any>;
  } {
    const errors: Record<string, any> = {};

    if (!betSlip.sportsbook) {
      errors.sportsbook = 'Sportsbook selection is required';
    }

    if (!betSlip.legs || betSlip.legs.length === 0) {
      errors.legs = 'At least one bet leg is required';
    }

    if (betSlip.isParlay && betSlip.legs && betSlip.legs.length < 2) {
      errors.parlay = 'Parlay requires at least 2 legs';
    }

    // Validate each leg
    const legErrors: Record<string, any>[] = [];
    betSlip.legs?.forEach((leg, index) => {
      const legValidation = this.validateBetLeg(leg);
      if (!legValidation.isValid) {
        legErrors[index] = legValidation.errors;
      }
    });

    if (legErrors.length > 0) {
      errors.legErrors = legErrors;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

export class AnalyticsCalculator {
  static calculatePerformanceMetrics(betSlips: BetSlip[]): PerformanceMetrics {
    const settled = betSlips.filter(slip => slip.status !== 'pending');
    const won = settled.filter(slip => slip.status === 'won');

    const totalStake = settled.reduce((sum, slip) => sum + slip.totalStake, 0);
    const totalPayout = won.reduce((sum, slip) => sum + (slip.totalPayout || 0), 0);
    const profitLoss = totalPayout - totalStake;

    return {
      totalBets: settled.length,
      totalParlays: settled.filter(slip => slip.isParlay).length,
      winRate: settled.length > 0 ? won.length / settled.length : 0,
      totalStaked: totalStake,
      totalReturned: totalPayout,
      profitLoss,
      roi: totalStake > 0 ? profitLoss / totalStake : 0,
      averageStake: settled.length > 0 ? totalStake / settled.length : 0,
      biggestWin: Math.max(...won.map(slip => slip.totalPayout || 0), 0),
      biggestLoss: Math.min(...settled.map(slip => slip.totalStake || 0), 0),
      winStreak: this.calculateWinStreak(settled),
      currentStreak: this.calculateCurrentStreak(settled),
    };
  }

  static calculateWinStreak(betSlips: BetSlip[]): number {
    const sorted = [...betSlips].sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());
    let maxStreak = 0;
    let currentStreak = 0;

    sorted.forEach(slip => {
      if (slip.status === 'won') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return maxStreak;
  }

  static calculateCurrentStreak(betSlips: BetSlip[]): { streak: number; isWinning: boolean } {
    const sorted = [...betSlips].sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());
    let streak = 0;
    let isWinning = false; // Default to false if no streak

    for (const slip of sorted) {
      if (slip.status === 'won') {
        if (streak === 0) isWinning = true;
        if (isWinning) streak++;
        else break;
      } else if (slip.status === 'lost') {
        if (streak === 0) isWinning = false;
        if (!isWinning) streak++;
        else break;
      }
    }

    return { streak, isWinning };
  }

  static groupByProperty<T>(items: T[], property: keyof T): Record<string, T[]> {
    return items.reduce(
      (groups, item) => {
        const key = String(item[property]);
        groups[key] = groups[key] || [];
        groups[key].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  }

  static average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
  }
}

// Language and Localization Utilities
export class LocalizationHelper {
  static getTranslation(language: string, key: string, translations: Record<string, any>): string {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }

    return value || key;
  }

  static interpolate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  static formatCurrency(amount: number, language = 'en'): string {
    const locale = language === 'es' ? 'es-US' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  static formatPercentage(value: number, language = 'en'): string {
    const locale = language === 'es' ? 'es-US' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  static formatDate(date: Date | string, language = 'en'): string {
    const locale = language === 'es' ? 'es-US' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }
}

// File Upload Utilities
export class FileUploadHelper {
  static validateImageFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size must be under 10MB');
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      errors.push('File must be a valid image format (JPG, PNG, GIF, WebP)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = originalName.substring(originalName.lastIndexOf('.'));

    return `bet-slip-${timestamp}-${random}${extension}`;
  }
}

export class OCRProcessor {
  static detectSportsbook(text: string): string {
    const cleanText = text.toLowerCase();

    for (const [key, config] of Object.entries(SPORTSBOOK_CONFIG)) {
      for (const identifier of (config as any).identifiers) {
        if (cleanText.includes(identifier.toLowerCase())) {
          return key;
        }
      }
    }

    return 'generic';
  }

  static extractBetData(text: string, sportsbook = 'generic'): any {
    const config = (SPORTSBOOK_CONFIG as any)[sportsbook];
    const patterns = config.patterns;

    const extractedData = {
      sportsbook,
      confidence: 0,
      fields: {} as Record<string, any>,
    };

    // Extract monetary amounts
    const stakeMatch = text.match(patterns.betAmount || patterns.riskAmount);
    extractedData.fields.stake = stakeMatch ? stakeMatch[1] : null;

    const payoutMatch = text.match(patterns.toWin || patterns.potentialPayout);
    extractedData.fields.payout = payoutMatch ? payoutMatch[1] : null;

    // Extract odds
    const oddsMatches = text.match(patterns.odds);
    extractedData.fields.odds = oddsMatches ? oddsMatches[0] : null;

    // Extract teams/event
    const teamMatch = text.match(patterns.teams);
    if (teamMatch) {
      extractedData.fields.event = `${teamMatch[1]} vs ${teamMatch[2]}`;
      extractedData.fields.teams = [teamMatch[1], teamMatch[2]];
    }

    // Calculate confidence based on extracted fields
    extractedData.confidence = this.calculateConfidence(extractedData.fields);

    return extractedData;
  }

  static calculateConfidence(fields: Record<string, any>): number {
    let score = 0;

    if (fields.stake) score += 0.3;
    if (fields.odds) score += 0.3;
    if (fields.event) score += 0.2;
    if (fields.payout) score += 0.1;
    if (fields.teams) score += 0.1;

    // Validate field formats for bonus points
    if (fields.stake && /^\d+(\.\d{2})?$/.test(fields.stake)) score += 0.05;
    if (fields.odds && /^[+-]?\d{3,4}$/.test(fields.odds)) score += 0.05;

    return Math.min(score, 1.0);
  }

  static cleanExtractedText(text: string): string {
    return text
      .replace(/[^\w\s$.,+\-@vs]/g, ' ') // Remove special chars except relevant ones
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}
