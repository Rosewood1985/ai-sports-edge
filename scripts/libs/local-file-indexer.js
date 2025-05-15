/**
 * Local File Indexer for AI Sports Edge
 * 
 * Indexes local build files and computes checksums.
 * Used by the Post-Deploy Validation script to compare local and remote files.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Compute MD5 checksum of a file
 * @param {string} filePath - Path to the file
 * @returns {string} MD5 checksum
 */
function computeChecksum(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.error(`Error computing checksum for ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get file metadata
 * @param {string} filePath - Path to the file
 * @returns {Object} File metadata
 */
function getFileMetadata(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString()
    };
  } catch (error) {
    console.error(`Error getting metadata for ${filePath}:`, error.message);
    return {
      size: 0,
      modified: null,
      created: null
    };
  }
}

/**
 * Index files in a directory
 * @param {string} directory - Directory to index
 * @param {Array} filePatterns - Array of file patterns to include
 * @returns {Array} Array of file objects with path, checksum, and metadata
 */
function indexFiles(directory, filePatterns = []) {
  try {
    if (!fs.existsSync(directory)) {
      console.error(`Directory ${directory} does not exist`);
      return [];
    }
    
    const files = [];
    
    // If no patterns provided, index all files
    if (filePatterns.length === 0) {
      const allFiles = fs.readdirSync(directory, { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name);
      
      filePatterns = allFiles;
    }
    
    // Process each file pattern
    for (const pattern of filePatterns) {
      // Check if the pattern is a direct file match
      const filePath = path.join(directory, pattern);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const checksum = computeChecksum(filePath);
        const metadata = getFileMetadata(filePath);
        
        files.push({
          path: filePath,
          relativePath: pattern,
          checksum,
          metadata
        });
        continue;
      }
      
      // If not a direct match, try glob pattern matching
      // In a real implementation, we would use a glob library
      // For now, we'll just do a simple check for common patterns
      if (pattern.includes('*')) {
        const extension = pattern.replace('*', '');
        
        fs.readdirSync(directory, { withFileTypes: true })
          .filter(dirent => dirent.isFile() && dirent.name.endsWith(extension))
          .forEach(dirent => {
            const filePath = path.join(directory, dirent.name);
            const checksum = computeChecksum(filePath);
            const metadata = getFileMetadata(filePath);
            
            files.push({
              path: filePath,
              relativePath: dirent.name,
              checksum,
              metadata
            });
          });
      }
    }
    
    return files;
  } catch (error) {
    console.error(`Error indexing files in ${directory}:`, error.message);
    return [];
  }
}

/**
 * Index files recursively in a directory
 * @param {string} directory - Directory to index
 * @param {Array} filePatterns - Array of file patterns to include
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {Array} Array of file objects with path, checksum, and metadata
 */
function indexFilesRecursively(directory, filePatterns = [], maxDepth = 5) {
  try {
    if (!fs.existsSync(directory)) {
      console.error(`Directory ${directory} does not exist`);
      return [];
    }
    
    if (maxDepth <= 0) {
      return [];
    }
    
    let files = [];
    
    // Index files in current directory
    files = files.concat(indexFiles(directory, filePatterns));
    
    // Recursively index subdirectories
    fs.readdirSync(directory, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .forEach(dirent => {
        const subdirectory = path.join(directory, dirent.name);
        const subdirectoryFiles = indexFilesRecursively(subdirectory, filePatterns, maxDepth - 1);
        
        // Update relative paths
        subdirectoryFiles.forEach(file => {
          file.relativePath = path.join(dirent.name, file.relativePath);
        });
        
        files = files.concat(subdirectoryFiles);
      });
    
    return files;
  } catch (error) {
    console.error(`Error recursively indexing files in ${directory}:`, error.message);
    return [];
  }
}

/**
 * Find critical files in a build directory
 * @param {string} directory - Build directory
 * @returns {Array} Array of critical files
 */
function findCriticalFiles(directory) {
  try {
    // Common critical file patterns
    const criticalPatterns = [
      'index.html',
      'main*.js',
      'bundle*.js',
      'app*.js',
      'vendor*.js',
      'styles*.css',
      'main*.css',
      'manifest.json',
      'asset-manifest.json',
      'favicon.ico'
    ];
    
    return indexFilesRecursively(directory, criticalPatterns);
  } catch (error) {
    console.error(`Error finding critical files in ${directory}:`, error.message);
    return [];
  }
}

module.exports = {
  computeChecksum,
  getFileMetadata,
  indexFiles,
  indexFilesRecursively,
  findCriticalFiles
};