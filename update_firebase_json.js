const fs = require('fs');
const path = require('path');

// Create a basic firebase.json if it doesn't exist
const firebaseConfig = {
  "hosting": {
    "site": "aisportsedge-app",
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains; preload"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
};

// Write the configuration to firebase.json
fs.writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2));
console.log('Firebase configuration updated with basic settings');
