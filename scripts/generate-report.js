#!/usr/bin/env node

/**
 * Report Generator Script
 * 
 * This script generates a revenue report for a specified period.
 * 
 * Usage:
 *   node generate-report.js --type=monthly --start=2025-03-01 --end=2025-03-31
 */

// Set environment to development if not specified
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Import required modules
const { program } = require('commander');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
program
  .option('--type <type>', 'Report type (daily, weekly, monthly, quarterly, annual, tax)', 'monthly')
  .option('--start <date>', 'Start date (YYYY-MM-DD)')
  .option('--end <date>', 'End date (YYYY-MM-DD)')
  .option('--format <format>', 'Report format (html, json, csv)', 'json')
  .option('--output <path>', 'Output file path')
  .parse(process.argv);

const options = program.opts();

// Validate options
if (!options.start || !options.end) {
  console.error('Start and end dates are required');
  console.error('Usage: node generate-report.js --type=monthly --start=2025-03-01 --end=2025-03-31');
  process.exit(1);
}

// Convert dates
const startDate = new Date(options.start);
const endDate = new Date(options.end);

if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
  console.error('Invalid date format. Use YYYY-MM-DD');
  process.exit(1);
}

// Validate report type
const validTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'tax'];
if (!validTypes.includes(options.type)) {
  console.error(`Invalid report type: ${options.type}`);
  console.error(`Valid types: ${validTypes.join(', ')}`);
  process.exit(1);
}

// Validate format
const validFormats = ['html', 'json', 'csv'];
if (!validFormats.includes(options.format)) {
  console.error(`Invalid format: ${options.format}`);
  console.error(`Valid formats: ${validFormats.join(', ')}`);
  process.exit(1);
}

// Import the revenue reporting service
// Note: We need to use require here since this is a CommonJS module
// and the service is written in TypeScript
let revenueReportingService;
try {
  // Try to import the compiled JavaScript version
  revenueReportingService = require('../dist/services/revenueReportingService').default;
} catch (error) {
  console.error('Could not load compiled service. Trying to use ts-node...');
  
  try {
    // Try to use ts-node to load the TypeScript file directly
    require('ts-node/register');
    revenueReportingService = require('../services/revenueReportingService').default;
  } catch (tsNodeError) {
    console.error('Failed to load service with ts-node:', tsNodeError.message);
    console.error('Please compile the TypeScript files or install ts-node:');
    console.error('  npm install -g ts-node');
    process.exit(1);
  }
}

