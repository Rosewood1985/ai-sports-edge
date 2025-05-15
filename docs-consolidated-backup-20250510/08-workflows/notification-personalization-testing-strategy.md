# Notification Personalization Testing Strategy

This document outlines the testing strategy for the personalized notification system in AI Sports Edge. A comprehensive testing approach is essential to ensure that notifications are delivered correctly, personalized appropriately, and respect user preferences.

## Testing Objectives

1. Verify that notifications are personalized based on user preferences
2. Ensure that notification delivery respects user settings (quiet hours, frequency, etc.)
3. Validate that notification content is correctly formatted and includes relevant information
4. Confirm that notification analytics are properly tracked
5. Test the integration with RSS feeds for notification triggers
6. Verify that the system handles edge cases and error conditions gracefully

## Testing Approach

### 1. Unit Testing

Unit tests will focus on testing individual components of the notification system in isolation:

#### 1.1 Notification Templates

```javascript
describe('Notification Templates', () => {
  test('should format template with variables', () => {
    const template = 'Hello, {name}!';
    const variables = { name: 'John' };
    const result = formatTemplate(template, variables);
    expect(result).toBe('Hello, John!');
  });
  
  test('should handle missing variables', () => {
    const template = 'Hello, {name}!';
    const variables = {};
    const result = formatTemplate(template, variables);
    expect(result).toBe('Hello, {name}!');
  });
  
  test('should get notification template by type', () => {
    const result = getNotificationTemplate('prediction', 'default', {
      homeTeam: 'Lakers',
      awayTeam: 'Celtics'
    });
    
    expect(result).toEqual({
      title: 'New Prediction Available',
      message: 'Check out our prediction for Lakers vs Celtics'
    });
  });
  
  test('should get notification template with variant', () => {
    const result = getNotificationTemplate('prediction', 'withFavorite', {
      homeTeam: 'Lakers',
      awayTeam: 'Celtics',
      favoriteTeam: 'Lakers'
    });
    
    expect(result).toEqual({
      title: 'Lakers Prediction Available',
      message: 'Check out our prediction for Lakers vs Celtics'
    });
  });
});
```

#### 1.2 Personalization Functions

```javascript
describe('Personalization Functions', () => {
  test('should check if time is in quiet hours', () => {
    const quietHours = {
      enabled: true,
      start: '22:00',
      end: '08:00'
    };
    
    // Mock current time to 23:00
    jest.spyOn(global.Date.prototype, 'getHours').mockReturnValue(23);
    jest.spyOn(global.Date.prototype, 'getMinutes').mockReturnValue(0);
    
    const result = isInQuietHours(quietHours);
    expect(result).toBe(true);
  });
  
  test('should check if time is not in quiet hours', () => {
    const quietHours = {
      enabled: true,
      start: '22:00',
      end: '08:00'
    };
    
    // Mock current time to 12:00
    jest.spyOn(global.Date.prototype, 'getHours').mockReturnValue(12);
    jest.spyOn(global.Date.prototype, 'getMinutes').mockReturnValue(0);
    
    const result = isInQuietHours(quietHours);
    expect(result).toBe(false);
  });
  
  test('should calculate priority score', () => {
    const notification = {
      data: {
        type: 'prediction',
        teams: ['Lakers', 'Celtics']
      }
    };
    
    const userData = {
      favorites: {
        teams: ['Lakers'],
        players: []
      },
      analytics: {
        engagementRates: {
          prediction: 0.8
        }
      }
    };
    
    const result = calculatePriorityScore(notification, userData);
    expect(result).toBeGreaterThan(0);
  });
  
  test('should format odds based on user preference', () => {
    // American format
    expect(formatOdds(150, 'american')).toBe('+150');
    expect(formatOdds(-200, 'american')).toBe('-200');
    
    // Decimal format
    expect(formatOdds(150, 'decimal')).toBe('2.50');
    expect(formatOdds(-200, 'decimal')).toBe('1.50');
    
    // Fractional format
    expect(formatOdds(150, 'fractional')).toBe('3/2');
    expect(formatOdds(-200, 'fractional')).toBe('1/2');
  });
});
```

