const fs = require('fs');

const config = require('./firebase.json');

// Update the custom domains
config.hosting.customDomains = [
  {
    domain: 'aisportsedge.app',
    ssl: true,
  },
  {
    domain: 'www.aisportsedge.app',
    ssl: true,
  },
  {
    domain: 'api.aisportsedge.app',
    ssl: true,
  },
  {
    domain: 'admin.aisportsedge.app',
    ssl: true,
  },
];

// Update any API endpoints that reference the old domain
if (config.hosting.rewrites) {
  config.hosting.rewrites.forEach(rewrite => {
    if (rewrite.destination && rewrite.destination.includes('api.ai-sports-edge.com')) {
      rewrite.destination = rewrite.destination.replace(
        'api.ai-sports-edge.com',
        'api.aisportsedge.app'
      );
    }
    if (rewrite.destination && rewrite.destination.includes('admin.ai-sports-edge.com')) {
      rewrite.destination = rewrite.destination.replace(
        'admin.ai-sports-edge.com',
        'admin.aisportsedge.app'
      );
    }
  });
}

// Update redirects
if (config.hosting.redirects) {
  const newRedirects = config.hosting.redirects.filter(
    redirect => !redirect.source.includes('ai-sports-edge.com')
  );

  // Add new redirects for aisportsedge.app
  newRedirects.push(
    {
      source: 'http://aisportsedge.app/*',
      destination: 'https://www.aisportsedge.app/:splat',
      type: 301,
    },
    {
      source: 'https://aisportsedge.app/*',
      destination: 'https://www.aisportsedge.app/:splat',
      type: 301,
    }
  );

  config.hosting.redirects = newRedirects;
}

// Update CORS headers
if (config.hosting.headers) {
  config.hosting.headers.forEach(header => {
    if (header.source === '/api/**') {
      header.headers.forEach(h => {
        if (h.key === 'Access-Control-Allow-Origin') {
          h.value = 'https://www.aisportsedge.app';
        }
      });
    }
  });
}

// Write the updated configuration
fs.writeFileSync('firebase.json', JSON.stringify(config, null, 2));
console.log('Firebase configuration updated for aisportsedge.app domain');
