import React, { useState, useEffect } from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { IconButton } from '../../ui/IconButton';
import { AdminDashboardService } from '../../../services/adminDashboardService';
import { ScheduledReport } from '../../../types/reporting';

/**
 * Component for displaying and managing scheduled reports
 */
export function ScheduledReportsList() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        return 'success';
      case 'paused':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Scheduled Reports</h3>
        <Button>Create New</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Schedule
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Recipients
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Next Run
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {reports.map(report => (
              <tr key={report.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {report.name}
                  </div>
                  {report.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {report.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {report.schedule.frequency.charAt(0).toUpperCase() +
                      report.schedule.frequency.slice(1)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {report.schedule.hour || '00'}:
                    {(report.schedule.minute || 0).toString().padStart(2, '0')}
                    {report.schedule.frequency === 'weekly' &&
                    report.schedule.dayOfWeek !== undefined
                      ? `, Day ${report.schedule.dayOfWeek}`
                      : ''}
                    {report.schedule.frequency === 'monthly' &&
                    report.schedule.dayOfMonth !== undefined
                      ? `, Day ${report.schedule.dayOfMonth}`
                      : ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color={getStatusBadgeColor(report.status)}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {report.nextRun || 'Not scheduled'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2 justify-end">
                    <IconButton
                      icon={report.status === 'active' ? 'pause' : 'play'}
                      variant="ghost"
                      aria-label={report.status === 'active' ? 'Pause report' : 'Activate report'}
                      onClick={() => handleToggleStatus(report.id, report.status)}
                    />
                    <IconButton
                      icon="edit"
                      variant="ghost"
                      aria-label="Edit report"
                      onClick={() => console.log('Edit report', report.id)}
                    />
                    <IconButton
                      icon="trash"
                      variant="ghost"
                      color="error"
                      aria-label="Delete report"
                      onClick={() => handleDelete(report.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
