/**
 * Server-Side Rendering (SSR) Module
 * 
 * This module provides server-side rendering functionality for the web components
 * of the AI Sports Edge application. It improves initial load performance and SEO.
 */

const path = require('path');
const fs = require('fs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { ChunkExtractor } = require('@loadable/server');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Import the App component
const App = require('../build/server/App').default;

// Create the express server
const app = express();
const PORT = process.env.PORT || 3000;

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.google-analytics.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https://www.google-analytics.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://api.aisportsedge.com'],
    },
  },
}));

// Enable gzip compression
app.use(compression());

// Serve static files
app.use(express.static(path.resolve(__dirname, '../build/client'), {
  maxAge: '30d', // Cache static assets for 30 days
}));

// Proxy API requests
app.use('/api', createProxyMiddleware({
  target: process.env.API_URL || 'https://api.aisportsedge.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '',
  },
  onProxyRes: function(proxyRes, req, res) {
    // Enable compression for API responses
    proxyRes.headers['content-encoding'] = 'gzip';
  },
}));

// Handle all other requests with SSR
app.get('*', (req, res) => {
  try {
    // Create a stats file path
    const statsFile = path.resolve(__dirname, '../build/client/loadable-stats.json');
    
    // Create a new ChunkExtractor instance
    const extractor = new ChunkExtractor({ statsFile });
    
    // Create a context for the StaticRouter
    const context = {};
    
    // Wrap the app in the ChunkExtractor and StaticRouter
    const jsx = extractor.collectChunks(
      React.createElement(
        require('react-router-dom/server').StaticRouter,
        { location: req.url, context },
        React.createElement(App)
      )
    );
    
    // If the StaticRouter context has a URL, it means we need to redirect
    if (context.url) {
      return res.redirect(context.status || 301, context.url);
    }
    
    // Render the app to string
    const html = ReactDOMServer.renderToString(jsx);
    
    // Get the script tags for the chunks
    const scriptTags = extractor.getScriptTags();
    
    // Get the style tags for the chunks
    const styleTags = extractor.getStyleTags();
    
    // Get the preload/prefetch link tags for the chunks
    const linkTags = extractor.getLinkTags();
    
    // Read the HTML template
    const template = fs.readFileSync(
      path.resolve(__dirname, '../build/client/index.html'),
      'utf8'
    );
    
    // Replace the root div with the rendered app
    const renderedHtml = template
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
      .replace('</head>', `${linkTags}${styleTags}</head>`)
      .replace('</body>', `${scriptTags}</body>`)
      // Add preloaded state for Redux
      .replace(
        '<script id="preloaded-state"></script>',
        `<script id="preloaded-state">window.__PRELOADED_STATE__ = ${JSON.stringify(
          context.store ? context.store.getState() : {}
        ).replace(/</g, '\\u003c')}</script>`
      );
    
    // Set the status code
    res.status(context.statusCode || 200);
    
    // Send the rendered HTML
    return res.send(renderedHtml);
  } catch (error) {
    console.error('SSR Error:', error);
    
    // In case of error, fall back to client-side rendering
    const template = fs.readFileSync(
      path.resolve(__dirname, '../build/client/index.html'),
      'utf8'
    );
    
    return res.send(template);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  // Exit the process to restart with a clean state
  process.exit(1);
});