import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Select } from '../../ui/Select';

export interface PredictionModel {
  id: string;
  name: string;
  type: 'revenue' | 'users' | 'engagement' | 'churn' | 'conversion';
  accuracy: number;
  lastTrained: string;
  status: 'active' | 'training' | 'needs_update';
}

export interface Forecast {
  id: string;
  modelId: string;
  metric: string;
  timeframe: '1h' | '24h' | '7d' | '30d' | '90d';
  predictions: {
    timestamp: string;
    value: number;
    confidence: number;
    lowerBound: number;
    upperBound: number;
  }[];
  generatedAt: string;
  accuracy: number;
}

export interface PredictiveAnalyticsProps {
  className?: string;
  autoRefresh?: boolean;
  defaultTimeframe?: string;
}

/**
 * Advanced Predictive Analytics Dashboard
 * ML-powered forecasting for business metrics and user behavior
 */
export function PredictiveAnalyticsDashboard({
  className = '',
  autoRefresh = true,
  defaultTimeframe = '7d'
}: PredictiveAnalyticsProps) {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [models, setModels] = useState<PredictionModel[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(defaultTimeframe);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock prediction models
  const mockModels: PredictionModel[] = [
    {
      id: 'model-revenue',
      name: 'Revenue Forecast',
      type: 'revenue',
      accuracy: 0.87,
      lastTrained: '2025-05-27T10:00:00Z',
      status: 'active'
    },
    {
      id: 'model-users',
      name: 'User Growth Prediction',
      type: 'users',
      accuracy: 0.92,
      lastTrained: '2025-05-27T08:30:00Z', 
      status: 'active'
    },
    {
      id: 'model-churn',
      name: 'Churn Risk Analysis',
      type: 'churn',
      accuracy: 0.79,
      lastTrained: '2025-05-26T15:20:00Z',
      status: 'needs_update'
    },
    {
      id: 'model-conversion',
      name: 'Conversion Rate Predictor',
      type: 'conversion',
      accuracy: 0.84,
      lastTrained: '2025-05-27T12:15:00Z',
      status: 'training'
    }
  ];

  // Generate mock forecast data
  const generateMockForecasts = useCallback(() => {
    const baseTime = new Date();
    const timeframes = {
      '1h': { points: 12, interval: 5 * 60 * 1000 }, // 5-minute intervals
      '24h': { points: 24, interval: 60 * 60 * 1000 }, // 1-hour intervals  
      '7d': { points: 7, interval: 24 * 60 * 60 * 1000 }, // 1-day intervals
      '30d': { points: 30, interval: 24 * 60 * 60 * 1000 }, // 1-day intervals
      '90d': { points: 90, interval: 24 * 60 * 60 * 1000 } // 1-day intervals
    };

    const mockForecasts: Forecast[] = [];

    mockModels.forEach(model => {
      if (model.status !== 'active') return;

      const { points, interval } = timeframes[selectedTimeframe as keyof typeof timeframes];
      const predictions = [];

      for (let i = 0; i < points; i++) {
        const timestamp = new Date(baseTime.getTime() + (i * interval)).toISOString();
        const baseValue = model.type === 'revenue' ? 50000 + Math.random() * 20000 :
                         model.type === 'users' ? 10000 + Math.random() * 5000 :
                         model.type === 'conversion' ? 0.15 + Math.random() * 0.1 :
                         1000 + Math.random() * 500;
        
        const trend = i * 0.02; // Small upward trend
        const noise = (Math.random() - 0.5) * 0.1;
        const value = baseValue * (1 + trend + noise);
        const confidence = 0.75 + Math.random() * 0.2;
        const variance = value * (1 - confidence) * 0.5;
        
        predictions.push({
          timestamp,
          value: Math.round(value * 100) / 100,
          confidence: Math.round(confidence * 100) / 100,
          lowerBound: Math.round((value - variance) * 100) / 100,
          upperBound: Math.round((value + variance) * 100) / 100
        });
      }

      mockForecasts.push({
        id: `forecast-${model.id}-${selectedTimeframe}`,
        modelId: model.id,
        metric: model.name,
        timeframe: selectedTimeframe as any,
        predictions,
        generatedAt: new Date().toISOString(),
        accuracy: model.accuracy
      });
    });

    return mockForecasts;
  }, [selectedTimeframe]);

  const loadForecasts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newForecasts = generateMockForecasts();
      setForecasts(newForecasts);
      setModels(mockModels);
    } catch (error) {
      console.error('Error loading forecasts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [generateMockForecasts]);

  useEffect(() => {
    loadForecasts();
  }, [selectedTimeframe, loadForecasts]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadForecasts, 5 * 60 * 1000); // Refresh every 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadForecasts]);

  const filteredForecasts = forecasts.filter(forecast => 
    selectedModel === 'all' || forecast.modelId === selectedModel
  );

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'training': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'needs_update': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 0.8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatValue = (value: number, type: string) => {
    if (type === 'revenue') return `$${value.toLocaleString()}`;
    if (type === 'conversion') return `${(value * 100).toFixed(1)}%`;
    if (type === 'users') return value.toLocaleString();
    return value.toString();
  };

  const formatTimestamp = (timestamp: string, timeframe: string) => {
    const date = new Date(timestamp);
    if (timeframe === '1h') return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (timeframe === '24h') return date.toLocaleTimeString('en-US', { hour: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Predictive Analytics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-powered forecasting and trend prediction
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadForecasts}
            isLoading={isLoading}
          >
            Refresh Forecasts
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timeframe
            </label>
            <Select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              <option value="1h">Next Hour</option>
              <option value="24h">Next 24 Hours</option>
              <option value="7d">Next 7 Days</option>
              <option value="30d">Next 30 Days</option>
              <option value="90d">Next 90 Days</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="all">All Models</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Model Status Overview */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Model Status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map(model => (
            <div key={model.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  {model.name}
                </h5>
                <Badge className={getModelStatusColor(model.status)}>
                  {model.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Accuracy</span>
                  <span className={`font-medium ${getAccuracyColor(model.accuracy)}`}>
                    {Math.round(model.accuracy * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Last Trained</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(model.lastTrained).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Forecasts */}
      {isLoading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Generating forecasts...</p>
        </Card>
      ) : filteredForecasts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Forecasts Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active models found for the selected criteria
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredForecasts.map(forecast => {
            const model = models.find(m => m.id === forecast.modelId);
            const latestPrediction = forecast.predictions[forecast.predictions.length - 1];
            const firstPrediction = forecast.predictions[0];
            const trend = latestPrediction.value > firstPrediction.value ? 'up' : 'down';
            const trendPercent = Math.abs(
              ((latestPrediction.value - firstPrediction.value) / firstPrediction.value) * 100
            );

            return (
              <Card key={forecast.id} className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {forecast.metric}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Forecast for next {selectedTimeframe}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge className={getAccuracyColor(forecast.accuracy)}>
                        {Math.round(forecast.accuracy * 100)}% accuracy
                      </Badge>
                      <Badge className={trend === 'up' ? 'text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200' : 'text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200'}>
                        {trend === 'up' ? '↗' : '↘'} {trendPercent.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      Current Prediction
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {formatValue(latestPrediction.value, model?.type || '')}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Confidence: {Math.round(latestPrediction.confidence * 100)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Range
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatValue(latestPrediction.lowerBound, model?.type || '')} - {formatValue(latestPrediction.upperBound, model?.type || '')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      95% confidence interval
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Generated
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(forecast.generatedAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(forecast.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Prediction Timeline */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Prediction Timeline
                  </h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {forecast.predictions.slice(-10).map((prediction, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimestamp(prediction.timestamp, selectedTimeframe)}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatValue(prediction.value, model?.type || '')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            ±{formatValue(prediction.upperBound - prediction.value, model?.type || '')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" size="sm">
                    Export Data
                  </Button>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                  <Button variant="primary" size="sm">
                    Create Alert
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}