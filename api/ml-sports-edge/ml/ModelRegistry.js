/**
 * ModelRegistry.js
 * Manages model versions and deployment
 */

const fs = require('fs').promises;
const path = require('path');

const logger = require('../utils/logger');

class ModelRegistry {
  constructor() {
    this.modelsDirectory = path.join(__dirname, '../models');
    this.registryFile = path.join(this.modelsDirectory, 'registry.json');
    this.registry = {
      models: {},
      activeVersions: {},
      history: [],
    };
  }

  /**
   * Initialize the model registry
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create models directory if it doesn't exist
      await fs.mkdir(this.modelsDirectory, { recursive: true });

      // Load registry if it exists
      try {
        const registryData = await fs.readFile(this.registryFile, 'utf8');
        this.registry = JSON.parse(registryData);
        logger.info('Model registry loaded successfully');
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.info('Model registry not found, creating new registry');
          await this.saveRegistry();
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error('Error initializing model registry:', error);
      throw error;
    }
  }

  /**
   * Save registry to file
   * @returns {Promise<void>}
   */
  async saveRegistry() {
    try {
      await fs.writeFile(this.registryFile, JSON.stringify(this.registry, null, 2), 'utf8');
      logger.info('Model registry saved successfully');
    } catch (error) {
      logger.error('Error saving model registry:', error);
      throw error;
    }
  }

  /**
   * Register models with the registry
   * @param {Object} models - Models to register
   * @param {Object} versions - Model versions
   * @returns {Promise<void>}
   */
  async registerModels(models, versions) {
    try {
      logger.info('Registering models:', versions);

      // Create timestamp for this registration
      const timestamp = new Date().toISOString();

      // Register each model
      for (const [modelType, version] of Object.entries(versions)) {
        // Create model directory if it doesn't exist
        const modelDir = path.join(this.modelsDirectory, modelType);
        await fs.mkdir(modelDir, { recursive: true });

        // Create version directory
        const versionDir = path.join(modelDir, version);
        await fs.mkdir(versionDir, { recursive: true });

        // Save model metadata
        const metadata = {
          version,
          timestamp,
          modelType,
          performance: models[modelType]?.performance || {},
        };

        await fs.writeFile(
          path.join(versionDir, 'metadata.json'),
          JSON.stringify(metadata, null, 2),
          'utf8'
        );

        // Update registry
        if (!this.registry.models[modelType]) {
          this.registry.models[modelType] = [];
        }

        this.registry.models[modelType].push({
          version,
          timestamp,
          path: versionDir,
        });

        // Add to history
        this.registry.history.push({
          modelType,
          version,
          timestamp,
          action: 'registered',
        });
      }

      // Save registry
      await this.saveRegistry();

      logger.info('Models registered successfully');
    } catch (error) {
      logger.error('Error registering models:', error);
      throw error;
    }
  }

  /**
   * Deploy models for use
   * @param {Object} versions - Model versions to deploy
   * @returns {Promise<void>}
   */
  async deployModels(versions) {
    try {
      logger.info('Deploying models:', versions);

      // Create timestamp for this deployment
      const timestamp = new Date().toISOString();

      // Deploy each model
      for (const [modelType, version] of Object.entries(versions)) {
        // Verify model exists
        const modelVersions = this.registry.models[modelType] || [];
        const modelVersion = modelVersions.find(mv => mv.version === version);

        if (!modelVersion) {
          logger.warn(`Model ${modelType} version ${version} not found in registry`);
          continue;
        }

        // Update active version
        this.registry.activeVersions[modelType] = version;

        // Add to history
        this.registry.history.push({
          modelType,
          version,
          timestamp,
          action: 'deployed',
        });

        logger.info(`Model ${modelType} version ${version} deployed successfully`);
      }

      // Save registry
      await this.saveRegistry();

      logger.info('Models deployed successfully');
    } catch (error) {
      logger.error('Error deploying models:', error);
      throw error;
    }
  }

