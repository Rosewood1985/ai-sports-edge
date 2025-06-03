import React, { useState, useCallback } from 'react';

import { AdminDashboardService } from '../../../services/adminDashboardService';
import { ReportTemplate, ReportGenerationOptions, ReportResult } from '../../../types/reporting';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { EnhancedWidget } from '../widgets/EnhancedWidget';

export interface ReportGeneratorProps {
  template: ReportTemplate;
  onGenerated?: (result: ReportResult) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Component for generating reports from templates
 */
export function ReportGenerator({
  template,
  onGenerated,
  onCancel,
  className = '',
}: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [options, setOptions] = useState<ReportGenerationOptions>({
    startDate: '',
    endDate: '',
    format: 'pdf',
    includeCharts: true,
    filters: {},
  });

  const handleGenerate = useCallback(async () => {
    if (!template.id) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Mock report generation for now
      const mockResult: ReportResult = {
        id: `report-${Date.now()}`,
        fileUrl: '#',
        format: options.format || 'pdf',
        generatedAt: new Date().toISOString(),
        status: 'success',
      };

      // Simulate generation time
      await new Promise(resolve => setTimeout(resolve, 2000));

      setResult(mockResult);
      onGenerated?.(mockResult);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate report'));
      console.error('Error generating report:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [template.id, options, onGenerated]);

  const handleDownload = () => {
    if (result?.fileUrl) {
      window.open(result.fileUrl, '_blank');
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'analytics':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'performance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'custom':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (result) {
    return (
      <EnhancedWidget
        title="Report Generated Successfully"
        subtitle="Your report has been generated and is ready for download"
        size="large"
        className={className}
      >
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generated at {new Date(result.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {result.format.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Report ID
                </label>
                <p className="text-sm text-gray-900 dark:text-white font-mono">{result.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Format
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {result.format.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleDownload} variant="primary">
                Download Report
              </Button>
              <Button onClick={onCancel} variant="secondary">
                Close
              </Button>
            </div>
          </Card>
        </div>
      </EnhancedWidget>
    );
  }

  return (
    <EnhancedWidget
      title="Generate Report"
      subtitle={`Configure and generate: ${template.name}`}
      size="large"
      isLoading={isGenerating}
      error={error}
      className={className}
    >
      <div className="space-y-6">
        {/* Template Information */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {template.name}
              </h3>
              {template.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
              )}
            </div>
            {template.type && (
              <Badge className={getTypeColor(template.type)}>
                {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Widgets
              </label>
              <div className="flex flex-wrap gap-1">
                {template.widgets?.map(widget => (
                  <Badge
                    key={widget}
                    className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {widget}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filters
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {Array.isArray(template.filters)
                  ? template.filters.length
                  : Object.keys(template.filters || {}).length}{' '}
                filter(s) applied
              </p>
            </div>
          </div>
        </Card>

        {/* Generation Options */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Generation Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={options.startDate}
                onChange={e => setOptions(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={options.endDate}
                onChange={e => setOptions(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="format"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Output Format
              </label>
              <select
                id="format"
                value={options.format}
                onChange={e => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="pdf">PDF Document</option>
                <option value="excel">Excel Spreadsheet</option>
                <option value="csv">CSV File</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCharts"
                checked={options.includeCharts}
                onChange={e => setOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
              />
              <label
                htmlFor="includeCharts"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Include Charts and Visualizations
              </label>
            </div>
          </div>
        </Card>

        {/* Generation Controls */}
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel} variant="secondary" disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            variant="primary"
            isLoading={isGenerating}
            disabled={!template.id}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <LoadingSpinner size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Generating your report...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This may take a few moments depending on the data size
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </EnhancedWidget>
  );
}
