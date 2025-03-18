import React from 'react';

/**
 * NewsTicker component that displays a scrolling ticker of sports events
 * @returns {JSX.Element} The NewsTicker component
 */
const NewsTicker = () => {
  // Sample sports events data
  // In a real app, this would be fetched from an API
  const sportsEvents = [
    { id: 1, date: 'MAR 18', teams: 'Lakers vs. Nuggets', time: '7:30 PM ET', sport: 'NBA' },
    { id: 2, date: 'MAR 18', teams: 'Celtics vs. Bucks', time: '8:00 PM ET', sport: 'NBA' },
    { id: 3, date: 'MAR 19', teams: 'Chiefs vs. Ravens', time: '1:00 PM ET', sport: 'NFL' },
    { id: 4, date: 'MAR 19', teams: 'Cowboys vs. Eagles', time: '4:25 PM ET', sport: 'NFL' },
    { id: 5, date: 'MAR 20', teams: 'Yankees vs. Red Sox', time: '7:05 PM ET', sport: 'MLB' },
    { id: 6, date: 'MAR 20', teams: 'Dodgers vs. Giants', time: '10:10 PM ET', sport: 'MLB' },
    { id: 7, date: 'MAR 21', teams: 'Ferrari vs. Mercedes', time: '8:00 AM ET', sport: 'F1' },
    { id: 8, date: 'MAR 22', teams: 'McGregor vs. Poirier', time: '10:00 PM ET', sport: 'UFC' },
    { id: 9, date: 'MAR 23', teams: 'Man City vs. Liverpool', time: '11:30 AM ET', sport: 'Soccer' },
    { id: 10, date: 'MAR 24', teams: 'Avalanche vs. Lightning', time: '7:00 PM ET', sport: 'NHL' },
  ];

  return (
    <div className="news-ticker-container">
      <div className="news-ticker">
        <div className="news-ticker-content">
          {sportsEvents.map((event) => (
            <div key={event.id} className="news-item">
              <span className="news-date">{event.date}</span>
              <span className="news-teams">{event.teams}</span>
              <span className="news-time">{event.time}</span>
              <span className="news-sport"> | {event.sport}</span>
            </div>
          ))}
          
          {/* Duplicate the items to ensure continuous scrolling */}
          {sportsEvents.map((event) => (
            <div key={`dup-${event.id}`} className="news-item">
              <span className="news-date">{event.date}</span>
              <span className="news-teams">{event.teams}</span>
              <span className="news-time">{event.time}</span>
              <span className="news-sport"> | {event.sport}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;