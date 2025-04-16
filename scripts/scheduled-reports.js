#!/usr/bin/env node

/**
 * Scheduled Reports Script
 * 
 * This script generates scheduled reports based on the configuration.
 * It is designed to be run as a cron job.
 * 
 * Usage:
 *   node scheduled-reports.js [--type=daily|weekly|monthly|quarterly|annual|tax]
 */

// Set environment to production if not specified
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import required modules
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Try to import the tax report generator
let taxReportGenerator;
try {
  taxReportGenerator = require('../utils/tax-report-generator');
} catch (error) {
  console.error('Could not load tax report generator:', error.message);
  process.exit(1);
}

// Try to import the logger
let logger;
try {
  logger = require('../utils/logger').default;
} catch (error) {
  console.error('Could not load logger:', error.message);
  // Create a simple logger
  logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
    debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta || '')
  };
}

// Load configuration
let config;
try {
  const configPath = path.join(process.cwd(), 'config', 'financial-reporting.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);
  logger.info('Loaded financial reporting configuration');
} catch (error) {
  logger.error('Failed to load financial reporting configuration:', error.message);
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
let reportType = null;

for (const arg of args) {
  if (arg.startsWith('--type=')) {
    reportType = arg.split('=')[1];
  }
}

// Validate report type
const validTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'tax'];
if (reportType && !validTypes.includes(reportType)) {
  logger.error(`Invalid report type: ${reportType}`);
  logger.info(`Valid types: ${validTypes.join(', ')}`);
  process.exit(1);
}

/**
 * Get the schedule configuration for a report type
 * 
 * @param {string} type - Report type
 * @returns {Object|null} Schedule configuration or null if not found or disabled
 */
function getScheduleConfig(type) {
  const scheduleKey = `${type}_report`;
  const schedule = config.schedules[scheduleKey];
  
  if (!schedule || !schedule.enabled) {
    return null;
  }
  
  return schedule;
}

/**
 * Check if a report should be generated now
 * 
 * @param {string} type - Report type
 * @returns {boolean} True if the report should be generated
 */
function shouldGenerateReport(type) {
  const schedule = getScheduleConfig(type);
  
  if (!schedule) {
    return false;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const currentDate = now.getDate(); // 1-31
  const currentMonth = now.getMonth(); // 0-11
  
  // Parse schedule time
  const [hour, minute] = schedule.time.split(':').map(Number);
  
  // Check if it's time to generate the report
  if (currentHour !== hour || currentMinute > 15) {
    return false;
  }
  
  // Check day-specific conditions
  switch (type) {
    case 'daily':
      // Daily reports run every day
      return true;
    
    case 'weekly':
      // Weekly reports run on a specific day of the week
      const weeklyDay = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
      }[schedule.day];
      
      return currentDay === weeklyDay;
    
    case 'monthly':
      // Monthly reports run on a specific day of the month
      return currentDate === schedule.day;
    
    case 'quarterly':
      // Quarterly reports run on a specific day of specific months
      return schedule.months.includes(currentMonth + 1) && currentDate === schedule.day;
    
    case 'annual':
      // Annual reports run on a specific day of a specific month
      return currentMonth + 1 === schedule.month && currentDate === schedule.day;
    
    case 'tax':
      // Tax reports run based on the frequency
      if (schedule.frequency === 'monthly') {
        return currentDate === schedule.day;
      } else if (schedule.frequency === 'quarterly') {
        return schedule.months.includes(currentMonth + 1) && currentDate === schedule.day;
      }
      
      return false;
    
    default:
      return false;
  }
}

/**
 * Generate a report
 * 
 * @param {string} type - Report type
 * @returns {Promise<void>}
 */
async function generateReport(type) {
  logger.info(`Generating ${type} report...`);
  
  try {
    // Calculate date range
    const now = new Date();
    let startDate, endDate;
    
    switch (type) {
      case 'daily':
        // Yesterday's report
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'weekly':
        // Last week's report (Monday to Sunday)
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - endDate.getDay() + 1); // Last Monday
        endDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1); // Sunday
        endDate.setHours(23, 59, 59, 999);
        
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6); // Previous Monday
        startDate.setHours(0, 0, 0, 0);
        break;
      
      case 'monthly':
        // Last month's report
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      
      case 'quarterly':
        // Last quarter's report
        const quarter = Math.floor((now.getMonth() + 3) / 3) - 1;
        const year = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const startMonth = (quarter === 0 ? 4 : quarter) * 3 - 3;
        
        startDate = new Date(year, startMonth, 1);
        endDate = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
        break;
      
      case 'annual':
        // Last year's report
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      
      case 'tax':
        // Tax report (same as monthly for now)
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      
      default:
        throw new Error(`Invalid report type: ${type}`);
    }
    
    // Format dates for output file name
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports', 'financial', type);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate report for each format
    const formats = ['html', 'json', 'csv'];
    
    for (const format of formats) {
      const outputPath = path.join(reportsDir, `${type}_report_${startDateStr}_${endDateStr}.${format}`);
      
      // Generate report
      const result = await taxReportGenerator.generateTaxReport({
        startDate,
        endDate,
        format,
        outputPath
      });
      
      logger.info(`Generated ${type} report in ${format} format`, {
        startDate: startDateStr,
        endDate: endDateStr,
        outputPath
      });
    }
    
    // Send report to recipients if configured
    const schedule = getScheduleConfig(type);
    if (schedule && schedule.recipients && schedule.recipients.length > 0) {
      logger.info(`Sending ${type} report to recipients`, {
        recipients: schedule.recipients
      });
      
      // In a real implementation, this would send emails to recipients
      // For now, just log the recipients
      logger.info(`Would send ${type} report to: ${schedule.recipients.join(', ')}`);
    }
    
    logger.info(`${type} report generation completed successfully`);
  } catch (error) {
    logger.error(`Failed to generate ${type} report`, {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // If a specific report type is provided, generate only that report
    if (reportType) {
      if (shouldGenerateReport(reportType)) {
        await generateReport(reportType);
      } else {
        logger.info(`Skipping ${reportType} report generation (not scheduled for now)`);
      }
      return;
    }
    
    // Otherwise, check all report types
    for (const type of validTypes) {
      if (shouldGenerateReport(type)) {
        await generateReport(type);
      } else {
        logger.debug(`Skipping ${type} report generation (not scheduled for now)`);
      }
    }
    
    logger.info('Scheduled reports check completed');
  } catch (error) {
    logger.error('Error in scheduled reports script', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error('Unhandled error in scheduled reports script', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});