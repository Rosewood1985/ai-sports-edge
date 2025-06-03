import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';

import { ThemedText } from './ThemedText';
import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  getGameWeather,
  getWeatherPerformanceInsights,
  WeatherData,
  WeatherPerformanceCorrelation,
} from '../services/weatherService';

interface WeatherInsightsProps {
  gameId: string;
  playerId: string;
  playerName: string;
}

/**
 * Component to display weather insights for a player's performance
 */
const WeatherInsights: React.FC<WeatherInsightsProps> = ({ gameId, playerId, playerName }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [correlations, setCorrelations] = useState<WeatherPerformanceCorrelation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get weather data for the game
        const weather = await getGameWeather(gameId);
        setWeatherData(weather);

        // Get weather performance correlations
        const insights = await getWeatherPerformanceInsights(playerId, weather.condition);
        setCorrelations(insights);
      } catch (err) {
        console.error('Error loading weather insights:', err);
        setError('Unable to load weather data');
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, [gameId, playerId]);

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, { borderColor: colors.border }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={styles.loadingText}>{t('weather.loading')}</ThemedText>
        </View>
      </View>
    );
  }

  // Render error state
  if (error || !weatherData) {
    return (
      <View style={[styles.container, { borderColor: colors.border }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={24} color={colors.error} />
          <ThemedText style={[styles.errorText, { color: colors.error }]}>
            {error || t('weather.unavailable')}
          </ThemedText>
        </View>
      </View>
    );
  }

  // Get impact color based on correlation value
  const getImpactColor = (correlation: number) => {
    if (correlation <= -0.2) return '#FF3B30'; // Strong negative (red)
    if (correlation < 0) return '#FF9500'; // Mild negative (orange)
    if (correlation === 0) return '#8E8E93'; // Neutral (gray)
    if (correlation < 0.2) return '#34C759'; // Mild positive (green)
    return '#30D158'; // Strong positive (bright green)
  };

  // Get impact text based on correlation value
  const getImpactText = (correlation: number) => {
    if (correlation <= -0.2) return t('weather.impact.strongNegative');
    if (correlation < 0) return t('weather.impact.slightNegative');
    if (correlation === 0) return t('weather.impact.neutral');
    if (correlation < 0.2) return t('weather.impact.slightPositive');
    return t('weather.impact.strongPositive');
  };

  // Get impact icon based on correlation value
  const getImpactIcon = (correlation: number) => {
    if (correlation <= -0.2) return 'arrow-down';
    if (correlation < 0) return 'arrow-down-outline';
    if (correlation === 0) return 'remove-outline';
    if (correlation < 0.2) return 'arrow-up-outline';
    return 'arrow-up';
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        },
      ]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        accessibilityLabel={expanded ? t('weather.collapse') : t('weather.expand')}
        accessibilityRole="button"
      >
        <View style={styles.weatherSummary}>
          <Image source={{ uri: weatherData.conditionIcon }} style={styles.weatherIcon} />
          <View style={styles.weatherInfo}>
            <ThemedText style={styles.weatherCondition}>{weatherData.condition}</ThemedText>
            <ThemedText style={styles.weatherLocation}>{weatherData.location}</ThemedText>
          </View>
        </View>

        <View style={styles.temperatureContainer}>
          <ThemedText style={styles.temperature}>
            {Math.round(weatherData.temperature)}°F
          </ThemedText>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.text} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.detailsContainer}>
          <View style={styles.weatherDetails}>
            <View style={styles.weatherDetailItem}>
              <ThemedText style={styles.detailLabel}>{t('weather.feelsLike')}</ThemedText>
              <ThemedText style={styles.detailValue}>
                {Math.round(weatherData.feelsLike)}°F
              </ThemedText>
            </View>

            <View style={styles.weatherDetailItem}>
              <ThemedText style={styles.detailLabel}>{t('weather.humidity')}</ThemedText>
              <ThemedText style={styles.detailValue}>{weatherData.humidity}%</ThemedText>
            </View>

            <View style={styles.weatherDetailItem}>
              <ThemedText style={styles.detailLabel}>{t('weather.wind')}</ThemedText>
              <ThemedText style={styles.detailValue}>
                {Math.round(weatherData.windSpeed)} mph
              </ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.insightsContainer}>
            <ThemedText style={styles.insightsTitle}>
              {t('weather.impact', { playerName })}
            </ThemedText>

            {correlations.length === 0 ? (
              <ThemedText style={styles.noInsightsText}>{t('weather.noData')}</ThemedText>
            ) : (
              correlations.map((correlation, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={styles.insightMetric}>
                    <ThemedText style={styles.metricName}>{correlation.metric}</ThemedText>
                    <View
                      style={[
                        styles.impactBadge,
                        { backgroundColor: getImpactColor(correlation.correlation) },
                      ]}
                    >
                      <Ionicons
                        name={getImpactIcon(correlation.correlation)}
                        size={12}
                        color="#fff"
                      />
                      <ThemedText style={styles.impactText}>
                        {getImpactText(correlation.correlation)}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText style={styles.insightText}>{correlation.insight}</ThemedText>

                  <View style={styles.confidenceContainer}>
                    <ThemedText style={styles.confidenceLabel}>
                      {t('weather.confidence')}
                    </ThemedText>
                    <View style={styles.confidenceMeter}>
                      <View
                        style={[
                          styles.confidenceFill,
                          { width: `${correlation.confidence * 100}%` },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.confidenceValue}>
                      {Math.round(correlation.confidence * 100)}%
                    </ThemedText>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  weatherSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    width: 40,
    height: 40,
  },
  weatherInfo: {
    marginLeft: 8,
  },
  weatherCondition: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  weatherLocation: {
    fontSize: 14,
    opacity: 0.7,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperature: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  detailsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weatherDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    opacity: 0.2,
    backgroundColor: '#ccc',
    marginBottom: 16,
  },
  insightsContainer: {
    marginBottom: 8,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noInsightsText: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  insightItem: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  insightMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  insightText: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginRight: 8,
  },
  confidenceMeter: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 8,
  },
});

export default WeatherInsights;
