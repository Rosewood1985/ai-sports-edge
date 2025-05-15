/**
 * ML-based Similarity Detector for AI Sports Edge
 * 
 * Enhances duplicate detection with machine learning capabilities.
 * Uses TF-IDF, cosine similarity, and clustering for advanced similarity detection.
 */

const path = require('path');
const fs = require('fs').promises;
const natural = require('natural'); // You may need to install this: npm install natural
const contentAnalyzer = require('../content/content-analyzer');

/**
 * ML-based similarity detector for enhanced duplicate detection
 */
class MLSimilarityDetector {
  constructor() {
    this.tfidf = new natural.TfIdf();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.documentMap = new Map(); // Maps document IDs to file paths
    this.initialized = false;
    this.clusterThreshold = 0.7; // Threshold for clustering
  }
  
  /**
   * Initialize the detector with file analyses
   * @param {Array} fileAnalyses Collection of file analyses
   * @returns {Promise<void>}
   */
  async initialize(fileAnalyses) {
    // Reset state
    this.tfidf = new natural.TfIdf();
    this.documentMap = new Map();
    
    // Process each file
    for (let i = 0; i < fileAnalyses.length; i++) {
      const analysis = fileAnalyses[i];
      
      if (!analysis || !analysis.path) continue;
      
      try {
        // Get file content if not binary
        if (analysis.isBinary) continue;
        
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
        
        // Add to TF-IDF
        this.tfidf.addDocument(content);
        
        // Map document ID to file path
        this.documentMap.set(i, analysis.path);
      } catch (error) {
        console.error(`Error processing ${analysis.path}:`, error.message);
      }
    }
    
    this.initialized = true;
  }
  
  /**
   * Find similar files using ML techniques
   * @param {Object} options Configuration options
   * @returns {Promise<Array>} Groups of similar files
   */
  async findSimilarFiles(options = {}) {
    const {
      similarityThreshold = 0.8,
      minFileSize = 100,
      ignorePatterns = [],
      clusteringMethod = 'hierarchical', // 'hierarchical' or 'kmeans'
      maxClusters = 0 // 0 means auto-determine
    } = options;
    
    if (!this.initialized) {
      throw new Error('ML Similarity Detector not initialized. Call initialize() first.');
    }
    
    // Calculate similarity matrix
    const similarityMatrix = this._calculateSimilarityMatrix();
    
    // Cluster documents
    let clusters;
    if (clusteringMethod === 'hierarchical') {
      clusters = this._hierarchicalClustering(similarityMatrix, similarityThreshold);
    } else if (clusteringMethod === 'kmeans') {
      const k = maxClusters > 0 ? maxClusters : this._estimateOptimalClusters(similarityMatrix);
      clusters = this._kMeansClustering(similarityMatrix, k);
    } else {
      throw new Error(`Unknown clustering method: ${clusteringMethod}`);
    }
    
    // Convert clusters to file groups
    const groups = [];
    
    for (const cluster of clusters) {
      // Skip clusters with only one file
      if (cluster.length < 2) continue;
      
      // Get file paths for this cluster
      const files = cluster.map(docId => ({
        path: this.documentMap.get(docId),
        // Get file size and type from the file system
        size: fs.statSync(this.documentMap.get(docId)).size,
        type: path.extname(this.documentMap.get(docId)).substring(1)
      }));
      
      // Filter out files that match ignore patterns
      const filteredFiles = files.filter(file => 
        !ignorePatterns.some(pattern => new RegExp(pattern).test(file.path))
      );
      
      // Skip if not enough files after filtering
      if (filteredFiles.length < 2) continue;
      
      // Calculate average similarity within the cluster
      let totalSimilarity = 0;
      let pairCount = 0;
      
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          totalSimilarity += similarityMatrix[cluster[i]][cluster[j]];
          pairCount++;
        }
      }
      
      const avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;
      