#### 1.3 RSS Feed Processing

```javascript
describe('RSS Feed Processing', () => {
  test('should extract teams from RSS item', () => {
    const item = {
      title: 'Lakers defeat Celtics in overtime thriller',
      description: 'LeBron James scored 35 points to lead the Lakers to victory'
    };
    
    const teams = extractTeams(item);
    expect(teams).toContain('Lakers');
    expect(teams).toContain('Celtics');
  });
  
  test('should extract players from RSS item', () => {
    const item = {
      title: 'Lakers defeat Celtics in overtime thriller',
      description: 'LeBron James scored 35 points to lead the Lakers to victory'
    };
    
    const players = extractPlayers(item);
    expect(players).toContain('LeBron James');
  });
  
  test('should extract betting opportunities from RSS item', () => {
    const item = {
      title: 'Lakers favored by 5.5 points against Celtics',
      description: 'The odds for tonight\'s game have the Lakers as the favorite'
    };
    
    const opportunities = extractBettingOpportunities(item);
    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities[0].team).toBe('Lakers');
  });
  
  test('should calculate relevance score', () => {
    const item = {
      title: 'Lakers defeat Celtics in overtime thriller',
      description: 'LeBron James scored 35 points to lead the Lakers to victory',
      source: 'ESPN'
    };
    
    const metadata = {
      teams: ['Lakers', 'Celtics'],
      players: ['LeBron James'],
      bettingOpportunities: [],
      injuries: [],
      gameInfo: {
        homeTeam: 'Lakers',
        awayTeam: 'Celtics'
      }
    };
    
    const score = calculateRelevanceScore(item, metadata);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
```

### 2. Integration Testing

Integration tests will verify that the different components of the notification system work together correctly:

#### 2.1 Notification Service Integration

```javascript
describe('Notification Service Integration', () => {
  beforeEach(() => {
    // Mock Firebase Firestore
    jest.mock('firebase-admin', () => ({
      firestore: () => ({
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            preferences: {
              notifications: {
                predictions: true,
                quietHours: {
                  enabled: false
                }
              },
              betting: {
                oddsFormat: 'american'
              }
            },
            favorites: {
              teams: ['Lakers'],
              players: ['LeBron James']
            }
          })
        }),
        add: jest.fn().mockResolvedValue({}),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis()
      })
    }));
    
    // Mock OneSignal notification service
    jest.mock('./notificationService', () => ({
      sendToUsers: jest.fn().mockResolvedValue({})
    }));
  });
  
  test('should send personalized notification', async () => {
    const personalizedNotificationService = require('./personalizedNotificationService');
    const notificationService = require('./notificationService');
    
    await personalizedNotificationService.sendPersonalizedNotification({
      userId: 'user123',
      type: 'prediction',
      data: {
        homeTeam: 'Lakers',
        awayTeam: 'Celtics',
        teams: ['Lakers', 'Celtics']
      }
    });
    
    expect(notificationService.sendToUsers).toHaveBeenCalled();
    
    // Verify that the notification was personalized
    const call = notificationService.sendToUsers.mock.calls[0][0];
    expect(call.title).toContain('Lakers');
  });
  
  test('should respect quiet hours', async () => {
    const personalizedNotificationService = require('./personalizedNotificationService');
    const notificationService = require('./notificationService');
    
    // Mock user with quiet hours enabled
    const admin = require('firebase-admin');
    admin.firestore().collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        preferences: {
          notifications: {
            predictions: true,
            quietHours: {
              enabled: true,
              start: '22:00',
              end: '08:00'
            }
          }
        },
        favorites: {
          teams: [],
          players: []
        }
      })
    });
    
    // Mock current time to 23:00
    jest.spyOn(global.Date.prototype, 'getHours').mockReturnValue(23);
    jest.spyOn(global.Date.prototype, 'getMinutes').mockReturnValue(0);
    
    await personalizedNotificationService.sendPersonalizedNotification({
      userId: 'user123',
      type: 'prediction',
      data: {
        homeTeam: 'Lakers',
        awayTeam: 'Celtics'
      }
    });
    
    // Notification should not be sent during quiet hours
    expect(notificationService.sendToUsers).not.toHaveBeenCalled();
  });
});
```

