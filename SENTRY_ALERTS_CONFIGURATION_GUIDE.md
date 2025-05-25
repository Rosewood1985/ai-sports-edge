# Sentry Alerts Configuration Guide
## AI Sports Edge - Step-by-Step Alert Setup

---

## 🚨 **CRITICAL ALERTS CONFIGURATION**

### **Step 1: predictTodayGames ML Function Alerts**

#### **Alert 1: ML Prediction Failures**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: ML_Prediction_Critical  │
│ Environment: production             │
│ Dataset: Errors                     │
├─────────────────────────────────────┤
│ WHEN: error.handled == false        │
│ AND: error.function == "predictTodayGames" │
│ AND: count() >= 2                   │
│ IN: 5 minutes                       │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #critical    │
│ • Email engineering@company.com     │
│ • Resolve threshold: 0 errors in 10 min │
└─────────────────────────────────────┘
```

#### **Alert 2: ML Model Download Failures**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: ML_Model_Download_Fail  │
│ Environment: production             │
│ Dataset: Errors                     │
├─────────────────────────────────────┤
│ WHEN: message contains "download_ml_model" │
│ AND: level == "error"               │
│ AND: count() >= 1                   │
│ IN: 1 minute                        │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #ml-alerts   │
│ • Email ml-team@company.com         │
│ • Immediate escalation              │
└─────────────────────────────────────┘
```

#### **Alert 3: ML Performance Degradation**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: ML_Performance_Slow     │
│ Environment: production             │
│ Dataset: Transactions               │
├─────────────────────────────────────┤
│ WHEN: transaction.op == "scheduled_function" │
│ AND: transaction contains "predictTodayGames" │
│ AND: p95(transaction.duration) > 30000 │
│ IN: 10 minutes                      │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #performance │
│ • Email devops@company.com          │
│ • Create incident in system         │
└─────────────────────────────────────┘
```

---

### **Step 2: Authentication & User Management Alerts**

#### **Alert 4: User Creation Failures**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: User_Creation_Failures  │
│ Environment: production             │
│ Dataset: Errors                     │
├─────────────────────────────────────┤
│ WHEN: error.function == "onUserCreate" │
│ AND: error.handled == false         │
│ AND: count() >= 3                   │
│ IN: 10 minutes                      │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #auth-alerts │
│ • Email product@company.com         │
│ • Track user impact metrics         │
└─────────────────────────────────────┘
```

#### **Alert 5: Frontend Authentication Errors**
```
🎯 Navigate to: Sentry Dashboard → Projects → React Native Frontend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: Frontend_Auth_Errors    │
│ Environment: production             │
│ Dataset: Errors                     │
├─────────────────────────────────────┤
│ WHEN: error.tag.feature == "authentication" │
│ OR: error.tag.screen contains "Login" │
│ AND: count() >= 5                   │
│ IN: 15 minutes                      │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #frontend    │
│ • Email mobile-team@company.com     │
│ • Monitor user session impact       │
└─────────────────────────────────────┘
```

---

### **Step 3: Payment Processing Alerts**

#### **Alert 6: Stripe Webhook Failures**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: Payment_Processing_Critical │
│ Environment: production             │
│ Dataset: Errors                     │
├─────────────────────────────────────┤
│ WHEN: error.function == "stripeWebhook" │
│ OR: error.function contains "handleCheckout" │
│ OR: error.function contains "handleInvoice" │
│ AND: count() >= 1                   │
│ IN: 5 minutes                       │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #payments    │
│ • Email billing@company.com         │
│ • Page on-call engineer             │
│ • Escalate to payment team lead     │
└─────────────────────────────────────┘
```

#### **Alert 7: Subscription Management Errors**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: Subscription_Errors     │
│ Environment: production             │
│ Dataset: Errors                     │
├─────────────────────────────────────┤
│ WHEN: error.tag.operation contains "subscription" │
│ OR: error.function contains "Subscription" │
│ AND: count() >= 2                   │
│ IN: 10 minutes                      │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #billing     │
│ • Email revenue-team@company.com    │
│ • Track revenue impact              │
└─────────────────────────────────────┘
```

---

### **Step 4: Database Connectivity Alerts**

