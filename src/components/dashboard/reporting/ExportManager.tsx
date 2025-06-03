import React, { useState } from 'react';

import { useCrossPlatform } from '../../../hooks/useCrossPlatform';
import { useExportFormats, useExportHistory, useExportData } from '../../../hooks/useReporting';
import { ExportConfig } from '../../../types/export';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Checkbox } from '../../ui/Checkbox';
import { Input } from '../../ui/Input';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { Select } from '../../ui/Select';
import { EnhancedWidget } from '../widgets/EnhancedWidget';

export interface ExportManagerProps {
  className?: string;
}

/**
 * Component for managing exports
 */
export function ExportManager({ className = '' }: ExportManagerProps) {
  const { isMobile } = useCrossPlatform();
  const { formats, isLoading: isLoadingFormats } = useExportFormats();
  const {
    history,
    isLoading: isLoadingHistory,
    downloadExport,
    deleteExport,
    fetchHistory,
  } = useExportHistory();
  const { exportData, isLoading: isExporting, result } = useExportData();

  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [includeCharts, setIncludeCharts] = useState<boolean>(false);

  const availableWidgets = [
    { id: 'bet-slip-performance', name: 'Bet Slip Performance', category: 'Analytics', icon: '🎯' },
    { id: 'conversion-funnel', name: 'Conversion Funnel', category: 'Business', icon: '📈' },
    {
      id: 'subscription-analytics',
      name: 'Subscription Analytics',
      category: 'Business',
      icon: '📊',
    },
    { id: 'system-health', name: 'System Health', category: 'Technical', icon: '⚙️' },
    { id: 'user-engagement', name: 'User Engagement', category: 'Analytics', icon: '👥' },
    { id: 'revenue-breakdown', name: 'Revenue Breakdown', category: 'Business', icon: '💰' },
    { id: 'performance-metrics', name: 'Performance Metrics', category: 'Technical', icon: '⚡' },
    { id: 'fraud-detection', name: 'Fraud Detection', category: 'Security', icon: '🔒' },
  ];

  // Group widgets by category
  const widgetsByCategory = availableWidgets.reduce(
    (acc, widget) => {
      if (!acc[widget.category]) {
        acc[widget.category] = [];
      }
      acc[widget.category].push(widget);
      return acc;
    },
    {} as Record<string, typeof availableWidgets>
  );

  const handleExport = async () => {
    if (!selectedFormat) {
      alert('Please select an export format');
      return;
    }

    if (selectedWidgets.length === 0) {
      alert('Please select at least one widget to export');
      return;
    }

    const config: ExportConfig = {
      format: selectedFormat,
      data: {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      widgets: selectedWidgets,
      options: {
        includeHeaders,
        includeCharts,
        dateFormat: 'YYYY-MM-DD',
        timezone: 'UTC',
      },
    };

    try {
      await exportData(config);
      fetchHistory();
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  const handleDownload = (url: string) => {
    downloadExport(url);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this export?')) {
      try {
        await deleteExport(id);
      } catch (err) {
        console.error('Error deleting export:', err);
      }
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <EnhancedWidget
        title="Create Export"
        subtitle="Export dashboard data in various formats"
        size="large"
        isLoading={isLoadingFormats || isExporting}
        className="mb-6"
      >
        <div className="space-y-6 p-4">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <Select
              value={selectedFormat}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedFormat(e.target.value)
              }
              disabled={isExporting}
              className="w-full"
            >
              <option value="">Select a format</option>
              {formats.map(format => (
                <option key={format.id} value={format.id}>
                  {format.name} ({format.extension})
                </option>
              ))}
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range (Optional)
            </label>
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  disabled={isExporting}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  disabled={isExporting}
                />
              </div>
            </div>
          </div>

          {/* Widgets to Export */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Sources to Export
            </label>
            <div className="space-y-4">
              {Object.entries(widgetsByCategory).map(([category, widgets]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2 flex items-center">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs mr-2">
                      {category}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const categoryWidgetIds = widgets.map(w => w.id);
                        const allSelected = categoryWidgetIds.every(id =>
                          selectedWidgets.includes(id)
                        );
                        if (allSelected) {
                          setSelectedWidgets(
                            selectedWidgets.filter(id => !categoryWidgetIds.includes(id))
                          );
                        } else {
                          setSelectedWidgets([
                            ...new Set([...selectedWidgets, ...categoryWidgetIds]),
                          ]);
                        }
                      }}
                      disabled={isExporting}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {widgets.every(w => selectedWidgets.includes(w.id))
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </h4>
                  <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {widgets.map(widget => (
                      <div
                        key={widget.id}
                        className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded"
                      >
                        <Checkbox
                          id={`widget-${widget.id}`}
                          checked={selectedWidgets.includes(widget.id)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            if (e.target.checked) {
                              setSelectedWidgets([...selectedWidgets, widget.id]);
                            } else {
                              setSelectedWidgets(selectedWidgets.filter(id => id !== widget.id));
                            }
                          }}
                          disabled={isExporting}
                        />
                        <label
                          htmlFor={`widget-${widget.id}`}
                          className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center cursor-pointer"
                        >
                          <span className="mr-2">{widget.icon}</span>
                          {widget.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Options
            </label>
            <div className="space-y-3">
              <div className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded">
                <Checkbox
                  id="include-headers"
                  checked={includeHeaders}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setIncludeHeaders(e.target.checked)
                  }
                  disabled={isExporting}
                />
                <label
                  htmlFor="include-headers"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <div className="font-medium">Include Headers</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Add column headers to exported data
                  </div>
                </label>
              </div>
              <div className="flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded">
                <Checkbox
                  id="include-charts"
                  checked={includeCharts}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setIncludeCharts(e.target.checked)
                  }
                  disabled={isExporting || selectedFormat === 'csv'}
                />
                <label
                  htmlFor="include-charts"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <div className="font-medium">Include Charts</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Embed visual charts (PDF/Excel only)
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between mb-1">
                <span>Format:</span>
                <span className="font-medium">
                  {selectedFormat
                    ? formats.find(f => f.id === selectedFormat)?.name
                    : 'None selected'}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Data Sources:</span>
                <span className="font-medium">{selectedWidgets.length} selected</span>
              </div>
              {(startDate || endDate) && (
                <div className="flex justify-between mb-1">
                  <span>Date Range:</span>
                  <span className="font-medium text-xs">
                    {startDate || '...'} to {endDate || '...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting || !selectedFormat || selectedWidgets.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isExporting ? <LoadingSpinner size="small" className="mr-2" /> : null}
              {isExporting ? 'Generating Export...' : 'Export Data'}
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md">
              <p className="font-medium">Export completed successfully!</p>
              <p className="text-sm mt-1">
                Your file is ready. You can download it from the export history below.
              </p>
            </div>
          )}
        </div>
      </EnhancedWidget>

      <EnhancedWidget
        title="Export History"
        subtitle="Previously exported files"
        size="large"
        isLoading={isLoadingHistory}
        error={null}
        onRefresh={fetchHistory}
      >
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-500 dark:text-gray-400">
              No export history found. Export some data to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {history.map(item => {
              const formatDate = (dateString: string) => {
                return new Date(dateString).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              };

              const formatSize = (bytes: number) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
              };

              const getFormatIcon = (format: string) => {
                switch (format.toLowerCase()) {
                  case 'pdf':
                    return '📄';
                  case 'excel':
                    return '📊';
                  case 'csv':
                    return '📋';
                  case 'json':
                    return '📁';
                  default:
                    return '📄';
                }
              };

              return (
                <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                  <div
                    className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">{getFormatIcon(item.format)}</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.format.toUpperCase()} Export
                        </div>
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Ready
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Created:</span> {formatDate(item.timestamp)}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {formatSize(item.fileSize)}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Expires:</span> {formatDate(item.expiresAt)}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex ${isMobile ? 'w-full' : 'space-x-2'} ${isMobile ? 'space-x-2' : ''}`}
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDownload(item.downloadUrl)}
                        className={isMobile ? 'flex-1' : ''}
                      >
                        Download
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className={`${isMobile ? 'flex-1' : ''} text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300`}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </EnhancedWidget>
    </div>
  );
}
