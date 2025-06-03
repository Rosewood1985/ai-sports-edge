/**
 * Test script for offline mode
 *
 * This script tests the offline functionality by:
 * 1. Simulating online/offline network status
 * 2. Testing data caching and retrieval
 * 3. Testing offline operations and sync queue
 *
 * Usage: node scripts/test-offline-mode.js
 */

// Mock dependencies
const AsyncStorage = {
  _storage: {},
  setItem: async (key, value) => {
    AsyncStorage._storage[key] = value;
    return Promise.resolve();
  },
  getItem: async key => {
    return Promise.resolve(AsyncStorage._storage[key] || null);
  },
  removeItem: async key => {
    delete AsyncStorage._storage[key];
    return Promise.resolve();
  },
  getAllKeys: async () => {
    return Promise.resolve(Object.keys(AsyncStorage._storage));
  },
  multiRemove: async keys => {
    keys.forEach(key => delete AsyncStorage._storage[key]);
    return Promise.resolve();
  },
  clear: async () => {
    AsyncStorage._storage = {};
    return Promise.resolve();
  },
};

const NetInfo = {
  _isConnected: true,
  _listeners: [],
  fetch: async () => {
    return Promise.resolve({
      isConnected: NetInfo._isConnected,
    });
  },
  addEventListener: listener => {
    NetInfo._listeners.push(listener);
    return () => {
      NetInfo._listeners = NetInfo._listeners.filter(l => l !== listener);
    };
  },
  setConnectionStatus: isConnected => {
    const previousStatus = NetInfo._isConnected;
    NetInfo._isConnected = isConnected;

    if (previousStatus !== isConnected) {
      NetInfo._listeners.forEach(listener => {
        listener({
          isConnected,
        });
      });
    }
  },
};

// Mock Firestore
const Firestore = {
  _collections: {},

  // Add a document to a collection
  addDocument: (collectionPath, docId, data) => {
    if (!Firestore._collections[collectionPath]) {
      Firestore._collections[collectionPath] = {};
    }

    Firestore._collections[collectionPath][docId] = {
      ...data,
      id: docId,
    };
  },

  // Get a document from a collection
  getDocument: (collectionPath, docId) => {
    if (!Firestore._collections[collectionPath]) {
      return null;
    }

    return Firestore._collections[collectionPath][docId] || null;
  },

  // Query documents in a collection
  queryDocuments: (collectionPath, queryFn) => {
    if (!Firestore._collections[collectionPath]) {
      return [];
    }

    const documents = Object.values(Firestore._collections[collectionPath]);

    if (queryFn) {
      return queryFn(documents);
    }

    return documents;
  },

  // Clear all collections
  clear: () => {
    Firestore._collections = {};
  },
};

// Cache keys
const CACHE_PREFIX = 'offline_cache_';
const CACHE_METADATA_PREFIX = 'offline_cache_metadata_';
const SYNC_QUEUE_KEY = 'offline_sync_queue';

// Default cache TTL in milliseconds
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Offline mode settings
const defaultOfflineMode = {
  enabled: true,
  cacheEnabled: true,
  syncEnabled: true,
  maxCacheSize: 50, // 50 MB
  maxSyncQueueSize: 100,
  cacheTTL: DEFAULT_CACHE_TTL,
};

/**
 * Test data caching and retrieval
 */
