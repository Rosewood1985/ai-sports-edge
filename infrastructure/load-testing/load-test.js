import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { sleep, check } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');
const successRate = new Rate('success_rate');
const ttfb = new Trend('ttfb');
const contentSize = new Trend('content_size');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://api.aisportsedge.com';
const THINK_TIME_MIN = 1;
const THINK_TIME_MAX = 5;

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test - low load to verify system works
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { test_type: 'smoke' },
      env: { SCENARIO: 'smoke' },
    },
    // Load test - normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
        { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
        { duration: '2m', target: 0 }, // Ramp down to 0 users over 2 minutes
      ],
      tags: { test_type: 'load' },
      env: { SCENARIO: 'load' },
    },
    // Stress test - find the breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
        { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
        { duration: '5m', target: 500 }, // Ramp up to 500 users over 5 minutes
        { duration: '5m', target: 500 }, // Stay at 500 users for 5 minutes
        { duration: '5m', target: 1000 }, // Ramp up to 1000 users over 5 minutes
        { duration: '5m', target: 1000 }, // Stay at 1000 users for 5 minutes
        { duration: '5m', target: 0 }, // Ramp down to 0 users over 5 minutes
      ],
      tags: { test_type: 'stress' },
      env: { SCENARIO: 'stress' },
    },
    // Soak test - long duration to find memory leaks or other issues
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 }, // Ramp up to 100 users over 5 minutes
        { duration: '1h', target: 100 }, // Stay at 100 users for 1 hour
        { duration: '5m', target: 0 }, // Ramp down to 0 users over 5 minutes
      ],
      tags: { test_type: 'soak' },
      env: { SCENARIO: 'soak' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests must complete below 500ms, 99% below 1s
    http_req_failed: ['rate<0.01'], // Less than 1% of requests can fail
    successful_logins: ['count>0'], // At least some successful logins
    success_rate: ['rate>0.95'], // Success rate should be above 95%
  },
};

// Setup function - runs once per VU
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);

  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Health check failed: ${healthCheck.status} ${healthCheck.body}`);
  }

  return {
    // Test data that will be used by VUs
    users: [
      { username: 'testuser1@example.com', password: 'Password1!' },
      { username: 'testuser2@example.com', password: 'Password2!' },
      { username: 'testuser3@example.com', password: 'Password3!' },
      { username: 'testuser4@example.com', password: 'Password4!' },
      { username: 'testuser5@example.com', password: 'Password5!' },
    ],
    sports: ['NBA', 'NFL', 'MLB', 'NHL', 'UFC', 'SOCCER'],
  };
}

// Default function - main user journey
export default function (data) {
  // Select a random user from test data
  const userIndex = randomIntBetween(0, data.users.length - 1);
  const user = data.users[userIndex];

  // Select a random sport
  const sportIndex = randomIntBetween(0, data.sports.length - 1);
  const sport = data.sports[sportIndex];

  // User journey: Homepage -> Login -> Browse Sports -> View Odds -> Logout

  // Step 1: Visit homepage
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'homepage status is 200': r => r.status === 200,
    'homepage has correct title': r => r.body.includes('AI Sports Edge'),
  });
  ttfb.add(response.timings.waiting);
  contentSize.add(response.body.length);

  // Think time - simulate user reading the page
  sleep(randomIntBetween(THINK_TIME_MIN, THINK_TIME_MAX));

  // Step 2: Login
  response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: user.username,
      password: user.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginSuccess = check(response, {
    'login status is 200': r => r.status === 200,
    'login response has token': r => r.json('token') !== undefined,
  });

  if (loginSuccess) {
    successfulLogins.add(1);
    successRate.add(1);
  } else {
    failedLogins.add(1);
    successRate.add(0);
    console.log(`Login failed: ${response.status} ${response.body}`);
    return; // End the user journey if login fails
  }

  // Extract auth token for subsequent requests
  const authToken = response.json('token');
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  // Think time - simulate user navigating after login
  sleep(randomIntBetween(THINK_TIME_MIN, THINK_TIME_MAX));

  // Step 3: Browse sports
  response = http.get(`${BASE_URL}/api/sports`, {
    headers: authHeaders,
  });
  check(response, {
    'sports status is 200': r => r.status === 200,
    'sports response has data': r => r.json('data') !== undefined,
  });

  // Think time - simulate user selecting a sport
  sleep(randomIntBetween(THINK_TIME_MIN, THINK_TIME_MAX));

  // Step 4: View odds for selected sport
  response = http.get(`${BASE_URL}/api/odds/${sport}`, {
    headers: authHeaders,
  });
  check(response, {
    'odds status is 200': r => r.status === 200,
    'odds response has data': r => r.json('data') !== undefined,
  });

  // Think time - simulate user viewing odds
  sleep(randomIntBetween(THINK_TIME_MIN, THINK_TIME_MAX));

  // Step 5: View predictions for a game
  // First, get a list of games
  response = http.get(`${BASE_URL}/api/games/${sport}`, {
    headers: authHeaders,
  });

  let gameId = null;
  if (response.status === 200 && response.json('data') && response.json('data').length > 0) {
    // Select a random game
    const games = response.json('data');
    const gameIndex = randomIntBetween(0, games.length - 1);
    gameId = games[gameIndex].id;

    // Get predictions for the selected game
    response = http.get(`${BASE_URL}/api/predictions/game/${gameId}`, {
      headers: authHeaders,
    });
    check(response, {
      'predictions status is 200': r => r.status === 200,
      'predictions response has data': r => r.json('data') !== undefined,
    });

    // Think time - simulate user analyzing predictions
    sleep(randomIntBetween(THINK_TIME_MIN, THINK_TIME_MAX));
  }

  // Step 6: Logout
  response = http.post(
    `${BASE_URL}/api/auth/logout`,
    {},
    {
      headers: authHeaders,
    }
  );
  check(response, {
    'logout status is 200': r => r.status === 200,
  });
}

// Teardown function - runs once at the end of the test
export function teardown(data) {
  console.log('Load test completed');
}

// Handle end of test - generate HTML report
export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
    'summary.json': JSON.stringify(data),
  };
}
