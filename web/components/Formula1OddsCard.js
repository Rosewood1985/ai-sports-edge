import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Badge, Tabs, Tab } from 'react-bootstrap';
import { 
  fetchF1RaceWinnerOdds, 
  fetchF1DriverChampionshipOdds, 
  fetchF1ConstructorChampionshipOdds,
  generateFanDuelDeepLink 
} from '../../public/sports-api-v5';

/**
 * Formula1OddsCard component for displaying Formula 1 odds
 * @param {Object} props - Component props
 * @param {string} props.raceId - Race ID (optional)
 * @param {string} props.oddsType - Odds type (race-winner, driver-championship, constructor-championship)
 * @param {boolean} props.showBetButton - Whether to show the bet button
 * @param {Function} props.onBetClick - Callback for bet button click
 * @returns {JSX.Element} Formula1OddsCard component
 */
const Formula1OddsCard = ({ 
  raceId, 
  oddsType = 'race-winner', 
  showBetButton = true, 
  onBetClick 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [odds, setOdds] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [activeOddsType, setActiveOddsType] = useState(oddsType);

  // Fetch odds data
  useEffect(() => {
    const fetchOddsData = async () => {
      try {
        setLoading(true);
        
        let oddsData;
        switch (activeOddsType) {
          case 'driver-championship':
            oddsData = await fetchF1DriverChampionshipOdds();
            break;
          case 'constructor-championship':
            oddsData = await fetchF1ConstructorChampionshipOdds();
            break;
          case 'race-winner':
          default:
            if (raceId) {
              // Fetch odds for a specific race
              const response = await fetch(`/api/odds/formula1/${raceId}`);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              oddsData = [await response.json()];
            } else {
              // Fetch all race winner odds
              oddsData = await fetchF1RaceWinnerOdds();
            }
            break;
        }
        
        setOdds(oddsData);
        
        // If there's only one race, select it
        if (oddsData.length === 1) {
          setSelectedRace(oddsData[0]);
        } else {
          setSelectedRace(null);
        }
        
        setError(null);
      } catch (err) {
        console.error(`Error fetching Formula 1 ${activeOddsType} odds:`, err);
        setError('Failed to load odds data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOddsData();
  }, [raceId, activeOddsType]);

  // Handle odds type change
  const handleOddsTypeChange = (type) => {
    setActiveOddsType(type);
  };

  // Handle race selection
  const handleRaceSelect = (race) => {
    setSelectedRace(race);
  };

  // Handle bet button click
  const handleBetClick = (driver, price) => {
    if (onBetClick) {
      onBetClick(selectedRace, driver, price);
    } else {
      // Generate FanDuel deep link
      const deepLink = generateFanDuelDeepLink({
        sport: 'f1',
        eventId: selectedRace?.id,
        betType: activeOddsType,
        team: driver,
      });
      
      // Open FanDuel in a new tab
      window.open(deepLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Get title based on odds type
  const getTitle = () => {
    switch (activeOddsType) {
      case 'driver-championship':
        return 'F1 Driver Championship Odds';
      case 'constructor-championship':
        return 'F1 Constructor Championship Odds';
      case 'race-winner':
      default:
        return 'F1 Race Winner Odds';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Card className="odds-card f1-odds-card">
        <Card.Header>
          <h5>{getTitle()}</h5>
          {!raceId && (
            <Tabs
              activeKey={activeOddsType}
              onSelect={handleOddsTypeChange}
              className="mb-3"
            >
              <Tab eventKey="race-winner" title="Race Winner" />
              <Tab eventKey="driver-championship" title="Driver Championship" />
              <Tab eventKey="constructor-championship" title="Constructor Championship" />
            </Tabs>
          )}
        </Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading odds data...</p>
        </Card.Body>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="odds-card f1-odds-card">
        <Card.Header>
          <h5>{getTitle()}</h5>
          {!raceId && (
            <Tabs
              activeKey={activeOddsType}
              onSelect={handleOddsTypeChange}
              className="mb-3"
            >
              <Tab eventKey="race-winner" title="Race Winner" />
              <Tab eventKey="driver-championship" title="Driver Championship" />
              <Tab eventKey="constructor-championship" title="Constructor Championship" />
            </Tabs>
          )}
        </Card.Header>
        <Card.Body className="text-center py-5">
          <div className="text-danger mb-3">
            <i className="fas fa-exclamation-circle fa-3x"></i>
          </div>
          <p>{error}</p>
          <Button 
            variant="outline-primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Card.Body>
      </Card>
    );
  }

  // Render empty state
  if (!odds || odds.length === 0) {
    return (
      <Card className="odds-card f1-odds-card">
        <Card.Header>
          <h5>{getTitle()}</h5>
          {!raceId && (
            <Tabs
              activeKey={activeOddsType}
              onSelect={handleOddsTypeChange}
              className="mb-3"
            >
              <Tab eventKey="race-winner" title="Race Winner" />
              <Tab eventKey="driver-championship" title="Driver Championship" />
              <Tab eventKey="constructor-championship" title="Constructor Championship" />
            </Tabs>
          )}
        </Card.Header>
        <Card.Body className="text-center py-5">
          <p>No odds data available at this time.</p>
        </Card.Body>
      </Card>
    );
  }

  // Render championship odds
  if (activeOddsType === 'driver-championship' || activeOddsType === 'constructor-championship') {
    return (
      <Card className="odds-card f1-odds-card">
        <Card.Header>
          <h5>{getTitle()}</h5>
          <Tabs
            activeKey={activeOddsType}
            onSelect={handleOddsTypeChange}
            className="mb-3"
          >
            <Tab eventKey="race-winner" title="Race Winner" />
            <Tab eventKey="driver-championship" title="Driver Championship" />
            <Tab eventKey="constructor-championship" title="Constructor Championship" />
          </Tabs>
        </Card.Header>
        <Card.Body>
          <div className="championship-odds">
            {odds.map((item) => {
              // For championship odds, we display all bookmakers and their odds
              return (
                <div key={item.id} className="championship-item">
                  <div className="bookmakers">
                    {item.bookmakers.map((bookmaker) => {
                      const marketData = bookmaker.markets.find(m => m.key === 'outrights');
                      
                      if (!marketData) return null;
                      
                      return (
                        <div key={bookmaker.name} className="bookmaker">
                          <div className="bookmaker-name">{bookmaker.name}</div>
                          <div className="outcomes">
                            {marketData.outcomes
                              .sort((a, b) => a.price - b.price) // Sort by odds (lowest first)
                              .map((outcome) => (
                                <div key={outcome.name} className="outcome">
                                  <div className="outcome-name">{outcome.name}</div>
                                  <div className="outcome-price">
                                    {outcome.price > 0 ? `+${outcome.price}` : outcome.price}
                                  </div>
                                  {showBetButton && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleBetClick(outcome.name, outcome.price)}
                                    >
                                      Bet Now
                                    </Button>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Render race winner odds
  return (
    <Card className="odds-card f1-odds-card">
      <Card.Header>
        <h5>{getTitle()}</h5>
        {!raceId && (
          <Tabs
            activeKey={activeOddsType}
            onSelect={handleOddsTypeChange}
            className="mb-3"
          >
            <Tab eventKey="race-winner" title="Race Winner" />
            <Tab eventKey="driver-championship" title="Driver Championship" />
            <Tab eventKey="constructor-championship" title="Constructor Championship" />
          </Tabs>
        )}
      </Card.Header>
      <Card.Body>
        {!selectedRace ? (
          // Race selection view
          <div className="race-list">
            {odds.map((race) => (
              <div 
                key={race.id} 
                className="race-item"
                onClick={() => handleRaceSelect(race)}
              >
                <div className="race-name">{race.homeTeam}</div>
                <div className="race-time">
                  {new Date(race.startTime).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Race odds view
          <div className="race-odds">
            <div className="race-header">
              <h6>{selectedRace.homeTeam}</h6>
              <div className="race-time">
                {new Date(selectedRace.startTime).toLocaleString()}
              </div>
              {odds.length > 1 && (
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setSelectedRace(null)}
                >
                  Back to all races
                </Button>
              )}
            </div>
            
            <div className="bookmakers">
              {selectedRace.bookmakers.map((bookmaker) => {
                const marketData = bookmaker.markets.find(m => m.key === 'h2h');
                
                if (!marketData) return null;
                
                return (
                  <div key={bookmaker.name} className="bookmaker">
                    <div className="bookmaker-name">{bookmaker.name}</div>
                    <div className="outcomes">
                      {marketData.outcomes
                        .sort((a, b) => a.price - b.price) // Sort by odds (lowest first)
                        .map((outcome) => (
                          <div key={outcome.name} className="outcome">
                            <div className="outcome-name">{outcome.name}</div>
                            <div className="outcome-price">
                              {outcome.price > 0 ? `+${outcome.price}` : outcome.price}
                            </div>
                            {showBetButton && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleBetClick(outcome.name, outcome.price)}
                              >
                                Bet Now
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default Formula1OddsCard;