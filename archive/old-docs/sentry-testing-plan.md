# Comprehensive Sentry Integration Testing Plan
## AI Sports Edge - Full Stack Monitoring

### Overview
This testing plan covers all aspects of our Sentry integration across frontend, backend, scheduled jobs, and ML operations.

---

## 🎯 Test Categories

### 1. Frontend React Native Tests
**Component**: React Native App with Sentry DSN 1

#### 1.1 Error Tracking Tests
- **Test ID**: FE-ERR-001
- **Description**: Test unhandled JavaScript errors
- **Steps**:
  1. Navigate to any screen in the app
  2. Trigger an intentional error (undefined variable access)
  3. Verify error appears in Sentry dashboard
- **Expected Result**: Error captured with stack trace and user context

#### 1.2 Performance Monitoring Tests
- **Test ID**: FE-PERF-001  
- **Description**: Test screen navigation performance
- **Steps**:
  1. Navigate between multiple screens rapidly
  2. Monitor performance metrics in Sentry
- **Expected Result**: Navigation timing data captured

#### 1.3 User Context Tests
- **Test ID**: FE-CTX-001
- **Description**: Test user context tracking
- **Steps**:
  1. Login with test user
  2. Trigger an error or event
  3. Verify user ID and context in Sentry
- **Expected Result**: User information attached to events

#### 1.4 Custom Event Tests
- **Test ID**: FE-CUSTOM-001
- **Description**: Test custom event tracking
- **Steps**:
  1. Perform key user actions (subscription, betting, etc.)
  2. Check for custom events in Sentry
- **Expected Result**: Business events tracked with relevant metadata

---

### 2. Backend Firebase Functions Tests
**Component**: Firebase Functions with Sentry DSN 2

#### 2.1 HTTP Function Error Tests
- **Test ID**: BE-HTTP-001
- **Description**: Test HTTP function error handling
- **Steps**:
  1. Call Stripe webhook endpoint with invalid payload
  2. Verify error captured in Sentry
- **Expected Result**: HTTP errors with request context captured

#### 2.2 Database Operation Tests
- **Test ID**: BE-DB-001
- **Description**: Test database error handling
- **Steps**:
  1. Trigger function that accesses non-existent Firestore collection
  2. Verify database error captured
- **Expected Result**: Database errors with operation context

#### 2.3 Authentication Tests
- **Test ID**: BE-AUTH-001
- **Description**: Test user creation function
- **Steps**:
  1. Create new user account
  2. Verify successful execution tracking
  3. Test with invalid user data
- **Expected Result**: Both success and error cases tracked

#### 2.4 Stripe Integration Tests
- **Test ID**: BE-STRIPE-001
- **Description**: Test Stripe webhook processing
- **Steps**:
  1. Send valid Stripe webhook
  2. Send invalid webhook payload
  3. Verify both scenarios in Sentry
- **Expected Result**: Payment processing events and errors tracked

---

### 3. Scheduled Cron Job Tests
**Component**: Scheduled Functions with Cron Monitoring

#### 3.1 Notification Processing Tests
- **Test ID**: CRON-NOTIF-001
- **Function**: processScheduledNotifications
- **Steps**:
  1. Create test notification in Firestore
  2. Wait for cron execution (or trigger manually)
  3. Verify successful processing in Sentry
  4. Create invalid notification to test error handling
- **Expected Result**: Successful executions and errors both captured

#### 3.2 Leaderboard Update Tests
- **Test ID**: CRON-LEAD-001
- **Function**: updateReferralLeaderboard
- **Steps**:
  1. Manually trigger leaderboard update
  2. Verify database operations tracked
  3. Test with missing user data
- **Expected Result**: Leaderboard calculations and database operations tracked

#### 3.3 RSS Feed Processing Tests
- **Test ID**: CRON-RSS-001
- **Function**: processRssFeedsAndNotify
- **Steps**:
  1. Add test RSS items to Firestore
  2. Trigger RSS processing function
  3. Verify user matching and notification logic
- **Expected Result**: RSS processing pipeline tracked end-to-end

#### 3.4 Cleanup Function Tests
- **Test ID**: CRON-CLEAN-001
- **Function**: cleanupOldNotifications
- **Steps**:
  1. Create old test notifications
  2. Trigger cleanup function
  3. Verify deletion operations tracked
- **Expected Result**: Cleanup operations and database writes tracked

---

### 4. ML Operations Tests
**Component**: Machine Learning Functions

#### 4.1 Game Prediction Tests
- **Test ID**: ML-PRED-001
- **Function**: predictTodayGames
- **Steps**:
  1. Add test games to Firestore
  2. Trigger prediction function
  3. Verify ML model download and processing
  4. Test with invalid game data
- **Expected Result**: ML operations, model downloads, and predictions tracked

#### 4.2 Stats Update Tests  
- **Test ID**: ML-STATS-001
- **Function**: updateStatsPage
- **Steps**:
  1. Ensure completed games exist in database
  2. Trigger stats update function
  3. Verify statistics calculations
- **Expected Result**: Stats calculations and database operations tracked

#### 4.3 Model Performance Tests
- **Test ID**: ML-PERF-001
- **Description**: Test ML model performance monitoring
- **Steps**:
  1. Monitor prediction accuracy over time
  2. Track model download speeds
  3. Monitor processing time per game
- **Expected Result**: ML performance metrics captured

