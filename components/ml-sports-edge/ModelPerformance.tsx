import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, DataTable } from 'react-native-paper';

import { useTheme } from '../../contexts/ThemeContext';
import MLSportsEdgeService from '../../services/ml-sports-edge/MLSportsEdgeService';

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
}

interface ModelInfo {
  model_name: string;
  evaluation: ModelMetrics;
}

interface ModelPerformanceProps {
  sport: string;
}

const ModelPerformance: React.FC<ModelPerformanceProps> = ({ sport }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchModels();
  }, [sport]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MLSportsEdgeService.getModels(sport);

      // Transform data into the format we need
      const modelInfos: ModelInfo[] = [];
      for (const [modelName, modelData] of Object.entries(data.models || {})) {
        modelInfos.push({
          model_name: modelName,
          evaluation: (modelData as any).evaluation || {},
        });
      }

      setModels(modelInfos);
    } catch (err) {
      setError('Failed to load model information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (value: number) => {
    return value ? (value * 100).toFixed(1) + '%' : '-';
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.background }]}>
      <Card.Title title="Model Performance" subtitle={`${sport.toUpperCase()}`} />
      <Card.Content>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : error ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
        ) : models.length === 0 ? (
          <Text style={[styles.noData, { color: theme.colors.text }]}>
            No model information available
          </Text>
        ) : (
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Model</DataTable.Title>
              <DataTable.Title numeric>Accuracy</DataTable.Title>
              <DataTable.Title numeric>Precision</DataTable.Title>
              <DataTable.Title numeric>Recall</DataTable.Title>
              <DataTable.Title numeric>F1</DataTable.Title>
            </DataTable.Header>

            {models.map((model, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>
                  <Text style={{ color: theme.colors.text }}>{model.model_name}</Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ color: theme.colors.text }}>
                    {formatMetric(model.evaluation.accuracy)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ color: theme.colors.text }}>
                    {formatMetric(model.evaluation.precision)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ color: theme.colors.text }}>
                    {formatMetric(model.evaluation.recall)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ color: theme.colors.text }}>
                    {formatMetric(model.evaluation.f1)}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    elevation: 4,
  },
  error: {
    textAlign: 'center',
    marginVertical: 20,
  },
  noData: {
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default ModelPerformance;