#### **Alert 8: Firestore Connection Failures**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: Database_Connectivity   │
│ Environment: production             │
│ Dataset: Errors                     │
├─────────────────────────────────────┤
│ WHEN: message contains "trackDatabaseOperation" │
│ AND: level == "error"               │
│ OR: message contains "Firestore"    │
│ AND: message contains "connection"  │
│ AND: count() >= 5                   │
│ IN: 5 minutes                       │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #database    │
│ • Email infrastructure@company.com  │
│ • Create high-priority incident     │
│ • Monitor app functionality         │
└─────────────────────────────────────┘
```

#### **Alert 9: Database Operation Performance**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: Database_Performance    │
│ Environment: production             │
│ Dataset: Transactions               │
├─────────────────────────────────────┤
│ WHEN: transaction.op == "database_operation" │
│ AND: p95(transaction.duration) > 5000 │
│ IN: 15 minutes                      │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #performance │
│ • Email database-team@company.com   │
│ • Monitor query optimization needs  │
└─────────────────────────────────────┘
```

---

### **Step 5: API Response Performance Alerts**

#### **Alert 10: Slow API Response Times**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: API_Response_Slow       │
│ Environment: production             │
│ Dataset: Transactions               │
├─────────────────────────────────────┤
│ WHEN: transaction.op == "http"      │
│ AND: p95(transaction.duration) > 10000 │
│ IN: 10 minutes                      │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #api-alerts  │
│ • Email backend-team@company.com    │
│ • Monitor user experience impact    │
└─────────────────────────────────────┘
```

#### **Alert 11: API Call Tracking Failures**
```
🎯 Navigate to: Sentry Dashboard → Projects → Firebase Functions Backend → Alerts → Create Alert Rule

Configuration:
┌─────────────────────────────────────┐
│ Alert Name: API_Call_Failures       │
│ Environment: production             │
│ Dataset: Errors                     │
├─────────────────────────────────────┤
│ WHEN: message contains "trackApiCall" │
│ AND: level == "error"               │
│ OR: message contains "API call failed" │
│ AND: count() >= 10                  │
│ IN: 10 minutes                      │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #integrations │
│ • Email api-team@company.com        │
│ • Check third-party service status  │
└─────────────────────────────────────┘
```

---

### **Step 6: Scheduled Jobs Monitoring**

#### **Alert 12: Cron Job Check-in Failures**
```
🎯 Navigate to: Sentry Dashboard → Cron Monitoring → Create Monitor

Configuration for each scheduled function:

┌─────────────────────────────────────┐
│ Monitor: processScheduledNotifications │
│ Schedule: */1 * * * *               │
│ Timezone: America/New_York          │
│ Margin: 5 minutes                   │
│ Max Runtime: 10 minutes             │
├─────────────────────────────────────┤
│ Alert Conditions:                   │
│ • Missing check-in                  │
│ • Check-in timeout                  │
│ • Check-in failure                  │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #cron-alerts │
│ • Email operations@company.com      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Monitor: predictTodayGames          │
│ Schedule: 0 10 * * *                │
│ Timezone: America/New_York          │
│ Margin: 60 minutes                  │
│ Max Runtime: 30 minutes             │
├─────────────────────────────────────┤
│ Alert Conditions:                   │
│ • Missing daily prediction run      │
│ • Prediction job timeout            │
│ • Prediction job failure            │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #ml-alerts   │
│ • Email ml-ops@company.com          │
│ • Page ML team lead                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Monitor: updateReferralLeaderboard  │
│ Schedule: 0 0 * * *                 │
│ Timezone: America/New_York          │
│ Margin: 30 minutes                  │
│ Max Runtime: 15 minutes             │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #operations  │
│ • Email product@company.com         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Monitor: processRssFeedsAndNotify   │
│ Schedule: */30 * * * *              │
│ Timezone: America/New_York          │
│ Margin: 10 minutes                  │
│ Max Runtime: 5 minutes              │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #content     │
│ • Email content-team@company.com    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Monitor: updateStatsPage            │
│ Schedule: 0 0 * * 0                 │
│ Timezone: America/New_York          │
│ Margin: 2 hours                     │
│ Max Runtime: 45 minutes             │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #analytics   │
│ • Email data-team@company.com       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Monitor: cleanupOldNotifications    │
│ Schedule: 0 0 * * *                 │
│ Timezone: America/New_York          │
│ Margin: 60 minutes                  │
│ Max Runtime: 15 minutes             │
├─────────────────────────────────────┤
│ Actions:                            │
│ • Send notification to #maintenance │
│ • Email operations@company.com      │
└─────────────────────────────────────┘
```

---

## 📧 **NOTIFICATION SETUP**

### **Step 7: Configure Notification Channels**

#### **Slack Integration**
```
🎯 Navigate to: Sentry Dashboard → Settings → Integrations → Slack

Setup:
1. Connect Slack workspace
2. Create channels:
   • #critical-alerts (for immediate issues)
   • #ml-alerts (for ML pipeline issues)
   • #auth-alerts (for authentication issues)
   • #payments (for billing/payment issues)
   • #database (for database issues)
   • #performance (for performance issues)
   • #cron-alerts (for scheduled job issues)
   • #api-alerts (for API issues)

