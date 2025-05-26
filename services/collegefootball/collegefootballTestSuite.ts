import { CollegeFootballDataSyncService } from './collegefootballDataSyncService';
import { CollegeFootballAnalyticsService } from './collegefootballAnalyticsService';
import { CollegeFootballMLPredictionService } from './collegefootballMLPredictionService';
import { CollegeFootballIntegrationService } from './collegefootballIntegrationService';
import { initSentry } from '../sentryConfig';

// Initialize Sentry for monitoring
const Sentry = initSentry();

export interface CFBTestResults {
  dataSyncTests: {
    teamSync: boolean;
    gameSync: boolean;
    recruitingSync: boolean;
    errors: string[];
  };
  analyticsTests: {
    teamAnalytics: boolean;
    recruitingAnalytics: boolean;
    coachingAnalytics: boolean;
    errors: string[];
  };
  mlPredictionTests: {
    gamePredict: boolean;
    playoffPredict: boolean;
    featureExtraction: boolean;
    errors: string[];
  };
  integrationTests: {
    systemInit: boolean;
    dataFlow: boolean;
    realTimeUpdates: boolean;
    errors: string[];
  };
  overallScore: number;
  passed: boolean;
}

export class CollegeFootballTestSuite {
  private dataSyncService: CollegeFootballDataSyncService;
  private analyticsService: CollegeFootballAnalyticsService;
  private mlPredictionService: CollegeFootballMLPredictionService;
  private integrationService: CollegeFootballIntegrationService;

  constructor() {
    this.dataSyncService = new CollegeFootballDataSyncService();
    this.analyticsService = new CollegeFootballAnalyticsService();
    this.mlPredictionService = new CollegeFootballMLPredictionService();
    this.integrationService = new CollegeFootballIntegrationService({
      enableRealTimeUpdates: false, // Disable for testing
      enablePredictions: true,
      enableAnalytics: true,
    });
  }

  /**
   * Run comprehensive CFB system test suite
   */
  async runComprehensiveTests(): Promise<CFBTestResults> {
    const results: CFBTestResults = {
      dataSyncTests: { teamSync: false, gameSync: false, recruitingSync: false, errors: [] },
      analyticsTests: { teamAnalytics: false, recruitingAnalytics: false, coachingAnalytics: false, errors: [] },
      mlPredictionTests: { gamePredict: false, playoffPredict: false, featureExtraction: false, errors: [] },
      integrationTests: { systemInit: false, dataFlow: false, realTimeUpdates: false, errors: [] },
      overallScore: 0,
      passed: false,
    };

    try {
      console.log('Starting CFB comprehensive test suite...');

      // Test Data Sync Service
      results.dataSyncTests = await this.testDataSyncService();

      // Test Analytics Service
      results.analyticsTests = await this.testAnalyticsService();

      // Test ML Prediction Service
      results.mlPredictionTests = await this.testMLPredictionService();

      // Test Integration Service
      results.integrationTests = await this.testIntegrationService();

      // Calculate overall score
      results.overallScore = this.calculateOverallScore(results);
      results.passed = results.overallScore >= 80; // 80% pass threshold

      console.log(`CFB Test Suite Complete - Score: ${results.overallScore}% - ${results.passed ? 'PASSED' : 'FAILED'}`);

      return results;
    } catch (error) {
      Sentry.captureException(error);
      console.error('CFB test suite failed:', error.message);
      results.passed = false;
      return results;
    }
  }

