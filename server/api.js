/**
 * API Server Module
 *
 * This module provides an API server with compression for the AI Sports Edge application.
 * It ensures all API responses are compressed to reduce bandwidth usage and improve performance.
 */

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');

// Create the express server
const app = express();
const PORT = process.env.API_PORT || 3001;

// Enable request logging
app.use(morgan('combined'));

// Apply security headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// Apply speed limiting
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes without delay
  delayMs: 500, // add 500ms delay per request above 50
});
app.use(speedLimiter);

// Enable gzip compression for all responses
app.use(
  compression({
    // Compression filter function
    filter: (req, res) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }

      // Use compression filter function from the middleware
      return compression.filter(req, res);
    },
    // Compression level (0-9, where 9 is maximum compression)
    level: 6,
    // Minimum size threshold in bytes. Only responses larger than this will be compressed
    threshold: 1024, // 1KB
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy API requests to the backend
app.use(
  '/api',
  createProxyMiddleware({
    target: process.env.BACKEND_API_URL || 'https://api.aisportsedge.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add custom headers to the proxied request
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
      proxyReq.setHeader('X-Forwarded-Host', req.hostname);

      // If the request has a body, restream it to the proxied request
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Ensure the response is compressed
      if (!proxyRes.headers['content-encoding']) {
        proxyRes.headers['content-encoding'] = 'gzip';
      }

      // Add cache control headers for GET requests
      if (req.method === 'GET') {
        // Cache successful responses for 5 minutes
        if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
          proxyRes.headers['cache-control'] = 'public, max-age=300';
        } else {
          // Don't cache error responses
          proxyRes.headers['cache-control'] = 'no-store';
        }
      } else {
        // Don't cache non-GET requests
        proxyRes.headers['cache-control'] = 'no-store';
      }
    },
  })
);

// Custom API endpoints
app.get('/api/config', (req, res) => {
  // Return public configuration
  res.json({
    apiVersion: '1.0.0',
    features: {
      predictions: true,
      liveScores: true,
      betting: true,
      news: true,
    },
    supportedSports: ['football', 'basketball', 'baseball', 'hockey', 'soccer'],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    },
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      code: 'NOT_FOUND',
    },
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);

  // Exit the process to restart with a clean state
  process.exit(1);
});
