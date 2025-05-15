/**
 * Decision Engine for AI Sports Edge
 * 
 * Makes safe decisions about file duplicates.
 * Determines which files to keep and which to remove based on similarity analysis.
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Makes safe decisions about file duplicates
 */
class DecisionEngine {
  /**
   * Generate duplicate handling recommendations
   * @param {Array} duplicateGroups Groups of duplicate/similar files
   * @param {Object} options Configuration options
   * @returns {Array} Recommendations for each group
   */
  async generateRecommendations(duplicateGroups, options = {}) {
    const {
      safetyThreshold = 0.9, // Threshold for considering files "safe" to handle automatically
      prioritizeNewer = true, // Prefer keeping newer files
      prioritizeShorterPaths = true, // Prefer files with shorter paths
      prioritizeModuleFiles = true, // Prefer files in modules/components
      ignorePatterns = [],
      autoDecisionThreshold = 0.95 // Threshold for making automatic decisions
    } = options;
    
    const recommendations = [];
    
    for (const group of duplicateGroups) {
      // Skip if only one file (shouldn't happen, but just in case)
      if (group.files.length < 2) continue;
      
      // Get file stats for each file in the group
      const filesWithStats = await Promise.all(
        group.files.map(async file => {
          try {
            const stats = await fs.stat(file.path);
            return {
              ...file,
              created: stats.birthtime,
              modified: stats.mtime,
              accessed: stats.atime,
              inIgnoreList: ignorePatterns.some(pattern => 
                new RegExp(pattern).test(file.path)
              )
            };
          } catch (error) {
            console.error(`Error getting stats for ${file.path}:`, error.message);
            return {
              ...file,
              created: new Date(0),
              modified: new Date(0),
              accessed: new Date(0),
              inIgnoreList: false,
              error: true
            };
          }
        })
      );
      
      // Score each file based on the criteria
      const scoredFiles = filesWithStats.map(file => {
        let score = 0;
        
        // Don't touch files with errors
        if (file.error) {
          score -= 1000;
        }
        
        // Don't touch files in ignore list
        if (file.inIgnoreList) {
          score -= 500;
        }
        
        // Prefer newer files
        if (prioritizeNewer) {
          // Normalize to 0-1 range within the group
          const oldestTime = Math.min(
            ...filesWithStats.map(f => f.modified.getTime())
          );
          const newestTime = Math.max(
            ...filesWithStats.map(f => f.modified.getTime())
          );
          const timeRange = newestTime - oldestTime;
          
          if (timeRange > 0) {
            score += 0.3 * ((file.modified.getTime() - oldestTime) / timeRange);
          }
        }
        
        // Prefer shorter paths
        if (prioritizeShorterPaths) {
          const shortestPath = Math.min(
            ...filesWithStats.map(f => f.path.length)
          );
          const longestPath = Math.max(
            ...filesWithStats.map(f => f.path.length)
          );
          const pathRange = longestPath - shortestPath;
          
          if (pathRange > 0) {
            score += 0.2 * (1 - ((file.path.length - shortestPath) / pathRange));
          }
        }
        
        // Prefer files in modules/components directories
        if (prioritizeModuleFiles) {
          const isInModuleDir = /\/(components|modules|src\/[^\/]+)\//i.test(file.path);
          score += isInModuleDir ? 0.3 : 0;
        }
        
        // Avoid files in node_modules
        if (file.path.includes('node_modules')) {
          score -= 0.5;
        }
        
        // Avoid files in .git
        if (file.path.includes('.git')) {
          score -= 0.8;
        }
        
        // Prefer recently accessed files
        const now = new Date().getTime();
        const daysSinceAccessed = (now - file.accessed.getTime()) / (1000 * 60 * 60 * 24);
        score += 0.1 * Math.max(0, 1 - (daysSinceAccessed / 30)); // Max bonus for files accessed today
        
        return {
          ...file,
          score
        };
      });
      
      // Sort by score (descending)
      scoredFiles.sort((a, b) => b.score - a.score);
      
      // The file with the highest score is the one to keep
      const fileToKeep = scoredFiles[0];
      const filesToRemove = scoredFiles.slice(1);
      
      // Determine if we can make an automatic decision
      const isExactMatch = group.type === 'exact';
      const highestSimilarity = isExactMatch ? 1.0 : group.similarity;
      const canDecideAutomatically = 
        highestSimilarity >= autoDecisionThreshold && 
        !fileToKeep.error && 
        !fileToKeep.inIgnoreList;
      
      // Generate recommendation
      recommendations.push({
        groupType: group.type,
        similarity: highestSimilarity,
        totalSize: group.totalSize,
        wastedSize: group.wastedSize,
        fileToKeep: {
          path: fileToKeep.path,
          size: fileToKeep.size,
          score: fileToKeep.score,
          modified: fileToKeep.modified
        },
        filesToRemove: filesToRemove.map(file => ({
          path: file.path,
          size: file.size,
          score: file.score,
          modified: file.modified
        })),
        automaticDecision: canDecideAutomatically,
        safetyLevel: isExactMatch ? 'high' : (highestSimilarity >= safetyThreshold ? 'medium' : 'low'),
        action: canDecideAutomatically ? 'remove' : 'review'
      });
    }
    
    // Sort recommendations by wasted size (descending)
    return recommendations.sort((a, b) => b.wastedSize - a.wastedSize);
  }
  
