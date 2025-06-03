/**
 * UI Components Index
 *
 * This file exports all UI/UX enhancement components for easy access throughout the app.
 */
import React from 'react';

// Animation and Transition Components
export { default as AnimatedTransition } from '../AnimatedTransition';
export { default as PageTransition } from '../PageTransition';

// Theme Components
export { UIThemeProvider, useUITheme, default as UIThemeContext } from '../UIThemeProvider';
export type { UIThemeType } from '../UIThemeProvider';

// Enhanced Analytics Components - Lazy loaded for performance
export const HeatMapChart = React.lazy(() => import('../HeatMapChart'));
export const BubbleChart = React.lazy(() => import('../BubbleChart'));
export const HistoricalTrendsChart = React.lazy(() => import('../HistoricalTrendsChart'));
export { default as DateRangeSelector } from '../DateRangeSelector';

// Enhanced Screens - Lazy loaded for performance
export const EnhancedAnalyticsDashboardScreen = React.lazy(
  () => import('../../screens/EnhancedAnalyticsDashboardScreen')
);
export const UIUXDemoScreen = React.lazy(() => import('../../screens/UIUXDemoScreen'));
