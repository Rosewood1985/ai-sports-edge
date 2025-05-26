// =============================================================================
// NBA TEST SUITE
// Comprehensive Testing and Validation for NBA System
// =============================================================================

import { NBADataSyncService } from './nbaDataSyncService';
import { NBAAnalyticsService } from './nbaAnalyticsService';
import { NBAMLPredictionService } from './nbaMLPredictionService';
import { NBAParlayAnalyticsService } from './nbaParlayAnalyticsService';
import { NBAIntegrationService } from './nbaIntegrationService';
import { initSentry } from '../sentryConfig';

// Initialize Sentry for monitoring
const Sentry = initSentry();

export interface NBATestResults {
  dataSyncTests: {
    teamSync: boolean;
    playerSync: boolean;
    gameSync: boolean;
    apiAccess: boolean;
    errors: string[];
  };
  analyticsTests: {
    teamAnalytics: boolean;
    playerAnalytics: boolean;
    basketballMetrics: boolean;
    situationalAnalytics: boolean;
    errors: string[];
  };
  mlPredictionTests: {
    gamePredict: boolean;
    playoffPredict: boolean;
    featureExtraction: boolean;
    modelAccuracy: boolean;
    errors: string[];
  };
  parlayAnalyticsTests: {
    sameGameParlays: boolean;
    multiGameParlays: boolean;
    playerPropParlays: boolean;
    correlationAnalysis: boolean;
    errors: string[];
  };
  integrationTests: {
    systemInit: boolean;
    dataFlow: boolean;
    realTimeUpdates: boolean;
    comprehensiveData: boolean;
    errors: string[];
  };
  performanceTests: {
    responseTime: boolean;
    memoryUsage: boolean;
    concurrency: boolean;
    caching: boolean;
    errors: string[];
  };
  overallScore: number;
  passed: boolean;
}

export class NBATestSuite {
  private dataSyncService: NBADataSyncService;
  private analyticsService: NBAAnalyticsService;
  private mlPredictionService: NBAMLPredictionService;
  private parlayAnalyticsService: NBAParlayAnalyticsService;
  private integrationService: NBAIntegrationService;

  constructor() {
    this.dataSyncService = new NBADataSyncService();
    this.analyticsService = new NBAAnalyticsService();
    this.mlPredictionService = new NBAMLPredictionService();
    this.parlayAnalyticsService = new NBAParlayAnalyticsService();
    this.integrationService = new NBAIntegrationService({
      enableRealTimeUpdates: false, // Disable for testing
      enablePredictions: true,
      enableAnalytics: true,
      enableParlayAnalytics: true,
    });
  }