  /**
   * Get active model versions
   * @returns {Object} Active model versions
   */
  getActiveVersions() {
    return { ...this.registry.activeVersions };
  }

  /**
   * Get model version history
   * @param {string} modelType - Model type
   * @returns {Array} Model version history
   */
  getModelHistory(modelType) {
    if (modelType) {
      return this.registry.history.filter(h => h.modelType === modelType);
    }

    return [...this.registry.history];
  }

  /**
   * Get model metadata
   * @param {string} modelType - Model type
   * @param {string} version - Model version (optional, defaults to active version)
   * @returns {Promise<Object>} Model metadata
   */
  async getModelMetadata(modelType, version) {
    try {
      // Get version to use
      const versionToUse = version || this.registry.activeVersions[modelType];

      if (!versionToUse) {
        throw new Error(`No active version found for model ${modelType}`);
      }

      // Find model in registry
      const modelVersions = this.registry.models[modelType] || [];
      const modelVersion = modelVersions.find(mv => mv.version === versionToUse);

      if (!modelVersion) {
        throw new Error(`Model ${modelType} version ${versionToUse} not found in registry`);
      }

      // Load metadata
      const metadataPath = path.join(modelVersion.path, 'metadata.json');
      const metadataData = await fs.readFile(metadataPath, 'utf8');

      return JSON.parse(metadataData);
    } catch (error) {
      logger.error(`Error getting metadata for model ${modelType} version ${version}:`, error);
      throw error;
    }
  }

  /**
   * Compare model versions
   * @param {string} modelType - Model type
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {Promise<Object>} Comparison results
   */
  async compareModelVersions(modelType, version1, version2) {
    try {
      // Get metadata for both versions
      const metadata1 = await this.getModelMetadata(modelType, version1);
      const metadata2 = await this.getModelMetadata(modelType, version2);

      // Compare performance metrics
      const performance1 = metadata1.performance || {};
      const performance2 = metadata2.performance || {};

      const comparison = {
        modelType,
        version1,
        version2,
        metrics: {},
      };

      // Compare common metrics
      const allMetrics = new Set([...Object.keys(performance1), ...Object.keys(performance2)]);

      allMetrics.forEach(metric => {
        const value1 = performance1[metric];
        const value2 = performance2[metric];

        if (value1 !== undefined && value2 !== undefined) {
          const difference = value2 - value1;
          const percentChange = value1 !== 0 ? (difference / value1) * 100 : 0;

          comparison.metrics[metric] = {
            value1,
            value2,
            difference,
            percentChange,
            improved: difference > 0,
          };
        } else {
          comparison.metrics[metric] = {
            value1: value1 || null,
            value2: value2 || null,
            difference: null,
            percentChange: null,
            improved: null,
          };
        }
      });

      return comparison;
    } catch (error) {
      logger.error(`Error comparing model versions ${version1} and ${version2}:`, error);
      throw error;
    }
  }

  /**
   * Rollback to a previous model version
   * @param {string} modelType - Model type
   * @param {string} version - Version to rollback to
   * @returns {Promise<void>}
   */
  async rollbackModel(modelType, version) {
    try {
      logger.info(`Rolling back model ${modelType} to version ${version}`);

      // Verify model exists
      const modelVersions = this.registry.models[modelType] || [];
      const modelVersion = modelVersions.find(mv => mv.version === version);

      if (!modelVersion) {
        throw new Error(`Model ${modelType} version ${version} not found in registry`);
      }

      // Update active version
      this.registry.activeVersions[modelType] = version;

      // Add to history
      this.registry.history.push({
        modelType,
        version,
        timestamp: new Date().toISOString(),
        action: 'rollback',
      });

      // Save registry
      await this.saveRegistry();

      logger.info(`Model ${modelType} rolled back to version ${version} successfully`);
    } catch (error) {
      logger.error(`Error rolling back model ${modelType} to version ${version}:`, error);
      throw error;
    }
  }
}

module.exports = ModelRegistry;
