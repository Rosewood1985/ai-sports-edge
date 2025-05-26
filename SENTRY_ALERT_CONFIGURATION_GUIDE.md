# Sentry Dashboard Alert Configuration Guide

## Executive Summary

This guide provides step-by-step instructions for configuring the 12 critical alerts in the Sentry dashboard for AI Sports Edge production monitoring. These alerts are designed to provide proactive monitoring for revenue protection, infrastructure stability, performance optimization, and user experience.

## Prerequisites

- Sentry account with admin access to AI Sports Edge organization
- Frontend project: `ai-sports-edge-frontend` (DSN: `https://54a49d79ad378791571acf30b15ab89a@o4509368605081600.ingest.us.sentry.io/4509385186082816`)
- Backend project: `ai-sports-edge-backend` (DSN: `https://95b0deae4cc462e0d6f16c40a7417255@o4509368605081600.ingest.us.sentry.io/4509385370894336`)
- Functions deployed with Sentry monitoring enabled

## Alert Categories and Configuration

### 🔴 Revenue Protection Alerts (Critical - Immediate Response Required)

#### 1. Payment Processing Failures
**Purpose**: Detect Stripe webhook errors and payment timeouts to prevent revenue loss

**Configuration**:
- **Project**: ai-sports-edge-backend
- **Alert Type**: Error Rate
- **Conditions**:
  - Function name contains "stripe" OR "payment" OR "webhook"
  - Error rate > 5% over 5 minutes
  - OR Response time > 30 seconds
- **Threshold**: 5% error rate or >30s response time
- **Time Window**: 5 minutes
- **Notification**: Email + Slack + SMS (immediate)
- **Auto-resolve**: After 10 minutes below threshold

**Sentry Configuration Steps**:
1. Navigate to Alerts > Create Alert Rule
2. Select "ai-sports-edge-backend" project
3. Choose "Error Rate" alert type
4. Set conditions: `transaction:*stripe* OR transaction:*payment* OR transaction:*webhook*`
5. Set threshold: `percentage(count(), count()) > 0.05`
6. Set time window: 5 minutes
7. Add action: Send notification to #payments-critical Slack channel

#### 2. Subscription Sync Failures
**Purpose**: Monitor subscription lifecycle and prevent involuntary churn

**Configuration**:
- **Project**: ai-sports-edge-backend
- **Alert Type**: Error Count
- **Conditions**:
  - Function name contains "subscription" OR "sync" OR "customer"
  - Error count > 3 in 10 minutes
  - OR Customer ID mismatch errors
- **Threshold**: 3 errors in 10 minutes
- **Time Window**: 10 minutes
- **Notification**: Email + Slack (high priority)

#### 3. Revenue Loss Prevention
**Purpose**: Detect failed checkout sessions and subscription downgrades

**Configuration**:
- **Project**: ai-sports-edge-backend
- **Alert Type**: Custom Metric
- **Conditions**:
  - Failed checkout sessions > 10% of total sessions
  - Subscription downgrades > 5% increase from baseline
- **Threshold**: 10% failure rate
- **Time Window**: 15 minutes
- **Notification**: Email + Slack

### 🟠 Infrastructure Alerts (High Priority - Response Within 15 Minutes)

#### 4. Database Write Failures
**Purpose**: Monitor Firestore connection errors and quota exceeded situations

**Configuration**:
- **Project**: ai-sports-edge-backend
- **Alert Type**: Error Rate
- **Conditions**:
  - Error message contains "firestore" OR "database" OR "quota"
  - Error rate > 2% over 5 minutes
- **Threshold**: 2% error rate
- **Time Window**: 5 minutes
- **Notification**: Email + Slack

#### 5. Authentication Failures
**Purpose**: Monitor Firebase Auth errors and token validation issues

**Configuration**:
- **Project**: Both projects
- **Alert Type**: Error Count
- **Conditions**:
  - Error message contains "auth" OR "token" OR "unauthorized"
  - Error count > 5 in 5 minutes
- **Threshold**: 5 errors in 5 minutes
- **Time Window**: 5 minutes
- **Notification**: Email + Slack

#### 6. API Rate Limiting
**Purpose**: Monitor external API quota exceeded (SportRadar, ESPN, Weather APIs)

**Configuration**:
- **Project**: ai-sports-edge-backend
- **Alert Type**: Error Count
- **Conditions**:
  - Error message contains "rate limit" OR "quota exceeded" OR "429"
  - Error count > 2 in 10 minutes
- **Threshold**: 2 errors in 10 minutes
- **Time Window**: 10 minutes
- **Notification**: Email + Slack

### 🟡 Performance Alerts (Medium Priority - Response Within 30 Minutes)

#### 7. ML Pipeline Failures
**Purpose**: Monitor prediction service errors and model loading issues

**Configuration**:
- **Project**: ai-sports-edge-backend
- **Alert Type**: Error Rate
- **Conditions**:
  - Function name contains "predict" OR "ml" OR "model"
  - Error rate > 1% over 10 minutes
- **Threshold**: 1% error rate
- **Time Window**: 10 minutes
- **Notification**: Email

#### 8. Performance Degradation
**Purpose**: Monitor function execution time and memory usage

**Configuration**:
- **Project**: ai-sports-edge-backend
- **Alert Type**: Performance Issue
- **Conditions**:
  - Function execution time > 30 seconds
  - OR Memory usage > 80% of allocated
- **Threshold**: 30s execution time or 80% memory
- **Time Window**: 5 minutes
- **Notification**: Email

