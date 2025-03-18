/**
 * Sports API integration for fetching real game data
 * Version 4 - Fixed continuous scrolling and removed all NFL references
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
    
    // Filter out any NFL games that might have been returned
    const filteredGames = allGames.filter(game => game.league !== 'NFL');
    
    // Sort games by date
    filteredGames.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('Fetched games:', filteredGames); // Debug log
    
    return filteredGames.length > 0 ? filteredGames : getFallbackGames();
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
  
  console.log('Using fallback games - NO NFL GAMES'); // Debug log
  
  // Ensure we have a good mix of NBA, MLB, and NHL games
  return [
    // NBA Games
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
      id: '3',
      date: tomorrow,
      formattedDate: formatDate(tomorrow),
      formattedTime: '7:00 PM ET',
      homeTeam: 'Warriors',
      awayTeam: 'Suns',
      league: 'NBA'
    },
    
    // MLB Games
    {
      id: '4',
      date: today,
      formattedDate: formatDate(today),
      formattedTime: '7:05 PM ET',
      homeTeam: 'Yankees',
      awayTeam: 'Red Sox',
      league: 'MLB'
    },
    {
      id: '5',
      date: tomorrow,
      formattedDate: formatDate(tomorrow),
      formattedTime: '1:10 PM ET',
      homeTeam: 'Dodgers',
      awayTeam: 'Giants',
      league: 'MLB'
    },
    
    // NHL Games
    {
      id: '6',
      date: today,
      formattedDate: formatDate(today),
      formattedTime: '7:00 PM ET',
      homeTeam: 'Avalanche',
      awayTeam: 'Lightning',
      league: 'NHL'
    },
    {
      id: '7',
      date: tomorrow,
      formattedDate: formatDate(tomorrow),
      formattedTime: '8:00 PM ET',
      homeTeam: 'Bruins',
      awayTeam: 'Maple Leafs',
      league: 'NHL'
    }
  ];
}

// Initialize the news ticker with real game data
async function initSportsTicker() {
  console.log('Initializing sports ticker - V4 (Continuous scrolling, NO NFL games)'); // Debug log
  
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
  
  // Duplicate all items multiple times for truly continuous scrolling
  // This ensures there's no gap between the end and beginning of the ticker
  const items = Array.from(tickerContent.querySelectorAll('.news-item'));
  
  // Duplicate each item 3 times to ensure continuous scrolling
  for (let i = 0; i < 3; i++) {
    items.forEach(item => {
      tickerContent.appendChild(item.cloneNode(true));
    });
  }
  
  // Set the animation duration to be much slower (60 seconds)
  tickerContent.style.animation = 'ticker 60s linear infinite';
}

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', initSportsTicker);