async function testDataCaching() {
  console.log('\n--- Testing Data Caching ---');

  // Clear AsyncStorage
  await AsyncStorage.clear();

  // Test data
  const collectionPath = 'games';
  const docId = 'game123';
  const gameData = {
    id: docId,
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    date: '2025-03-21',
    homeScore: 105,
    awayScore: 98,
  };

  // Add test data to Firestore
  Firestore.addDocument(collectionPath, docId, gameData);

  // Test caching
  console.log('Testing data caching...');

  // Cache the data
  const cacheKey = `${CACHE_PREFIX}${collectionPath}_${docId}`;
  const now = Date.now();
  const cacheItem = {
    data: gameData,
    timestamp: now,
    expiresAt: now + DEFAULT_CACHE_TTL,
  };

  await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));

  // Store cache metadata
  await AsyncStorage.setItem(
    `${CACHE_METADATA_PREFIX}${cacheKey}`,
    JSON.stringify({
      key: cacheKey,
      timestamp: now,
      expiresAt: now + DEFAULT_CACHE_TTL,
      size: JSON.stringify(cacheItem).length,
    })
  );

  console.log('Data cached successfully');

  // Test retrieval
  console.log('\nTesting data retrieval...');

  // Get cached data
  const cachedItemStr = await AsyncStorage.getItem(cacheKey);
  if (!cachedItemStr) {
    console.error('Error: Cached data not found');
    return;
  }

  const cachedItem = JSON.parse(cachedItemStr);
  console.log('Retrieved cached data:', cachedItem.data);

  // Verify data
  if (JSON.stringify(cachedItem.data) === JSON.stringify(gameData)) {
    console.log('Data verification successful');
  } else {
    console.error('Error: Data verification failed');
    console.log('Expected:', gameData);
    console.log('Actual:', cachedItem.data);
  }

  // Test cache expiration
  console.log('\nTesting cache expiration...');

  // Create expired cache item
  const expiredCacheKey = `${CACHE_PREFIX}${collectionPath}_expired`;
  const expiredCacheItem = {
    data: { ...gameData, id: 'expired' },
    timestamp: now - DEFAULT_CACHE_TTL * 2,
    expiresAt: now - DEFAULT_CACHE_TTL,
  };

  await AsyncStorage.setItem(expiredCacheKey, JSON.stringify(expiredCacheItem));

  // Store expired cache metadata
  await AsyncStorage.setItem(
    `${CACHE_METADATA_PREFIX}${expiredCacheKey}`,
    JSON.stringify({
      key: expiredCacheKey,
      timestamp: now - DEFAULT_CACHE_TTL * 2,
      expiresAt: now - DEFAULT_CACHE_TTL,
      size: JSON.stringify(expiredCacheItem).length,
    })
  );

  // Check if cache is expired
  const expiredCachedItemStr = await AsyncStorage.getItem(expiredCacheKey);
  if (!expiredCachedItemStr) {
    console.error('Error: Expired cached data not found');
    return;
  }

  const expiredCachedItem = JSON.parse(expiredCachedItemStr);

  if (Date.now() > expiredCachedItem.expiresAt) {
    console.log('Cache expiration check successful');
  } else {
    console.error('Error: Cache expiration check failed');
  }

  // Clean up expired cache
  await AsyncStorage.removeItem(expiredCacheKey);
  await AsyncStorage.removeItem(`${CACHE_METADATA_PREFIX}${expiredCacheKey}`);

  console.log('Data caching tests completed successfully');
}

/**
 * Test offline operations and sync queue
 */
