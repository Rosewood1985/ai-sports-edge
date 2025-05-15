#!/usr/bin/env node
/**
 * Coverage Report Generator for AI Sports Edge
 * 
 * Generates comprehensive coverage reports with visualizations.
 * Uses the QA Coverage Analyzer to collect data and the visualization
 * components to generate SVG heatmaps and HTML reports.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const svgGenerator = require('./libs/visualization/svg-generator');
const htmlReporter = require('./libs/visualization/html-reporter');

// Add logging
fs.appendFileSync('.roocode/tool_usage.log', `${new Date()}: Running ${path.basename(__filename)}\n`);

// Configuration
const CONFIG = {
  outputDir: './reports/coverage',
  heatmapDir: './reports/coverage/heatmaps',
  htmlDir: './reports/coverage/html',
  historyDir: './reports/coverage/history',
  timestamp: new Date().toISOString().replace(/[:.]/g, '-')
};

/**
 * Main function
 */
async function main() {
  try {
    console.log('Generating coverage report...');
    
    // Create output directories if they don't exist
    ensureDirectoriesExist();
    
    // Run QA Coverage Analyzer to get coverage data
    console.log('Collecting coverage data...');
    const coverageData = await collectCoverageData();
    
    if (!coverageData || coverageData.length === 0) {
      console.error('No coverage data found.');
      process.exit(1);
    }
    
    console.log(`Found ${coverageData.length} files with coverage data.`);
    
    // Save coverage data to history
    saveCoverageHistory(coverageData);
    
    // Generate SVG heatmap
    console.log('Generating SVG heatmap...');
    const svgPath = path.join(CONFIG.heatmapDir, `heatmap-${CONFIG.timestamp}.svg`);
    const svgResult = svgGenerator.generateHeatmap(coverageData, svgPath);
    
    if (svgResult) {
      console.log(`SVG heatmap saved to ${svgResult}`);
      
      // Generate HTML wrapper for SVG
      const svgHtmlPath = path.join(CONFIG.heatmapDir, `heatmap-${CONFIG.timestamp}.html`);
      const svgHtmlResult = svgGenerator.generateHtmlWrapper(svgPath, svgHtmlPath);
      
      if (svgHtmlResult) {
        console.log(`SVG HTML wrapper saved to ${svgHtmlResult}`);
      }
    }
    
    // Generate HTML report
    console.log('Generating HTML report...');
    const htmlPath = path.join(CONFIG.htmlDir, `report-${CONFIG.timestamp}.html`);
    const htmlResult = htmlReporter.generateReport(coverageData, htmlPath);
    
    if (htmlResult) {
      console.log(`HTML report saved to ${htmlResult}`);
    }
    
    // Create latest symlinks
    createLatestSymlinks(svgPath, htmlPath);
    
    console.log('Coverage report generation complete!');
    
    // Open the HTML report in the default browser
    openReport(htmlPath);
    
  } catch (error) {
    console.error(`Error generating coverage report: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Ensure output directories exist
 */
function ensureDirectoriesExist() {
  [CONFIG.outputDir, CONFIG.heatmapDir, CONFIG.htmlDir, CONFIG.historyDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Collect coverage data from QA Coverage Analyzer
 * @returns {Array} Coverage data
 */
async function collectCoverageData() {
  try {
    // Check if coverage data file exists
    const coverageDataPath = './reports/firebase-coverage.json';
    
    if (fs.existsSync(coverageDataPath)) {
      // Use existing coverage data
      const data = fs.readFileSync(coverageDataPath, 'utf8');
      return JSON.parse(data);
    } else {
      // Run QA Coverage Analyzer to generate coverage data
      console.log('Running QA Coverage Analyzer...');
      execSync('./scripts/qa-coverage-analyzer.js', { stdio: 'inherit' });
      
      // Check if coverage data file was created
      if (fs.existsSync(coverageDataPath)) {
        const data = fs.readFileSync(coverageDataPath, 'utf8');
        return JSON.parse(data);
      } else {
        throw new Error('QA Coverage Analyzer did not generate coverage data.');
      }
    }
  } catch (error) {
    console.error(`Error collecting coverage data: ${error.message}`);
    return null;
  }
}

/**
 * Save coverage data to history
 * @param {Array} coverageData - Coverage data
 */
function saveCoverageHistory(coverageData) {
  try {
    const historyPath = path.join(CONFIG.historyDir, `coverage-${CONFIG.timestamp}.json`);
    
    // Add timestamp to coverage data
    const dataWithTimestamp = {
      timestamp: new Date().toISOString(),
      data: coverageData
    };
    
    // Save to history
    fs.writeFileSync(historyPath, JSON.stringify(dataWithTimestamp, null, 2));
    console.log(`Coverage history saved to ${historyPath}`);
    
    // Update latest history symlink
    const latestPath = path.join(CONFIG.historyDir, 'coverage-latest.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(historyPath, latestPath);
  } catch (error) {
    console.error(`Error saving coverage history: ${error.message}`);
  }
}

/**
 * Create symlinks to the latest reports
 * @param {string} svgPath - Path to SVG file
 * @param {string} htmlPath - Path to HTML file
 */
function createLatestSymlinks(svgPath, htmlPath) {
  try {
    // Create symlink for latest SVG
    const latestSvgPath = path.join(CONFIG.heatmapDir, 'heatmap-latest.svg');
    if (fs.existsSync(latestSvgPath)) {
      fs.unlinkSync(latestSvgPath);
    }
    fs.symlinkSync(svgPath, latestSvgPath);
    
    // Create symlink for latest SVG HTML
    const latestSvgHtmlPath = path.join(CONFIG.heatmapDir, 'heatmap-latest.html');
    if (fs.existsSync(latestSvgHtmlPath)) {
      fs.unlinkSync(latestSvgHtmlPath);
    }
    fs.symlinkSync(path.join(CONFIG.heatmapDir, `heatmap-${CONFIG.timestamp}.html`), latestSvgHtmlPath);
    
    // Create symlink for latest HTML report
    const latestHtmlPath = path.join(CONFIG.htmlDir, 'report-latest.html');
    if (fs.existsSync(latestHtmlPath)) {
      fs.unlinkSync(latestHtmlPath);
    }
    fs.symlinkSync(htmlPath, latestHtmlPath);
    
    console.log('Created symlinks to latest reports.');
  } catch (error) {
    console.error(`Error creating symlinks: ${error.message}`);
  }
}

/**
 * Open the report in the default browser
 * @param {string} reportPath - Path to the report
 */
function openReport(reportPath) {
  try {
    const platform = process.platform;
    const command = platform === 'win32' ? 'start' :
                    platform === 'darwin' ? 'open' :
                    'xdg-open';
    
    console.log(`Opening report in browser: ${reportPath}`);
    execSync(`${command} ${reportPath}`);
  } catch (error) {
    console.error(`Error opening report: ${error.message}`);
  }
}

// Run the main function
main();