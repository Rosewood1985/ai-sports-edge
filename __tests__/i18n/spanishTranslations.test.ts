import { I18nManager } from 'react-native';
import en from '../../translations/en.json';
import es from '../../translations/es.json';

// Mock React Native's I18nManager
jest.mock('react-native', () => ({
  I18nManager: {
    isRTL: false,
    allowRTL: jest.fn(),
    forceRTL: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('Spanish Translations', () => {
  it('should have translations for all English keys', () => {
    // Recursively check that all keys in English translation exist in Spanish
    function checkKeysExist(enObj: any, esObj: any, path = '') {
      for (const key in enObj) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if the key exists in Spanish translations
        expect(esObj).toHaveProperty(key);
        
        // If the value is an object, recursively check its keys
        if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
          checkKeysExist(enObj[key], esObj[key], currentPath);
        }
      }
    }
    
    checkKeysExist(en, es);
  });
  
  it('should not have empty translations in Spanish', () => {
    // Recursively check that no Spanish translations are empty
    function checkNotEmpty(obj: any, path = '') {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj[key] === 'string') {
          const value = obj[key].trim();
          expect(value.length).toBeGreaterThan(0);
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          checkNotEmpty(obj[key], currentPath);
        }
      }
    }
    
    checkNotEmpty(es);
  });
  
  it('should have weather-related translations', () => {
    // Check that weather section exists in both languages
    expect(en).toHaveProperty('weather');
    expect(es).toHaveProperty('weather');
    
    // Check specific weather keys
    const weatherKeys = [
      'loading',
      'unavailable',
      'expand',
      'collapse',
      'feelsLike',
      'humidity',
      'wind',
      'impact',
      'noData',
      'confidence'
    ] as const;
    
    weatherKeys.forEach(key => {
      expect(en.weather).toHaveProperty(key);
      expect(es.weather).toHaveProperty(key);
      // Use type assertion to avoid TypeScript error
      const weatherKey = key as keyof typeof es.weather;
      if (weatherKey !== 'impact') { // Skip 'impact' as it's an object
        expect(typeof es.weather[weatherKey]).toBe('string');
        expect(es.weather[weatherKey].length).toBeGreaterThan(0);
      }
    });
    
    // Check impact levels
    expect(en.weather).toHaveProperty('impact');
    expect(es.weather).toHaveProperty('impact');
    
    const impactLevels = [
      'strongNegative',
      'slightNegative',
      'neutral',
      'slightPositive',
      'strongPositive'
    ] as const;
    
    impactLevels.forEach(level => {
      expect(en.weather.impact).toHaveProperty(level);
      expect(es.weather.impact).toHaveProperty(level);
      // Use type assertion to avoid TypeScript error
      const impactKey = level as keyof typeof es.weather.impact;
      expect(typeof es.weather.impact[impactKey]).toBe('string');
      expect(es.weather.impact[impactKey].length).toBeGreaterThan(0);
    });
  });
});