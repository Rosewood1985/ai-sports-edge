/**
 * Improved Spanish Content Audit Script
 * Context-aware checking for actual placeholder/mock data in Spanish translations
 */

const fs = require('fs');
const path = require('path');

// Legitimate Spanish words that contain English placeholder-like patterns
const SPANISH_EXCEPTIONS = [
  'recomendaciones', // contains "demo"
  'todo', // "Ver todo" = "View all"
  'prueba', // "prueba gratuita" = "free trial"
  'ejemplo', // when used as "por ejemplo" = "for example"
  'temporal', // "zona temporal" = "time zone"
];

// Template placeholders (these are legitimate in i18n files)
const TEMPLATE_PATTERNS = [
  /{{[^}]+}}/g, // {{variable}} template syntax
];

// Actual problematic patterns to flag
const REAL_PLACEHOLDER_PATTERNS = [
  /\[.*insert.*\]/i,
  /\[.*content.*here.*\]/i,
  /\[.*placeholder.*\]/i,
  /TODO:.*fix/i,
  /FIXME:.*replace/i,
  /\btodo\s*:\s*[^a-z]/i, // "TODO: " followed by non-lowercase (likely a comment)
  /\btest\s+data\b/i,
  /\bmock\s+data\b/i,
  /\bplaceholder\s+text\b/i,
  /lorem\s+ipsum/i,
  /\bsample\s+content\b/i,
  /\bexample\.com\b/i,
  /\btest@test\.com\b/i,
  /\b123-456-7890\b/, // Sample phone numbers
  /\b555-\d{4}\b/, // Sample phone numbers
];

/**
 * Check if a match is a legitimate Spanish word
 */
function isLegitimateSpanishWord(match, context) {
  const lowerMatch = match.toLowerCase();
  const lowerContext = context.toLowerCase();
  
  // Check if it's part of a known Spanish phrase
  if (lowerMatch === 'todo' && lowerContext.includes('ver todo')) {
    return true;
  }
  
  if (lowerMatch.includes('demo') && lowerContext.includes('recomendaciones')) {
    return true;
  }
  
  if (lowerMatch === 'prueba' && lowerContext.includes('prueba gratuita')) {
    return true;
  }
  
  if (lowerMatch === 'ejemplo' && lowerContext.includes('por ejemplo')) {
    return true;
  }
  
  return false;
}

/**
 * Check if a pattern is a legitimate template variable
 */
function isTemplateVariable(match) {
  return TEMPLATE_PATTERNS.some(pattern => pattern.test(match));
}

/**
 * Improved file checking for actual placeholder content
 */
