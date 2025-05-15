# Enhanced Analytics Dashboard

This document provides an overview of the enhanced analytics dashboard in the AI Sports Edge application.

## Overview

The enhanced analytics dashboard provides comprehensive analytics data for monitoring app usage and metrics. The implementation includes:

- Real API integration with fallbacks to Firestore and mock data
- Dual-layer caching system for improved performance
- More granular date filtering options
- Internationalization support (English and Spanish)
- Accessibility features

## Architecture

### enhancedAnalyticsService.ts

The `enhancedAnalyticsService.ts` file is the core of the analytics dashboard. It provides:

- Data fetching from multiple sources (API, Firestore, mock data)
- Caching with both in-memory and persistent storage
- Date range calculations for different time periods
- Data transformation and aggregation

### Integration with Existing Analytics

The enhanced analytics dashboard integrates with the existing analytics system, providing a more comprehensive view of app usage and metrics.

## Caching System

The caching system includes both in-memory cache and persistent storage to improve performance:

- In-memory cache for fast access
- AsyncStorage for persistence across app restarts
- Time-based cache invalidation with TTL
- Cache key generation based on time period and custom date range

```typescript
// Example caching implementation
public async getDashboardData(
  timePeriod: AnalyticsTimePeriod = AnalyticsTimePeriod.LAST_30_DAYS,
  customDateRange?: { startDate: number; endDate: number }
): Promise<AnalyticsDashboardData> {
  try {
    // Generate cache key
    const cacheKey = this.generateCacheKey(timePeriod, customDateRange);
    
    // Check cache first
    const cachedData = this.dashboardCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log('Using cached dashboard data');
      return cachedData.data;
    }
    
    // Get date range
    const { startDate, endDate } = this.getDateRangeForTimePeriod(timePeriod, customDateRange);
    
    // Try to fetch from API first
    try {
      const apiData = await this.fetchDashboardDataFromAPI(startDate, endDate);
      
      // Cache the data
      this.dashboardCache.set(cacheKey, {
        data: apiData,
        timestamp: Date.now()
      });
      
      // Also store in AsyncStorage for persistence
      await this.saveDashboardCache();
      
      return apiData;
    } catch (apiError) {
      console.error('API fetch failed, falling back to Firestore:', apiError);
      
      // Fallback to Firestore
      const firestoreData = await this.fetchFromFirestore(startDate, endDate);
      
      // Cache the data
      this.dashboardCache.set(cacheKey, {
        data: firestoreData,
        timestamp: Date.now()
      });
      
      // Also store in AsyncStorage for persistence
      await this.saveDashboardCache();
      
      return firestoreData;
    }
  } catch (error) {
    console.error('Error getting analytics dashboard data:', error);
    
    // If all else fails, return mock data
    return this.generateMockDashboardData(timePeriod, customDateRange);
  }
}
```

## Date Filtering

The enhanced analytics dashboard includes more granular date filtering options:

- Today, Yesterday
- Last 7/30/90 Days
- This Month, Last Month
- Last 3 Months, Last 6 Months
- Year to Date, Last Year
- Custom Date Range

```typescript
// Example date range calculation
private getDateRangeForTimePeriod(
  timePeriod: AnalyticsTimePeriod,
  customDateRange?: { startDate: number; endDate: number }
): { startDate: number; endDate: number } {
  const now = new Date();
  const endDate = now.getTime();
  let startDate: number;
  
  switch (timePeriod) {
    case AnalyticsTimePeriod.TODAY:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      break;
    case AnalyticsTimePeriod.YESTERDAY:
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime();
      break;
    case AnalyticsTimePeriod.LAST_7_DAYS:
      const last7Days = new Date(now);
      last7Days.setDate(last7Days.getDate() - 7);
      startDate = last7Days.getTime();
      break;
    case AnalyticsTimePeriod.LAST_30_DAYS:
      const last30Days = new Date(now);
      last30Days.setDate(last30Days.getDate() - 30);
      startDate = last30Days.getTime();
      break;
    case AnalyticsTimePeriod.LAST_90_DAYS:
      const last90Days = new Date(now);
      last90Days.setDate(last90Days.getDate() - 90);
      startDate = last90Days.getTime();
      break;
    case AnalyticsTimePeriod.THIS_MONTH:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      break;
    case AnalyticsTimePeriod.LAST_MONTH:
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = lastMonth.getTime();
      break;
    case AnalyticsTimePeriod.LAST_3_MONTHS:
      const last3Months = new Date(now);
      last3Months.setMonth(last3Months.getMonth() - 3);
      startDate = last3Months.getTime();
      break;
    case AnalyticsTimePeriod.LAST_6_MONTHS:
      const last6Months = new Date(now);
      last6Months.setMonth(last6Months.getMonth() - 6);
      startDate = last6Months.getTime();
      break;
    case AnalyticsTimePeriod.YEAR_TO_DATE:
      startDate = new Date(now.getFullYear(), 0, 1).getTime();
      break;
    case AnalyticsTimePeriod.LAST_YEAR:
      const lastYear = new Date(now);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      startDate = lastYear.getTime();
      break;
    case AnalyticsTimePeriod.CUSTOM:
      if (!customDateRange) {
        throw new Error('Custom date range is required for CUSTOM time period');
      }
      return customDateRange;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).getTime();
  }
  
  return { startDate, endDate };
}
```

