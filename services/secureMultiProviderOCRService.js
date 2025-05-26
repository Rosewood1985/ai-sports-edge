/**
 * Secure Multi-Provider OCR Service
 * 
 * SECURITY-HARDENED VERSION that replaces the vulnerable multiProviderOCRService.js
 * Provides secure OCR processing with validated command execution and proper error handling.
 */

const { secureCommandService, CommandSecurityError } = require('./secureCommandService');
const { secureFileUploadService, SecurityError } = require('./secureFileUploadService');
const path = require('path');
const fs = require('fs').promises;

/**
 * Secure Multi-Provider OCR Service
 * Currently supports only Tesseract for security reasons
 */
class SecureMultiProviderOCRService {
  constructor() {
    this.supportedProviders = {
      tesseract: {
        name: 'Tesseract',
        available: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        supportedFormats: ['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'gif'],
        timeout: 120000 // 2 minutes
      }
    };
  }

  /**
   * Processes OCR using multiple providers securely
   * @param {string} imagePath - Secure image path
   * @param {Array<string>} providers - List of providers to use
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Combined OCR result
   */
  async processWithMultipleProviders(imagePath, providers = ['tesseract'], options = {}) {
    try {
      // Validate image path
      const validatedPath = secureFileUploadService.validatePathForOCR(imagePath);
      
      // Filter to only supported and available providers
      const availableProviders = providers.filter(provider => 
        this.supportedProviders[provider]?.available
      );
      
      if (availableProviders.length === 0) {
        availableProviders.push('tesseract'); // Default to tesseract
      }
      
      console.log(`[SECURE MULTI-OCR] Processing with providers: ${availableProviders.join(', ')}`);
      
      const results = [];
      const errors = [];
      
      // Process with each provider sequentially for security
      for (const provider of availableProviders) {
        try {
          const result = await this.processWithProvider(validatedPath, provider, options);
          results.push({
            provider,
            ...result,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.warn(`[SECURE MULTI-OCR] Provider ${provider} failed:`, error.message);
          errors.push({
            provider,
            error: error.message,
            code: error.code || 'PROVIDER_FAILED'
          });
        }
      }
      
      if (results.length === 0) {
        throw new SecurityError(
          `All OCR providers failed. Errors: ${JSON.stringify(errors)}`,
          'ALL_PROVIDERS_FAILED'
        );
      }
      
      // Combine results with consensus algorithm
      const combinedResult = this.combineResults(results);
      
      return {
        success: true,
        providers: availableProviders,
        results,
        errors,
        combined: combinedResult,
        providerCount: results.length,
        securityValidated: true
      };
      
    } catch (error) {
      throw new SecurityError(
        `Multi-provider OCR failed: ${error.message}`,
        'MULTI_PROVIDER_FAILED'
      );
    }
  }

  /**
   * Processes OCR with a single provider securely
   * @param {string} imagePath - Validated image path
   * @param {string} provider - Provider name
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} OCR result
   */
  async processWithProvider(imagePath, provider, options = {}) {
    const providerConfig = this.supportedProviders[provider];
    
    if (!providerConfig || !providerConfig.available) {
      throw new SecurityError(
        `Provider not available: ${provider}`,
        'PROVIDER_NOT_AVAILABLE'
      );
    }
    
    // Validate file size
    const fileStats = await fs.stat(imagePath);
    if (fileStats.size > providerConfig.maxFileSize) {
      throw new SecurityError(
        `File too large for provider ${provider}: ${fileStats.size} bytes`,
        'FILE_TOO_LARGE'
      );
    }
    
    switch (provider) {
      case 'tesseract':
        return this.processTesseractSecure(imagePath, options);
        
      default:
        throw new SecurityError(
          `Unsupported provider: ${provider}`,
          'UNSUPPORTED_PROVIDER'
        );
    }
  }

  /**
   * Processes OCR using Tesseract securely
   * @param {string} imagePath - Validated image path
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Tesseract result
   */
  async processTesseractSecure(imagePath, options = {}) {
    const {
      language = 'eng',
      oem = '3',
      psm = '6',
      configOptions = {}
    } = options;
    
    try {
      // Validate language parameter
      const validLanguage = this.validateLanguageCode(language);
      
      // Build secure command arguments
      const args = [
        imagePath,
        'stdout',
        '-l', validLanguage,
        '--oem', oem,
        '--psm', psm
      ];
      
      // Add configuration options securely
      for (const [key, value] of Object.entries(configOptions)) {
        if (this.isValidTesseractConfig(key, value)) {
          args.push('-c', `${key}=${value}`);
        }
      }
      
      console.log(`[SECURE TESSERACT] Processing: ${path.basename(imagePath)} with language: ${validLanguage}`);
      
      // Execute secure Tesseract command
      const result = await secureCommandService.executeSecureCommand(
        'tesseract',
        args,
        {
          timeout: this.supportedProviders.tesseract.timeout,
          cwd: path.dirname(imagePath)
        }
      );
      
      if (result.exitCode !== 0) {
        throw new CommandSecurityError(
          `Tesseract failed with exit code ${result.exitCode}: ${result.stderr}`,
          'TESSERACT_EXECUTION_FAILED'
        );
      }
      
      // Parse and validate output
      const parsedResult = this.parseTesseractOutput(result.stdout, result.stderr);
      
      return {
        fullText: parsedResult.text,
        confidence: parsedResult.confidence,
        wordConfidences: parsedResult.wordConfidences,
        textBlocks: parsedResult.textBlocks,
        executionTime: result.executionTime,
        language: validLanguage,
        provider: 'tesseract',
        securityValidated: true
      };
      
    } catch (error) {
      throw new CommandSecurityError(
        `Secure Tesseract processing failed: ${error.message}`,
        'TESSERACT_PROCESSING_FAILED'
      );
    }
  }

  /**
   * Validates language code for Tesseract
   * @param {string} language - Language code
   * @returns {string} Validated language code
   */
  validateLanguageCode(language) {
    // Whitelist of allowed language codes
    const allowedLanguages = [
      'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus', 'chi_sim', 'chi_tra',
      'jpn', 'kor', 'ara', 'hin', 'tha', 'vie', 'nld', 'swe', 'nor', 'dan',
      'fin', 'pol', 'ces', 'hun', 'tur', 'grc', 'heb', 'ukr', 'bul', 'hrv'
    ];
    
    if (!language || typeof language !== 'string') {
      return 'eng'; // Default to English
    }
    
    const cleanLanguage = language.toLowerCase().replace(/[^a-z_]/g, '');
    
    if (allowedLanguages.includes(cleanLanguage)) {
      return cleanLanguage;
    }
    
    // If not in whitelist, default to English
    console.warn(`[SECURE TESSERACT] Invalid language code: ${language}, defaulting to 'eng'`);
    return 'eng';
  }

  /**
   * Validates Tesseract configuration options
   * @param {string} key - Configuration key
   * @param {string} value - Configuration value
   * @returns {boolean} True if valid
   */
  isValidTesseractConfig(key, value) {
    // Whitelist of allowed configuration options
    const allowedConfigs = {
      'tessedit_char_whitelist': /^[a-zA-Z0-9\s\-.,;:!?()[\]{}'"@#$%^&*+=<>|\\\/~`]*$/,
      'tessedit_char_blacklist': /^[a-zA-Z0-9\s\-.,;:!?()[\]{}'"@#$%^&*+=<>|\\\/~`]*$/,
      'load_system_dawg': /^[01]$/,
      'load_freq_dawg': /^[01]$/,
      'load_unambig_dawg': /^[01]$/,
      'load_punc_dawg': /^[01]$/,
      'load_number_dawg': /^[01]$/,
      'textord_debug_tabfind': /^[01]$/,
      'preserve_interword_spaces': /^[01]$/
    };
    
    if (!allowedConfigs[key]) {
      console.warn(`[SECURE TESSERACT] Unknown config option: ${key}`);
      return false;
    }
    
    if (!allowedConfigs[key].test(String(value))) {
      console.warn(`[SECURE TESSERACT] Invalid config value for ${key}: ${value}`);
      return false;
    }
    
    return true;
  }

  /**
   * Parses Tesseract output securely
   * @param {string} stdout - Standard output
   * @param {string} stderr - Standard error
   * @returns {Object} Parsed result
   */
  parseTesseractOutput(stdout, stderr) {
    const text = (stdout || '').trim();
    
    // Calculate basic confidence based on output quality
    let confidence = 0.5;
    
    if (text.length > 0) {
      confidence += 0.2;
    }
    
    if (text.length > 50) {
      confidence += 0.1;
    }
    
    // Check for warnings in stderr
    if (stderr) {
      if (stderr.includes('Warning')) {
        confidence -= 0.1;
      }
      if (stderr.includes('Error')) {
        confidence -= 0.2;
      }
    }
    
    confidence = Math.max(0, Math.min(1, confidence));
    
    // Parse text into words with confidence
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordConfidences = words.map(word => ({
      text: word,
      confidence: confidence,
      boundingBox: null
    }));
    
    // Parse text into blocks (simple line-based parsing)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const textBlocks = lines.map((line, index) => ({
      text: line.trim(),
      confidence: confidence,
      boundingBox: null,
      blockIndex: index
    }));
    
    return {
      text,
      confidence,
      wordConfidences,
      textBlocks
    };
  }

  /**
   * Combines results from multiple providers using consensus algorithm
   * @param {Array<Object>} results - Results from different providers
   * @returns {Object} Combined result
   */
  combineResults(results) {
    if (results.length === 0) {
      return {
        fullText: '',
        confidence: 0,
        consensus: 'no_results'
      };
    }
    
    if (results.length === 1) {
      return {
        fullText: results[0].fullText,
        confidence: results[0].confidence,
        consensus: 'single_provider',
        sourceProvider: results[0].provider
      };
    }
    
    // Simple consensus: use result with highest confidence
    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    // Calculate average confidence
    const avgConfidence = results.reduce((sum, result) => 
      sum + result.confidence, 0) / results.length;
    
    // Check for text similarity (basic implementation)
    const textSimilarity = this.calculateTextSimilarity(results);
    
    return {
      fullText: bestResult.fullText,
      confidence: Math.min(bestResult.confidence, avgConfidence + 0.1),
      consensus: textSimilarity > 0.7 ? 'high_agreement' : 'low_agreement',
      sourceProvider: bestResult.provider,
      providerCount: results.length,
      textSimilarity,
      averageConfidence: avgConfidence
    };
  }

  /**
   * Calculates text similarity between results
   * @param {Array<Object>} results - OCR results
   * @returns {number} Similarity score (0-1)
   */
  calculateTextSimilarity(results) {
    if (results.length < 2) {
      return 1.0;
    }
    
    const texts = results.map(r => r.fullText.toLowerCase());
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const similarity = this.calculateLevenshteinSimilarity(texts[i], texts[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Calculates Levenshtein similarity between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateLevenshteinSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  }

  /**
   * Calculates Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Gets available providers
   * @returns {Array<string>} Available provider names
   */
  getAvailableProviders() {
    return Object.keys(this.supportedProviders).filter(
      provider => this.supportedProviders[provider].available
    );
  }

  /**
   * Gets provider information
   * @param {string} provider - Provider name
   * @returns {Object} Provider information
   */
  getProviderInfo(provider) {
    return this.supportedProviders[provider] || null;
  }

  /**
   * Validates if provider is available
   * @param {string} provider - Provider name
   * @returns {boolean} True if available
   */
  isProviderAvailable(provider) {
    return this.supportedProviders[provider]?.available || false;
  }
}

// Export singleton instance
const secureMultiProviderOCRService = new SecureMultiProviderOCRService();

module.exports = {
  SecureMultiProviderOCRService,
  secureMultiProviderOCRService
};