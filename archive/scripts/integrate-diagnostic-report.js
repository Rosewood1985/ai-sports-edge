#!/usr/bin/env node

/**
 * integrate-diagnostic-report.js
 * 
 * This script integrates the AI Sports Edge Dev Container Diagnostic Report
 * into the memory bank system, updating relevant memory bank files with
 * key insights from the report.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const MEMORY_BANK_DIR = path.join(PROJECT_ROOT, 'memory-bank');
const REPORT_PATH = path.join(PROJECT_ROOT, 'ai-sports-edge-dev-container-diagnostic-report.md');

// Memory bank files
const ACTIVE_CONTEXT_PATH = path.join(MEMORY_BANK_DIR, 'activeContext.md');
const SYSTEM_PATTERNS_PATH = path.join(MEMORY_BANK_DIR, 'systemPatterns.md');
const PROGRESS_PATH = path.join(MEMORY_BANK_DIR, 'progress.md');
const DECISION_LOG_PATH = path.join(MEMORY_BANK_DIR, 'decisionLog.md');

// Check if report exists
if (!fs.existsSync(REPORT_PATH)) {
  console.error(`Error: Diagnostic report not found at ${REPORT_PATH}`);
  process.exit(1);
}

// Check if memory bank exists
if (!fs.existsSync(MEMORY_BANK_DIR)) {
  console.error(`Error: Memory bank directory not found at ${MEMORY_BANK_DIR}`);
  process.exit(1);
}

// Read the diagnostic report
const reportContent = fs.readFileSync(REPORT_PATH, 'utf8');

// Extract key sections
const extractSection = (content, sectionTitle) => {
  const sectionRegex = new RegExp(`## ${sectionTitle}[\\s\\S]*?(?=## |$)`, 'g');
  const match = content.match(sectionRegex);
  return match ? match[0] : '';
};

const fileStructureSection = extractSection(reportContent, '📁 File/Folder Structure Analysis');
const scriptEcosystemSection = extractSection(reportContent, '🔄 Script Ecosystem Evaluation');
const commandInterfaceSection = extractSection(reportContent, '⌨️ Command Interface Catalog');
const contextSystemSection = extractSection(reportContent, '🔄 Continuous Context System Health Check');
const migrationProgressSection = extractSection(reportContent, '🔀 Migration & Consolidation Progress');
const systemHealthSection = extractSection(reportContent, '✅ System Health & Improvement Opportunities');

// Update activeContext.md
console.log('Updating activeContext.md...');
let activeContextContent = fs.readFileSync(ACTIVE_CONTEXT_PATH, 'utf8');

// Add diagnostic report summary to activeContext.md
const activeContextUpdate = `
## Dev Container Diagnostic Report Summary (${new Date().toISOString().split('T')[0]})

${systemHealthSection}

### Key Metrics
- Firebase Migration Progress: ${reportContent.includes('Firebase Migration Progress:') ? 
  reportContent.match(/Firebase Migration Progress:.*?(\d+)%/)[1] + '%' : 'N/A'}
- Total Scripts: ${reportContent.includes('Total Scripts') ? 
  reportContent.match(/Total Scripts:.*?(\d+)\+/)[1] + '+' : 'N/A'}
- Command Interfaces: NPM Scripts, Makefile, Ops.ts CLI

[Full Diagnostic Report](../ai-sports-edge-dev-container-diagnostic-report.md)
`;

// Check if diagnostic report section already exists
if (activeContextContent.includes('## Dev Container Diagnostic Report Summary')) {
  // Replace existing section
  activeContextContent = activeContextContent.replace(
    /## Dev Container Diagnostic Report Summary[\s\S]*?(?=## |$)/,
    activeContextUpdate
  );
} else {
  // Add new section at the end
  activeContextContent += '\n' + activeContextUpdate;
}

fs.writeFileSync(ACTIVE_CONTEXT_PATH, activeContextContent);

// Update systemPatterns.md
console.log('Updating systemPatterns.md...');
let systemPatternsContent = fs.readFileSync(SYSTEM_PATTERNS_PATH, 'utf8');

// Add script ecosystem and command interface sections to systemPatterns.md
const systemPatternsUpdate = `
## Dev Container System Patterns (${new Date().toISOString().split('T')[0]})

${scriptEcosystemSection}

${commandInterfaceSection}

${contextSystemSection}
`;

// Check if dev container section already exists
if (systemPatternsContent.includes('## Dev Container System Patterns')) {
  // Replace existing section
  systemPatternsContent = systemPatternsContent.replace(
    /## Dev Container System Patterns[\s\S]*?(?=## |$)/,
    systemPatternsUpdate
  );
} else {
  // Add new section at the end
  systemPatternsContent += '\n' + systemPatternsUpdate;
}

fs.writeFileSync(SYSTEM_PATTERNS_PATH, systemPatternsContent);

// Update progress.md
console.log('Updating progress.md...');
let progressContent = fs.readFileSync(PROGRESS_PATH, 'utf8');

// Add migration progress section to progress.md
const progressUpdate = `
## Migration Progress (${new Date().toISOString().split('T')[0]})

${migrationProgressSection}

### File Structure Status
${fileStructureSection.split('\n').slice(1, 10).join('\n')}

[Full Diagnostic Report](../ai-sports-edge-dev-container-diagnostic-report.md)
`;

// Check if migration progress section already exists
if (progressContent.includes('## Migration Progress')) {
  // Replace existing section
  progressContent = progressContent.replace(
    /## Migration Progress[\s\S]*?(?=## |$)/,
    progressUpdate
  );
} else {
  // Add new section at the end
  progressContent += '\n' + progressUpdate;
}

fs.writeFileSync(PROGRESS_PATH, progressContent);

// Update decisionLog.md
console.log('Updating decisionLog.md...');
let decisionLogContent = fs.readFileSync(DECISION_LOG_PATH, 'utf8');

// Extract improvement recommendations
const improvementRecommendations = systemHealthSection.split('\n')
  .filter(line => line.match(/^\d+\./))
  .join('\n');

// Add improvement recommendations to decisionLog.md
const decisionLogUpdate = `
## System Improvement Recommendations (${new Date().toISOString().split('T')[0]})

Based on the Dev Container Diagnostic Report, the following improvements are recommended:

${improvementRecommendations}

### Rationale
The diagnostic report identified several areas where the development container and project structure could be improved for better maintainability, reduced context loss, and more efficient workflows. These recommendations address the most critical issues identified in the report.

### Implementation Plan
1. Start with script consolidation to reduce complexity
2. Standardize on ops.ts CLI for all operations
3. Integrate all scripts with context tracking
4. Complete Firebase migration
5. Clean up orphaned files

[Full Diagnostic Report](../ai-sports-edge-dev-container-diagnostic-report.md)
`;

// Check if system improvement section already exists
if (decisionLogContent.includes('## System Improvement Recommendations')) {
  // Replace existing section
  decisionLogContent = decisionLogContent.replace(
    /## System Improvement Recommendations[\s\S]*?(?=## |$)/,
    decisionLogUpdate
  );
} else {
  // Add new section at the end
  decisionLogContent += '\n' + decisionLogUpdate;
}

fs.writeFileSync(DECISION_LOG_PATH, decisionLogContent);

console.log('Diagnostic report successfully integrated into memory bank!');