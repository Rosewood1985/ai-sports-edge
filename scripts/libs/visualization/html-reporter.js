/**
 * HTML Report Generator for AI Sports Edge
 * 
 * Creates comprehensive HTML reports for test coverage and Firebase usage.
 * Includes file tables with sorting and filtering, drill-down navigation,
 * and historical coverage trends.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  title: 'AI Sports Edge Coverage Report',
  colors: {
    high: '#ff4d4d',    // Red for high risk
    medium: '#ffcc00',  // Yellow for medium risk
    low: '#66cc66',     // Green for low risk
    none: '#4d94ff',    // Blue for no risk
    text: '#333333',    // Dark gray for text
    background: '#f8f9fa' // Light gray for background
  },
  thresholds: {
    low: 50,            // Below 50% is low coverage
    medium: 75          // Below 75% is medium coverage
  }
};

/**
 * Generate HTML report from coverage data
 * @param {Array} coverageData - Array of file coverage objects
 * @param {string} outputPath - Path to save the HTML file
 * @param {Object} options - Additional options
 * @returns {string} Path to the generated HTML file
 */
function generateReport(coverageData, outputPath, options = {}) {
  try {
    // Process coverage data
    const processedData = processCoverageData(coverageData);
    
    // Generate HTML content
    const html = generateHTML(processedData, options);
    
    // Save HTML to file
    fs.writeFileSync(outputPath, html);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating HTML report:', error.message);
    return null;
  }
}

/**
 * Process coverage data for reporting
 * @param {Array} coverageData - Array of file coverage objects
 * @returns {Object} Processed data for reporting
 */
function processCoverageData(coverageData) {
  // Group files by directory
  const filesByDirectory = {};
  
  for (const file of coverageData) {
    const dirPath = path.dirname(file.file);
    
    if (!filesByDirectory[dirPath]) {
      filesByDirectory[dirPath] = [];
    }
    
    filesByDirectory[dirPath].push(file);
  }
  
  // Calculate directory statistics
  const directoryStats = {};
  
  for (const [dir, files] of Object.entries(filesByDirectory)) {
    const totalFiles = files.length;
    const firebaseFiles = files.filter(f => f.hasFirebase).length;
    const totalCoverage = files.reduce((sum, f) => sum + f.coverage, 0) / totalFiles;
    const highRiskFiles = files.filter(f => f.risk === 'HIGH').length;
    
    directoryStats[dir] = {
      totalFiles,
      firebaseFiles,
      averageCoverage: Math.round(totalCoverage),
      highRiskFiles,
      files
    };
  }
  
  // Calculate overall statistics
  const totalFiles = coverageData.length;
  const firebaseFiles = coverageData.filter(f => f.hasFirebase).length;
  const totalCoverage = coverageData.reduce((sum, f) => sum + f.coverage, 0) / totalFiles;
  const highRiskFiles = coverageData.filter(f => f.risk === 'HIGH').length;
  
  const overallStats = {
    totalFiles,
    firebaseFiles,
    averageCoverage: Math.round(totalCoverage),
    highRiskFiles
  };
  
  return {
    files: coverageData,
    filesByDirectory,
    directoryStats,
    overallStats
  };
}

/**
 * Generate HTML content for the report
 * @param {Object} data - Processed coverage data
 * @param {Object} options - Additional options
 * @returns {string} HTML content
 */
