# Critical Sentry Alerts Configuration
## AI Sports Edge - Essential Monitoring & Alerting Setup

---

## 🚨 **CRITICAL ALERTS TO CONFIGURE**

### **1. ML Prediction Pipeline (HIGHEST PRIORITY)**

#### **predictTodayGames Function**
- **Alert Name**: `ML Prediction Failure`
- **Trigger**: Error rate > 5% in 5 minutes
- **Severity**: Critical
- **Notification**: Immediate (SMS + Email + Slack)

**Configuration in Sentry Dashboard**:
```
Project: Firebase Functions Backend
Alert Rule: Error Rate
Condition: 
  - Function: predictTodayGames
  - Error Rate > 5% 
  - Time Window: 5 minutes
  - Minimum Events: 2 errors

Actions:
  - Send notification to: Engineering team
  - Escalate after: 10 minutes if unresolved
  - Include context: Error message, stack trace, game data
```

#### **ML Model Download Failures**
- **Alert Name**: `ML Model Download Critical`
- **Trigger**: API call to model endpoint fails
- **Severity**: Critical
- **Notification**: Immediate

**Sentry Configuration**:
```
Filter: 
  - Message contains: "download_ml_model"
  - Level: Error
  - Function: predictTodayGames

Trigger: Any occurrence
Notification: Immediate
```

---

### **2. User-Facing Critical Functions**

#### **User Registration & Authentication**
- **Alert Name**: `User Creation Failures`
- **Trigger**: Error rate > 10% in 10 minutes
- **Severity**: High
- **Functions**: `onUserCreate`, Stripe customer creation

**Configuration**:
```
Project: Firebase Functions Backend
Condition:
  - Function: onUserCreate
  - Error Rate > 10%
  - Time Window: 10 minutes
  - Minimum Events: 3 errors

Actions:
  - Notify: Product & Engineering teams
  - Escalate: 15 minutes
```

#### **Payment Processing**
- **Alert Name**: `Stripe Webhook Failures`
- **Trigger**: Error rate > 2% in 5 minutes
- **Severity**: Critical
- **Functions**: `stripeWebhook`, subscription handlers

**Configuration**:
```
Filter:
  - Function: stripeWebhook
  - OR Function: handleCheckoutSessionCompleted
  - OR Function: handleInvoicePaid
  - Level: Error

Condition: Error Rate > 2% in 5 minutes
Notification: Critical (immediate escalation)
```

#### **Notification Delivery**
- **Alert Name**: `Notification System Down`
- **Trigger**: Error rate > 15% in 10 minutes
- **Severity**: High
- **Functions**: `processScheduledNotifications`

**Configuration**:
```
Filter:
  - Function: processScheduledNotifications
  - Level: Error
  - Contains: OneSignal OR notification

Condition: Error Rate > 15% in 10 minutes
Notification: Engineering team
```

---

### **3. Data Integrity & Consistency**

#### **Database Operations**
- **Alert Name**: `Critical Database Failures`
- **Trigger**: Firestore operations failing
- **Severity**: High
- **Context**: All functions with database operations

**Configuration**:
```
Filter:
  - Message contains: "trackDatabaseOperation"
  - Level: Error
  - OR Message contains: "Firestore"

Condition: Error Rate > 8% in 15 minutes
Actions:
  - Notify: Engineering + DevOps
  - Include: Database operation type, collection
```

#### **Data Consistency Triggers**
- **Alert Name**: `Data Sync Failures`
- **Trigger**: Consistency trigger failures
- **Severity**: Medium
- **Functions**: Database consistency triggers

**Configuration**:
```
Filter:
  - Function: syncSubscriptionStatus
  - OR Function: syncCustomerId
  - OR Function: standardizeStatusSpelling
  - Level: Error

Condition: Any occurrence
Notification: Engineering team (delayed 5 minutes)
```

---

### **4. Performance Degradation Alerts**

#### **Function Timeout Warnings**
- **Alert Name**: `Function Performance Degraded`
- **Trigger**: Execution time > 30 seconds
- **Severity**: Medium
- **Functions**: All scheduled functions

**Configuration**:
```
Metric: Transaction Duration
Condition:
  - P95 > 30 seconds
  - Time Window: 10 minutes
  - Functions: predictTodayGames, updateStatsPage

Actions:
  - Notify: Engineering team
  - Context: Performance data, memory usage
```

#### **High Memory Usage**
- **Alert Name**: `Memory Usage Critical`
- **Trigger**: Memory usage > 80% of allocated
- **Severity**: High
- **Functions**: ML prediction functions

**Configuration**:
```
Custom Metric: Memory Usage
Condition: > 80% of allocated memory
Functions: predictTodayGames, updateStatsPage
Notification: DevOps team
```

---

### **5. Business-Critical Scheduled Jobs**

#### **Cron Job Failures**
- **Alert Name**: `Scheduled Job Failed`
- **Trigger**: Cron job doesn't check in within expected time
- **Severity**: High
- **Jobs**: All 6 scheduled functions

