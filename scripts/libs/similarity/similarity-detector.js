/**
 * Similarity Detector for AI Sports Edge
 * 
 * Detects similar files based on various metrics.
 * Uses the output from the Content Analyzer to find duplicate and similar files.
 */

const path = require('path');

/**
 * Detects similar files based on various metrics
 */
class SimilarityDetector {
  /**
   * Find similar files in a collection
   * @param {Array} fileAnalyses Collection of file analyses
   * @param {Object} options Configuration options
   * @returns {Array} Groups of similar files
   */
  findSimilarFiles(fileAnalyses, options = {}) {
    const {
      exactMatchOnly = false,
      similarityThreshold = 0.8,
      minFileSize = 100, // Ignore tiny files
      ignorePatterns = [],
    } = options;
    
    // Filter out files to ignore
    const filteredAnalyses = fileAnalyses.filter(analysis => {
      if (!analysis) return false;
      if (analysis.fileSize < minFileSize) return false;
      
      // Check against ignore patterns
      return !ignorePatterns.some(pattern => 
        new RegExp(pattern).test(analysis.path)
      );
    });
    
    // Group by exact matches first (identical hash)
    const exactMatches = this._groupByExactMatches(filteredAnalyses);
    
    // If we only want exact matches, return now
    if (exactMatchOnly) {
      return exactMatches;
    }
    
    // Find similar files based on other metrics
    const similarFiles = this._findSimilarFileGroups(
      filteredAnalyses,
      similarityThreshold
    );
    
    // Combine results and remove duplicates
    return this._combineResults(exactMatches, similarFiles);
  }

  /**
   * Group files by exact content match (identical hash)
   * @param {Array} fileAnalyses Collection of file analyses
   * @returns {Array} Groups of identical files
   */
  _groupByExactMatches(fileAnalyses) {
    const hashGroups = {};
    
    // Group by full content hash
    fileAnalyses.forEach(analysis => {
      if (!analysis || !analysis.fullHash) return;
      
      if (!hashGroups[analysis.fullHash]) {
        hashGroups[analysis.fullHash] = [];
      }
      
      hashGroups[analysis.fullHash].push(analysis);
    });
    
    // Convert to array and filter out single-file groups
    return Object.values(hashGroups)
      .filter(group => group.length > 1)
      .map(group => ({
        type: 'exact',
        similarity: 1.0,
        files: group.map(analysis => ({
          path: analysis.path,
          size: analysis.fileSize,
          type: analysis.fileType
        })),
        totalSize: group.reduce((sum, analysis) => sum + analysis.fileSize, 0),
        wastedSize: group.reduce((sum, analysis) => sum + analysis.fileSize, 0) - 
                    Math.min(...group.map(analysis => analysis.fileSize))
      }));
  }

  /**
   * Find groups of similar (but not identical) files
   * @param {Array} fileAnalyses Collection of file analyses
   * @param {number} threshold Similarity threshold (0-1)
   * @returns {Array} Groups of similar files
   */
  _findSimilarFileGroups(fileAnalyses, threshold) {
    const similarGroups = [];
    const processedFiles = new Set();
    
    // First, group files by file type to reduce comparison scope
    const filesByType = {};
    fileAnalyses.forEach(analysis => {
      if (!analysis || !analysis.fileType) return;
      
      if (!filesByType[analysis.fileType]) {
        filesByType[analysis.fileType] = [];
      }
      
      filesByType[analysis.fileType].push(analysis);
    });
    
    // For each file type, compare files for similarity
    Object.entries(filesByType).forEach(([fileType, typeAnalyses]) => {
      for (let i = 0; i < typeAnalyses.length; i++) {
        const analysis1 = typeAnalyses[i];
        
        // Skip if already processed
        if (processedFiles.has(analysis1.path)) continue;
        
        const similarFiles = [];
        
        for (let j = i + 1; j < typeAnalyses.length; j++) {
          const analysis2 = typeAnalyses[j];
          
          // Skip if already processed
          if (processedFiles.has(analysis2.path)) continue;
          
          // Calculate similarity using multiple metrics
          const similarity = this._calculateSimilarity(analysis1, analysis2);
          
          if (similarity >= threshold) {
            // If similar enough, add to group
            if (similarFiles.length === 0) {
              similarFiles.push({
                analysis: analysis1,
                path: analysis1.path,
                size: analysis1.fileSize,
                type: analysis1.fileType
              });
            }
            
            similarFiles.push({
              analysis: analysis2,
              path: analysis2.path,
              size: analysis2.fileSize,
              type: analysis2.fileType
            });
            
            // Mark as processed
            processedFiles.add(analysis2.path);
          }
        }
        
        // If we found similar files, add the group
        if (similarFiles.length > 1) {
          // Mark the first file as processed
          processedFiles.add(analysis1.path);
          
          // Add the group
          similarGroups.push({
            type: 'similar',
            similarity: threshold, // Minimum similarity in the group
            files: similarFiles.map(f => ({
              path: f.path,
              size: f.size,
              type: f.type
            })),
            totalSize: similarFiles.reduce((sum, f) => sum + f.size, 0),
            wastedSize: similarFiles.reduce((sum, f) => sum + f.size, 0) - 
                        Math.min(...similarFiles.map(f => f.size))
          });
        }
      }
    });
    
    return similarGroups;
  }

