/**
 * Progress Tracker for AI Sports Edge
 * 
 * Provides comprehensive progress tracking, checkpoint management,
 * and automatic recovery for long-running file operations.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

// Constants
const CHECKPOINT_DIR = '.roocode/checkpoints';
const COMPLETED_DIR = '.roocode/checkpoints/completed';
const CORRUPTED_DIR = '.roocode/checkpoints/corrupted';
const LOGS_DIR = '.roocode/logs';
const DEFAULT_CHECKPOINT_INTERVAL = 10;

/**
 * Progress Tracker for long-running operations
 */
class ProgressTracker extends EventEmitter {
  /**
   * Create a new progress tracker
   * @param {string} operationType Type of operation (e.g., 'duplicate-detection')
   * @param {Object} options Configuration options
   */
  constructor(operationType, options = {}) {
    super();
    
    const {
      checkpointInterval = DEFAULT_CHECKPOINT_INTERVAL,
      enableBackfilling = true,
      detailedLogging = true,
      operationId = null
    } = options;
    
    this.operationType = operationType;
    this.operationId = operationId || this._generateOperationId(operationType);
    this.checkpointInterval = checkpointInterval;
    this.enableBackfilling = enableBackfilling;
    this.detailedLogging = detailedLogging;
    
    this.startTime = new Date();
    this.lastCheckpointTime = this.startTime;
    this.totalFiles = 0;
    this.processedFiles = 0;
    this.state = 'initializing';
    this.checkpoints = [];
    this.operations = [];
    this.checkpointIndex = 0;
    
    this.checkpointFile = path.join(CHECKPOINT_DIR, `${this.operationId}.checkpoint.json`);
    this.logFile = path.join(LOGS_DIR, `${this.operationId}.log`);
    this.progressFile = path.join(LOGS_DIR, `${this.operationId}.progress.json`);
    this.summaryFile = path.join(LOGS_DIR, `${this.operationId}.summary.json`);
    
    this.initialized = false;
  }
  
  /**
   * Initialize the progress tracker
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create directories if they don't exist
      await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
      await fs.mkdir(COMPLETED_DIR, { recursive: true });
      await fs.mkdir(CORRUPTED_DIR, { recursive: true });
      await fs.mkdir(LOGS_DIR, { recursive: true });
      
      // Initialize log file
      await this._writeLog({
        timestamp: new Date().toISOString(),
        type: 'INITIALIZATION',
        data: {
          operationId: this.operationId,
          operationType: this.operationType,
          startTime: this.startTime.toISOString(),
          checkpointInterval: this.checkpointInterval,
          enableBackfilling: this.enableBackfilling,
          detailedLogging: this.detailedLogging
        }
      });
      
      this.state = 'initialized';
      this.initialized = true;
      
      this.emit('initialized', {
        operationId: this.operationId,
        operationType: this.operationType
      });
      
      return true;
    } catch (error) {
      console.error(`Error initializing progress tracker:`, error.message);
      throw error;
    }
  }
  
  /**
   * Set the total number of files to process
   * @param {number} count Total number of files
   * @returns {Promise<void>}
   */
  async setTotalFiles(count) {
    this._ensureInitialized();
    
    this.totalFiles = count;
    
    await this._writeLog({
      timestamp: new Date().toISOString(),
      type: 'TOTAL_FILES',
      data: {
        totalFiles: count
      }
    });
    
    this.emit('totalFiles', {
      operationId: this.operationId,
      totalFiles: count
    });
    
    return true;
  }
  
  /**
   * Record a file operation
   * @param {string} filePath Path to the file
   * @param {string} operation Operation performed (e.g., 'analyzed', 'processed')
   * @param {Object} details Additional details about the operation
   * @returns {Promise<void>}
   */
  async recordFileOperation(filePath, operation, details = {}) {
    this._ensureInitialized();
    
    const timestamp = new Date().toISOString();
    
    // Add operation to in-memory list
    const operationData = {
      timestamp,
      filePath,
      operation,
      details
    };
    
    this.operations.push(operationData);
    this.processedFiles++;
    
    // Write to log if detailed logging is enabled
    if (this.detailedLogging) {
      await this._writeLog({
        timestamp,
        type: 'FILE_OPERATION',
        data: operationData
      });
    }
    
    // Check if we need to create a checkpoint
    if (this.processedFiles % this.checkpointInterval === 0) {
      await this._createCheckpoint();
    }
    
    // Emit progress event
    this.emit('progress', {
      operationId: this.operationId,
      processedFiles: this.processedFiles,
      totalFiles: this.totalFiles,
      percentage: this.totalFiles > 0 ? (this.processedFiles / this.totalFiles) * 100 : 0
    });
    
    return true;
  }
  