**Sentry Cron Monitoring Setup**:
```
Monitor Slug: processScheduledNotifications
Schedule: */1 * * * * (every minute)
Timezone: America/New_York
Margin: 5 minutes
Max Runtime: 10 minutes

Monitor Slug: updateReferralLeaderboard  
Schedule: 0 0 * * * (daily midnight)
Timezone: America/New_York
Margin: 30 minutes
Max Runtime: 15 minutes

Monitor Slug: predictTodayGames
Schedule: 0 10 * * * (daily 10 AM)
Timezone: America/New_York  
Margin: 60 minutes
Max Runtime: 30 minutes

Monitor Slug: processRssFeedsAndNotify
Schedule: */30 * * * * (every 30 minutes)
Timezone: America/New_York
Margin: 10 minutes
Max Runtime: 5 minutes

Monitor Slug: updateStatsPage
Schedule: 0 0 * * 0 (weekly Sunday)
Timezone: America/New_York
Margin: 2 hours
Max Runtime: 45 minutes

Monitor Slug: cleanupOldNotifications
Schedule: 0 0 * * * (daily)
Timezone: America/New_York
Margin: 60 minutes
Max Runtime: 15 minutes
```

---

## 📧 **NOTIFICATION CONFIGURATION**

### **Notification Channels**

#### **Critical Alerts (0-5 minutes)**
- **Email**: engineering@aisportsedge.com
- **SMS**: Engineering lead mobile number
- **Slack**: #critical-alerts channel
- **PagerDuty**: Engineering escalation

#### **High Priority (5-15 minutes)**
- **Email**: engineering@aisportsedge.com, product@aisportsedge.com
- **Slack**: #alerts channel
- **Webhook**: Custom alerting endpoint

#### **Medium Priority (15-60 minutes)**
- **Email**: engineering@aisportsedge.com
- **Slack**: #monitoring channel
- **Dashboard**: Alert visible in Sentry dashboard

### **Escalation Rules**

```
Critical Alert → No Response in 10 minutes → Escalate to Engineering Manager
High Alert → No Response in 20 minutes → Escalate to Product Manager
Medium Alert → No Response in 60 minutes → Create ticket in issue tracker
```

---

## 🎯 **SENTRY DASHBOARD SETUP**

### **Custom Dashboard: "AI Sports Edge Critical Monitoring"**

#### **Dashboard Widgets**:

1. **ML Pipeline Health**
   - Error rate for predictTodayGames
   - Success rate of predictions
   - Model download performance

2. **User-Facing Function Status**
   - User creation success rate
   - Payment processing health
   - Notification delivery rate

3. **Scheduled Jobs Overview**
   - Cron job check-in status
   - Last execution times
   - Failure rates by function

4. **Performance Metrics**
   - Function execution times (P95, P99)
   - Memory usage trends
   - Database operation latency

5. **Error Trends**
   - Error rate over time
   - Top error types
   - Resolution times

---

## 🔧 **IMPLEMENTATION STEPS**

### **Step 1: Configure Cron Monitors**
```bash
# In Sentry Dashboard → Cron Monitoring
1. Create new monitor for each scheduled function
2. Set schedules and margins as specified above
3. Configure failure notifications
4. Test with manual check-ins
```

### **Step 2: Set Up Alert Rules**
```bash
# In Sentry Dashboard → Alerts → Alert Rules
1. Create error rate alerts for critical functions
2. Set up performance alerts for slow functions
3. Configure custom metric alerts for business KPIs
4. Test alert triggers with sample errors
```

### **Step 3: Configure Notification Integrations**
```bash
# In Sentry Dashboard → Settings → Integrations
1. Set up email notifications
2. Configure Slack webhook
3. Connect PagerDuty (if applicable)
4. Test notification delivery
```

### **Step 4: Create Custom Dashboard**
```bash
# In Sentry Dashboard → Dashboards
1. Create "AI Sports Edge Critical Monitoring" dashboard
2. Add widgets for each critical metric
3. Set up automatic refresh
4. Share with team members
```

---

## ⚡ **QUICK SETUP COMMANDS**

### **Test Critical Alerts**
```bash
# Trigger test error in ML function
curl -X POST "https://us-central1-your-project.cloudfunctions.net/sentryMLTest" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "ml_error"}'

# Trigger test error in payment function  
curl -X POST "https://us-central1-your-project.cloudfunctions.net/sentryErrorTest" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "payment_error"}'
```

### **Verify Cron Monitoring**
```bash
# Run cron test script
./functions/test-sentry-crons.sh

# Check Sentry dashboard for check-ins
echo "Visit: https://sentry.io/crons/ to verify check-ins"
```

---

## 📊 **SUCCESS METRICS**

### **Alert Effectiveness KPIs**
- **Mean Time to Detection (MTTD)**: < 5 minutes for critical issues
- **Mean Time to Resolution (MTTR)**: < 30 minutes for critical issues
- **False Positive Rate**: < 5% of all alerts
- **Alert Coverage**: 100% of critical user-facing functions

### **Monitoring Coverage**
- ✅ **ML Pipeline**: 100% coverage with critical alerts
- ✅ **User Registration**: Error rate and performance monitoring
- ✅ **Payment Processing**: Critical error alerts configured
- ✅ **Scheduled Jobs**: Cron monitoring for all 6 functions
- ✅ **Performance**: Degradation alerts for key functions

---

*This configuration ensures immediate notification of any issues that could severely impact user experience or core business functionality.*