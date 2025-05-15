/**
 * Environment Utility
 * 
 * Provides functions for validating and checking the environment.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from './logger';

/**
 * Required directories for operations
 */
const REQUIRED_DIRECTORIES = [
  'scripts',
  'status',
  'memory-bank',
  'tools',
  'tools/utils'
];

/**
 * Required scripts for Firebase migration
 */
const REQUIRED_SCRIPTS = [
  'scripts/tag-headers.sh',
  'scripts/archive-redundant-files.sh',
  'scripts/retro-tag-migrated.sh',
  'scripts/migrate-firebase-atomic.sh',
  'scripts/consolidate-files.sh',
  'scripts/migrate-and-update.sh',
  'scripts/update-firebase-migration-status.sh',
  'scripts/run-complete-migration.sh'
];

/**
 * Required status files
 */
const REQUIRED_STATUS_FILES = [
  'status/firebase-atomic-migration.md',
  'status/firebase-migration-progress.md'
];

/**
 * Validates that the environment is properly set up
 * @throws Error if environment is not valid
 */
export function validateEnvironment(): void {
  logger.info('Validating environment...');
  
  // Check required directories
  const missingDirs = REQUIRED_DIRECTORIES.filter(dir => !fs.existsSync(dir));
  if (missingDirs.length > 0) {
    logger.error(`Missing required directories: ${missingDirs.join(', ')}`);
    throw new Error(`Missing required directories: ${missingDirs.join(', ')}`);
  }
  
  // Check required scripts
  const missingScripts = REQUIRED_SCRIPTS.filter(script => !fs.existsSync(script));
  if (missingScripts.length > 0) {
    logger.error(`Missing required scripts: ${missingScripts.join(', ')}`);
    throw new Error(`Missing required scripts: ${missingScripts.join(', ')}`);
  }
  
  // Check required status files
  const missingStatusFiles = REQUIRED_STATUS_FILES.filter(file => !fs.existsSync(file));
  if (missingStatusFiles.length > 0) {
    // Create missing status files
    missingStatusFiles.forEach(file => {
      logger.warn(`Creating missing status file: ${file}`);
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      if (file.endsWith('.md')) {
        const filename = path.basename(file, '.md');
        const title = filename.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        fs.writeFileSync(file, `# ${title}\n\nCreated on ${new Date().toISOString()}\n`);
      } else {
        fs.writeFileSync(file, '');
      }
    });
  }
  
  // Check Node.js version
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    
    if (majorVersion < 14) {
      logger.warn(`Node.js version ${nodeVersion} is below recommended version (v14+)`);
    } else {
      logger.info(`Node.js version: ${nodeVersion}`);
    }
  } catch (error) {
    logger.warn('Could not determine Node.js version');
  }
  
  // Check for required npm packages
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredPackages = ['commander', 'chalk', 'ora'];
    const missingPackages = requiredPackages.filter(pkg => !dependencies[pkg]);
    
    if (missingPackages.length > 0) {
      logger.warn(`Missing recommended npm packages: ${missingPackages.join(', ')}`);
    }
  } catch (error) {
    logger.warn('Could not check package.json for dependencies');
  }
  
  // Check script permissions
  try {
    REQUIRED_SCRIPTS.forEach(script => {
      if (fs.existsSync(script)) {
        const stats = fs.statSync(script);
        const isExecutable = !!(stats.mode & 0o111); // Check if executable bit is set
        
        if (!isExecutable) {
          logger.warn(`Script ${script} is not executable. Setting executable permission.`);
          fs.chmodSync(script, '755');
        }
      }
    });
  } catch (error) {
    logger.warn('Could not check script permissions');
  }
  
  logger.success('Environment validation completed');
}

/**
 * Gets the project root directory
 * @returns The absolute path to the project root
 */
export function getProjectRoot(): string {
  return process.cwd();
}

/**
 * Checks if the current directory is the project root
 * @returns True if current directory is project root
 */
export function isProjectRoot(): boolean {
  return fs.existsSync('package.json');
}

/**
 * Gets information about the current environment
 * @returns Object with environment information
 */
export function getEnvironmentInfo(): Record<string, any> {
  const info: Record<string, any> = {
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    isProjectRoot: isProjectRoot()
  };
  
  // Get Git information if available
  try {
    info.gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    info.gitCommit = execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    info.git = 'Not available';
  }
  
  return info;
}