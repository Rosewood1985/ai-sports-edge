# Sentry Error Tracking Integration

**Setup Date**: May 25, 2025  
**Status**: ✅ CONFIGURED - Ready for DSN  
**Version**: Compatible with Expo SDK 45.0.8  

## Overview

Sentry error tracking has been successfully integrated into the AI Sports Edge app with comprehensive monitoring for errors, performance, and navigation tracking. The implementation is compatible with the current Expo SDK 45.0.8 and React Navigation v6.

## Integration Summary

### 1. **Package Installation**
```bash
npm install @sentry/react-native@4.15.2 --legacy-peer-deps
```
- Installed compatible Sentry version for Expo 45
- Used `--legacy-peer-deps` to resolve dependency conflicts

### 2. **Core Components Implemented**

#### Sentry Service (`/services/sentryService.ts`)
- **Comprehensive error tracking** with context and user information
- **Performance monitoring** with transaction tracking
- **Racing-specific tracking** for NASCAR and Horse Racing operations
- **ML operation tracking** for model training and predictions
- **Cache performance monitoring** for three-tier caching system
- **Database operation tracking** with latency monitoring

#### Navigation Instrumentation (`/utils/sentryNavigationInstrumentation.ts`)
- **React Navigation v6 integration** for screen transition tracking
- **Performance monitoring** for navigation latency
- **Racing navigation tracking** for NASCAR and Horse Racing flows
- **Betting flow navigation** tracking for user journey analysis
- **Tab navigation monitoring** for bottom tab interactions

#### App Integration (`/App.tsx`)
- **Automatic initialization** based on environment (dev/staging/production)
- **Error boundary integration** with Sentry error capture
- **Navigation state tracking** for screen transitions
- **App lifecycle monitoring** with context setting

## Features Implemented

### 🎯 **Error Monitoring**
- Automatic exception capture with context
- Custom error reporting for racing operations
- ML model error tracking
- Database operation error monitoring
- Navigation error handling

### 📊 **Performance Tracking**
- Screen transition performance monitoring
- API call latency tracking
- Cache hit rate monitoring
- Database query performance
- ML model inference timing

### 🏁 **Racing-Specific Monitoring**
```typescript
sentryService.trackRacingOperation('feature_extraction', 'nascar', {
  raceId: 'race123',
  driverCount: 40,
  featuresGenerated: 25
});
```

### 🧠 **ML Operations Tracking**
```typescript
sentryService.trackMLOperation('prediction', 'xgboost', 0.89, {
  sport: 'horse_racing',
  predictions: 12
});
```

### 🗂️ **Cache Performance Monitoring**
```typescript
sentryService.trackCacheOperation('hit', 'hot', 0.85, {
  key: 'ml_features:nascar:race123'
});
```

### 🚀 **Navigation Tracking**
- Automatic screen transition monitoring
- Tab navigation analytics
- Deep link tracking
- Navigation performance metrics

## Configuration Requirements