// Generate the report
async function generateReport() {
  try {
    console.log(`Generating ${options.type} report from ${options.start} to ${options.end}...`);
    
    const report = await revenueReportingService.generateReport({
      startDate,
      endDate,
      type: options.type,
      format: options.format,
    });
    
    console.log(`Report generated successfully!`);
    console.log(`Report ID: ${report.id}`);
    console.log(`Total Revenue: $${report.totalRevenue.toFixed(2)}`);
    console.log(`Total Tax: $${report.totalTax.toFixed(2)}`);
    console.log(`Net Revenue: $${report.netRevenue.toFixed(2)}`);
    console.log(`Transaction Count: ${report.transactionCount}`);
    
    // Output the report
    if (options.output) {
      const outputPath = path.resolve(process.cwd(), options.output);
      
      let outputContent;
      
      switch (options.format) {
        case 'json':
          outputContent = JSON.stringify(report, null, 2);
          break;
        case 'csv':
          // Simple CSV conversion for the report summary
          outputContent = 'Report ID,Type,Start Date,End Date,Generation Date,Total Revenue,Total Tax,Net Revenue,Transaction Count\n';
          outputContent += `${report.id},${report.type},${report.startDate.toISOString()},${report.endDate.toISOString()},${report.generationDate.toISOString()},${report.totalRevenue},${report.totalTax},${report.netRevenue},${report.transactionCount}\n`;
          
          // Add categories
          outputContent += '\nCategory,Gross Revenue,Tax,Net Revenue,Percentage\n';
          report.categories.forEach(category => {
            outputContent += `${category.name},${category.grossRevenue},${category.tax},${category.netRevenue},${category.percentage}%\n`;
          });
          
          // Add daily breakdown if available
          if (report.days && report.days.length > 0) {
            outputContent += '\nDate,Transaction Count,Gross Revenue,Tax,Net Revenue\n';
            report.days.forEach(day => {
              outputContent += `${day.date.toISOString().split('T')[0]},${day.transactionCount},${day.grossRevenue},${day.tax},${day.netRevenue}\n`;
            });
          }
          break;
        case 'html':
          // Simple HTML report
          outputContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${options.type.charAt(0).toUpperCase() + options.type.slice(1)} Revenue Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .total-row { font-weight: bold; background-color: #f9f9f9; }
    .summary { margin-top: 30px; }
  </style>
</head>
<body>
  <h1>${options.type.charAt(0).toUpperCase() + options.type.slice(1)} Revenue Report</h1>
  <p>Period: ${report.startDate.toISOString().split('T')[0]} to ${report.endDate.toISOString().split('T')[0]}</p>
  <p>Generated: ${report.generationDate.toISOString().split('T')[0]}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Revenue: $${report.totalRevenue.toFixed(2)}</p>
    <p>Total Tax: $${report.totalTax.toFixed(2)}</p>
    <p>Net Revenue: $${report.netRevenue.toFixed(2)}</p>
    <p>Transaction Count: ${report.transactionCount}</p>
    ${report.comparisonPercentage !== undefined ? `<p>Compared to Previous Period: ${report.comparisonPercentage}%</p>` : ''}
  </div>
  
  <h2>Revenue by Category</h2>
  <table>
    <tr>
      <th>Category</th>
      <th>Gross Revenue</th>
      <th>Tax</th>
      <th>Net Revenue</th>
      <th>Percentage</th>
    </tr>
    ${report.categories.map(category => `
    <tr>
      <td>${category.name}</td>
      <td>$${category.grossRevenue.toFixed(2)}</td>
      <td>$${category.tax.toFixed(2)}</td>
      <td>$${category.netRevenue.toFixed(2)}</td>
      <td>${category.percentage}%</td>
    </tr>
    `).join('')}
    <tr class="total-row">
      <td>Total</td>
      <td>$${report.totalRevenue.toFixed(2)}</td>
      <td>$${report.totalTax.toFixed(2)}</td>
      <td>$${report.netRevenue.toFixed(2)}</td>
      <td>100%</td>
    </tr>
  </table>
  
  ${report.days && report.days.length > 0 ? `
  <h2>Revenue by Day</h2>
  <table>
    <tr>
      <th>Date</th>
      <th>Transactions</th>
      <th>Gross Revenue</th>
      <th>Tax</th>
      <th>Net Revenue</th>
    </tr>
    ${report.days.map(day => `
    <tr>
      <td>${day.date.toISOString().split('T')[0]}</td>
      <td>${day.transactionCount}</td>
      <td>$${day.grossRevenue.toFixed(2)}</td>
      <td>$${day.tax.toFixed(2)}</td>
      <td>$${day.netRevenue.toFixed(2)}</td>
    </tr>
    `).join('')}
    <tr class="total-row">
      <td>Total</td>
      <td>${report.transactionCount}</td>
      <td>$${report.totalRevenue.toFixed(2)}</td>
      <td>$${report.totalTax.toFixed(2)}</td>
      <td>$${report.netRevenue.toFixed(2)}</td>
    </tr>
  </table>
  ` : ''}
</body>
</html>
          `;
          break;
      }
      
      fs.writeFileSync(outputPath, outputContent);
      console.log(`Report saved to: ${outputPath}`);
    } else {
      // Print the report to the console
      console.log(JSON.stringify(report, null, 2));
    }
  } catch (error) {
    console.error('Failed to generate report:', error.message);
    process.exit(1);
  }
}

// Run the report generation
generateReport().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});