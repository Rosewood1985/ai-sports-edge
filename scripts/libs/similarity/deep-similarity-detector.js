/**
 * Deep Learning-based Similarity Detector for AI Sports Edge
 * 
 * Enhances duplicate detection with deep learning models.
 * Uses TensorFlow.js for advanced text and code embedding.
 * 
 * Note: Requires TensorFlow.js to be installed:
 * npm install @tensorflow/tfjs @tensorflow/tfjs-node
 */

const fs = require('fs').promises;
const path = require('path');
const contentAnalyzer = require('../content/content-analyzer');

// Lazy-load TensorFlow.js to avoid dependency issues if not installed
let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (error) {
  console.warn('TensorFlow.js not available. Using fallback similarity detection.');
}

/**
 * Deep learning-based similarity detector
 */
class DeepSimilarityDetector {
  constructor() {
    this.model = null;
    this.encoder = null;
    this.initialized = false;
    this.documentMap = new Map(); // Maps document IDs to file paths
    this.embeddings = []; // Stores document embeddings
    this.useUniversalSentenceEncoder = true; // Whether to use USE or CodeBERT
    this.embeddingDimension = 512; // USE embedding dimension
    this.similarityThreshold = 0.85; // Default similarity threshold
    this.fallbackToTfIdf = true; // Whether to fall back to TF-IDF if TensorFlow is not available
  }
  
  /**
   * Initialize the detector with file analyses
   * @param {Array} fileAnalyses Collection of file analyses
   * @param {Object} options Configuration options
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(fileAnalyses, options = {}) {
    const {
      modelPath = null,
      useUniversalSentenceEncoder = true,
      embeddingDimension = 512,
      similarityThreshold = 0.85,
      fallbackToTfIdf = true
    } = options;
    
    this.useUniversalSentenceEncoder = useUniversalSentenceEncoder;
    this.embeddingDimension = embeddingDimension;
    this.similarityThreshold = similarityThreshold;
    this.fallbackToTfIdf = fallbackToTfIdf;
    
    // Reset state
    this.documentMap = new Map();
    this.embeddings = [];
    
    // Check if TensorFlow.js is available
    if (!tf) {
      console.warn('TensorFlow.js not available. Using fallback similarity detection.');
      return this.fallbackToTfIdf ? this._initializeFallback(fileAnalyses) : false;
    }
    
    try {
      // Load the Universal Sentence Encoder model
      console.log('Loading Universal Sentence Encoder model...');
      
      if (modelPath) {
        // Load from local path if provided
        this.model = await tf.loadGraphModel(`file://${modelPath}`);
      } else {
        // Load from TensorFlow Hub
        const use = require('@tensorflow-models/universal-sentence-encoder');
        this.encoder = await use.load();
      }
      
      // Process each file
      console.log('Generating embeddings for files...');
      await this._generateEmbeddings(fileAnalyses);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing deep similarity detector:', error.message);
      
      // Fall back to TF-IDF if requested
      if (this.fallbackToTfIdf) {
        console.warn('Falling back to TF-IDF similarity detection.');
        return this._initializeFallback(fileAnalyses);
      }
      
      return false;
    }
  }
  
  /**
   * Initialize fallback TF-IDF similarity detection
   * @param {Array} fileAnalyses Collection of file analyses
   * @returns {Promise<boolean>} Whether initialization was successful
   * @private
   */
  async _initializeFallback(fileAnalyses) {
    try {
      // Use the ML similarity detector as fallback
      const mlSimilarityDetector = require('./ml-similarity-detector');
      await mlSimilarityDetector.initialize(fileAnalyses);
      
      // Store a reference to the fallback detector
      this.fallbackDetector = mlSimilarityDetector;
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing fallback similarity detector:', error.message);
      return false;
    }
  }
  
  /**
   * Generate embeddings for files
   * @param {Array} fileAnalyses Collection of file analyses
   * @returns {Promise<void>}
   * @private
   */
  async _generateEmbeddings(fileAnalyses) {
    // Process each file
    for (let i = 0; i < fileAnalyses.length; i++) {
      const analysis = fileAnalyses[i];
      
      if (!analysis || !analysis.path) continue;
      
      try {
        // Skip binary files
        if (analysis.isBinary) continue;
        
        // Get file content
        let content;
        if (analysis.tokenFingerprint) {
          // Use existing token fingerprint if available
          content = analysis.tokenFingerprint;
        } else {
          // Read file content
          content = await fs.readFile(analysis.path, 'utf8');
          
          // Normalize content based on file type
          content = this._normalizeContent(content, analysis.fileType);
        }
        
        // Generate embedding
        const embedding = await this._embedText(content);
        
        // Store embedding and map document ID to file path
        this.embeddings.push(embedding);
        this.documentMap.set(this.embeddings.length - 1, analysis.path);
      } catch (error) {
        console.error(`Error processing ${analysis.path}:`, error.message);
      }
    }
  }
  
