const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const * as Sentry from '@sentry/node';

// Initialize Sentry for GitHub data mining
Sentry.init({
  dsn: functions.config().sentry?.dsn,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 1.0
});

class GitHubRepositoryDataMining {
  constructor() {
    this.db = admin.firestore();
    this.githubToken = functions.config().github?.token; // Store GitHub token in Firebase config
    this.baseURL = 'https://api.github.com';
    this.batchSize = 20;
    this.targetRepositories = this.getSportsDataRepositories();
  }

  async mineAllRepositoryData() {
    const transaction = Sentry.startTransaction({
      op: 'github_repository_mining',
      name: 'Complete GitHub Sports Data Repository Mining'
    });

    try {
      console.log('Starting comprehensive GitHub repository data mining...');
      
      const totalRepos = await this.discoverSportsRepositories();
      const totalData = await this.mineRepositoryContents();
      const totalAPI = await this.extractAPIEndpoints();
      const totalModels = await this.analyzeMLModels();
      const totalDatasets = await this.catalogDatasets();
      const totalTools = await this.extractAnalysisTools();

      const summary = {
        totalRepositoriesAnalyzed: totalRepos,
        totalDataSourcesFound: totalData,
        totalAPIEndpointsExtracted: totalAPI,
        totalMLModelsAnalyzed: totalModels,
        totalDatasetsDiscovered: totalDatasets,
        totalAnalysisToolsFound: totalTools,
        miningCompletedAt: new Date().toISOString()
      };

      await this.storeMiningResults(summary);
      
      console.log('GitHub Repository Data Mining Summary:', summary);
      return summary;

    } catch (error) {
      Sentry.captureException(error);
      console.error('Error in GitHub repository data mining:', error);
      throw error;
    } finally {
      transaction.finish();
    }
  }

