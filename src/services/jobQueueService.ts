/**
 * Job Queue Service
 *
 * This service manages the asynchronous job queue for report generation and export.
 * It provides methods for creating, updating, and retrieving jobs, as well as
 * tracking job progress and handling job completion.
 */

import { v4 as uuidv4 } from 'uuid';

import {
  Job,
  JobType,
  JobStatus,
  JobPriority,
  JobUnion,
  JobCreationParams,
  JobUpdateParams,
  JobFilterParams,
  ReportGenerationJob,
  ReportExportJob,
  ReportPreviewJob,
} from '../types/jobs';

// Mock database for development
let jobsDb: JobUnion[] = [];

/**
 * Job Queue Service class
 */
export class JobQueueService {
  /**
   * Create a new job
   *
   * @param type The type of job to create
   * @param params The parameters for the job
   * @param priority The priority of the job (default: MEDIUM)
   * @param createdBy The ID of the user who created the job
   * @returns The created job
   */
  static async createJob<T extends JobType>(
    type: T,
    params: JobCreationParams<T>,
    priority: JobPriority = JobPriority.MEDIUM,
    createdBy: string
  ): Promise<JobUnion> {
    const now = new Date().toISOString();

    // Create base job
    const baseJob: Omit<Job, 'id'> = {
      type,
      status: JobStatus.PENDING,
      priority,
      progress: 0,
      createdAt: now,
      createdBy,
    };

    // Create specific job based on type
    let job: JobUnion;

    switch (type) {
      case JobType.REPORT_GENERATE:
        job = {
          ...baseJob,
          id: uuidv4(),
          type: JobType.REPORT_GENERATE,
          params: params as ReportGenerationJob['params'],
        } as ReportGenerationJob;
        break;

      case JobType.REPORT_EXPORT:
        job = {
          ...baseJob,
          id: uuidv4(),
          type: JobType.REPORT_EXPORT,
          params: params as ReportExportJob['params'],
        } as ReportExportJob;
        break;

      case JobType.REPORT_PREVIEW:
        job = {
          ...baseJob,
          id: uuidv4(),
          type: JobType.REPORT_PREVIEW,
          params: params as ReportPreviewJob['params'],
        } as ReportPreviewJob;
        break;

      default:
        throw new Error(`Invalid job type: ${type}`);
    }

    // Add job to database
    jobsDb.push(job);

    // Start processing the job
    this.processJob(job.id);

    return job;
  }

  /**
   * Get a job by ID
   *
   * @param id The ID of the job to retrieve
   * @returns The job, or null if not found
   */
  static async getJob(id: string): Promise<JobUnion | null> {
    const job = jobsDb.find(job => job.id === id);
    return job || null;
  }

  /**
   * Get all jobs matching the filter criteria
   *
   * @param filters The filter criteria
   * @returns An array of jobs matching the criteria
   */
  static async getJobs(filters: JobFilterParams = {}): Promise<JobUnion[]> {
    let filteredJobs = [...jobsDb];

    if (filters.type) {
      filteredJobs = filteredJobs.filter(job => job.type === filters.type);
    }

    if (filters.status) {
      filteredJobs = filteredJobs.filter(job => job.status === filters.status);
    }

    if (filters.createdBy) {
      filteredJobs = filteredJobs.filter(job => job.createdBy === filters.createdBy);
    }

    if (filters.createdAfter) {
      const createdAfter = new Date(filters.createdAfter);
      filteredJobs = filteredJobs.filter(job => new Date(job.createdAt) >= createdAfter);
    }

    if (filters.createdBefore) {
      const createdBefore = new Date(filters.createdBefore);
      filteredJobs = filteredJobs.filter(job => new Date(job.createdAt) <= createdBefore);
    }

    return filteredJobs;
  }

  /**
   * Update a job
   *
   * @param id The ID of the job to update
   * @param updates The updates to apply to the job
   * @returns The updated job, or null if not found
   */
  static async updateJob(id: string, updates: JobUpdateParams): Promise<JobUnion | null> {
    const jobIndex = jobsDb.findIndex(job => job.id === id);

    if (jobIndex === -1) {
      return null;
    }

    const job = jobsDb[jobIndex];

    // Apply updates
    const updatedJob = {
      ...job,
      ...updates,
    };

    // Update job in database
    jobsDb[jobIndex] = updatedJob;

    return updatedJob;
  }

  /**
   * Cancel a job
   *
   * @param id The ID of the job to cancel
   * @returns True if the job was cancelled, false if not found or already completed
   */
  static async cancelJob(id: string): Promise<boolean> {
    const job = await this.getJob(id);

    if (!job) {
      return false;
    }

    // Can't cancel completed or failed jobs
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      return false;
    }

    // Update job status
    await this.updateJob(id, {
      status: JobStatus.CANCELLED,
      completedAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Process a job
   *
   * This is a mock implementation that simulates asynchronous job processing.
   * In a real implementation, this would delegate to a worker process or
   * background task.
   *
   * @param id The ID of the job to process
   */
  private static async processJob(id: string): Promise<void> {
    const job = await this.getJob(id);

    if (!job || job.status !== JobStatus.PENDING) {
      return;
    }

    // Update job status to processing
    await this.updateJob(id, {
      status: JobStatus.PROCESSING,
      startedAt: new Date().toISOString(),
    });

    // Simulate processing time based on job type
    let processingTime = 0;

    switch (job.type) {
      case JobType.REPORT_GENERATE:
        processingTime = 5000; // 5 seconds
        break;

      case JobType.REPORT_EXPORT:
        processingTime = 3000; // 3 seconds
        break;

      case JobType.REPORT_PREVIEW:
        processingTime = 2000; // 2 seconds
        break;
    }

    // Simulate progress updates
    const progressInterval = processingTime / 10;
    let progress = 0;

    const progressTimer = setInterval(async () => {
      progress += 10;

      if (progress <= 100) {
        await this.updateJob(id, { progress });
      }

      if (progress >= 100) {
        clearInterval(progressTimer);
      }
    }, progressInterval);

    // Simulate job completion
    setTimeout(async () => {
      const currentJob = await this.getJob(id);

      // Job might have been cancelled
      if (!currentJob || currentJob.status === JobStatus.CANCELLED) {
        clearInterval(progressTimer);
        return;
      }

      // Generate mock result based on job type
      let result: any;

      switch (job.type) {
        case JobType.REPORT_GENERATE:
          result = {
            reportId: uuidv4(),
            url: '#',
            format: (job as ReportGenerationJob).params.format || 'pdf',
            fileSize: Math.floor(Math.random() * 1000000) + 500000, // Random file size between 500KB and 1.5MB
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          };
          break;

        case JobType.REPORT_EXPORT:
          result = {
            exportId: uuidv4(),
            url: '#',
            format: (job as ReportExportJob).params.format,
            fileSize: Math.floor(Math.random() * 500000) + 100000, // Random file size between 100KB and 600KB
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          };
          break;

        case JobType.REPORT_PREVIEW:
          result = {
            previewId: uuidv4(),
            url: '#',
            format: (job as ReportPreviewJob).params.format || 'pdf',
          };
          break;
      }

      // Update job with result
      await this.updateJob(id, {
        status: JobStatus.COMPLETED,
        progress: 100,
        completedAt: new Date().toISOString(),
        result,
      });

      // In a real implementation, we would notify subscribers about job completion
      console.log(`Job ${id} completed`);
    }, processingTime);
  }

  /**
   * Clear all jobs (for testing purposes)
   */
  static async clearJobs(): Promise<void> {
    jobsDb = [];
  }
}

export default JobQueueService;
