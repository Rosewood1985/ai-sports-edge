# Chart Components - Atomic Molecules

## Overview
Chart components built for AI Sports Edge using Chart.js and React Chart.js 2. These molecules combine atoms to create reusable visualization components.

## Components

### LineChart
Interactive line chart for time-series data visualization.

#### Props
```typescript
interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
  width?: number;
  height?: number;
  colors?: string[];
  responsive?: boolean;
  showLegend?: boolean;
}
```

#### Usage
```tsx
import { LineChart } from '../../atomic/molecules/charts/LineChart';

const revenueData = [
  { label: 'Jan', value: 10000 },
  { label: 'Feb', value: 12000 },
  { label: 'Mar', value: 15000 },
];

<LineChart 
  data={revenueData}
  title="Monthly Revenue"
  responsive={true}
  colors={['#3B82F6']}
/>
```

#### Features
- Responsive design
- Custom color schemes
- Null/undefined data handling
- Performance optimized for large datasets
- Accessibility support with ARIA labels

### PieChart
Interactive pie chart for categorical data visualization.

#### Props
```typescript
interface PieChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
  width?: number;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  donut?: boolean;
}
```

#### Usage
```tsx
import { PieChart } from '../../atomic/molecules/charts/PieChart';

const subscriptionData = [
  { label: 'Basic', value: 300 },
  { label: 'Pro', value: 450 },
  { label: 'Premium', value: 150 },
];

<PieChart 
  data={subscriptionData}
  title="Subscription Distribution"
  showLegend={true}
  donut={true}
/>
```

#### Features
- Automatic percentage calculations
- Division by zero protection
- Custom color palettes
- Donut chart option
- Legend positioning

### BettingAnalyticsChart
Specialized chart for sports betting analytics.

#### Props
```typescript
interface BettingAnalyticsChartProps {
  data: Array<{
    sport: string;
    winRate: number;
    totalBets: number;
    profit: number;
  }>;
  timeRange: '7d' | '30d' | '90d';
  chartType: 'performance' | 'profit' | 'volume';
}
```

#### Usage
```tsx
import { BettingAnalyticsChart } from '../../atomic/molecules/charts/BettingAnalyticsChart';

const bettingData = [
  { sport: 'NBA', winRate: 65, totalBets: 120, profit: 2400 },
  { sport: 'NFL', winRate: 58, totalBets: 80, profit: 1600 },
  { sport: 'MLB', winRate: 72, totalBets: 200, profit: 3200 },
];

<BettingAnalyticsChart 
  data={bettingData}
  timeRange="30d"
  chartType="performance"
/>
```

## Error Handling

All chart components include comprehensive error handling:

### Null/Undefined Data
```tsx
// Safe handling of missing data
if (!data || !Array.isArray(data)) {
  return <EmptyChartState message="No data available" />;
}
```

### Empty Data Arrays
```tsx
// Handle empty arrays gracefully
if (data.length === 0) {
  return <EmptyChartState message="No data points found" />;
}
```

### Division by Zero Protection
```tsx
// Prevent mathematical errors
const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
const percentage = total > 0 ? (item.value / total) * 100 : 0;
```

### Invalid Values
```tsx
// Filter out invalid data points
const validData = data.filter(item => 
  item.value != null && 
  !isNaN(item.value) && 
  isFinite(item.value)
);
```

## Performance Optimization

### React.memo Implementation
```tsx
import { memo } from 'react';

export const LineChart = memo<LineChartProps>(({ data, ...props }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for complex data
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});
```

### Large Dataset Handling
```tsx
// Virtualization for datasets > 1000 points
const processedData = useMemo(() => {
  if (data.length > 1000) {
    return data.filter((_, index) => index % Math.ceil(data.length / 1000) === 0);
  }
  return data;
}, [data]);
```

### Chart.js Optimizations
```tsx
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: data.length > 500 ? 0 : 300, // Disable animation for large datasets
  },
  plugins: {
    legend: {
      display: showLegend,
    },
  },
  scales: {
    x: {
      display: true,
    },
    y: {
      display: true,
    },
  },
};
```

## Accessibility Features

### ARIA Labels
```tsx
<div 
  role="img" 
  aria-label={`${title} chart showing ${data.length} data points`}
>
  <Line data={chartData} options={chartOptions} />
</div>
```

### Keyboard Navigation
```tsx
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
      // Navigate to previous data point
      break;
    case 'ArrowRight':
      // Navigate to next data point
      break;
    case 'Enter':
      // Announce current data point
      break;
  }
};
```

### Screen Reader Support
```tsx
// Provide text alternative for screen readers
<div className="sr-only">
  Chart data: {data.map(item => `${item.label}: ${item.value}`).join(', ')}
</div>
```

## Color Schemes

### Default Palette
```typescript
const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];
```

### Accessibility-Compliant Colors
```typescript
const ACCESSIBLE_COLORS = [
  '#1F2937', // Dark gray (high contrast)
  '#059669', // Green (accessible)
  '#DC2626', // Red (accessible)
  '#2563EB', // Blue (accessible)
  '#7C2D12', // Brown (accessible)
];
```

### Dark Mode Support
```tsx
const { isDark } = useTheme();

const chartOptions = {
  color: isDark ? '#F9FAFB' : '#374151',
  plugins: {
    legend: {
      labels: {
        color: isDark ? '#F9FAFB' : '#374151',
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: isDark ? '#D1D5DB' : '#6B7280',
      },
      grid: {
        color: isDark ? '#374151' : '#E5E7EB',
      },
    },
    y: {
      ticks: {
        color: isDark ? '#D1D5DB' : '#6B7280',
      },
      grid: {
        color: isDark ? '#374151' : '#E5E7EB',
      },
    },
  },
};
```

## Testing

### Unit Tests
```tsx
describe('LineChart', () => {
  const mockData = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 200 },
  ];

  it('renders with valid data', () => {
    render(<LineChart data={mockData} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<LineChart data={[]} />);
    expect(screen.getByTestId('empty-chart-state')).toBeInTheDocument();
  });

  it('applies custom colors', () => {
    const colors = ['#ff0000'];
    render(<LineChart data={mockData} colors={colors} />);
    // Verify color application
  });
});
```

### Integration Tests
```tsx
describe('Chart Integration', () => {
  it('updates chart when data changes', async () => {
    const { rerender } = render(<LineChart data={initialData} />);
    
    rerender(<LineChart data={updatedData} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
```

## Migration Notes

### From Legacy Charts
When migrating from `/src/components/charts/`:

1. Update import paths:
   ```tsx
   // Old
   import { LineChart } from '../components/charts/LineChart';
   
   // New
   import { LineChart } from '../../atomic/molecules/charts/LineChart';
   ```

2. Check prop interfaces for any breaking changes
3. Verify error handling improvements
4. Test accessibility features

### Breaking Changes
- Enhanced error handling may affect error boundaries
- Some prop names standardized for consistency
- Improved TypeScript types may require type updates

---

*For more information, see the main [Atomic README](../README.md)*