# Unified Admin Dashboard: Reporting System Documentation

## Overview

The Reporting System is a comprehensive solution for creating, scheduling, and managing reports in the Unified Admin Dashboard. It allows administrators to generate reports based on customizable templates, schedule recurring reports, and view report history.

## Architecture

### Atomic Design Pattern

The Reporting System follows the atomic design pattern, organizing components into atoms, molecules, organisms, templates, and pages:

- **Atoms**: Basic UI components like badges, chips, and form controls
- **Molecules**: Composite components that combine atoms into functional units
- **Organisms**: Complex components that combine molecules into complete features
- **Templates**: Page layouts that arrange organisms
- **Pages**: Complete pages with content

### Asynchronous Processing Architecture

The Reporting System uses an asynchronous processing architecture to handle potentially long-running tasks:

- **Job Queue**: A queue for managing asynchronous jobs
- **Job Status Tracking**: Real-time tracking of job progress
- **Priority-based Scheduling**: Jobs can be prioritized based on importance
- **Error Handling**: Comprehensive error handling for asynchronous operations

### TypeScript Integration

The Reporting System uses TypeScript for type safety and better developer experience:

- **Interfaces**: Comprehensive interfaces for all data structures
- **Enums**: Enums for status, frequency, and format
- **Type Guards**: Type guards for runtime type checking
- **Generic Types**: Generic types for reusable components

## Component Structure

### Atoms

- **ScheduleStatusBadge**: Displays the status of a scheduled report (active, paused, error)
- **FrequencyBadge**: Displays the frequency of a scheduled report (daily, weekly, monthly)
- **RecipientChip**: Displays a recipient email or user as a chip
- **HistoryStatusBadge**: Displays the status of a report history item (success, failed)
- **FormatBadge**: Displays the format of a report (PDF, CSV, Excel)
- **DateRangePicker**: Provides a date range picker for filtering reports
- **TemplateStatusBadge**: Displays the status/type of a report template
- **WidgetChip**: Displays a widget as a chip

### Molecules

- **ScheduledReportCard**: Displays a scheduled report as a card
- **ReportHistoryCard**: Displays a report history item as a card
- **TemplateCard**: Displays a report template as a card
- **TemplateActions**: Provides a menu of actions for a template
- **JobProgressIndicator**: Displays the progress of an asynchronous job

### Organisms

- **ScheduledReportsList**: Displays a list of scheduled reports with filtering and pagination
- **ReportHistoryList**: Displays a list of report history items with filtering and pagination
- **TemplateList**: Displays a list of report templates
- **ReportTemplateForm**: Provides a form for creating and editing report templates

## Data Models

### Report Template

```typescript
interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  templateType: ReportTemplateType;
  widgets: ReportWidget[];
  filters: ReportFilter[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublic: boolean;
}

enum ReportTemplateType {
  STANDARD = 'standard',
  ANALYTICS = 'analytics',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom',
}

interface ReportWidget {
  id: string;
  type: WidgetType;
  title: string;
  config: any;
}

enum WidgetType {
  BAR_CHART = 'bar_chart',
  LINE_CHART = 'line_chart',
  PIE_CHART = 'pie_chart',
  TABLE = 'table',
  METRIC = 'metric',
}

interface ReportFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
}

enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IN = 'in',
  NOT_IN = 'not_in',
}
```

### Scheduled Report

```typescript
interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  templateName: string;
  frequency: ReportFrequency;
  nextRunAt: string;
  lastRunAt?: string;
  recipients: string[];
  format: ReportFormat;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
}

enum ReportStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
}
```

### Report History

```typescript
interface ReportHistory {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  scheduledReportId?: string;
  format: ReportFormat;
  status: ReportHistoryStatus;
  fileUrl?: string;
  fileSize?: number;
  runAt: string;
  completedAt?: string;
  error?: string;
  runBy: string;
  recipients?: string[];
  reportType: ReportType;
}

enum ReportHistoryStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

enum ReportType {
  STANDARD = 'standard',
  ANALYTICS = 'analytics',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom',
}
```

### Job Queue

```typescript
interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  priority: JobPriority;
  data: any;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
}

enum JobType {
  REPORT_GENERATION = 'report_generation',
  REPORT_EXPORT = 'report_export',
  REPORT_PREVIEW = 'report_preview',
}

enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

enum JobPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}
```

## React Hooks

### useJobQueue

