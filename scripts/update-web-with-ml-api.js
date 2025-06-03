/**
 * Update Web App with ML API Integration
 * This script updates the web app with the new ML API integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  mlApiDir: path.join(__dirname, '..', 'api', 'ml-sports-edge'),
  webDir: path.join(__dirname, '..', 'web'),
  publicDir: path.join(__dirname, '..', 'public'),
  deployCommand: 'npx surge public aisportsedge.app',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Execute a command and log the output
 * @param {string} command - Command to execute
 * @param {string} cwd - Working directory
 * @param {string} label - Label for the command
 */
function executeCommand(command, cwd, label) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${label} ===${colors.reset}\n`);
  console.log(`${colors.dim}$ ${command}${colors.reset}\n`);

  try {
    const output = execSync(command, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    console.log(output);
    console.log(`${colors.green}✓ Command completed successfully${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Command failed with error:${colors.reset}\n`);
    console.error(error.message);
    return false;
  }
}

/**
 * Check if a directory exists
 * @param {string} dir - Directory path
 * @returns {boolean} - True if directory exists
 */
function directoryExists(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Main function to update the web app
 */
async function updateWebApp() {
  console.log(
    `${colors.bright}${colors.magenta}Starting Web App Update with ML API Integration${colors.reset}\n`
  );

  // Step 1: Check if directories exist
  if (!directoryExists(config.mlApiDir)) {
    console.error(`${colors.red}ML API directory not found: ${config.mlApiDir}${colors.reset}`);
    process.exit(1);
  }

  if (!directoryExists(config.webDir)) {
    console.error(`${colors.red}Web directory not found: ${config.webDir}${colors.reset}`);
    process.exit(1);
  }

  if (!directoryExists(config.publicDir)) {
    console.error(`${colors.red}Public directory not found: ${config.publicDir}${colors.reset}`);
    process.exit(1);
  }

  // Step 2: Install ML API dependencies
  console.log(`${colors.yellow}Installing ML API dependencies...${colors.reset}`);
  if (!executeCommand('npm install', config.mlApiDir, 'Installing ML API Dependencies')) {
    console.error(`${colors.red}Failed to install ML API dependencies${colors.reset}`);
    process.exit(1);
  }

  // Step 3: Start ML API server in background
  console.log(`${colors.yellow}Starting ML API server...${colors.reset}`);
  executeCommand('node server.js > ml-api.log 2>&1 &', config.mlApiDir, 'Starting ML API Server');

  // Wait for server to start
  console.log(`${colors.yellow}Waiting for ML API server to start...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 4: Build web app
  console.log(`${colors.yellow}Building web app...${colors.reset}`);
  if (!executeCommand('npm run build', config.webDir, 'Building Web App')) {
    console.error(`${colors.red}Failed to build web app${colors.reset}`);
    process.exit(1);
  }

  // Step 5: Copy ML API client to public directory
  console.log(`${colors.yellow}Copying ML API client to public directory...${colors.reset}`);
  const mlApiClientDir = path.join(config.publicDir, 'ml-api');

  if (!directoryExists(mlApiClientDir)) {
    fs.mkdirSync(mlApiClientDir, { recursive: true });
  }

  // Create a simple client-side script to access the ML API
  const clientScript = `
/**
 * ML Sports Edge API Client
 * Version 1.0.0
 */

(function(window) {
  'use strict';
  
  // API configuration
  const API_CONFIG = {
    BASE_URL: 'http://localhost:3001/api',
    TIMEOUT: 10000, // 10 seconds
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
  };
  
  // In-memory cache
  const cache = {
    predictions: {},
    timestamp: {}
  };
  
  /**
   * Check if cached data is still valid
   * @param {string} key - Cache key
   * @returns {boolean} - True if cache is valid
   */
  const isCacheValid = (key) => {
    if (!cache.timestamp[key]) {
      return false;
    }
    
    const now = Date.now();
    const cacheTime = cache.timestamp[key];
    
    return (now - cacheTime) < API_CONFIG.CACHE_DURATION;
  };
  
  /**
   * ML Sports Edge API Client
   */
  const MLSportsEdgeAPI = {
    /**
     * Get game predictions
     * @param {Object} options - Request options
     * @returns {Promise<Array>} - Game predictions
     */
    getGamePredictions: async (options = {}) => {
      const { sport = 'NBA', date = null, limit = null } = options;
      
      // Create cache key
      const cacheKey = \`game_predictions_\${sport.toLowerCase()}_\${date || 'today'}\`;
      
      // Check cache
      if (isCacheValid(cacheKey)) {
        return cache.predictions[cacheKey];
      }
      
      try {
        // Build query parameters
        let url = \`\${API_CONFIG.BASE_URL}/predictions/games?sport=\${sport}\`;
        if (date) url += \`&date=\${date}\`;
        if (limit) url += \`&limit=\${limit}\`;
        
        // Make API request
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(\`API returned \${response.status}: \${response.statusText}\`);
        }
        
        const data = await response.json();
        
        // Update cache
        cache.predictions[cacheKey] = data.data;
        cache.timestamp[cacheKey] = Date.now();
        
        return data.data;
      } catch (error) {
        console.error('Error fetching game predictions:', error);
        return [];
      }
    },
    
    /**
     * Get trending predictions
     * @returns {Promise<Array>} - Trending predictions
     */
    getTrendingPredictions: async () => {
      // Create cache key
      const cacheKey = 'trending_predictions';
      
      // Check cache
      if (isCacheValid(cacheKey)) {
        return cache.predictions[cacheKey];
      }
      
      try {
        // Make API request
        const response = await fetch(\`\${API_CONFIG.BASE_URL}/predictions/trending\`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(\`API returned \${response.status}: \${response.statusText}\`);
        }
        
        const data = await response.json();
        
        // Update cache
        cache.predictions[cacheKey] = data.data;
        cache.timestamp[cacheKey] = Date.now();
        
        return data.data;
      } catch (error) {
        console.error('Error fetching trending predictions:', error);
        return [];
      }
    },
    
    /**
     * Clear prediction cache
     * @param {string} key - Specific cache key to clear (optional)
     */
    clearCache: (key = null) => {
      if (key) {
        delete cache.predictions[key];
        delete cache.timestamp[key];
      } else {
        cache.predictions = {};
        cache.timestamp = {};
      }
    }
  };
  
  // Expose API to window
  window.MLSportsEdgeAPI = MLSportsEdgeAPI;
})(window);
  `;

  fs.writeFileSync(path.join(mlApiClientDir, 'client.js'), clientScript);
  console.log(`${colors.green}✓ ML API client script created${colors.reset}\n`);

  // Step 6: Deploy web app
  console.log(`${colors.yellow}Deploying web app...${colors.reset}`);
  if (!executeCommand(config.deployCommand, __dirname, 'Deploying Web App')) {
    console.error(`${colors.red}Failed to deploy web app${colors.reset}`);
    process.exit(1);
  }

  console.log(
    `\n${colors.bright}${colors.green}Web App Update Completed Successfully!${colors.reset}\n`
  );
  console.log(`${colors.cyan}ML API is running at: http://localhost:3001${colors.reset}`);
  console.log(`${colors.cyan}Web App is deployed at: https://aisportsedge.app${colors.reset}\n`);
}

// Run the update function
updateWebApp().catch(error => {
  console.error(`${colors.red}Error updating web app:${colors.reset}`, error);
  process.exit(1);
});
