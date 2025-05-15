#!/usr/bin/env node
/**
 * cronrc-runner.js
 * 
 * Reads a .cronrc file and executes defined recurring tasks at specified intervals.
 * The .cronrc file format is: <interval> <label> <command>
 * 
 * Example:
 * 3m save-context ./scripts/save-context.sh "[AUTO] Recurring context save"
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { logger } = require('../tools/utils/logger');

// Configuration
const CONFIG = {
  cronrcPath: path.resolve(process.cwd(), '.cronrc'),
  logDir: path.resolve(process.cwd(), 'logs/cronrc'),
  logRetentionDays: 7
};

// Ensure log directory exists
if (!fs.existsSync(CONFIG.logDir)) {
  fs.mkdirSync(CONFIG.logDir, { recursive: true });
}

// Task class to represent a recurring task
class Task {
  constructor(interval, label, command) {
    this.interval = interval;
    this.label = label;
    this.command = command;
    this.timer = null;
    this.lastRun = null;
    this.nextRun = null;
    this.running = false;
    this.intervalMs = this.parseInterval(interval);
  }

  /**
   * Parse interval string (e.g., "3m", "1h") to milliseconds
   */
  parseInterval(intervalStr) {
    const match = intervalStr.match(/^(\d+)([mh])$/);
    if (!match) {
      throw new Error(`Invalid interval format: ${intervalStr}. Expected format: 3m, 1h, etc.`);
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 'm':
        return numValue * 60 * 1000; // minutes to ms
      case 'h':
        return numValue * 60 * 60 * 1000; // hours to ms
      default:
        throw new Error(`Unsupported time unit: ${unit}. Supported units: m (minutes), h (hours)`);
    }
  }

  /**
   * Start the task timer
   */
  start() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.nextRun = new Date(Date.now() + this.intervalMs);
    
    logger.info(`Task "${this.label}" scheduled to run every ${this.interval} (next run: ${this.nextRun.toLocaleTimeString()})`);
    
    this.timer = setInterval(() => this.execute(), this.intervalMs);
  }

  /**
   * Execute the task command
   */
  async execute() {
    if (this.running) {
      logger.warn(`Task "${this.label}" is still running from previous execution, skipping this run`);
      return;
    }

    this.running = true;
    this.lastRun = new Date();
    this.nextRun = new Date(Date.now() + this.intervalMs);

    const timestamp = this.lastRun.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const logFile = path.join(CONFIG.logDir, `${this.label}-${timestamp}.log`);
    
    logger.info(`Executing task "${this.label}" (${this.command})`);
    
    try {
      // Create a log stream
      const logStream = fs.createWriteStream(logFile, { flags: 'a' });
      logStream.write(`=== Task "${this.label}" executed at ${this.lastRun.toISOString()} ===\n`);
      logStream.write(`Command: ${this.command}\n\n`);

      // Split the command into parts
      const cmdParts = this.command.split(' ');
      const cmd = cmdParts[0];
      const args = cmdParts.slice(1);

      // Spawn the process
      const process = spawn(cmd, args, {
        shell: true,
        cwd: process.cwd()
      });

      // Handle stdout
      process.stdout.on('data', (data) => {
        const output = data.toString();
        logStream.write(output);
      });

      // Handle stderr
      process.stderr.on('data', (data) => {
        const output = data.toString();
        logStream.write(`[ERROR] ${output}`);
      });

      // Handle process completion
      process.on('close', (code) => {
        const exitMessage = `Task "${this.label}" completed with exit code ${code}`;
        logStream.write(`\n${exitMessage}\n`);
        logStream.end();

        if (code === 0) {
          logger.success(exitMessage);
        } else {
          logger.error(exitMessage);
        }

        this.running = false;
      });

      // Handle process errors
      process.on('error', (err) => {
        const errorMessage = `Failed to execute task "${this.label}": ${err.message}`;
        logStream.write(`\n[ERROR] ${errorMessage}\n`);
        logStream.end();
        
        logger.error(errorMessage);
        this.running = false;
      });
    } catch (err) {
      logger.error(`Failed to execute task "${this.label}"`, err);
      this.running = false;
    }
  }

  /**
   * Stop the task timer
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info(`Task "${this.label}" stopped`);
    }
  }
}

/**
 * CronRC class to manage tasks defined in .cronrc
 */
