import React, { useState, useEffect } from 'react';
import { getUserPreferences, updateUserPreferences } from '../../utils/userPreferencesService';
import { trackPreferencesUpdated, trackSourceToggled, trackAnalyticsPreferenceChanged } from '../../services/rssAnalyticsService';

/**
 * RSS Feed Preferences Component
 * Allows users to customize their news feed and analytics preferences
 */
const RssFeedPreferences = ({ onClose }) => {
  // Get user preferences
  const [preferences, setPreferences] = useState(getUserPreferences());
  const [activeTab, setActiveTab] = useState('sources');
  
  // Available sports sources
  const availableSources = [
    { id: 'nba', name: 'NBA', icon: '🏀' },
    { id: 'nfl', name: 'NFL', icon: '🏈' },
    { id: 'mlb', name: 'MLB', icon: '⚾' },
    { id: 'nhl', name: 'NHL', icon: '🏒' },
    { id: 'soccer', name: 'Soccer', icon: '⚽' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'golf', name: 'Golf', icon: '⛳' },
    { id: 'f1', name: 'Formula 1', icon: '🏎️' },
    { id: 'mma', name: 'MMA', icon: '🥊' },
    { id: 'analytics', name: 'Sports Analytics', icon: '📊' }
  ];
  
  // Available analytics sources
  const analyticsProviders = [
    { id: 'advanced_stats', name: 'Advanced Stats', description: 'Detailed performance metrics' },
    { id: 'player_tracking', name: 'Player Tracking', description: 'Movement and positioning data' },
    { id: 'predictive_models', name: 'Predictive Models', description: 'AI-powered predictions' },
    { id: 'historical_data', name: 'Historical Data', description: 'Long-term performance trends' },
    { id: 'team_analysis', name: 'Team Analysis', description: 'Team-level performance metrics' }
  ];
  
  // Stats display formats
  const statsFormats = [
    { id: 'standard', name: 'Standard', description: 'Traditional statistics format' },
    { id: 'advanced', name: 'Advanced', description: 'Advanced metrics and formulas' },
    { id: 'percentile', name: 'Percentile', description: 'Stats shown as percentile rankings' },
    { id: 'visual', name: 'Visual', description: 'Graphical representation of stats' }
  ];
  
  // Handle source toggle
  const handleSourceToggle = (sourceId) => {
    const enabledSources = [...preferences.rssFeeds.enabledSources];
    const isEnabled = enabledSources.includes(sourceId);
    
    if (isEnabled) {
      // Remove from enabled sources
      const updatedSources = enabledSources.filter(id => id !== sourceId);
      updatePreferences('rssFeeds.enabledSources', updatedSources);
      trackSourceToggled(sourceId, false);
    } else {
      // Add to enabled sources
      updatePreferences('rssFeeds.enabledSources', [...enabledSources, sourceId]);
      trackSourceToggled(sourceId, true);
    }
  };
  
  // Handle analytics provider toggle
  const handleAnalyticsProviderToggle = (providerId) => {
    const enabledProviders = [...(preferences.analytics?.enabledProviders || [])];
    const isEnabled = enabledProviders.includes(providerId);
    
    if (isEnabled) {
      // Remove from enabled providers
      const updatedProviders = enabledProviders.filter(id => id !== providerId);
      updatePreferences('analytics.enabledProviders', updatedProviders);
      trackAnalyticsPreferenceChanged('provider', { id: providerId, enabled: false });
    } else {
      // Add to enabled providers
      updatePreferences('analytics.enabledProviders', [...enabledProviders, providerId]);
      trackAnalyticsPreferenceChanged('provider', { id: providerId, enabled: true });
    }
  };
  
  // Handle stats format change
  const handleStatsFormatChange = (format) => {
    updatePreferences('analytics.statsFormat', format);
    trackAnalyticsPreferenceChanged('statsFormat', format);
  };
  
  // Handle refresh interval change
  const handleRefreshIntervalChange = (minutes) => {
    updatePreferences('rssFeeds.refreshIntervalMinutes', parseInt(minutes, 10));
    trackPreferencesUpdated('refreshInterval', minutes);
  };
  
  // Handle scroll speed change
  const handleScrollSpeedChange = (speed) => {
    updatePreferences('ui.newsTicker.scrollSpeed', speed);
    trackPreferencesUpdated('scrollSpeed', speed);
  };
  
  // Handle pause on hover toggle
  const handlePauseOnHoverToggle = (enabled) => {
    updatePreferences('ui.newsTicker.pauseOnHover', enabled);
    trackPreferencesUpdated('pauseOnHover', enabled);
  };
  
  // Handle show analytics toggle
  const handleShowAnalyticsToggle = (enabled) => {
    updatePreferences('analytics.showAnalytics', enabled);
    trackAnalyticsPreferenceChanged('showAnalytics', enabled);
  };
  
  // Update preferences helper
  const updatePreferences = (path, value) => {
    const newPreferences = { ...preferences };
    
    // Handle nested paths (e.g., 'rssFeeds.enabledSources')
    const parts = path.split('.');
    let current = newPreferences;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
    
    // Update state and save to storage
    setPreferences(newPreferences);
    updateUserPreferences(newPreferences);
  };
  
  return (
    <div className="rss-preferences-container">
      <div className="rss-preferences-header">
        <h2>News Feed Preferences</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="rss-preferences-tabs">
        <button 
          className={`tab-button ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          News Sources
        </button>
        <button 
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'display' ? 'active' : ''}`}
          onClick={() => setActiveTab('display')}
        >
          Display
        </button>
      </div>
      
      <div className="rss-preferences-content">
        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="sources-tab">
            <p className="tab-description">Select the sports news sources you want to see in your feed.</p>
            
            <div className="sources-grid">
              {availableSources.map(source => (
                <div 
                  key={source.id}
                  className={`source-item ${preferences.rssFeeds.enabledSources.includes(source.id) ? 'enabled' : ''}`}
                  onClick={() => handleSourceToggle(source.id)}
                >
                  <div className="source-icon">{source.icon}</div>
                  <div className="source-name">{source.name}</div>
                  <div className="source-toggle">
                    <input 
                      type="checkbox" 
                      checked={preferences.rssFeeds.enabledSources.includes(source.id)}
                      onChange={() => {}} // Handled by the onClick on the parent div
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <p className="tab-description">Customize your sports analytics experience.</p>
            
            <div className="analytics-preferences">
              <h3>Analytics Settings</h3>
              
              <div className="analytics-preferences-option">
                <label>
                  <input 
                    type="checkbox"
                    checked={preferences.analytics?.showAnalytics !== false}
                    onChange={(e) => handleShowAnalyticsToggle(e.target.checked)}
                  />
                  Show analytics content in news feed
                </label>
              </div>
              
              <div className="stats-format-selector">
                <label>Statistics Display Format:</label>
                <select 
                  value={preferences.analytics?.statsFormat || 'standard'}
                  onChange={(e) => handleStatsFormatChange(e.target.value)}
                >
                  {statsFormats.map(format => (
                    <option key={format.id} value={format.id}>
                      {format.name} - {format.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="analytics-sources">
              <h4>Analytics Providers</h4>
              {analyticsProviders.map(provider => (
                <div key={provider.id} className="analytics-source-item">
                  <input 
                    type="checkbox"
                    id={`provider-${provider.id}`}
                    checked={(preferences.analytics?.enabledProviders || []).includes(provider.id)}
                    onChange={() => handleAnalyticsProviderToggle(provider.id)}
                  />
                  <label htmlFor={`provider-${provider.id}`}>
                    {provider.name} - {provider.description}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Display Tab */}
        {activeTab === 'display' && (
          <div className="display-tab">
            <p className="tab-description">Customize how the news ticker displays content.</p>
            
            <div className="display-option">
              <label>Refresh Interval:</label>
              <select 
                value={preferences.rssFeeds.refreshIntervalMinutes || 15}
                onChange={(e) => handleRefreshIntervalChange(e.target.value)}
              >
                <option value="5">Every 5 minutes</option>
                <option value="10">Every 10 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every hour</option>
              </select>
            </div>
            
            <div className="display-option">
              <label>Scroll Speed:</label>
              <select 
                value={preferences.ui.newsTicker?.scrollSpeed || 'medium'}
                onChange={(e) => handleScrollSpeedChange(e.target.value)}
              >
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            
            <div className="display-option">
              <label>
                <input 
                  type="checkbox"
                  checked={preferences.ui.newsTicker?.pauseOnHover !== false}
                  onChange={(e) => handlePauseOnHoverToggle(e.target.checked)}
                />
                Pause scrolling on hover
              </label>
            </div>
          </div>
        )}
      </div>
      
      <div className="rss-preferences-footer">
        <button className="save-button" onClick={onClose}>Save & Close</button>
      </div>
    </div>
  );
};

export default RssFeedPreferences;