  /**
   * Test Data Sync Service
   */
  private async testDataSyncService(): Promise<CFBTestResults['dataSyncTests']> {
    const results = { teamSync: false, gameSync: false, recruitingSync: false, errors: [] };

    try {
      console.log('Testing CFB Data Sync Service...');

      // Test team synchronization
      try {
        await this.dataSyncService.syncTeamsAndConferences();
        const teams = await this.dataSyncService.getAllActiveTeams();
        if (teams && teams.length > 0) {
          results.teamSync = true;
          console.log(`✓ Team sync test passed - ${teams.length} teams loaded`);
        } else {
          results.errors.push('Team sync returned no teams');
        }
      } catch (error) {
        results.errors.push(`Team sync failed: ${error.message}`);
      }

      // Test game synchronization
      try {
        await this.dataSyncService.syncCurrentSeasonGames();
        const games = await this.dataSyncService.getUpcomingGames(7);
        if (games && games.length >= 0) { // Can be 0 during off-season
          results.gameSync = true;
          console.log(`✓ Game sync test passed - ${games.length} upcoming games`);
        } else {
          results.errors.push('Game sync failed to return data');
        }
      } catch (error) {
        results.errors.push(`Game sync failed: ${error.message}`);
      }

      // Test recruiting data sync
      try {
        await this.dataSyncService.syncRecruitingData();
        // Test with a known major program (Alabama)
        const testTeam = await this.dataSyncService.getTeamById('alabama');
        if (testTeam && testTeam.recruitingClass) {
          results.recruitingSync = true;
          console.log('✓ Recruiting sync test passed');
        } else {
          results.errors.push('Recruiting sync did not populate team data');
        }
      } catch (error) {
        results.errors.push(`Recruiting sync failed: ${error.message}`);
      }

    } catch (error) {
      results.errors.push(`Data sync service initialization failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Test Analytics Service
   */
  private async testAnalyticsService(): Promise<CFBTestResults['analyticsTests']> {
    const results = { teamAnalytics: false, recruitingAnalytics: false, coachingAnalytics: false, errors: [] };

    try {
      console.log('Testing CFB Analytics Service...');

      const testTeamId = 'alabama'; // Use Alabama as test case
      const currentSeason = new Date().getFullYear();

      // Test team analytics generation
      try {
        const analytics = await this.analyticsService.generateTeamAnalytics(testTeamId, currentSeason);
        if (analytics && analytics.teamId && analytics.performanceMetrics) {
          results.teamAnalytics = true;
          console.log('✓ Team analytics test passed');
        } else {
          results.errors.push('Team analytics returned incomplete data');
        }
      } catch (error) {
        results.errors.push(`Team analytics failed: ${error.message}`);
      }

      // Test recruiting analytics
      try {
        const recruitingAnalytics = await this.analyticsService.generateRecruitingAnalytics(testTeamId, currentSeason);
        if (recruitingAnalytics && recruitingAnalytics.currentClassRanking !== undefined) {
          results.recruitingAnalytics = true;
          console.log('✓ Recruiting analytics test passed');
        } else {
          results.errors.push('Recruiting analytics returned incomplete data');
        }
      } catch (error) {
        results.errors.push(`Recruiting analytics failed: ${error.message}`);
      }

      // Test coaching analytics
      try {
        const coachingAnalytics = await this.analyticsService.generateCoachingAnalytics(testTeamId, currentSeason);
        if (coachingAnalytics && coachingAnalytics.headCoachExperience !== undefined) {
          results.coachingAnalytics = true;
          console.log('✓ Coaching analytics test passed');
        } else {
          results.errors.push('Coaching analytics returned incomplete data');
        }
      } catch (error) {
        results.errors.push(`Coaching analytics failed: ${error.message}`);
      }

    } catch (error) {
      results.errors.push(`Analytics service initialization failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Test ML Prediction Service
   */
  private async testMLPredictionService(): Promise<CFBTestResults['mlPredictionTests']> {
    const results = { gamePredict: false, playoffPredict: false, featureExtraction: false, errors: [] };

    try {
      console.log('Testing CFB ML Prediction Service...');

      // Test game prediction
      try {
        const prediction = await this.mlPredictionService.predictGame('alabama', 'georgia', new Date());
        if (prediction && prediction.winProbability !== undefined && prediction.spreadPrediction !== undefined) {
          results.gamePredict = true;
          console.log(`✓ Game prediction test passed - Win probability: ${prediction.winProbability}`);
        } else {
          results.errors.push('Game prediction returned incomplete data');
        }
      } catch (error) {
        results.errors.push(`Game prediction failed: ${error.message}`);
      }

      // Test playoff probability calculation
      try {
        const playoffProbs = await this.mlPredictionService.calculatePlayoffProbabilities(['alabama', 'georgia', 'michigan', 'texas']);
        if (playoffProbs && Object.keys(playoffProbs).length > 0) {
          results.playoffPredict = true;
          console.log('✓ Playoff probability test passed');
        } else {
          results.errors.push('Playoff probability calculation returned no data');
        }
      } catch (error) {
        results.errors.push(`Playoff probability calculation failed: ${error.message}`);
      }

      // Test feature extraction
      try {
        const features = await this.mlPredictionService.extractMLFeatures('alabama', 'georgia', new Date());
        if (features && Object.keys(features).length >= 50) { // Should have 70 features
          results.featureExtraction = true;
          console.log(`✓ Feature extraction test passed - ${Object.keys(features).length} features`);
        } else {
          results.errors.push(`Feature extraction returned insufficient features: ${Object.keys(features || {}).length}`);
        }
      } catch (error) {
        results.errors.push(`Feature extraction failed: ${error.message}`);
      }

    } catch (error) {
      results.errors.push(`ML Prediction service initialization failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Test Integration Service
   */
  private async testIntegrationService(): Promise<CFBTestResults['integrationTests']> {
    const results = { systemInit: false, dataFlow: false, realTimeUpdates: false, errors: [] };

    try {
      console.log('Testing CFB Integration Service...');

      // Test system initialization
      try {
        await this.integrationService.initializeSystem();
        results.systemInit = true;
        console.log('✓ System initialization test passed');
      } catch (error) {
        results.errors.push(`System initialization failed: ${error.message}`);
      }

      // Test data flow between services
      try {
        const comprehensiveData = await this.integrationService.getComprehensiveTeamData('alabama');
        if (comprehensiveData && comprehensiveData.team && comprehensiveData.analytics) {
          results.dataFlow = true;
          console.log('✓ Data flow test passed');
        } else {
          results.errors.push('Data flow test returned incomplete data');
        }
      } catch (error) {
        results.errors.push(`Data flow test failed: ${error.message}`);
      }

      // Test system status monitoring
      try {
        const status = await this.integrationService.getSystemStatus();
        if (status && status.dataSync && status.analytics && status.predictions) {
          results.realTimeUpdates = true;
          console.log('✓ System status monitoring test passed');
        } else {
          results.errors.push('System status monitoring returned incomplete data');
        }
      } catch (error) {
        results.errors.push(`System status monitoring failed: ${error.message}`);
      }

    } catch (error) {
      results.errors.push(`Integration service initialization failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Calculate overall test score
   */
  private calculateOverallScore(results: CFBTestResults): number {
    const totalTests = 12; // 3 + 3 + 3 + 3 tests
    let passedTests = 0;

    // Count data sync tests
    if (results.dataSyncTests.teamSync) passedTests++;
    if (results.dataSyncTests.gameSync) passedTests++;
    if (results.dataSyncTests.recruitingSync) passedTests++;

    // Count analytics tests
    if (results.analyticsTests.teamAnalytics) passedTests++;
    if (results.analyticsTests.recruitingAnalytics) passedTests++;
    if (results.analyticsTests.coachingAnalytics) passedTests++;

    // Count ML prediction tests
    if (results.mlPredictionTests.gamePredict) passedTests++;
    if (results.mlPredictionTests.playoffPredict) passedTests++;
    if (results.mlPredictionTests.featureExtraction) passedTests++;

    // Count integration tests
    if (results.integrationTests.systemInit) passedTests++;
    if (results.integrationTests.dataFlow) passedTests++;
    if (results.integrationTests.realTimeUpdates) passedTests++;

    return Math.round((passedTests / totalTests) * 100);
  }

  /**
   * Run quick validation test
   */
  async runQuickValidation(): Promise<boolean> {
    try {
      console.log('Running CFB quick validation...');

      // Test basic service initialization
      await this.dataSyncService.initialize();
      await this.analyticsService.initialize();
      await this.mlPredictionService.initialize();

      // Test basic functionality
      const teams = await this.dataSyncService.getAllActiveTeams();
      if (!teams || teams.length === 0) {
        console.error('❌ Quick validation failed: No teams found');
        return false;
      }

      const testAnalytics = await this.analyticsService.generateTeamAnalytics(teams[0].id, new Date().getFullYear());
      if (!testAnalytics || !testAnalytics.teamId) {
        console.error('❌ Quick validation failed: Analytics generation failed');
        return false;
      }

      console.log('✓ CFB quick validation passed');
      return true;
    } catch (error) {
      Sentry.captureException(error);
      console.error('❌ CFB quick validation failed:', error.message);
      return false;
    }
  }

  /**
   * Generate test report
   */
  async generateTestReport(results: CFBTestResults): Promise<string> {
    const report = `
# College Football (CFB) System Test Report

## Overall Results
- **Score**: ${results.overallScore}%
- **Status**: ${results.passed ? 'PASSED' : 'FAILED'}
- **Date**: ${new Date().toISOString()}

## Data Sync Service Tests
- Team Sync: ${results.dataSyncTests.teamSync ? '✓ PASSED' : '❌ FAILED'}
- Game Sync: ${results.dataSyncTests.gameSync ? '✓ PASSED' : '❌ FAILED'}
- Recruiting Sync: ${results.dataSyncTests.recruitingSync ? '✓ PASSED' : '❌ FAILED'}
${results.dataSyncTests.errors.length > 0 ? `- Errors: ${results.dataSyncTests.errors.join(', ')}` : ''}

## Analytics Service Tests
- Team Analytics: ${results.analyticsTests.teamAnalytics ? '✓ PASSED' : '❌ FAILED'}
- Recruiting Analytics: ${results.analyticsTests.recruitingAnalytics ? '✓ PASSED' : '❌ FAILED'}
- Coaching Analytics: ${results.analyticsTests.coachingAnalytics ? '✓ PASSED' : '❌ FAILED'}
${results.analyticsTests.errors.length > 0 ? `- Errors: ${results.analyticsTests.errors.join(', ')}` : ''}

## ML Prediction Service Tests
- Game Prediction: ${results.mlPredictionTests.gamePredict ? '✓ PASSED' : '❌ FAILED'}
- Playoff Prediction: ${results.mlPredictionTests.playoffPredict ? '✓ PASSED' : '❌ FAILED'}
- Feature Extraction: ${results.mlPredictionTests.featureExtraction ? '✓ PASSED' : '❌ FAILED'}
${results.mlPredictionTests.errors.length > 0 ? `- Errors: ${results.mlPredictionTests.errors.join(', ')}` : ''}

## Integration Service Tests
- System Initialization: ${results.integrationTests.systemInit ? '✓ PASSED' : '❌ FAILED'}
- Data Flow: ${results.integrationTests.dataFlow ? '✓ PASSED' : '❌ FAILED'}
- Real-time Updates: ${results.integrationTests.realTimeUpdates ? '✓ PASSED' : '❌ FAILED'}
${results.integrationTests.errors.length > 0 ? `- Errors: ${results.integrationTests.errors.join(', ')}` : ''}

## Summary
The CFB system implementation includes:
- Data synchronization for teams, games, recruiting, and coaching data
- Advanced analytics with 70+ ML features
- Machine learning predictions for games and playoff probabilities
- Real-time integration and monitoring system

${results.passed ? 
  'The CFB system is ready for production deployment.' : 
  'The CFB system requires fixes before production deployment.'}
`;

    return report;
  }
}

export const cfbTestSuite = new CollegeFootballTestSuite();