### 1. **Get Your Sentry DSN**
1. Go to [https://sentry.io/](https://sentry.io/)
2. Create or select your 'ai-sports-edge' organization
3. Create a 'react-native' project
4. Copy the DSN from project settings

### 2. **Run Setup Script**
```bash
npm run setup:sentry https://your-dsn@o123456.ingest.sentry.io/123456
```

### 3. **Optional: Environment Variables**
For additional security, you can also set:
```bash
SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/123456
SENTRY_AUTH_TOKEN=your_auth_token_here  # For source map uploads
```

### 4. **Verify Setup**
```bash
npm run test:sentry
```

## Environment-Specific Behavior

### **Development**
- Debug mode enabled
- Detailed console logging
- Reduced sample rate (10%)
- Error reporting to console

### **Staging**
- Performance monitoring enabled
- Medium sample rate (50%)
- Full error reporting
- Navigation tracking active

### **Production**
- Full performance monitoring
- Maximum sample rate (100%)
- Comprehensive error reporting
- All integrations enabled

## Navigation Library Compatibility

### **React Navigation v6 Support**
The app uses React Navigation v6 with the following structure:
- **Stack Navigator**: `@react-navigation/stack@^6.2.1`
- **Tab Navigator**: `@react-navigation/bottom-tabs@^6.3.1`
- **Navigation Core**: `@react-navigation/native@^6.0.10`

### **Instrumentation Features**
- Screen transition tracking
- Navigation performance monitoring
- Route parameter logging
- Navigation error handling
- Deep link monitoring

## Usage Examples

### **Basic Error Reporting**
```typescript
try {
  await riskyOperation();
} catch (error) {
  sentryService.captureError(error, {
    screen: 'NascarPredictions',
    action: 'generate_prediction',
    userId: currentUser.id
  });
}
```

### **Performance Monitoring**
```typescript
const transaction = sentryService.startTransaction(
  'ML Prediction Generation',
  'ml_operation',
  'NASCAR race prediction for race123'
);

// Perform operation
await generatePrediction();

transaction.finish();
```

### **Racing Operation Tracking**
```typescript
// Track NASCAR data ingestion
sentryService.trackRacingOperation('data_ingestion', 'nascar', {
  raceId: 'atlanta_2025',
  drivers: 40,
  success: true
});

// Track Horse Racing predictions
sentryService.trackRacingOperation('prediction_generated', 'horse_racing', {
  raceId: 'kentucky_derby_2025',
  runners: 20,
  modelAccuracy: 0.87
});
```

## Integration Points

### **Racing Data Integration (Phase 3)**
- Tracks all racing data operations
- Monitors cache performance for racing features
- Reports ML feature extraction errors
- Monitors database query performance

### **Atomic Architecture**
- Error tracking for atomic components
- Performance monitoring for widget rendering
- Navigation tracking between atomic screens

### **Firebase Integration**
- Firebase auth error tracking
- Firestore operation monitoring
- Cloud function error reporting

## Monitoring Dashboards

### **Key Metrics to Monitor**
1. **Error Rate**: Track error frequency by screen and feature
2. **Performance**: Monitor API response times and navigation speed
3. **Racing Operations**: Track NASCAR and Horse Racing data quality
4. **Cache Efficiency**: Monitor hit rates for three-tier caching
5. **User Journey**: Track navigation patterns and drop-off points

### **Alert Configuration**
- High error rates on critical screens
- Performance degradation in racing predictions
- Cache hit rate below 80% threshold
- ML model accuracy drops below 85%

## Testing and Validation

### **Development Testing**
```typescript
// Test error capture
sentryService.captureError(new Error('Test error'), {
  screen: 'TestScreen',
  action: 'test_action'
});

// Test performance tracking
const transaction = sentryService.startTransaction('Test Operation', 'test');
transaction.finish();
```

### **Navigation Testing**
- Screen transitions are automatically tracked
- Navigation errors are captured and reported
- Performance metrics are collected for all routes

## Production Readiness

### ✅ **Completed**
- Sentry SDK integration with Expo 45 compatibility
- Comprehensive error tracking service
- React Navigation v6 instrumentation
- Racing-specific monitoring
- ML operation tracking
- Performance monitoring setup

### 🔄 **Next Steps**
1. **Configure Sentry DSN**: Add production Sentry DSN to environment
2. **Set up Sentry project**: Create project in Sentry dashboard
3. **Configure alerts**: Set up monitoring alerts and notifications
4. **Test in staging**: Validate error reporting in staging environment

## Security Considerations

### **Data Privacy**
- No sensitive user data logged in error reports
- Racing data anonymized in error context
- User IDs are hashed for privacy
- Financial information excluded from reports

### **Performance Impact**
- Minimal overhead with optimized sampling rates
- Efficient error capture with context filtering
- Asynchronous reporting to avoid blocking UI
- Automatic rate limiting to prevent spam

---

**Sentry integration is now complete and ready for production use once DSN is configured. The system provides comprehensive monitoring for the AI Sports Edge app with special focus on racing data operations and ML performance.**