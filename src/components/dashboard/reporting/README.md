# Reporting Module

This module provides components for the reporting functionality in the admin dashboard. It follows the atomic design pattern with atoms, molecules, and organisms.

## Structure

```
reporting/
├── atoms/                # Atomic components
│   ├── DateRangePicker.tsx
│   ├── FormatBadge.tsx
│   ├── FrequencyBadge.tsx
│   ├── HistoryStatusBadge.tsx
│   ├── RecipientChip.tsx
│   ├── ScheduleStatusBadge.tsx
│   └── index.ts
├── molecules/           # Molecular components
│   ├── ReportHistoryCard.tsx
│   ├── ScheduledReportCard.tsx
│   └── index.ts
├── organisms/           # Organism components
│   ├── ReportHistoryList.tsx
│   ├── ScheduledReportsList.tsx
│   └── index.ts
└── index.ts             # Main export file
```

## Components

### Atoms

- **DateRangePicker**: Component for selecting a date range
- **FormatBadge**: Badge displaying the format of a report (PDF, CSV, etc.)
- **FrequencyBadge**: Badge displaying the frequency of a scheduled report
- **HistoryStatusBadge**: Badge displaying the status of a report history item
- **RecipientChip**: Chip displaying a report recipient
- **ScheduleStatusBadge**: Badge displaying the status of a scheduled report

### Molecules

- **ReportHistoryCard**: Card displaying a report history item
- **ScheduledReportCard**: Card displaying a scheduled report

### Organisms

- **ReportHistoryList**: List of report history items with filtering and pagination
- **ScheduledReportsList**: List of scheduled reports with filtering and pagination

## Usage

Import components from the module:

```tsx
import {
  ScheduledReportsList,
  ReportHistoryList,
  ScheduledReportCard,
  ReportHistoryCard,
  ScheduleStatusBadge,
  FormatBadge,
  FrequencyBadge,
  HistoryStatusBadge,
  RecipientChip,
  DateRangePicker,
} from '../components/dashboard/reporting';
```

Or import specific components:

```tsx
import { ScheduledReportsList } from '../components/dashboard/reporting/organisms';
import { ScheduledReportCard } from '../components/dashboard/reporting/molecules';
import { ScheduleStatusBadge } from '../components/dashboard/reporting/atoms';
```

## Examples

### Scheduled Reports List

```tsx
<ScheduledReportsList
  reports={scheduledReports}
  loading={loading}
  error={error}
  onRun={handleRunReport}
  onPause={handlePauseReport}
  onResume={handleResumeReport}
  onDelete={handleDeleteReport}
  onEdit={handleEditReport}
  onAdd={handleAddReport}
/>
```

### Report History List

```tsx
<ReportHistoryList
  history={reportHistory}
  loading={loading}
  error={error}
  onDownload={handleDownloadReport}
  onView={handleViewReport}
  onFilter={handleFilterReports}
/>
```