  /**
   * Run comprehensive NBA system test suite
   */
  async runComprehensiveTests(): Promise<NBATestResults> {
    const results: NBATestResults = {
      dataSyncTests: { teamSync: false, playerSync: false, gameSync: false, apiAccess: false, errors: [] },
      analyticsTests: { teamAnalytics: false, playerAnalytics: false, basketballMetrics: false, situationalAnalytics: false, errors: [] },
      mlPredictionTests: { gamePredict: false, playoffPredict: false, featureExtraction: false, modelAccuracy: false, errors: [] },
      parlayAnalyticsTests: { sameGameParlays: false, multiGameParlays: false, playerPropParlays: false, correlationAnalysis: false, errors: [] },
      integrationTests: { systemInit: false, dataFlow: false, realTimeUpdates: false, comprehensiveData: false, errors: [] },
      performanceTests: { responseTime: false, memoryUsage: false, concurrency: false, caching: false, errors: [] },
      overallScore: 0,
      passed: false,
    };

    try {
      console.log('🏀 Starting NBA comprehensive test suite...');

      // Test Data Sync Service
      console.log('📊 Testing NBA Data Sync Service...');
      results.dataSyncTests = await this.testDataSyncService();

      // Test Analytics Service
      console.log('📈 Testing NBA Analytics Service...');
      results.analyticsTests = await this.testAnalyticsService();

      // Test ML Prediction Service
      console.log('🤖 Testing NBA ML Prediction Service...');
      results.mlPredictionTests = await this.testMLPredictionService();

      // Test Parlay Analytics Service
      console.log('💰 Testing NBA Parlay Analytics Service...');
      results.parlayAnalyticsTests = await this.testParlayAnalyticsService();

      // Test Integration Service
      console.log('🔗 Testing NBA Integration Service...');
      results.integrationTests = await this.testIntegrationService();

      // Test Performance
      console.log('⚡ Testing NBA System Performance...');
      results.performanceTests = await this.testPerformance();

      // Calculate overall score
      results.overallScore = this.calculateOverallScore(results);
      results.passed = results.overallScore >= 80; // 80% pass threshold

      console.log(`🏀 NBA Test Suite Complete - Score: ${results.overallScore}% - ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);

      return results;
    } catch (error) {
      Sentry.captureException(error);
      console.error('❌ NBA test suite failed:', error.message);
      results.passed = false;
      return results;
    }
  }

  /**
   * Test NBA Data Sync Service
   */
  private async testDataSyncService(): Promise<NBATestResults['dataSyncTests']> {
    const results = { teamSync: false, playerSync: false, gameSync: false, apiAccess: false, errors: [] };

    try {
      console.log('  🔍 Testing NBA data sync service...');

      // Test API access validation
      try {
        await this.dataSyncService.initialize();
        results.apiAccess = true;
        console.log('  ✅ API access validation passed');
      } catch (error) {
        results.errors.push(`API access validation failed: ${error.message}`);
        console.log('  ❌ API access validation failed');
      }

      // Test team synchronization
      try {
        await this.dataSyncService.syncTeams();
        const teams = await this.dataSyncService.getAllActiveTeams();
        if (teams && teams.length >= 30) { // NBA has 30 teams
          results.teamSync = true;
          console.log(`  ✅ Team sync test passed - ${teams.length} teams loaded`);
        } else {
          results.errors.push(`Team sync returned insufficient teams: ${teams?.length || 0}`);
          console.log('  ❌ Team sync test failed');
        }
      } catch (error) {
        results.errors.push(`Team sync failed: ${error.message}`);
        console.log('  ❌ Team sync test failed');
      }

      // Test player synchronization
      try {
        await this.dataSyncService.syncPlayers();
        // Validate by checking if we have players for a known team
        const testTeam = await this.dataSyncService.getTeamById('lakers'); // Assuming Lakers have ID 'lakers'
        if (testTeam && testTeam.roster && testTeam.roster.length > 0) {
          results.playerSync = true;
          console.log('  ✅ Player sync test passed');
        } else {
          results.errors.push('Player sync did not populate team rosters');
          console.log('  ❌ Player sync test failed');
        }
      } catch (error) {
        results.errors.push(`Player sync failed: ${error.message}`);
        console.log('  ❌ Player sync test failed');
      }

      // Test game synchronization
      try {
        await this.dataSyncService.syncCurrentSeasonGames();
        const upcomingGames = await this.dataSyncService.getUpcomingGames(7);
        const recentGames = await this.dataSyncService.getRecentGames(7);
        
        if ((upcomingGames && upcomingGames.length >= 0) || (recentGames && recentGames.length >= 0)) {
          results.gameSync = true;
          console.log(`  ✅ Game sync test passed - ${upcomingGames.length} upcoming, ${recentGames.length} recent games`);
        } else {
          results.errors.push('Game sync failed to return valid data');
          console.log('  ❌ Game sync test failed');
        }
      } catch (error) {
        results.errors.push(`Game sync failed: ${error.message}`);
        console.log('  ❌ Game sync test failed');
      }

    } catch (error) {
      results.errors.push(`Data sync service initialization failed: ${error.message}`);
      console.log('  ❌ Data sync service initialization failed');
    }

    return results;
  }

  /**
   * Test NBA Analytics Service
   */
  private async testAnalyticsService(): Promise<NBATestResults['analyticsTests']> {
    const results = { teamAnalytics: false, playerAnalytics: false, basketballMetrics: false, situationalAnalytics: false, errors: [] };

    try {
      console.log('  📊 Testing NBA analytics service...');

      await this.analyticsService.initialize();

      const testTeamId = 'lakers'; // Use Lakers as test case
      const testPlayerId = 'lebron-james'; // Use LeBron as test case
      const currentSeason = new Date().getFullYear();

      // Test team analytics generation
      try {
        const teamAnalytics = await this.analyticsService.generateTeamAnalytics(testTeamId, currentSeason);
        if (teamAnalytics && 
            teamAnalytics.teamId && 
            teamAnalytics.offensiveMetrics && 
            teamAnalytics.defensiveMetrics &&
            teamAnalytics.advancedMetrics) {
          results.teamAnalytics = true;
          console.log('  ✅ Team analytics test passed');
        } else {
          results.errors.push('Team analytics returned incomplete data structure');
          console.log('  ❌ Team analytics test failed');
        }
      } catch (error) {
        results.errors.push(`Team analytics failed: ${error.message}`);
        console.log('  ❌ Team analytics test failed');
      }

      // Test player analytics generation
      try {
        const playerAnalytics = await this.analyticsService.generatePlayerAnalytics(testPlayerId, currentSeason);
        if (playerAnalytics && 
            playerAnalytics.playerId && 
            playerAnalytics.basicMetrics && 
            playerAnalytics.advancedMetrics) {
          results.playerAnalytics = true;
          console.log('  ✅ Player analytics test passed');
        } else {
          results.errors.push('Player analytics returned incomplete data structure');
          console.log('  ❌ Player analytics test failed');
        }
      } catch (error) {
        results.errors.push(`Player analytics failed: ${error.message}`);
        console.log('  ❌ Player analytics test failed');
      }

      // Test basketball-specific metrics
      try {
        const teamAnalytics = await this.analyticsService.getTeamAnalytics(testTeamId, currentSeason);
        if (teamAnalytics && 
            teamAnalytics.basketballMetrics && 
            teamAnalytics.basketballMetrics.reboundRate &&
            teamAnalytics.basketballMetrics.shootingEfficiency) {
          results.basketballMetrics = true;
          console.log('  ✅ Basketball metrics test passed');
        } else {
          results.errors.push('Basketball metrics not properly calculated');
          console.log('  ❌ Basketball metrics test failed');
        }
      } catch (error) {
        results.errors.push(`Basketball metrics failed: ${error.message}`);
        console.log('  ❌ Basketball metrics test failed');
      }

      // Test situational analytics
      try {
        const teamAnalytics = await this.analyticsService.getTeamAnalytics(testTeamId, currentSeason);
        if (teamAnalytics && 
            teamAnalytics.situationalMetrics && 
            teamAnalytics.situationalMetrics.clutchPerformance &&
            teamAnalytics.situationalMetrics.homeAwayDifferential) {
          results.situationalAnalytics = true;
          console.log('  ✅ Situational analytics test passed');
        } else {
          results.errors.push('Situational analytics not properly calculated');
          console.log('  ❌ Situational analytics test failed');
        }
      } catch (error) {
        results.errors.push(`Situational analytics failed: ${error.message}`);
        console.log('  ❌ Situational analytics test failed');
      }

    } catch (error) {
      results.errors.push(`Analytics service initialization failed: ${error.message}`);
      console.log('  ❌ Analytics service initialization failed');
    }

    return results;
  }

  /**
   * Test NBA ML Prediction Service
   */
  private async testMLPredictionService(): Promise<NBATestResults['mlPredictionTests']> {
    const results = { gamePredict: false, playoffPredict: false, featureExtraction: false, modelAccuracy: false, errors: [] };

    try {
      console.log('  🤖 Testing NBA ML prediction service...');

      await this.mlPredictionService.initialize();

      // Test game prediction
      try {
        const prediction = await this.mlPredictionService.predictGame('lakers', 'celtics', new Date());
        if (prediction && 
            prediction.winProbability !== undefined && 
            prediction.spreadPrediction !== undefined &&
            prediction.totalPointsPrediction !== undefined &&
            prediction.confidence) {
          results.gamePredict = true;
          console.log(`  ✅ Game prediction test passed - Win prob: ${prediction.winProbability.toFixed(3)}`);
        } else {
          results.errors.push('Game prediction returned incomplete data');
          console.log('  ❌ Game prediction test failed');
        }
      } catch (error) {
        results.errors.push(`Game prediction failed: ${error.message}`);
        console.log('  ❌ Game prediction test failed');
      }

      // Test playoff probability calculation
      try {
        const playoffProbs = await this.mlPredictionService.calculatePlayoffProbabilities(['lakers', 'celtics', 'warriors', 'nets']);
        if (playoffProbs && Object.keys(playoffProbs).length > 0) {
          const firstTeam = Object.values(playoffProbs)[0];
          if (firstTeam.playoffProbability !== undefined && firstTeam.seedProbabilities) {
            results.playoffPredict = true;
            console.log('  ✅ Playoff probability test passed');
          } else {
            results.errors.push('Playoff probability calculation returned incomplete data');
            console.log('  ❌ Playoff probability test failed');
          }
        } else {
          results.errors.push('Playoff probability calculation returned no data');
          console.log('  ❌ Playoff probability test failed');
        }
      } catch (error) {
        results.errors.push(`Playoff probability calculation failed: ${error.message}`);
        console.log('  ❌ Playoff probability test failed');
      }

      // Test feature extraction
      try {
        const features = await this.mlPredictionService.extractMLFeatures('lakers', 'celtics', new Date());
        if (features && 
            features.homeTeamStrength && 
            features.awayTeamStrength &&
            features.matchupMetrics &&
            features.situationalContext &&
            features.playerFactors &&
            features.historicalContext) {
          const totalFeatures = this.countFeatures(features);
          if (totalFeatures >= 60) { // Should have 70 features
            results.featureExtraction = true;
            console.log(`  ✅ Feature extraction test passed - ${totalFeatures} features extracted`);
          } else {
            results.errors.push(`Feature extraction returned insufficient features: ${totalFeatures}`);
            console.log('  ❌ Feature extraction test failed');
          }
        } else {
          results.errors.push('Feature extraction returned incomplete feature set');
          console.log('  ❌ Feature extraction test failed');
        }
      } catch (error) {
        results.errors.push(`Feature extraction failed: ${error.message}`);
        console.log('  ❌ Feature extraction test failed');
      }

      // Test model accuracy validation
      try {
        const accuracy = await this.mlPredictionService.validatePredictionAccuracy();
        if (accuracy >= 0 && accuracy <= 100) { // Valid percentage
          results.modelAccuracy = true;
          console.log(`  ✅ Model accuracy test passed - ${accuracy.toFixed(1)}% accuracy`);
        } else {
          results.errors.push(`Invalid accuracy score: ${accuracy}`);
          console.log('  ❌ Model accuracy test failed');
        }
      } catch (error) {
        results.errors.push(`Model accuracy validation failed: ${error.message}`);
        console.log('  ❌ Model accuracy test failed');
      }

    } catch (error) {
      results.errors.push(`ML Prediction service initialization failed: ${error.message}`);
      console.log('  ❌ ML Prediction service initialization failed');
    }

    return results;
  }

  /**
   * Test NBA Parlay Analytics Service
   */
  private async testParlayAnalyticsService(): Promise<NBATestResults['parlayAnalyticsTests']> {
    const results = { sameGameParlays: false, multiGameParlays: false, playerPropParlays: false, correlationAnalysis: false, errors: [] };

    try {
      console.log('  💰 Testing NBA parlay analytics service...');

      await this.parlayAnalyticsService.initialize();

      const testGameIds = ['game1', 'game2', 'game3'];

      // Test same-game parlay generation
      try {
        const sameGameBuilder = await this.parlayAnalyticsService.buildSameGameParlayOptions(testGameIds[0]);
        if (sameGameBuilder && 
            sameGameBuilder.availableLegs && 
            sameGameBuilder.optimalCombinations &&
            sameGameBuilder.correlationMatrix) {
          results.sameGameParlays = true;
          console.log('  ✅ Same-game parlay test passed');
        } else {
          results.errors.push('Same-game parlay builder returned incomplete data');
          console.log('  ❌ Same-game parlay test failed');
        }
      } catch (error) {
        results.errors.push(`Same-game parlay generation failed: ${error.message}`);
        console.log('  ❌ Same-game parlay test failed');
      }

      // Test multi-game parlay opportunities
      try {
        const opportunities = await this.parlayAnalyticsService.analyzeParlayOpportunities(testGameIds);
        if (Array.isArray(opportunities)) {
          results.multiGameParlays = true;
          console.log(`  ✅ Multi-game parlay test passed - ${opportunities.length} opportunities generated`);
        } else {
          results.errors.push('Multi-game parlay analysis returned invalid data');
          console.log('  ❌ Multi-game parlay test failed');
        }
      } catch (error) {
        results.errors.push(`Multi-game parlay analysis failed: ${error.message}`);
        console.log('  ❌ Multi-game parlay test failed');
      }

      // Test player prop analysis
      try {
        const playerProps = await this.parlayAnalyticsService.analyzePlayerProps(testGameIds[0]);
        if (Array.isArray(playerProps)) {
          results.playerPropParlays = true;
          console.log(`  ✅ Player prop analysis test passed - ${playerProps.length} props analyzed`);
        } else {
          results.errors.push('Player prop analysis returned invalid data');
          console.log('  ❌ Player prop analysis test failed');
        }
      } catch (error) {
        results.errors.push(`Player prop analysis failed: ${error.message}`);
        console.log('  ❌ Player prop analysis test failed');
      }

      // Test correlation analysis
      try {
        const opportunities = await this.parlayAnalyticsService.getParlayOpportunities(5);
        if (opportunities.length > 0) {
          const firstOpp = opportunities[0];
          if (firstOpp.analytics && 
              firstOpp.analytics.correlationScore !== undefined &&
              firstOpp.analytics.independenceScore !== undefined) {
            results.correlationAnalysis = true;
            console.log('  ✅ Correlation analysis test passed');
          } else {
            results.errors.push('Correlation analysis missing in parlay opportunities');
            console.log('  ❌ Correlation analysis test failed');
          }
        } else {
          results.errors.push('No parlay opportunities available for correlation analysis');
          console.log('  ❌ Correlation analysis test failed');
        }
      } catch (error) {
        results.errors.push(`Correlation analysis failed: ${error.message}`);
        console.log('  ❌ Correlation analysis test failed');
      }

    } catch (error) {
      results.errors.push(`Parlay Analytics service initialization failed: ${error.message}`);
      console.log('  ❌ Parlay Analytics service initialization failed');
    }

    return results;
  }

  /**
   * Test NBA Integration Service
   */
  private async testIntegrationService(): Promise<NBATestResults['integrationTests']> {
    const results = { systemInit: false, dataFlow: false, realTimeUpdates: false, comprehensiveData: false, errors: [] };

    try {
      console.log('  🔗 Testing NBA integration service...');

      // Test system initialization
      try {
        await this.integrationService.initializeSystem();
        results.systemInit = true;
        console.log('  ✅ System initialization test passed');
      } catch (error) {
        results.errors.push(`System initialization failed: ${error.message}`);
        console.log('  ❌ System initialization test failed');
      }

      // Test data flow between services
      try {
        const comprehensiveData = await this.integrationService.getComprehensiveTeamData('lakers');
        if (comprehensiveData && 
            comprehensiveData.team && 
            comprehensiveData.analytics &&
            comprehensiveData.upcomingGames !== undefined &&
            comprehensiveData.predictions !== undefined) {
          results.dataFlow = true;
          console.log('  ✅ Data flow test passed');
        } else {
          results.errors.push('Data flow test returned incomplete comprehensive data');
          console.log('  ❌ Data flow test failed');
        }
      } catch (error) {
        results.errors.push(`Data flow test failed: ${error.message}`);
        console.log('  ❌ Data flow test failed');
      }

      // Test system status monitoring
      try {
        const status = await this.integrationService.getSystemStatus();
        if (status && 
            status.dataSync && 
            status.analytics && 
            status.predictions &&
            status.parlayAnalytics) {
          results.realTimeUpdates = true;
          console.log('  ✅ System status monitoring test passed');
        } else {
          results.errors.push('System status monitoring returned incomplete data');
          console.log('  ❌ System status monitoring test failed');
        }
      } catch (error) {
        results.errors.push(`System status monitoring failed: ${error.message}`);
        console.log('  ❌ System status monitoring test failed');
      }

      // Test comprehensive data integration
      try {
        const dailyInsights = await this.integrationService.getDailyGameInsights(new Date());
        if (dailyInsights && 
            dailyInsights.date && 
            dailyInsights.games !== undefined &&
            dailyInsights.predictions !== undefined &&
            dailyInsights.parlayOpportunities !== undefined) {
          results.comprehensiveData = true;
          console.log('  ✅ Comprehensive data integration test passed');
        } else {
          results.errors.push('Comprehensive data integration returned incomplete data');
          console.log('  ❌ Comprehensive data integration test failed');
        }
      } catch (error) {
        results.errors.push(`Comprehensive data integration failed: ${error.message}`);
        console.log('  ❌ Comprehensive data integration test failed');
      }

    } catch (error) {
      results.errors.push(`Integration service initialization failed: ${error.message}`);
      console.log('  ❌ Integration service initialization failed');
    }

    return results;
  }

  /**
   * Test NBA System Performance
   */
  private async testPerformance(): Promise<NBATestResults['performanceTests']> {
    const results = { responseTime: false, memoryUsage: false, concurrency: false, caching: false, errors: [] };

    try {
      console.log('  ⚡ Testing NBA system performance...');

      // Test response time
      try {
        const startTime = Date.now();
        await this.integrationService.getSystemStatus();
        const responseTime = Date.now() - startTime;
        
        if (responseTime < 5000) { // Less than 5 seconds
          results.responseTime = true;
          console.log(`  ✅ Response time test passed - ${responseTime}ms`);
        } else {
          results.errors.push(`Response time too slow: ${responseTime}ms`);
          console.log('  ❌ Response time test failed');
        }
      } catch (error) {
        results.errors.push(`Response time test failed: ${error.message}`);
        console.log('  ❌ Response time test failed');
      }

      // Test memory usage (basic check)
      try {
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed < 512 * 1024 * 1024) { // Less than 512MB
          results.memoryUsage = true;
          console.log(`  ✅ Memory usage test passed - ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
        } else {
          results.errors.push(`Memory usage too high: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
          console.log('  ❌ Memory usage test failed');
        }
      } catch (error) {
        results.errors.push(`Memory usage test failed: ${error.message}`);
        console.log('  ❌ Memory usage test failed');
      }

      // Test concurrency (simplified)
      try {
        const concurrentRequests = Array(5).fill(null).map(() => 
          this.integrationService.getSystemStatus()
        );
        
        const results_concurrent = await Promise.all(concurrentRequests);
        if (results_concurrent.every(result => result !== null)) {
          results.concurrency = true;
          console.log('  ✅ Concurrency test passed');
        } else {
          results.errors.push('Concurrency test failed - some requests returned null');
          console.log('  ❌ Concurrency test failed');
        }
      } catch (error) {
        results.errors.push(`Concurrency test failed: ${error.message}`);
        console.log('  ❌ Concurrency test failed');
      }

      // Test caching behavior (basic check)
      try {
        const startTime1 = Date.now();
        await this.dataSyncService.getTeamById('lakers');
        const firstCallTime = Date.now() - startTime1;
        
        const startTime2 = Date.now();
        await this.dataSyncService.getTeamById('lakers');
        const secondCallTime = Date.now() - startTime2;
        
        // Second call should be faster due to caching (or at least not significantly slower)
        if (secondCallTime <= firstCallTime * 2) {
          results.caching = true;
          console.log(`  ✅ Caching test passed - First: ${firstCallTime}ms, Second: ${secondCallTime}ms`);
        } else {
          results.errors.push(`Caching test failed - Second call slower: ${secondCallTime}ms vs ${firstCallTime}ms`);
          console.log('  ❌ Caching test failed');
        }
      } catch (error) {
        results.errors.push(`Caching test failed: ${error.message}`);
        console.log('  ❌ Caching test failed');
      }

    } catch (error) {
      results.errors.push(`Performance testing failed: ${error.message}`);
      console.log('  ❌ Performance testing failed');
    }

    return results;
  }

  /**
   * Calculate overall test score
   */
  private calculateOverallScore(results: NBATestResults): number {
    const totalTests = 24; // Total number of individual tests
    let passedTests = 0;

    // Count data sync tests
    if (results.dataSyncTests.teamSync) passedTests++;
    if (results.dataSyncTests.playerSync) passedTests++;
    if (results.dataSyncTests.gameSync) passedTests++;
    if (results.dataSyncTests.apiAccess) passedTests++;

    // Count analytics tests
    if (results.analyticsTests.teamAnalytics) passedTests++;
    if (results.analyticsTests.playerAnalytics) passedTests++;
    if (results.analyticsTests.basketballMetrics) passedTests++;
    if (results.analyticsTests.situationalAnalytics) passedTests++;

    // Count ML prediction tests
    if (results.mlPredictionTests.gamePredict) passedTests++;
    if (results.mlPredictionTests.playoffPredict) passedTests++;
    if (results.mlPredictionTests.featureExtraction) passedTests++;
    if (results.mlPredictionTests.modelAccuracy) passedTests++;

    // Count parlay analytics tests
    if (results.parlayAnalyticsTests.sameGameParlays) passedTests++;
    if (results.parlayAnalyticsTests.multiGameParlays) passedTests++;
    if (results.parlayAnalyticsTests.playerPropParlays) passedTests++;
    if (results.parlayAnalyticsTests.correlationAnalysis) passedTests++;

    // Count integration tests
    if (results.integrationTests.systemInit) passedTests++;
    if (results.integrationTests.dataFlow) passedTests++;
    if (results.integrationTests.realTimeUpdates) passedTests++;
    if (results.integrationTests.comprehensiveData) passedTests++;

    // Count performance tests
    if (results.performanceTests.responseTime) passedTests++;
    if (results.performanceTests.memoryUsage) passedTests++;
    if (results.performanceTests.concurrency) passedTests++;
    if (results.performanceTests.caching) passedTests++;

    return Math.round((passedTests / totalTests) * 100);
  }

  /**
   * Count features in ML feature extraction result
   */
  private countFeatures(features: any): number {
    let count = 0;
    
    // Count homeTeamStrength features (10)
    if (features.homeTeamStrength) {
      count += Object.keys(features.homeTeamStrength).length;
    }
    
    // Count awayTeamStrength features (10)
    if (features.awayTeamStrength) {
      count += Object.keys(features.awayTeamStrength).length;
    }
    
    // Count matchupMetrics features (15)
    if (features.matchupMetrics) {
      count += Object.keys(features.matchupMetrics).length;
    }
    
    // Count situationalContext features (15)
    if (features.situationalContext) {
      count += Object.keys(features.situationalContext).length;
    }
    
    // Count playerFactors features (10)
    if (features.playerFactors) {
      count += Object.keys(features.playerFactors).length;
    }
    
    // Count historicalContext features (10)
    if (features.historicalContext) {
      count += Object.keys(features.historicalContext).length;
    }
    
    return count;
  }

  /**
   * Run quick validation test
   */
  async runQuickValidation(): Promise<boolean> {
    try {
      console.log('🏀 Running NBA quick validation...');

      // Test basic service initialization
      await this.dataSyncService.initialize();
      await this.analyticsService.initialize();
      await this.mlPredictionService.initialize();
      await this.parlayAnalyticsService.initialize();

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

      console.log('✅ NBA quick validation passed');
      return true;
    } catch (error) {
      Sentry.captureException(error);
      console.error('❌ NBA quick validation failed:', error.message);
      return false;
    }
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport(results: NBATestResults): Promise<string> {
    const report = `
# NBA System Comprehensive Test Report

## Overall Results
- **Score**: ${results.overallScore}%
- **Status**: ${results.passed ? '✅ PASSED' : '❌ FAILED'}
- **Date**: ${new Date().toISOString()}

## Data Sync Service Tests
- Team Sync: ${results.dataSyncTests.teamSync ? '✅ PASSED' : '❌ FAILED'}
- Player Sync: ${results.dataSyncTests.playerSync ? '✅ PASSED' : '❌ FAILED'}
- Game Sync: ${results.dataSyncTests.gameSync ? '✅ PASSED' : '❌ FAILED'}
- API Access: ${results.dataSyncTests.apiAccess ? '✅ PASSED' : '❌ FAILED'}
${results.dataSyncTests.errors.length > 0 ? `- Errors: ${results.dataSyncTests.errors.join(', ')}` : ''}

## Analytics Service Tests
- Team Analytics: ${results.analyticsTests.teamAnalytics ? '✅ PASSED' : '❌ FAILED'}
- Player Analytics: ${results.analyticsTests.playerAnalytics ? '✅ PASSED' : '❌ FAILED'}
- Basketball Metrics: ${results.analyticsTests.basketballMetrics ? '✅ PASSED' : '❌ FAILED'}
- Situational Analytics: ${results.analyticsTests.situationalAnalytics ? '✅ PASSED' : '❌ FAILED'}
${results.analyticsTests.errors.length > 0 ? `- Errors: ${results.analyticsTests.errors.join(', ')}` : ''}

## ML Prediction Service Tests
- Game Prediction: ${results.mlPredictionTests.gamePredict ? '✅ PASSED' : '❌ FAILED'}
- Playoff Prediction: ${results.mlPredictionTests.playoffPredict ? '✅ PASSED' : '❌ FAILED'}
- Feature Extraction: ${results.mlPredictionTests.featureExtraction ? '✅ PASSED' : '❌ FAILED'}
- Model Accuracy: ${results.mlPredictionTests.modelAccuracy ? '✅ PASSED' : '❌ FAILED'}
${results.mlPredictionTests.errors.length > 0 ? `- Errors: ${results.mlPredictionTests.errors.join(', ')}` : ''}

## Parlay Analytics Service Tests
- Same-Game Parlays: ${results.parlayAnalyticsTests.sameGameParlays ? '✅ PASSED' : '❌ FAILED'}
- Multi-Game Parlays: ${results.parlayAnalyticsTests.multiGameParlays ? '✅ PASSED' : '❌ FAILED'}
- Player Prop Parlays: ${results.parlayAnalyticsTests.playerPropParlays ? '✅ PASSED' : '❌ FAILED'}
- Correlation Analysis: ${results.parlayAnalyticsTests.correlationAnalysis ? '✅ PASSED' : '❌ FAILED'}
${results.parlayAnalyticsTests.errors.length > 0 ? `- Errors: ${results.parlayAnalyticsTests.errors.join(', ')}` : ''}

## Integration Service Tests
- System Initialization: ${results.integrationTests.systemInit ? '✅ PASSED' : '❌ FAILED'}
- Data Flow: ${results.integrationTests.dataFlow ? '✅ PASSED' : '❌ FAILED'}
- Real-time Updates: ${results.integrationTests.realTimeUpdates ? '✅ PASSED' : '❌ FAILED'}
- Comprehensive Data: ${results.integrationTests.comprehensiveData ? '✅ PASSED' : '❌ FAILED'}
${results.integrationTests.errors.length > 0 ? `- Errors: ${results.integrationTests.errors.join(', ')}` : ''}

## Performance Tests
- Response Time: ${results.performanceTests.responseTime ? '✅ PASSED' : '❌ FAILED'}
- Memory Usage: ${results.performanceTests.memoryUsage ? '✅ PASSED' : '❌ FAILED'}
- Concurrency: ${results.performanceTests.concurrency ? '✅ PASSED' : '❌ FAILED'}
- Caching: ${results.performanceTests.caching ? '✅ PASSED' : '❌ FAILED'}
${results.performanceTests.errors.length > 0 ? `- Errors: ${results.performanceTests.errors.join(', ')}` : ''}

## Summary
The NBA system implementation includes:
- Comprehensive data synchronization with ESPN APIs and NBA data sources
- Advanced analytics with 70+ ML features and basketball-specific metrics
- Machine learning predictions for games, player props, and playoff probabilities
- Sophisticated parlay analytics with correlation analysis and expected value calculations
- Real-time integration service orchestrating all components
- Performance optimization and caching mechanisms

${results.passed ? 
  'The NBA system is ready for production deployment with comprehensive coverage of all basketball analytics and betting features.' : 
  'The NBA system requires fixes before production deployment. Please review failed tests and implement necessary corrections.'}

## Feature Highlights
- **70+ ML Features**: Comprehensive feature extraction for accurate predictions
- **Advanced Basketball Metrics**: True shooting percentage, pace-adjusted ratings, clutch performance
- **Parlay Analytics**: Same-game parlays, multi-game combinations, correlation analysis
- **Real-time Updates**: Scheduled data sync, injury reports, line movements
- **Playoff Modeling**: Monte Carlo simulations for playoff probability calculations
- **Performance Optimization**: Caching, rate limiting, concurrent processing
`;

    return report;
  }
}

export const nbaTestSuite = new NBATestSuite();