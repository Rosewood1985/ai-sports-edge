/**
 * Background Process Monitoring System
 *
 * This module provides monitoring capabilities for Firebase Cloud Functions
 * and other background processes. It tracks execution times, success rates,
 * error patterns, and resource usage to help identify optimization opportunities.
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin if not already initialized
try {
  admin.initializeApp();
} catch (e) {
  // App already initialized
}

const db = admin.firestore();

/**
 * Process monitoring configuration
 */
const monitoringConfig = {
  // How often to aggregate metrics (in milliseconds)
  aggregationInterval: 3600000, // 1 hour

  // How long to retain detailed logs (in milliseconds)
  detailedLogRetention: 7 * 24 * 60 * 60 * 1000, // 7 days

  // How long to retain aggregated metrics (in milliseconds)
  aggregatedMetricsRetention: 90 * 24 * 60 * 60 * 1000, // 90 days

  // Threshold for slow execution alerts (in milliseconds)
  slowExecutionThreshold: 5000, // 5 seconds

  // Error rate threshold for alerts
  errorRateThreshold: 0.05, // 5%
};

/**
 * Log the start of a process execution
 * @param {string} processName - Name of the process
 * @param {Object} metadata - Additional metadata about the execution
 * @returns {string} Execution ID for tracking
 */