3. Configure alert routing to appropriate channels
```

#### **Email Integration**
```
🎯 Navigate to: Sentry Dashboard → Settings → Integrations → Email

Setup:
1. Configure SMTP settings (if needed)
2. Add email recipients:
   • engineering@company.com
   • ml-team@company.com
   • product@company.com
   • billing@company.com
   • operations@company.com

3. Set up email templates for different alert types
```

#### **PagerDuty Integration** (Optional)
```
🎯 Navigate to: Sentry Dashboard → Settings → Integrations → PagerDuty

Setup:
1. Connect PagerDuty account
2. Configure escalation policies
3. Set up on-call schedules
4. Map critical alerts to appropriate teams
```

---

## 🎯 **ALERT TESTING**

### **Step 8: Test Alert Configuration**

#### **Test Critical Alerts**
```bash
# Test ML prediction error
curl -X POST "https://us-central1-your-project.cloudfunctions.net/sentryMLTest" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "prediction_error"}'

# Test authentication error  
curl -X POST "https://us-central1-your-project.cloudfunctions.net/sentryErrorTest" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "auth_error"}'

# Test payment processing error
curl -X POST "https://us-central1-your-project.cloudfunctions.net/sentryErrorTest" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "payment_error"}'

# Test database error
curl -X POST "https://us-central1-your-project.cloudfunctions.net/sentryErrorTest" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "database_error"}'
```

#### **Test Cron Monitoring**
```bash
# Trigger manual cron tests
./functions/test-sentry-crons.sh

# Check Sentry dashboard for check-ins
echo "Visit: https://sentry.io/crons/ to verify check-ins appear"
```

---

## 📊 **DASHBOARD SETUP**

### **Step 9: Create Monitoring Dashboard**

```
🎯 Navigate to: Sentry Dashboard → Dashboards → Create Dashboard

Dashboard Name: "AI Sports Edge Critical Monitoring"

Widgets to Add:

1. Error Rate by Function (Last 24h)
   • Widget: Line Chart
   • Data: Error count by function name
   • Filter: Environment = production

2. ML Pipeline Health
   • Widget: Big Number
   • Data: Success rate for predictTodayGames
   • Time: Last 7 days

3. Payment Processing Status
   • Widget: Table
   • Data: Error count for payment functions
   • Group by: Function name

4. Database Performance
   • Widget: Line Chart  
   • Data: P95 response time for database operations
   • Time: Last 24 hours

5. Cron Job Status
   • Widget: Table
   • Data: Last check-in time for each monitor
   • Filter: Cron monitoring

6. User Impact Metrics
   • Widget: Big Number
   • Data: Affected users count
   • Time: Last 1 hour

7. Top Errors by Volume
   • Widget: Table
   • Data: Error count grouped by error type
   • Time: Last 24 hours

8. Performance Trends
   • Widget: Line Chart
   • Data: P95 response time by endpoint
   • Time: Last 7 days
```

---

## ✅ **VERIFICATION CHECKLIST**

### **Alert Configuration Complete**
- [ ] ML prediction failure alerts configured
- [ ] Authentication error alerts configured  
- [ ] Payment processing alerts configured
- [ ] Database connectivity alerts configured
- [ ] API performance alerts configured
- [ ] Cron job monitoring configured
- [ ] Notification channels connected
- [ ] Test alerts sent and received
- [ ] Dashboard created with key metrics
- [ ] Team members have access to alerts

### **Critical Functions Covered**
- [ ] ✅ predictTodayGames (ML predictions)
- [ ] ✅ User authentication & registration
- [ ] ✅ Payment processing & billing
- [ ] ✅ Database operations
- [ ] ✅ API response performance
- [ ] ✅ Scheduled job execution

---

## 🚨 **ESCALATION PROCEDURES**

### **Critical Alert Response (0-5 minutes)**
1. **Automatic**: Alert sent to #critical-alerts Slack channel
2. **Automatic**: Email sent to engineering team
3. **Manual**: On-call engineer investigates immediately
4. **Escalation**: If no response in 10 minutes, page engineering manager

### **High Priority Response (5-15 minutes)**
1. **Automatic**: Alert sent to relevant team Slack channel
2. **Automatic**: Email sent to team lead
3. **Manual**: Team investigates within SLA
4. **Escalation**: If no response in 20 minutes, escalate to manager

### **Performance Response (15-60 minutes)**
1. **Automatic**: Alert sent to #performance Slack channel
2. **Manual**: Team reviews and prioritizes
3. **Planning**: Include in next sprint if ongoing issue

---

*This configuration provides comprehensive monitoring and alerting for all critical functions in your AI Sports Edge application.*