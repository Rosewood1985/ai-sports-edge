/**
 * Tests for accessibility test utilities
 */

import {
  calculateRelativeLuminance,
  hexToRgb,
  rgbaToRgb,
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  validateContrast,
  testThemeContrast,
} from '../../utils/accessibilityTestUtils';

describe('Accessibility Test Utilities', () => {
  describe('hexToRgb', () => {
    it('converts 6-digit hex to RGB', () => {
      expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#00FF00')).toEqual([0, 255, 0]);
      expect(hexToRgb('#0000FF')).toEqual([0, 0, 255]);
    });

    it('converts 3-digit hex to RGB', () => {
      expect(hexToRgb('#FFF')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#F00')).toEqual([255, 0, 0]);
      expect(hexToRgb('#0F0')).toEqual([0, 255, 0]);
      expect(hexToRgb('#00F')).toEqual([0, 0, 255]);
    });

    it('handles hex without # prefix', () => {
      expect(hexToRgb('FFFFFF')).toEqual([255, 255, 255]);
      expect(hexToRgb('000')).toEqual([0, 0, 0]);
    });
  });

  describe('rgbaToRgb', () => {
    it('extracts RGB values from rgba strings', () => {
      expect(rgbaToRgb('rgba(255, 255, 255, 1)')).toEqual([255, 255, 255]);
      expect(rgbaToRgb('rgba(0, 0, 0, 0.5)')).toEqual([0, 0, 0]);
      expect(rgbaToRgb('rgba(255, 0, 0, 0.8)')).toEqual([255, 0, 0]);
    });

    it('extracts RGB values from rgb strings', () => {
      expect(rgbaToRgb('rgb(255, 255, 255)')).toEqual([255, 255, 255]);
      expect(rgbaToRgb('rgb(0, 0, 0)')).toEqual([0, 0, 0]);
      expect(rgbaToRgb('rgb(255, 0, 0)')).toEqual([255, 0, 0]);
    });

    it('throws an error for invalid rgba strings', () => {
      expect(() => rgbaToRgb('not-a-color')).toThrow();
      expect(() => rgbaToRgb('rgb()')).toThrow();
      expect(() => rgbaToRgb('rgba(255)')).toThrow();
    });
  });

  describe('calculateRelativeLuminance', () => {
    it('calculates relative luminance for white', () => {
      expect(calculateRelativeLuminance(255, 255, 255)).toBeCloseTo(1);
    });

    it('calculates relative luminance for black', () => {
      expect(calculateRelativeLuminance(0, 0, 0)).toBeCloseTo(0);
    });

    it('calculates relative luminance for primary colors', () => {
      // Red
      expect(calculateRelativeLuminance(255, 0, 0)).toBeCloseTo(0.2126);

      // Green
      expect(calculateRelativeLuminance(0, 255, 0)).toBeCloseTo(0.7152);

      // Blue
      expect(calculateRelativeLuminance(0, 0, 255)).toBeCloseTo(0.0722);
    });

    it('calculates relative luminance for gray values', () => {
      // 50% gray
      expect(calculateRelativeLuminance(128, 128, 128)).toBeCloseTo(0.2158, 2);

      // 25% gray
      expect(calculateRelativeLuminance(64, 64, 64)).toBeCloseTo(0.0459, 2);

      // 75% gray
      expect(calculateRelativeLuminance(192, 192, 192)).toBeCloseTo(0.5222, 2);
    });
  });

  describe('calculateContrastRatio', () => {
    it('calculates contrast ratio between black and white', () => {
      expect(calculateContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21);
      expect(calculateContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
    });

    it('calculates contrast ratio between colors', () => {
      // Blue on white
      expect(calculateContrastRatio('#0000FF', '#FFFFFF')).toBeCloseTo(8.59, 1);

      // Red on white
      expect(calculateContrastRatio('#FF0000', '#FFFFFF')).toBeCloseTo(4, 0);

      // Yellow on white
      expect(calculateContrastRatio('#FFFF00', '#FFFFFF')).toBeCloseTo(1.07, 1);

      // White on blue
      expect(calculateContrastRatio('#FFFFFF', '#0000FF')).toBeCloseTo(8.59, 1);
    });

    it('calculates contrast ratio for rgba colors', () => {
      expect(calculateContrastRatio('rgba(0, 0, 0, 1)', 'rgba(255, 255, 255, 1)')).toBeCloseTo(21);
      expect(calculateContrastRatio('rgb(0, 0, 255)', 'rgb(255, 255, 255)')).toBeCloseTo(8.59, 1);
    });
  });

  describe('meetsWCAGAA', () => {
    it('validates AA compliance for normal text', () => {
      // Black on white (21:1) - Passes
      expect(meetsWCAGAA('#000000', '#FFFFFF')).toBe(true);

      // Blue on white (8.59:1) - Passes
      expect(meetsWCAGAA('#0000FF', '#FFFFFF')).toBe(true);

      // Red on white (4:1) - Fails (needs 4.5:1)
      expect(meetsWCAGAA('#FF0000', '#FFFFFF')).toBe(false);

      // Yellow on white (1.07:1) - Fails
      expect(meetsWCAGAA('#FFFF00', '#FFFFFF')).toBe(false);
    });

    it('validates AA compliance for large text', () => {
      // Black on white (21:1) - Passes
      expect(meetsWCAGAA('#000000', '#FFFFFF', true)).toBe(true);

      // Blue on white (8.59:1) - Passes
      expect(meetsWCAGAA('#0000FF', '#FFFFFF', true)).toBe(true);

      // Red on white (4:1) - Passes (needs 3:1 for large text)
      expect(meetsWCAGAA('#FF0000', '#FFFFFF', true)).toBe(true);

      // Yellow on white (1.07:1) - Fails
      expect(meetsWCAGAA('#FFFF00', '#FFFFFF', true)).toBe(false);
    });
  });

  describe('meetsWCAGAAA', () => {
    it('validates AAA compliance for normal text', () => {
      // Black on white (21:1) - Passes
      expect(meetsWCAGAAA('#000000', '#FFFFFF')).toBe(true);

      // Blue on white (8.59:1) - Passes
      expect(meetsWCAGAAA('#0000FF', '#FFFFFF')).toBe(true);

      // Red on white (4:1) - Fails (needs 7:1)
      expect(meetsWCAGAAA('#FF0000', '#FFFFFF')).toBe(false);

      // Yellow on white (1.07:1) - Fails
      expect(meetsWCAGAAA('#FFFF00', '#FFFFFF')).toBe(false);
    });

    it('validates AAA compliance for large text', () => {
      // Black on white (21:1) - Passes
      expect(meetsWCAGAAA('#000000', '#FFFFFF', true)).toBe(true);

      // Blue on white (8.59:1) - Passes
      expect(meetsWCAGAAA('#0000FF', '#FFFFFF', true)).toBe(true);

      // Red on white (4:1) - Fails (needs 4.5:1 for large text AAA)
      expect(meetsWCAGAAA('#FF0000', '#FFFFFF', true)).toBe(false);

      // Yellow on white (1.07:1) - Fails
      expect(meetsWCAGAAA('#FFFF00', '#FFFFFF', true)).toBe(false);
    });
  });

  describe('validateContrast', () => {
    it('provides detailed validation results', () => {
      // Black on white (21:1) - Passes AA and AAA
      const blackOnWhite = validateContrast('#000000', '#FFFFFF');
      expect(blackOnWhite.ratio).toBeCloseTo(21);
      expect(blackOnWhite.meetsAA).toBe(true);
      expect(blackOnWhite.meetsAAA).toBe(true);
      expect(blackOnWhite.recommendation).toContain('meets WCAG 2.1 AAA');

      // Red on white (4:1) - Passes AA for large text, fails AA for normal text
      const redOnWhite = validateContrast('#FF0000', '#FFFFFF');
      expect(redOnWhite.ratio).toBeCloseTo(4, 0);
      expect(redOnWhite.meetsAA).toBe(false);
      expect(redOnWhite.meetsAAA).toBe(false);
      expect(redOnWhite.recommendation).toContain('does not meet WCAG 2.1 AA');

      // Red on white (4:1) for large text - Passes AA, fails AAA
      const redOnWhiteLarge = validateContrast('#FF0000', '#FFFFFF', true);
      expect(redOnWhiteLarge.ratio).toBeCloseTo(4, 0);
      expect(redOnWhiteLarge.meetsAA).toBe(true);
      expect(redOnWhiteLarge.meetsAAA).toBe(false);
      expect(redOnWhiteLarge.recommendation).toContain('meets WCAG 2.1 AA but not AAA');
    });
  });

  describe('testThemeContrast', () => {
    it('tests contrast for a theme', () => {
      const theme = {
        colors: {
          text: '#000000',
          background: '#FFFFFF',
          primary: '#0066CC',
          secondary: '#FF0000',
          buttonText: '#FFFFFF',
          buttonBackground: '#0066CC',
          cardText: '#000000',
          card: '#F5F5F5',
        },
      };

      const results = testThemeContrast(theme);

      expect(results.text.meetsAA).toBe(true);
      expect(results.text.meetsAAA).toBe(true);

      expect(results.primary.meetsAA).toBe(true);

      expect(results.secondary.meetsAA).toBe(false);

      expect(results.button.meetsAA).toBe(true);

      expect(results.card.meetsAA).toBe(true);
      expect(results.card.meetsAAA).toBe(true);
    });
  });
});
