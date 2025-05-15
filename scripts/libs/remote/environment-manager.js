const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Manages connection details for different deployment environments
 */
class EnvironmentManager {
  constructor(options = {}) {
    this.options = {
      configPath: '.roocode/config/environments.json',
      encryptionKey: process.env.ROOCODE_ENV_KEY, // Optional encryption key
      ...options
    };
    
    this.environments = null;
    this.loaded = false;
  }

  /**
   * Load environments configuration
   * @returns {Promise<Object>} The environments configuration
   */
  async loadEnvironments() {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(this.options.configPath), { recursive: true })
        .catch(() => {});
      
      try {
        const data = await fs.readFile(this.options.configPath, 'utf8');
        this.environments = JSON.parse(data);
      } catch (error) {
        // If file doesn't exist or can't be parsed, create a default config
        this.environments = {
          environments: {},
          defaultEnvironment: null
        };
        
        // Save default config
        await this.saveEnvironments();
      }
      
      this.loaded = true;
      return this.environments;
    } catch (error) {
      console.error(`Error loading environments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save environments configuration
   * @returns {Promise<void>}
   */
  async saveEnvironments() {
    try {
      await fs.writeFile(
        this.options.configPath,
        JSON.stringify(this.environments, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error(`Error saving environments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get environment configuration
   * @param {string} name Environment name
   * @returns {Promise<Object>} Environment configuration
   */
  async getEnvironment(name) {
    if (!this.loaded) {
      await this.loadEnvironments();
    }
    
    // If name is not provided, use default
    const envName = name || this.environments.defaultEnvironment;
    
    if (!envName) {
      throw new Error('No environment specified and no default environment set');
    }
    
    const environment = this.environments.environments[envName];
    
    if (!environment) {
      throw new Error(`Environment "${envName}" not found`);
    }
    
    // Decrypt sensitive values if encrypted and encryption key is available
    if (environment.encrypted && this.options.encryptionKey) {
      return this._decryptEnvironment(environment);
    }
    
    return environment;
  }

  /**
   * Add or update environment
   * @param {string} name Environment name
   * @param {Object} config Environment configuration
   * @param {boolean} isDefault Whether this is the default environment
   * @returns {Promise<Object>} Updated environment
   */
  async setEnvironment(name, config, isDefault = false) {
    if (!name) {
      throw new Error('Environment name is required');
    }
    
    if (!this.loaded) {
      await this.loadEnvironments();
    }
    
    // Encrypt sensitive values if encryption key is available
    const environment = this.options.encryptionKey
      ? await this._encryptEnvironment(config)
      : config;
    
    // Add or update environment
    this.environments.environments[name] = environment;
    
    // Set as default if requested
    if (isDefault) {
      this.environments.defaultEnvironment = name;
    }
    
    // Save changes
    await this.saveEnvironments();
    
    return environment;
  }

  /**
   * Remove environment
   * @param {string} name Environment name
   * @returns {Promise<boolean>} Whether the environment was removed
   */
  async removeEnvironment(name) {
    if (!this.loaded) {
      await this.loadEnvironments();
    }
    
    if (!this.environments.environments[name]) {
      return false;
    }
    
    // Remove environment
    delete this.environments.environments[name];
    
    // If it was the default, reset default
    if (this.environments.defaultEnvironment === name) {
      this.environments.defaultEnvironment = null;
    }
    
    // Save changes
    await this.saveEnvironments();
    
    return true;
  }

  /**
   * Set default environment
   * @param {string} name Environment name
   * @returns {Promise<boolean>} Whether the default was set
   */
  async setDefaultEnvironment(name) {
    if (!this.loaded) {
      await this.loadEnvironments();
    }
    
    if (!this.environments.environments[name]) {
      return false;
    }
    
    this.environments.defaultEnvironment = name;
    
    // Save changes
    await this.saveEnvironments();
    
    return true;
  }

  /**
   * Get URLs for an environment
   * @param {string} name Environment name
   * @returns {Promise<Object>} URLs for the environment
   */
  async getEnvironmentUrls(name) {
    const environment = await this.getEnvironment(name);
    
    // Extract URLs based on environment type
    switch (environment.type) {
      case 'firebase':
        return this._getFirebaseUrls(environment);
      case 'custom':
        return environment.urls;
      default:
        throw new Error(`Unknown environment type: ${environment.type}`);
    }
  }

  /**
   * Generate URLs for Firebase environments
   * @param {Object} environment Firebase environment configuration
   * @returns {Object} URLs for the environment
   * @private
   */
  _getFirebaseUrls(environment) {
    const { projectId, site, customDomain } = environment;
    
    const urls = {
      default: `https://${site || projectId}.web.app`
    };
    
    if (customDomain) {
      urls.custom = `https://${customDomain}`;
      urls.default = urls.custom; // Prefer custom domain
    }
    
    return urls;
  }

  /**
   * Encrypt sensitive environment values
   * @param {Object} environment Environment configuration
   * @returns {Object} Encrypted environment
   * @private
   */
  async _encryptEnvironment(environment) {
    // Only encrypt if encryption key is available
    if (!this.options.encryptionKey) {
      return environment;
    }
    
    const sensitiveKeys = ['apiKey', 'authDomain', 'token', 'secret', 'password'];
    const encrypted = { ...environment, encrypted: true };
    
    // Encrypt sensitive values
    for (const key of Object.keys(encrypted)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        encrypted[key] = this._encrypt(encrypted[key]);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt sensitive environment values
   * @param {Object} environment Encrypted environment configuration
   * @returns {Object} Decrypted environment
   * @private
   */
  _decryptEnvironment(environment) {
    if (!environment.encrypted) {
      return environment;
    }
    
    const decrypted = { ...environment };
    delete decrypted.encrypted;
    
    // Try to decrypt any string values
    for (const key of Object.keys(decrypted)) {
      if (typeof decrypted[key] === 'string' && 
          decrypted[key].startsWith('enc:')) {
        try {
          decrypted[key] = this._decrypt(decrypted[key]);
        } catch (error) {
          // If decryption fails, keep the encrypted value
          console.warn(`Failed to decrypt ${key}`);
        }
      }
    }
    
    return decrypted;
  }

  /**
   * Encrypt a string
   * @param {string} text Text to encrypt
   * @returns {string} Encrypted text
   * @private
   */
  _encrypt(text) {
    if (!this.options.encryptionKey) {
      return text;
    }
    
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.createHash('sha256').update(this.options.encryptionKey).digest();
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return `enc:${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error(`Encryption error: ${error.message}`);
      return text;
    }
  }

  /**
   * Decrypt a string
   * @param {string} text Encrypted text
   * @returns {string} Decrypted text
   * @private
   */
  _decrypt(text) {
    if (!this.options.encryptionKey || !text.startsWith('enc:')) {
      return text;
    }
    
    try {
      const parts = text.split(':');
      const iv = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const key = crypto.createHash('sha256').update(this.options.encryptionKey).digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error(`Decryption error: ${error.message}`);
      return text;
    }
  }

  /**
   * Auto-detect environment from Firebase configuration
   * @returns {Promise<Object|null>} Detected environment or null
   */
  async detectFirebaseEnvironment() {
    try {
      // Check for firebase.json
      const firebaseConfig = JSON.parse(
        await fs.readFile('firebase.json', 'utf8')
      );
      
      // Check for .firebaserc
      const firebaserc = JSON.parse(
        await fs.readFile('.firebaserc', 'utf8')
      );
      
      if (firebaserc.projects && firebaserc.projects.default) {
        const projectId = firebaserc.projects.default;
        let site = projectId;
        
        // Check for hosting site
        if (firebaseConfig.hosting) {
          if (typeof firebaseConfig.hosting === 'object' && firebaseConfig.hosting.site) {
            site = firebaseConfig.hosting.site;
          } else if (Array.isArray(firebaseConfig.hosting) && firebaseConfig.hosting.length > 0) {
            site = firebaseConfig.hosting[0].site || projectId;
          }
        }
        
        // Create environment
        const environment = {
          type: 'firebase',
          projectId,
          site,
          customDomain: null // Can be detected or added manually
        };
        
        // Try to detect custom domain from firebase.json
        if (firebaseConfig.hosting) {
          const hostingConfig = Array.isArray(firebaseConfig.hosting) 
            ? firebaseConfig.hosting[0] 
            : firebaseConfig.hosting;
            
          if (hostingConfig.appAssociation === 'AUTO' && 
              hostingConfig.domains && 
              hostingConfig.domains.length > 0) {
            environment.customDomain = hostingConfig.domains[0];
          }
        }
        
        return environment;
      }
    } catch (error) {
      console.error(`Error detecting Firebase environment: ${error.message}`);
    }
    
    return null;
  }
}

module.exports = new EnvironmentManager();