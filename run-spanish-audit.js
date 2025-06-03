/**
 * Standalone Spanish Content Audit Script
 * Checks for placeholder/mock data in Spanish translations and content
 */

const fs = require('fs');
const path = require('path');

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
  /placeholder/i,
  /example/i,
  /demo/i,
  /test.*data/i,
  /lorem.*ipsum/i,
  /dummy/i,
  /mock/i,
  /TODO/i,
  /FIXME/i,
  /\[.*\]/g, // Bracket placeholders like [Insert content here]
  /{{.*}}/g, // Template placeholders
  /sample/i,
  /temporal/i, // Spanish equivalent of "temporary"
  /prueba/i, // Spanish for "test"
  /ejemplo/i, // Spanish for "example"
];

// Files to audit
const SPANISH_FILES = [
  './atomic/atoms/translations/es.json',
  './atomic/atoms/translations/es-error-updates.json',
  './atomic/atoms/translations/odds-comparison-es.json',
  './public/locales/es/features.json',
];

/**
 * Check a file for placeholder content
 */
function checkFileForPlaceholders(filePath) {
  const results = {
    file: filePath,
    exists: false,
    issues: [],
    content: null,
  };

  try {
    if (fs.existsSync(filePath)) {
      results.exists = true;
      const content = fs.readFileSync(filePath, 'utf8');
      results.content = content;

      // Check each placeholder pattern
      PLACEHOLDER_PATTERNS.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            results.issues.push({
              pattern: pattern.toString(),
              match,
              line: findLineNumber(content, match),
              severity: determineSeverity(match),
            });
          });
        }
      });
    }
  } catch (error) {
    results.error = error.message;
  }

  return results;
}

/**
 * Find line number of a match in content
 */
function findLineNumber(content, match) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(match)) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Determine severity of an issue
 */
function determineSeverity(match) {
  const criticalPatterns = ['TODO', 'FIXME', 'placeholder', 'example'];
  const mediumPatterns = ['demo', 'test', 'sample'];

  const lowerMatch = match.toLowerCase();

  if (criticalPatterns.some(pattern => lowerMatch.includes(pattern.toLowerCase()))) {
    return 'high';
  } else if (mediumPatterns.some(pattern => lowerMatch.includes(pattern.toLowerCase()))) {
    return 'medium';
  }

  return 'low';
}

/**
 * Run the complete audit
 */
async function runSpanishContentAudit() {
  console.log('🔍 Starting Spanish Content Audit...\n');

  const auditResults = {
    timestamp: new Date().toISOString(),
    auditId: `spanish_content_audit_${Date.now()}`,
    files: [],
    summary: {
      totalFiles: 0,
      filesWithIssues: 0,
      totalIssues: 0,
      criticalIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
    },
    productionReadiness: {
      score: 0,
      status: 'pending',
      criticalIssues: [],
    },
  };

  // Check each Spanish file
  for (const filePath of SPANISH_FILES) {
    console.log(`📁 Checking: ${filePath}`);
    const fileResult = checkFileForPlaceholders(filePath);
    auditResults.files.push(fileResult);

    if (fileResult.exists) {
      auditResults.summary.totalFiles++;

      if (fileResult.issues.length > 0) {
        auditResults.summary.filesWithIssues++;
        auditResults.summary.totalIssues += fileResult.issues.length;

        console.log(`  ⚠️  Found ${fileResult.issues.length} issues:`);
        fileResult.issues.forEach(issue => {
          console.log(`    - Line ${issue.line}: "${issue.match}" (${issue.severity})`);

          if (issue.severity === 'high') auditResults.summary.criticalIssues++;
          else if (issue.severity === 'medium') auditResults.summary.mediumIssues++;
          else auditResults.summary.lowIssues++;
        });
      } else {
        console.log(`  ✅ No placeholder content found`);
      }
    } else {
      console.log(`  ❌ File not found`);
    }
    console.log('');
  }

  // Calculate production readiness
  let score = 100;
  score -= auditResults.summary.criticalIssues * 25;
  score -= auditResults.summary.mediumIssues * 10;
  score -= auditResults.summary.lowIssues * 5;

  let status = 'ready';
  if (auditResults.summary.criticalIssues > 0) {
    status = 'not_ready';
  } else if (auditResults.summary.mediumIssues > 3) {
    status = 'needs_review';
  }

  auditResults.productionReadiness = {
    score: Math.max(0, score),
    status,
    criticalIssues: auditResults.files
      .flatMap(f => f.issues)
      .filter(i => i.severity === 'high')
      .map(i => i.match),
  };

  // Print summary
  console.log('📊 AUDIT SUMMARY');
  console.log('==================');
  console.log(`Total files checked: ${auditResults.summary.totalFiles}`);
  console.log(`Files with issues: ${auditResults.summary.filesWithIssues}`);
  console.log(`Total issues found: ${auditResults.summary.totalIssues}`);
  console.log(`Critical issues: ${auditResults.summary.criticalIssues}`);
  console.log(`Medium issues: ${auditResults.summary.mediumIssues}`);
  console.log(`Low issues: ${auditResults.summary.lowIssues}`);
  console.log(`Production readiness score: ${auditResults.productionReadiness.score}/100`);
  console.log(`Status: ${auditResults.productionReadiness.status}`);

  if (auditResults.productionReadiness.status === 'ready') {
    console.log('\n✅ Spanish content is PRODUCTION READY!');
  } else if (auditResults.productionReadiness.status === 'needs_review') {
    console.log('\n⚠️  Spanish content needs review before production deployment.');
  } else {
    console.log('\n❌ Spanish content is NOT ready for production. Critical issues must be fixed.');
  }

  return auditResults;
}

// Run the audit if this script is executed directly
if (require.main === module) {
  runSpanishContentAudit()
    .then(results => {
      console.log('\n🎯 Audit completed successfully!');
      process.exit(results.productionReadiness.status === 'ready' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

module.exports = { runSpanishContentAudit };