---

## 🧪 Test Execution Scripts

### Test Automation Scripts

#### Frontend Test Script
```bash
#!/bin/bash
# frontend-sentry-tests.sh

echo "🧪 Running Frontend Sentry Tests..."

# Test 1: Trigger JavaScript Error
echo "Test FE-ERR-001: JavaScript Error Test"
# Manual test - trigger error in app

# Test 2: Performance Monitoring
echo "Test FE-PERF-001: Performance Test"
# Monitor navigation performance

# Test 3: Custom Events
echo "Test FE-CUSTOM-001: Custom Events Test"
# Trigger business events

echo "✅ Frontend tests complete. Check Sentry dashboard."
```

#### Backend Test Script
```bash
#!/bin/bash
# backend-sentry-tests.sh

echo "🧪 Running Backend Sentry Tests..."

# Test HTTP endpoints
curl -X POST https://your-region-your-project.cloudfunctions.net/stripeWebhook \
  -H "Content-Type: application/json" \
  -d '{"invalid": "payload"}'

echo "✅ Backend tests complete. Check Sentry dashboard."
```

#### Cron Jobs Test Script
```bash
#!/bin/bash
# cron-sentry-tests.sh

echo "🧪 Running Cron Job Sentry Tests..."

# Use the test script we already created
./functions/test-sentry-crons.sh

echo "✅ Cron job tests complete. Check Sentry dashboard."
```

---

## 📊 Test Results Tracking

### Test Results Template

| Test ID | Component | Status | Sentry Event ID | Notes |
|---------|-----------|--------|-----------------|--------|
| FE-ERR-001 | Frontend | ⏳ | | |
| FE-PERF-001 | Frontend | ⏳ | | |
| BE-HTTP-001 | Backend | ⏳ | | |
| CRON-NOTIF-001 | Scheduled | ⏳ | | |
| ML-PRED-001 | ML Ops | ⏳ | | |

### Success Criteria

✅ **Pass Criteria**:
- Event appears in Sentry dashboard within 30 seconds
- Correct error/event type captured
- Relevant context and metadata included
- Stack traces (for errors) are complete and accurate

❌ **Fail Criteria**:
- Event not captured within 2 minutes
- Missing critical context information
- Incorrect event classification
- Incomplete stack traces

---

## 🔍 Monitoring Verification Checklist

### Pre-Test Setup
- [ ] Sentry projects configured with correct DSNs
- [ ] Firebase functions deployed with latest Sentry integration
- [ ] Test data prepared in Firestore
- [ ] Monitoring dashboards accessible

### During Testing
- [ ] Sentry dashboard open and refreshing
- [ ] Firebase Console logs accessible
- [ ] Test execution timestamps recorded
- [ ] Screenshots of Sentry events captured

### Post-Test Verification
- [ ] All test events visible in Sentry
- [ ] Performance metrics captured
- [ ] Error grouping working correctly
- [ ] Alert notifications received (if configured)

---

## 🚨 Emergency Test Scenarios

### Critical Path Tests
1. **Payment Processing Failure**: Test Stripe webhook failures
2. **Database Outage**: Test Firestore connection errors
3. **ML Model Unavailable**: Test prediction failures
4. **High Load**: Test concurrent function executions

### Disaster Recovery Tests
1. **Sentry Outage**: Verify app continues functioning
2. **Network Issues**: Test offline error queuing
3. **Memory Limits**: Test function memory exhaustion
4. **Timeout Scenarios**: Test long-running operations

---

## 📈 Performance Benchmarks

### Expected Performance Metrics
- **Frontend Error Capture**: < 1 second
- **Backend Function Monitoring**: < 500ms overhead
- **Cron Job Check-ins**: < 2 seconds
- **ML Operation Tracking**: < 1 second per operation

### Resource Usage Limits
- **Memory Overhead**: < 50MB per function
- **CPU Overhead**: < 5% additional processing
- **Network Overhead**: < 1KB per event

---

## 🔧 Troubleshooting Guide

### Common Issues
1. **Events Not Appearing**: Check DSN configuration
2. **Missing Context**: Verify user session tracking
3. **Duplicate Events**: Check event deduplication settings
4. **Performance Impact**: Monitor function execution times

### Debug Commands
```bash
# Check Sentry configuration
node -e "console.log(require('./functions/sentryConfig.js'))"

# Verify function exports
firebase functions:list

# Test individual function
firebase functions:shell
```

---

## 📋 Final Beta Testing Checklist

### Pre-Beta Deployment
- [ ] All tests passing with 95%+ success rate
- [ ] Performance benchmarks met
- [ ] Error rates within acceptable limits
- [ ] Monitoring dashboards configured
- [ ] Alert rules configured and tested
- [ ] Documentation updated
- [ ] Team trained on Sentry dashboard usage

### Beta Monitoring Plan
- [ ] Daily Sentry dashboard reviews
- [ ] Weekly performance metric analysis
- [ ] Monthly error trend reports
- [ ] Quarterly monitoring optimization reviews

### Success Metrics for Beta
- **Error Detection**: 99%+ error capture rate
- **Performance Impact**: < 2% function execution overhead
- **Alert Accuracy**: < 5% false positive rate
- **Coverage**: 100% critical path monitoring

---

*This testing plan ensures comprehensive verification of our Sentry integration before proceeding to beta testing.*