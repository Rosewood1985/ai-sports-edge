import React from 'react';
import { BetSlipPerformanceWidget } from './widgets/BetSlipPerformanceWidget';
import { EnhancedSubscriptionAnalyticsWidget } from './widgets/EnhancedSubscriptionAnalyticsWidget';
import { SystemHealthMonitoringWidget } from './widgets/SystemHealthMonitoringWidget';
import { ConversionFunnelWidget } from './widgets/ConversionFunnelWidget';
import { ReportingCenter } from './reporting/ReportingCenter';

export interface AdminDashboardProps {
  className?: string;
}

export function AdminDashboard({ className = '' }: AdminDashboardProps) {
  return (
    <div className={`admin-dashboard ${className}`}>
      <header className="dashboard-header mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Monitor system performance and analytics</p>
      </header>

      <div className="dashboard-grid grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Phase 1: Core Monitoring Enhancement */}
        <BetSlipPerformanceWidget />
        <EnhancedSubscriptionAnalyticsWidget />
        <SystemHealthMonitoringWidget />

        {/* Phase 2: Conversion & Fraud Intelligence */}
        <ConversionFunnelWidget />

        {/* Phase 3: Reporting & Automation */}
        <div className="col-span-1 md:col-span-4">
          <ReportingCenter />
        </div>
      </div>
    </div>
  );
}
