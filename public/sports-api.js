/**
 * Sports API integration for fetching real game data
 */

// Function to fetch upcoming games from ESPN API
async function fetchUpcomingGames() {
  try {
    // Fetch NBA games
    const nbaResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');
    const nbaData = await nbaResponse.json();
    
    // Fetch MLB games
    const mlbResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard');
    const mlbData = await mlbResponse.json();
    
    // Fetch NHL games
    const nhlResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard');
    const nhlData = await nhlResponse.json();
    
    // Combine all games
    const allGames = [
      ...processGames(nbaData.events, 'NBA'),
      ...processGames(mlbData.events, 'MLB'),
      ...processGames(nhlData.events, 'NHL')
    ];
    
    // Sort games by date
    allGames.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return allGames;
  } catch (error) {
    console.error('Error fetching sports data:', error);
    return getFallbackGames(); // Return fallback data if API fails
  }
}

// Process games from API response
function processGames(events, league) {
  if (!events || !Array.isArray(events)) return [];
  
  return events.map(event => {
    const date = new Date(event.date);
    const competitors = event.competitions[0]?.competitors || [];
    const homeTeam = competitors.find(team => team.homeAway === 'home')?.team.displayName || 'TBD';
    const awayTeam = competitors.find(team => team.homeAway === 'away')?.team.displayName || 'TBD';
    
    return {
      id: event.id,
      date: date,
      formattedDate: formatDate(date),
      formattedTime: formatTime(date),
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      league: league
    };
  });
}

// Format date as "MMM DD"
function formatDate(date) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Format time as "h:MM AM/PM ET"
function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${hours}:${minutesStr} ${ampm} ET`;
}

// Fallback games in case API fails - NO NFL GAMES since they're not in season
function getFallbackGames() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  
  return [
    {
      id: '1',
      date: today,
      formattedDate: formatDate(today),
      formattedTime: '7:30 PM ET',
      homeTeam: 'Lakers',
      awayTeam: 'Nuggets',
      league: 'NBA'
    },
    {
      id: '2',
      date: today,
      formattedDate: formatDate(today),
      formattedTime: '8:00 PM ET',
      homeTeam: 'Celtics',
      awayTeam: 'Bucks',
      league: 'NBA'
    },
    {
      id: '5',
      date: tomorrow,
      formattedDate: formatDate(tomorrow),
      formattedTime: '7:05 PM ET',
      homeTeam: 'Yankees',
      awayTeam: 'Red Sox',
      league: 'MLB'
    },
    {
      id: '6',
      date: tomorrow,
      formattedDate: formatDate(tomorrow),
      formattedTime: '10:10 PM ET',
      homeTeam: 'Dodgers',
      awayTeam: 'Giants',
      league: 'MLB'
    },
    {
      id: '7',
      date: dayAfter,
      formattedDate: formatDate(dayAfter),
      formattedTime: '7:00 PM ET',
      homeTeam: 'Avalanche',
      awayTeam: 'Lightning',
      league: 'NHL'
    }
  ];
}

// Initialize the news ticker with real game data
async function initSportsTicker() {
  const games = await fetchUpcomingGames();
  const tickerContent = document.querySelector('.news-ticker-content');
  
  if (!tickerContent) return;
  
  // Clear existing content
  tickerContent.innerHTML = '';
  
  // Add game data to ticker
  games.forEach(game => {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    newsItem.innerHTML = `
      <span class="news-date">${game.formattedDate}</span>
      <span class="news-teams">${game.awayTeam} vs. ${game.homeTeam}</span>
      <span class="news-time">${game.formattedTime}</span>
      <span class="news-sport"> | ${game.league}</span>
    `;
    tickerContent.appendChild(newsItem);
  });
  
  // Duplicate items for continuous scrolling
  const items = tickerContent.querySelectorAll('.news-item');
  for (let i = 0; i < Math.min(items.length, 5); i++) {
    tickerContent.appendChild(items[i].cloneNode(true));
  }
}

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', initSportsTicker);