#### 9. Scheduled Function Failures
**Purpose**: Monitor cron job missed executions and timeout errors

**Configuration**:
- **Project**: ai-sports-edge-backend
- **Alert Type**: Cron Monitor
- **Conditions**:
  - Cron job status: missed or failed
  - Timeout errors on scheduled functions
- **Threshold**: 1 missed execution or timeout
- **Time Window**: Per schedule interval
- **Notification**: Email + Slack

### 🔵 User Experience Alerts (Standard Priority - Response Within 1 Hour)

#### 10. High Error Rate
**Purpose**: Monitor overall application error rate for user experience impact

**Configuration**:
- **Project**: ai-sports-edge-frontend
- **Alert Type**: Error Rate
- **Conditions**:
  - Overall error rate > 5% in 5-minute window
  - Excluding known non-critical errors
- **Threshold**: 5% error rate
- **Time Window**: 5 minutes
- **Notification**: Email

#### 11. Frontend Crashes
**Purpose**: Monitor React Native ErrorBoundary triggers

**Configuration**:
- **Project**: ai-sports-edge-frontend
- **Alert Type**: Error Count
- **Conditions**:
  - Error source: ErrorBoundary
  - Error count > 3 in 15 minutes
- **Threshold**: 3 crashes in 15 minutes
- **Time Window**: 15 minutes
- **Notification**: Email + Slack

#### 12. Critical Path Failures
**Purpose**: Monitor login, signup, and payment flow errors

**Configuration**:
- **Project**: Both projects
- **Alert Type**: Error Rate
- **Conditions**:
  - Screen/function contains "login" OR "signup" OR "payment"
  - Error rate > 2% over 10 minutes
- **Threshold**: 2% error rate
- **Time Window**: 10 minutes
- **Notification**: Email

## Detailed Setup Instructions

### Step 1: Access Sentry Dashboard
1. Login to Sentry at https://sentry.io
2. Navigate to your AI Sports Edge organization
3. Select the appropriate project (frontend or backend)

### Step 2: Create Alert Rules
1. Go to Alerts > Alert Rules
2. Click "Create Alert Rule"
3. Select the alert type based on the configurations above
4. Configure conditions using the provided filters and thresholds

### Step 3: Set Up Notifications
1. Go to Settings > Integrations
2. Configure Slack integration:
   - Add webhook URL for #alerts-critical channel
   - Add webhook URL for #alerts-standard channel
3. Configure email notifications:
   - Add team email addresses
   - Set up escalation policies

### Step 4: Configure Cron Monitoring
1. Go to Crons section in Sentry
2. Add monitors for each scheduled function:
   - processNotificationsV2 (every 1 minute)
   - updateLeaderboardV2 (every 30 minutes)
   - dailyCleanupV2 (daily at 2 AM)
   - backupUserDataV2 (daily at 3 AM)

### Step 5: Test Alert Configuration
1. Trigger test errors using deployed functions:
   ```bash
   # Test error capture
   curl "https://us-central1-ai-sports-edge.cloudfunctions.net/sentryBasicTest?test=error"
   
   # Test performance monitoring
   curl "https://us-central1-ai-sports-edge.cloudfunctions.net/performanceTest?iterations=10000"
   ```

2. Verify alerts are triggered in Sentry dashboard
3. Confirm notifications are received via configured channels

## Alert Response Procedures

### Critical Alerts (Revenue Protection)
1. **Immediate Response** (within 5 minutes)
2. Check Sentry error details and stack traces
3. Verify Stripe dashboard for payment issues
4. Contact on-call engineer if needed
5. Implement hotfix if identified
6. Monitor for resolution

### High Priority Alerts (Infrastructure)
1. **Response within 15 minutes**
2. Check Firebase console for service status
3. Review function logs and performance metrics
4. Scale resources if needed
5. Investigate root cause

### Medium/Standard Priority Alerts
1. **Response within 30-60 minutes**
2. Create ticket for investigation
3. Review trends and patterns
4. Schedule fix for next deployment cycle

## Dashboard Configuration

### Custom Dashboards
Create the following dashboards in Sentry:

1. **Revenue Health Dashboard**
   - Payment processing success rate
   - Subscription lifecycle metrics
   - Revenue-impacting errors

2. **Infrastructure Health Dashboard**
   - Function execution times
   - Database operation success rates
   - API quota usage

3. **User Experience Dashboard**
   - Frontend crash rates
   - Critical path success rates
   - Error distribution by screen

### Key Metrics to Monitor
- Error rate trends
- Response time percentiles (P50, P95, P99)
- Function execution success rates
- Cron job completion rates
- User session error rates

## Maintenance and Updates

### Weekly Review
- Review alert effectiveness
- Adjust thresholds based on baseline changes
- Update notification channels as needed

### Monthly Optimization
- Analyze alert fatigue and false positives
- Optimize alert conditions and thresholds
- Update escalation procedures

### Quarterly Assessment
- Review ROI of monitoring investment
- Assess coverage gaps
- Plan monitoring infrastructure improvements

## Contact Information

**Primary On-Call**: Development Team Lead  
**Secondary On-Call**: DevOps Engineer  
**Escalation**: CTO

**Slack Channels**:
- #alerts-critical (immediate response required)
- #alerts-standard (standard priority)
- #dev-team (development discussions)

**Email Aliases**:
- alerts-critical@aisportsedge.com
- dev-team@aisportsedge.com

This alert configuration provides comprehensive monitoring coverage while minimizing alert fatigue through carefully tuned thresholds and appropriate prioritization.