  /**
   * Apply recommendations to the filesystem
   * @param {Array} recommendations Recommendations to apply
   * @param {Object} options Configuration options
   * @returns {Object} Results of applying recommendations
   */
  async applyRecommendations(recommendations, options = {}) {
    const {
      dryRun = true, // Don't actually make changes by default
      backupDir = '.roocode/backups/duplicates', // Directory to store backups
      createBackups = true, // Create backups before removing files
      onlyAutomatic = true, // Only apply automatic decisions
      logFile = '.roocode/logs/duplicate-cleanup.log' // Log file
    } = options;
    
    // Ensure backup directory exists if we're creating backups
    if (createBackups && !dryRun) {
      try {
        await fs.mkdir(backupDir, { recursive: true });
      } catch (error) {
        console.error(`Error creating backup directory: ${error.message}`);
        return {
          success: false,
          error: `Failed to create backup directory: ${error.message}`
        };
      }
    }
    
    // Ensure log directory exists
    if (!dryRun) {
      try {
        await fs.mkdir(path.dirname(logFile), { recursive: true });
      } catch (error) {
        console.error(`Error creating log directory: ${error.message}`);
      }
    }
    
    const results = {
      applied: [],
      skipped: [],
      errors: [],
      totalRemoved: 0,
      totalSaved: 0
    };
    
    // Log function
    const log = async (message) => {
      console.log(message);
      if (!dryRun) {
        try {
          await fs.appendFile(
            logFile, 
            `[${new Date().toISOString()}] ${message}\n`
          );
        } catch (error) {
          console.error(`Error writing to log: ${error.message}`);
        }
      }
    };
    
    // Process each recommendation
    for (const recommendation of recommendations) {
      // Skip non-automatic decisions if onlyAutomatic is true
      if (onlyAutomatic && !recommendation.automaticDecision) {
        results.skipped.push({
          recommendation,
          reason: 'Not an automatic decision'
        });
        continue;
      }
      
      const { fileToKeep, filesToRemove } = recommendation;
      
      // Log what we're doing
      await log(`Processing group with ${filesToRemove.length + 1} files:`);
      await log(`  Keeping: ${fileToKeep.path}`);
      
      // Process each file to remove
      for (const fileToRemove of filesToRemove) {
        try {
          await log(`  Removing: ${fileToRemove.path}`);
          
          // Create backup if requested
          if (createBackups && !dryRun) {
            const backupPath = path.join(
              backupDir, 
              fileToRemove.path.replace(/[\/\\:]/g, '_')
            );
            
            try {
              await fs.copyFile(fileToRemove.path, backupPath);
              await log(`  Backup created: ${backupPath}`);
            } catch (error) {
              await log(`  Error creating backup: ${error.message}`);
              // Continue anyway, as the backup is just a precaution
            }
          }
          
          // Remove the file (if not a dry run)
          if (!dryRun) {
            await fs.unlink(fileToRemove.path);
            await log(`  Removed: ${fileToRemove.path}`);
          } else {
            await log(`  [DRY RUN] Would remove: ${fileToRemove.path}`);
          }
          
          // Update results
          results.totalRemoved++;
          results.totalSaved += fileToRemove.size;
        } catch (error) {
          await log(`  Error removing ${fileToRemove.path}: ${error.message}`);
          results.errors.push({
            file: fileToRemove.path,
            error: error.message
          });
        }
      }
      
      // Add to applied list
      results.applied.push({
        fileKept: fileToKeep.path,
        filesRemoved: dryRun ? [] : filesToRemove.map(f => f.path),
        wastedSize: recommendation.wastedSize
      });
    }
    
    // Log summary
    await log('');
    await log(`Summary of actions${dryRun ? ' (DRY RUN)' : ''}:`);
    await log(`  Groups processed: ${results.applied.length}`);
    await log(`  Groups skipped: ${results.skipped.length}`);
    await log(`  Files removed: ${results.totalRemoved}`);
    await log(`  Space saved: ${this._formatSize(results.totalSaved)}`);
    await log(`  Errors: ${results.errors.length}`);
    
    return results;
  }
  
  /**
   * Format file size for display
   * @param {number} size Size in bytes
   * @returns {string} Formatted size
   */
  _formatSize(size) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let formattedSize = size;
    let unitIndex = 0;
    
    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
      formattedSize /= 1024;
      unitIndex++;
    }
    
    return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
  }
}

module.exports = new DecisionEngine();