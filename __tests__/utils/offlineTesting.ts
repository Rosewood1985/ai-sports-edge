/**
 * Offline Testing Utilities
 *
 * This file contains utilities for testing components in offline mode
 * and across different browsers.
 */

/**
 * Mock network conditions
 * @param online Whether the network is online
 * @returns Function to restore original network state
 */
export function mockNetworkCondition(online: boolean): () => void {
  // Store original navigator.onLine value
  const originalOnline = window.navigator.onLine;

  // Mock navigator.onLine
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: online,
    writable: true,
  });

  // Mock fetch to simulate network conditions
  const originalFetch = window.fetch;
  if (!online) {
    window.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));
  }

  // Mock XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  if (!online) {
    // @ts-ignore
    window.XMLHttpRequest = function () {
      const xhr = new originalXHR();

      // Override the open method
      const originalOpen = xhr.open;
      xhr.open = function () {
        originalOpen.apply(xhr, arguments);

        // Simulate network error
        setTimeout(() => {
          if (xhr.onreadystatechange) {
            xhr.onreadystatechange.call(xhr);
          }
          if (xhr.onerror) {
            xhr.onerror.call(xhr);
          }
        }, 100);
      };

      return xhr;
    };
  }

  // Return function to restore original network state
  return () => {
    // Restore navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: originalOnline,
      writable: true,
    });

    // Restore fetch
    window.fetch = originalFetch;

    // Restore XMLHttpRequest
    window.XMLHttpRequest = originalXHR;
  };
}

/**
 * Mock browser type
 * @param browser Browser to mock ('chrome', 'firefox', 'safari', 'edge')
 * @returns Function to restore original user agent
 */
export function mockBrowser(browser: 'chrome' | 'firefox' | 'safari' | 'edge'): () => void {
  // Store original user agent
  const originalUserAgent = window.navigator.userAgent;

  // Define browser user agents
  const userAgents = {
    chrome:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    safari:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  };

  // Mock navigator.userAgent
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: userAgents[browser],
    writable: true,
  });

  // Return function to restore original user agent
  return () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
      writable: true,
    });
  };
}

/**
 * Run tests in offline mode
 * @param testName Test name
 * @param testFn Test function
 */
export function offlineTest(testName: string, testFn: () => void): void {
  test(`${testName} (offline)`, () => {
    const restoreNetwork = mockNetworkCondition(false);
    try {
      testFn();
    } finally {
      restoreNetwork();
    }
  });
}

/**
 * Run tests across different browsers
 * @param testName Test name
 * @param testFn Test function that receives the current browser
 */
export function crossBrowserTest(
  testName: string,
  testFn: (browser: 'chrome' | 'firefox' | 'safari' | 'edge') => void
): void {
  const browsers: ('chrome' | 'firefox' | 'safari' | 'edge')[] = [
    'chrome',
    'firefox',
    'safari',
    'edge',
  ];

  browsers.forEach(browser => {
    test(`${testName} (${browser})`, () => {
      const restoreBrowser = mockBrowser(browser);
      try {
        testFn(browser);
      } finally {
        restoreBrowser();
      }
    });
  });
}

/**
 * Run tests with different network speeds
 * @param testName Test name
 * @param testFn Test function that receives the current network speed
 */
export function networkSpeedTest(
  testName: string,
  testFn: (speed: 'fast' | 'slow' | 'variable') => void
): void {
  const speeds: ('fast' | 'slow' | 'variable')[] = ['fast', 'slow', 'variable'];

  speeds.forEach(speed => {
    test(`${testName} (${speed} network)`, () => {
      // Mock fetch to simulate different network speeds
      const originalFetch = window.fetch;

      if (speed === 'fast') {
        window.fetch = jest.fn().mockImplementation(async (...args) => {
          // Fast network: minimal delay
          await new Promise(resolve => setTimeout(resolve, 50));
          return originalFetch(...args);
        });
      } else if (speed === 'slow') {
        window.fetch = jest.fn().mockImplementation(async (...args) => {
          // Slow network: significant delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          return originalFetch(...args);
        });
      } else if (speed === 'variable') {
        window.fetch = jest.fn().mockImplementation(async (...args) => {
          // Variable network: random delay between 100ms and 1500ms
          const delay = Math.floor(Math.random() * 1400) + 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          return originalFetch(...args);
        });
      }

      try {
        testFn(speed);
      } finally {
        // Restore original fetch
        window.fetch = originalFetch;
      }
    });
  });
}
