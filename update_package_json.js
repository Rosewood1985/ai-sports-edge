const fs = require('fs');
const packageJson = require('./package.json');

// Add or update the web build scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "build:web": "expo build:web",
  "export:web": "expo export:web",
  "deploy": "firebase deploy --only hosting"
};

// Write the updated package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('Updated package.json with web build scripts');
