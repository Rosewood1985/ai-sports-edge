import axios from 'axios';
// We'll use mock data for now, so we don't need the API key
// import { SPORTS_API_KEY } from '@env';
import { trackEvent } from './analyticsService';

/**
 * News item interface
 */
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: 'injury' | 'lineup' | 'trade' | 'general';
  timestamp: string;
  teams: string[];
  players?: string[];
  source: string;
  url: string;
  aiSummary?: string;
}

/**
 * Fetch sports news from the API
 * @returns Array of news items
 */
export const fetchSportsNews = async (): Promise<NewsItem[]> => {
  try {
    // In a real implementation, this would call a sports API
    // For now, we'll return mock data
    
    // Track the event
    await trackEvent('sports_news_fetched', {
      source: 'mock_data'
    });
    
    return getMockNewsData();
  } catch (error) {
    console.error('Error fetching sports news:', error);
    return getMockNewsData();
  }
};

/**
 * Get mock news data for development
 * @returns Array of mock news items
 */
const getMockNewsData = (): NewsItem[] => {
  return [
    {
      id: '1',
      title: 'Lakers Star Anthony Davis Out with Ankle Injury',
      content: 'Los Angeles Lakers forward Anthony Davis will miss at least two weeks with a sprained ankle, the team announced on Thursday. Davis suffered the injury during the second quarter of Wednesday\'s game against the Denver Nuggets. An MRI revealed a Grade 2 sprain. This is a significant blow to the Lakers, who are currently fighting for playoff positioning in the Western Conference. Davis has been averaging 24.5 points and 10.7 rebounds per game this season.',
      category: 'injury',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      teams: ['Lakers', 'Nuggets'],
      players: ['Anthony Davis'],
      source: 'Sports Network',
      url: 'https://example.com/news/1'
    },
    {
      id: '2',
      title: 'Chiefs Announce New Starting Lineup for Sunday\'s Game',
      content: 'The Kansas City Chiefs have announced several changes to their starting lineup for Sunday\'s game against the Cincinnati Bengals. Rookie cornerback Jaylen Watson will make his first NFL start, replacing the injured Trent McDuffie. Additionally, running back Clyde Edwards-Helaire will return to the starting lineup after missing three games with a knee injury. The Chiefs are looking to improve their 3-2 record and maintain their lead in the AFC West.',
      category: 'lineup',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      teams: ['Chiefs', 'Bengals'],
      players: ['Jaylen Watson', 'Trent McDuffie', 'Clyde Edwards-Helaire'],
      source: 'NFL Insider',
      url: 'https://example.com/news/2'
    },
    {
      id: '3',
      title: 'Blockbuster Trade: Nets Send Kevin Durant to Suns',
      content: 'In a shocking move just before the trade deadline, the Brooklyn Nets have agreed to send superstar Kevin Durant to the Phoenix Suns in exchange for Mikal Bridges, Cam Johnson, Jae Crowder, four first-round picks, and a pick swap. This trade comes just days after the Nets traded Kyrie Irving to the Dallas Mavericks, signaling a complete rebuild for the Brooklyn franchise. The Suns now form a formidable trio with Durant joining Devin Booker and Chris Paul, immediately becoming one of the favorites to win the NBA championship.',
      category: 'trade',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      teams: ['Nets', 'Suns', 'Mavericks'],
      players: ['Kevin Durant', 'Mikal Bridges', 'Cam Johnson', 'Jae Crowder', 'Kyrie Irving'],
      source: 'Basketball Reference',
      url: 'https://example.com/news/3'
    },
    {
      id: '4',
      title: 'NFL Announces New Playoff Format for 2025 Season',
      content: 'The NFL has announced a new playoff format that will take effect starting with the 2025 season. The new format will expand the playoffs to 16 teams, with eight from each conference. The top seed from each conference will still receive a first-round bye, while seeds 2-8 will play in the wild card round. This change comes after the successful expansion to 14 teams in 2020. The NFL Competition Committee voted unanimously for the change, citing increased fan engagement and revenue opportunities.',
      category: 'general',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      teams: [],
      source: 'Sports Center',
      url: 'https://example.com/news/4'
    },
    {
      id: '5',
      title: 'Yankees Ace Gerrit Cole Placed on 15-Day IL',
      content: 'New York Yankees starting pitcher Gerrit Cole has been placed on the 15-day injured list with forearm inflammation, the team announced on Friday. Cole, who leads the American League with a 2.78 ERA, reported discomfort after his last start against the Boston Red Sox. An MRI showed no structural damage, but the Yankees are being cautious with their ace. In a corresponding move, the team has called up prospect Clarke Schmidt from Triple-A. The Yankees currently hold a 3.5-game lead in the AL East.',
      category: 'injury',
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      teams: ['Yankees', 'Red Sox'],
      players: ['Gerrit Cole', 'Clarke Schmidt'],
      source: 'Baseball Tonight',
      url: 'https://example.com/news/5'
    }
  ];
};

/**
 * Categorize news based on title and content
 * @param title News title
 * @param content News content
 * @returns Category
 */
export const categorizeNews = (title: string, content: string): 'injury' | 'lineup' | 'trade' | 'general' => {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('injury') || text.includes('injured') || text.includes('out') || text.includes('il') || text.includes('disabled list')) {
    return 'injury';
  } else if (text.includes('lineup') || text.includes('starting') || text.includes('bench') || text.includes('roster')) {
    return 'lineup';
  } else if (text.includes('trade') || text.includes('sign') || text.includes('deal') || text.includes('contract')) {
    return 'trade';
  } else {
    return 'general';
  }
};

/**
 * Extract teams mentioned in content
 * @param content News content
 * @returns Array of team names
 */
export const extractTeams = (content: string): string[] => {
  // This would use a more sophisticated algorithm in production
  // For now, we'll use a simple approach with common team names
  const teams = [
    'Lakers', 'Celtics', 'Warriors', 'Nets', 'Bucks', 'Heat', 'Suns', 'Nuggets',
    'Chiefs', 'Eagles', 'Cowboys', 'Patriots', 'Packers', 'Rams', 'Bills', 'Bengals',
    'Yankees', 'Red Sox', 'Dodgers', 'Cubs', 'Astros', 'Braves', 'Mets', 'Giants'
  ];
  
  return teams.filter(team => content.includes(team));
};

/**
 * Extract players mentioned in content
 * @param content News content
 * @returns Array of player names
 */
export const extractPlayers = (content: string): string[] => {
  // This would use a more sophisticated algorithm in production
  // For now, we'll return an empty array
  return [];
};

export default {
  fetchSportsNews,
  categorizeNews,
  extractTeams,
  extractPlayers
};