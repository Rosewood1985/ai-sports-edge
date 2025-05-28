#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge Performance Optimization${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-performance-optimization_${TIMESTAMP}.log"

# Function to log messages
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    log "${GREEN}✓ $1 completed successfully${NC}"
  else
    log "${RED}✗ $1 failed${NC}"
    exit 1
  fi
}

# Step 1: Implement Firebase caching
log "\n${YELLOW}Step 1: Implementing Firebase caching...${NC}"

# Create utils directory if it doesn't exist
mkdir -p utils
check_status "Creating utils directory"

# Create firebaseCacheConfig.ts
cat > utils/firebaseCacheConfig.ts << 'EOL'
import firestore from '@react-native-firebase/firestore';

export const initializeFirestoreCache = () => {
  // Enable Firestore persistence (offline caching)
  firestore().settings({
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
    persistence: true,
  });
  
  console.log('Firestore persistence enabled with unlimited cache size');
};

export const clearFirestoreCache = async () => {
  try {
    await firestore().clearPersistence();
    console.log('Firestore cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing Firestore cache:', error);
    return false;
  }
};

export const getDocumentFromCache = async (collection, docId) => {
  try {
    // Try to get from cache first
    const docSnap = await firestore()
      .collection(collection)
      .doc(docId)
      .get({ source: 'cache' });
    
    if (docSnap.exists) {
      console.log(`Document ${docId} retrieved from cache`);
      return { data: docSnap.data(), fromCache: true };
    }
    
    // If not in cache, get from server
    const serverDocSnap = await firestore()
      .collection(collection)
      .doc(docId)
      .get({ source: 'server' });
    
    if (serverDocSnap.exists) {
      console.log(`Document ${docId} retrieved from server`);
      return { data: serverDocSnap.data(), fromCache: false };
    }
    
    return { data: null, fromCache: false };
  } catch (error) {
    console.error(`Error getting document ${docId}:`, error);
    
    // Last resort: try default get() which will use whatever is available
    try {
      const fallbackDocSnap = await firestore()
        .collection(collection)
        .doc(docId)
        .get();
      
      if (fallbackDocSnap.exists) {
        console.log(`Document ${docId} retrieved using fallback`);
        return { 
          data: fallbackDocSnap.data(), 
          fromCache: fallbackDocSnap.metadata.fromCache 
        };
      }
    } catch (fallbackError) {
      console.error(`Fallback error for document ${docId}:`, fallbackError);
    }
    
    return { data: null, fromCache: false };
  }
};
EOL
check_status "Creating utils/firebaseCacheConfig.ts"

# Step 2: Optimize bundle size
log "\n${YELLOW}Step 2: Optimizing bundle size...${NC}"

# Create webpack.prod.optimized.js
cat > webpack.prod.optimized.js << 'EOL'
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

// Load environment variables based on NODE_ENV
const dotenvPath = `.env.${process.env.NODE_ENV || 'production'}`;

module.exports = {
  mode: 'production',
  entry: {
    app: path.resolve(__dirname, 'index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-class-properties',
            ],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash].[ext]',
              outputPath: 'images',
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65,
              },
              optipng: {
                enabled: true,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 75,
              },
            },
          },
        ],
      },
      {
        test: /\.(css|scss)$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash].[ext]',
              outputPath: 'fonts',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'react-native$': 'react-native-web',
    },
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
      }),
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Get the name. E.g. node_modules/packageName/not/this/part.js
            // or node_modules/packageName
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            
            // npm package names are URL-safe, but some servers don't like @ symbols
            return `npm.${packageName.replace('@', '')}`;
          },
        },
      },
    },
    runtimeChunk: 'single',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new Dotenv({
      path: dotenvPath,
      safe: true,
      systemvars: true,
      silent: true,
    }),
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.', globOptions: { ignore: ['**/index.html'] } },
      ],
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-analysis.html',
    }),
  ],
};
EOL
check_status "Creating webpack.prod.optimized.js"

# Update package.json to add new build script
if [ -f "package.json" ]; then
  # Use Node.js script to update package.json
  node update-package-json.js
  check_status "Updating package.json with build:optimized script"
fi

# Step 3: Implement service worker for caching
log "\n${YELLOW}Step 3: Implementing service worker for caching...${NC}"

# Create public directory if it doesn't exist
mkdir -p public
check_status "Creating public directory"

