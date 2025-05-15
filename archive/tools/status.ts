/**
 * Status Utility
 * 
 * Provides functions for updating and tracking status in the project.
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Status types
 */
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'pending';

/**
 * Status entry interface
 */
export interface StatusEntry {
  timestamp: string;
  type: StatusType;
  message: string;
  details?: any;
}

/**
 * Updates the status for a specific operation
 * @param operation The operation name (e.g., 'firebase-migration')
 * @param type The status type
 * @param message The status message
 * @param details Optional details
 */
export function updateStatus(
  operation: string,
  type: StatusType,
  message: string,
  details?: any
): void {
  logger.info(`Updating status for ${operation}: ${type} - ${message}`);
  
  const timestamp = new Date().toISOString();
  const statusEntry: StatusEntry = {
    timestamp,
    type,
    message,
    details
  };
  
  // Update JSON status file
  updateJsonStatus(operation, statusEntry);
  
  // Update Markdown status file
  updateMarkdownStatus(operation, statusEntry);
}

/**
 * Updates the JSON status file
 * @param operation The operation name
 * @param entry The status entry
 */
function updateJsonStatus(operation: string, entry: StatusEntry): void {
  const statusDir = 'status';
  const jsonFile = path.join(statusDir, `${operation}.json`);
  
  // Create status directory if it doesn't exist
  if (!fs.existsSync(statusDir)) {
    fs.mkdirSync(statusDir, { recursive: true });
  }
  
  let statusData: { entries: StatusEntry[] } = { entries: [] };
  
  // Read existing status file if it exists
  if (fs.existsSync(jsonFile)) {
    try {
      statusData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    } catch (error) {
      logger.warn(`Could not parse status file ${jsonFile}. Creating new file.`);
    }
  }
  
  // Add new entry
  statusData.entries.push(entry);
  
  // Limit to last 100 entries
  if (statusData.entries.length > 100) {
    statusData.entries = statusData.entries.slice(-100);
  }
  
  // Write updated status
  fs.writeFileSync(jsonFile, JSON.stringify(statusData, null, 2));
}

/**
 * Updates the Markdown status file
 * @param operation The operation name
 * @param entry The status entry
 */
function updateMarkdownStatus(operation: string, entry: StatusEntry): void {
  const statusDir = 'status';
  const mdFile = path.join(statusDir, `${operation}.md`);
  
  // Create status directory if it doesn't exist
  if (!fs.existsSync(statusDir)) {
    fs.mkdirSync(statusDir, { recursive: true });
  }
  
  // Format the entry for Markdown
  const formattedDate = new Date(entry.timestamp).toLocaleString();
  let statusIcon = '';
  
  switch (entry.type) {
    case 'success':
      statusIcon = '✅';
      break;
    case 'error':
      statusIcon = '❌';
      break;
    case 'warning':
      statusIcon = '⚠️';
      break;
    case 'info':
      statusIcon = 'ℹ️';
      break;
    case 'pending':
      statusIcon = '⏳';
      break;
  }
  
  const markdownEntry = `\n## ${statusIcon} ${entry.type.toUpperCase()} - ${formattedDate}\n\n${entry.message}\n`;
  
  // Create or append to the Markdown file
  if (!fs.existsSync(mdFile)) {
    // Create new file with header
    const title = operation.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    fs.writeFileSync(mdFile, `# ${title} Status Log\n${markdownEntry}`);
  } else {
    // Append to existing file
    fs.appendFileSync(mdFile, markdownEntry);
  }
}

/**
 * Updates the Firebase migration progress file
 * @param completed Number of completed files
 * @param total Total number of files
 * @param recentlyMigrated Array of recently migrated files
 */
export function updateFirebaseMigrationProgress(
  completed: number,
  total: number,
  recentlyMigrated: string[] = []
): void {
  const progressFile = 'status/firebase-migration-progress.md';
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;
  
  // Create content
  let content = `# Firebase Migration Progress\n\n`;
  content += `Last updated: ${new Date().toLocaleString()}\n\n`;
  content += `## Progress\n\n`;
  content += `- Completed: ${completed}/${total} files (${percentage}%)\n`;
  content += `- Progress: [${'='.repeat(percentage / 5)}${' '.repeat(20 - percentage / 5)}] ${percentage}%\n\n`;
  
  if (recentlyMigrated.length > 0) {
    content += `## Recently Migrated Files\n\n`;
    recentlyMigrated.forEach(file => {
      content += `- ${file}\n`;
    });
  }
  
  // Write to file
  fs.writeFileSync(progressFile, content);
  logger.info(`Updated Firebase migration progress: ${completed}/${total} files (${percentage}%)`);
}

/**
 * Gets the current Firebase migration progress
 * @returns Object with progress information
 */
export function getFirebaseMigrationProgress(): { completed: number; total: number; percentage: number } {
  try {
    // Try to parse from the progress file
    const progressFile = 'status/firebase-migration-progress.md';
    
    if (fs.existsSync(progressFile)) {
      const content = fs.readFileSync(progressFile, 'utf8');
      const match = content.match(/Completed: (\d+)\/(\d+) files/);
      
      if (match && match.length >= 3) {
        const completed = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;
        
        return { completed, total, percentage };
      }
    }
  } catch (error) {
    logger.warn('Could not parse Firebase migration progress');
  }
  
  // Default values if parsing fails
  return { completed: 0, total: 0, percentage: 0 };
}