#### 2.2 RSS Feed Notification Integration

```javascript
describe('RSS Feed Notification Integration', () => {
  beforeEach(() => {
    // Mock Firebase Firestore
    jest.mock('firebase-admin', () => ({
      firestore: () => ({
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: 'user123',
              data: () => ({
                preferences: {
                  notifications: {
                    rssAlerts: {
                      enabled: true,
                      favoriteTeamsOnly: false,
                      favoritePlayersOnly: false,
                      keywordAlerts: []
                    }
                  }
                },
                favorites: {
                  teams: ['Lakers'],
                  players: []
                }
              })
            }
          ],
          exists: true,
          data: () => ({
            timestamp: {
              toDate: () => new Date(Date.now() - 3600000) // 1 hour ago
            }
          })
        }),
        add: jest.fn().mockResolvedValue({}),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        set: jest.fn().mockResolvedValue({})
      }),
      Timestamp: {
        now: () => ({ toDate: () => new Date() })
      }
    }));
    
    // Mock personalized notification service
    jest.mock('./personalizedNotificationService', () => ({
      sendPersonalizedNotification: jest.fn().mockResolvedValue({})
    }));
  });
  
  test('should process RSS feeds and send notifications', async () => {
    const { processRssFeedsAndNotify } = require('./notifications');
    const personalizedNotificationService = require('./personalizedNotificationService');
    
    // Mock RSS feed items
    const admin = require('firebase-admin');
    admin.firestore().collection().where().orderBy().get.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'item1',
          data: () => ({
            title: 'Lakers defeat Celtics in overtime thriller',
            description: 'LeBron James scored 35 points to lead the Lakers to victory',
            pubDate: new Date(),
            source: 'ESPN',
            sport: 'NBA'
          })
        }
      ]
    });
    
    await processRssFeedsAndNotify();
    
    // Verify that notifications were sent
    expect(personalizedNotificationService.sendPersonalizedNotification).toHaveBeenCalled();
    
    // Verify that the last run timestamp was updated
    expect(admin.firestore().collection().doc().set).toHaveBeenCalled();
  });
});
```

### 3. End-to-End Testing

End-to-end tests will verify the complete notification flow from trigger to delivery:

#### 3.1 Notification Delivery Testing

```javascript
describe('Notification Delivery E2E', () => {
  beforeAll(async () => {
    // Set up test environment
    await setupTestEnvironment();
    
    // Create test users with different preferences
    await createTestUsers();
    
    // Set up OneSignal mock
    setupOneSignalMock();
  });
  
  afterAll(async () => {
    // Clean up test environment
    await cleanupTestEnvironment();
  });
  
  test('should deliver personalized notifications for new prediction', async () => {
    // Create a new prediction
    const predictionId = await createTestPrediction({
      homeTeam: 'Lakers',
      awayTeam: 'Celtics',
      sport: 'NBA'
    });
    
    // Wait for cloud function to process
    await waitForCloudFunction();
    
    // Verify that notifications were sent to OneSignal
    const oneSignalCalls = getOneSignalCalls();
    
    // Should have sent notifications to users interested in NBA
    expect(oneSignalCalls.length).toBeGreaterThan(0);
    
    // Verify personalization for user with Lakers as favorite team
    const lakersUserNotification = oneSignalCalls.find(call => 
      call.include_external_user_ids.includes('lakers_fan_user_id')
    );
    
    expect(lakersUserNotification).toBeDefined();
    expect(lakersUserNotification.headings.en).toContain('Lakers');
  });
  
  test('should respect quiet hours for notifications', async () => {
    // Create a user with quiet hours enabled
    const userId = await createTestUser({
      preferences: {
        notifications: {
          predictions: true,
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          }
        },
        sports: {
          NBA: true
        }
      }
    });
    
    // Mock current time to 23:00
    mockCurrentTime('23:00');
    
    // Create a new prediction
    const predictionId = await createTestPrediction({
      homeTeam: 'Lakers',
      awayTeam: 'Celtics',
      sport: 'NBA'
    });
    
    // Wait for cloud function to process
    await waitForCloudFunction();
    
    // Verify that no notification was sent to the user with quiet hours
    const oneSignalCalls = getOneSignalCalls();
    const userNotification = oneSignalCalls.find(call => 
      call.include_external_user_ids.includes(userId)
    );
    
    expect(userNotification).toBeUndefined();
  });
});
```