function checkFileForRealPlaceholders(filePath) {
  const results = {
    file: filePath,
    exists: false,
    issues: [],
    templateVariables: [],
    legitimateSpanish: [],
    content: null
  };

  try {
    if (fs.existsSync(filePath)) {
      results.exists = true;
      const content = fs.readFileSync(filePath, 'utf8');
      results.content = content;

      // Check for actual problematic patterns
      REAL_PLACEHOLDER_PATTERNS.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const lineNumber = findLineNumber(content, match);
            const lineContext = getLineContext(content, lineNumber);
            
            if (!isLegitimateSpanishWord(match, lineContext)) {
              results.issues.push({
                pattern: pattern.toString(),
                match: match,
                line: lineNumber,
                context: lineContext.trim(),
                severity: 'high'
              });
            }
          });
        }
      });

      // Track template variables (these are legitimate)
      TEMPLATE_PATTERNS.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            results.templateVariables.push({
              match: match,
              line: findLineNumber(content, match)
            });
          });
        }
      });
      
      // Track legitimate Spanish words that might trigger false positives
      SPANISH_EXCEPTIONS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          matches.forEach(match => {
            results.legitimateSpanish.push({
              word: match,
              line: findLineNumber(content, match)
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
 * Get context around a line
 */
function getLineContext(content, lineNumber) {
  const lines = content.split('\n');
  if (lineNumber > 0 && lineNumber <= lines.length) {
    return lines[lineNumber - 1];
  }
  return '';
}

/**
 * Run the improved Spanish content audit
 */
async function runImprovedSpanishAudit() {
  console.log('🔍 Starting Improved Spanish Content Audit...\n');
  
  const SPANISH_FILES = [
    './atomic/atoms/translations/es.json',
    './atomic/atoms/translations/es-error-updates.json',
    './atomic/atoms/translations/odds-comparison-es.json',
    './public/locales/es/features.json'
  ];
  
  const auditResults = {
    timestamp: new Date().toISOString(),
    auditId: `improved_spanish_audit_${Date.now()}`,
    files: [],
    summary: {
      totalFiles: 0,
      filesWithIssues: 0,
      totalRealIssues: 0,
      templateVariables: 0,
      legitimateSpanishWords: 0
    },
    productionReadiness: {
      score: 0,
      status: 'pending',
      realIssues: []
    }
  };

  // Check each Spanish file with improved logic
  for (const filePath of SPANISH_FILES) {
    console.log(`📁 Checking: ${filePath}`);
    const fileResult = checkFileForRealPlaceholders(filePath);
    auditResults.files.push(fileResult);
    
    if (fileResult.exists) {
      auditResults.summary.totalFiles++;
      auditResults.summary.templateVariables += fileResult.templateVariables.length;
      auditResults.summary.legitimateSpanishWords += fileResult.legitimateSpanish.length;
      
      if (fileResult.issues.length > 0) {
        auditResults.summary.filesWithIssues++;
        auditResults.summary.totalRealIssues += fileResult.issues.length;
        
        console.log(`  ⚠️  Found ${fileResult.issues.length} REAL issues:`);
        fileResult.issues.forEach(issue => {
          console.log(`    - Line ${issue.line}: "${issue.match}" (${issue.severity})`);
          console.log(`      Context: ${issue.context}`);
        });
      } else {
        console.log(`  ✅ No actual placeholder content found`);
      }
      
      if (fileResult.templateVariables.length > 0) {
        console.log(`  📋 Found ${fileResult.templateVariables.length} legitimate template variables`);
      }
      
      if (fileResult.legitimateSpanish.length > 0) {
        console.log(`  🇪🇸 Found ${fileResult.legitimateSpanish.length} legitimate Spanish words`);
      }
    } else {
      console.log(`  ❌ File not found`);
    }
    console.log('');
  }

  // Calculate production readiness based on REAL issues only
  let score = 100;
  score -= auditResults.summary.totalRealIssues * 25; // Only real issues count

  let status = 'ready';
  if (auditResults.summary.totalRealIssues > 0) {
    status = 'not_ready';
  }

  auditResults.productionReadiness = {
    score: Math.max(0, score),
    status,
    realIssues: auditResults.files
      .flatMap(f => f.issues)
      .map(i => i.match)
  };

  // Print summary
  console.log('📊 IMPROVED AUDIT SUMMARY');
  console.log('==========================');
  console.log(`Total files checked: ${auditResults.summary.totalFiles}`);
  console.log(`Files with REAL issues: ${auditResults.summary.filesWithIssues}`);
  console.log(`REAL issues found: ${auditResults.summary.totalRealIssues}`);
  console.log(`Template variables (legitimate): ${auditResults.summary.templateVariables}`);
  console.log(`Spanish words (legitimate): ${auditResults.summary.legitimateSpanishWords}`);
  console.log(`Production readiness score: ${auditResults.productionReadiness.score}/100`);
  console.log(`Status: ${auditResults.productionReadiness.status}`);

  if (auditResults.productionReadiness.status === 'ready') {
    console.log('\n✅ Spanish content is PRODUCTION READY!');
    console.log('   All detected patterns are either legitimate Spanish words or template variables.');
  } else {
    console.log('\n❌ Spanish content has real issues that need fixing.');
    console.log('   The following are actual placeholder content that should be replaced:');
    auditResults.productionReadiness.realIssues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }

  return auditResults;
}

// Run the improved audit if this script is executed directly
if (require.main === module) {
  runImprovedSpanishAudit()
    .then(results => {
      console.log('\n🎯 Improved audit completed successfully!');
      process.exit(results.productionReadiness.status === 'ready' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

module.exports = { runImprovedSpanishAudit };