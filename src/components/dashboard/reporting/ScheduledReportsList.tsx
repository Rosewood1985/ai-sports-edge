import React, { useState, useEffect } from 'react';

import { useCrossPlatform } from '../../../hooks/useCrossPlatform';
import { AdminDashboardService } from '../../../services/adminDashboardService';
import { ScheduledReport } from '../../../types/reporting';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

/**
 * Component for displaying and managing scheduled reports
 */
export function ScheduledReportsList() {
  const { isMobile } = useCrossPlatform();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'error'>('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await AdminDashboardService.getScheduledReports();
        setReports(data);
        setError(null);
      } catch (err) {
        setError('Failed to load scheduled reports');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      // In a real implementation, this would call an API to update the status
      console.log(`Toggling report ${id} to ${newStatus}`);

      // Update local state
      setReports(
        reports.map(report =>
          report.id === id
            ? { ...report, status: newStatus as 'active' | 'paused' | 'error' }
            : report
        )
      );
    } catch (err) {
      console.error('Failed to update report status', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // In a real implementation, this would call an API to delete the report
      console.log(`Deleting report ${id}`);

      // Update local state
      setReports(reports.filter(report => report.id !== id));
    } catch (err) {
      console.error('Failed to delete report', err);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '▶️';
      case 'paused':
        return '⏸️';
      case 'error':
        return '⚠️';
      default:
        return '⏹️';
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return '📅';
      case 'weekly':
        return '📆';
      case 'monthly':
        return '📊';
      default:
        return '⏰';
    }
  };

  const formatNextRun = (nextRun?: string) => {
    if (!nextRun) return 'Not scheduled';
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter reports based on status
  const filteredReports =
    filter === 'all' ? reports : reports.filter(report => report.status === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No scheduled reports</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Create a new scheduled report to automate your reporting workflow
        </p>
        <Button className="mt-4">Create Scheduled Report</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Scheduled Reports</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automated report generation and delivery
          </p>
        </div>
        <Button
          variant="primary"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          Create New Schedule
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'active', 'paused', 'error'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-1 text-xs">
                ({reports.filter(r => r.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports Grid/List */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-4">
          {filteredReports.map(report => (
            <Card key={report.id} className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {report.name}
                    </h4>
                    {report.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {report.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(report.status)}`}
                  >
                    <span className="mr-1">{getStatusIcon(report.status)}</span>
                    {report.status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Schedule:</span>
                    <div className="flex items-center mt-1">
                      <span className="mr-1">{getFrequencyIcon(report.schedule.frequency)}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {report.schedule.frequency.charAt(0).toUpperCase() +
                          report.schedule.frequency.slice(1)}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 mt-1">
                      {report.schedule.hour || '00'}:
                      {(report.schedule.minute || 0).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
                    <div className="font-medium text-gray-900 dark:text-white mt-1">
                      {formatNextRun(report.nextRun)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Recipients:</span>
                    <div className="font-medium text-gray-900 dark:text-white mt-1">
                      {report.recipients.length} recipient
                      {report.recipients.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Format:</span>
                    <div className="font-medium text-gray-900 dark:text-white mt-1 capitalize">
                      PDF
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleStatus(report.id, report.status)}
                    className="flex-1"
                  >
                    {report.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => console.log('Edit report', report.id)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(report.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredReports.map(report => (
                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.name}
                      </div>
                      {report.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {report.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="mr-2">{getFrequencyIcon(report.schedule.frequency)}</span>
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {report.schedule.frequency.charAt(0).toUpperCase() +
                            report.schedule.frequency.slice(1)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {report.schedule.hour || '00'}:
                          {(report.schedule.minute || 0).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {report.recipients.length} recipient
                      {report.recipients.length !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(report.status)}`}
                    >
                      <span className="mr-1">{getStatusIcon(report.status)}</span>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatNextRun(report.nextRun)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex space-x-2 justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleStatus(report.id, report.status)}
                      >
                        {report.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => console.log('Edit report', report.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {filteredReports.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredReports.length} of {reports.length} scheduled reports
        </div>
      )}
    </div>
  );
}