#### 3.2 RSS Feed Notification Testing

```javascript
describe('RSS Feed Notification E2E', () => {
  beforeAll(async () => {
    // Set up test environment
    await setupTestEnvironment();
    
    // Create test users with different preferences
    await createTestUsers();
    
    // Set up RSS feed mock
    setupRssFeedMock();
    
    // Set up OneSignal mock
    setupOneSignalMock();
  });
  
  afterAll(async () => {
    // Clean up test environment
    await cleanupTestEnvironment();
  });
  
  test('should send notifications for relevant RSS feed items', async () => {
    // Add a new RSS feed item
    const itemId = await addTestRssItem({
      title: 'Lakers defeat Celtics in overtime thriller',
      description: 'LeBron James scored 35 points to lead the Lakers to victory',
      pubDate: new Date(),
      source: 'ESPN',
      sport: 'NBA'
    });
    
    // Trigger the RSS feed notification function
    await triggerRssFeedNotificationFunction();
    
    // Wait for cloud function to process
    await waitForCloudFunction();
    
    // Verify that notifications were sent to OneSignal
    const oneSignalCalls = getOneSignalCalls();
    
    // Should have sent notifications to users interested in NBA
    expect(oneSignalCalls.length).toBeGreaterThan(0);
    
    // Verify personalization for user with Lakers as favorite team
    const lakersUserNotification = oneSignalCalls.find(call => 
      call.include_external_user_ids.includes('lakers_fan_user_id')
    );
    
    expect(lakersUserNotification).toBeDefined();
    expect(lakersUserNotification.headings.en).toContain('Lakers');
  });
  
  test('should respect user preferences for RSS notifications', async () => {
    // Create a user who only wants notifications for favorite teams
    const userId = await createTestUser({
      preferences: {
        notifications: {
          rssAlerts: {
            enabled: true,
            favoriteTeamsOnly: true,
            favoritePlayersOnly: false,
            keywordAlerts: []
          }
        },
        sports: {
          NBA: true
        }
      },
      favorites: {
        teams: ['Warriors'],
        players: []
      }
    });
    
    // Add a new RSS feed item about a team that is not the user's favorite
    const itemId = await addTestRssItem({
      title: 'Lakers defeat Celtics in overtime thriller',
      description: 'LeBron James scored 35 points to lead the Lakers to victory',
      pubDate: new Date(),
      source: 'ESPN',
      sport: 'NBA'
    });
    
    // Trigger the RSS feed notification function
    await triggerRssFeedNotificationFunction();
    
    // Wait for cloud function to process
    await waitForCloudFunction();
    
    // Verify that no notification was sent to the user
    const oneSignalCalls = getOneSignalCalls();
    const userNotification = oneSignalCalls.find(call => 
      call.include_external_user_ids.includes(userId)
    );
    
    expect(userNotification).toBeUndefined();
  });
});
```

### 4. Performance Testing

Performance tests will ensure that the notification system can handle the expected load:

#### 4.1 Load Testing

