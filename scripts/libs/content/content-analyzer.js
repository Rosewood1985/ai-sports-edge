/**
 * Content Analyzer for AI Sports Edge
 * 
 * Analyzes file content and generates various fingerprints and hashes
 * that can be used to detect duplicates.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { getFileType } = require('./file-type-detector');

/**
 * Creates fingerprints and hashes for file content
 */
class ContentAnalyzer {
  /**
   * Analyze file content and generate various fingerprints
   * @param {string} filePath Path to the file
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileType = getFileType(filePath, content);
      const fileSize = (await fs.stat(filePath)).size;
      
      return {
        path: filePath,
        fullHash: this._generateFullHash(content),
        chunkHashes: this._generateChunkHashes(content),
        tokenFingerprint: this._generateTokenFingerprint(content, fileType),
        importSignature: this._extractImportSignature(content, fileType),
        structureHash: this._generateStructureHash(content, fileType),
        fileSize,
        fileType,
        lineCount: content.split('\n').length,
        analyzed: new Date().toISOString()
      };
    } catch (error) {
      // Handle binary files or read errors
      if (error.code === 'ERR_INVALID_ARG_VALUE' || error.message.includes('non-utf8')) {
        return this._analyzeBinaryFile(filePath);
      }
      console.error(`Error analyzing ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Generate a full hash of file content
   * @param {string} content File content
   * @returns {string} SHA-256 hash
   */
  _generateFullHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate hashes for chunks of the file
   * @param {string} content File content
   * @returns {string[]} Array of chunk hashes
   */
  _generateChunkHashes(content) {
    // Split content into chunks of ~1000 chars
    const chunkSize = 1000;
    const chunks = [];
    
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.substring(i, i + chunkSize);
      chunks.push(crypto.createHash('md5').update(chunk).digest('hex'));
    }
    
    return chunks;
  }

  /**
   * Generate a fingerprint based on tokenized content
   * @param {string} content File content
   * @param {string} fileType Type of file
   * @returns {string} Token fingerprint
   */
  _generateTokenFingerprint(content, fileType) {
    // Remove comments, whitespace, and normalize tokens based on file type
    let processed = content;
    
    if (['js', 'jsx', 'ts', 'tsx'].includes(fileType)) {
      // Remove JS/TS comments and normalize
      processed = this._normalizeJsContent(content);
    } else if (['css', 'scss', 'less'].includes(fileType)) {
      // Remove CSS comments and normalize
      processed = this._normalizeCssContent(content);
    } else if (['html', 'xml', 'svg'].includes(fileType)) {
      // Remove HTML comments and normalize
      processed = this._normalizeHtmlContent(content);
    }
    
    // Create a MinHash-like fingerprint
    const tokens = processed.split(/\s+/).filter(Boolean);
    const tokenHash = new Set();
    
    // Select a subset of tokens for the fingerprint
    for (let i = 0; i < tokens.length; i += 3) {
      if (tokens[i] && tokens[i].length > 3) {
        tokenHash.add(tokens[i]);
      }
    }
    
    return Array.from(tokenHash).sort().join('|');
  }

  /**
   * Extract imports/includes from file
   * @param {string} content File content
   * @param {string} fileType Type of file
   * @returns {string[]} Array of imports
   */
  _extractImportSignature(content, fileType) {
    const imports = [];
    
    if (['js', 'jsx', 'ts', 'tsx'].includes(fileType)) {
      // Match import statements
      const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:[^{}\s]+))\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      // Match require statements
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    } else if (['html'].includes(fileType)) {
      // Match script and link tags
      const scriptRegex = /<script[^>]*src=['"]([^'"]+)['"]/g;
      let match;
      while ((match = scriptRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      const linkRegex = /<link[^>]*href=['"]([^'"]+)['"]/g;
      while ((match = linkRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }
    
    return imports.sort();
  }

  /**
   * Generate a hash representing code structure
   * @param {string} content File content
   * @param {string} fileType Type of file
   * @returns {string} Structure hash
   */
  _generateStructureHash(content, fileType) {
    if (['js', 'jsx', 'ts', 'tsx'].includes(fileType)) {
      // Extract functions and class definitions
      const functionRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)|class\s+(\w+))/g;
      const matches = [];
      let match;
      
      while ((match = functionRegex.exec(content)) !== null) {
        // Get the captured name (only one of the groups will have a value)
        const name = match[1] || match[2] || match[3];
        if (name) matches.push(name);
      }
      
      return matches.sort().join('|');
    }
    
    // For other file types, return a simpler structure hash
    return content.replace(/\s+/g, ' ').slice(0, 100);
  }

  /**
   * Analyze binary files
   * @param {string} filePath Path to binary file
   * @returns {Promise<Object>} Analysis results
   */
  async _analyzeBinaryFile(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const fileSize = buffer.length;
      const fileType = getFileType(filePath);
      
      // For binary files, use a buffer hash
      const fullHash = crypto
        .createHash('sha256')
        .update(buffer)
        .digest('hex');
      
      // Create chunk hashes for binary files
      const chunkSize = 4096;
      const chunkHashes = [];
      
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));
        chunkHashes.push(crypto.createHash('md5').update(chunk).digest('hex'));
      }
      
      return {
        path: filePath,
        fullHash,
        chunkHashes,
        tokenFingerprint: null, // Not applicable for binary
        importSignature: null, // Not applicable for binary
        structureHash: null, // Not applicable for binary
        fileSize,
        fileType,
        lineCount: null, // Not applicable for binary
        analyzed: new Date().toISOString(),
        isBinary: true
      };
    } catch (error) {
      console.error(`Error analyzing binary file ${filePath}:`, error.message);
      return null;
    }
  }

  // Helper normalization functions

  _normalizeJsContent(content) {
    return content
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/['"].*?['"]/g, '"STRING"') // Normalize strings
      .toLowerCase(); // Convert to lowercase
  }

  _normalizeCssContent(content) {
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/['"].*?['"]/g, '"VALUE"') // Normalize strings
      .toLowerCase(); // Convert to lowercase
  }

  _normalizeHtmlContent(content) {
    return content
      .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/['"].*?['"]/g, '"ATTR"') // Normalize attribute values
      .toLowerCase(); // Convert to lowercase
  }
}

module.exports = new ContentAnalyzer();