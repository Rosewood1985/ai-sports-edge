const fs = require('fs');
const config = require('./firebase.json');

// Update CORS headers to ensure HTTPS
if (config.hosting.headers) {
  config.hosting.headers.forEach(header => {
    if (header.source === '/api/**') {
      header.headers.forEach(h => {
        if (h.key === 'Access-Control-Allow-Origin') {
          // Ensure it uses HTTPS
          h.value = h.value.replace('http://', 'https://');
        }
      });
    }
    
    // Add security headers to enforce HTTPS
    if (header.source === '**') {
      let hasHSTS = false;
      header.headers.forEach(h => {
        if (h.key === 'Strict-Transport-Security') {
          hasHSTS = true;
          h.value = 'max-age=31536000; includeSubDomains; preload';
        }
      });
      
      if (!hasHSTS) {
        header.headers.push({
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload'
        });
      }
    }
  });
}

// Update rewrites to use HTTPS
if (config.hosting.rewrites) {
  config.hosting.rewrites.forEach(rewrite => {
    if (rewrite.destination && rewrite.destination.startsWith('http://')) {
      rewrite.destination = rewrite.destination.replace('http://', 'https://');
    }
  });
}

// Ensure all redirects use HTTPS
if (config.hosting.redirects) {
  config.hosting.redirects.forEach(redirect => {
    if (redirect.destination && redirect.destination.startsWith('http://')) {
      redirect.destination = redirect.destination.replace('http://', 'https://');
    }
    // Convert all http:// sources to https://
    if (redirect.source.includes('http://')) {
      // Keep the existing redirect for http://
      // Add a new redirect for https:// to ensure both work
      config.hosting.redirects.push({
        source: redirect.source.replace('http://', 'https://'),
        destination: redirect.destination,
        type: redirect.type
      });
    }
  });
}

// Write the updated configuration
fs.writeFileSync('firebase.json', JSON.stringify(config, null, 2));
console.log('Firebase configuration updated to enforce HTTPS');
