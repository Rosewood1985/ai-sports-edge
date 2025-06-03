import React, { useState, useEffect } from 'react';
import '../styles/personalization-panel.css';

/**
 * PersonalizationPanel component for the web app
 * Allows users to customize their experience
 */
const PersonalizationPanel = ({ onClose }) => {
  // State for user preferences
  const [preferences, setPreferences] = useState({
    // Theme preferences
    darkMode: true,
    accentColor: '#00E5FF',

    // Content preferences
    favoriteSports: [],
    favoriteTeams: [],

    // Display preferences
    showLiveScores: true,
    showPredictionConfidence: true,
    showBettingHistory: true,

    // Betting preferences
    riskTolerance: 'medium',
    preferredOddsFormat: 'american',

    // Privacy preferences
    shareDataForBetterPredictions: true,
    anonymousUsageStats: true,
  });

  // Available sports
  const availableSports = [
    { id: 'nfl', name: 'NFL' },
    { id: 'nba', name: 'NBA' },
    { id: 'mlb', name: 'MLB' },
    { id: 'nhl', name: 'NHL' },
    { id: 'soccer', name: 'Soccer' },
    { id: 'f1', name: 'Formula 1' },
    { id: 'ufc', name: 'UFC' },
    { id: 'ncaab', name: 'NCAA Basketball' },
    { id: 'ncaaf', name: 'NCAA Football' },
  ];

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }, [preferences]);

  // Handle toggle change
  const handleToggleChange = key => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  // Handle select change
  const handleSelectChange = (key, value) => {
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  // Handle sport selection
  const handleSportSelection = sportId => {
    const newFavoriteSports = [...preferences.favoriteSports];

    if (newFavoriteSports.includes(sportId)) {
      // Remove sport if already selected
      const index = newFavoriteSports.indexOf(sportId);
      newFavoriteSports.splice(index, 1);
    } else {
      // Add sport if not selected
      newFavoriteSports.push(sportId);
    }

    setPreferences({
      ...preferences,
      favoriteSports: newFavoriteSports,
    });
  };

  // Handle save
  const handleSave = () => {
    // In a real app, this would save to a backend
    alert('Preferences saved successfully!');
    onClose();
  };

  return (
    <div className="personalization-panel">
      <div className="personalization-panel-header">
        <h2>Personalize Your Experience</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="personalization-panel-content">
        {/* Theme Section */}
        <div className="personalization-section">
          <h3>Theme</h3>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Dark Mode</span>
              <span className="preference-description">Use dark theme throughout the app</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.darkMode}
                onChange={() => handleToggleChange('darkMode')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Accent Color</span>
              <span className="preference-description">Choose your preferred accent color</span>
            </div>
            <div className="color-options">
              <div
                className={`color-option ${preferences.accentColor === '#00E5FF' ? 'selected' : ''}`}
                style={{ backgroundColor: '#00E5FF' }}
                onClick={() => handleSelectChange('accentColor', '#00E5FF')}
              />
              <div
                className={`color-option ${preferences.accentColor === '#00FF88' ? 'selected' : ''}`}
                style={{ backgroundColor: '#00FF88' }}
                onClick={() => handleSelectChange('accentColor', '#00FF88')}
              />
              <div
                className={`color-option ${preferences.accentColor === '#BF5AF2' ? 'selected' : ''}`}
                style={{ backgroundColor: '#BF5AF2' }}
                onClick={() => handleSelectChange('accentColor', '#BF5AF2')}
              />
              <div
                className={`color-option ${preferences.accentColor === '#FF2D55' ? 'selected' : ''}`}
                style={{ backgroundColor: '#FF2D55' }}
                onClick={() => handleSelectChange('accentColor', '#FF2D55')}
              />
              <div
                className={`color-option ${preferences.accentColor === '#FFCC00' ? 'selected' : ''}`}
                style={{ backgroundColor: '#FFCC00' }}
                onClick={() => handleSelectChange('accentColor', '#FFCC00')}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="personalization-section">
          <h3>Content</h3>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Favorite Sports</span>
              <span className="preference-description">
                Select sports to prioritize in your feed
              </span>
            </div>
          </div>

          <div className="sports-grid">
            {availableSports.map(sport => (
              <div
                key={sport.id}
                className={`sport-item ${preferences.favoriteSports.includes(sport.id) ? 'selected' : ''}`}
                onClick={() => handleSportSelection(sport.id)}
              >
                {sport.name}
              </div>
            ))}
          </div>
        </div>

        {/* Display Section */}
        <div className="personalization-section">
          <h3>Display</h3>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Show Live Scores</span>
              <span className="preference-description">Display live scores on the home page</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.showLiveScores}
                onChange={() => handleToggleChange('showLiveScores')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Show Prediction Confidence</span>
              <span className="preference-description">
                Display confidence level for AI predictions
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.showPredictionConfidence}
                onChange={() => handleToggleChange('showPredictionConfidence')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Show Betting History</span>
              <span className="preference-description">
                Display your betting history on the profile page
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.showBettingHistory}
                onChange={() => handleToggleChange('showBettingHistory')}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Betting Section */}
        <div className="personalization-section">
          <h3>Betting Preferences</h3>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Risk Tolerance</span>
              <span className="preference-description">
                Set your preferred level of risk for betting recommendations
              </span>
            </div>
            <select
              value={preferences.riskTolerance}
              onChange={e => handleSelectChange('riskTolerance', e.target.value)}
              className="preference-select"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Odds Format</span>
              <span className="preference-description">
                Choose how odds are displayed throughout the app
              </span>
            </div>
            <select
              value={preferences.preferredOddsFormat}
              onChange={e => handleSelectChange('preferredOddsFormat', e.target.value)}
              className="preference-select"
            >
              <option value="american">American (+300)</option>
              <option value="decimal">Decimal (4.00)</option>
              <option value="fractional">Fractional (3/1)</option>
            </select>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="personalization-section">
          <h3>Privacy</h3>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Share Data for Better Predictions</span>
              <span className="preference-description">
                Allow us to use your betting history to improve predictions
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.shareDataForBetterPredictions}
                onChange={() => handleToggleChange('shareDataForBetterPredictions')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-name">Anonymous Usage Statistics</span>
              <span className="preference-description">
                Help us improve by sharing anonymous usage data
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.anonymousUsageStats}
                onChange={() => handleToggleChange('anonymousUsageStats')}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>

      <div className="personalization-panel-footer">
        <button className="cancel-button" onClick={onClose}>
          Cancel
        </button>
        <button className="save-button" onClick={handleSave}>
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default PersonalizationPanel;
