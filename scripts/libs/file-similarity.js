/**
 * File Similarity Detector
 * 
 * Detects files with similar names and content
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Calculates the Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
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
 * Calculates a similarity score between two filenames
 */
function calculateNameSimilarity(name1, name2) {
  // Extract basenames without extensions
  const baseName1 = path.basename(name1, path.extname(name1));
  const baseName2 = path.basename(name2, path.extname(name2));
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(baseName1.toLowerCase(), baseName2.toLowerCase());
  
  // Convert to a similarity score (0-100)
  const maxLength = Math.max(baseName1.length, baseName2.length);
  const similarityScore = Math.round((1 - distance / maxLength) * 100);
  
  return similarityScore;
}

/**
 * Calculate content similarity between two files using TF-IDF approach
 * @param {string} file1Path - Path to first file
 * @param {string} file2Path - Path to second file
 * @returns {number} Similarity score (0-100)
 */
function calculateContentSimilarity(file1Path, file2Path) {
  try {
    // Read file contents
    const content1 = fs.readFileSync(file1Path, 'utf8');
    const content2 = fs.readFileSync(file2Path, 'utf8');
    
    // Tokenize content (split by whitespace and remove empty tokens)
    const tokens1 = content1.split(/\s+/).filter(Boolean);
    const tokens2 = content2.split(/\s+/).filter(Boolean);
    
    // Calculate term frequency (TF)
    const tf1 = calculateTermFrequency(tokens1);
    const tf2 = calculateTermFrequency(tokens2);
    
    // Calculate document frequency (DF)
    const allTokens = [...new Set([...Object.keys(tf1), ...Object.keys(tf2)])];
    const df = {};
    
    for (const token of allTokens) {
      df[token] = 0;
      if (tf1[token]) df[token]++;
      if (tf2[token]) df[token]++;
    }
    
    // Calculate TF-IDF vectors
    const tfidf1 = {};
    const tfidf2 = {};
    
    for (const token of allTokens) {
      const idf = Math.log(2 / df[token]); // IDF = log(N/df), where N=2 (two documents)
      tfidf1[token] = (tf1[token] || 0) * idf;
      tfidf2[token] = (tf2[token] || 0) * idf;
    }
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (const token of allTokens) {
      dotProduct += (tfidf1[token] || 0) * (tfidf2[token] || 0);
      magnitude1 += Math.pow(tfidf1[token] || 0, 2);
      magnitude2 += Math.pow(tfidf2[token] || 0, 2);
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    const similarity = dotProduct / (magnitude1 * magnitude2);
    
    // Convert to percentage
    return Math.round(similarity * 100);
  } catch (error) {
    console.error(`Error calculating content similarity between ${file1Path} and ${file2Path}:`, error.message);
    return 0;
  }
}

/**
 * Calculate term frequency for a list of tokens
 * @param {Array} tokens - Array of tokens
 * @returns {Object} Term frequency object
 */
function calculateTermFrequency(tokens) {
  const tf = {};
  
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  
  // Normalize by document length
  for (const token in tf) {
    tf[token] /= tokens.length;
  }
  
  return tf;
}

/**
 * Finds files with similar names and content in the project
 * @param {string} filePath - Path to the file
 * @returns {Array} Array of similar file objects
 */
async function findSimilarFiles(filePath) {
  const fileName = path.basename(filePath);
  const results = [];
  
  try {
    // Find all files with the same extension
    const fileExt = path.extname(filePath);
    const allFiles = execSync(`find ./src -type f -name "*${fileExt}"`)
      .toString()
      .split('\n')
      .filter(Boolean)
      .filter(f => f !== filePath); // Exclude the file itself
    
    // Check for name similarity
    for (const file of allFiles) {
      const nameSimilarityScore = calculateNameSimilarity(fileName, path.basename(file));
      
      // If name similarity is above threshold, check content similarity
      if (nameSimilarityScore > 50) {
        const contentSimilarityScore = calculateContentSimilarity(filePath, file);
        
        // Calculate combined similarity score (weighted average)
        const combinedScore = Math.round((nameSimilarityScore * 0.4) + (contentSimilarityScore * 0.6));
        
        // If combined similarity is above threshold, add to results
        if (combinedScore > 60) {
          results.push({
            path: file,
            nameSimilarityScore,
            contentSimilarityScore,
            combinedScore
          });
        }
      }
    }
    
    // Sort by combined similarity score
    results.sort((a, b) => b.combinedScore - a.combinedScore);
    
    return results;
  } catch (error) {
    console.error('Error finding similar files:', error.message);
    return [];
  }
}

module.exports = {
  findSimilarFiles,
  calculateNameSimilarity,
  calculateContentSimilarity
};