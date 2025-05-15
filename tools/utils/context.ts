/**
 * Context-Aware Operations Utility
 * 
 * Provides functions for maintaining state across executions and implementing
 * efficient file tracking, delta updates, and context-aware operations.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';

// Context storage path
const CONTEXT_DIR = path.join(process.cwd(), '.context');
const CONTEXT_FILE = path.join(CONTEXT_DIR, 'context.json');
const FILE_HASHES_FILE = path.join(CONTEXT_DIR, 'file-hashes.json');

// Context data
let contextData: Record<string, any> = {};
let fileHashes: Record<string, string> = {};

/**
 * Initialize the context system
 */
export function initContext(): void {
  // Create context directory if it doesn't exist
  if (!fs.existsSync(CONTEXT_DIR)) {
    fs.mkdirSync(CONTEXT_DIR, { recursive: true });
    logger.info(`Created context directory: ${CONTEXT_DIR}`);
  }
  
  // Load context data if it exists
  if (fs.existsSync(CONTEXT_FILE)) {
    try {
      contextData = JSON.parse(fs.readFileSync(CONTEXT_FILE, 'utf8'));
      logger.debug('Loaded context data', contextData);
    } catch (error) {
      logger.warn('Failed to load context data, initializing empty context');
      contextData = {};
    }
  }
  
  // Load file hashes if they exist
  if (fs.existsSync(FILE_HASHES_FILE)) {
    try {
      fileHashes = JSON.parse(fs.readFileSync(FILE_HASHES_FILE, 'utf8'));
      logger.debug('Loaded file hashes', { fileCount: Object.keys(fileHashes).length });
    } catch (error) {
      logger.warn('Failed to load file hashes, initializing empty hashes');
      fileHashes = {};
    }
  }
}

/**
 * Save the context data
 */
export function saveContext(): void {
  try {
    fs.writeFileSync(CONTEXT_FILE, JSON.stringify(contextData, null, 2));
    fs.writeFileSync(FILE_HASHES_FILE, JSON.stringify(fileHashes, null, 2));
    logger.debug('Saved context data and file hashes');
  } catch (error) {
    logger.error('Failed to save context data', error);
  }
}

/**
 * Get the current context data
 * @returns The current context data
 */
export function getContext(): Record<string, any> {
  return { ...contextData };
}

/**
 * Update the context data
 * @param newContext The new context data to merge with the existing context
 */
export function updateContext(newContext: Record<string, any>): void {
  contextData = {
    ...contextData,
    ...newContext,
    lastUpdated: new Date().toISOString(),
  };
  
  // Save the updated context
  saveContext();
  
  logger.debug('Updated context data', newContext);
}

/**
 * Clear the context data
 */
export function clearContext(): void {
  contextData = {
    lastUpdated: new Date().toISOString(),
    cleared: true,
  };
  fileHashes = {};
  
  // Save the cleared context
  saveContext();
  
  logger.info('Cleared context data and file hashes');
}

/**
 * Calculate the hash of a file
 * @param filePath The path to the file
 * @returns The hash of the file
 */
function calculateFileHash(filePath: string): string {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(fileContent).digest('hex');
  } catch (error) {
    logger.error(`Failed to calculate hash for file: ${filePath}`, error);
    return '';
  }
}

/**
 * Track a file for changes
 * @param filePath The path to the file to track
 * @returns True if the file has changed, false otherwise
 */
export function trackFile(filePath: string): boolean {
  // Calculate the hash of the file
  const hash = calculateFileHash(filePath);
  
  // If the file doesn't exist or couldn't be read
  if (!hash) {
    return false;
  }
  
  // Check if the file has changed
  const hasChanged = fileHashes[filePath] !== hash;
  
  // Update the hash
  fileHashes[filePath] = hash;
  
  // Save the updated hashes
  saveContext();
  
  if (hasChanged) {
    logger.debug(`File changed: ${filePath}`);
  }
  
  return hasChanged;
}

/**
 * Get the list of tracked files
 * @returns The list of tracked files
 */
export function getTrackedFiles(): string[] {
  return Object.keys(fileHashes);
}

/**
 * Check if a file has changed
 * @param filePath The path to the file to check
 * @returns True if the file has changed, false otherwise
 */
export function hasFileChanged(filePath: string): boolean {
  // If the file isn't being tracked, consider it changed
  if (!fileHashes[filePath]) {
    return true;
  }
  
  // Calculate the hash of the file
  const hash = calculateFileHash(filePath);
  
  // If the file doesn't exist or couldn't be read
  if (!hash) {
    return false;
  }
  
  // Check if the file has changed
  return fileHashes[filePath] !== hash;
}

/**
 * Get the context-aware operations interface
 * @returns The context-aware operations interface
 */
export function getContextAwareOperations(): ContextAwareOperations {
  // Initialize the context system
  initContext();
  
  return {
    trackFile,
    updateContext,
    getContext,
    saveContext,
    loadContext: getContext,
    clearContext,
  };
}

// Export the context-aware operations interface
export const contextAwareOperations: ContextAwareOperations = {
  ...getContextAwareOperations(),
  getTrackedFiles,
  hasFileChanged
};