      // Calculate total and wasted size
      const totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);
      const wastedSize = totalSize - Math.min(...filteredFiles.map(file => file.size));
      
      // Add to groups
      groups.push({
        type: 'ml-similar',
        similarity: avgSimilarity,
        files: filteredFiles,
        totalSize,
        wastedSize,
        clusteringMethod,
        clusterSize: cluster.length
      });
    }
    
    // Sort by wasted size (descending)
    return groups.sort((a, b) => b.wastedSize - a.wastedSize);
  }
  
  /**
   * Calculate similarity matrix for all documents
   * @returns {Array} Similarity matrix
   * @private
   */
  _calculateSimilarityMatrix() {
    const numDocs = this.documentMap.size;
    const matrix = Array(numDocs).fill().map(() => Array(numDocs).fill(0));
    
    // Calculate cosine similarity for each pair of documents
    for (let i = 0; i < numDocs; i++) {
      // Diagonal is always 1 (self-similarity)
      matrix[i][i] = 1;
      
      for (let j = i + 1; j < numDocs; j++) {
        const similarity = this._calculateCosineSimilarity(i, j);
        matrix[i][j] = similarity;
        matrix[j][i] = similarity; // Symmetric matrix
      }
    }
    
    return matrix;
  }
  
  /**
   * Calculate cosine similarity between two documents
   * @param {number} doc1 First document ID
   * @param {number} doc2 Second document ID
   * @returns {number} Similarity score (0-1)
   * @private
   */
  _calculateCosineSimilarity(doc1, doc2) {
    // Get TF-IDF vectors for both documents
    const vector1 = this.tfidf.vector(doc1);
    const vector2 = this.tfidf.vector(doc2);
    
    // Calculate dot product
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    // Combine all terms from both vectors
    const allTerms = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);
    
    for (const term of allTerms) {
      const val1 = vector1[term] || 0;
      const val2 = vector2[term] || 0;
      
      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    // Avoid division by zero
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  /**
   * Perform hierarchical clustering on the similarity matrix
   * @param {Array} similarityMatrix Similarity matrix
   * @param {number} threshold Similarity threshold for clustering
   * @returns {Array} Clusters of document IDs
   * @private
   */
  _hierarchicalClustering(similarityMatrix, threshold) {
    const numDocs = similarityMatrix.length;
    
    // Initialize each document as its own cluster
    let clusters = Array(numDocs).fill().map((_, i) => [i]);
    
    // Merge clusters until no more merges are possible
    let merged = true;
    while (merged) {
      merged = false;
      
      // Find the most similar pair of clusters
      let maxSimilarity = -1;
      let mergeI = -1;
      let mergeJ = -1;
      
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          // Calculate average similarity between clusters
          let totalSimilarity = 0;
          let pairCount = 0;
          
          for (const docI of clusters[i]) {
            for (const docJ of clusters[j]) {
              totalSimilarity += similarityMatrix[docI][docJ];
              pairCount++;
            }
          }
          
          const avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;
          
          if (avgSimilarity > threshold && avgSimilarity > maxSimilarity) {
            maxSimilarity = avgSimilarity;
            mergeI = i;
            mergeJ = j;
          }
        }
      }
      
      // Merge the most similar clusters
      if (mergeI !== -1 && mergeJ !== -1) {
        clusters[mergeI] = [...clusters[mergeI], ...clusters[mergeJ]];
        clusters.splice(mergeJ, 1);
        merged = true;
      }
    }
    
    return clusters;
  }
  
  /**
   * Perform k-means clustering on the similarity matrix
   * @param {Array} similarityMatrix Similarity matrix
   * @param {number} k Number of clusters
   * @returns {Array} Clusters of document IDs
   * @private
   */
  _kMeansClustering(similarityMatrix, k) {
    const numDocs = similarityMatrix.length;
    
    // Initialize k random centroids
    const centroids = [];
    const used = new Set();
    
    for (let i = 0; i < k; i++) {
      let centroidIdx;
      do {
        centroidIdx = Math.floor(Math.random() * numDocs);
      } while (used.has(centroidIdx));
      
      used.add(centroidIdx);
      centroids.push(similarityMatrix[centroidIdx]);
    }
    
    // Initialize clusters
    let clusters = Array(k).fill().map(() => []);
    let prevClusters = null;
    let iterations = 0;
    const maxIterations = 100;
    
    // Iterate until convergence or max iterations
    while (iterations < maxIterations) {
      // Assign each document to the nearest centroid
      clusters = Array(k).fill().map(() => []);
      
      for (let i = 0; i < numDocs; i++) {
        let maxSimilarity = -1;
        let bestCluster = 0;
        
        for (let j = 0; j < k; j++) {
          // Calculate similarity to centroid
          const similarity = this._vectorSimilarity(similarityMatrix[i], centroids[j]);
          
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestCluster = j;
          }
        }
        
        clusters[bestCluster].push(i);
      }
      
      // Check for convergence
      if (this._clustersEqual(clusters, prevClusters)) {
        break;
      }
      
      prevClusters = JSON.parse(JSON.stringify(clusters));
      
      // Update centroids
      for (let i = 0; i < k; i++) {
        if (clusters[i].length === 0) continue;
        
        // Calculate average vector for the cluster
        const avgVector = Array(numDocs).fill(0);
        
        for (const docId of clusters[i]) {
          for (let j = 0; j < numDocs; j++) {
            avgVector[j] += similarityMatrix[docId][j];
          }
        }
        
        for (let j = 0; j < numDocs; j++) {
          avgVector[j] /= clusters[i].length;
        }
        
        centroids[i] = avgVector;
      }
      
      iterations++;
    }
    
    // Filter out empty clusters
    return clusters.filter(cluster => cluster.length > 0);
  }
  
  /**
   * Calculate similarity between two vectors
   * @param {Array} vec1 First vector
   * @param {Array} vec2 Second vector
   * @returns {number} Similarity score (0-1)
   * @private
   */
  _vectorSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    // Avoid division by zero
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  /**
   * Check if two cluster assignments are equal
   * @param {Array} clusters1 First clusters
   * @param {Array} clusters2 Second clusters
   * @returns {boolean} Whether the clusters are equal
   * @private
   */
  _clustersEqual(clusters1, clusters2) {
    if (!clusters1 || !clusters2) return false;
    if (clusters1.length !== clusters2.length) return false;
    
    for (let i = 0; i < clusters1.length; i++) {
      if (clusters1[i].length !== clusters2[i].length) return false;
      
      const set1 = new Set(clusters1[i]);
      for (const item of clusters2[i]) {
        if (!set1.has(item)) return false;
      }
    }
    
    return true;
  }
  
  /**
   * Estimate optimal number of clusters using the elbow method
   * @param {Array} similarityMatrix Similarity matrix
   * @returns {number} Estimated optimal number of clusters
   * @private
   */
  _estimateOptimalClusters(similarityMatrix) {
    const numDocs = similarityMatrix.length;
    const maxClusters = Math.min(10, Math.floor(numDocs / 2));
    
    // Default to 2 clusters for small datasets
    if (numDocs < 5) return 2;
    
    // For larger datasets, use a heuristic
    // This is a simplified approach - in a real implementation,
    // you would use the elbow method or silhouette analysis
    return Math.max(2, Math.floor(Math.sqrt(numDocs / 2)));
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
    
    // Tokenize, stem, and rejoin
    let tokens = [];
    try {
      tokens = this.tokenizer.tokenize(processed) || [];
    } catch (error) {
      console.error('Error tokenizing content:', error.message);
      tokens = processed.split(/\s+/);
    }
    
    const stemmed = tokens.map(token => {
      try {
        return this.stemmer.stem(token);
      } catch (error) {
        return token;
      }
    });
    
    return stemmed.join(' ');
  }
}

module.exports = new MLSimilarityDetector();