  /**
   * Record a group operation (e.g., a group of similar files)
   * @param {string} groupId Identifier for the group
   * @param {string} operation Operation performed on the group
   * @param {Array} files Array of files in the group
   * @param {Object} details Additional details about the operation
   * @returns {Promise<void>}
   */
  async recordGroupOperation(groupId, operation, files, details = {}) {
    this._ensureInitialized();
    
    const timestamp = new Date().toISOString();
    
    // Add operation to in-memory list
    const operationData = {
      timestamp,
      groupId,
      operation,
      files,
      details
    };
    
    this.operations.push(operationData);
    
    // Write to log
    await this._writeLog({
      timestamp,
      type: 'GROUP_OPERATION',
      data: operationData
    });
    
    // Emit group event
    this.emit('group', {
      operationId: this.operationId,
      groupId,
      operation,
      fileCount: files.length
    });
    
    return true;
  }
  
  /**
   * Complete the operation
   * @param {string} status Status of the operation (e.g., 'success', 'error')
   * @returns {Promise<void>}
   */
  async complete(status = 'success') {
    this._ensureInitialized();
    
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    this.state = 'completed';
    
    // Create final checkpoint
    await this._createCheckpoint(true);
    
    // Write completion log
    await this._writeLog({
      timestamp: endTime.toISOString(),
      type: 'COMPLETION',
      data: {
        status,
        duration,
        processedFiles: this.processedFiles,
        totalFiles: this.totalFiles,
        checkpointCount: this.checkpoints.length
      }
    });
    
    // Generate summary
    const summary = {
      operationId: this.operationId,
      operationType: this.operationType,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      status,
      processedFiles: this.processedFiles,
      totalFiles: this.totalFiles,
      checkpointCount: this.checkpoints.length,
      operations: this.operations.length
    };
    
    // Write summary file
    await fs.writeFile(this.summaryFile, JSON.stringify(summary, null, 2));
    
    // Write progress file
    await fs.writeFile(this.progressFile, JSON.stringify({
      operationId: this.operationId,
      operationType: this.operationType,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      status,
      processedFiles: this.processedFiles,
      totalFiles: this.totalFiles,
      state: this.state
    }, null, 2));
    
    // Move checkpoint to completed directory
    const completedCheckpointFile = path.join(COMPLETED_DIR, path.basename(this.checkpointFile));
    await fs.rename(this.checkpointFile, completedCheckpointFile);
    
    // Emit completion event
    this.emit('complete', {
      operationId: this.operationId,
      status,
      duration,
      processedFiles: this.processedFiles,
      totalFiles: this.totalFiles
    });
    
    return summary;
  }
  
  /**
   * Get the current status of the operation
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      operationId: this.operationId,
      operationType: this.operationType,
      startTime: this.startTime.toISOString(),
      lastCheckpointTime: this.lastCheckpointTime.toISOString(),
      processedFiles: this.processedFiles,
      totalFiles: this.totalFiles,
      percentage: this.totalFiles > 0 ? (this.processedFiles / this.totalFiles) * 100 : 0,
      state: this.state,
      checkpointCount: this.checkpoints.length,
      operationCount: this.operations.length
    };
  }
  
  /**
   * Generate a summary report
   * @returns {Promise<Object>} Summary report
   */
  async generateSummaryReport() {
    this._ensureInitialized();
    
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    // Group operations by type
    const operationsByType = {};
    for (const operation of this.operations) {
      const type = operation.operation || 'unknown';
      if (!operationsByType[type]) {
        operationsByType[type] = [];
      }
      operationsByType[type].push(operation);
    }
    
    // Count operations by type
    const operationCounts = {};
    for (const [type, operations] of Object.entries(operationsByType)) {
      operationCounts[type] = operations.length;
    }
    
    // Generate timeline
    const timeline = this.checkpoints.map(checkpoint => ({
      timestamp: checkpoint.timestamp,
      processedFiles: checkpoint.processedFiles,
      percentage: this.totalFiles > 0 ? (checkpoint.processedFiles / this.totalFiles) * 100 : 0
    }));
    
    // Generate summary
    const summary = {
      operationId: this.operationId,
      operationType: this.operationType,
      startTime: this.startTime.toISOString(),
      currentTime: endTime.toISOString(),
      duration,
      processedFiles: this.processedFiles,
      totalFiles: this.totalFiles,
      percentage: this.totalFiles > 0 ? (this.processedFiles / this.totalFiles) * 100 : 0,
      state: this.state,
      checkpointCount: this.checkpoints.length,
      operationCount: this.operations.length,
      operationCounts,
      timeline
    };
    
    return summary;
  }
  
