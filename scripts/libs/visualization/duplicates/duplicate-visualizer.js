/**
 * Duplicate Visualizer for AI Sports Edge
 * 
 * Visualizes duplicate files and recommendations.
 * Generates HTML reports for duplicate files and recommendations.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Visualizes duplicate files and recommendations
 */
class DuplicateVisualizer {
  /**
   * Generate an HTML report of duplicate files
   * @param {Array} duplicateGroups Groups of duplicate/similar files
   * @param {Array} recommendations Recommendations for each group
   * @param {Object} options Configuration options
   * @returns {Promise<string>} Path to generated report
   */
  async generateReport(duplicateGroups, recommendations, options = {}) {
    const {
      outputDir = 'reports/duplicates',
      includeFileContents = false, // Whether to include file contents in the report
      maxFileSizeForContent = 10240, // Max file size to include content (10KB)
      projectRoot = process.cwd()
    } = options;
    
    // Create output directory
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating output directory: ${error.message}`);
      throw error;
    }
    
    // Generate report timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(outputDir, `duplicate-report-${timestamp}.html`);
    
    // Calculate summary statistics
    const totalGroups = duplicateGroups.length;
    const totalFiles = duplicateGroups.reduce(
      (sum, group) => sum + group.files.length, 
      0
    );
    const totalWastedSize = duplicateGroups.reduce(
      (sum, group) => sum + group.wastedSize, 
      0
    );
    const exactGroups = duplicateGroups.filter(
      group => group.type === 'exact'
    ).length;
    const similarGroups = duplicateGroups.filter(
      group => group.type === 'similar'
    ).length;
    
    // Generate report HTML
    const reportHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Duplicate Files Report - ${timestamp}</title>
      <style>
        :root {
          --primary-color: #4a6ee0;
          --secondary-color: #e9ecef;
          --success-color: #28a745;
          --warning-color: #ffc107;
          --danger-color: #dc3545;
          --info-color: #17a2b8;
          --light-color: #f8f9fa;
          --dark-color: #343a40;
          --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        body {
          font-family: var(--font-family);
          line-height: 1.5;
          color: #212529;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        
        .container {
          max-width: 1400px;
          margin: 0 auto;
          background-color: white;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        
        h1, h2, h3, h4 {
          color: var(--primary-color);
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        
        h1 {
          border-bottom: 2px solid var(--primary-color);
          padding-bottom: 10px;
        }
        
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        
        .summary-item {
          background-color: var(--light-color);
          border-left: 4px solid var(--primary-color);
          padding: 15px;
          border-radius: 4px;
        }
        
        .summary-title {
          font-size: 0.9em;
          color: #666;
          margin-bottom: 5px;
        }
        
        .summary-value {
          font-size: 1.8em;
          font-weight: bold;
          color: var(--dark-color);
        }
        
        .summary-subvalue {
          font-size: 0.8em;
          color: #666;
        }
        
        .duplicate-group {
          margin-bottom: 30px;
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
        }
        
        .duplicate-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background-color: var(--secondary-color);
          cursor: pointer;
        }
        
        .duplicate-info {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .duplicate-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: bold;
          color: white;
        }
        
        .badge-exact {
          background-color: var(--success-color);
        }
        
        .badge-similar {
          background-color: var(--warning-color);
          color: #212529;
        }
        
        .duplicate-content {
          padding: 15px;
        }
        
        .file-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        
        .file-item {
          padding: 10px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .file-item:last-child {
          border-bottom: none;
        }
        
        .file-path {
          font-family: monospace;
          word-break: break-all;
        }
        
        .file-keep {
          background-color: rgba(40, 167, 69, 0.1);
          border-left: 4px solid var(--success-color);
        }
        
        .file-remove {
          background-color: rgba(220, 53, 69, 0.1);
          border-left: 4px solid var(--danger-color);
        }
        
        .file-action {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .file-size {
          font-size: 0.9em;
          color: #666;
          white-space: nowrap;
        }
        
        .action-button {
          padding: 5px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8em;
          color: white;
        }
        
        .keep-button {
          background-color: var(--success-color);
        }
        
        .remove-button {
          background-color: var(--danger-color);
        }
        
        .file-content {
          margin-top: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .content-header {
          background-color: #f8f9fa;
          padding: 5px 10px;
          font-family: monospace;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
        }
        
        .content-body {
          max-height: 200px;
          overflow: auto;
          padding: 10px;
          font-family: monospace;
          font-size: 0.85em;
          white-space: pre-wrap;
          background-color: #f5f5f5;
        }
        
        .similarity-meter {
          height: 5px;
          width: 100%;
          background-color: #e9ecef;
          border-radius: 5px;
          overflow: hidden;
          margin-top: 5px;
        }
        
        .similarity-value {
          height: 100%;
          background-color: var(--primary-color);
        }
        
        .diff-view {
          display: flex;
          gap: 5px;
          margin-top: 15px;
        }
        
        .diff-column {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .toggle-button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--primary-color);
          font-size: 1.2em;
        }
        
        .hidden {
          display: none;
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }
          
          .summary {
            grid-template-columns: 1fr;
          }
          
          .diff-view {
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Duplicate Files Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <div class="summary">
          <div class="summary-item">
            <div class="summary-title">Total Duplicate Groups</div>
            <div class="summary-value">${totalGroups}</div>
            <div class="summary-subvalue">
              ${exactGroups} exact / ${similarGroups} similar
            </div>
          </div>
          
          <div class="summary-item">
            <div class="summary-title">Total Files Affected</div>
            <div class="summary-value">${totalFiles}</div>
            <div class="summary-subvalue">
              ${totalFiles - totalGroups} can be removed
            </div>
          </div>
          
          <div class="summary-item">
            <div class="summary-title">Total Wasted Space</div>
            <div class="summary-value">${this._formatSize(totalWastedSize)}</div>
            <div class="summary-subvalue">
              That could be reclaimed
            </div>
          </div>
          
          <div class="summary-item">
            <div class="summary-title">Automatic Decisions</div>
            <div class="summary-value">
              ${recommendations.filter(r => r.automaticDecision).length}
            </div>
            <div class="summary-subvalue">
              ${Math.round((recommendations.filter(r => r.automaticDecision).length / totalGroups) * 100)}% of groups
            </div>
          </div>
        </div>
        
        <h2>Duplicate Groups</h2>
        <p>Click on a group to expand details.</p>
        
        ${duplicateGroups.map((group, index) => {
          const recommendation = recommendations[index];
          
          return `
          <div class="duplicate-group">
            <div class="duplicate-header" onclick="toggleGroup('group-${index}')">
              <div class="duplicate-info">
                <span class="duplicate-badge badge-${group.type}">
                  ${group.type === 'exact' ? 'Exact Match' : 'Similar Files'}
                </span>
                <span>
                  ${group.files.length} files
                </span>
                <span>
                  ${this._formatSize(group.wastedSize)} wasted
                </span>
              </div>
              <button class="toggle-button">▼</button>
            </div>
            
            <div id="group-${index}" class="duplicate-content hidden">
              ${group.type === 'similar' ? `
                <div>
                  <strong>Similarity Score:</strong> ${Math.round(group.similarity * 100)}%
                  <div class="similarity-meter">
                    <div class="similarity-value" style="width: ${Math.round(group.similarity * 100)}%"></div>
                  </div>
                </div>
              ` : ''}
              
              <h3>Files</h3>
              <ul class="file-list">
                ${group.files.map((file, fileIndex) => {
                  const isFileToKeep = recommendation && 
                    recommendation.fileToKeep.path === file.path;
                  const fileClass = isFileToKeep ? 'file-keep' : 'file-remove';
                  
                  return `
                  <li class="file-item ${fileClass}">
                    <div>
                      <div class="file-path">${this._getRelativePath(file.path, projectRoot)}</div>
                      <div class="file-size">${this._formatSize(file.size)}</div>
                    </div>
                    <div class="file-action">
                      ${isFileToKeep ? 
                        '<span class="action-button keep-button">Keep</span>' : 
                        '<span class="action-button remove-button">Remove</span>'}
                    </div>
                  </li>
                  `;
                }).join('')}
              </ul>
              
              ${recommendation ? `
                <h3>Recommendation</h3>
                <p>
                  <strong>Action:</strong> 
                  ${recommendation.automaticDecision ? 
                    'Automatic decision to remove duplicate files' : 
                    'Manual review recommended'}
                </p>
                <p>
                  <strong>Safety Level:</strong> 
                  ${recommendation.safetyLevel === 'high' ? 
                    'High - Safe to remove' : 
                    recommendation.safetyLevel === 'medium' ? 
                      'Medium - Should be safe, but verify' : 
                      'Low - Manual review required'}
                </p>
              ` : ''}
              
              ${includeFileContents && group.files.length > 0 ? `
                <h3>File Contents</h3>
                ${group.files.map(file => {
                  // Only include content for files under the size limit
                  if (file.size > maxFileSizeForContent) {
                    return `
                    <div class="file-content">
                      <div class="content-header">${this._getRelativePath(file.path, projectRoot)}</div>
                      <div class="content-body">
                        File too large to display (${this._formatSize(file.size)})
                      </div>
                    </div>
                    `;
                  }
                  
                  // Try to read the file content
                  let fileContent = '';
                  try {
                    // Note: This is synchronous file reading, which is generally not recommended
                    // But for report generation it's acceptable
                    fileContent = require('fs').readFileSync(file.path, 'utf8');
                    // Escape HTML
                    fileContent = fileContent
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&#039;');
                  } catch (error) {
                    fileContent = `Error reading file: ${error.message}`;
                  }
                  
                  return `
                  <div class="file-content">
                    <div class="content-header">${this._getRelativePath(file.path, projectRoot)}</div>
                    <div class="content-body">${fileContent}</div>
                  </div>
                  `;
                }).join('')}
              ` : ''}
            </div>
          </div>
          `;
        }).join('')}
      </div>
      
      <script>
        function toggleGroup(id) {
          const element = document.getElementById(id);
          const button = element.previousElementSibling.querySelector('.toggle-button');
          
          if (element.classList.contains('hidden')) {
            element.classList.remove('hidden');
            button.textContent = '▲';
          } else {
            element.classList.add('hidden');
            button.textContent = '▼';
          }
        }
      </script>
    </body>
    </html>
    `;
    
    // Write report to file
    await fs.writeFile(reportFile, reportHtml);
    
    return reportFile;
  }
  
