const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the model file
const modelFilePath = path.join(__dirname, 'ml', 'models', 'model.pkl');

// Create a directory to store the model in the public directory
const modelDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir, { recursive: true });
}

// Copy the model to the public directory
const publicModelPath = path.join(modelDir, 'model.pkl');
fs.copyFileSync(modelFilePath, publicModelPath);

console.log(`Model copied to ${publicModelPath}`);

// Deploy the model to Firebase Hosting
try {
  console.log('Deploying model to Firebase Hosting...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  console.log('Model deployed successfully!');
} catch (error) {
  console.error('Error deploying model:', error);
}