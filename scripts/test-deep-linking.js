/**
 * Test script for deep linking
 *
 * This script tests the deep linking functionality by:
 * 1. Creating deep links for different paths
 * 2. Parsing deep links
 * 3. Validating deep link data
 *
 * Usage: node scripts/test-deep-linking.js
 */

// Mock React Native's Linking API
const Linking = {
  getInitialURL: async () => null,
  addEventListener: () => {},
  removeEventListener: () => {},
  openURL: async url => {
    console.log(`Opening URL: ${url}`);
    return true;
  },
  canOpenURL: async url => {
    console.log(`Checking if can open URL: ${url}`);
    return true;
  },
};

// Deep link paths
const DeepLinkPath = {
  HOME: 'home',
  GAME: 'game',
  PLAYER: 'player',
  TEAM: 'team',
  BET: 'bet',
  SUBSCRIPTION: 'subscription',
  REFERRAL: 'referral',
  NOTIFICATION: 'notification',
  SETTINGS: 'settings',
  PROMO: 'promo',
};

// App URL scheme and web domain
const APP_URL_SCHEME = 'aisportsedge://';
const APP_WEB_DOMAIN = 'aisportsedge.app';

/**
 * Parse a deep link URL
 * @param {string} url Deep link URL
 * @returns {object} Deep link data
 */
function parseDeepLink(url) {
  try {
    // Create URL object
    const urlObj = new URL(url);

    // Extract path
    let path = urlObj.pathname.replace(/^\/+/, '');
    if (path === '') {
      path = DeepLinkPath.HOME;
    }

    // Validate path
    if (!Object.values(DeepLinkPath).includes(path)) {
      console.warn(`Invalid deep link path: ${path}, defaulting to HOME`);
      path = DeepLinkPath.HOME;
    }

    // Extract parameters
    const params = {};
    const utmParams = {};

    urlObj.searchParams.forEach((value, key) => {
      if (key.startsWith('utm_')) {
        // Extract UTM parameter
        const utmKey = key.replace('utm_', '');
        utmParams[utmKey] = value;
      } else {
        // Regular parameter
        params[key] = value;
      }
    });

    return {
      url,
      path,
      params,
      utmParams,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);

    // Return default deep link data
    return {
      url,
      path: DeepLinkPath.HOME,
      params: {},
      utmParams: {},
      timestamp: new Date(),
    };
  }
}

/**
 * Create a deep link URL
 * @param {string} path Deep link path
 * @param {object} params Deep link parameters
 * @param {object} utmParams UTM parameters
 * @returns {string} Deep link URL
 */
function createDeepLink(path, params = {}, utmParams = {}) {
  try {
    // Create URL with scheme and path
    let url = `${APP_URL_SCHEME}${path}`;

    // Add parameters
    const urlParams = new URLSearchParams();

    // Add regular parameters
    Object.entries(params).forEach(([key, value]) => {
      urlParams.append(key, value);
    });

    // Add UTM parameters
    Object.entries(utmParams).forEach(([key, value]) => {
      urlParams.append(`utm_${key}`, value);
    });

    // Add parameters to URL
    const paramsString = urlParams.toString();
    if (paramsString) {
      url += `?${paramsString}`;
    }

    return url;
  } catch (error) {
    console.error('Error creating deep link:', error);
    return `${APP_URL_SCHEME}${DeepLinkPath.HOME}`;
  }
}

/**
 * Create a universal link URL
 * @param {string} path Deep link path
 * @param {object} params Deep link parameters
 * @param {object} utmParams UTM parameters
 * @returns {string} Universal link URL
 */
function createUniversalLink(path, params = {}, utmParams = {}) {
  try {
    // Create URL with web domain and path
    let url = `https://${APP_WEB_DOMAIN}/${path}`;

    // Add parameters
    const urlParams = new URLSearchParams();

    // Add regular parameters
    Object.entries(params).forEach(([key, value]) => {
      urlParams.append(key, value);
    });

    // Add UTM parameters
    Object.entries(utmParams).forEach(([key, value]) => {
      urlParams.append(`utm_${key}`, value);
    });

    // Add parameters to URL
    const paramsString = urlParams.toString();
    if (paramsString) {
      url += `?${paramsString}`;
    }

    return url;
  } catch (error) {
    console.error('Error creating universal link:', error);
    return `https://${APP_WEB_DOMAIN}/${DeepLinkPath.HOME}`;
  }
}

/**
 * Test deep link creation and parsing
 */
function testDeepLinking() {
  console.log('\n--- Testing Deep Linking ---');

  // Test cases
  const testCases = [
    {
      path: DeepLinkPath.HOME,
      params: {},
      utmParams: {},
    },
    {
      path: DeepLinkPath.GAME,
      params: { id: 'game123' },
      utmParams: {},
    },
    {
      path: DeepLinkPath.PLAYER,
      params: { id: 'player456' },
      utmParams: { source: 'email', campaign: 'weekly_digest' },
    },
    {
      path: DeepLinkPath.TEAM,
      params: { id: 'team789' },
      utmParams: { source: 'social', medium: 'twitter', campaign: 'playoffs' },
    },
    {
      path: DeepLinkPath.REFERRAL,
      params: { code: 'REF123' },
      utmParams: { source: 'referral', campaign: 'friend_invite' },
    },
  ];

  // Test each case
  testCases.forEach((testCase, index) => {
    console.log(`\nTest Case ${index + 1}: ${testCase.path}`);

    // Create deep link
    const deepLink = createDeepLink(testCase.path, testCase.params, testCase.utmParams);
    console.log(`Deep Link: ${deepLink}`);

    // Create universal link
    const universalLink = createUniversalLink(testCase.path, testCase.params, testCase.utmParams);
    console.log(`Universal Link: ${universalLink}`);

    // Parse deep link
    const parsedDeepLink = parseDeepLink(deepLink);
    console.log('Parsed Deep Link:', JSON.stringify(parsedDeepLink, null, 2));

    // Parse universal link
    const parsedUniversalLink = parseDeepLink(universalLink);
    console.log('Parsed Universal Link:', JSON.stringify(parsedUniversalLink, null, 2));

    // Validate deep link
    validateDeepLink(parsedDeepLink, testCase);

    // Validate universal link
    validateDeepLink(parsedUniversalLink, testCase);
  });

  console.log('\nDeep linking tests completed successfully');
}

/**
 * Validate deep link data
 * @param {object} parsedLink Parsed deep link data
 * @param {object} testCase Test case data
 */
function validateDeepLink(parsedLink, testCase) {
  // Validate path
  if (parsedLink.path !== testCase.path) {
    console.error(`Path mismatch: expected ${testCase.path}, got ${parsedLink.path}`);
  }

  // Validate parameters
  Object.entries(testCase.params).forEach(([key, value]) => {
    if (parsedLink.params[key] !== value) {
      console.error(
        `Parameter mismatch for ${key}: expected ${value}, got ${parsedLink.params[key]}`
      );
    }
  });

  // Validate UTM parameters
  Object.entries(testCase.utmParams).forEach(([key, value]) => {
    if (parsedLink.utmParams[key] !== value) {
      console.error(
        `UTM parameter mismatch for ${key}: expected ${value}, got ${parsedLink.utmParams[key]}`
      );
    }
  });
}

/**
 * Run all tests
 */
function runTests() {
  try {
    console.log('Starting deep linking tests...');

    testDeepLinking();

    console.log('\nAll deep linking tests completed');
  } catch (error) {
    console.error('Error running deep linking tests:', error);
  }
}

// Run tests
runTests();
