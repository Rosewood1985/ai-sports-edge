import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';

import { getUserRssPreferences, saveUserRssPreferences } from '../../public/sports-api';

/**
 * RSS Preferences Modal Component
 *
 * Allows users to customize their RSS feed preferences:
 * - Enable/disable specific sports feeds
 * - Set maximum number of news items
 * - Configure refresh interval
 * - Add keyword filters (include/exclude)
 */
const RssPreferencesModal = ({ show, onHide }) => {
  // State for preferences
  const [preferences, setPreferences] = useState({
    enabledSources: [],
    maxItems: 10,
    refreshIntervalMinutes: 30,
    keywordFilters: {
      include: [],
      exclude: [],
    },
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // New keyword state
  const [newKeyword, setNewKeyword] = useState('');
  const [keywordType, setKeywordType] = useState('include');

  // Available sports sources
  const availableSources = [
    { id: 'NBA', name: 'NBA Basketball' },
    { id: 'NFL', name: 'NFL Football' },
    { id: 'MLB', name: 'MLB Baseball' },
    { id: 'NHL', name: 'NHL Hockey' },
    { id: 'F1', name: 'Formula 1' },
    { id: 'UFC', name: 'UFC / MMA' },
    { id: 'SOCCER', name: 'Soccer' },
    { id: 'TENNIS', name: 'Tennis' },
  ];

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      setError(null);

      try {
        const prefs = await getUserRssPreferences();

        if (prefs) {
          setPreferences(prefs);
        }
      } catch (err) {
        setError('Failed to load preferences. Please try again.');
        console.error('Error loading preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      loadPreferences();
    }
  }, [show]);

  // Handle source toggle
  const handleSourceToggle = sourceId => {
    setPreferences(prev => {
      const isEnabled = prev.enabledSources.includes(sourceId);

      return {
        ...prev,
        enabledSources: isEnabled
          ? prev.enabledSources.filter(id => id !== sourceId)
          : [...prev.enabledSources, sourceId],
      };
    });
  };

  // Handle max items change
  const handleMaxItemsChange = e => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setPreferences(prev => ({
        ...prev,
        maxItems: value,
      }));
    }
  };

  // Handle refresh interval change
  const handleRefreshIntervalChange = e => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setPreferences(prev => ({
        ...prev,
        refreshIntervalMinutes: value,
      }));
    }
  };

  // Add keyword filter
  const handleAddKeyword = e => {
    e.preventDefault();

    if (!newKeyword.trim()) return;

    setPreferences(prev => ({
      ...prev,
      keywordFilters: {
        ...prev.keywordFilters,
        [keywordType]: [...prev.keywordFilters[keywordType], newKeyword.trim().toLowerCase()],
      },
    }));

    setNewKeyword('');
  };

  // Remove keyword filter
  const handleRemoveKeyword = (keyword, type) => {
    setPreferences(prev => ({
      ...prev,
      keywordFilters: {
        ...prev.keywordFilters,
        [type]: prev.keywordFilters[type].filter(k => k !== keyword),
      },
    }));
  };

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const success = await saveUserRssPreferences(preferences);

      if (success) {
        setSuccess(true);
        setTimeout(() => {
          onHide();
          setSuccess(false);
        }, 1500);
      } else {
        setError('Failed to save preferences. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while saving preferences.');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>RSS Feed Preferences</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading preferences...</p>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="danger" onClose={() => setError(null)} dismissible>
                {error}
              </Alert>
            )}

            {success && <Alert variant="success">Preferences saved successfully!</Alert>}

            <Form>
              {/* Sports Sources */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Sports Sources</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {availableSources.map(source => (
                    <Form.Check
                      key={source.id}
                      type="switch"
                      id={`source-${source.id}`}
                      label={source.name}
                      checked={preferences.enabledSources.includes(source.id)}
                      onChange={() => handleSourceToggle(source.id)}
                      className="me-3"
                    />
                  ))}
                </div>
              </Form.Group>

              {/* Display Settings */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Display Settings</Form.Label>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Label>Maximum News Items</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="50"
                      value={preferences.maxItems}
                      onChange={handleMaxItemsChange}
                    />
                    <Form.Text className="text-muted">
                      Maximum number of news items to display
                    </Form.Text>
                  </div>

                  <div className="col-md-6">
                    <Form.Label>Refresh Interval (minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="5"
                      max="120"
                      value={preferences.refreshIntervalMinutes}
                      onChange={handleRefreshIntervalChange}
                    />
                    <Form.Text className="text-muted">How often to refresh the news feed</Form.Text>
                  </div>
                </div>
              </Form.Group>

              {/* Keyword Filters */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Keyword Filters</Form.Label>

                {/* Add Keyword Form */}
                <div className="d-flex mb-3">
                  <Form.Select
                    value={keywordType}
                    onChange={e => setKeywordType(e.target.value)}
                    className="me-2"
                    style={{ width: '120px' }}
                  >
                    <option value="include">Include</option>
                    <option value="exclude">Exclude</option>
                  </Form.Select>

                  <Form.Control
                    type="text"
                    placeholder="Enter keyword"
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    className="me-2"
                  />

                  <Button
                    variant="outline-primary"
                    onClick={handleAddKeyword}
                    disabled={!newKeyword.trim()}
                  >
                    Add
                  </Button>
                </div>

                {/* Include Keywords */}
                <div className="mb-3">
                  <Form.Label>Include Keywords</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {preferences.keywordFilters.include.length === 0 ? (
                      <span className="text-muted">No include filters</span>
                    ) : (
                      preferences.keywordFilters.include.map(keyword => (
                        <Badge
                          key={`include-${keyword}`}
                          bg="success"
                          className="d-flex align-items-center p-2"
                        >
                          {keyword}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 ms-2 text-white"
                            onClick={() => handleRemoveKeyword(keyword, 'include')}
                          >
                            &times;
                          </Button>
                        </Badge>
                      ))
                    )}
                  </div>
                  <Form.Text className="text-muted">
                    Only show news containing these keywords
                  </Form.Text>
                </div>

                {/* Exclude Keywords */}
                <div>
                  <Form.Label>Exclude Keywords</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {preferences.keywordFilters.exclude.length === 0 ? (
                      <span className="text-muted">No exclude filters</span>
                    ) : (
                      preferences.keywordFilters.exclude.map(keyword => (
                        <Badge
                          key={`exclude-${keyword}`}
                          bg="danger"
                          className="d-flex align-items-center p-2"
                        >
                          {keyword}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 ms-2 text-white"
                            onClick={() => handleRemoveKeyword(keyword, 'exclude')}
                          >
                            &times;
                          </Button>
                        </Badge>
                      ))
                    )}
                  </div>
                  <Form.Text className="text-muted">Hide news containing these keywords</Form.Text>
                </div>
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading || saving}>
          {saving ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RssPreferencesModal;