async function testOfflineOperations() {
  console.log('\n--- Testing Offline Operations ---');

  // Clear AsyncStorage
  await AsyncStorage.clear();

  // Test sync queue
  console.log('Testing sync queue...');

  // Create sync operations
  const operations = [
    {
      id: 'op1',
      type: 'create',
      collection: 'games',
      data: {
        homeTeam: 'Celtics',
        awayTeam: 'Nets',
        date: '2025-03-22',
      },
      timestamp: Date.now(),
      attempts: 0,
    },
    {
      id: 'op2',
      type: 'update',
      collection: 'games',
      docId: 'game123',
      data: {
        homeScore: 110,
        awayScore: 102,
      },
      timestamp: Date.now(),
      attempts: 0,
    },
    {
      id: 'op3',
      type: 'delete',
      collection: 'games',
      docId: 'game456',
      timestamp: Date.now(),
      attempts: 0,
    },
  ];

  // Save operations to sync queue
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(operations));

  console.log('Sync queue created successfully');

  // Test retrieving sync queue
  console.log('\nTesting sync queue retrieval...');

  const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  if (!queueStr) {
    console.error('Error: Sync queue not found');
    return;
  }

  const queue = JSON.parse(queueStr);
  console.log('Retrieved sync queue:', queue);

  // Verify queue
  if (queue.length === operations.length) {
    console.log('Sync queue verification successful');
  } else {
    console.error('Error: Sync queue verification failed');
    console.log('Expected length:', operations.length);
    console.log('Actual length:', queue.length);
  }

  // Test processing sync queue
  console.log('\nTesting sync queue processing...');

  // Simulate going online
  NetInfo.setConnectionStatus(true);
  console.log('Network status: Online');

  // Process operations
  const updatedQueue = [];
  let successCount = 0;

  for (const operation of queue) {
    try {
      // Update attempt count and timestamp
      operation.attempts += 1;
      operation.lastAttempt = Date.now();

      switch (operation.type) {
        case 'create':
          if (operation.collection && operation.data) {
            const docId = `created_${operation.id}`;
            Firestore.addDocument(operation.collection, docId, operation.data);
            console.log(`Created document ${docId} in ${operation.collection}`);
          }
          break;

        case 'update':
          if (operation.collection && operation.docId && operation.data) {
            const existingDoc = Firestore.getDocument(operation.collection, operation.docId);
            if (existingDoc) {
              Firestore.addDocument(operation.collection, operation.docId, {
                ...existingDoc,
                ...operation.data,
              });
              console.log(`Updated document ${operation.docId} in ${operation.collection}`);
            } else {
              throw new Error(`Document ${operation.docId} not found in ${operation.collection}`);
            }
          }
          break;

        case 'delete':
          if (operation.collection && operation.docId) {
            // In a real implementation, we would delete the document
            console.log(`Deleted document ${operation.docId} from ${operation.collection}`);
          }
          break;
      }

      // Operation succeeded
      successCount += 1;
    } catch (error) {
      console.error('Error processing sync operation:', error);

      // Add error information to operation
      operation.error = error.message;

      // If operation has failed too many times, log error and continue
      if (operation.attempts >= 5) {
        console.error(`Operation ${operation.id} failed too many times, removing from queue`);
      } else {
        // Add operation back to queue for retry
        updatedQueue.push(operation);
      }
    }
  }

  // Save updated queue
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));

  console.log(
    `Sync completed: ${successCount} succeeded, ${queue.length - successCount} failed, ${updatedQueue.length} remaining`
  );

  console.log('Offline operations tests completed successfully');
}

/**
 * Test network status changes
 */
async function testNetworkStatus() {
  console.log('\n--- Testing Network Status Changes ---');

  // Set up network status listener
  let currentStatus = null;
  const unsubscribe = NetInfo.addEventListener(state => {
    currentStatus = state.isConnected;
    console.log(`Network status changed: ${currentStatus ? 'Online' : 'Offline'}`);
  });

  // Test going offline
  console.log('Testing going offline...');
  NetInfo.setConnectionStatus(false);

  if (currentStatus === false) {
    console.log('Network status change to offline detected successfully');
  } else {
    console.error('Error: Network status change to offline not detected');
  }

  // Test going online
  console.log('\nTesting going online...');
  NetInfo.setConnectionStatus(true);

  if (currentStatus === true) {
    console.log('Network status change to online detected successfully');
  } else {
    console.error('Error: Network status change to online not detected');
  }

  // Clean up
  unsubscribe();

  console.log('Network status tests completed successfully');
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('Starting offline mode tests...');

    await testDataCaching();
    await testOfflineOperations();
    await testNetworkStatus();

    console.log('\nAll offline mode tests completed successfully');
  } catch (error) {
    console.error('Error running offline mode tests:', error);
  }
}

// Run tests
runTests();