  /**
   * Generate a summary report for the command line
   * @param {Array} duplicateGroups Groups of duplicate/similar files
   * @param {Array} recommendations Recommendations for each group
   * @returns {string} Summary report
   */
  generateSummary(duplicateGroups, recommendations) {
    // Calculate summary statistics
    const totalGroups = duplicateGroups.length;
    const totalFiles = duplicateGroups.reduce(
      (sum, group) => sum + group.files.length, 
      0
    );
    const totalWastedSize = duplicateGroups.reduce(
      (sum, group) => sum + group.wastedSize, 
      0
    );
    const exactGroups = duplicateGroups.filter(
      group => group.type === 'exact'
    ).length;
    const similarGroups = duplicateGroups.filter(
      group => group.type === 'similar'
    ).length;
    const automaticDecisions = recommendations.filter(
      r => r.automaticDecision
    ).length;
    
    // Generate summary
    let summary = '\n=== Duplicate Files Summary ===\n\n';
    
    summary += `Total duplicate groups: ${totalGroups} (${exactGroups} exact, ${similarGroups} similar)\n`;
    summary += `Total files affected: ${totalFiles}\n`;
    summary += `Total wasted space: ${this._formatSize(totalWastedSize)}\n`;
    summary += `Automatic decisions: ${automaticDecisions} (${Math.round((automaticDecisions / totalGroups) * 100)}%)\n\n`;
    
    // Add top groups by wasted size
    summary += '=== Top Duplicate Groups ===\n\n';
    
    // Sort groups by wasted size
    const sortedGroups = [...duplicateGroups]
      .sort((a, b) => b.wastedSize - a.wastedSize)
      .slice(0, 5); // Top 5
    
    sortedGroups.forEach((group, index) => {
      const recommendation = recommendations.find(
        r => r.fileToKeep && r.fileToKeep.path === group.files[0].path
      );
      
      summary += `Group ${index + 1}: ${group.files.length} files, ${this._formatSize(group.wastedSize)} wasted\n`;
      summary += `Type: ${group.type === 'exact' ? 'Exact Match' : `Similar (${Math.round(group.similarity * 100)}%)`}\n`;
      
      if (recommendation) {
        summary += `Action: ${recommendation.automaticDecision ? 'Automatic Cleanup' : 'Manual Review'}\n`;
      }
      
      summary += 'Files:\n';
      group.files.forEach(file => {
        const isFileToKeep = recommendation && recommendation.fileToKeep.path === file.path;
        summary += `  ${isFileToKeep ? '[KEEP]' : '[REMOVE]'} ${file.path} (${this._formatSize(file.size)})\n`;
      });
      
      summary += '\n';
    });
    
    return summary;
  }
  
  /**
   * Helper method to get path relative to project root
   * @param {string} filePath Absolute file path
   * @param {string} projectRoot Project root path
   * @returns {string} Relative path
   */
  _getRelativePath(filePath, projectRoot) {
    if (filePath.startsWith(projectRoot)) {
      return filePath.substring(projectRoot.length + 1);
    }
    return filePath;
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

module.exports = new DuplicateVisualizer();