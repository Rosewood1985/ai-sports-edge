/**
 * Training Jobs Widget
 * Phase 4.1: Foundation Widget
 * Displays ML model training jobs and their status
 */

import React from 'react';
import { TrainingJob } from '../../../../types/aiml';

interface TrainingJobsWidgetProps {
  jobs: TrainingJob[];
  className?: string;
}

export function TrainingJobsWidget({ jobs, className = '' }: TrainingJobsWidgetProps) {
  const getStatusColor = (status: TrainingJob['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'queued':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getStatusIcon = (status: TrainingJob['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '🔄';
      case 'queued':
        return '⏳';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⏹️';
      default:
        return '❓';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const runningJobs = jobs.filter(job => job.status === 'running');
  const queuedJobs = jobs.filter(job => job.status === 'queued');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Training Jobs
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              ML model training pipeline status
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {runningJobs.length > 0 && (
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            )}
            <div className="text-2xl">🔄</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {runningJobs.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {queuedJobs.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Queued</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedJobs.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {failedJobs.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Recent Jobs
          </h4>

          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔄</div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Training Jobs
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Training jobs will appear here when models are being trained
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className={`p-4 border rounded-lg ${
                    job.status === 'running'
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                      : job.status === 'failed'
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-xl">{getStatusIcon(job.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            Job {job.id}
                          </h5>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              job.status
                            )}`}
                          >
                            {job.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Model</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {job.modelId}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Duration</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatDuration(job.duration)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Started</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatTimestamp(job.startedAt)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Completed</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatTimestamp(job.completedAt)}
                            </div>
                          </div>
                        </div>

                        {/* Metrics for completed jobs */}
                        {job.status === 'completed' && job.metrics && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Performance Metrics:
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                  {(job.metrics.accuracy * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Precision:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                  {(job.metrics.precision * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Recall:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                  {(job.metrics.recall * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">F1:</span>
                                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                  {(job.metrics.f1Score * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Error for failed jobs */}
                        {job.status === 'failed' && job.error && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-red-600 dark:text-red-400">
                              Error: {job.error}
                            </div>
                          </div>
                        )}

                        {/* Recent logs */}
                        {job.logs && job.logs.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Recent Logs:
                            </div>
                            <div className="space-y-1">
                              {job.logs.slice(-3).map((log, index) => (
                                <div
                                  key={index}
                                  className="text-xs text-gray-700 dark:text-gray-300 font-mono"
                                >
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {jobs.length > 5 && (
                <div className="mt-4 text-center">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                    View all {jobs.length} jobs
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrainingJobsWidget;