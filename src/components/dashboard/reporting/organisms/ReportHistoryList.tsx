import React, { useState, useCallback } from 'react';
import { ReportHistory, ReportFormat, ReportType, ReportHistoryFilters } from '../../../../types/reporting';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Select } from '../../../ui/Select';
import { Card } from '../../../ui/Card';
import { useCrossPlatform } from '../../../../hooks/useCrossPlatform';

export interface ReportHistoryListProps {
  className?: string;
}

/**
 * Component for displaying a list of report history items with filtering and pagination
 */
export function ReportHistoryList({ className = '' }: ReportHistoryListProps) {
  const { isMobile } = useCrossPlatform();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ReportHistoryFilters>({
    startDate: '',
    endDate: '',
    status: 'success',
    reportType: ReportType.STANDARD,
  });

  // Mock data for development
  const mockHistory: ReportHistory[] = [
    {
      id: 'hist-001',
      templateId: 'template-001',
      templateName: 'Monthly Performance Report',
      name: 'May 2025 Performance Report',
      runAt: '2025-05-23T10:30:00Z',
      runBy: 'admin@aisportsedge.app',
      status: 'success',
      fileUrl: '#',
      format: 'pdf',
      reportType: ReportType.ANALYTICS,
    },
    {
      id: 'hist-002',
      templateId: 'template-002',
      templateName: 'Weekly Subscription Summary',
      name: 'Week 21 Subscription Summary',
      runAt: '2025-05-22T08:30:00Z',
      runBy: 'admin@aisportsedge.app',
      status: 'success',
      fileUrl: '#',
      format: 'excel',
      reportType: ReportType.STANDARD,
    },
    {
      id: 'hist-003',
      templateId: 'template-003',
      templateName: 'System Health Check',
      name: 'Daily Health Check - May 22',
      runAt: '2025-05-22T07:00:00Z',
      runBy: 'system@aisportsedge.app',
      status: 'failed',
      error: 'Database connection timeout',
      format: 'pdf',
      reportType: ReportType.PERFORMANCE,
    },
    {
      id: 'hist-004',
      templateId: 'template-001',
      templateName: 'Monthly Performance Report',
      name: 'April 2025 Performance Report',
      runAt: '2025-05-01T10:30:00Z',
      runBy: 'admin@aisportsedge.app',
      status: 'success',
      fileUrl: '#',
      format: 'pdf',
      reportType: ReportType.ANALYTICS,
    },
  ];

  // Filter history based on search term and filters
  const filteredHistory = mockHistory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.templateName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesReportType = !filters.reportType || item.reportType === filters.reportType;

    const matchesDateRange =
      (!filters.startDate || new Date(item.runAt) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(item.runAt) <= new Date(filters.endDate));

    return matchesSearch && matchesStatus && matchesReportType && matchesDateRange;
  });

  const handleDownload = useCallback((id: string) => {
    const item = mockHistory.find(h => h.id === id);
    if (item?.fileUrl) {
      window.open(item.fileUrl, '_blank');
    }
  }, []);

  const handleView = useCallback((id: string) => {
    console.log('View report:', id);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getFormatIcon = (format: ReportFormat) => {
    switch (format) {
      case 'pdf':
        return '📄';
      case 'excel':
        return '📊';
      case 'csv':
        return '📋';
      default:
        return '📄';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Report History
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and download previously generated reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="whitespace-nowrap"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Filter Reports
          </h4>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4'}`}>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select
                value={filters.status || 'all'}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  status: e.target.value === 'all' ? undefined : e.target.value as 'success' | 'failed'
                }))}
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Type
              </label>
              <Select
                value={filters.reportType || 'all'}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  reportType: e.target.value === 'all' ? undefined : e.target.value as ReportType
                }))}
              >
                <option value="all">All Types</option>
                <option value="standard">Standard</option>
                <option value="analytics">Analytics</option>
                <option value="performance">Performance</option>
                <option value="custom">Custom</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters({
                startDate: '',
                endDate: '',
                status: undefined,
                reportType: undefined,
              })}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {filteredHistory.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
            <p className="text-sm">
              {searchTerm || Object.values(filters).some(v => v)
                ? 'Try adjusting your search or filters.'
                : 'No reports have been generated yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={`grid gap-4 ${
          isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {filteredHistory.map(item => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.templateName}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getStatusBgColor(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Generated:</span>
                  <span>{formatDate(item.runAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Format:</span>
                  <span className="flex items-center">
                    <span className="mr-1">{getFormatIcon(item.format)}</span>
                    {item.format.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Type:</span>
                  <span className="capitalize">{item.reportType}</span>
                </div>
                {item.runBy && (
                  <div className="flex items-center justify-between">
                    <span>Run by:</span>
                    <span className="truncate max-w-[120px]">{item.runBy}</span>
                  </div>
                )}
              </div>

              {item.error && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                  <strong>Error:</strong> {item.error}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {item.status === 'success' && item.fileUrl && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownload(item.id)}
                    className="flex-1"
                  >
                    Download
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleView(item.id)}
                  className="flex-1"
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="flex justify-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredHistory.length} of {mockHistory.length} reports
        </div>
      </div>
    </div>
  );
}