  /**
   * Resume an operation from a checkpoint
   * @param {string} operationId Operation ID to resume
   * @param {Object} options Resume options
   * @returns {Promise<ProgressTracker>} Resumed progress tracker
   * @static
   */
  static async resume(operationId, options = {}) {
    try {
      // Check if checkpoint exists
      const checkpointFile = path.join(CHECKPOINT_DIR, `${operationId}.checkpoint.json`);
      
      if (!await fileExists(checkpointFile)) {
        throw new Error(`Checkpoint file not found: ${checkpointFile}`);
      }
      
      // Read checkpoint
      const checkpointData = JSON.parse(await fs.readFile(checkpointFile, 'utf8'));
      
      // Create new progress tracker
      const tracker = new ProgressTracker(checkpointData.operationType, {
        ...options,
        operationId
      });
      
      // Initialize
      await tracker.initialize();
      
      // Restore state from checkpoint
      tracker.startTime = new Date(checkpointData.startTime);
      tracker.lastCheckpointTime = new Date(checkpointData.lastCheckpointTime);
      tracker.totalFiles = checkpointData.totalFiles;
      tracker.processedFiles = checkpointData.processedFiles;
      tracker.state = 'resumed';
      tracker.checkpoints = checkpointData.checkpoints || [];
      tracker.operations = checkpointData.operations || [];
      tracker.checkpointIndex = checkpointData.checkpointIndex || 0;
      
      // Backfill log if enabled
      if (tracker.enableBackfilling) {
        await tracker._backfillLog();
      }
      
      // Log resume
      await tracker._writeLog({
        timestamp: new Date().toISOString(),
        type: 'RESUME',
        data: {
          operationId,
          processedFiles: tracker.processedFiles,
          totalFiles: tracker.totalFiles,
          checkpointIndex: tracker.checkpointIndex
        }
      });
      
      // Emit resume event
      tracker.emit('resume', {
        operationId,
        processedFiles: tracker.processedFiles,
        totalFiles: tracker.totalFiles
      });
      
      return tracker;
    } catch (error) {
      console.error(`Error resuming operation:`, error.message);
      throw error;
    }
  }
  
  /**
   * List all operations
   * @param {Object} options List options
   * @returns {Promise<Array>} Array of operations
   * @static
   */
  static async listOperations(options = {}) {
    const {
      activeOnly = false,
      limit = 100,
      sortBy = 'startTime',
      sortDirection = 'desc'
    } = options;
    
    try {
      // Create directories if they don't exist
      await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
      await fs.mkdir(COMPLETED_DIR, { recursive: true });
      await fs.mkdir(LOGS_DIR, { recursive: true });
      
      // Get active operations
      const activeCheckpoints = await fs.readdir(CHECKPOINT_DIR);
      const activeOperations = [];
      
      for (const file of activeCheckpoints) {
        if (file.endsWith('.checkpoint.json')) {
          const checkpointFile = path.join(CHECKPOINT_DIR, file);
          try {
            const checkpointData = JSON.parse(await fs.readFile(checkpointFile, 'utf8'));
            activeOperations.push({
              operationId: checkpointData.operationId,
              operationType: checkpointData.operationType,
              startTime: checkpointData.startTime,
              lastCheckpointTime: checkpointData.lastCheckpointTime,
              processedFiles: checkpointData.processedFiles,
              totalFiles: checkpointData.totalFiles,
              state: checkpointData.state,
              status: 'active'
            });
          } catch (error) {
            console.error(`Error reading checkpoint file ${file}:`, error.message);
          }
        }
      }
      
      // If only active operations are requested, return them
      if (activeOnly) {
        return activeOperations
          .sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            const direction = sortDirection === 'desc' ? -1 : 1;
            return direction * (aValue > bValue ? 1 : aValue < bValue ? -1 : 0);
          })
          .slice(0, limit);
      }
      
      // Get completed operations
      const completedCheckpoints = await fs.readdir(COMPLETED_DIR);
      const completedOperations = [];
      