class CronRC {
  constructor() {
    this.tasks = [];
    this.initialized = false;
  }

  /**
   * Initialize by reading the .cronrc file
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    try {
      if (!fs.existsSync(CONFIG.cronrcPath)) {
        logger.error(`CronRC file not found at ${CONFIG.cronrcPath}`);
        process.exit(1);
      }

      const content = fs.readFileSync(CONFIG.cronrcPath, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        // Skip empty lines and comments
        if (!line.trim() || line.trim().startsWith('#')) {
          continue;
        }

        try {
          // Extract interval, label, and command
          // Format: <interval> <label> <command>
          const match = line.match(/^(\S+)\s+(\S+)\s+(.+)$/);
          if (!match) {
            logger.warn(`Invalid line format in .cronrc: ${line}`);
            continue;
          }

          const [, interval, label, command] = match;
          const task = new Task(interval, label, command);
          this.tasks.push(task);
        } catch (err) {
          logger.warn(`Failed to parse task from line: ${line}`, err);
        }
      }

      if (this.tasks.length === 0) {
        logger.warn('No valid tasks found in .cronrc');
      } else {
        logger.success(`Loaded ${this.tasks.length} tasks from .cronrc`);
      }

      this.initialized = true;
    } catch (err) {
      logger.error('Failed to initialize CronRC', err);
      process.exit(1);
    }
  }

  /**
   * Start all tasks
   */
  startAll() {
    if (!this.initialized) {
      this.initialize();
    }

    logger.section('Starting Tasks');
    
    for (const task of this.tasks) {
      task.start();
    }

    // Set up log rotation
    this.setupLogRotation();
  }

  /**
   * Stop all tasks
   */
  stopAll() {
    logger.section('Stopping Tasks');
    
    for (const task of this.tasks) {
      task.stop();
    }
  }

  /**
   * Set up log rotation to clean up old log files
   */
  setupLogRotation() {
    const rotationInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(() => {
      try {
        const now = Date.now();
        const files = fs.readdirSync(CONFIG.logDir);
        
        for (const file of files) {
          const filePath = path.join(CONFIG.logDir, file);
          const stats = fs.statSync(filePath);
          const fileAge = now - stats.mtime.getTime();
          const maxAge = CONFIG.logRetentionDays * 24 * 60 * 60 * 1000;
          
          if (fileAge > maxAge) {
            fs.unlinkSync(filePath);
            logger.debug(`Removed old log file: ${file}`);
          }
        }
      } catch (err) {
        logger.error('Failed to rotate logs', err);
      }
    }, rotationInterval);
    
    logger.info(`Log rotation set up (retention: ${CONFIG.logRetentionDays} days)`);
  }

  /**
   * Display status of all tasks
   */
  displayStatus() {
    logger.section('Task Status');
    
    const statusTable = this.tasks.map(task => ({
      Label: task.label,
      Interval: task.interval,
      'Last Run': task.lastRun ? task.lastRun.toLocaleString() : 'Never',
      'Next Run': task.nextRun ? task.nextRun.toLocaleString() : 'Not scheduled',
      Status: task.running ? 'Running' : 'Idle'
    }));
    
    logger.table(statusTable);
  }
}

// Main function
function main() {
  logger.section('CronRC Runner');
  
  const cronrc = new CronRC();
  cronrc.initialize();
  cronrc.startAll();
  
  // Display initial status
  cronrc.displayStatus();
  
  // Set up status display interval (every hour)
  setInterval(() => {
    cronrc.displayStatus();
  }, 60 * 60 * 1000);
  
  // Handle process termination
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down...');
    cronrc.stopAll();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down...');
    cronrc.stopAll();
    process.exit(0);
  });
  
  logger.success('CronRC Runner started successfully');
}

// Run the main function
main();