  /**
   * Embed text using the loaded model
   * @param {string} text Text to embed
   * @returns {Promise<tf.Tensor>} Embedding tensor
   * @private
   */
  async _embedText(text) {
    if (!tf) return null;
    
    try {
      // Truncate text if too long (USE has input limits)
      const maxLength = 512;
      const truncatedText = text.length > maxLength ? 
        text.substring(0, maxLength) : 
        text;
      
      // Generate embedding
      if (this.encoder) {
        // Using Universal Sentence Encoder
        const embeddings = await this.encoder.embed(truncatedText);
        return embeddings;
      } else if (this.model) {
        // Using custom loaded model
        const embeddings = await this.model.predict(
          tf.tensor2d([truncatedText])
        );
        return embeddings;
      }
      
      return null;
    } catch (error) {
      console.error('Error embedding text:', error.message);
      return null;
    }
  }
  
  /**
   * Find similar files using deep learning
   * @param {Object} options Configuration options
   * @returns {Promise<Array>} Groups of similar files
   */
  async findSimilarFiles(options = {}) {
    const {
      similarityThreshold = this.similarityThreshold,
      minFileSize = 100,
      ignorePatterns = [],
      maxGroups = 100
    } = options;
    
    if (!this.initialized) {
      throw new Error('Deep similarity detector not initialized. Call initialize() first.');
    }
    
    // If using fallback, delegate to fallback detector
    if (!tf || this.fallbackDetector) {
      console.log('Using fallback similarity detection.');
      return this.fallbackDetector.findSimilarFiles(options);
    }
    
    try {
      // Calculate similarity matrix
      console.log('Calculating similarity matrix...');
      const similarityMatrix = await this._calculateSimilarityMatrix();
      
      // Find groups of similar files
      console.log('Finding groups of similar files...');
      const groups = this._findSimilarGroups(similarityMatrix, similarityThreshold);
      
      // Convert groups to file information
      console.log('Processing similarity groups...');
      const fileGroups = await this._processGroups(groups, ignorePatterns, minFileSize);
      
      // Sort by wasted size and limit number of groups
      return fileGroups
        .sort((a, b) => b.wastedSize - a.wastedSize)
        .slice(0, maxGroups);
    } catch (error) {
      console.error('Error finding similar files:', error.message);
      
      // Fall back to TF-IDF if available
      if (this.fallbackDetector) {
        console.warn('Falling back to TF-IDF similarity detection due to error.');
        return this.fallbackDetector.findSimilarFiles(options);
      }
      
      return [];
    }
  }
  
  /**
   * Calculate similarity matrix for all documents
   * @returns {Promise<Array>} Similarity matrix
   * @private
   */
  async _calculateSimilarityMatrix() {
    const numDocs = this.embeddings.length;
    const matrix = Array(numDocs).fill().map(() => Array(numDocs).fill(0));
    
    // Calculate cosine similarity for each pair of documents
    for (let i = 0; i < numDocs; i++) {
      // Diagonal is always 1 (self-similarity)
      matrix[i][i] = 1;
      
      for (let j = i + 1; j < numDocs; j++) {
        const similarity = await this._calculateCosineSimilarity(
          this.embeddings[i], 
          this.embeddings[j]
        );
        
        matrix[i][j] = similarity;
        matrix[j][i] = similarity; // Symmetric matrix
      }
    }
    
    return matrix;
  }
  
