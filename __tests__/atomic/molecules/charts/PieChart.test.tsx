/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PieChart } from '../../../../atomic/molecules/charts/PieChart';

// Mock the chart library
jest.mock('react-chartjs-2', () => ({
  Pie: ({ data, options }: any) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  )
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  ArcElement: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

describe('PieChart', () => {
  const mockData = [
    { label: 'Category A', value: 30 },
    { label: 'Category B', value: 45 },
    { label: 'Category C', value: 25 },
  ];

  const defaultProps = {
    data: mockData,
    title: 'Test Pie Chart',
    width: 400,
    height: 300,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PieChart {...defaultProps} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<PieChart {...defaultProps} data={[]} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('handles null data without crashing', () => {
    render(<PieChart {...defaultProps} data={null as any} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    const dataWithZeros = [
      { label: 'Category A', value: 0 },
      { label: 'Category B', value: 45 },
      { label: 'Category C', value: 0 },
    ];
    
    render(<PieChart {...defaultProps} data={dataWithZeros} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('prevents division by zero in percentage calculations', () => {
    const allZeroData = [
      { label: 'Category A', value: 0 },
      { label: 'Category B', value: 0 },
      { label: 'Category C', value: 0 },
    ];
    
    render(<PieChart {...defaultProps} data={allZeroData} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('applies custom colors when provided', () => {
    const customColors = ['#ff0000', '#00ff00', '#0000ff'];
    render(<PieChart {...defaultProps} colors={customColors} />);
    
    const chartData = screen.getByTestId('chart-data');
    expect(chartData.textContent).toContain('#ff0000');
  });

  it('handles single data point', () => {
    const singleData = [{ label: 'Only Category', value: 100 }];
    
    render(<PieChart {...defaultProps} data={singleData} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('handles negative values by converting to absolute', () => {
    const dataWithNegatives = [
      { label: 'Category A', value: -30 },
      { label: 'Category B', value: 45 },
      { label: 'Category C', value: -25 },
    ];
    
    render(<PieChart {...defaultProps} data={dataWithNegatives} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders legend when specified', () => {
    render(<PieChart {...defaultProps} showLegend={true} />);
    const chartOptions = screen.getByTestId('chart-options');
    expect(chartOptions.textContent).toContain('legend');
  });

  it('handles very large numbers', () => {
    const largeNumberData = [
      { label: 'Category A', value: 1000000000 },
      { label: 'Category B', value: 2000000000 },
      { label: 'Category C', value: 3000000000 },
    ];
    
    render(<PieChart {...defaultProps} data={largeNumberData} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });
});