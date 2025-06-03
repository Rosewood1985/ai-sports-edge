const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to the Remote Config template file
const remoteConfigPath = path.join(__dirname, 'remoteconfig.template.json');

// Read the Remote Config template
let remoteConfig;
try {
  const remoteConfigData = fs.readFileSync(remoteConfigPath, 'utf8');
  remoteConfig = JSON.parse(remoteConfigData);
} catch (error) {
  console.error('Error reading Remote Config template:', error);
  process.exit(1);
}

// Ensure parameters object exists
if (!remoteConfig.parameters) {
  remoteConfig.parameters = {};
}

// Update parameters while preserving existing ones
remoteConfig.parameters.ml_model_path = {
  defaultValue: {
    value: 'https://ai-sports-edge-com.web.app/models/model.pkl',
  },
  description: 'Path to the ML model file',
  valueType: 'STRING',
};

// Ensure other parameters exist with default values if not already present
if (!remoteConfig.parameters.ai_pick_of_day_enabled) {
  remoteConfig.parameters.ai_pick_of_day_enabled = {
    defaultValue: {
      value: 'true',
    },
    description: 'Whether the AI Pick of the Day feature is enabled',
    valueType: 'STRING',
  };
}

if (!remoteConfig.parameters.min_confidence_threshold) {
  remoteConfig.parameters.min_confidence_threshold = {
    defaultValue: {
      value: '65',
    },
    description: 'Minimum confidence threshold for Pick of the Day',
    valueType: 'STRING',
  };
}

if (!remoteConfig.parameters.prediction_schedule) {
  remoteConfig.parameters.prediction_schedule = {
    defaultValue: {
      value: '0 10 * * *',
    },
    description: 'Cron schedule for the predictTodayGames function',
    valueType: 'STRING',
  };
}

if (!remoteConfig.parameters.pick_of_day_schedule) {
  remoteConfig.parameters.pick_of_day_schedule = {
    defaultValue: {
      value: '0 9 * * *',
    },
    description: 'Cron schedule for the markAIPickOfDay function',
    valueType: 'STRING',
  };
}

// Write the updated Remote Config template
try {
  fs.writeFileSync(remoteConfigPath, JSON.stringify(remoteConfig, null, 2), 'utf8');
  console.log('Remote Config template updated successfully');
} catch (error) {
  console.error('Error writing Remote Config template:', error);
  process.exit(1);
}

// Update version information
remoteConfig.version = {
  versionNumber: String(parseInt(remoteConfig.version?.versionNumber || '0') + 1),
  updateTime: new Date().toISOString(),
  updateUser: {
    email: 'admin@ai-sports-edge.com',
  },
  description: 'Updated Remote Config parameters',
};

// Deploy the updated Remote Config
try {
  console.log('Deploying Remote Config...');
  execSync('firebase deploy --only remoteconfig', { stdio: 'inherit' });
  console.log('Remote Config deployed successfully!');

  // Also update the main remoteconfig.json file to keep it in sync
  const mainConfigPath = path.join(__dirname, 'remoteconfig.json');
  fs.writeFileSync(mainConfigPath, JSON.stringify(remoteConfig, null, 2), 'utf8');
  console.log('Updated remoteconfig.json to match template');
} catch (error) {
  console.error('Error deploying Remote Config:', error);
}