  /**
   * Calculate cosine similarity between two embeddings
   * @param {tf.Tensor} embedding1 First embedding
   * @param {tf.Tensor} embedding2 Second embedding
   * @returns {Promise<number>} Similarity score (0-1)
   * @private
   */
  async _calculateCosineSimilarity(embedding1, embedding2) {
    if (!tf || !embedding1 || !embedding2) return 0;
    
    try {
      // Convert to tensors if not already
      const e1 = embedding1 instanceof tf.Tensor ? embedding1 : tf.tensor(embedding1);
      const e2 = embedding2 instanceof tf.Tensor ? embedding2 : tf.tensor(embedding2);
      
      // Calculate dot product
      const dotProduct = tf.sum(tf.mul(e1, e2));
      
      // Calculate magnitudes
      const mag1 = tf.sqrt(tf.sum(tf.square(e1)));
      const mag2 = tf.sqrt(tf.sum(tf.square(e2)));
      
      // Calculate cosine similarity
      const similarity = tf.div(dotProduct, tf.mul(mag1, mag2));
      
      // Get value as JavaScript number
      const result = (await similarity.data())[0];
      
      // Clean up tensors
      tf.dispose([dotProduct, mag1, mag2, similarity]);
      
      return result;
    } catch (error) {
      console.error('Error calculating cosine similarity:', error.message);
      return 0;
    }
  }
  
  /**
   * Find groups of similar files
   * @param {Array} similarityMatrix Similarity matrix
   * @param {number} threshold Similarity threshold
   * @returns {Array} Groups of document IDs
   * @private
   */
  _findSimilarGroups(similarityMatrix, threshold) {
    const numDocs = similarityMatrix.length;
    const visited = new Set();
    const groups = [];
    
    for (let i = 0; i < numDocs; i++) {
      if (visited.has(i)) continue;
      
      const group = [i];
      visited.add(i);
      
      for (let j = 0; j < numDocs; j++) {
        if (i === j || visited.has(j)) continue;
        
        if (similarityMatrix[i][j] >= threshold) {
          group.push(j);
          visited.add(j);
        }
      }
      
      if (group.length > 1) {
        groups.push(group);
      }
    }
    
    return groups;
  }
  
  /**
   * Process groups into file information
   * @param {Array} groups Groups of document IDs
   * @param {Array} ignorePatterns Patterns to ignore
   * @param {number} minFileSize Minimum file size
   * @returns {Promise<Array>} Groups of file information
   * @private
   */
  async _processGroups(groups, ignorePatterns, minFileSize) {
    const fileGroups = [];
    
    for (const group of groups) {
      // Get file paths
      const filePaths = group.map(docId => this.documentMap.get(docId));
      
      // Get file information
      const files = await Promise.all(filePaths.map(async filePath => {
        try {
          const stats = await fs.stat(filePath);
          return {
            path: filePath,
            size: stats.size,
            type: path.extname(filePath).substring(1)
          };
        } catch (error) {
          console.error(`Error getting stats for ${filePath}:`, error.message);
          return null;
        }
      }));
      
      // Filter out null entries and files that match ignore patterns
      const filteredFiles = files
        .filter(file => file !== null && file.size >= minFileSize)
        .filter(file => !ignorePatterns.some(pattern => 
          new RegExp(pattern).test(file.path)
        ));
      
      // Skip if not enough files after filtering
      if (filteredFiles.length < 2) continue;
      
      // Calculate total and wasted size
      const totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);
      const wastedSize = totalSize - Math.min(...filteredFiles.map(file => file.size));
      
      // Add to groups
      fileGroups.push({
        type: 'deep-similar',
        similarity: 0.9, // Approximate similarity
        files: filteredFiles,
        totalSize,
        wastedSize,
        model: this.useUniversalSentenceEncoder ? 'universal-sentence-encoder' : 'custom'
      });
    }
    
    return fileGroups;
  }
  
  /**
   * Normalize content based on file type
   * @param {string} content File content
   * @param {string} fileType Type of file
   * @returns {string} Normalized content
   * @private
   */
  _normalizeContent(content, fileType) {
    // Remove comments, whitespace, and normalize tokens based on file type
    let processed = content;
    
    if (['js', 'jsx', 'ts', 'tsx'].includes(fileType)) {
      // Remove JS/TS comments and normalize
      processed = processed
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/['"].*?['"]/g, '"STRING"') // Normalize strings
        .toLowerCase(); // Convert to lowercase
    } else if (['css', 'scss', 'less'].includes(fileType)) {
      // Remove CSS comments and normalize
      processed = processed
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/['"].*?['"]/g, '"VALUE"') // Normalize strings
        .toLowerCase(); // Convert to lowercase
    } else if (['html', 'xml', 'svg'].includes(fileType)) {
      // Remove HTML comments and normalize
      processed = processed
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/['"].*?['"]/g, '"ATTR"') // Normalize attribute values
        .toLowerCase(); // Convert to lowercase
    }
    
    return processed;
  }
}

module.exports = new DeepSimilarityDetector();