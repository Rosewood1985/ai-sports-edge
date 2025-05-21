/**
 * Accessibility testing utilities
 *
 * This file contains utilities for testing accessibility features,
 * including color contrast calculation and validation.
 */

/**
 * Calculate the relative luminance of a color
 * Based on WCAG 2.1 relative luminance formula
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * @param r Red channel (0-255)
 * @param g Green channel (0-255)
 * @param b Blue channel (0-255)
 * @returns Relative luminance value (0-1)
 */
export function calculateRelativeLuminance(r: number, g: number, b: number): number {
  // Normalize RGB values to 0-1
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;

  // Calculate RGB values
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Parse a hex color string to RGB values
 *
 * @param hex Hex color string (e.g., "#FFFFFF" or "#FFF")
 * @returns RGB values as [r, g, b]
 */
export function hexToRgb(hex: string): [number, number, number] {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b];
}

/**
 * Parse an RGBA color string to RGB values
 *
 * @param rgba RGBA color string (e.g., "rgba(255, 255, 255, 1)")
 * @returns RGB values as [r, g, b]
 */
export function rgbaToRgb(rgba: string): [number, number, number] {
  // Extract RGB values from RGBA string
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);

  if (!match) {
    throw new Error(`Invalid RGBA color: ${rgba}`);
  }

  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 contrast ratio formula
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * @param color1 First color (hex or rgba)
 * @param color2 Second color (hex or rgba)
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  // Parse colors to RGB
  const rgb1 = color1.startsWith('#') ? hexToRgb(color1) : rgbaToRgb(color1);
  const rgb2 = color2.startsWith('#') ? hexToRgb(color2) : rgbaToRgb(color2);

  // Calculate relative luminance
  const l1 = calculateRelativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = calculateRelativeLuminance(rgb2[0], rgb2[1], rgb2[2]);

  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination meets WCAG 2.1 AA contrast requirements
 *
 * @param foreground Foreground color (hex or rgba)
 * @param background Background color (hex or rgba)
 * @param isLargeText Whether the text is large (>=18pt or >=14pt bold)
 * @returns Whether the contrast ratio meets WCAG 2.1 AA requirements
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if a color combination meets WCAG 2.1 AAA contrast requirements
 *
 * @param foreground Foreground color (hex or rgba)
 * @param background Background color (hex or rgba)
 * @param isLargeText Whether the text is large (>=18pt or >=14pt bold)
 * @returns Whether the contrast ratio meets WCAG 2.1 AAA requirements
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get contrast validation result with detailed information
 *
 * @param foreground Foreground color (hex or rgba)
 * @param background Background color (hex or rgba)
 * @param isLargeText Whether the text is large (>=18pt or >=14pt bold)
 * @returns Contrast validation result
 */
export function validateContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  recommendation: string;
} {
  const ratio = calculateContrastRatio(foreground, background);
  const meetsAA = isLargeText ? ratio >= 3 : ratio >= 4.5;
  const meetsAAA = isLargeText ? ratio >= 4.5 : ratio >= 7;

  let recommendation = '';

  if (!meetsAA) {
    recommendation =
      `Contrast ratio of ${ratio.toFixed(2)} does not meet WCAG 2.1 AA requirements. ` +
      `Minimum required: ${isLargeText ? '3:1' : '4.5:1'}.`;
  } else if (!meetsAAA) {
    recommendation =
      `Contrast ratio of ${ratio.toFixed(2)} meets WCAG 2.1 AA but not AAA requirements. ` +
      `For AAA compliance, minimum required: ${isLargeText ? '4.5:1' : '7:1'}.`;
  } else {
    recommendation = `Contrast ratio of ${ratio.toFixed(2)} meets WCAG 2.1 AAA requirements.`;
  }

  return {
    ratio,
    meetsAA,
    meetsAAA,
    recommendation,
  };
}

/**
 * Test color contrast for a theme
 *
 * @param theme Theme object with colors
 * @returns Validation results for various color combinations
 */
export function testThemeContrast(theme: { colors: Record<string, string> }): Record<string, any> {
  const { colors } = theme;
  const results: Record<string, any> = {};

  // Test text colors against background
  results.text = validateContrast(colors.text, colors.background);
  results.primary = validateContrast(colors.primary, colors.background);

  if (colors.secondary) {
    results.secondary = validateContrast(colors.secondary, colors.background);
  }

  if (colors.error) {
    results.error = validateContrast(colors.error, colors.background);
  }

  // Test button colors
  if (colors.buttonText && colors.buttonBackground) {
    results.button = validateContrast(colors.buttonText, colors.buttonBackground);
  }

  // Test card colors
  if (colors.cardText && colors.card) {
    results.card = validateContrast(colors.cardText, colors.card);
  }

  return results;
}
