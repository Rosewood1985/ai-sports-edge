import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';

import { fetchWnbaOdds, generateFanDuelDeepLink } from '../../public/sports-api-v5';

/**
 * WnbaOddsCard component for displaying WNBA odds
 * @param {Object} props - Component props
 * @param {string} props.gameId - Game ID (optional)
 * @param {string} props.market - Market type (moneyline, spread, total)
 * @param {boolean} props.showBetButton - Whether to show the bet button
 * @param {Function} props.onBetClick - Callback for bet button click
 * @returns {JSX.Element} WnbaOddsCard component
 */
const WnbaOddsCard = ({ gameId, market = 'moneyline', showBetButton = true, onBetClick }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [odds, setOdds] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  // Fetch odds data
  useEffect(() => {
    const fetchOddsData = async () => {
      try {
        setLoading(true);

        let oddsData;
        if (gameId) {
          // Fetch odds for a specific game
          const response = await fetch(`/api/odds/wnba/${gameId}?market=${market}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          oddsData = [await response.json()];
        } else {
          // Fetch all WNBA odds
          oddsData = await fetchWnbaOdds(market);
        }

        setOdds(oddsData);

        // If there's only one game, select it
        if (oddsData.length === 1) {
          setSelectedGame(oddsData[0]);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching WNBA odds:', err);
        setError('Failed to load odds data');
      } finally {
        setLoading(false);
      }
    };

    fetchOddsData();
  }, [gameId, market]);

  // Handle game selection
  const handleGameSelect = game => {
    setSelectedGame(game);
  };

  // Handle bet button click
  const handleBetClick = (team, price) => {
    if (onBetClick) {
      onBetClick(selectedGame, team, price);
    } else {
      // Generate FanDuel deep link
      const deepLink = generateFanDuelDeepLink({
        sport: 'wnba',
        eventId: selectedGame.id,
        betType: market,
        team,
      });

      // Open FanDuel in a new tab
      window.open(deepLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Card className="odds-card wnba-odds-card">
        <Card.Header>
          <h5>WNBA Odds</h5>
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
      <Card className="odds-card wnba-odds-card">
        <Card.Header>
          <h5>WNBA Odds</h5>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <div className="text-danger mb-3">
            <i className="fas fa-exclamation-circle fa-3x" />
          </div>
          <p>{error}</p>
          <Button variant="outline-primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card.Body>
      </Card>
    );
  }

  // Render empty state
  if (!odds || odds.length === 0) {
    return (
      <Card className="odds-card wnba-odds-card">
        <Card.Header>
          <h5>WNBA Odds</h5>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <p>No odds data available at this time.</p>
        </Card.Body>
      </Card>
    );
  }

  // Render odds data
  return (
    <Card className="odds-card wnba-odds-card">
      <Card.Header>
        <h5>WNBA Odds</h5>
        <div className="market-selector">
          <Badge
            bg={market === 'moneyline' ? 'primary' : 'secondary'}
            className="market-badge"
            onClick={() => (window.location.search = `?market=moneyline`)}
          >
            Moneyline
          </Badge>
          <Badge
            bg={market === 'spread' ? 'primary' : 'secondary'}
            className="market-badge"
            onClick={() => (window.location.search = `?market=spread`)}
          >
            Spread
          </Badge>
          <Badge
            bg={market === 'total' ? 'primary' : 'secondary'}
            className="market-badge"
            onClick={() => (window.location.search = `?market=total`)}
          >
            Total
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {!selectedGame ? (
          // Game selection view
          <div className="game-list">
            {odds.map(game => (
              <div key={game.id} className="game-item" onClick={() => handleGameSelect(game)}>
                <div className="game-teams">
                  <div className="team home-team">{game.homeTeam}</div>
                  <div className="vs">vs</div>
                  <div className="team away-team">{game.awayTeam}</div>
                </div>
                <div className="game-time">{new Date(game.startTime).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          // Game odds view
          <div className="game-odds">
            <div className="game-header">
              <h6>
                {selectedGame.homeTeam} vs {selectedGame.awayTeam}
              </h6>
              <div className="game-time">{new Date(selectedGame.startTime).toLocaleString()}</div>
              {odds.length > 1 && (
                <Button variant="link" size="sm" onClick={() => setSelectedGame(null)}>
                  Back to all games
                </Button>
              )}
            </div>

            <div className="bookmakers">
              {selectedGame.bookmakers.map(bookmaker => {
                const marketData = bookmaker.markets.find(
                  m => m.key === (market === 'moneyline' ? 'h2h' : market)
                );

                if (!marketData) return null;

                return (
                  <div key={bookmaker.name} className="bookmaker">
                    <div className="bookmaker-name">{bookmaker.name}</div>
                    <div className="outcomes">
                      {marketData.outcomes.map(outcome => (
                        <div key={outcome.name} className="outcome">
                          <div className="outcome-name">{outcome.name}</div>
                          <div className="outcome-price">
                            {outcome.price > 0 ? `+${outcome.price}` : outcome.price}
                            {outcome.point !== undefined &&
                              ` (${outcome.point > 0 ? '+' : ''}${outcome.point})`}
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

export default WnbaOddsCard;
