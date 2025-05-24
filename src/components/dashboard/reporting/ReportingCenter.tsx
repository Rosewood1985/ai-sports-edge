import React, { useState } from 'react';
import { Tabs } from '../../ui/Tabs';
import { ReportTemplateList } from './ReportTemplateList';
import { ScheduledReportsList } from './ScheduledReportsList';
import { ExportManager } from './ExportManager';

/**
 * Main component for the reporting center
 */
export function ReportingCenter() {
  const [activeTab, setActiveTab] = useState('templates');

  const tabs = [
    { id: 'templates', label: 'Report Templates' },
    { id: 'scheduled', label: 'Scheduled Reports' },
    { id: 'history', label: 'Report History' },
    { id: 'export', label: 'Export Data' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="p-6">
        {activeTab === 'templates' && <ReportTemplateList />}
        {activeTab === 'scheduled' && <ScheduledReportsList />}
        {activeTab === 'history' && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Report History</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              View and download previously generated reports
            </p>
            {/* Report history component will be implemented here */}
          </div>
        )}
        {activeTab === 'export' && <ExportManager />}
      </div>
    </div>
  );
}
