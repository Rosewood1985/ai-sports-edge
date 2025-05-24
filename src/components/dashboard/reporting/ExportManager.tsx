import React, { useState } from 'react';
import { useExportFormats, useExportHistory, useExportData } from '../../../hooks/useReporting';
import { ExportConfig } from '../../../types/export';
import { EnhancedWidget } from '../widgets/EnhancedWidget';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { Card } from '../../ui/Card';
import { IconButton } from '../../ui/IconButton';
import { formatDateTime, formatFileSize } from '../../../utils/dateUtils';
import { Checkbox } from '../../ui/Checkbox';

export interface ExportManagerProps {
  className?: string;
}

/**
 * Component for managing exports
 */
export function ExportManager({ className = '' }: ExportManagerProps) {
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

  const availableWidgets = [
    { id: 'bet-slip-performance', name: 'Bet Slip Performance' },
    { id: 'conversion-funnel', name: 'Conversion Funnel' },
    { id: 'subscription-analytics', name: 'Subscription Analytics' },
    { id: 'system-health', name: 'System Health' },
  ];

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
      data: {},
      widgets: selectedWidgets,
      options: {
        includeHeaders,
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
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Widgets to Export
            </label>
            <div className="space-y-2">
              {availableWidgets.map(widget => (
                <div key={widget.id} className="flex items-center">
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
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {widget.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Options
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
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
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Include Headers
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting || !selectedFormat || selectedWidgets.length === 0}
              className="w-full"
            >
              {isExporting ? <LoadingSpinner size="small" className="mr-2" /> : null}
              {isExporting ? 'Exporting...' : 'Export Data'}
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
            {history.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.format.toUpperCase()} Export
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDateTime(item.timestamp)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Size: {formatFileSize(item.fileSize)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Expires: {formatDateTime(item.expiresAt)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <IconButton
                      icon="download"
                      variant="ghost"
                      color="primary"
                      onClick={() => handleDownload(item.downloadUrl)}
                      aria-label="Download export"
                    />
                    <IconButton
                      icon="trash"
                      variant="ghost"
                      color="error"
                      onClick={() => handleDelete(item.id)}
                      aria-label="Delete export"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </EnhancedWidget>
    </div>
  );
}