async function logProcessStart(processName, metadata = {}) {
  const executionId = `${processName}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

  await db
    .collection('processMonitoring')
    .doc('executions')
    .collection(processName)
    .doc(executionId)
    .set({
      processName,
      executionId,
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      status: 'running',
      metadata,
    });

  return executionId;
}

/**
 * Log the completion of a process execution
 * @param {string} executionId - Execution ID from logProcessStart
 * @param {string} processName - Name of the process
 * @param {string} status - Status of the execution (success, error)
 * @param {Object} result - Result of the execution
 * @param {Error} error - Error object if execution failed
 */
async function logProcessCompletion(executionId, processName, status, result = null, error = null) {
  const executionRef = db
    .collection('processMonitoring')
    .doc('executions')
    .collection(processName)
    .doc(executionId);
  const executionDoc = await executionRef.get();

  if (!executionDoc.exists) {
    console.error(`Execution ${executionId} not found for process ${processName}`);
    return;
  }

  const executionData = executionDoc.data();
  const startTime = executionData.startTime.toDate();
  const endTime = new Date();
  const duration = endTime - startTime;

  const updateData = {
    status,
    endTime: admin.firestore.FieldValue.serverTimestamp(),
    duration,
  };

  if (result) {
    updateData.result = result;
  }

  if (error) {
    updateData.error = {
      message: error.message,
      stack: error.stack,
      code: error.code,
    };
  }

  await executionRef.update(updateData);

  // Update process metrics
  await updateProcessMetrics(processName, status, duration);

  // Check for alerts
  if (
    status === 'error' ||
    (status === 'success' && duration > monitoringConfig.slowExecutionThreshold)
  ) {
    await createProcessAlert(processName, status, duration, error);
  }
}

/**
 * Update aggregated metrics for a process
 * @param {string} processName - Name of the process
 * @param {string} status - Status of the execution
 * @param {number} duration - Duration of the execution in milliseconds
 */
async function updateProcessMetrics(processName, status, duration) {
  const metricsRef = db
    .collection('processMonitoring')
    .doc('metrics')
    .collection(processName)
    .doc('current');

  // Use transaction to safely update metrics
  await db.runTransaction(async transaction => {
    const metricsDoc = await transaction.get(metricsRef);

    let metrics = {
      processName,
      totalExecutions: 0,
      successCount: 0,
      errorCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      minDuration: duration,
      maxDuration: duration,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (metricsDoc.exists) {
      metrics = metricsDoc.data();
      metrics.totalExecutions += 1;
      metrics.totalDuration += duration;
      metrics.averageDuration = metrics.totalDuration / metrics.totalExecutions;
      metrics.minDuration = Math.min(metrics.minDuration, duration);
      metrics.maxDuration = Math.max(metrics.maxDuration, duration);

      if (status === 'success') {
        metrics.successCount += 1;
      } else if (status === 'error') {
        metrics.errorCount += 1;
      }
    } else {
      metrics.totalExecutions = 1;
      metrics.totalDuration = duration;
      metrics.averageDuration = duration;

      if (status === 'success') {
        metrics.successCount = 1;
        metrics.errorCount = 0;
      } else if (status === 'error') {
        metrics.successCount = 0;
        metrics.errorCount = 1;
      }
    }

    transaction.set(metricsRef, metrics);
  });
}

/**
 * Create an alert for a process
 * @param {string} processName - Name of the process
 * @param {string} status - Status of the execution
 * @param {number} duration - Duration of the execution in milliseconds
 * @param {Error} error - Error object if execution failed
 */
async function createProcessAlert(processName, status, duration, error = null) {
  const alertRef = db.collection('processMonitoring').doc('alerts').collection(processName).doc();

  const alertData = {
    processName,
    status,
    duration,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    acknowledged: false,
  };

  if (error) {
    alertData.error = {
      message: error.message,
      stack: error.stack,
      code: error.code,
    };
  }

  await alertRef.set(alertData);

  // TODO: Implement notification system for alerts (email, Slack, etc.)
}

/**
 * Get metrics for a specific process
 * @param {string} processName - Name of the process
 * @returns {Object} Process metrics
 */
async function getProcessMetrics(processName) {
  const metricsRef = db
    .collection('processMonitoring')
    .doc('metrics')
    .collection(processName)
    .doc('current');
  const metricsDoc = await metricsRef.get();

  if (!metricsDoc.exists) {
    return null;
  }

  return metricsDoc.data();
}

/**
 * Get recent executions for a specific process
 * @param {string} processName - Name of the process
 * @param {number} limit - Maximum number of executions to return
 * @returns {Array} Recent executions
 */
async function getRecentExecutions(processName, limit = 10) {
  const executionsRef = db
    .collection('processMonitoring')
    .doc('executions')
    .collection(processName);
  const executionsQuery = executionsRef.orderBy('startTime', 'desc').limit(limit);
  const executionsSnapshot = await executionsQuery.get();

  return executionsSnapshot.docs.map(doc => doc.data());
}

/**
 * Get active alerts for all processes
 * @returns {Array} Active alerts
 */
async function getActiveAlerts() {
  const alertsRef = db.collection('processMonitoring').doc('alerts');
  const collections = await alertsRef.listCollections();

  const alerts = [];

  for (const collection of collections) {
    const processName = collection.id;
    const alertsQuery = alertsRef.collection(processName).where('acknowledged', '==', false);
    const alertsSnapshot = await alertsQuery.get();

    alertsSnapshot.forEach(doc => {
      alerts.push(doc.data());
    });
  }

  return alerts;
}

/**
 * Acknowledge an alert
 * @param {string} processName - Name of the process
 * @param {string} alertId - ID of the alert
 */
async function acknowledgeAlert(processName, alertId) {
  const alertRef = db
    .collection('processMonitoring')
    .doc('alerts')
    .collection(processName)
    .doc(alertId);
  await alertRef.update({
    acknowledged: true,
    acknowledgedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Clean up old monitoring data
 */
async function cleanupMonitoringData() {
  const now = Date.now();

  // Clean up detailed logs
  const detailedLogCutoff = new Date(now - monitoringConfig.detailedLogRetention);
  const executionsRef = db.collection('processMonitoring').doc('executions');
  const collections = await executionsRef.listCollections();

  for (const collection of collections) {
    const processName = collection.id;
    const oldExecutionsQuery = executionsRef
      .collection(processName)
      .where('startTime', '<', detailedLogCutoff);

    const oldExecutionsSnapshot = await oldExecutionsQuery.get();

    const batch = db.batch();
    oldExecutionsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  // TODO: Implement cleanup for aggregated metrics
}

// Export the monitoring functions
module.exports = {
  logProcessStart,
  logProcessCompletion,
  getProcessMetrics,
  getRecentExecutions,
  getActiveAlerts,
  acknowledgeAlert,
  cleanupMonitoringData,
};