# Create service-worker.js
cat > public/service-worker.js << 'EOL'
const CACHE_NAME = 'ai-sports-edge-cache-v1';
const RUNTIME_CACHE = 'ai-sports-edge-runtime-cache';

// Resources to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/neon-ui.css',
  '/images/ai_logo.webp',
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/v1/sports',
  '/api/v1/leagues',
  '/api/v1/teams',
];

// Install event - precache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service worker pre-caching resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if a request is an API request
const isApiRequest = (url) => {
  return url.pathname.startsWith('/api/');
};

// Helper function to determine if a request is a navigation request
const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
};

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Cache strategy for API requests
  if (isApiRequest(url)) {
    // Network first, then cache for API requests
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response if it's valid
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache strategy for navigation requests
  if (isNavigationRequest(event.request)) {
    // Network first, then cache for navigation requests
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response if it's valid
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, serve the index.html as fallback
              return caches.match('/index.html');
            });
        })
    );
    return;
  }
  
  // Cache strategy for static assets
  if (isStaticAsset(url)) {
    // Cache first, then network for static assets
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(event.request)
            .then(response => {
              // Cache the response if it's valid
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            });
        })
    );
    return;
  }
  
  // Default strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-user-actions') {
    event.waitUntil(syncUserActions());
  }
});

// Function to sync user actions when back online
async function syncUserActions() {
  try {
    // Get all pending actions from IndexedDB
    const db = await openDatabase();
    const pendingActions = await getPendingActions(db);
    
    // Process each pending action
    for (const action of pendingActions) {
      try {
        // Send the action to the server
        const response = await fetch('/api/v1/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action),
        });
        
        if (response.ok) {
          // If successful, mark the action as synced
          await markActionAsSynced(db, action.id);
        }
      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncUserActions:', error);
  }
}

// Helper function to open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ai-sports-edge-db', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      reject(event.target.error);
    };
  });
}

// Helper function to get pending actions from IndexedDB
function getPendingActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    const request = store.getAll();
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      reject(event.target.error);
    };
  });
}

// Helper function to mark an action as synced in IndexedDB
function markActionAsSynced(db, actionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const request = store.delete(actionId);
    
    request.onsuccess = event => {
      resolve();
    };
    
    request.onerror = event => {
      reject(event.target.error);
    };
  });
}
EOL
check_status "Creating public/service-worker.js"

# Create service worker registration script
cat > public/register-service-worker.js << 'EOL'
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
EOL
check_status "Creating public/register-service-worker.js"

# Update index.html to include service worker registration
# Use Node.js script to update index.html
node update-index-html.js
check_status "Updating public/index.html with service worker registration"

# Step 4: Create a summary report
log "\n${YELLOW}Step 4: Creating summary report...${NC}"

cat > "performance-optimization-summary.md" << EOL
# AI Sports Edge Performance Optimization Summary

## Optimization Timestamp
${TIMESTAMP}

## Steps Completed
1. ✓ Implemented Firebase caching
   - Created utils/firebaseCacheConfig.ts
   - Added functions for cache initialization, clearing, and document retrieval

2. ✓ Optimized bundle size
   - Created webpack.prod.optimized.js
   - Added code splitting and tree shaking
   - Added compression plugin
   - Added bundle analyzer

3. ✓ Implemented service worker for caching
   - Created public/service-worker.js
   - Created public/register-service-worker.js
   - Updated index.html to include service worker registration

## Usage

### Firebase Caching
Initialize Firebase caching in your app entry point:
\`\`\`javascript
import { initializeFirestoreCache } from './utils/firebaseCacheConfig';

// Initialize Firestore cache
initializeFirestoreCache();
\`\`\`

Retrieve documents with cache support:
\`\`\`javascript
import { getDocumentFromCache } from './utils/firebaseCacheConfig';

// Get document with cache support
const { data, fromCache } = await getDocumentFromCache('users', 'user123');
\`\`\`

### Optimized Bundle
Build the application with optimized bundle:
\`\`\`bash
npm run build:optimized
\`\`\`

### Service Worker
The service worker will automatically register when the application loads.

## Next Steps
1. Monitor application performance
2. Analyze bundle size with the bundle analyzer report
3. Test offline functionality with the service worker
4. Implement additional performance optimizations as needed
EOL

check_status "Creating summary report"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}Performance Optimization Completed Successfully${NC}"
log "${GREEN}See performance-optimization-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"