function generateHTML(data, options) {
  const { files, filesByDirectory, directoryStats, overallStats } = data;
  const timestamp = new Date().toLocaleString();
  
  // Generate HTML header
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CONFIG.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: ${CONFIG.colors.background};
      color: ${CONFIG.colors.text};
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background-color: #333;
      color: white;
      padding: 20px;
      margin-bottom: 20px;
    }
    h1, h2, h3 {
      margin-top: 0;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .summary-card {
      background-color: white;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      width: 23%;
    }
    .summary-card h3 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .summary-card .value {
      font-size: 24px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background-color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
      cursor: pointer;
    }
    th:hover {
      background-color: #e6e6e6;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .risk-high {
      background-color: ${CONFIG.colors.high};
      color: white;
      padding: 3px 8px;
      border-radius: 3px;
    }
    .risk-medium {
      background-color: ${CONFIG.colors.medium};
      padding: 3px 8px;
      border-radius: 3px;
    }
    .risk-low {
      background-color: ${CONFIG.colors.low};
      padding: 3px 8px;
      border-radius: 3px;
    }
    .risk-none {
      background-color: ${CONFIG.colors.none};
      padding: 3px 8px;
      border-radius: 3px;
    }
    .coverage-bar {
      width: 100px;
      height: 15px;
      background-color: #eee;
      border-radius: 10px;
      overflow: hidden;
    }
    .coverage-fill {
      height: 100%;
      border-radius: 10px;
    }
    .directory-section {
      margin-bottom: 30px;
      background-color: white;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .directory-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .directory-content {
      display: none;
      margin-top: 15px;
    }
    .show {
      display: block;
    }
    .search-box {
      margin-bottom: 20px;
      padding: 10px;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .filters {
      display: flex;
      margin-bottom: 20px;
    }
    .filter {
      margin-right: 15px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>${CONFIG.title}</h1>
      <p>Generated on: ${timestamp}</p>
    </div>
  </header>
  
  <div class="container">
    <!-- Summary Section -->
    <section>
      <h2>Coverage Summary</h2>
      <div class="summary">
        <div class="summary-card">
          <h3>Total Files</h3>
          <div class="value">${overallStats.totalFiles}</div>
        </div>
        <div class="summary-card">
          <h3>Firebase Files</h3>
          <div class="value">${overallStats.firebaseFiles}</div>
        </div>
        <div class="summary-card">
          <h3>Average Coverage</h3>
          <div class="value">${overallStats.averageCoverage}%</div>
        </div>
        <div class="summary-card">
          <h3>High Risk Files</h3>
          <div class="value">${overallStats.highRiskFiles}</div>
        </div>
      </div>
    </section>
    
    <!-- Search and Filters -->
    <section>
      <h2>File Explorer</h2>
      <input type="text" id="searchBox" class="search-box" placeholder="Search files...">
      <div class="filters">
        <div class="filter">
          <label>
            <input type="checkbox" id="filterFirebase" checked>
            Firebase Files
          </label>
        </div>
        <div class="filter">
          <label>
            <input type="checkbox" id="filterHighRisk" checked>
            High Risk
          </label>
        </div>
        <div class="filter">
          <label>
            <input type="checkbox" id="filterMediumRisk" checked>
            Medium Risk
          </label>
        </div>
        <div class="filter">
          <label>
            <input type="checkbox" id="filterLowRisk" checked>
            Low Risk
          </label>
        </div>
      </div>
    </section>
    
    <!-- Directory Sections -->
`;
  
  // Generate directory sections
  for (const [dir, stats] of Object.entries(directoryStats)) {
    html += `
    <section class="directory-section" data-directory="${dir}">
      <div class="directory-header" onclick="toggleDirectory('${dir}')">
        <h3>${dir}</h3>
        <div>
          <span>${stats.totalFiles} files</span> | 
          <span>${stats.averageCoverage}% coverage</span> | 
          <span>${stats.highRiskFiles} high risk</span>
        </div>
      </div>
      <div id="${dir.replace(/\//g, '_')}" class="directory-content">
        <table>
          <thead>
            <tr>
              <th onclick="sortTable('${dir.replace(/\//g, '_')}', 0)">File</th>
              <th onclick="sortTable('${dir.replace(/\//g, '_')}', 1)">Coverage</th>
              <th onclick="sortTable('${dir.replace(/\//g, '_')}', 2)">Firebase</th>
              <th onclick="sortTable('${dir.replace(/\//g, '_')}', 3)">Risk</th>
            </tr>
          </thead>
          <tbody>
`;
    
    // Add files for this directory
    for (const file of stats.files) {
      const fileName = path.basename(file.file);
      const coverageColor = getCoverageColor(file.coverage);
      const riskClass = `risk-${file.risk.toLowerCase()}`;
      
      html += `
            <tr data-firebase="${file.hasFirebase}" data-risk="${file.risk.toLowerCase()}">
              <td>${fileName}</td>
              <td>
                <div class="coverage-bar">
                  <div class="coverage-fill" style="width: ${file.coverage}%; background-color: ${coverageColor};"></div>
                </div>
                ${file.coverage}%
              </td>
              <td>${file.hasFirebase ? 'Yes' : 'No'}</td>
              <td><span class="${riskClass}">${file.risk}</span></td>
            </tr>
`;
    }
    
    html += `
          </tbody>
        </table>
      </div>
    </section>
`;
  }
  
  // Add JavaScript for interactivity
  html += `
    <!-- JavaScript for interactivity -->
    <script>
      // Toggle directory content
      function toggleDirectory(dir) {
        const content = document.getElementById(dir.replace(/\\//g, '_'));
        content.classList.toggle('show');
      }
      
      // Sort table
      function sortTable(tableId, columnIndex) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // Sort rows
        rows.sort((a, b) => {
          const aValue = a.cells[columnIndex].textContent.trim();
          const bValue = b.cells[columnIndex].textContent.trim();
          
          // Handle numeric values (like coverage percentage)
          if (!isNaN(aValue) && !isNaN(bValue)) {
            return parseFloat(aValue) - parseFloat(bValue);
          }
          
          // Handle text values
          return aValue.localeCompare(bValue);
        });
        
        // Append sorted rows
        rows.forEach(row => tbody.appendChild(row));
      }
      
      // Search and filter functionality
      const searchBox = document.getElementById('searchBox');
      const filterFirebase = document.getElementById('filterFirebase');
      const filterHighRisk = document.getElementById('filterHighRisk');
      const filterMediumRisk = document.getElementById('filterMediumRisk');
      const filterLowRisk = document.getElementById('filterLowRisk');
      
      function applyFilters() {
        const searchTerm = searchBox.value.toLowerCase();
        const showFirebase = filterFirebase.checked;
        const showHighRisk = filterHighRisk.checked;
        const showMediumRisk = filterMediumRisk.checked;
        const showLowRisk = filterLowRisk.checked;
        
        // Get all rows
        const rows = document.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
          const fileName = row.cells[0].textContent.toLowerCase();
          const hasFirebase = row.getAttribute('data-firebase') === 'true';
          const risk = row.getAttribute('data-risk');
          
          // Check if row matches filters
          const matchesSearch = fileName.includes(searchTerm);
          const matchesFirebase = !hasFirebase || showFirebase;
          const matchesRisk = 
            (risk === 'high' && showHighRisk) ||
            (risk === 'medium' && showMediumRisk) ||
            (risk === 'low' && showLowRisk) ||
            (risk === 'none');
          
          // Show/hide row
          row.style.display = matchesSearch && matchesFirebase && matchesRisk ? '' : 'none';
        });
        
        // Show/hide directories with no visible files
        const directorySections = document.querySelectorAll('.directory-section');
        directorySections.forEach(section => {
          const visibleRows = section.querySelectorAll('tbody tr:not([style*="display: none"])');
          section.style.display = visibleRows.length > 0 ? '' : 'none';
        });
      }
      
      // Add event listeners
      searchBox.addEventListener('input', applyFilters);
      filterFirebase.addEventListener('change', applyFilters);
      filterHighRisk.addEventListener('change', applyFilters);
      filterMediumRisk.addEventListener('change', applyFilters);
      filterLowRisk.addEventListener('change', applyFilters);
      
      // Expand first directory by default
      const firstDirectory = document.querySelector('.directory-content');
      if (firstDirectory) {
        firstDirectory.classList.add('show');
      }
    </script>
    
    <footer class="footer">
      <p>AI Sports Edge Coverage Report | Generated by QA Heatmap Generator</p>
    </footer>
  </div>
</body>
</html>`;
  
  return html;
}

/**
 * Get color for coverage percentage
 * @param {number} coverage - Coverage percentage
 * @returns {string} Color code
 */
function getCoverageColor(coverage) {
  if (coverage < CONFIG.thresholds.low) {
    return CONFIG.colors.high;
  } else if (coverage < CONFIG.thresholds.medium) {
    return CONFIG.colors.medium;
  } else {
    return CONFIG.colors.low;
  }
}

module.exports = {
  generateReport
};