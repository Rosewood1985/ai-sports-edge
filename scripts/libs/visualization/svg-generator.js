/**
 * SVG Heatmap Generator for AI Sports Edge
 * 
 * Creates directory-tree-based visualizations of test coverage and Firebase usage.
 * Uses color gradients to represent risk levels.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  width: 1200,
  height: 800,
  padding: 20,
  nodeWidth: 120,
  nodeHeight: 30,
  nodeMargin: 10,
  levelIndent: 40,
  colors: {
    high: '#ff4d4d',    // Red for high risk
    medium: '#ffcc00',  // Yellow for medium risk
    low: '#66cc66',     // Green for low risk
    none: '#4d94ff',    // Blue for no risk
    text: '#333333',    // Dark gray for text
    line: '#cccccc'     // Light gray for lines
  },
  fontFamily: 'Arial, sans-serif',
  fontSize: 12
};

/**
 * Generate SVG heatmap from coverage data
 * @param {Array} coverageData - Array of file coverage objects
 * @param {string} outputPath - Path to save the SVG file
 * @returns {string} Path to the generated SVG file
 */
function generateHeatmap(coverageData, outputPath) {
  try {
    // Create directory structure
    const directoryTree = buildDirectoryTree(coverageData);
    
    // Calculate layout
    const layout = calculateLayout(directoryTree);
    
    // Generate SVG content
    const svg = generateSVG(layout);
    
    // Save SVG to file
    fs.writeFileSync(outputPath, svg);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating heatmap:', error.message);
    return null;
  }
}

/**
 * Build directory tree from coverage data
 * @param {Array} coverageData - Array of file coverage objects
 * @returns {Object} Directory tree object
 */
function buildDirectoryTree(coverageData) {
  const root = { name: 'root', children: [], files: [] };
  
  for (const file of coverageData) {
    const parts = file.file.split('/');
    let current = root;
    
    // Process directory parts
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      let child = current.children.find(c => c.name === part);
      
      if (!child) {
        child = { name: part, children: [], files: [], path: parts.slice(0, i + 1).join('/') };
        current.children.push(child);
      }
      
      current = child;
    }
    
    // Add file to the last directory
    current.files.push({
      name: parts[parts.length - 1],
      coverage: file.coverage,
      hasFirebase: file.hasFirebase,
      risk: file.risk,
      path: file.file
    });
  }
  
  return root;
}

/**
 * Calculate layout for the directory tree
 * @param {Object} tree - Directory tree object
 * @returns {Object} Layout object with positions for nodes
 */
function calculateLayout(tree) {
  const layout = { nodes: [], connections: [] };
  let y = CONFIG.padding;
  
  function processNode(node, level, x) {
    // Add directory node
    if (node.name !== 'root') {
      layout.nodes.push({
        x,
        y,
        width: CONFIG.nodeWidth,
        height: CONFIG.nodeHeight,
        name: node.name,
        type: 'directory',
        path: node.path
      });
      
      y += CONFIG.nodeHeight + CONFIG.nodeMargin;
    }
    
    // Process files
    for (const file of node.files) {
      layout.nodes.push({
        x: x + CONFIG.levelIndent,
        y,
        width: CONFIG.nodeWidth,
        height: CONFIG.nodeHeight,
        name: file.name,
        type: 'file',
        risk: file.risk,
        coverage: file.coverage,
        hasFirebase: file.hasFirebase,
        path: file.path
      });
      
      // Add connection to parent directory
      if (node.name !== 'root') {
        layout.connections.push({
          x1: x + CONFIG.nodeWidth / 2,
          y1: y - CONFIG.nodeMargin / 2,
          x2: x + CONFIG.levelIndent + CONFIG.nodeWidth / 2,
          y2: y + CONFIG.nodeHeight / 2
        });
      }
      
      y += CONFIG.nodeHeight + CONFIG.nodeMargin;
    }
    
    // Process subdirectories
    for (const child of node.children) {
      // Add connection to parent directory
      if (node.name !== 'root') {
        layout.connections.push({
          x1: x + CONFIG.nodeWidth / 2,
          y1: y - CONFIG.nodeMargin,
          x2: x + CONFIG.levelIndent + CONFIG.nodeWidth / 2,
          y2: y
        });
      }
      
      processNode(child, level + 1, x + CONFIG.levelIndent);
    }
  }
  
  processNode(tree, 0, CONFIG.padding);
  
  return layout;
}

/**
 * Generate SVG content from layout
 * @param {Object} layout - Layout object with positions for nodes
 * @returns {string} SVG content
 */
