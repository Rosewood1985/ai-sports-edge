import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import OddsButton from '../components/OddsButton';
import '../styles/odds.css';

const OddsPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('user123'); // In a real app, this would come from authentication

  // Fetch games data
  useEffect(() => {
    const fetchGames = async () => {
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use mock data
        const mockGames = [
          {
            id: 'game1',
            homeTeam: 'Kansas City Chiefs',
            awayTeam: 'San Francisco 49ers',
            homeScore: 24,
            awayScore: 17,
            startTime: new Date(Date.now() + 86400000), // Tomorrow
            sport: 'NFL',
            odds: { home: -3.5, away: 3.5, over: 49.5, under: 49.5 },
            fanduelEventId: 'nfl_chiefs_49ers_2025'
          },
          {
            id: 'game2',
            homeTeam: 'Los Angeles Lakers',
            awayTeam: 'Boston Celtics',
            homeScore: 112,
            awayScore: 108,
            startTime: new Date(Date.now() + 172800000), // Day after tomorrow
            sport: 'NBA',
            odds: { home: -2.5, away: 2.5, over: 220.5, under: 220.5 },
            fanduelEventId: 'nba_lakers_celtics_2025'
          },
          {
            id: 'game3',
            homeTeam: 'New York Yankees',
            awayTeam: 'Boston Red Sox',
            homeScore: 5,
            awayScore: 3,
            startTime: new Date(Date.now() + 259200000), // 3 days from now
            sport: 'MLB',
            odds: { home: -1.5, away: 1.5, over: 8.5, under: 8.5 },
            fanduelEventId: 'mlb_yankees_redsox_2025'
          }
        ];
        
        setGames(mockGames);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching games:', error);
        setLoading(false);
      }
    };
    
    fetchGames();
  }, []);

  // Handle successful purchase
  const handlePurchaseSuccess = (gameId) => {
    console.log(`Successfully purchased odds for game ${gameId}`);
    // In a real app, you might update the UI or show a notification
  };

  return (
    <>
      <Helmet>
        <title>Live Odds - AI Sports Edge</title>
        <meta name="description" content="Get the latest odds and predictions for upcoming games. Purchase AI-powered insights to improve your betting strategy." />
        <meta name="keywords" content="sports odds, betting predictions, AI predictions, sports betting" />
        <link rel="canonical" href="https://aisportsedge.app/odds" />
      </Helmet>
      
      <section className="odds-hero">
        <div className="container">
          <div className="odds-hero-content">
            <h1>Live Odds & Predictions</h1>
            <p>Get AI-powered insights for upcoming games. Purchase odds to see our detailed predictions and analysis.</p>
          </div>
        </div>
      </section>
      
      <section className="odds-main">
        <div className="container">
          {loading ? (
            <div className="loading-indicator">Loading games...</div>
          ) : (
            <div className="games-grid">
              {games.map(game => (
                <div key={game.id} className="game-card">
                  <div className="game-header">
                    <span className="game-sport">{game.sport}</span>
                    <span className="game-time">{game.startTime.toLocaleString()}</span>
                  </div>
                  
                  <div className="game-teams">
                    <div className="team home">
                      <span className="team-name">{game.homeTeam}</span>
                      <span className="team-score">{game.homeScore}</span>
                    </div>
                    <div className="vs">VS</div>
                    <div className="team away">
                      <span className="team-name">{game.awayTeam}</span>
                      <span className="team-score">{game.awayScore}</span>
                    </div>
                  </div>
                  
                  <div className="game-odds">
                    <div className="odds-item">
                      <span className="odds-label">Spread:</span>
                      <span className="odds-value">{game.homeTeam} {game.odds.home}</span>
                    </div>
                    <div className="odds-item">
                      <span className="odds-label">Total:</span>
                      <span className="odds-value">O/U {game.odds.over}</span>
                    </div>
                  </div>
                  
                  <div className="game-actions">
                    <OddsButton
                      game={game}
                      userId={userId}
                      hasPurchasedOdds={false} // In a real app, this would be fetched from the server
                      onPurchaseSuccess={() => handlePurchaseSuccess(game.id)}
                      size="medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      <section className="odds-cta">
        <div className="container">
          <h2>Want More Predictions?</h2>
          <p>Download our mobile app for comprehensive coverage and advanced features.</p>
          <a href="/download" className="button primary-button">Download App</a>
        </div>
      </section>
    </>
  );
};

export default OddsPage;