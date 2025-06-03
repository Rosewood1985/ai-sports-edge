/**
 * useJobQueue Hook
 *
 * This hook provides a clean interface for components to interact with the JobQueueService.
 * It allows for creating, tracking, and managing asynchronous jobs.
 */

import { useState, useEffect, useCallback } from 'react';

import JobQueueService from '../services/jobQueueService';
import {
  Job,
  JobType,
  JobStatus,
  JobPriority,
  JobUnion,
  JobCreationParams,
  JobFilterParams,
} from '../types/jobs';

/**
 * Job tracking hook result
 */
interface UseJobTrackingResult {
  job: JobUnion | null;
  isLoading: boolean;
  error: Error | null;
  progress: number;
  isComplete: boolean;
  isFailed: boolean;
  isCancelled: boolean;
  cancelJob: () => Promise<boolean>;
  refreshJob: () => Promise<void>;
}

/**
 * Job queue hook result
 */
interface UseJobQueueResult {
  jobs: JobUnion[];
  isLoading: boolean;
  error: Error | null;
  createJob: <T extends JobType>(
    type: T,
    params: JobCreationParams<T>,
    priority?: JobPriority
  ) => Promise<JobUnion>;
  cancelJob: (id: string) => Promise<boolean>;
  refreshJobs: () => Promise<void>;
  trackJob: (id: string) => UseJobTrackingResult;
}

/**
 * Hook for tracking a specific job
 *
 * @param jobId The ID of the job to track
 * @returns Job tracking result
 */
export function useJobTracking(jobId: string): UseJobTrackingResult {
  const [job, setJob] = useState<JobUnion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshJob = useCallback(async () => {
    try {
      setIsLoading(true);
      const updatedJob = await JobQueueService.getJob(jobId);
      setJob(updatedJob);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const cancelJob = useCallback(async () => {
    try {
      return await JobQueueService.cancelJob(jobId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      refreshJob();
    }
  }, [jobId, refreshJob]);

  // Initial fetch
  useEffect(() => {
    refreshJob();
  }, [refreshJob]);

  // Poll for updates if job is in progress
  useEffect(() => {
    if (!job || job.status !== JobStatus.PROCESSING) {
      return;
    }

    const intervalId = setInterval(() => {
      refreshJob();
    }, 1000); // Poll every second

    return () => clearInterval(intervalId);
  }, [job, refreshJob]);

  return {
    job,
    isLoading,
    error,
    progress: job?.progress || 0,
    isComplete: job?.status === JobStatus.COMPLETED,
    isFailed: job?.status === JobStatus.FAILED,
    isCancelled: job?.status === JobStatus.CANCELLED,
    cancelJob,
    refreshJob,
  };
}

/**
 * Hook for interacting with the job queue
 *
 * @param filters Optional filters to apply to the job list
 * @param userId The ID of the current user
 * @returns Job queue result
 */
export function useJobQueue(
  filters: JobFilterParams = {},
  userId: string = 'current-user' // In a real app, this would come from auth context
): UseJobQueueResult {
  const [jobs, setJobs] = useState<JobUnion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [trackedJobs, setTrackedJobs] = useState<Record<string, UseJobTrackingResult>>({});

  const refreshJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedJobs = await JobQueueService.getJobs(filters);
      setJobs(fetchedJobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const createJob = useCallback(
    async <T extends JobType>(
      type: T,
      params: JobCreationParams<T>,
      priority: JobPriority = JobPriority.MEDIUM
    ): Promise<JobUnion> => {
      try {
        const job = await JobQueueService.createJob(type, params, priority, userId);
        refreshJobs();
        return job;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [userId, refreshJobs]
  );

  const cancelJob = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const result = await JobQueueService.cancelJob(id);
        refreshJobs();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [refreshJobs]
  );

  const trackJob = useCallback(
    (id: string): UseJobTrackingResult => {
      if (!trackedJobs[id]) {
        const trackingResult = useJobTracking(id);
        setTrackedJobs(prev => ({
          ...prev,
          [id]: trackingResult,
        }));
      }

      return trackedJobs[id];
    },
    [trackedJobs]
  );

  // Initial fetch
  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  // Poll for updates if there are processing jobs
  useEffect(() => {
    const hasProcessingJobs = jobs.some(job => job.status === JobStatus.PROCESSING);

    if (!hasProcessingJobs) {
      return;
    }

    const intervalId = setInterval(() => {
      refreshJobs();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [jobs, refreshJobs]);

  return {
    jobs,
    isLoading,
    error,
    createJob,
    cancelJob,
    refreshJobs,
    trackJob,
  };
}

/**
 * Hook for creating a report generation job
 *
 * @param userId The ID of the current user
 * @returns Functions for creating and tracking report generation jobs
 */
export function useReportGeneration(userId: string = 'current-user') {
  const { createJob } = useJobQueue({}, userId);

  const generateReport = useCallback(
    async (
      templateId: string,
      filters?: any[],
      format: string = 'pdf',
      options?: Record<string, any>
    ) => {
      return createJob(
        JobType.REPORT_GENERATE,
        {
          templateId,
          filters,
          format,
          options,
        },
        JobPriority.MEDIUM
      );
    },
    [createJob]
  );

  const previewReport = useCallback(
    async (
      template: {
        name: string;
        description?: string;
        type?: string;
        widgets: string[];
        filters?: any[];
      },
      format: string = 'pdf'
    ) => {
      return createJob(
        JobType.REPORT_PREVIEW,
        {
          template,
          format,
        },
        JobPriority.HIGH
      );
    },
    [createJob]
  );

  const exportData = useCallback(
    async (
      widgets: string[],
      filters?: any[],
      format: string = 'csv',
      options?: Record<string, any>
    ) => {
      return createJob(
        JobType.REPORT_EXPORT,
        {
          widgets,
          filters,
          format,
          options,
        },
        JobPriority.LOW
      );
    },
    [createJob]
  );

  return {
    generateReport,
    previewReport,
    exportData,
  };
}

export default useJobQueue;