function generateSVG(layout) {
  // Calculate SVG dimensions
  const width = CONFIG.width;
  const height = Math.max(
    ...layout.nodes.map(node => node.y + node.height)
  ) + CONFIG.padding;
  
  // SVG header
  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .node { cursor: pointer; }
    .node:hover { opacity: 0.8; }
    .tooltip { display: none; }
    .node:hover .tooltip { display: block; }
    text { font-family: ${CONFIG.fontFamily}; font-size: ${CONFIG.fontSize}px; fill: ${CONFIG.colors.text}; }
  </style>
  <rect width="${width}" height="${height}" fill="white" />
`;
  
  // Draw connections
  for (const conn of layout.connections) {
    svg += `  <line x1="${conn.x1}" y1="${conn.y1}" x2="${conn.x2}" y2="${conn.y2}" stroke="${CONFIG.colors.line}" stroke-width="1" />
`;
  }
  
  // Draw nodes
  for (const node of layout.nodes) {
    let fillColor = CONFIG.colors.none;
    let tooltipText = '';
    
    if (node.type === 'file') {
      // Set color based on risk
      fillColor = CONFIG.colors[node.risk.toLowerCase()] || CONFIG.colors.none;
      
      // Create tooltip text
      tooltipText = `
      <rect x="${node.x - 5}" y="${node.y - 45}" width="160" height="40" fill="white" stroke="#333" rx="3" />
      <text x="${node.x + 5}" y="${node.y - 25}">Coverage: ${node.coverage}%</text>
      <text x="${node.x + 5}" y="${node.y - 10}">Firebase: ${node.hasFirebase ? 'Yes' : 'No'}</text>
    `;
    }
    
    svg += `  <g class="node" data-path="${node.path}">
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="${fillColor}" stroke="#333" rx="3" />
    <text x="${node.x + 5}" y="${node.y + node.height / 2 + 4}">${node.name}</text>
    <g class="tooltip">${tooltipText}</g>
  </g>
`;
  }
  
  // Add legend
  const legendY = height - 50;
  svg += `  <g class="legend">
    <rect x="20" y="${legendY}" width="15" height="15" fill="${CONFIG.colors.high}" />
    <text x="40" y="${legendY + 12}">High Risk</text>
    
    <rect x="120" y="${legendY}" width="15" height="15" fill="${CONFIG.colors.medium}" />
    <text x="140" y="${legendY + 12}">Medium Risk</text>
    
    <rect x="240" y="${legendY}" width="15" height="15" fill="${CONFIG.colors.low}" />
    <text x="260" y="${legendY + 12}">Low Risk</text>
    
    <rect x="340" y="${legendY}" width="15" height="15" fill="${CONFIG.colors.none}" />
    <text x="360" y="${legendY + 12}">No Risk</text>
  </g>
`;
  
  // Add interactive JavaScript
  svg += `  <script type="text/javascript">
    <![CDATA[
      // Add click handlers for nodes
      const nodes = document.querySelectorAll('.node');
      nodes.forEach(node => {
        node.addEventListener('click', () => {
          const path = node.getAttribute('data-path');
          console.log('Clicked:', path);
          // You can add more interactive features here
        });
      });
    ]]>
  </script>
`;
  
  // Close SVG
  svg += '</svg>';
  
  return svg;
}

/**
 * Generate a simple HTML wrapper for the SVG
 * @param {string} svgPath - Path to the SVG file
 * @param {string} outputPath - Path to save the HTML file
 * @returns {string} Path to the generated HTML file
 */
function generateHtmlWrapper(svgPath, outputPath) {
  try {
    const svgFilename = path.basename(svgPath);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Sports Edge Coverage Heatmap</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    h1 { color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    .heatmap { width: 100%; height: 800px; border: 1px solid #ccc; }
    .info { margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI Sports Edge Coverage Heatmap</h1>
    <div class="heatmap">
      <object data="${svgFilename}" type="image/svg+xml" width="100%" height="100%">
        Your browser does not support SVG
      </object>
    </div>
    <div class="info">
      <h2>Heatmap Information</h2>
      <p>This heatmap visualizes test coverage and Firebase usage across the codebase.</p>
      <ul>
        <li><strong>Red</strong>: High risk - Firebase components with low test coverage</li>
        <li><strong>Yellow</strong>: Medium risk - Firebase components with adequate test coverage</li>
        <li><strong>Green</strong>: Low risk - Non-Firebase components with low test coverage</li>
        <li><strong>Blue</strong>: No risk - Non-Firebase components with adequate test coverage</li>
      </ul>
      <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;
    
    fs.writeFileSync(outputPath, html);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating HTML wrapper:', error.message);
    return null;
  }
}

module.exports = {
  generateHeatmap,
  generateHtmlWrapper
};