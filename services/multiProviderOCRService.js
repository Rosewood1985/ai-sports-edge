/**
 * Multi-Provider OCR Service
 *
 * Integrates multiple OCR providers to improve accuracy through consensus-based
 * text recognition. Supports Google Vision, Microsoft Cognitive Services,
 * Tesseract.js, and Amazon Textract with provider selection based on
 * confidence and availability.
 */

const { LogLevel, LogCategory } = require('./loggingService.ts');
const cacheService = require('./cacheService.ts').default;

// Constants
const OCR_CACHE_KEY_PREFIX = 'ocr:';
const OCR_CACHE_EXPIRATION = 1000 * 60 * 60 * 24; // 24 hours

// Provider configuration
const PROVIDERS = {
  GOOGLE: 'google',
  MICROSOFT: 'microsoft',
  TESSERACT: 'tesseract',
  AMAZON: 'amazon',
};

// Default confidence thresholds
const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
const CONSENSUS_THRESHOLD = 0.8;
const LEVENSHTEIN_SIMILARITY_THRESHOLD = 0.85;

/**
 * Multi-Provider OCR Service class
 */
class MultiProviderOCRService {
  constructor() {
    // Initialize provider SDKs and configurations
    this.providers = {
      [PROVIDERS.GOOGLE]: {
        name: 'Google Vision',
        available: true,
        priority: 1, // Lower number = higher priority
        confidence: 0.85,
      },
      [PROVIDERS.MICROSOFT]: {
        name: 'Microsoft Cognitive Services',
        available: true,
        priority: 2,
        confidence: 0.82,
      },
      [PROVIDERS.AMAZON]: {
        name: 'Amazon Textract',
        available: true,
        priority: 3,
        confidence: 0.8,
      },
      [PROVIDERS.TESSERACT]: {
        name: 'Tesseract.js',
        available: true,
        priority: 4,
        confidence: 0.75,
      },
    };

    // Keep track of provider performance
    this.providerStats = {};
    this.initializeProviderStats();

    // Log initialization
    this.log(LogLevel.INFO, 'Initialized MultiProviderOCRService');
  }

  /**
   * Initialize provider statistics
   * @private
   */
  initializeProviderStats() {
    Object.keys(this.providers).forEach(provider => {
      this.providerStats[provider] = {
        totalRequests: 0,
        successfulRequests: 0,
        averageLatency: 0,
        averageConfidence: 0,
      };
    });
  }

  /**
   * Log messages with the OCR category
   * @param {LogLevel} level - Log level
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data
   * @private
   */
  log(level, message, data = {}) {
    try {
      // Dynamically import the logging service
      const loggingService = require('./loggingService.ts');
      loggingService.log(level, LogCategory.API, `[OCR] ${message}`, data);
    } catch (error) {
      // Fallback to console logging if the logging service fails
      console[level](`[OCR] ${message}`, data);
    }
  }