  /**
   * Calculate similarity between two files using multiple metrics
   * @param {Object} analysis1 Analysis of first file
   * @param {Object} analysis2 Analysis of second file
   * @returns {number} Similarity score (0-1)
   */
  _calculateSimilarity(analysis1, analysis2) {
    // Skip if file types are different
    if (analysis1.fileType !== analysis2.fileType) return 0;
    
    // Calculate various similarity metrics
    const metrics = {
      // Chunk similarity (comparing chunk hashes)
      chunkSimilarity: this._calculateChunkSimilarity(
        analysis1.chunkHashes, 
        analysis2.chunkHashes
      ),
      
      // Token fingerprint similarity
      tokenSimilarity: this._calculateTokenSimilarity(
        analysis1.tokenFingerprint, 
        analysis2.tokenFingerprint
      ),
      
      // Import signature similarity
      importSimilarity: this._calculateImportSimilarity(
        analysis1.importSignature, 
        analysis2.importSignature
      ),
      
      // Structure similarity
      structureSimilarity: this._calculateStructureSimilarity(
        analysis1.structureHash,
        analysis2.structureHash
      )
    };
    
    // Weight and combine metrics
    const weights = {
      chunkSimilarity: 0.5,
      tokenSimilarity: 0.3,
      importSimilarity: 0.1,
      structureSimilarity: 0.1
    };
    
    let totalSimilarity = 0;
    let totalWeight = 0;
    
    Object.entries(metrics).forEach(([metric, value]) => {
      if (value !== null) {
        totalSimilarity += value * weights[metric];
        totalWeight += weights[metric];
      }
    });
    
    return totalWeight > 0 ? totalSimilarity / totalWeight : 0;
  }

  /**
   * Calculate similarity between chunk hashes
   * @param {Array} chunks1 Chunk hashes of first file
   * @param {Array} chunks2 Chunk hashes of second file
   * @returns {number} Similarity score (0-1)
   */
  _calculateChunkSimilarity(chunks1, chunks2) {
    if (!chunks1 || !chunks2 || chunks1.length === 0 || chunks2.length === 0) {
      return null;
    }
    
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

  /**
   * Calculate similarity between token fingerprints
   * @param {string} fingerprint1 Token fingerprint of first file
   * @param {string} fingerprint2 Token fingerprint of second file
   * @returns {number} Similarity score (0-1)
   */
  _calculateTokenSimilarity(fingerprint1, fingerprint2) {
    if (!fingerprint1 || !fingerprint2) {
      return null;
    }
    
    // Split fingerprints into token sets
    const tokens1 = new Set(fingerprint1.split('|'));
    const tokens2 = new Set(fingerprint2.split('|'));
    
    // Calculate Jaccard similarity
    const intersection = new Set(
      [...tokens1].filter(token => tokens2.has(token))
    );
    
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate similarity between import signatures
   * @param {Array} imports1 Imports of first file
   * @param {Array} imports2 Imports of second file
   * @returns {number} Similarity score (0-1)
   */
  _calculateImportSimilarity(imports1, imports2) {
    if (!imports1 || !imports2 || imports1.length === 0 || imports2.length === 0) {
      return null;
    }
    
    // Calculate Jaccard similarity
    const set1 = new Set(imports1);
    const set2 = new Set(imports2);
    
    const intersection = new Set(
      [...set1].filter(imp => set2.has(imp))
    );
    
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate similarity between structure hashes
   * @param {string} structure1 Structure hash of first file
   * @param {string} structure2 Structure hash of second file
   * @returns {number} Similarity score (0-1)
   */
  _calculateStructureSimilarity(structure1, structure2) {
    if (!structure1 || !structure2) {
      return null;
    }
    
    // For function/class structures, use set similarity
    if (structure1.includes('|') && structure2.includes('|')) {
      const funcs1 = new Set(structure1.split('|'));
      const funcs2 = new Set(structure2.split('|'));
      
      const intersection = new Set(
        [...funcs1].filter(func => funcs2.has(func))
      );
      
      const union = new Set([...funcs1, ...funcs2]);
      
      return intersection.size / union.size;
    }
    
    // For other structures, use string similarity
    const maxLength = Math.max(structure1.length, structure2.length);
    const distance = this._levenshteinDistance(structure1, structure2);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Helper function to calculate Levenshtein distance
   * @param {string} a First string
   * @param {string} b Second string
   * @returns {number} Levenshtein distance
   */
  _levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[b.length][a.length];
  }

  /**
   * Combine exact matches and similar files, removing duplicates
   * @param {Array} exactMatches Groups of identical files
   * @param {Array} similarFiles Groups of similar files
   * @returns {Array} Combined groups of files
   */
  _combineResults(exactMatches, similarFiles) {
    // Track files that are already in exact match groups
    const filesInExactMatches = new Set();
    exactMatches.forEach(group => {
      group.files.forEach(file => {
        filesInExactMatches.add(file.path);
      });
    });
    
    // Filter similar files to remove those already in exact matches
    const filteredSimilarFiles = similarFiles.filter(group => {
      // Keep the group only if it has at least 2 files not in exact matches
      const filteredFiles = group.files.filter(
        file => !filesInExactMatches.has(file.path)
      );
      
      if (filteredFiles.length < 2) {
        return false;
      }
      
      // Update group files
      group.files = filteredFiles;
      
      // Recalculate sizes
      group.totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);
      group.wastedSize = group.totalSize - Math.min(...filteredFiles.map(file => file.size));
      
      return true;
    });
    
    // Sort by wasted size (descending)
    return [...exactMatches, ...filteredSimilarFiles].sort(
      (a, b) => b.wastedSize - a.wastedSize
    );
  }
}

module.exports = new SimilarityDetector();