const fs = require('fs');

// Read the current firebase.json
let config;
try {
  config = JSON.parse(fs.readFileSync('./firebase.json', 'utf8'));
} catch (error) {
  console.error('Error reading firebase.json:', error.message);
  process.exit(1);
}

// Make sure we have a hosting section
if (!config.hosting) {
  console.error('No hosting section found in firebase.json');
  process.exit(1);
}

// Remove 'target' if both 'site' and 'target' are present
if (config.hosting.site && config.hosting.target) {
  console.log('Found both "site" and "target" in hosting config. Removing "target"...');
  delete config.hosting.target;
}

// Write the updated config back to firebase.json
fs.writeFileSync('./firebase.json', JSON.stringify(config, null, 2));
console.log('Firebase configuration fixed successfully!');