  /**
   * Process an image with multiple OCR providers
   * @param {string} imagePath - Path to the image to process
   * @param {Object} [options] - Processing options
   * @param {string[]} [options.providers] - Providers to use (default: all available)
   * @param {boolean} [options.useConsensus=true] - Whether to use consensus algorithm
   * @param {number} [options.minProviders=2] - Minimum number of providers to use
   * @param {boolean} [options.useCache=true] - Whether to use caching
   * @param {number} [options.confidenceThreshold] - Minimum confidence threshold
   * @returns {Promise<Object>} - OCR result
   */
  async processWithMultipleProviders(imagePath, options = {}) {
    const {
      providers = Object.keys(this.providers),
      useConsensus = true,
      minProviders = 2,
      useCache = true,
      confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
    } = options;

    try {
      this.log(LogLevel.INFO, 'Processing with multiple providers', {
        imagePath,
        providers,
        useConsensus,
        minProviders,
      });

      // Check cache first if enabled
      if (useCache) {
        const cacheKey = `${OCR_CACHE_KEY_PREFIX}${this.generateCacheKey(imagePath)}`;
        const cachedResult = await this.getCachedResult(cacheKey);

        if (cachedResult) {
          this.log(LogLevel.INFO, 'Using cached OCR result', { cacheKey });
          return cachedResult;
        }
      }

      // Filter available providers
      const availableProviders = providers.filter(
        provider => this.providers[provider] && this.providers[provider].available
      );

      if (availableProviders.length === 0) {
        throw new Error('No available OCR providers');
      }

      if (availableProviders.length < minProviders) {
        this.log(
          LogLevel.WARN,
          `Only ${availableProviders.length} providers available, but ${minProviders} required`,
          {
            availableProviders,
          }
        );
      }

      // Sort providers by priority
      const sortedProviders = availableProviders.sort(
        (a, b) => this.providers[a].priority - this.providers[b].priority
      );

      // Process with each provider
      const providerResults = [];
      for (const provider of sortedProviders) {
        try {
          const startTime = Date.now();
          const result = await this.processWithProvider(imagePath, provider);
          const latency = Date.now() - startTime;

          if (result && result.confidence >= confidenceThreshold) {
            providerResults.push(result);

            // Update provider stats
            this.updateProviderStats(provider, true, latency, result.confidence);
          } else {
            this.log(LogLevel.WARN, `Provider ${provider} returned low confidence result`, {
              confidence: result ? result.confidence : 0,
            });

            // Update provider stats
            this.updateProviderStats(provider, false, latency, result ? result.confidence : 0);
          }
        } catch (error) {
          this.log(LogLevel.ERROR, `Error processing with provider ${provider}`, {
            error: error.message,
          });
          // Update provider stats
          this.updateProviderStats(provider, false, 0, 0);
        }
      }

      // If no results were obtained, throw an error
      if (providerResults.length === 0) {
        throw new Error('No OCR results obtained from any provider');
      }

      // Apply consensus algorithm if enabled and we have multiple results
      let finalResult;
      if (useConsensus && providerResults.length > 1) {
        finalResult = this.applyConsensusAlgorithm(providerResults);
      } else {
        // Just use the highest confidence result
        finalResult = providerResults.sort((a, b) => b.confidence - a.confidence)[0];
      }

      // Cache the result if caching is enabled
      if (useCache) {
        const cacheKey = `${OCR_CACHE_KEY_PREFIX}${this.generateCacheKey(imagePath)}`;
        await this.cacheResult(cacheKey, finalResult);
      }

      return finalResult;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error processing with multiple providers', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Process an image with a specific OCR provider
   * @param {string} imagePath - Path to the image to process
   * @param {string} provider - Provider to use
   * @returns {Promise<Object>} - OCR result
   */
  async processWithProvider(imagePath, provider) {
    try {
      this.log(LogLevel.INFO, `Processing with provider: ${provider}`, { imagePath });

      // Check if provider is available
      if (!this.providers[provider] || !this.providers[provider].available) {
        throw new Error(`Provider ${provider} is not available`);
      }

      // Call provider-specific implementation
      let result;
      switch (provider) {
        case PROVIDERS.GOOGLE:
          result = await this.processWithGoogleVision(imagePath);
          break;
        case PROVIDERS.MICROSOFT:
          result = await this.processWithMicrosoftCognitive(imagePath);
          break;
        case PROVIDERS.AMAZON:
          result = await this.processWithAmazonTextract(imagePath);
          break;
        case PROVIDERS.TESSERACT:
          result = await this.processWithTesseract(imagePath);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      // Add provider info to result
      result.provider = provider;
      result.providerName = this.providers[provider].name;

      return result;
    } catch (error) {
      this.log(LogLevel.ERROR, `Error processing with provider: ${provider}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Apply consensus algorithm to combine results from multiple providers
   * @param {Array<Object>} results - Results from multiple providers
   * @returns {Object} - Combined result
   * @private
   */
  applyConsensusAlgorithm(results) {
    this.log(LogLevel.INFO, 'Applying consensus algorithm', { resultCount: results.length });

    // Start with the highest confidence result as the base
    results.sort((a, b) => b.confidence - a.confidence);
    const baseResult = results[0];

    // If we only have one result, return it
    if (results.length === 1) {
      return baseResult;
    }

    // Extract text blocks from all results
    const allTextBlocks = {};
    results.forEach(result => {
      if (result.textBlocks) {
        result.textBlocks.forEach(block => {
          const key = this.normalizeText(block.text);
          if (!allTextBlocks[key]) {
            allTextBlocks[key] = {
              text: block.text,
              occurrences: 0,
              confidence: 0,
              boundingBoxes: [],
            };
          }
          allTextBlocks[key].occurrences++;
          allTextBlocks[key].confidence += block.confidence || 0;
          if (block.boundingBox) {
            allTextBlocks[key].boundingBoxes.push(block.boundingBox);
          }
        });
      }
    });

    // Calculate consensus for each text block
    Object.keys(allTextBlocks).forEach(key => {
      const block = allTextBlocks[key];
      block.confidence = block.confidence / block.occurrences;
      block.consensusScore = (block.occurrences / results.length) * block.confidence;

      // Average bounding boxes if available
      if (block.boundingBoxes.length > 0) {
        block.boundingBox = this.averageBoundingBoxes(block.boundingBoxes);
      }
    });

    // Filter blocks by consensus threshold
    const consensusBlocks = Object.values(allTextBlocks).filter(
      block => block.consensusScore >= CONSENSUS_THRESHOLD
    );

    // Sort blocks by position (top to bottom, left to right)
    consensusBlocks.sort((a, b) => {
      if (a.boundingBox && b.boundingBox) {
        // Sort by Y first, then by X
        if (Math.abs(a.boundingBox.y - b.boundingBox.y) > 20) {
          return a.boundingBox.y - b.boundingBox.y;
        }
        return a.boundingBox.x - b.boundingBox.x;
      }
      return 0;
    });

    // Combine text blocks into full text
    const fullText = consensusBlocks.map(block => block.text).join(' ');

    // Calculate overall confidence
    const overallConfidence =
      consensusBlocks.length > 0
        ? consensusBlocks.reduce((sum, block) => sum + block.confidence, 0) / consensusBlocks.length
        : 0;

    return {
      fullText,
      textBlocks: consensusBlocks,
      confidence: overallConfidence,
      provider: 'consensus',
      providerName: 'Consensus Algorithm',
      sourceResults: results,
    };
  }

  /**
   * Normalize text for comparison
   * @param {string} text - Text to normalize
   * @returns {string} - Normalized text
   * @private
   */
  normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /**
   * Average multiple bounding boxes
   * @param {Array<Object>} boundingBoxes - Bounding boxes to average
   * @returns {Object} - Average bounding box
   * @private
   */
  averageBoundingBoxes(boundingBoxes) {
    const sum = boundingBoxes.reduce(
      (acc, box) => {
        acc.x += box.x || 0;
        acc.y += box.y || 0;
        acc.width += box.width || 0;
        acc.height += box.height || 0;
        return acc;
      },
      { x: 0, y: 0, width: 0, height: 0 }
    );

    return {
      x: sum.x / boundingBoxes.length,
      y: sum.y / boundingBoxes.length,
      width: sum.width / boundingBoxes.length,
      height: sum.height / boundingBoxes.length,
    };
  }

  /**
   * Generate a cache key for an image path
   * @param {string} imagePath - Image path
   * @returns {string} - Cache key
   * @private
   */
  generateCacheKey(imagePath) {
    // Use the last part of the path and add a hash of the full path
    const pathParts = imagePath.split('/');
    const fileName = pathParts[pathParts.length - 1];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < imagePath.length; i++) {
      const char = imagePath.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return `${fileName}-${Math.abs(hash)}`;
  }

  /**
   * Get cached OCR result
   * @param {string} cacheKey - Cache key
   * @returns {Promise<Object|null>} - Cached result or null
   * @private
   */
  async getCachedResult(cacheKey) {
    try {
      return await cacheService.get(
        cacheKey,
        async () => null, // Don't fetch if not in cache
        OCR_CACHE_EXPIRATION
      );
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error getting cached OCR result', {
        error: error.message,
        cacheKey,
      });
      return null;
    }
  }

  /**
   * Cache OCR result
   * @param {string} cacheKey - Cache key
   * @param {Object} result - OCR result to cache
   * @returns {Promise<void>}
   * @private
   */
  async cacheResult(cacheKey, result) {
    try {
      // Store in cache with the default OCR expiration
      await cacheService.get(cacheKey, async () => result, OCR_CACHE_EXPIRATION);
      this.log(LogLevel.INFO, 'Cached OCR result', { cacheKey });
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error caching OCR result', {
        error: error.message,
        cacheKey,
      });
    }
  }

  /**
   * Update provider statistics
   * @param {string} provider - Provider name
   * @param {boolean} success - Whether the request was successful
   * @param {number} latency - Request latency in milliseconds
   * @param {number} confidence - Confidence score
   * @private
   */
  updateProviderStats(provider, success, latency, confidence) {
    if (!this.providerStats[provider]) {
      return;
    }

    const stats = this.providerStats[provider];
    stats.totalRequests++;

    if (success) {
      stats.successfulRequests++;

      // Update average latency
      stats.averageLatency =
        (stats.averageLatency * (stats.successfulRequests - 1) + latency) /
        stats.successfulRequests;

      // Update average confidence
      stats.averageConfidence =
        (stats.averageConfidence * (stats.successfulRequests - 1) + confidence) /
        stats.successfulRequests;
    }
  }

  /**
   * Get provider statistics
   * @returns {Object} - Provider statistics
   */
  getProviderStats() {
    return this.providerStats;
  }

  /**
   * Process with Google Vision API
   * @param {string} imagePath - Path to the image to process
   * @returns {Promise<Object>} - OCR result
   * @private
   */
  async processWithGoogleVision(imagePath) {
    // Simulated implementation - in a real app, this would call the Google Vision API
    this.log(LogLevel.INFO, 'Processing with Google Vision', { imagePath });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      fullText: 'Sample text detected by Google Vision',
      textBlocks: [
        {
          text: 'Sample text',
          confidence: 0.95,
          boundingBox: { x: 10, y: 10, width: 100, height: 20 },
        },
        {
          text: 'detected by Google Vision',
          confidence: 0.92,
          boundingBox: { x: 10, y: 40, width: 200, height: 20 },
        },
      ],
      confidence: 0.93,
    };
  }

  /**
   * Process with Microsoft Cognitive Services
   * @param {string} imagePath - Path to the image to process
   * @returns {Promise<Object>} - OCR result
   * @private
   */
  async processWithMicrosoftCognitive(imagePath) {
    // Simulated implementation - in a real app, this would call the Microsoft Cognitive Services API
    this.log(LogLevel.INFO, 'Processing with Microsoft Cognitive Services', { imagePath });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      fullText: 'Sample text detected by Microsoft Cognitive Services',
      textBlocks: [
        {
          text: 'Sample text',
          confidence: 0.9,
          boundingBox: { x: 12, y: 12, width: 98, height: 18 },
        },
        {
          text: 'detected by Microsoft Cognitive Services',
          confidence: 0.88,
          boundingBox: { x: 12, y: 42, width: 220, height: 18 },
        },
      ],
      confidence: 0.89,
    };
  }

  /**
   * Process with Amazon Textract
   * @param {string} imagePath - Path to the image to process
   * @returns {Promise<Object>} - OCR result
   * @private
   */
  async processWithAmazonTextract(imagePath) {
    // Simulated implementation - in a real app, this would call the Amazon Textract API
    this.log(LogLevel.INFO, 'Processing with Amazon Textract', { imagePath });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 550));

    return {
      fullText: 'Sample text detected by Amazon Textract',
      textBlocks: [
        {
          text: 'Sample text',
          confidence: 0.91,
          boundingBox: { x: 11, y: 11, width: 99, height: 19 },
        },
        {
          text: 'detected by Amazon Textract',
          confidence: 0.87,
          boundingBox: { x: 11, y: 41, width: 210, height: 19 },
        },
      ],
      confidence: 0.89,
    };
  }

  /**
   * Process with Tesseract.js
   * @param {string} imagePath - Path to the image to process
   * @returns {Promise<Object>} - OCR result
   * @private
   */
  async processWithTesseract(imagePath) {
    // Simulated implementation - in a real app, this would use the Tesseract.js library
    this.log(LogLevel.INFO, 'Processing with Tesseract.js', { imagePath });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      fullText: 'Sample text detected by Tesseract.js',
      textBlocks: [
        {
          text: 'Sample text',
          confidence: 0.85,
          boundingBox: { x: 10, y: 10, width: 100, height: 20 },
        },
        {
          text: 'detected by Tesseract.js',
          confidence: 0.82,
          boundingBox: { x: 10, y: 40, width: 200, height: 20 },
        },
      ],
      confidence: 0.83,
    };
  }

  /**
   * Calculate the Levenshtein distance between two strings
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} - Levenshtein distance
   * @private
   */
  levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Substitution
            Math.min(
              matrix[i][j - 1] + 1, // Insertion
              matrix[i - 1][j] + 1 // Deletion
            )
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Calculate text similarity based on Levenshtein distance
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} - Similarity score (0-1)
   * @private
   */
  calculateTextSimilarity(a, b) {
    if (!a || !b) return 0;

    // Normalize strings
    const normalizedA = this.normalizeText(a);
    const normalizedB = this.normalizeText(b);

    const distance = this.levenshteinDistance(normalizedA, normalizedB);
    const maxLength = Math.max(normalizedA.length, normalizedB.length);

    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }
}

module.exports = MultiProviderOCRService;
