/**
 * Authentication Middleware
 * 
 * This middleware provides authentication for API endpoints.
 */

const admin = require('firebase-admin');

/**
 * Verify Firebase authentication token
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  // Check if Firebase Admin is initialized
  if (!admin || !admin.apps || !admin.apps.length) {
    console.warn('Firebase Admin SDK not initialized, skipping authentication in development mode');
    // Attach a mock user for development
    req.user = { id: 'dev_user_123', role: 'admin' };
    return next();
  }
  
  // Verify token
  admin.auth().verifyIdToken(token)
    .then((decodedToken) => {
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'user'
      };
      next();
    })
    .catch((error) => {
      console.error('Error verifying token:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    });
}

/**
 * Check if user has admin role
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireAdmin(req, res, next) {
  // First verify the token
  verifyToken(req, res, () => {
    // Check if user has admin role
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  });
}

/**
 * API key authentication for non-browser clients
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  // List of valid API keys (in a real app, these would be stored in a database or environment variables)
  const validApiKeys = [
    'sk_test_api_key_123456',
    'sk_live_api_key_789012'
  ];
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  // Attach API client info to request
  req.apiClient = {
    id: apiKey.startsWith('sk_test_') ? 'test_client' : 'live_client',
    type: apiKey.startsWith('sk_test_') ? 'test' : 'live'
  };
  
  next();
}

/**
 * Combined authentication middleware that accepts either token or API key
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticate(req, res, next) {
  // Check for API key first
  if (req.headers['x-api-key']) {
    return verifyApiKey(req, res, next);
  }
  
  // Fall back to token authentication
  verifyToken(req, res, next);
}

module.exports = {
  verifyToken,
  requireAdmin,
  verifyApiKey,
  authenticate
};