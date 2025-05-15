/**
 * Hash Validator for AI Sports Edge
 * 
 * Validates file integrity by comparing hashes.
 * Supports multiple hash algorithms and comparison strategies.
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

/**
 * Validates file integrity by comparing hashes
 */
class HashValidator {
  /**
   * Generate hash for a file
   * @param {string|Buffer} fileData File path or buffer
   * @param {Object} options Options for hash generation
   * @returns {Promise<Object>} Hash information
   */
  async generateHash(fileData, options = {}) {
    const {
      algorithm = 'sha256',
      encoding = 'hex',
      chunkSize = 0 // 0 means no chunking
    } = options;
    
    try {
      let data;
      let filePath = null;
      
      // Handle file path or buffer
      if (typeof fileData === 'string') {
        filePath = fileData;
        data = await fs.readFile(fileData);
      } else if (Buffer.isBuffer(fileData)) {
        data = fileData;
      } else {
        throw new Error('Invalid file data: must be a file path or buffer');
      }
      
      // Generate full file hash
      const fullHash = this._hashData(data, algorithm, encoding);
      
      // Generate chunk hashes if requested
      let chunkHashes = [];
      if (chunkSize > 0) {
        chunkHashes = this._generateChunkHashes(data, chunkSize, algorithm, encoding);
      }
      
      return {
        path: filePath,
        size: data.length,
        algorithm,
        encoding,
        hash: fullHash,
        chunkHashes,
        chunkSize: chunkSize > 0 ? chunkSize : null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error generating hash:`, error.message);
      throw error;
    }
  }
  
  /**
   * Compare two file hashes
   * @param {Object} hash1 First hash information
   * @param {Object} hash2 Second hash information
   * @param {Object} options Comparison options
   * @returns {Object} Comparison results
   */
  compareHashes(hash1, hash2, options = {}) {
    const {
      compareChunks = true,
      similarityThreshold = 0.8
    } = options;
    
    // Check if algorithms and encodings match
    if (hash1.algorithm !== hash2.algorithm || hash1.encoding !== hash2.encoding) {
      return {
        match: false,
        exactMatch: false,
        similarity: 0,
        reason: 'Hash algorithm or encoding mismatch'
      };
    }
    
    // Check if full hashes match
    const exactMatch = hash1.hash === hash2.hash;
    
    // If exact match, no need to check chunks
    if (exactMatch) {
      return {
        match: true,
        exactMatch: true,
        similarity: 1.0,
        reason: 'Exact hash match'
      };
    }
    
    // If we have chunk hashes and should compare them
    if (compareChunks && hash1.chunkHashes && hash2.chunkHashes && 
        hash1.chunkHashes.length > 0 && hash2.chunkHashes.length > 0) {
      
      // Calculate chunk similarity
      const similarity = this._calculateChunkSimilarity(hash1.chunkHashes, hash2.chunkHashes);
      
      // Check if similarity is above threshold
      const match = similarity >= similarityThreshold;
      
      return {
        match,
        exactMatch: false,
        similarity,
        reason: match ? 'Chunk similarity above threshold' : 'Chunk similarity below threshold'
      };
    }
    
    // If we can't compare chunks, return no match
    return {
      match: false,
      exactMatch: false,
      similarity: 0,
      reason: 'Full hash mismatch and no chunk comparison available'
    };
  }
  
  /**
   * Validate a file against a reference hash
   * @param {string|Buffer} fileData File path or buffer to validate
   * @param {Object} referenceHash Reference hash information
   * @param {Object} options Validation options
   * @returns {Promise<Object>} Validation results
   */
  async validateFile(fileData, referenceHash, options = {}) {
    try {
      // Generate hash for the file
      const fileHash = await this.generateHash(fileData, {
        algorithm: referenceHash.algorithm,
        encoding: referenceHash.encoding,
        chunkSize: referenceHash.chunkSize || 0
      });
      
      // Compare hashes
      const comparison = this.compareHashes(fileHash, referenceHash, options);
      
      return {
        ...comparison,
        fileHash,
        referenceHash,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error validating file:`, error.message);
      throw error;
    }
  }
  
  /**
   * Validate multiple files against reference hashes
   * @param {Array} files Array of files to validate
   * @param {Array} referenceHashes Array of reference hashes
   * @param {Object} options Validation options
   * @returns {Promise<Object>} Validation results
   */
  async validateFiles(files, referenceHashes, options = {}) {
    const results = [];
    const errors = [];
    
    // Create a map of reference hashes by path for quick lookup
    const hashMap = {};
    for (const hash of referenceHashes) {
      if (hash.path) {
        hashMap[hash.path] = hash;
      }
    }
    
    // Validate each file
    for (const file of files) {
      try {
        // Get file path
        const filePath = typeof file === 'string' ? file : file.path;
        
        // Find matching reference hash
        const referenceHash = hashMap[filePath];
        
        if (!referenceHash) {
          errors.push({
            path: filePath,
            error: 'No matching reference hash found'
          });
          continue;
        }
        
        // Validate file
        const result = await this.validateFile(file, referenceHash, options);
        results.push(result);
      } catch (error) {
        errors.push({
          path: typeof file === 'string' ? file : file.path,
          error: error.message
        });
      }
    }
    
    return {
      results,
      errors,
      success: errors.length === 0,
      total: files.length,
      successful: results.length,
      failed: errors.length,
      matches: results.filter(r => r.match).length,
      exactMatches: results.filter(r => r.exactMatch).length,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Generate hash for data
   * @param {Buffer} data Data to hash
   * @param {string} algorithm Hash algorithm
   * @param {string} encoding Hash encoding
   * @returns {string} Hash
   * @private
   */
  _hashData(data, algorithm, encoding) {
    return crypto.createHash(algorithm).update(data).digest(encoding);
  }
  
  /**
   * Generate chunk hashes for data
   * @param {Buffer} data Data to hash
   * @param {number} chunkSize Size of each chunk
   * @param {string} algorithm Hash algorithm
   * @param {string} encoding Hash encoding
   * @returns {Array} Array of chunk hashes
   * @private
   */
  _generateChunkHashes(data, chunkSize, algorithm, encoding) {
    const chunks = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
      const hash = this._hashData(chunk, algorithm, encoding);
      chunks.push(hash);
    }
    
    return chunks;
  }
  
  /**
   * Calculate similarity between chunk hashes
   * @param {Array} chunks1 First array of chunk hashes
   * @param {Array} chunks2 Second array of chunk hashes
   * @returns {number} Similarity (0-1)
   * @private
   */
  _calculateChunkSimilarity(chunks1, chunks2) {
    // Count matching chunks
    let matchingChunks = 0;
    const maxChunks = Math.max(chunks1.length, chunks2.length);
    const minChunks = Math.min(chunks1.length, chunks2.length);
    
    // Compare chunk hashes
    for (let i = 0; i < minChunks; i++) {
      if (chunks1[i] === chunks2[i]) {
        matchingChunks++;
      }
    }
    
    return matchingChunks / maxChunks;
  }
}

module.exports = new HashValidator();