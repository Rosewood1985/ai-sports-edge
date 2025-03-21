import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { 
  getGameWeather, 
  getWeatherPerformanceInsights, 
  WeatherData, 
  WeatherPerformanceCorrelation 
} from '../services/weatherService';
import { useTheme } from '../contexts/ThemeContext';

interface WeatherInsightsProps {
  gameId: string;
  playerId: string;
  playerName: string;
}

/**
 * Component to display weather insights for a player's performance
 */
const WeatherInsights: React.FC<WeatherInsightsProps> = ({
  gameId,
  playerId,
  playerName
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [correlations, setCorrelations] = useState<WeatherPerformanceCorrelation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const { colors, isDark } = useTheme();
  
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
          <ThemedText style={styles.loadingText}>Loading weather insights...</ThemedText>
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
            {error || 'Weather data unavailable'}
          </ThemedText>
        </View>
      </View>
    );
  }
  
  // Get impact color based on correlation value
  const getImpactColor = (correlation: number) => {
    if (correlation <= -0.2) return '#FF3B30'; // Strong negative (red)
    if (correlation < 0) return '#FF9500';     // Mild negative (orange)
    if (correlation === 0) return '#8E8E93';   // Neutral (gray)
    if (correlation < 0.2) return '#34C759';   // Mild positive (green)
    return '#30D158';                          // Strong positive (bright green)
  };
  
  // Get impact text based on correlation value
  const getImpactText = (correlation: number) => {
    if (correlation <= -0.2) return 'Strong Negative';
    if (correlation < 0) return 'Slight Negative';
    if (correlation === 0) return 'Neutral';
    if (correlation < 0.2) return 'Slight Positive';
    return 'Strong Positive';
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
    <View style={[
      styles.container, 
      { 
        borderColor: colors.border,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
      }
    ]}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        accessibilityLabel={expanded ? "Collapse weather insights" : "Expand weather insights"}
        accessibilityRole="button"
      >
        <View style={styles.weatherSummary}>
          <Image 
            source={{ uri: weatherData.conditionIcon }} 
            style={styles.weatherIcon} 
          />
          <View style={styles.weatherInfo}>
            <ThemedText style={styles.weatherCondition}>
              {weatherData.condition}
            </ThemedText>
            <ThemedText style={styles.weatherLocation}>
              {weatherData.location}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.temperatureContainer}>
          <ThemedText style={styles.temperature}>
            {Math.round(weatherData.temperature)}°F
          </ThemedText>
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={colors.text} 
          />
        </View>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.detailsContainer}>
          <View style={styles.weatherDetails}>
            <View style={styles.weatherDetailItem}>
              <ThemedText style={styles.detailLabel}>Feels Like</ThemedText>
              <ThemedText style={styles.detailValue}>
                {Math.round(weatherData.feelsLike)}°F
              </ThemedText>
            </View>
            
            <View style={styles.weatherDetailItem}>
              <ThemedText style={styles.detailLabel}>Humidity</ThemedText>
              <ThemedText style={styles.detailValue}>
                {weatherData.humidity}%
              </ThemedText>
            </View>
            
            <View style={styles.weatherDetailItem}>
              <ThemedText style={styles.detailLabel}>Wind</ThemedText>
              <ThemedText style={styles.detailValue}>
                {Math.round(weatherData.windSpeed)} mph
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.insightsContainer}>
            <ThemedText style={styles.insightsTitle}>
              Weather Impact on {playerName}
            </ThemedText>
            
            {correlations.length === 0 ? (
              <ThemedText style={styles.noInsightsText}>
                No weather impact data available
              </ThemedText>
            ) : (
              correlations.map((correlation, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={styles.insightMetric}>
                    <ThemedText style={styles.metricName}>{correlation.metric}</ThemedText>
                    <View style={[
                      styles.impactBadge, 
                      { backgroundColor: getImpactColor(correlation.correlation) }
                    ]}>
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
                  
                  <ThemedText style={styles.insightText}>
                    {correlation.insight}
                  </ThemedText>
                  
                  <View style={styles.confidenceContainer}>
                    <ThemedText style={styles.confidenceLabel}>
                      Confidence:
                    </ThemedText>
                    <View style={styles.confidenceMeter}>
                      <View 
                        style={[
                          styles.confidenceFill,
                          { width: `${correlation.confidence * 100}%` }
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
    fontSize: 12,
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
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: 12,
  },
  insightsContainer: {
    marginTop: 8,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noInsightsText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
    marginVertical: 12,
  },
  insightItem: {
    marginBottom: 16,
  },
  insightMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
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
    height: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#0a7ea4',
  },
  confidenceValue: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.7,
  },
});

export default WeatherInsights;