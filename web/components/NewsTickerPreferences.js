import React, { useState, useEffect } from 'react';
import {
  getAvailableSportsCategories,
  getEnabledSportsSources,
  setEnabledSportsSources,
  getKeywordFilters,
  addKeywordFilter,
  removeKeywordFilter,
  getNewsTickerSettings,
  updateNewsTickerSettings
} from '../../utils/userPreferencesService';

/**
 * NewsTickerPreferences component for customizing news ticker settings
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to call when preferences are closed
 * @returns {JSX.Element} The NewsTickerPreferences component
 */
const NewsTickerPreferences = ({ onClose }) => {
  // State for sports categories
  const [availableCategories, setAvailableCategories] = useState([]);
  const [enabledCategories, setEnabledCategories] = useState([]);
  
  // State for keyword filters
  const [includeKeywords, setIncludeKeywords] = useState([]);
  const [excludeKeywords, setExcludeKeywords] = useState([]);
  const [newIncludeKeyword, setNewIncludeKeyword] = useState('');
  const [newExcludeKeyword, setNewExcludeKeyword] = useState('');
  
  // State for ticker settings
  const [tickerSettings, setTickerSettings] = useState({
    enabled: true,
    scrollSpeed: 'medium',
    pauseOnHover: true
  });
  
  // Load preferences on component mount
  useEffect(() => {
    // Load available categories
    const categories = getAvailableSportsCategories();
    setAvailableCategories(categories);
    
    // Load enabled categories
    const enabled = getEnabledSportsSources();
    setEnabledCategories(enabled);
    
    // Load keyword filters
    const includeFilters = getKeywordFilters('include');
    const excludeFilters = getKeywordFilters('exclude');
    setIncludeKeywords(includeFilters);
    setExcludeKeywords(excludeFilters);
    
    // Load ticker settings
    const settings = getNewsTickerSettings();
    setTickerSettings(settings);
  }, []);
  
  // Handle category toggle
  const handleCategoryToggle = (categoryId) => {
    let updatedCategories;
    
    if (enabledCategories.includes(categoryId)) {
      // Remove category if already enabled
      updatedCategories = enabledCategories.filter(id => id !== categoryId);
    } else {
      // Add category if not enabled
      updatedCategories = [...enabledCategories, categoryId];
    }
    
    // Update state
    setEnabledCategories(updatedCategories);
    
    // Save to preferences
    setEnabledSportsSources(updatedCategories);
  };
  
  // Handle adding include keyword
  const handleAddIncludeKeyword = (e) => {
    e.preventDefault();
    
    if (newIncludeKeyword.trim()) {
      // Add keyword
      addKeywordFilter(newIncludeKeyword.trim(), 'include');
      
      // Update state
      setIncludeKeywords([...includeKeywords, newIncludeKeyword.trim()]);
      setNewIncludeKeyword('');
    }
  };
  
  // Handle removing include keyword
  const handleRemoveIncludeKeyword = (keyword) => {
    // Remove keyword
    removeKeywordFilter(keyword, 'include');
    
    // Update state
    setIncludeKeywords(includeKeywords.filter(k => k !== keyword));
  };
  
  // Handle adding exclude keyword
  const handleAddExcludeKeyword = (e) => {
    e.preventDefault();
    
    if (newExcludeKeyword.trim()) {
      // Add keyword
      addKeywordFilter(newExcludeKeyword.trim(), 'exclude');
      
      // Update state
      setExcludeKeywords([...excludeKeywords, newExcludeKeyword.trim()]);
      setNewExcludeKeyword('');
    }
  };
  
  // Handle removing exclude keyword
  const handleRemoveExcludeKeyword = (keyword) => {
    // Remove keyword
    removeKeywordFilter(keyword, 'exclude');
    
    // Update state
    setExcludeKeywords(excludeKeywords.filter(k => k !== keyword));
  };
  
  // Handle ticker setting change
  const handleTickerSettingChange = (setting, value) => {
    // Update state
    const updatedSettings = {
      ...tickerSettings,
      [setting]: value
    };
    setTickerSettings(updatedSettings);
    
    // Save to preferences
    updateNewsTickerSettings(updatedSettings);
  };
  
  return (
    <div className="news-ticker-preferences">
      <div className="preferences-header">
        <h2>News Ticker Preferences</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="preferences-content">
        {/* Sports Categories Section */}
        <section className="preferences-section">
          <h3>Sports Categories</h3>
          <p className="section-description">Select which sports categories you want to see in the news ticker.</p>
          
          <div className="categories-grid">
            {availableCategories.map(category => (
              <div 
                key={category.id}
                className={`category-item ${enabledCategories.includes(category.id) ? 'enabled' : ''}`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-checkbox">
                  <input 
                    type="checkbox" 
                    checked={enabledCategories.includes(category.id)}
                    onChange={() => {}} // Handled by onClick on the div
                    readOnly
                  />
                </span>
              </div>
            ))}
          </div>
        </section>
        
        {/* Keyword Filters Section */}
        <section className="preferences-section">
          <h3>Keyword Filters</h3>
          <p className="section-description">
            Add keywords to filter news items. Include filters will only show items containing these keywords.
            Exclude filters will hide items containing these keywords.
          </p>
          
          {/* Include Keywords */}
          <div className="keyword-filter-section">
            <h4>Include Keywords</h4>
            <form onSubmit={handleAddIncludeKeyword} className="keyword-form">
              <input
                type="text"
                value={newIncludeKeyword}
                onChange={(e) => setNewIncludeKeyword(e.target.value)}
                placeholder="Add keyword to include..."
                className="keyword-input"
              />
              <button type="submit" className="keyword-add-button">Add</button>
            </form>
            
            <div className="keyword-list">
              {includeKeywords.length === 0 ? (
                <p className="no-keywords">No include keywords added yet.</p>
              ) : (
                includeKeywords.map((keyword, index) => (
                  <div key={index} className="keyword-tag">
                    <span className="keyword-text">{keyword}</span>
                    <button 
                      className="keyword-remove-button"
                      onClick={() => handleRemoveIncludeKeyword(keyword)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Exclude Keywords */}
          <div className="keyword-filter-section">
            <h4>Exclude Keywords</h4>
            <form onSubmit={handleAddExcludeKeyword} className="keyword-form">
              <input
                type="text"
                value={newExcludeKeyword}
                onChange={(e) => setNewExcludeKeyword(e.target.value)}
                placeholder="Add keyword to exclude..."
                className="keyword-input"
              />
              <button type="submit" className="keyword-add-button">Add</button>
            </form>
            
            <div className="keyword-list">
              {excludeKeywords.length === 0 ? (
                <p className="no-keywords">No exclude keywords added yet.</p>
              ) : (
                excludeKeywords.map((keyword, index) => (
                  <div key={index} className="keyword-tag">
                    <span className="keyword-text">{keyword}</span>
                    <button 
                      className="keyword-remove-button"
                      onClick={() => handleRemoveExcludeKeyword(keyword)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        
        {/* Ticker Settings Section */}
        <section className="preferences-section">
          <h3>Ticker Settings</h3>
          
          <div className="setting-item">
            <label htmlFor="ticker-enabled">
              <input
                id="ticker-enabled"
                type="checkbox"
                checked={tickerSettings.enabled}
                onChange={(e) => handleTickerSettingChange('enabled', e.target.checked)}
              />
              <span>Enable News Ticker</span>
            </label>
          </div>
          
          <div className="setting-item">
            <label htmlFor="ticker-pause-hover">
              <input
                id="ticker-pause-hover"
                type="checkbox"
                checked={tickerSettings.pauseOnHover}
                onChange={(e) => handleTickerSettingChange('pauseOnHover', e.target.checked)}
              />
              <span>Pause on Hover</span>
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <span>Scroll Speed:</span>
              <select
                value={tickerSettings.scrollSpeed}
                onChange={(e) => handleTickerSettingChange('scrollSpeed', e.target.value)}
              >
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </label>
          </div>
        </section>
      </div>
      
      <div className="preferences-footer">
        <button className="save-button" onClick={onClose}>Done</button>
      </div>
    </div>
  );
};

export default NewsTickerPreferences;