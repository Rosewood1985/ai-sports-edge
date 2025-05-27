import React, { useState } from 'react';
import { Tabs } from '../../ui/Tabs';
import { ReportTemplateList } from './ReportTemplateList';
import { ScheduledReportsList } from './ScheduledReportsList';
import { ExportManager } from './ExportManager';
import { ReportBuilder } from './ReportBuilder';
import { ReportHistoryList } from './organisms/ReportHistoryList';
import { Button } from '../../ui/Button';
import { ReportTemplate } from '../../../types/reporting';

/**
 * Main component for the reporting center with enhanced mobile support
 */
export function ReportingCenter() {
  const [activeTab, setActiveTab] = useState('templates');
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);

  const tabs = [
    { id: 'templates', label: 'Templates', icon: '📊' },
    { id: 'builder', label: 'Builder', icon: '🛠️' },
    { id: 'scheduled', label: 'Scheduled', icon: '⏰' },
    { id: 'history', label: 'History', icon: '📁' },
    { id: 'export', label: 'Export', icon: '📤' },
  ];

  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setActiveTab('builder');
  };

  const handleCreateTemplate = () => {
    setEditingTemplate({ id: 'new' } as ReportTemplate);
    setActiveTab('builder');
  };

  const handleBuilderSave = () => {
    setEditingTemplate(null);
    setActiveTab('templates');
  };

  const handleBuilderCancel = () => {
    setEditingTemplate(null);
    setActiveTab('templates');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* Mobile-optimized header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Reporting & Analytics Center
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create, schedule, and manage comprehensive reports
              </p>
            </div>
            <div className="hidden sm:block">
              <Button
                onClick={handleCreateTemplate}
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Create Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized tabs */}
      <div className="overflow-x-auto">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={setActiveTab}
          className="min-w-max"
        />
      </div>

      {/* Content area with responsive padding */}
      <div className="p-3 sm:p-6">
        {/* Mobile create button */}
        {activeTab === 'templates' && (
          <div className="mb-4 sm:hidden">
            <Button
              onClick={handleCreateTemplate}
              variant="primary"
              size="sm"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Create New Report Template
            </Button>
          </div>
        )}

        {activeTab === 'templates' && (
          <ReportTemplateList onEditTemplate={handleEditTemplate} />
        )}
        {activeTab === 'builder' && (
          <ReportBuilder
            initialTemplate={editingTemplate}
            onSave={handleBuilderSave}
            onCancel={handleBuilderCancel}
          />
        )}
        {activeTab === 'scheduled' && <ScheduledReportsList />}
        {activeTab === 'history' && <ReportHistoryList />}
        {activeTab === 'export' && <ExportManager />}
      </div>
    </div>
  );
}
