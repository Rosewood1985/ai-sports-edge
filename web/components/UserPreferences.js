import React, { useState, useEffect } from 'react';

import geolocationService from '../../services/geolocationService';
import '../styles/user-preferences.css';

/**
 * User preferences component for customizing RSS feed content
 * @param {Object} props - Component props
 * @param {Object} props.preferences - Current user preferences
 * @param {Function} props.onSave - Function to call when preferences are saved
 * @param {Function} props.onClose - Function to call when modal is closed
 * @returns {JSX.Element} User preferences component
 */
const UserPreferences = ({ preferences = {}, onSave, onClose }) => {
  // Default preferences
  const defaultPreferences = {
    sports: [],
    bettingContentOnly: false,
    favoriteTeams: [],
    maxItems: 10,
    useLocation: true,
    localTeams: [],
    useESPN: true,
  };

  // Merge default preferences with user preferences
  const [userPrefs, setUserPrefs] = useState({ ...defaultPreferences, ...preferences });
  const [availableSports, setAvailableSports] = useState([
    'football',
    'basketball',
    'baseball',
    'hockey',
    'soccer',
    'mma',
    'formula1',
  ]);
  const [newTeam, setNewTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Load location data on mount
  useEffect(() => {
    const loadLocationData = async () => {
      if (userPrefs.useLocation) {
        try {
          setIsLoading(true);
          setLocationStatus('Detecting your location...');

          const location = await geolocationService.getUserLocation();

          if (location) {
            const teams = await geolocationService.getLocalTeams(location);

            setUserPrefs(prev => ({
              ...prev,
              localTeams: teams,
            }));

            setLocationStatus(`Location detected: ${location.city}, ${location.state}`);
          } else {
            setLocationStatus(
              'Unable to detect your location. You can still add your favorite teams manually.'
            );
          }
        } catch (error) {
          console.error('Error loading location data:', error);
          setLocationStatus('Error detecting location. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadLocationData();
  }, [userPrefs.useLocation]);

  /**
   * Handle sport selection change
   * @param {string} sport - Sport name
   */
  const handleSportChange = sport => {
    const updatedSports = userPrefs.sports.includes(sport)
      ? userPrefs.sports.filter(s => s !== sport)
      : [...userPrefs.sports, sport];

    setUserPrefs({ ...userPrefs, sports: updatedSports });
  };

  /**
   * Handle betting content toggle change
   */
  const handleBettingContentChange = () => {
    setUserPrefs({ ...userPrefs, bettingContentOnly: !userPrefs.bettingContentOnly });
  };

  /**
   * Handle location usage toggle change
   */
  const handleLocationChange = () => {
    setUserPrefs({ ...userPrefs, useLocation: !userPrefs.useLocation });
  };

  /**
   * Handle ESPN data usage toggle change
   */
  const handleESPNChange = () => {
    setUserPrefs({ ...userPrefs, useESPN: !userPrefs.useESPN });
  };

  /**
   * Handle max items change
   * @param {Event} e - Input change event
   */
  const handleMaxItemsChange = e => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setUserPrefs({ ...userPrefs, maxItems: value });
    }
  };

  /**
   * Add a new favorite team
   */
  const addFavoriteTeam = () => {
    if (newTeam.trim() && !userPrefs.favoriteTeams.includes(newTeam.trim())) {
      setUserPrefs({
        ...userPrefs,
        favoriteTeams: [...userPrefs.favoriteTeams, newTeam.trim()],
      });
      setNewTeam('');
    }
  };

  /**
   * Remove a favorite team
   * @param {string} team - Team to remove
   */
  const removeFavoriteTeam = team => {
    setUserPrefs({
      ...userPrefs,
      favoriteTeams: userPrefs.favoriteTeams.filter(t => t !== team),
    });
  };

  /**
   * Save preferences and close modal
   */
  const savePreferences = () => {
    if (onSave) {
      onSave(userPrefs);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="user-preferences-container">
      <div className="user-preferences-header">
        <h2>News Feed Preferences</h2>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="user-preferences-content">
        <div className="preferences-section">
          <h3>Sports Categories</h3>
          <div className="sports-options">
            {availableSports.map(sport => (
              <label key={sport} className="sport-option">
                <input
                  type="checkbox"
                  checked={userPrefs.sports.includes(sport)}
                  onChange={() => handleSportChange(sport)}
                />
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="preferences-section">
          <h3>Content Filtering</h3>
          <label className="betting-option">
            <input
              type="checkbox"
              checked={userPrefs.bettingContentOnly}
              onChange={handleBettingContentChange}
            />
            Show only betting-related content
          </label>

          <div className="max-items">
            <label>
              Maximum number of news items:
              <input
                type="number"
                min="1"
                max="50"
                value={userPrefs.maxItems}
                onChange={handleMaxItemsChange}
              />
            </label>
          </div>
        </div>

        <div className="preferences-section">
          <h3>Favorite Teams</h3>
          <div className="add-team">
            <input
              type="text"
              value={newTeam}
              onChange={e => setNewTeam(e.target.value)}
              placeholder="Enter team name"
            />
            <button onClick={addFavoriteTeam}>Add</button>
          </div>

          {userPrefs.favoriteTeams.length > 0 ? (
            <ul className="favorite-teams-list">
              {userPrefs.favoriteTeams.map(team => (
                <li key={team}>
                  {team}
                  <button onClick={() => removeFavoriteTeam(team)}>Remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-teams">No favorite teams added yet.</p>
          )}
        </div>

        <div className="preferences-section">
          <h3>Location Settings</h3>

          <label className="location-option">
            <input
              type="checkbox"
              checked={userPrefs.useLocation}
              onChange={handleLocationChange}
            />
            Use my location to personalize content
          </label>

          {userPrefs.useLocation && (
            <div className="location-status">
              {isLoading ? <div className="loading-spinner" /> : <p>{locationStatus}</p>}

              {userPrefs.localTeams.length > 0 && (
                <div className="local-teams">
                  <p>We've identified these local teams:</p>
                  <ul>
                    {userPrefs.localTeams.map(team => (
                      <li key={team}>{team}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="privacy-notice">
            <p>
              <strong>Privacy Notice:</strong> Your location data is used only to personalize your
              news feed with local team content. We do not store your precise location or share it
              with third parties. You can opt out at any time by unchecking the box above.
            </p>
          </div>
        </div>

        <div className="preferences-section">
          <h3>ESPN Integration</h3>

          <label className="espn-option">
            <input type="checkbox" checked={userPrefs.useESPN} onChange={handleESPNChange} />
            Show ESPN calculated odds in news ticker
          </label>

          <div className="espn-info">
            <p>
              When enabled, the news ticker will display calculated odds based on ESPN data for your
              selected sports. This provides additional betting insights powered by ESPN's
              statistics.
            </p>
          </div>
        </div>
      </div>

      <div className="user-preferences-footer">
        <button className="save-button" onClick={savePreferences}>
          Save Preferences
        </button>
        <button className="cancel-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UserPreferences;
