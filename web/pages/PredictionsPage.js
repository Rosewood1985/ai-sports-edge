/**
 * Predictions Page
 * Displays predictions from the ML Sports Edge API
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Tab, Spinner, Alert, Form } from 'react-bootstrap';
import MLPredictionCard from '../components/MLPredictionCard';
import {
  getGamePredictions,
  getPredictionsBySport,
  getTrendingPredictions
} from '../services/MLPredictionService';
import '../styles/predictions.css';

const PredictionsPage = () => {
  const [activeTab, setActiveTab] = useState('trending');
  const [predictions, setPredictions] = useState({
    trending: [],
    nba: [],
    mlb: [],
    nhl: [],
    ncaa: [],
    formula1: [],
    ufc: []
  });
  const [loading, setLoading] = useState({
    trending: false,
    nba: false,
    mlb: false,
    nhl: false,
    ncaa: false,
    formula1: false,
    ufc: false
  });
  const [error, setError] = useState({
    trending: null,
    nba: null,
    mlb: null,
    nhl: null,
    ncaa: null,
    formula1: null,
    ufc: null
  });
  const [detailedView, setDetailedView] = useState(false);
  
  // Load predictions for the active tab
  useEffect(() => {
    loadPredictions(activeTab);
  }, [activeTab]);
  
  // Load predictions for a specific tab
  const loadPredictions = async (tab) => {
    // Skip if already loaded
    if (predictions[tab].length > 0) {
      return;
    }
    
    // Set loading state
    setLoading(prevState => ({ ...prevState, [tab]: true }));
    setError(prevState => ({ ...prevState, [tab]: null }));
    
    try {
      let data = [];
      
      switch (tab) {
        case 'trending':
          data = await getTrendingPredictions();
          break;
        case 'nba':
          data = await getGamePredictions({ sport: 'NBA' });
          break;
        case 'mlb':
          data = await getGamePredictions({ sport: 'MLB' });
          break;
        case 'nhl':
          data = await getGamePredictions({ sport: 'NHL' });
          break;
        case 'ncaa':
          data = await getPredictionsBySport('NCAA_MENS');
          break;
        case 'formula1':
          data = await getPredictionsBySport('FORMULA1');
          break;
        case 'ufc':
          data = await getPredictionsBySport('UFC');
          break;
        default:
          data = [];
      }
      
      // Update predictions
      setPredictions(prevState => ({ ...prevState, [tab]: data }));
    } catch (err) {
      console.error(`Error loading ${tab} predictions:`, err);
      setError(prevState => ({ 
        ...prevState, 
        [tab]: 'Failed to load predictions. Please try again later.' 
      }));
    } finally {
      setLoading(prevState => ({ ...prevState, [tab]: false }));
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle feedback submission
  const handleFeedback = (feedback) => {
    console.log('Feedback submitted:', feedback);
    // In a real app, you might want to update the UI or refresh the predictions
  };
  
  // Determine prediction type based on tab and prediction
  const getPredictionType = (tab, prediction) => {
    if (tab === 'formula1') return 'race';
    if (tab === 'ufc') return 'fight';
    if (prediction.id?.startsWith('player')) return 'player';
    return 'game';
  };
  
  // Render loading spinner
  const renderLoading = () => (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-2">Loading predictions...</p>
    </div>
  );
  
  // Render error message
  const renderError = (message) => (
    <Alert variant="danger" className="my-3">
      <Alert.Heading>Error</Alert.Heading>
      <p>{message}</p>
    </Alert>
  );
  
  // Render predictions
  const renderPredictions = (tab) => {
    if (loading[tab]) {
      return renderLoading();
    }
    
    if (error[tab]) {
      return renderError(error[tab]);
    }
    
    if (predictions[tab].length === 0) {
      return (
        <Alert variant="info" className="my-3">
          <p className="mb-0">No predictions available for this category.</p>
        </Alert>
      );
    }
    
    return (
      <Row>
        {predictions[tab].map((prediction, index) => (
          <Col md={6} lg={4} key={prediction.id || index}>
            <MLPredictionCard
              prediction={prediction}
              type={getPredictionType(tab, prediction)}
              detailed={detailedView}
              onFeedback={handleFeedback}
            />
          </Col>
        ))}
      </Row>
    );
  };
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">AI Sports Predictions</h1>
      
      <div className="d-flex justify-content-end mb-3">
        <Form.Check
          type="switch"
          id="detailed-view-switch"
          label="Detailed View"
          checked={detailedView}
          onChange={(e) => setDetailedView(e.target.checked)}
        />
      </div>
      
      <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
        <Row>
          <Col md={3}>
            <Nav variant="pills" className="flex-column mb-4">
              <Nav.Item>
                <Nav.Link eventKey="trending">
                  Trending Predictions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="nba">NBA</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="mlb">MLB</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="nhl">NHL</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="ncaa">NCAA Basketball</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="formula1">Formula 1</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="ufc">UFC</Nav.Link>
              </Nav.Item>
            </Nav>
            
            <div className="bg-light p-3 rounded mb-4">
              <h5>About AI Predictions</h5>
              <p className="small text-muted">
                Our AI-powered predictions use machine learning models trained on data from multiple sports APIs. 
                The confidence level indicates how strongly the model believes in the prediction.
              </p>
              <p className="small text-muted">
                These predictions are for informational purposes only. Please gamble responsibly.
              </p>
            </div>
          </Col>
          
          <Col md={9}>
            <Tab.Content>
              <Tab.Pane eventKey="trending">
                <h2 className="mb-3">Trending Predictions</h2>
                <p className="text-muted mb-4">
                  Our highest confidence predictions across all sports.
                </p>
                {renderPredictions('trending')}
              </Tab.Pane>
              
              <Tab.Pane eventKey="nba">
                <h2 className="mb-3">NBA Predictions</h2>
                <p className="text-muted mb-4">
                  Predictions for upcoming NBA games.
                </p>
                {renderPredictions('nba')}
              </Tab.Pane>
              
              <Tab.Pane eventKey="mlb">
                <h2 className="mb-3">MLB Predictions</h2>
                <p className="text-muted mb-4">
                  Predictions for upcoming MLB games.
                </p>
                {renderPredictions('mlb')}
              </Tab.Pane>
              
              <Tab.Pane eventKey="nhl">
                <h2 className="mb-3">NHL Predictions</h2>
                <p className="text-muted mb-4">
                  Predictions for upcoming NHL games.
                </p>
                {renderPredictions('nhl')}
              </Tab.Pane>
              
              <Tab.Pane eventKey="ncaa">
                <h2 className="mb-3">NCAA Basketball Predictions</h2>
                <p className="text-muted mb-4">
                  Predictions for upcoming NCAA basketball games.
                </p>
                {renderPredictions('ncaa')}
              </Tab.Pane>
              
              <Tab.Pane eventKey="formula1">
                <h2 className="mb-3">Formula 1 Predictions</h2>
                <p className="text-muted mb-4">
                  Predictions for upcoming Formula 1 races.
                </p>
                {renderPredictions('formula1')}
              </Tab.Pane>
              
              <Tab.Pane eventKey="ufc">
                <h2 className="mb-3">UFC Predictions</h2>
                <p className="text-muted mb-4">
                  Predictions for upcoming UFC fights.
                </p>
                {renderPredictions('ufc')}
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default PredictionsPage;