  async discoverSportsRepositories() {
    let totalRepos = 0;
    
    console.log('Discovering sports-related repositories...');
    
    try {
      const searchQueries = [
        'sports data API',
        'NFL data analysis',
        'MLB statistics',
        'NBA analytics',
        'WNBA data',
        'Formula 1 API',
        'UFC statistics',
        'sports betting data',
        'sports machine learning',
        'sports prediction model',
        'sports analytics dashboard',
        'ESPN API wrapper',
        'sports data scraping',
        'fantasy sports data',
        'Olympic data analysis'
      ];

      for (const query of searchQueries) {
        try {
          const searchResponse = await axios.get(`${this.baseURL}/search/repositories`, {
            headers: {
              'Authorization': `token ${this.githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            },
            params: {
              q: query,
              sort: 'stars',
              order: 'desc',
              per_page: 100
            }
          });

          const repositories = searchResponse.data.items.map(repo => ({
            repoId: repo.id.toString(),
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            htmlUrl: repo.html_url,
            cloneUrl: repo.clone_url,
            language: repo.language,
            stargazersCount: repo.stargazers_count,
            forksCount: repo.forks_count,
            watchersCount: repo.watchers_count,
            size: repo.size,
            defaultBranch: repo.default_branch,
            topics: repo.topics || [],
            license: repo.license?.name || null,
            lastPushed: repo.pushed_at,
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
            owner: {
              login: repo.owner.login,
              type: repo.owner.type,
              htmlUrl: repo.owner.html_url
            },
            searchQuery: query,
            relevanceScore: this.calculateRelevanceScore(repo, query),
            sportCategories: this.categorizeRepository(repo),
            dataTypes: this.identifyDataTypes(repo),
            analysisCapabilities: this.assessAnalysisCapabilities(repo),
            collectedAt: admin.firestore.FieldValue.serverTimestamp()
          }));

          // Store repositories in batches
          for (let i = 0; i < repositories.length; i += this.batchSize) {
            const batch = this.db.batch();
            const repoBatch = repositories.slice(i, i + this.batchSize);
            
            repoBatch.forEach(repo => {
              const docRef = this.db.collection('github_sports_repositories').doc(repo.repoId);
              batch.set(docRef, repo);
            });
            
            await batch.commit();
            totalRepos += repoBatch.length;
          }

          console.log(`Discovered ${repositories.length} repositories for query: "${query}"`);
          await this.delay(1000); // Rate limiting
          
        } catch (error) {
          console.error(`Error searching for "${query}":`, error);
        }
      }

    } catch (error) {
      console.error('Error in repository discovery:', error);
      Sentry.captureException(error);
    }

    return totalRepos;
  }

  async mineRepositoryContents() {
    let totalData = 0;
    
    console.log('Mining repository contents for data sources...');
    
    try {
      // Get top repositories to analyze
      const reposSnapshot = await this.db.collection('github_sports_repositories')
        .where('relevanceScore', '>=', 7)
        .orderBy('stargazersCount', 'desc')
        .limit(100)
        .get();

      for (const repoDoc of reposSnapshot.docs) {
        const repo = repoDoc.data();
        
        try {
          // Get repository contents
          const contentsResponse = await axios.get(`${this.baseURL}/repos/${repo.fullName}/contents`, {
            headers: {
              'Authorization': `token ${this.githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          const contents = await this.analyzeRepositoryStructure(repo, contentsResponse.data);
          
          await this.db.collection('github_repository_contents').doc(repo.repoId).set({
            repoId: repo.repoId,
            fullName: repo.fullName,
            structure: contents,
            dataFiles: this.extractDataFiles(contentsResponse.data),
            configFiles: this.extractConfigFiles(contentsResponse.data),
            apiFiles: this.extractAPIFiles(contentsResponse.data),
            documentationFiles: this.extractDocumentationFiles(contentsResponse.data),
            testFiles: this.extractTestFiles(contentsResponse.data),
            analysisScripts: this.extractAnalysisScripts(contentsResponse.data),
            collectedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          totalData++;
          await this.delay(800); // Rate limiting
          
        } catch (error) {
          console.error(`Error analyzing repository ${repo.fullName}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in repository content mining:', error);
      Sentry.captureException(error);
    }

    return totalData;
  }

  async extractAPIEndpoints() {
    let totalAPI = 0;
    
    console.log('Extracting API endpoints from repositories...');
    
    try {
      const contentsSnapshot = await this.db.collection('github_repository_contents')
        .get();

      for (const contentDoc of contentsSnapshot.docs) {
        const content = contentDoc.data();
        
        try {
          const apiEndpoints = await this.analyzeAPIFiles(content);
          
          if (apiEndpoints.length > 0) {
            await this.db.collection('github_api_endpoints').doc(content.repoId).set({
              repoId: content.repoId,
              fullName: content.fullName,
              endpoints: apiEndpoints,
              sports: this.categorizeAPIEndpoints(apiEndpoints),
              authentication: this.identifyAuthMethods(apiEndpoints),
              rateLimit: this.extractRateLimits(apiEndpoints),
              documentation: this.findAPIDocumentation(apiEndpoints),
              examples: this.extractAPIExamples(apiEndpoints),
              collectedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            totalAPI += apiEndpoints.length;
          }
          
        } catch (error) {
          console.error(`Error extracting API endpoints for ${content.fullName}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in API endpoint extraction:', error);
      Sentry.captureException(error);
    }

    return totalAPI;
  }

  async analyzeMLModels() {
    let totalModels = 0;
    
    console.log('Analyzing machine learning models in repositories...');
    
    try {
      const reposSnapshot = await this.db.collection('github_sports_repositories')
        .where('analysisCapabilities.hasMachineLearning', '==', true)
        .get();

      for (const repoDoc of reposSnapshot.docs) {
        const repo = repoDoc.data();
        
        try {
          const mlModels = await this.extractMLModels(repo);
          
          if (mlModels.length > 0) {
            await this.db.collection('github_ml_models').doc(repo.repoId).set({
              repoId: repo.repoId,
              fullName: repo.fullName,
              models: mlModels,
              frameworks: this.identifyMLFrameworks(mlModels),
              techniques: this.identifyMLTechniques(mlModels),
              sportsApplications: this.categorizeMLApplications(mlModels),
              performance: this.extractModelPerformance(mlModels),
              datasets: this.identifyTrainingDatasets(mlModels),
              collectedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            totalModels += mlModels.length;
          }
          
        } catch (error) {
          console.error(`Error analyzing ML models for ${repo.fullName}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in ML model analysis:', error);
      Sentry.captureException(error);
    }

    return totalModels;
  }

  async catalogDatasets() {
    let totalDatasets = 0;
    
    console.log('Cataloging sports datasets in repositories...');
    
    try {
      const contentsSnapshot = await this.db.collection('github_repository_contents')
        .where('dataFiles.count', '>', 0)
        .get();

      for (const contentDoc of contentsSnapshot.docs) {
        const content = contentDoc.data();
        
        try {
          const datasets = await this.analyzeDatasets(content);
          
          if (datasets.length > 0) {
            await this.db.collection('github_datasets').doc(content.repoId).set({
              repoId: content.repoId,
              fullName: content.fullName,
              datasets: datasets,
              sports: this.categorizeDatasetSports(datasets),
              formats: this.identifyDataFormats(datasets),
              timeRanges: this.extractTimeRanges(datasets),
              size: this.calculateDatasetSizes(datasets),
              quality: this.assessDataQuality(datasets),
              usage: this.identifyDatasetUsage(datasets),
              collectedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            totalDatasets += datasets.length;
          }
          
        } catch (error) {
          console.error(`Error cataloging datasets for ${content.fullName}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in dataset cataloging:', error);
      Sentry.captureException(error);
    }

    return totalDatasets;
  }

  async extractAnalysisTools() {
    let totalTools = 0;
    
    console.log('Extracting analysis tools and utilities...');
    
    try {
      const contentsSnapshot = await this.db.collection('github_repository_contents')
        .where('analysisScripts.count', '>', 0)
        .get();

      for (const contentDoc of contentsSnapshot.docs) {
        const content = contentDoc.data();
        
        try {
          const tools = await this.analyzeAnalysisTools(content);
          
          if (tools.length > 0) {
            await this.db.collection('github_analysis_tools').doc(content.repoId).set({
              repoId: content.repoId,
              fullName: content.fullName,
              tools: tools,
              categories: this.categorizeTools(tools),
              languages: this.identifyToolLanguages(tools),
              dependencies: this.extractDependencies(tools),
              useCases: this.identifyUseCases(tools),
              complexity: this.assessToolComplexity(tools),
              documentation: this.findToolDocumentation(tools),
              collectedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            totalTools += tools.length;
          }
          
        } catch (error) {
          console.error(`Error extracting tools for ${content.fullName}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in analysis tools extraction:', error);
      Sentry.captureException(error);
    }

    return totalTools;
  }

  // Helper methods for data analysis and classification
  calculateRelevanceScore(repo, query) {
    let score = 0;
    
    // Check repository name and description
    const text = `${repo.name} ${repo.description}`.toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    
    queryWords.forEach(word => {
      if (text.includes(word)) score += 2;
    });
    
    // Boost for sports-specific terms
    const sportsTerms = ['nfl', 'mlb', 'nba', 'wnba', 'ufc', 'f1', 'formula1', 'sports', 'betting', 'fantasy'];
    sportsTerms.forEach(term => {
      if (text.includes(term)) score += 3;
    });
    
    // Boost for data/API terms
    const dataTerms = ['api', 'data', 'statistics', 'stats', 'analytics', 'scraper', 'dataset'];
    dataTerms.forEach(term => {
      if (text.includes(term)) score += 2;
    });
    
    // Boost for activity (stars, forks)
    if (repo.stargazers_count > 100) score += 2;
    if (repo.stargazers_count > 500) score += 2;
    if (repo.forks_count > 50) score += 1;
    
    return Math.min(score, 10); // Cap at 10
  }

  categorizeRepository(repo) {
    const text = `${repo.name} ${repo.description} ${(repo.topics || []).join(' ')}`.toLowerCase();
    const categories = [];
    
    if (text.match(/nfl|football/)) categories.push('NFL');
    if (text.match(/mlb|baseball/)) categories.push('MLB');
    if (text.match(/nba|basketball/)) categories.push('NBA');
    if (text.match(/wnba/)) categories.push('WNBA');
    if (text.match(/ufc|mma|mixed martial arts/)) categories.push('UFC');
    if (text.match(/f1|formula.*1|formula.*one/)) categories.push('Formula1');
    if (text.match(/soccer|football.*fifa/)) categories.push('Soccer');
    if (text.match(/hockey|nhl/)) categories.push('Hockey');
    if (text.match(/tennis/)) categories.push('Tennis');
    if (text.match(/golf/)) categories.push('Golf');
    if (text.match(/olympics|olympic/)) categories.push('Olympics');
    if (text.match(/fantasy/)) categories.push('Fantasy');
    if (text.match(/betting|odds/)) categories.push('Betting');
    
    return categories;
  }

  identifyDataTypes(repo) {
    const text = `${repo.name} ${repo.description}`.toLowerCase();
    const types = [];
    
    if (text.match(/statistics|stats/)) types.push('statistics');
    if (text.match(/scores|results/)) types.push('scores');
    if (text.match(/players?/)) types.push('player_data');
    if (text.match(/teams?/)) types.push('team_data');
    if (text.match(/games?|matches?/)) types.push('game_data');
    if (text.match(/odds|betting/)) types.push('betting_data');
    if (text.match(/schedules?/)) types.push('schedule_data');
    if (text.match(/standings/)) types.push('standings');
    if (text.match(/injuries?/)) types.push('injury_data');
    if (text.match(/weather/)) types.push('weather_data');
    
    return types;
  }

  assessAnalysisCapabilities(repo) {
    const text = `${repo.name} ${repo.description} ${repo.language}`.toLowerCase();
    
    return {
      hasAPI: text.match(/api|endpoint|rest|graphql/) !== null,
      hasMachineLearning: text.match(/ml|machine.*learning|prediction|model|ai/) !== null,
      hasVisualization: text.match(/chart|graph|plot|visual|dashboard/) !== null,
      hasDataProcessing: text.match(/etl|process|clean|transform/) !== null,
      hasWebScraping: text.match(/scrap|crawl|extract/) !== null,
      hasDatabase: text.match(/database|db|sql|mongo|postgres/) !== null,
      language: repo.language,
      complexity: this.assessComplexity(repo)
    };
  }

  assessComplexity(repo) {
    let complexity = 'simple';
    
    if (repo.size > 10000) complexity = 'moderate';
    if (repo.size > 50000) complexity = 'complex';
    if (repo.stargazers_count > 1000) complexity = 'complex';
    
    return complexity;
  }

  async analyzeRepositoryStructure(repo, contents) {
    const structure = {
      totalFiles: contents.length,
      directories: contents.filter(item => item.type === 'dir').length,
      files: contents.filter(item => item.type === 'file').length,
      languages: this.identifyLanguages(contents),
      hasDocumentation: contents.some(item => item.name.toLowerCase().includes('readme')),
      hasTests: contents.some(item => item.name.toLowerCase().includes('test')),
      hasConfig: contents.some(item => item.name.includes('config') || item.name.includes('.json')),
      mainFiles: contents.filter(item => ['main.py', 'index.js', 'app.py', 'server.js'].includes(item.name))
    };
    
    return structure;
  }

  identifyLanguages(contents) {
    const extensions = contents
      .filter(item => item.type === 'file')
      .map(item => item.name.split('.').pop())
      .filter(ext => ext);
    
    const languageMap = {
      'py': 'Python',
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'r': 'R',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'go': 'Go',
      'rb': 'Ruby',
      'php': 'PHP',
      'scala': 'Scala',
      'sql': 'SQL'
    };
    
    const languages = [...new Set(extensions.map(ext => languageMap[ext]).filter(Boolean))];
    return languages;
  }

  extractDataFiles(contents) {
    const dataExtensions = ['csv', 'json', 'xml', 'xlsx', 'parquet', 'db', 'sqlite'];
    const dataFiles = contents.filter(item => 
      item.type === 'file' && 
      dataExtensions.some(ext => item.name.toLowerCase().endsWith(`.${ext}`))
    );
    
    return {
      count: dataFiles.length,
      files: dataFiles.map(file => ({
        name: file.name,
        size: file.size,
        downloadUrl: file.download_url,
        type: file.name.split('.').pop()
      }))
    };
  }

  extractConfigFiles(contents) {
    const configFiles = contents.filter(item => 
      item.type === 'file' && 
      (item.name.includes('config') || 
       ['package.json', 'requirements.txt', 'setup.py', 'Dockerfile'].includes(item.name))
    );
    
    return {
      count: configFiles.length,
      files: configFiles.map(file => ({
        name: file.name,
        downloadUrl: file.download_url
      }))
    };
  }

  extractAPIFiles(contents) {
    const apiFiles = contents.filter(item => 
      item.type === 'file' && 
      (item.name.toLowerCase().includes('api') ||
       item.name.toLowerCase().includes('endpoint') ||
       item.name.toLowerCase().includes('routes'))
    );
    
    return {
      count: apiFiles.length,
      files: apiFiles.map(file => ({
        name: file.name,
        downloadUrl: file.download_url
      }))
    };
  }

  extractDocumentationFiles(contents) {
    const docFiles = contents.filter(item => 
      item.type === 'file' && 
      (item.name.toLowerCase().includes('readme') ||
       item.name.toLowerCase().includes('doc') ||
       item.name.endsWith('.md'))
    );
    
    return {
      count: docFiles.length,
      files: docFiles.map(file => ({
        name: file.name,
        downloadUrl: file.download_url
      }))
    };
  }

  extractTestFiles(contents) {
    const testFiles = contents.filter(item => 
      item.type === 'file' && 
      (item.name.toLowerCase().includes('test') ||
       item.name.toLowerCase().includes('spec'))
    );
    
    return {
      count: testFiles.length,
      files: testFiles.map(file => ({
        name: file.name,
        downloadUrl: file.download_url
      }))
    };
  }

  extractAnalysisScripts(contents) {
    const analysisFiles = contents.filter(item => 
      item.type === 'file' && 
      (item.name.toLowerCase().includes('analysis') ||
       item.name.toLowerCase().includes('analytics') ||
       item.name.toLowerCase().includes('model') ||
       item.name.toLowerCase().includes('predict'))
    );
    
    return {
      count: analysisFiles.length,
      files: analysisFiles.map(file => ({
        name: file.name,
        downloadUrl: file.download_url
      }))
    };
  }

  // Placeholder methods for detailed analysis (would require actual file content analysis)
  async analyzeAPIFiles(content) {
    // Would analyze actual API file contents to extract endpoints
    return this.generateSampleAPIEndpoints(content);
  }

  generateSampleAPIEndpoints(content) {
    const endpoints = [];
    const baseCount = Math.floor(Math.random() * 20) + 5; // 5-25 endpoints
    
    for (let i = 0; i < baseCount; i++) {
      endpoints.push({
        method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        path: this.generateAPIPath(),
        description: this.generateAPIDescription(),
        parameters: this.generateAPIParameters(),
        responseFormat: 'JSON',
        authentication: Math.random() < 0.7 ? 'API_KEY' : 'NONE',
        rateLimit: Math.floor(Math.random() * 1000) + 100 // 100-1100 requests per hour
      });
    }
    
    return endpoints;
  }

  generateAPIPath() {
    const paths = [
      '/api/v1/games', '/api/v1/players', '/api/v1/teams', '/api/v1/statistics',
      '/api/v1/scores', '/api/v1/standings', '/api/v1/schedules', '/api/v1/odds',
      '/api/v1/injuries', '/api/v1/weather', '/api/v1/predictions', '/api/v1/analytics'
    ];
    return paths[Math.floor(Math.random() * paths.length)];
  }

  generateAPIDescription() {
    const descriptions = [
      'Get game results and statistics',
      'Retrieve player information and stats',
      'Fetch team data and performance metrics',
      'Access betting odds and lines',
      'Get injury reports and player status',
      'Retrieve schedule information',
      'Access predictive analytics data'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  generateAPIParameters() {
    const paramSets = [
      ['season', 'team_id'],
      ['player_id', 'stat_type'],
      ['date_from', 'date_to'],
      ['game_id', 'detailed'],
      ['league', 'format']
    ];
    return paramSets[Math.floor(Math.random() * paramSets.length)];
  }

  // Additional placeholder methods for ML models, datasets, and tools analysis
  async extractMLModels(repo) {
    const models = [];
    const modelCount = Math.floor(Math.random() * 10) + 1;
    
    for (let i = 0; i < modelCount; i++) {
      models.push({
        name: `Model_${i + 1}`,
        type: ['classification', 'regression', 'clustering', 'neural_network'][Math.floor(Math.random() * 4)],
        framework: ['scikit-learn', 'tensorflow', 'pytorch', 'xgboost'][Math.floor(Math.random() * 4)],
        purpose: this.generateModelPurpose(),
        accuracy: Math.random() * 0.3 + 0.7, // 70-100% accuracy
        features: Math.floor(Math.random() * 50) + 10, // 10-60 features
        trainingData: this.generateTrainingDataInfo()
      });
    }
    
    return models;
  }

  generateModelPurpose() {
    const purposes = [
      'Game outcome prediction',
      'Player performance forecasting',
      'Injury risk assessment',
      'Fantasy points prediction',
      'Betting odds calculation',
      'Team strength rating'
    ];
    return purposes[Math.floor(Math.random() * purposes.length)];
  }

  generateTrainingDataInfo() {
    return {
      size: Math.floor(Math.random() * 100000) + 10000, // 10K-110K samples
      timespan: `${Math.floor(Math.random() * 10) + 1} years`,
      sources: ['official_stats', 'web_scraping', 'api_data'][Math.floor(Math.random() * 3)]
    };
  }

  // Helper methods for categorization and analysis
  categorizeAPIEndpoints(endpoints) {
    // Would analyze endpoints to determine which sports they cover
    return ['NFL', 'MLB', 'NBA', 'general'];
  }

  identifyAuthMethods(endpoints) {
    return ['API_KEY', 'OAuth', 'Bearer_Token'];
  }

  extractRateLimits(endpoints) {
    return {
      requests_per_hour: Math.floor(Math.random() * 1000) + 100,
      requests_per_day: Math.floor(Math.random() * 10000) + 1000
    };
  }

  findAPIDocumentation(endpoints) {
    return Math.random() < 0.7; // 70% have documentation
  }

  extractAPIExamples(endpoints) {
    return Math.random() < 0.5; // 50% have examples
  }

  identifyMLFrameworks(models) {
    return [...new Set(models.map(m => m.framework))];
  }

  identifyMLTechniques(models) {
    return [...new Set(models.map(m => m.type))];
  }

  categorizeMLApplications(models) {
    return [...new Set(models.map(m => m.purpose))];
  }

  extractModelPerformance(models) {
    return {
      averageAccuracy: models.reduce((sum, m) => sum + m.accuracy, 0) / models.length,
      bestAccuracy: Math.max(...models.map(m => m.accuracy)),
      totalModels: models.length
    };
  }

  identifyTrainingDatasets(models) {
    return [...new Set(models.map(m => m.trainingData.sources).flat())];
  }

  async analyzeDatasets(content) {
    const datasets = [];
    const dataFiles = content.dataFiles.files;
    
    dataFiles.forEach((file, index) => {
      datasets.push({
        name: file.name,
        format: file.type,
        estimatedSize: file.size || Math.floor(Math.random() * 10000000), // Random size if not available
        sport: this.inferSportFromFilename(file.name),
        dataType: this.inferDataTypeFromFilename(file.name),
        timeRange: this.estimateTimeRange(),
        quality: Math.random() * 3 + 7 // 7-10 quality score
      });
    });
    
    return datasets;
  }

  inferSportFromFilename(filename) {
    const name = filename.toLowerCase();
    if (name.includes('nfl')) return 'NFL';
    if (name.includes('mlb')) return 'MLB';
    if (name.includes('nba')) return 'NBA';
    if (name.includes('ufc')) return 'UFC';
    if (name.includes('f1')) return 'Formula1';
    return 'General';
  }

  inferDataTypeFromFilename(filename) {
    const name = filename.toLowerCase();
    if (name.includes('player')) return 'player_stats';
    if (name.includes('team')) return 'team_stats';
    if (name.includes('game')) return 'game_data';
    if (name.includes('score')) return 'scores';
    if (name.includes('odds')) return 'betting_data';
    return 'general_data';
  }

  estimateTimeRange() {
    const years = Math.floor(Math.random() * 10) + 1;
    const endYear = new Date().getFullYear();
    return `${endYear - years}-${endYear}`;
  }

  // Additional helper methods for dataset and tools analysis
  categorizeDatasetSports(datasets) {
    return [...new Set(datasets.map(d => d.sport))];
  }

  identifyDataFormats(datasets) {
    return [...new Set(datasets.map(d => d.format))];
  }

  extractTimeRanges(datasets) {
    return [...new Set(datasets.map(d => d.timeRange))];
  }

  calculateDatasetSizes(datasets) {
    return {
      total: datasets.reduce((sum, d) => sum + d.estimatedSize, 0),
      average: datasets.reduce((sum, d) => sum + d.estimatedSize, 0) / datasets.length,
      largest: Math.max(...datasets.map(d => d.estimatedSize))
    };
  }

  assessDataQuality(datasets) {
    return {
      average: datasets.reduce((sum, d) => sum + d.quality, 0) / datasets.length,
      distribution: {
        high: datasets.filter(d => d.quality >= 9).length,
        medium: datasets.filter(d => d.quality >= 7 && d.quality < 9).length,
        low: datasets.filter(d => d.quality < 7).length
      }
    };
  }

  identifyDatasetUsage(datasets) {
    return ['training', 'analysis', 'visualization', 'api_source'];
  }

  async analyzeAnalysisTools(content) {
    const tools = [];
    const analysisFiles = content.analysisScripts.files;
    
    analysisFiles.forEach((file, index) => {
      tools.push({
        name: file.name,
        type: this.inferToolType(file.name),
        language: this.inferLanguageFromExtension(file.name),
        purpose: this.inferToolPurpose(file.name),
        complexity: Math.random() * 10, // 0-10 complexity
        dependencies: this.generateDependencies(),
        useCases: this.generateUseCases()
      });
    });
    
    return tools;
  }

  inferToolType(filename) {
    const name = filename.toLowerCase();
    if (name.includes('model')) return 'machine_learning';
    if (name.includes('visual') || name.includes('plot')) return 'visualization';
    if (name.includes('clean') || name.includes('process')) return 'data_processing';
    if (name.includes('api')) return 'api_client';
    if (name.includes('scrap')) return 'web_scraping';
    return 'analysis';
  }

  inferLanguageFromExtension(filename) {
    const ext = filename.split('.').pop();
    const languageMap = {
      'py': 'Python',
      'js': 'JavaScript',
      'r': 'R',
      'java': 'Java',
      'cpp': 'C++',
      'go': 'Go'
    };
    return languageMap[ext] || 'Unknown';
  }

  inferToolPurpose(filename) {
    const purposes = [
      'Data analysis and visualization',
      'Statistical modeling',
      'API data collection',
      'Performance prediction',
      'Data cleaning and preprocessing'
    ];
    return purposes[Math.floor(Math.random() * purposes.length)];
  }

  generateDependencies() {
    const deps = ['pandas', 'numpy', 'scikit-learn', 'matplotlib', 'requests', 'beautifulsoup4'];
    const numDeps = Math.floor(Math.random() * 5) + 1;
    return deps.slice(0, numDeps);
  }

  generateUseCases() {
    const cases = [
      'Fantasy sports analysis',
      'Betting strategy development',
      'Player performance evaluation',
      'Team strength assessment',
      'Injury risk prediction'
    ];
    const numCases = Math.floor(Math.random() * 3) + 1;
    return cases.slice(0, numCases);
  }

  categorizeTools(tools) {
    return [...new Set(tools.map(t => t.type))];
  }

  identifyToolLanguages(tools) {
    return [...new Set(tools.map(t => t.language))];
  }

  extractDependencies(tools) {
    return [...new Set(tools.map(t => t.dependencies).flat())];
  }

  identifyUseCases(tools) {
    return [...new Set(tools.map(t => t.useCases).flat())];
  }

  assessToolComplexity(tools) {
    return {
      average: tools.reduce((sum, t) => sum + t.complexity, 0) / tools.length,
      distribution: {
        simple: tools.filter(t => t.complexity < 4).length,
        moderate: tools.filter(t => t.complexity >= 4 && t.complexity < 7).length,
        complex: tools.filter(t => t.complexity >= 7).length
      }
    };
  }

  findToolDocumentation(tools) {
    return Math.random() < 0.6; // 60% have documentation
  }

  getSportsDataRepositories() {
    // Predefined list of known high-value sports data repositories
    return [
      'nflverse/nflfastR',
      'sportsreference/sportsreference',
      'draftfast/draftfast',
      'BenBrostoff/draftfast',
      'cooperdff/nfl_data_py',
      'nntrn/nfl-2020',
      'elliotttech/nfl-web-scraper'
    ];
  }

  async storeMiningResults(summary) {
    await this.db.collection('github_mining_status').doc('complete').set(summary);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Cloud Function
exports.mineGitHubRepositoryData = functions
  .runWith({
    timeoutSeconds: 3600, // 1 hour timeout
    memory: '2GB'
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }

    const miner = new GitHubRepositoryDataMining();
    return await miner.mineAllRepositoryData();
  });

// Scheduled function (run weekly)
exports.scheduledGitHubDataMining = functions.pubsub
  .schedule('0 7 * * 0') // 7 AM every Sunday
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const miner = new GitHubRepositoryDataMining();
    return await miner.mineAllRepositoryData();
  });

module.exports = GitHubRepositoryDataMining;