      for (const file of completedCheckpoints) {
        if (file.endsWith('.checkpoint.json')) {
          const checkpointFile = path.join(COMPLETED_DIR, file);
          try {
            const checkpointData = JSON.parse(await fs.readFile(checkpointFile, 'utf8'));
            completedOperations.push({
              operationId: checkpointData.operationId,
              operationType: checkpointData.operationType,
              startTime: checkpointData.startTime,
              lastCheckpointTime: checkpointData.lastCheckpointTime,
              processedFiles: checkpointData.processedFiles,
              totalFiles: checkpointData.totalFiles,
              state: checkpointData.state,
              status: 'completed'
            });
          } catch (error) {
            console.error(`Error reading checkpoint file ${file}:`, error.message);
          }
        }
      }
      
      // Combine and sort operations
      const allOperations = [...activeOperations, ...completedOperations]
        .sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];
          const direction = sortDirection === 'desc' ? -1 : 1;
          return direction * (aValue > bValue ? 1 : aValue < bValue ? -1 : 0);
        })
        .slice(0, limit);
      
      return allOperations;
    } catch (error) {
      console.error(`Error listing operations:`, error.message);
      throw error;
    }
  }
  
  /**
   * Clean up old checkpoints
   * @param {Object} options Cleanup options
   * @returns {Promise<Object>} Cleanup results
   * @static
   */
  static async cleanCheckpoints(options = {}) {
    const {
      olderThan = 30, // days
      dryRun = false
    } = options;
    
    try {
      // Create directories if they don't exist
      await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
      await fs.mkdir(COMPLETED_DIR, { recursive: true });
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThan);
      
      // Get completed checkpoints
      const completedCheckpoints = await fs.readdir(COMPLETED_DIR);
      const checkpointsToDelete = [];
      
      for (const file of completedCheckpoints) {
        if (file.endsWith('.checkpoint.json')) {
          const checkpointFile = path.join(COMPLETED_DIR, file);
          try {
            const stats = await fs.stat(checkpointFile);
            if (stats.mtime < cutoffDate) {
              checkpointsToDelete.push({
                file: checkpointFile,
                mtime: stats.mtime
              });
            }
          } catch (error) {
            console.error(`Error reading checkpoint file ${file}:`, error.message);
          }
        }
      }
      
      // Delete checkpoints if not dry run
      if (!dryRun) {
        for (const checkpoint of checkpointsToDelete) {
          await fs.unlink(checkpoint.file);
        }
      }
      
      return {
        deleted: dryRun ? 0 : checkpointsToDelete.length,
        would_delete: dryRun ? checkpointsToDelete.length : 0,
        checkpoints: checkpointsToDelete.map(c => c.file)
      };
    } catch (error) {
      console.error(`Error cleaning checkpoints:`, error.message);
      throw error;
    }
  }
  
  /**
   * Generate a unique operation ID
   * @param {string} operationType Type of operation
   * @returns {string} Unique operation ID
   * @private
   */
  _generateOperationId(operationType) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${operationType}-${timestamp}-${random}`;
  }
  
  /**
   * Create a checkpoint
   * @param {boolean} final Whether this is the final checkpoint
   * @returns {Promise<void>}
   * @private
   */
  async _createCheckpoint(final = false) {
    this._ensureInitialized();
    
    const timestamp = new Date();
    
    // Create checkpoint data
    const checkpoint = {
      index: this.checkpointIndex++,
      timestamp: timestamp.toISOString(),
      processedFiles: this.processedFiles,
      operations: this.operations.slice(
        this.checkpoints.length > 0 ? 
          this.checkpoints[this.checkpoints.length - 1].operations.length : 
          0
      )
    };
    
    // Add to checkpoints
    this.checkpoints.push(checkpoint);
    this.lastCheckpointTime = timestamp;
    
    // Create checkpoint file data
    const checkpointData = {
      operationId: this.operationId,
      operationType: this.operationType,
      startTime: this.startTime.toISOString(),
      lastCheckpointTime: timestamp.toISOString(),
      totalFiles: this.totalFiles,
      processedFiles: this.processedFiles,
      state: final ? 'completed' : 'running',
      checkpointIndex: this.checkpointIndex,
      checkpoints: this.checkpoints,
      operations: this.operations
    };
    
    // Write checkpoint file
    await fs.writeFile(this.checkpointFile, JSON.stringify(checkpointData, null, 2));
    
    // Write checkpoint log
    await this._writeLog({
      timestamp: timestamp.toISOString(),
      type: 'CHECKPOINT',
      data: {
        index: checkpoint.index,
        processedFiles: checkpoint.processedFiles,
        totalFiles: this.totalFiles,
        percentage: this.totalFiles > 0 ? (checkpoint.processedFiles / this.totalFiles) * 100 : 0,
        final
      }
    });
    
    // Emit checkpoint event
    this.emit('checkpoint', {
      operationId: this.operationId,
      index: checkpoint.index,
      processedFiles: checkpoint.processedFiles,
      totalFiles: this.totalFiles,
      percentage: this.totalFiles > 0 ? (checkpoint.processedFiles / this.totalFiles) * 100 : 0,
      final
    });
    
    return checkpoint;
  }
  
  /**
   * Write to the log file
   * @param {Object} logEntry Log entry to write
   * @returns {Promise<void>}
   * @private
   */
  async _writeLog(logEntry) {
    try {
      // Append to log file
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
      return true;
    } catch (error) {
      console.error(`Error writing to log:`, error.message);
      return false;
    }
  }
  
  /**
   * Backfill the log file from checkpoint data
   * @returns {Promise<void>}
   * @private
   */
  async _backfillLog() {
    try {
      // Check if log file exists
      if (!await fileExists(this.logFile)) {
        // Create log file
        await fs.writeFile(this.logFile, '');
      }
      
      // Read log file
      const logContent = await fs.readFile(this.logFile, 'utf8');
      const logLines = logContent.split('\n').filter(Boolean);
      
      // Parse log entries
      const logEntries = logLines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      }).filter(Boolean);
      
      // Get log entry types
      const logEntryTypes = new Set(logEntries.map(entry => entry.type));
      
      // Check if initialization entry exists
      if (!logEntryTypes.has('INITIALIZATION')) {
        await this._writeLog({
          timestamp: this.startTime.toISOString(),
          type: 'INITIALIZATION',
          data: {
            operationId: this.operationId,
            operationType: this.operationType,
            startTime: this.startTime.toISOString(),
            checkpointInterval: this.checkpointInterval,
            enableBackfilling: this.enableBackfilling,
            detailedLogging: this.detailedLogging,
            backfilled: true
          }
        });
      }
      
      // Check if total files entry exists
      if (!logEntryTypes.has('TOTAL_FILES') && this.totalFiles > 0) {
        await this._writeLog({
          timestamp: this.startTime.toISOString(),
          type: 'TOTAL_FILES',
          data: {
            totalFiles: this.totalFiles,
            backfilled: true
          }
        });
      }
      
      // Backfill checkpoint entries
      for (const checkpoint of this.checkpoints) {
        // Check if checkpoint entry exists
        const checkpointExists = logEntries.some(entry => 
          entry.type === 'CHECKPOINT' && 
          entry.data && 
          entry.data.index === checkpoint.index
        );
        
        if (!checkpointExists) {
          await this._writeLog({
            timestamp: checkpoint.timestamp,
            type: 'CHECKPOINT',
            data: {
              index: checkpoint.index,
              processedFiles: checkpoint.processedFiles,
              totalFiles: this.totalFiles,
              percentage: this.totalFiles > 0 ? (checkpoint.processedFiles / this.totalFiles) * 100 : 0,
              backfilled: true
            }
          });
        }
        
        // Backfill operation entries if detailed logging is enabled
        if (this.detailedLogging) {
          for (const operation of checkpoint.operations) {
            // Skip if operation doesn't have a timestamp
            if (!operation.timestamp) continue;
            
            // Check if operation entry exists
            const operationExists = logEntries.some(entry => 
              (entry.type === 'FILE_OPERATION' || entry.type === 'GROUP_OPERATION') && 
              entry.timestamp === operation.timestamp
            );
            
            if (!operationExists) {
              await this._writeLog({
                timestamp: operation.timestamp,
                type: operation.groupId ? 'GROUP_OPERATION' : 'FILE_OPERATION',
                data: {
                  ...operation,
                  backfilled: true
                }
              });
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error backfilling log:`, error.message);
      return false;
    }
  }
  
  /**
   * Ensure the tracker is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Progress tracker not initialized. Call initialize() first.');
    }
  }
}

/**
 * Check if a file exists
 * @param {string} filePath Path to the file
 * @returns {Promise<boolean>} Whether the file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = ProgressTracker;