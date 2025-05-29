/**
 * Comprehensive Performance Audit Script
 * 
 * Runs a complete performance analysis of the AI Sports Edge platform,
 * including bundle analysis, image optimization, and advanced performance metrics.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensivePerformanceAudit {
  constructor() {
    this.auditResults = {
      timestamp: new Date().toISOString(),
      bundleAnalysis: null,
      performanceMetrics: null,
      imageOptimization: null,
      recommendations: [],
      scores: {},
    };
  }

  /**
   * Run complete performance audit
   */
  async runAudit() {
    console.log('🔍 Starting Comprehensive Performance Audit...\n');

    try {
      // 1. Bundle Analysis
      console.log('📦 Running Bundle Analysis...');
      await this.runBundleAnalysis();

      // 2. Performance Metrics Collection
      console.log('📊 Collecting Performance Metrics...');
      await this.collectPerformanceMetrics();

      // 3. Image Optimization Analysis
      console.log('🖼️  Analyzing Image Optimization...');
      await this.analyzeImageOptimization();

      // 4. Dependency Analysis
      console.log('📚 Analyzing Dependencies...');
      await this.analyzeDependencies();

      // 5. Code Quality Analysis
      console.log('🔍 Running Code Quality Analysis...');
      await this.runCodeQualityAnalysis();

      // 6. Security Analysis
      console.log('🛡️  Running Security Analysis...');
      await this.runSecurityAnalysis();

      // 7. Generate Recommendations
      console.log('💡 Generating Recommendations...');
      await this.generateRecommendations();

      // 8. Calculate Performance Scores
      console.log('📈 Calculating Performance Scores...');
      this.calculatePerformanceScores();

      // 9. Generate Report
      console.log('📄 Generating Audit Report...');
      await this.generateAuditReport();

      console.log('\n✅ Comprehensive Performance Audit Complete!');
      console.log(`📊 Overall Performance Score: ${this.auditResults.scores.overall}/100`);

    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run bundle analysis
   */
  async runBundleAnalysis() {
    try {
      // Check if webpack stats exist
      const statsPath = path.join(process.cwd(), 'dist', 'bundle-stats.json');
      
      if (!fs.existsSync(statsPath)) {
        console.log('   Building bundle with analysis...');
        execSync('ANALYZE_BUNDLE=true npm run build:prod', { stdio: 'pipe' });
      }

      if (fs.existsSync(statsPath)) {
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        
        this.auditResults.bundleAnalysis = {
          totalSize: this.calculateTotalBundleSize(stats),
          chunks: this.analyzeBundleChunks(stats),
          dependencies: this.analyzeBundleDependencies(stats),
          duplicates: this.findDuplicateModules(stats),
        };

        console.log(`   ✅ Bundle Size: ${this.formatBytes(this.auditResults.bundleAnalysis.totalSize)}`);
      } else {
        console.log('   ⚠️  Bundle stats not available');
        this.auditResults.bundleAnalysis = { error: 'Stats not available' };
      }

    } catch (error) {
      console.log(`   ❌ Bundle analysis failed: ${error.message}`);
      this.auditResults.bundleAnalysis = { error: error.message };
    }
  }

  /**
   * Calculate total bundle size from webpack stats
   */
  calculateTotalBundleSize(stats) {
    if (!stats.assets) return 0;
    return stats.assets
      .filter(asset => asset.name.endsWith('.js') || asset.name.endsWith('.css'))
      .reduce((total, asset) => total + asset.size, 0);
  }

  /**
   * Analyze bundle chunks
   */
  analyzeBundleChunks(stats) {
    if (!stats.chunks) return [];
    
    return stats.chunks.map(chunk => ({
      id: chunk.id,
      names: chunk.names,
      size: chunk.size,
      modules: chunk.modules ? chunk.modules.length : 0,
      files: chunk.files,
    })).sort((a, b) => b.size - a.size);
  }

  /**
   * Analyze bundle dependencies
   */
  analyzeBundleDependencies(stats) {
    if (!stats.modules) return [];

    const dependencies = {};
    
    stats.modules.forEach(module => {
      if (module.name && module.name.includes('node_modules')) {
        const match = module.name.match(/node_modules\/([^\/]+)/);
        if (match) {
          const packageName = match[1];
          if (!dependencies[packageName]) {
            dependencies[packageName] = { size: 0, modules: 0 };
          }
          dependencies[packageName].size += module.size || 0;
          dependencies[packageName].modules += 1;
        }
      }
    });

    return Object.entries(dependencies)
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 20); // Top 20 largest dependencies
  }

  /**
   * Find duplicate modules in bundle
   */
  findDuplicateModules(stats) {
    if (!stats.modules) return [];

    const moduleMap = {};
    const duplicates = [];

    stats.modules.forEach(module => {
      if (module.name) {
        const normalizedName = module.name.replace(/\?.*$/, ''); // Remove query parameters
        if (!moduleMap[normalizedName]) {
          moduleMap[normalizedName] = [];
        }
        moduleMap[normalizedName].push(module);
      }
    });

    Object.entries(moduleMap).forEach(([name, modules]) => {
      if (modules.length > 1) {
        const totalSize = modules.reduce((sum, mod) => sum + (mod.size || 0), 0);
        duplicates.push({
          name,
          instances: modules.length,
          totalSize,
          wastedBytes: totalSize - (modules[0].size || 0),
        });
      }
    });

    return duplicates.sort((a, b) => b.wastedBytes - a.wastedBytes).slice(0, 10);
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const metrics = {
        buildTime: await this.measureBuildTime(),
        bundleSize: this.auditResults.bundleAnalysis?.totalSize || 0,
        dependencies: await this.analyzeDependencyMetrics(),
        codeComplexity: await this.analyzeCodeComplexity(),
      };

      this.auditResults.performanceMetrics = metrics;
      
      console.log(`   ✅ Build Time: ${metrics.buildTime}ms`);
      console.log(`   ✅ Dependencies: ${metrics.dependencies.total} packages`);

    } catch (error) {
      console.log(`   ❌ Performance metrics collection failed: ${error.message}`);
      this.auditResults.performanceMetrics = { error: error.message };
    }
  }

  /**
   * Measure build time
   */
  async measureBuildTime() {
    const startTime = Date.now();
    
    try {
      // Run a quick build to measure time
      execSync('npm run build:prod', { stdio: 'pipe' });
      return Date.now() - startTime;
    } catch (error) {
      return -1; // Build failed
    }
  }

  /**
   * Analyze dependency metrics
   */
  async analyzeDependencyMetrics() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      
      return {
        total: Object.keys(dependencies).length + Object.keys(devDependencies).length,
        production: Object.keys(dependencies).length,
        development: Object.keys(devDependencies).length,
        outdated: await this.checkOutdatedDependencies(),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Check for outdated dependencies
   */
  async checkOutdatedDependencies() {
    try {
      const result = execSync('npm outdated --json', { stdio: 'pipe', encoding: 'utf8' });
      const outdated = JSON.parse(result || '{}');
      return Object.keys(outdated).length;
    } catch (error) {
      // npm outdated returns non-zero exit code when outdated packages are found
      try {
        const outdated = JSON.parse(error.stdout || '{}');
        return Object.keys(outdated).length;
      } catch {
        return 0;
      }
    }
  }

  /**
   * Analyze code complexity
   */
  async analyzeCodeComplexity() {
    try {
      // Count files and lines
      const srcPath = path.join(process.cwd(), 'src');
      const stats = this.analyzeDirectoryStats(srcPath);
      
      return {
        totalFiles: stats.files,
        totalLines: stats.lines,
        averageLinesPerFile: Math.round(stats.lines / stats.files),
        complexity: this.calculateComplexityScore(stats),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Analyze directory statistics
   */
  analyzeDirectoryStats(dirPath) {
    let stats = { files: 0, lines: 0 };
    
    if (!fs.existsSync(dirPath)) return stats;
    
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        const subStats = this.analyzeDirectoryStats(itemPath);
        stats.files += subStats.files;
        stats.lines += subStats.lines;
      } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
        stats.files += 1;
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          stats.lines += content.split('\n').length;
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
    
    return stats;
  }

  /**
   * Calculate complexity score
   */
  calculateComplexityScore(stats) {
    // Simple complexity calculation based on lines per file
    const avgLines = stats.lines / stats.files;
    
    if (avgLines < 50) return 'Low';
    if (avgLines < 100) return 'Medium';
    if (avgLines < 200) return 'High';
    return 'Very High';
  }

  /**
   * Analyze image optimization
   */
  async analyzeImageOptimization() {
    try {
      const assetsPath = path.join(process.cwd(), 'assets');
      const publicPath = path.join(process.cwd(), 'public');
      
      const imageStats = {
        totalImages: 0,
        totalSize: 0,
        formats: {},
        recommendations: [],
      };

      // Analyze assets directory
      if (fs.existsSync(assetsPath)) {
        this.analyzeImagesInDirectory(assetsPath, imageStats);
      }

      // Analyze public directory
      if (fs.existsSync(publicPath)) {
        this.analyzeImagesInDirectory(publicPath, imageStats);
      }

      this.auditResults.imageOptimization = imageStats;
      
      console.log(`   ✅ Images Found: ${imageStats.totalImages}`);
      console.log(`   ✅ Total Size: ${this.formatBytes(imageStats.totalSize)}`);

    } catch (error) {
      console.log(`   ❌ Image optimization analysis failed: ${error.message}`);
      this.auditResults.imageOptimization = { error: error.message };
    }
  }

  /**
   * Analyze images in directory
   */
  analyzeImagesInDirectory(dirPath, stats) {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        this.analyzeImagesInDirectory(itemPath, stats);
      } else if (stat.isFile() && /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(item)) {
        const ext = path.extname(item).toLowerCase();
        stats.totalImages += 1;
        stats.totalSize += stat.size;
        
        if (!stats.formats[ext]) {
          stats.formats[ext] = { count: 0, size: 0 };
        }
        stats.formats[ext].count += 1;
        stats.formats[ext].size += stat.size;

        // Generate recommendations
        if (ext === '.png' && stat.size > 100000) { // > 100KB PNG
          stats.recommendations.push(`Convert ${item} to WebP for better compression`);
        }
        if (ext === '.jpg' && stat.size > 500000) { // > 500KB JPEG
          stats.recommendations.push(`Optimize ${item} - consider reducing quality or size`);
        }
      }
    });
  }

  /**
   * Analyze dependencies for optimization opportunities
   */
  async analyzeDependencies() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const dependencies = packageJson.dependencies || {};
      const heavyDependencies = [];
      const optimizationOpportunities = [];

      // Check for known heavy dependencies
      const heavyPackages = {
        'moment': { size: '67KB', alternative: 'date-fns', savings: '50KB' },
        'lodash': { size: '71KB', alternative: 'lodash-es', savings: '30KB' },
        '@mui/material': { size: '1.2MB', alternative: 'selective imports', savings: '800KB' },
        'react-router-dom': { size: '45KB', alternative: 'reach-router', savings: '20KB' },
      };

      Object.keys(dependencies).forEach(dep => {
        if (heavyPackages[dep]) {
          heavyDependencies.push({
            name: dep,
            ...heavyPackages[dep],
          });
          
          optimizationOpportunities.push({
            type: 'dependency',
            package: dep,
            recommendation: `Consider replacing ${dep} with ${heavyPackages[dep].alternative}`,
            impact: heavyPackages[dep].savings,
          });
        }
      });

      this.auditResults.dependencyAnalysis = {
        heavy: heavyDependencies,
        opportunities: optimizationOpportunities,
      };

      console.log(`   ✅ Heavy Dependencies: ${heavyDependencies.length}`);
      console.log(`   ✅ Optimization Opportunities: ${optimizationOpportunities.length}`);

    } catch (error) {
      console.log(`   ❌ Dependency analysis failed: ${error.message}`);
    }
  }

  /**
   * Run code quality analysis
   */
  async runCodeQualityAnalysis() {
    try {
      const results = {
        eslintErrors: 0,
        eslintWarnings: 0,
        typescript: null,
        testCoverage: null,
      };

      // Run ESLint
      try {
        execSync('npx eslint . --format json --output-file eslint-results.json', { stdio: 'pipe' });
        const eslintResults = JSON.parse(fs.readFileSync('eslint-results.json', 'utf8'));
        
        eslintResults.forEach(file => {
          file.messages.forEach(message => {
            if (message.severity === 2) results.eslintErrors++;
            if (message.severity === 1) results.eslintWarnings++;
          });
        });

        // Clean up
        fs.unlinkSync('eslint-results.json');
      } catch (error) {
        // ESLint might exit with non-zero code if there are errors
      }

      // Check TypeScript compilation
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        results.typescript = 'No errors';
      } catch (error) {
        results.typescript = 'Has errors';
      }

      this.auditResults.codeQuality = results;
      
      console.log(`   ✅ ESLint Errors: ${results.eslintErrors}`);
      console.log(`   ✅ ESLint Warnings: ${results.eslintWarnings}`);
      console.log(`   ✅ TypeScript: ${results.typescript}`);

    } catch (error) {
      console.log(`   ❌ Code quality analysis failed: ${error.message}`);
    }
  }

  /**
   * Run security analysis
   */
  async runSecurityAnalysis() {
    try {
      const results = {
        vulnerabilities: 0,
        outdatedPackages: 0,
        securityIssues: [],
      };

      // Run npm audit
      try {
        const auditOutput = execSync('npm audit --json', { stdio: 'pipe', encoding: 'utf8' });
        const audit = JSON.parse(auditOutput);
        
        if (audit.metadata) {
          results.vulnerabilities = audit.metadata.vulnerabilities?.total || 0;
        }
      } catch (error) {
        // npm audit might exit with non-zero code if vulnerabilities are found
        try {
          const audit = JSON.parse(error.stdout || '{}');
          if (audit.metadata) {
            results.vulnerabilities = audit.metadata.vulnerabilities?.total || 0;
          }
        } catch {
          // Ignore parsing errors
        }
      }

      this.auditResults.security = results;
      
      console.log(`   ✅ Vulnerabilities: ${results.vulnerabilities}`);

    } catch (error) {
      console.log(`   ❌ Security analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate performance recommendations
   */
  async generateRecommendations() {
    const recommendations = [];

    // Bundle size recommendations
    if (this.auditResults.bundleAnalysis?.totalSize > 500000) { // > 500KB
      recommendations.push({
        category: 'Bundle Size',
        priority: 'High',
        description: 'Bundle size exceeds 500KB. Consider code splitting and lazy loading.',
        impact: 'Performance',
      });
    }

    // Dependency recommendations
    if (this.auditResults.dependencyAnalysis?.opportunities?.length > 0) {
      this.auditResults.dependencyAnalysis.opportunities.forEach(opp => {
        recommendations.push({
          category: 'Dependencies',
          priority: 'Medium',
          description: opp.recommendation,
          impact: opp.impact,
        });
      });
    }

    // Code quality recommendations
    if (this.auditResults.codeQuality?.eslintErrors > 0) {
      recommendations.push({
        category: 'Code Quality',
        priority: 'High',
        description: `Fix ${this.auditResults.codeQuality.eslintErrors} ESLint errors`,
        impact: 'Maintainability',
      });
    }

    // Security recommendations
    if (this.auditResults.security?.vulnerabilities > 0) {
      recommendations.push({
        category: 'Security',
        priority: 'Critical',
        description: `Fix ${this.auditResults.security.vulnerabilities} security vulnerabilities`,
        impact: 'Security',
      });
    }

    // Image optimization recommendations
    if (this.auditResults.imageOptimization?.recommendations?.length > 0) {
      this.auditResults.imageOptimization.recommendations.forEach(rec => {
        recommendations.push({
          category: 'Images',
          priority: 'Medium',
          description: rec,
          impact: 'Performance',
        });
      });
    }

    this.auditResults.recommendations = recommendations;
    console.log(`   ✅ Generated ${recommendations.length} recommendations`);
  }

  /**
   * Calculate performance scores
   */
  calculatePerformanceScores() {
    const scores = {
      bundleSize: 100,
      codeQuality: 100,
      security: 100,
      performance: 100,
      overall: 100,
    };

    // Bundle size score
    const bundleSize = this.auditResults.bundleAnalysis?.totalSize || 0;
    if (bundleSize > 1000000) scores.bundleSize = 50; // > 1MB
    else if (bundleSize > 500000) scores.bundleSize = 75; // > 500KB
    else if (bundleSize > 250000) scores.bundleSize = 90; // > 250KB

    // Code quality score
    const eslintErrors = this.auditResults.codeQuality?.eslintErrors || 0;
    const eslintWarnings = this.auditResults.codeQuality?.eslintWarnings || 0;
    scores.codeQuality = Math.max(0, 100 - (eslintErrors * 5) - (eslintWarnings * 1));

    // Security score
    const vulnerabilities = this.auditResults.security?.vulnerabilities || 0;
    scores.security = Math.max(0, 100 - (vulnerabilities * 10));

    // Performance score (average of other scores)
    scores.performance = Math.round((scores.bundleSize + scores.codeQuality) / 2);

    // Overall score
    scores.overall = Math.round(
      (scores.bundleSize + scores.codeQuality + scores.security + scores.performance) / 4
    );

    this.auditResults.scores = scores;
  }

  /**
   * Generate comprehensive audit report
   */
  async generateAuditReport() {
    const reportPath = path.join(process.cwd(), 'performance-audit-report.json');
    const htmlReportPath = path.join(process.cwd(), 'performance-audit-report.html');

    // Write JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHtmlReport();
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`   ✅ JSON Report: ${reportPath}`);
    console.log(`   ✅ HTML Report: ${htmlReportPath}`);
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Sports Edge - Performance Audit Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .score-card { background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; }
        .score { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .score.excellent { color: #28a745; }
        .score.good { color: #ffc107; }
        .score.poor { color: #dc3545; }
        .section { margin-bottom: 30px; }
        .section h2 { border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .recommendations { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; }
        .recommendation { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .priority-critical { border-left: 4px solid #dc3545; }
        .priority-high { border-left: 4px solid #fd7e14; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
        .metric-value { font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AI Sports Edge - Performance Audit Report</h1>
            <p>Generated on ${new Date(this.auditResults.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="content">
            <!-- Performance Scores -->
            <div class="section">
                <h2>Performance Scores</h2>
                <div class="score-grid">
                    <div class="score-card">
                        <h3>Overall Score</h3>
                        <div class="score ${this.getScoreClass(this.auditResults.scores.overall)}">${this.auditResults.scores.overall}/100</div>
                    </div>
                    <div class="score-card">
                        <h3>Bundle Size</h3>
                        <div class="score ${this.getScoreClass(this.auditResults.scores.bundleSize)}">${this.auditResults.scores.bundleSize}/100</div>
                    </div>
                    <div class="score-card">
                        <h3>Code Quality</h3>
                        <div class="score ${this.getScoreClass(this.auditResults.scores.codeQuality)}">${this.auditResults.scores.codeQuality}/100</div>
                    </div>
                    <div class="score-card">
                        <h3>Security</h3>
                        <div class="score ${this.getScoreClass(this.auditResults.scores.security)}">${this.auditResults.scores.security}/100</div>
                    </div>
                </div>
            </div>

            <!-- Recommendations -->
            <div class="section">
                <h2>Recommendations (${this.auditResults.recommendations.length} items)</h2>
                ${this.auditResults.recommendations.map(rec => `
                    <div class="recommendation priority-${rec.priority.toLowerCase()}">
                        <strong>${rec.category}</strong> - ${rec.priority} Priority<br>
                        ${rec.description}<br>
                        <small>Impact: ${rec.impact}</small>
                    </div>
                `).join('')}
            </div>

            <!-- Bundle Analysis -->
            <div class="section">
                <h2>Bundle Analysis</h2>
                <div class="metric">
                    <span>Total Bundle Size:</span>
                    <span class="metric-value">${this.formatBytes(this.auditResults.bundleAnalysis?.totalSize || 0)}</span>
                </div>
                <div class="metric">
                    <span>Chunks Count:</span>
                    <span class="metric-value">${this.auditResults.bundleAnalysis?.chunks?.length || 0}</span>
                </div>
                <div class="metric">
                    <span>Duplicate Modules:</span>
                    <span class="metric-value">${this.auditResults.bundleAnalysis?.duplicates?.length || 0}</span>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div class="section">
                <h2>Performance Metrics</h2>
                <div class="metric">
                    <span>Build Time:</span>
                    <span class="metric-value">${this.auditResults.performanceMetrics?.buildTime || 'N/A'}ms</span>
                </div>
                <div class="metric">
                    <span>Total Dependencies:</span>
                    <span class="metric-value">${this.auditResults.performanceMetrics?.dependencies?.total || 0}</span>
                </div>
                <div class="metric">
                    <span>Code Complexity:</span>
                    <span class="metric-value">${this.auditResults.performanceMetrics?.codeComplexity?.complexity || 'N/A'}</span>
                </div>
            </div>

            <!-- Image Optimization -->
            <div class="section">
                <h2>Image Optimization</h2>
                <div class="metric">
                    <span>Total Images:</span>
                    <span class="metric-value">${this.auditResults.imageOptimization?.totalImages || 0}</span>
                </div>
                <div class="metric">
                    <span>Total Size:</span>
                    <span class="metric-value">${this.formatBytes(this.auditResults.imageOptimization?.totalSize || 0)}</span>
                </div>
                <div class="metric">
                    <span>Optimization Opportunities:</span>
                    <span class="metric-value">${this.auditResults.imageOptimization?.recommendations?.length || 0}</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Get CSS class for score
   */
  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    return 'poor';
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const audit = new ComprehensivePerformanceAudit();
  audit.runAudit().catch(console.error);
}

module.exports = ComprehensivePerformanceAudit;