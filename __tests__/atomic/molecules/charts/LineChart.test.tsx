/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import { LineChart } from '../../../../atomic/molecules/charts/LineChart';

// Mock the chart library
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

describe('LineChart', () => {
  const mockData = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 200 },
    { label: 'Mar', value: 150 },
  ];

  const defaultProps = {
    data: mockData,
    title: 'Test Chart',
    width: 400,
    height: 300,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<LineChart {...defaultProps} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<LineChart {...defaultProps} data={[]} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles null data without crashing', () => {
    render(<LineChart {...defaultProps} data={null as any} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles undefined data without crashing', () => {
    render(<LineChart {...defaultProps} data={undefined as any} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('applies custom colors when provided', () => {
    const customColors = ['#ff0000', '#00ff00'];
    render(<LineChart {...defaultProps} colors={customColors} />);

    const chartData = screen.getByTestId('chart-data');
    expect(chartData.textContent).toContain('#ff0000');
  });

  it('handles data with missing values', () => {
    const dataWithMissing = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: null },
      { label: 'Mar', value: 150 },
    ];

    render(<LineChart {...defaultProps} data={dataWithMissing as any} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<LineChart {...defaultProps} title="Custom Chart Title" />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles large datasets without performance issues', async () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      label: `Item ${i}`,
      value: Math.random() * 1000,
    }));

    const startTime = performance.now();
    render(<LineChart {...defaultProps} data={largeData} />);
    const endTime = performance.now();

    // Should render within reasonable time (less than 1 second)
    expect(endTime - startTime).toBeLessThan(1000);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles negative values correctly', () => {
    const dataWithNegatives = [
      { label: 'Jan', value: -100 },
      { label: 'Feb', value: 200 },
      { label: 'Mar', value: -50 },
    ];

    render(<LineChart {...defaultProps} data={dataWithNegatives} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('applies responsive sizing correctly', () => {
    render(<LineChart {...defaultProps} responsive />);
    const chartOptions = screen.getByTestId('chart-options');
    expect(chartOptions.textContent).toContain('responsive');
  });
});
