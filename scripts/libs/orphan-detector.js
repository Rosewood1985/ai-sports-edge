/**
 * Orphan Detector for AI Sports Edge
 * 
 * Detects orphaned files in the project, including:
 * - Unused assets
 * - Duplicate assets with different names
 * - Build artifacts without commits
 * - Abandoned feature branches
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

/**
 * Compute file hash for content-based comparison
 * @param {string} filePath - Path to the file
 * @returns {string} SHA-256 hash of the file content
 */
function computeFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    console.error(`Error computing hash for ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Find all files matching a pattern
 * @param {string} directory - Directory to search
 * @param {string} pattern - File pattern to match
 * @returns {Array} Array of file paths
 */
function findFiles(directory, pattern) {
  try {
    const command = `find ${directory} -type f -name "${pattern}" | grep -v "node_modules"`;
    const output = execSync(command, { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error(`Error finding files in ${directory} with pattern ${pattern}:`, error.message);
    return [];
  }
}

/**
 * Find duplicate assets based on content
 * @param {string} assetsDir - Assets directory
 * @returns {Object} Object with hash as key and array of duplicate files as value
 */
function findDuplicateAssets(assetsDir) {
  try {
    // Find all asset files
    const assetFiles = [
      ...findFiles(assetsDir, "*.png"),
      ...findFiles(assetsDir, "*.jpg"),
      ...findFiles(assetsDir, "*.jpeg"),
      ...findFiles(assetsDir, "*.gif"),
      ...findFiles(assetsDir, "*.svg"),
      ...findFiles(assetsDir, "*.webp"),
      ...findFiles(assetsDir, "*.ttf"),
      ...findFiles(assetsDir, "*.otf"),
      ...findFiles(assetsDir, "*.woff"),
      ...findFiles(assetsDir, "*.woff2")
    ];
    
    // Group by content hash
    const filesByHash = {};
    
    for (const file of assetFiles) {
      const hash = computeFileHash(file);
      if (hash) {
        if (!filesByHash[hash]) {
          filesByHash[hash] = [];
        }
        filesByHash[hash].push(file);
      }
    }
    
    // Filter to only include hashes with multiple files
    const duplicates = {};
    for (const [hash, files] of Object.entries(filesByHash)) {
      if (files.length > 1) {
        duplicates[hash] = files;
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error(`Error finding duplicate assets in ${assetsDir}:`, error.message);
    return {};
  }
}

/**
 * Find unused assets by checking for references in source files
 * @param {string} assetsDir - Assets directory
 * @param {string} srcDir - Source directory
 * @returns {Array} Array of unused asset file paths
 */
function findUnusedAssets(assetsDir, srcDir) {
  try {
    // Find all asset files
    const assetFiles = [
      ...findFiles(assetsDir, "*.png"),
      ...findFiles(assetsDir, "*.jpg"),
      ...findFiles(assetsDir, "*.jpeg"),
      ...findFiles(assetsDir, "*.gif"),
      ...findFiles(assetsDir, "*.svg"),
      ...findFiles(assetsDir, "*.webp"),
      ...findFiles(assetsDir, "*.ttf"),
      ...findFiles(assetsDir, "*.otf"),
      ...findFiles(assetsDir, "*.woff"),
      ...findFiles(assetsDir, "*.woff2")
    ];
    
    // Find all source files
    const sourceFiles = [
      ...findFiles(srcDir, "*.js"),
      ...findFiles(srcDir, "*.jsx"),
      ...findFiles(srcDir, "*.ts"),
      ...findFiles(srcDir, "*.tsx"),
      ...findFiles(srcDir, "*.css"),
      ...findFiles(srcDir, "*.scss")
    ];
    
    // Check each asset for references
    const unusedAssets = [];
    
    for (const assetFile of assetFiles) {
      let isReferenced = false;
      const assetFilename = path.basename(assetFile);
      const assetName = path.basename(assetFile, path.extname(assetFile));
      
      for (const sourceFile of sourceFiles) {
        const content = fs.readFileSync(sourceFile, 'utf8');
        
        if (content.includes(assetFilename) || 
            content.includes(assetName) || 
            content.includes(assetFile) || 
            content.includes(assetFile.replace(assetsDir, ''))) {
          isReferenced = true;
          break;
        }
      }
      
      if (!isReferenced) {
        unusedAssets.push(assetFile);
      }
    }
    
    return unusedAssets;
  } catch (error) {
    console.error(`Error finding unused assets:`, error.message);
    return [];
  }
}

/**
 * Find build artifacts that are not in Git
 * @param {string} buildDir - Build directory
 * @returns {Array} Array of untracked build artifact file paths
 */
function findUntrackedBuildArtifacts(buildDir) {
  try {
    if (!fs.existsSync(buildDir)) {
      return [];
    }
    
    // Get all files in build directory
    const command = `find ${buildDir} -type f | grep -v "node_modules"`;
    const output = execSync(command, { encoding: 'utf8' });
    const buildFiles = output.split('\n').filter(Boolean);
    
    // Check which files are not tracked by Git
    const untrackedFiles = [];
    
    for (const file of buildFiles) {
      try {
        // Check if file is tracked by Git
        execSync(`git ls-files --error-unmatch "${file}"`, { stdio: 'ignore' });
      } catch (error) {
        // If command fails, file is not tracked
        untrackedFiles.push(file);
      }
    }
    
    return untrackedFiles;
  } catch (error) {
    console.error(`Error finding untracked build artifacts:`, error.message);
    return [];
  }
}

/**
 * Find abandoned feature branches
 * @param {number} daysOld - Number of days since last commit
 * @returns {Array} Array of abandoned branch names
 */
function findAbandonedBranches(daysOld = 30) {
  try {
    // Get all branches
    const branchCommand = `git branch -a`;
    const branchOutput = execSync(branchCommand, { encoding: 'utf8' });
    const branches = branchOutput
      .split('\n')
      .filter(Boolean)
      .map(branch => branch.trim().replace(/^\*\s+/, '')); // Remove asterisk from current branch
    
    // Check last commit date for each branch
    const abandonedBranches = [];
    
    for (const branch of branches) {
      try {
        // Get last commit date
        const dateCommand = `git log -1 --format=%cd --date=iso ${branch}`;
        const dateOutput = execSync(dateCommand, { encoding: 'utf8' }).trim();
        
        // Calculate days since last commit
        const lastCommitDate = new Date(dateOutput);
        const currentDate = new Date();
        const daysSinceLastCommit = Math.floor((currentDate - lastCommitDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastCommit >= daysOld) {
          abandonedBranches.push({
            branch,
            daysSinceLastCommit,
            lastCommitDate: dateOutput
          });
        }
      } catch (error) {
        // Skip branches that cause errors
        console.error(`Error checking branch ${branch}:`, error.message);
      }
    }
    
    return abandonedBranches;
  } catch (error) {
    console.error(`Error finding abandoned branches:`, error.message);
    return [];
  }
}

/**
 * Generate a report of orphaned files
 * @param {Object} options - Options for the report
 * @returns {Object} Report object
 */
function generateOrphanReport(options = {}) {
  const {
    assetsDir = './src/assets',
    srcDir = './src',
    buildDir = './dist',
    daysForAbandonedBranches = 30
  } = options;
  
  // Find various types of orphans
  const duplicateAssets = findDuplicateAssets(assetsDir);
  const unusedAssets = findUnusedAssets(assetsDir, srcDir);
  const untrackedBuildArtifacts = findUntrackedBuildArtifacts(buildDir);
  const abandonedBranches = findAbandonedBranches(daysForAbandonedBranches);
  
  // Count duplicates
  let duplicateCount = 0;
  for (const files of Object.values(duplicateAssets)) {
    duplicateCount += files.length - 1; // Count all but one of each set
  }
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      duplicateAssets: duplicateCount,
      unusedAssets: unusedAssets.length,
      untrackedBuildArtifacts: untrackedBuildArtifacts.length,
      abandonedBranches: abandonedBranches.length
    },
    details: {
      duplicateAssets,
      unusedAssets,
      untrackedBuildArtifacts,
      abandonedBranches
    }
  };
}

module.exports = {
  computeFileHash,
  findFiles,
  findDuplicateAssets,
  findUnusedAssets,
  findUntrackedBuildArtifacts,
  findAbandonedBranches,
  generateOrphanReport
};