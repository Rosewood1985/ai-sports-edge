const fs = require('fs');
const config = require('./firebase.json');

// Update the hosting site to aisportsedge-app
config.hosting.site = "aisportsedge-app";

// Write the updated configuration
fs.writeFileSync('firebase.json', JSON.stringify(config, null, 2));
console.log('Hosting site updated to aisportsedge-app');