```javascript
describe('Notification System Load Testing', () => {
  beforeAll(async () => {
    // Set up test environment
    await setupTestEnvironment();
    
    // Create a large number of test users
    await createBulkTestUsers(1000);
    
    // Set up OneSignal mock
    setupOneSignalMock();
  });
  
  afterAll(async () => {
    // Clean up test environment
    await cleanupTestEnvironment();
  });
  
  test('should handle sending notifications to many users', async () => {
    // Create a new prediction
    const predictionId = await createTestPrediction({
      homeTeam: 'Lakers',
      awayTeam: 'Celtics',
      sport: 'NBA'
    });
    
    // Measure execution time
    const startTime = Date.now();
    
    // Wait for cloud function to process
    await waitForCloudFunction();
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Verify that notifications were sent to OneSignal
    const oneSignalCalls = getOneSignalCalls();
    
    // Should have sent notifications to users interested in NBA
    expect(oneSignalCalls.length).toBeGreaterThan(0);
    
    // Execution time should be reasonable
    expect(executionTime).toBeLessThan(30000); // 30 seconds
  });
  
  test('should handle processing many RSS feed items', async () => {
    // Add many RSS feed items
    await addBulkTestRssItems(100);
    
    // Measure execution time
    const startTime = Date.now();
    
    // Trigger the RSS feed notification function
    await triggerRssFeedNotificationFunction();
    
    // Wait for cloud function to process
    await waitForCloudFunction();
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Execution time should be reasonable
    expect(executionTime).toBeLessThan(60000); // 60 seconds
  });
});
```

### 5. User Acceptance Testing

User acceptance tests will verify that the notification system meets user expectations:

#### 5.1 User Scenarios

1. **New User Scenario**
   - A new user signs up for the app
   - They set up their favorite teams and players
   - They receive personalized notifications about their favorites

2. **Power User Scenario**
   - A power user with many favorites
   - They customize their notification preferences
   - They receive notifications according to their preferences

3. **Quiet Hours Scenario**
   - A user sets up quiet hours
   - They should not receive notifications during quiet hours
   - They should receive notifications outside of quiet hours

4. **RSS Feed Scenario**
   - A user enables RSS feed notifications
   - They set up keyword alerts
   - They receive notifications for RSS feed items matching their keywords

5. **Betting Opportunity Scenario**
   - A user interested in betting
   - They receive notifications about betting opportunities
   - They can click through to place bets

## Test Data

### Test Users

```javascript
const testUsers = [
  {
    id: 'user1',
    preferences: {
      notifications: {
        predictions: true,
        valueBets: true,
        gameReminders: true,
        modelPerformance: true,
        frequency: 'normal',
        quietHours: {
          enabled: false
        },
        rssAlerts: {
          enabled: true,
          favoriteTeamsOnly: false,
          favoritePlayersOnly: false,
          keywordAlerts: ['injury', 'trade']
        }
      },
      sports: {
        NBA: true,
        NFL: true,
        MLB: false
      }
    },
    favorites: {
      teams: ['Lakers', 'Cowboys'],
      players: ['LeBron James', 'Dak Prescott']
    }
  },
  {
    id: 'user2',
    preferences: {
      notifications: {
        predictions: true,
        valueBets: false,
        gameReminders: true,
        modelPerformance: false,
        frequency: 'low',
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        rssAlerts: {
          enabled: true,
          favoriteTeamsOnly: true,
          favoritePlayersOnly: false,
          keywordAlerts: []
        }
      },
      sports: {
        NBA: true,
        NFL: false,
        MLB: true
      }
    },
    favorites: {
      teams: ['Celtics', 'Yankees'],
      players: ['Jayson Tatum', 'Aaron Judge']
    }
  }
];
```

### Test RSS Feed Items