```typescript
function useJobQueue() {
  const createJob = (type: JobType, data: any, priority: JobPriority = JobPriority.MEDIUM) => {
    // Implementation
  };

  const getJob = (id: string) => {
    // Implementation
  };

  const cancelJob = (id: string) => {
    // Implementation
  };

  const getJobs = (filters: JobFilters) => {
    // Implementation
  };

  return { createJob, getJob, cancelJob, getJobs };
}
```

### useJobTracking

```typescript
function useJobTracking(jobId: string) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Implementation

  return { job, loading, error };
}
```

### useReportGeneration

```typescript
function useReportGeneration() {
  const { createJob } = useJobQueue();

  const generateReport = (templateId: string, filters: ReportFilter[], format: ReportFormat) => {
    // Implementation
  };

  const previewReport = (templateId: string, filters: ReportFilter[]) => {
    // Implementation
  };

  return { generateReport, previewReport };
}
```

## Usage Examples

### Scheduled Reports List

```tsx
import { ScheduledReportsList } from '../components/dashboard/reporting';

function ScheduledReportsPage() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch scheduled reports
    // ...
  }, []);

  const handleRunReport = (id: string) => {
    // Run report
    // ...
  };

  const handlePauseReport = (id: string) => {
    // Pause report
    // ...
  };

  const handleResumeReport = (id: string) => {
    // Resume report
    // ...
  };

  const handleDeleteReport = (id: string) => {
    // Delete report
    // ...
  };

  const handleEditReport = (id: string) => {
    // Navigate to edit page
    // ...
  };

  const handleAddReport = () => {
    // Navigate to add page
    // ...
  };

  return (
    <ScheduledReportsList
      reports={reports}
      loading={loading}
      error={error}
      onRun={handleRunReport}
      onPause={handlePauseReport}
      onResume={handleResumeReport}
      onDelete={handleDeleteReport}
      onEdit={handleEditReport}
      onAdd={handleAddReport}
    />
  );
}
```

### Report History List

```tsx
import { ReportHistoryList } from '../components/dashboard/reporting';

function ReportHistoryPage() {
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch report history
    // ...
  }, []);

  const handleDownloadReport = (id: string) => {
    // Download report
    // ...
  };

  const handleViewReport = (id: string) => {
    // View report
    // ...
  };

  const handleFilterReports = (filters: ReportHistoryFilters) => {
    // Filter reports
    // ...
  };

  return (
    <ReportHistoryList
      history={history}
      loading={loading}
      error={error}
      onDownload={handleDownloadReport}
      onView={handleViewReport}
      onFilter={handleFilterReports}
    />
  );
}
```

## Implementation Timeline

The Reporting System was implemented in phases:

1. **Phase 1: Foundation Setup (May 23-24, 2025)**

   - Initial planning and architecture
   - Job queue system implementation
   - React hooks implementation
   - Atomic components for report scheduling
   - Atomic components for report history

2. **Phase 2: Integration and Enhancement (Planned for May 25-26, 2025)**

   - Report template components
   - Report generation components
   - API integration and testing

3. **Phase 3: Production Readiness (Planned for May 27-28, 2025)**
   - Performance optimization
   - Accessibility improvements
   - Final integration and deployment

## Technical Decisions

1. **Asynchronous Processing Architecture**

   - Used for handling potentially long-running tasks
   - Provides visibility into job status and progress
   - Enables prioritization of tasks

2. **Atomic Design Pattern**

   - Promotes component reusability and consistency
   - Provides a clear mental model for component organization
   - Facilitates easier maintenance and extension

3. **TypeScript Integration**

   - Provides compile-time type checking
   - Improves code quality and reduces runtime errors
   - Enhances developer experience

4. **Box-based Layout**

   - Resolves TypeScript errors with Material UI Grid components
   - Provides more flexibility for responsive layouts
   - Simplifies component structure

5. **Mock Implementation First**
   - Allows frontend development to proceed independently
   - Provides a clear contract for backend APIs
   - Enables early testing and validation

## Future Enhancements

1. **Advanced Filtering**

   - Add more advanced filtering options
   - Implement saved filters
   - Add filter templates

2. **Report Templates Library**

   - Create a library of pre-built report templates
   - Allow sharing templates between users
   - Implement template versioning

3. **Interactive Reports**

   - Add interactive elements to reports
   - Implement drill-down functionality
   - Add data exploration features

4. **Export Options**

   - Add more export formats (HTML, JSON)
   - Implement custom export templates
   - Add export scheduling options

5. **Integration with External Systems**
   - Add integration with email systems
   - Implement integration with cloud storage
   - Add integration with BI tools
