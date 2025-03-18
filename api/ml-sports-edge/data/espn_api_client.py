#!/usr/bin/env python3
"""
ESPN API Client
A module for fetching data from ESPN's hidden API
"""

import os
import json
import logging
import requests
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class ESPNApiClient:
    """
    Client for ESPN's hidden API to collect sports data
    """
    
    def __init__(self, cache_dir: str = 'cache/espn'):
        """
        Initialize the ESPN API client
        
        Args:
            cache_dir: Directory to cache API responses
        """
        self.base_url = "https://site.api.espn.com/apis/site/v2/sports"
        self.cache_dir = cache_dir
        
        # Create cache directory if it doesn't exist
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Initialize session
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
        })
        
        logging.info("ESPN API client initialized")
    
    def get_sports(self) -> List[Dict[str, Any]]:
        """
        Get list of available sports
        
        Returns:
            List of sports
        """
        endpoint = f"{self.base_url}"
        return self._make_request(endpoint)
    
    def get_leagues(self, sport: str) -> List[Dict[str, Any]]:
        """
        Get list of leagues for a sport
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            
        Returns:
            List of leagues
        """
        endpoint = f"{self.base_url}/{sport}"
        return self._make_request(endpoint)
    
    def get_teams(self, sport: str, league: str) -> List[Dict[str, Any]]:
        """
        Get list of teams for a league
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            
        Returns:
            List of teams
        """
        endpoint = f"{self.base_url}/{sport}/{league}/teams"
        return self._make_request(endpoint)
    
    def get_team(self, sport: str, league: str, team_id: str) -> Dict[str, Any]:
        """
        Get details for a specific team
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            team_id: Team ID
            
        Returns:
            Team details
        """
        endpoint = f"{self.base_url}/{sport}/{league}/teams/{team_id}"
        return self._make_request(endpoint)
    
    def get_scoreboard(self, sport: str, league: str, date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get scoreboard for a league on a specific date
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            date: Date in YYYYMMDD format (default: today)
            
        Returns:
            Scoreboard data
        """
        if date is None:
            date = datetime.now().strftime('%Y%m%d')
        
        endpoint = f"{self.base_url}/{sport}/{league}/scoreboard?dates={date}"
        return self._make_request(endpoint)
    
    def get_game(self, sport: str, league: str, game_id: str) -> Dict[str, Any]:
        """
        Get details for a specific game
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            game_id: Game ID
            
        Returns:
            Game details
        """
        endpoint = f"{self.base_url}/{sport}/{league}/summary?event={game_id}"
        return self._make_request(endpoint)
    
    def get_standings(self, sport: str, league: str) -> Dict[str, Any]:
        """
        Get standings for a league
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            
        Returns:
            Standings data
        """
        endpoint = f"{self.base_url}/{sport}/{league}/standings"
        return self._make_request(endpoint)
    
    def get_player_stats(self, sport: str, league: str, player_id: str) -> Dict[str, Any]:
        """
        Get stats for a specific player
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            player_id: Player ID
            
        Returns:
            Player stats
        """
        endpoint = f"{self.base_url}/{sport}/{league}/athletes/{player_id}"
        return self._make_request(endpoint)
    
    def get_schedule(self, sport: str, league: str, season: Optional[str] = None) -> Dict[str, Any]:
        """
        Get schedule for a league
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            season: Season year (default: current year)
            
        Returns:
            Schedule data
        """
        if season is None:
            season = datetime.now().year
        
        endpoint = f"{self.base_url}/{sport}/{league}/schedule?season={season}"
        return self._make_request(endpoint)
    
    def get_news(self, sport: str, league: str) -> Dict[str, Any]:
        """
        Get news for a league
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            
        Returns:
            News data
        """
        endpoint = f"{self.base_url}/{sport}/{league}/news"
        return self._make_request(endpoint)
    
    def _make_request(self, endpoint: str) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Make a request to the ESPN API
        
        Args:
            endpoint: API endpoint
            
        Returns:
            API response data
        """
        cache_file = os.path.join(self.cache_dir, f"{endpoint.replace('/', '_').replace('?', '_').replace('=', '_')}.json")
        
        # Check if cached response exists and is less than 1 hour old
        if os.path.exists(cache_file):
            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
            if file_age < timedelta(hours=1):
                logging.info(f"Using cached response for {endpoint}")
                with open(cache_file, 'r') as f:
                    return json.load(f)
        
        logging.info(f"Making request to {endpoint}")
        
        try:
            response = self.session.get(endpoint)
            response.raise_for_status()
            
            data = response.json()
            
            # Cache the response
            with open(cache_file, 'w') as f:
                json.dump(data, f)
            
            return data
            
        except requests.exceptions.RequestException as e:
            logging.error(f"Error making request to {endpoint}: {e}")
            
            # If cached response exists, use it even if it's old
            if os.path.exists(cache_file):
                logging.info(f"Using cached response for {endpoint} due to request error")
                with open(cache_file, 'r') as f:
                    return json.load(f)
            
            # Return empty dict or list depending on endpoint
            if endpoint.endswith(('teams', 'athletes')):
                return []
            return {}


def main():
    """Main function to test the ESPN API client"""
    client = ESPNApiClient()
    
    # Test getting NBA scoreboard
    nba_scoreboard = client.get_scoreboard('basketball', 'nba')
    print(json.dumps(nba_scoreboard, indent=2))
    
    # Test getting NFL teams
    nfl_teams = client.get_teams('football', 'nfl')
    print(json.dumps(nfl_teams, indent=2))


if __name__ == "__main__":
    main()