```javascript
const testRssItems = [
  {
    id: 'item1',
    title: 'Lakers defeat Celtics in overtime thriller',
    description: 'LeBron James scored 35 points to lead the Lakers to victory',
    link: 'https://example.com/news/lakers-celtics',
    pubDate: new Date(),
    source: 'ESPN',
    sport: 'NBA'
  },
  {
    id: 'item2',
    title: 'Cowboys injury report: Dak Prescott questionable for Sunday',
    description: 'Cowboys quarterback Dak Prescott is listed as questionable with an ankle injury',
    link: 'https://example.com/news/cowboys-injury-report',
    pubDate: new Date(),
    source: 'NFL.com',
    sport: 'NFL'
  },
  {
    id: 'item3',
    title: 'Yankees trade rumors: Team looking to add starting pitcher',
    description: 'The Yankees are reportedly in talks to acquire a starting pitcher before the trade deadline',
    link: 'https://example.com/news/yankees-trade-rumors',
    pubDate: new Date(),
    source: 'MLB.com',
    sport: 'MLB'
  }
];
```

## Test Environment Setup

```javascript
/**
 * Set up test environment
 */
async function setupTestEnvironment() {
  // Initialize Firebase emulator
  await firebase.initializeEmulator();
  
  // Initialize OneSignal mock
  initializeOneSignalMock();
  
  // Clear test data
  await clearTestData();
}

/**
 * Clean up test environment
 */
async function cleanupTestEnvironment() {
  // Clear test data
  await clearTestData();
  
  // Shut down Firebase emulator
  await firebase.shutdownEmulator();
}

/**
 * Create test users
 */
async function createTestUsers() {
  for (const user of testUsers) {
    await firebase.firestore().collection('users').doc(user.id).set(user);
  }
}

/**
 * Create bulk test users
 * @param {number} count - Number of users to create
 */
async function createBulkTestUsers(count) {
  const batch = firebase.firestore().batch();
  
  for (let i = 0; i < count; i++) {
    const userId = `test_user_${i}`;
    const userRef = firebase.firestore().collection('users').doc(userId);
    
    // Randomly assign preferences
    const user = {
      preferences: {
        notifications: {
          predictions: Math.random() > 0.2,
          valueBets: Math.random() > 0.5,
          gameReminders: Math.random() > 0.3,
          modelPerformance: Math.random() > 0.6,
          frequency: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)],
          quietHours: {
            enabled: Math.random() > 0.7
          },
          rssAlerts: {
            enabled: Math.random() > 0.4,
            favoriteTeamsOnly: Math.random() > 0.5,
            favoritePlayersOnly: Math.random() > 0.7,
            keywordAlerts: []
          }
        },
        sports: {
          NBA: Math.random() > 0.3,
          NFL: Math.random() > 0.3,
          MLB: Math.random() > 0.3
        }
      },
      favorites: {
        teams: [],
        players: []
      }
    };
    
    // Randomly assign favorite teams
    const allTeams = ['Lakers', 'Celtics', 'Warriors', 'Cowboys', 'Eagles', 'Yankees', 'Red Sox'];
    const teamCount = Math.floor(Math.random() * 3);
    for (let j = 0; j < teamCount; j++) {
      const randomTeam = allTeams[Math.floor(Math.random() * allTeams.length)];
      if (!user.favorites.teams.includes(randomTeam)) {
        user.favorites.teams.push(randomTeam);
      }
    }
    
    batch.set(userRef, user);
    
    // Commit batch every 500 users
    if (i % 500 === 499) {
      await batch.commit();
      batch = firebase.firestore().batch();
    }
  }
  
  // Commit any remaining users
  await batch.commit();
}
```

## Test Execution Plan

1. **Development Testing**
   - Run unit tests during development
   - Run integration tests for completed components
   - Fix issues as they are discovered

2. **Pre-Release Testing**
   - Run end-to-end tests
   - Run performance tests
   - Conduct user acceptance testing
   - Fix any issues discovered

3. **Production Testing**
   - Monitor notification delivery in production
   - Track notification engagement metrics
   - Gather user feedback
   - Make improvements based on feedback and metrics

## Conclusion

This testing strategy provides a comprehensive approach to ensuring that the personalized notification system works correctly and meets user expectations. By testing at multiple levels (unit, integration, end-to-end, performance, and user acceptance), we can identify and fix issues early in the development process and ensure a high-quality user experience.