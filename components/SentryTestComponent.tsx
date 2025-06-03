/**
 * Sentry Test Component
 * Component for testing Sentry error reporting and monitoring
 *
 * This component provides a UI to test various Sentry features including:
 * - Error capture
 * - Racing operation tracking
 * - ML operation monitoring
 * - Cache performance tracking
 * - Navigation tracking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';

import { sentryService } from '../services/sentryService';
import { sentryNavigationInstrumentation } from '../utils/sentryNavigationInstrumentation';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

export const SentryTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test: string, success: boolean, message: string) => {
    const result: TestResult = {
      test,
      success,
      message,
      timestamp: new Date(),
    };
    setTestResults(prev => [result, ...prev]);
  };

  const testBasicErrorCapture = async () => {
    try {
      const eventId = sentryService.captureError(new Error('Test error from SentryTestComponent'), {
        screen: 'SentryTestComponent',
        action: 'test_basic_error',
        additionalData: {
          testType: 'basic_error',
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        },
      });

      addTestResult(
        'Basic Error Capture',
        !!eventId,
        eventId ? `Error captured with ID: ${eventId}` : 'Error captured successfully'
      );
    } catch (error) {
      addTestResult('Basic Error Capture', false, `Failed: ${error.message}`);
    }
  };

  const testRacingOperationTracking = async () => {
    try {
      sentryService.trackRacingOperation('test_operation', 'nascar', {
        raceId: 'test_atlanta_500',
        drivers: 40,
        featuresGenerated: 25,
        testMode: true,
        platform: Platform.OS,
      });

      sentryService.trackRacingOperation('test_operation', 'horse_racing', {
        raceId: 'test_kentucky_derby',
        runners: 20,
        formAnalysis: true,
        testMode: true,
        platform: Platform.OS,
      });

      addTestResult(
        'Racing Operation Tracking',
        true,
        'NASCAR and Horse Racing operations tracked successfully'
      );
    } catch (error) {
      addTestResult('Racing Operation Tracking', false, `Failed: ${error.message}`);
    }
  };

  const testMLOperationTracking = async () => {
    try {
      sentryService.trackMLOperation('test_prediction', 'xgboost', 0.89, {
        sport: 'nascar',
        trainingAccuracy: 0.92,
        predictionCount: 40,
        testMode: true,
      });

      sentryService.trackMLOperation('test_training', 'neural_network', 0.85, {
        sport: 'horse_racing',
        epochs: 100,
        batchSize: 32,
        testMode: true,
      });

      addTestResult(
        'ML Operation Tracking',
        true,
        'XGBoost and Neural Network operations tracked successfully'
      );
    } catch (error) {
      addTestResult('ML Operation Tracking', false, `Failed: ${error.message}`);
    }
  };

  const testCachePerformanceTracking = async () => {
    try {
      sentryService.trackCacheOperation('hit', 'hot', 0.95, {
        key: 'test_ml_features:nascar:race123',
        latency: 5,
        testMode: true,
      });

      sentryService.trackCacheOperation('miss', 'warm', 0.82, {
        key: 'test_performance:horse_racing:data456',
        latency: 45,
        testMode: true,
      });

      sentryService.trackCacheOperation('eviction', 'cold', 0.75, {
        key: 'test_historical:archive:old_data',
        reason: 'size_limit',
        testMode: true,
      });

      addTestResult(
        'Cache Performance Tracking',
        true,
        'Hot, Warm, and Cold cache operations tracked successfully'
      );
    } catch (error) {
      addTestResult('Cache Performance Tracking', false, `Failed: ${error.message}`);
    }
  };

  const testDatabaseOperationTracking = async () => {
    try {
      sentryService.trackDatabaseOperation('find', 'nascar_races', 150, {
        queryType: 'ml_features',
        resultCount: 250,
        testMode: true,
      });

      sentryService.trackDatabaseOperation('insert', 'horse_races', 75, {
        recordCount: 1,
        collection: 'standardized_races',
        testMode: true,
      });

      addTestResult(
        'Database Operation Tracking',
        true,
        'Database find and insert operations tracked successfully'
      );
    } catch (error) {
      addTestResult('Database Operation Tracking', false, `Failed: ${error.message}`);
    }
  };

  const testNavigationTracking = async () => {
    try {
      sentryNavigationInstrumentation.onRouteFocus('SentryTestComponent', {
        testMode: true,
        origin: 'manual_test',
      });

      sentryNavigationInstrumentation.onRacingNavigation('nascar', 'test_navigation', {
        from: 'test_screen',
        to: 'racing_predictions',
        testMode: true,
      });

      sentryNavigationInstrumentation.onBettingNavigation('test_bet_placement', 'parlay', {
        betCount: 3,
        testMode: true,
      });

      addTestResult(
        'Navigation Tracking',
        true,
        'Route focus, racing navigation, and betting navigation tracked successfully'
      );
    } catch (error) {
      addTestResult('Navigation Tracking', false, `Failed: ${error.message}`);
    }
  };

  const testUserContextAndBreadcrumbs = async () => {
    try {
      // Set test user context
      sentryService.setUser({
        id: 'test_user_123',
        email: 'test@aisportsedge.app',
        username: 'test_user',
        subscription: 'premium',
        preferences: {
          sports: ['nascar', 'horse_racing'],
          notifications: true,
          testMode: true,
        },
      });

      // Add breadcrumbs
      sentryService.addBreadcrumb('Test breadcrumb for racing feature', 'racing', 'info', {
        feature: 'nascar_predictions',
        action: 'view_predictions',
        testMode: true,
      });

      sentryService.addBreadcrumb('Test breadcrumb for ML operation', 'ml', 'info', {
        model: 'xgboost',
        operation: 'prediction',
        testMode: true,
      });

      addTestResult(
        'User Context & Breadcrumbs',
        true,
        'User context set and breadcrumbs added successfully'
      );
    } catch (error) {
      addTestResult('User Context & Breadcrumbs', false, `Failed: ${error.message}`);
    }
  };

  const testPerformanceTransaction = async () => {
    try {
      const transaction = sentryService.startTransaction(
        'Test Racing Prediction',
        'test_operation',
        'Testing Sentry performance monitoring for racing predictions'
      );

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 500));

      if (transaction) {
        transaction.finish();
        addTestResult(
          'Performance Transaction',
          true,
          'Performance transaction created and finished successfully'
        );
      } else {
        addTestResult(
          'Performance Transaction',
          false,
          'Transaction was null - check Sentry initialization'
        );
      }
    } catch (error) {
      addTestResult('Performance Transaction', false, `Failed: ${error.message}`);
    }
  };

  const testMessageCapture = async () => {
    try {
      const eventId = sentryService.captureMessage(
        'Test message from SentryTestComponent',
        'info',
        {
          screen: 'SentryTestComponent',
          action: 'test_message',
          additionalData: {
            messageType: 'test',
            component: 'SentryTestComponent',
            timestamp: new Date().toISOString(),
          },
        }
      );

      addTestResult(
        'Message Capture',
        !!eventId,
        eventId ? `Message captured with ID: ${eventId}` : 'Message captured successfully'
      );
    } catch (error) {
      addTestResult('Message Capture', false, `Failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      testBasicErrorCapture,
      testMessageCapture,
      testUserContextAndBreadcrumbs,
      testRacingOperationTracking,
      testMLOperationTracking,
      testCachePerformanceTracking,
      testDatabaseOperationTracking,
      testNavigationTracking,
      testPerformanceTransaction,
    ];

    for (const test of tests) {
      await test();
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);

    Alert.alert(
      'Sentry Tests Complete',
      'All Sentry integration tests have been executed. Check your Sentry dashboard for the captured events.',
      [
        { text: 'OK' },
        {
          text: 'Open Sentry Dashboard',
          onPress: () => {
            // In a real app, you might open the Sentry dashboard URL
            console.log('Open: https://ai-sports-edge.sentry.io/projects/react-native/');
          },
        },
      ]
    );
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getSentryStatus = () => {
    const isActive = sentryService.isActive();
    const config = sentryService.getConfig();

    return {
      isActive,
      environment: config?.environment || 'unknown',
      debug: config?.debug || false,
      sampleRate: config?.tracesSampleRate || 0,
    };
  };

  const status = getSentryStatus();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Sentry Integration Test</Text>
        <Text style={styles.subtitle}>AI Sports Edge Error Monitoring</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>📊 Sentry Status</Text>
        <Text style={styles.statusText}>Active: {status.isActive ? '✅ Yes' : '❌ No'}</Text>
        <Text style={styles.statusText}>Environment: {status.environment}</Text>
        <Text style={styles.statusText}>Debug: {status.debug ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>Sample Rate: {status.sampleRate * 100}%</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Text style={styles.buttonTextSecondary}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.individualTests}>
        <Text style={styles.sectionTitle}>🧪 Individual Tests</Text>

        <TouchableOpacity style={styles.testButton} onPress={testBasicErrorCapture}>
          <Text style={styles.testButtonText}>❌ Test Error Capture</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testRacingOperationTracking}>
          <Text style={styles.testButtonText}>🏁 Test Racing Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testMLOperationTracking}>
          <Text style={styles.testButtonText}>🧠 Test ML Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testCachePerformanceTracking}>
          <Text style={styles.testButtonText}>⚡ Test Cache Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testNavigationTracking}>
          <Text style={styles.testButtonText}>🗺️ Test Navigation Tracking</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        <Text style={styles.sectionTitle}>📋 Test Results</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet. Run tests to see results.</Text>
        ) : (
          testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                result.success ? styles.successResult : styles.failureResult,
              ]}
            >
              <Text style={styles.resultTest}>
                {result.success ? '✅' : '❌'} {result.test}
              </Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
              <Text style={styles.resultTime}>{result.timestamp.toLocaleTimeString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#363062',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.45,
  },
  primaryButton: {
    backgroundColor: '#4c956c',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  individualTests: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  testButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  results: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  noResults: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  resultItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  successResult: {
    backgroundColor: '#d4edda',
    borderLeftColor: '#28a745',
  },
  failureResult: {
    backgroundColor: '#f8d7da',
    borderLeftColor: '#dc3545',
  },
  resultTest: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default SentryTestComponent;
