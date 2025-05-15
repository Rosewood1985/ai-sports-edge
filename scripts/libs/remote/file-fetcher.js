/**
 * File Fetcher for AI Sports Edge
 * 
 * Fetches files from remote environments for validation.
 * Supports various protocols and authentication methods.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const environmentManager = require('./environment-manager');

/**
 * Fetches files from remote environments
 */
class FileFetcher {
  /**
   * Fetch a file from a remote environment
   * @param {string} remotePath Path to the file on the remote server
   * @param {Object} options Options for fetching
   * @returns {Promise<Object>} Fetched file data
   */
  async fetchFile(remotePath, options = {}) {
    const {
      environmentName = null,
      localPath = null,
      saveToFile = false,
      timeout = 30000,
      headers = {},
      retries = 3,
      retryDelay = 1000
    } = options;
    
    try {
      // Get environment configuration
      const environment = await environmentManager.getEnvironment(environmentName);
      
      // Get URLs for the environment
      const urls = await environmentManager.getEnvironmentUrls(environmentName);
      
      // Determine the full URL to fetch
      const baseUrl = urls.default;
      const url = new URL(remotePath, baseUrl);
      
      // Add authentication if needed
      const requestHeaders = { ...headers };
      if (environment.auth) {
        if (environment.auth.type === 'bearer') {
          requestHeaders['Authorization'] = `Bearer ${environment.auth.token}`;
        } else if (environment.auth.type === 'basic') {
          const auth = Buffer.from(`${environment.auth.username}:${environment.auth.password}`).toString('base64');
          requestHeaders['Authorization'] = `Basic ${auth}`;
        }
      }
      
      // Fetch the file
      const fileData = await this._fetchUrl(url.toString(), {
        headers: requestHeaders,
        timeout,
        retries,
        retryDelay
      });
      
      // Save to file if requested
      if (saveToFile && localPath) {
        await this._saveToFile(fileData, localPath);
      }
      
      return {
        path: remotePath,
        url: url.toString(),
        data: fileData,
        size: fileData.length,
        localPath: saveToFile ? localPath : null,
        environment: environmentName
      };
    } catch (error) {
      console.error(`Error fetching file ${remotePath}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Fetch multiple files from a remote environment
   * @param {Array} remotePaths Array of paths to fetch
   * @param {Object} options Options for fetching
   * @returns {Promise<Array>} Array of fetched file data
   */
  async fetchFiles(remotePaths, options = {}) {
    const results = [];
    const errors = [];
    
    for (const remotePath of remotePaths) {
      try {
        const result = await this.fetchFile(remotePath, options);
        results.push(result);
      } catch (error) {
        errors.push({
          path: remotePath,
          error: error.message
        });
      }
    }
    
    return {
      results,
      errors,
      success: errors.length === 0,
      total: remotePaths.length,
      successful: results.length,
      failed: errors.length
    };
  }
  
  /**
   * Fetch files matching a pattern from a remote environment
   * @param {string} pattern Pattern to match files
   * @param {Object} options Options for fetching
   * @returns {Promise<Array>} Array of fetched file data
   */
  async fetchFilesMatching(pattern, options = {}) {
    try {
      // Get environment configuration
      const environment = await environmentManager.getEnvironment(options.environmentName);
      
      // This would typically use a remote API to list files
      // For now, we'll just use a simple pattern matching approach
      
      // For Firebase hosting, we can use the Firebase Hosting API
      if (environment.type === 'firebase') {
        // This would be implemented using the Firebase Admin SDK
        // For now, we'll just return a placeholder
        console.warn('Firebase Hosting API not implemented yet. Using placeholder.');
        return {
          results: [],
          errors: [],
          success: true,
          total: 0,
          successful: 0,
          failed: 0
        };
      }
      
      // For custom environments, we'd need to implement a custom solution
      console.warn('Remote file listing not implemented for this environment type.');
      return {
        results: [],
        errors: [],
        success: true,
        total: 0,
        successful: 0,
        failed: 0
      };
    } catch (error) {
      console.error(`Error fetching files matching ${pattern}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Fetch a URL with retries
   * @param {string} url URL to fetch
   * @param {Object} options Options for fetching
   * @returns {Promise<Buffer>} Fetched data
   * @private
   */
  async _fetchUrl(url, options = {}) {
    const {
      headers = {},
      timeout = 30000,
      retries = 3,
      retryDelay = 1000
    } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this._fetchUrlOnce(url, { headers, timeout });
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          console.warn(`Retry ${attempt + 1}/${retries} for ${url}: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Fetch a URL once
   * @param {string} url URL to fetch
   * @param {Object} options Options for fetching
   * @returns {Promise<Buffer>} Fetched data
   * @private
   */
  _fetchUrlOnce(url, options = {}) {
    const {
      headers = {},
      timeout = 30000
    } = options;
    
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        method: 'GET',
        headers,
        timeout
      };
      
      const req = protocol.request(url, requestOptions, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP error: ${res.statusCode}`));
        }
        
        const chunks = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });
      
      req.end();
    });
  }
  
  /**
   * Save data to a file
   * @param {Buffer} data Data to save
   * @param {string} filePath Path to save to
   * @returns {Promise<void>}
   * @private
   */
  async _saveToFile(data, filePath) {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, data);
    } catch (error) {
      console.error(`Error saving file ${filePath}:`, error.message);
      throw error;
    }
  }
}

module.exports = new FileFetcher();