## API Integration

The enhanced analytics dashboard integrates with a real API for fetching analytics data:

- API endpoints for different types of data
- Error handling with fallbacks to Firestore and mock data
- Data transformation to match the application's data structure

```typescript
// Example API integration
private async fetchDashboardDataFromAPI(
  startDate: number,
  endDate: number
): Promise<AnalyticsDashboardData> {
  // Construct API URL with query parameters
  const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.DASHBOARD}`);
  url.searchParams.append('startDate', startDate.toString());
  url.searchParams.append('endDate', endDate.toString());
  
  // Make API request
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY' // In a real app, use a proper auth token
    }
  });
  
  // Check if response is ok
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  // Parse response
  const data = await response.json();
  
  // Transform API response to match our data structure
  return {
    timePeriod: data.timePeriod,
    customDateRange: data.customDateRange,
    userEngagement: data.userEngagement,
    betting: data.betting,
    revenue: data.revenue,
    topFeatures: data.topFeatures,
    topScreens: data.topScreens,
    recentActivities: data.recentActivities,
    userGrowth: data.userGrowth,
    revenueGrowth: data.revenueGrowth,
    bettingGrowth: data.bettingGrowth
  };
}
```

## User Interface

The enhanced analytics dashboard includes a comprehensive user interface for viewing and interacting with analytics data:

- DateRangeSelector component for selecting time periods
- Interactive charts for visualizing data
- Tabs for different types of analytics data
- Responsive design for different screen sizes

```typescript
// Example DateRangeSelector component
const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod,
  onSelectCustomRange
}) => {
  // Time period options
  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'Last 30 Days' },
    { key: 'quarter', label: 'Last 90 Days' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'last_quarter', label: 'Last 3 Months' },
    { key: 'half_year', label: 'Last 6 Months' },
    { key: 'ytd', label: 'Year to Date' },
    { key: 'year', label: 'Last Year' },
  ];
  
  // Render period options
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.selectedPeriod
            ]}
            onPress={() => onSelectPeriod(period.key)}
          >
            <Text style={[
              styles.periodText,
              selectedPeriod === period.key && styles.selectedPeriodText
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'custom' && styles.selectedPeriod
          ]}
          onPress={() => {
            setShowCalendar(true);
            onSelectPeriod('custom');
          }}
        >
          <Text style={[
            styles.periodText,
            selectedPeriod === 'custom' && styles.selectedPeriodText
          ]}>
            Custom
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Custom date range calendar */}
      {showCalendar && (
        <View style={styles.calendarContainer}>
          <Calendar
            markingType={'period'}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              selectedDayBackgroundColor: colors.primary,
              todayTextColor: colors.primary,
              arrowColor: colors.primary,
            }}
          />
          <View style={styles.calendarActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setShowCalendar(false);
                setStartDate(null);
                setEndDate(null);
                setMarkedDates({});
                onSelectPeriod('month'); // Default to month
              }}
            />
            <Button
              title="Apply"
              disabled={!startDate || !endDate}
              onPress={() => {
                setShowCalendar(false);
                if (startDate && endDate) {
                  onSelectCustomRange(startDate.getTime(), endDate.getTime());
                }
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};
```

## Internationalization

The enhanced analytics dashboard includes support for multiple languages:

- Translation files for English and Spanish
- Language detection and switching
- Localized date and number formatting

## Accessibility

The enhanced analytics dashboard includes accessibility features:

- ARIA attributes for screen readers
- Keyboard navigation support
- High contrast mode
- Text size adaptation

## Performance Optimizations

The enhanced analytics dashboard includes performance optimizations:

- Memoization for expensive calculations
- Lazy loading for visualization components
- Error handling with caching for improved reliability

## Future Enhancements

Planned enhancements for the analytics dashboard include:

- More visualization types
- Export functionality for reports
- Advanced filtering and segmentation
- Real-time updates with WebSockets