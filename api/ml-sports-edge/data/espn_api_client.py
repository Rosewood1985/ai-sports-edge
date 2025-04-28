#!/usr/bin/env python3
"""
ESPN API Client
A module for fetching data from ESPN's hidden API

Usage:
  python espn_api_client.py --get-sports
  python espn_api_client.py --get-leagues basketball
  python espn_api_client.py --get-teams basketball nba
  python espn_api_client.py --get-team basketball nba 1
  python espn_api_client.py --get-scoreboard basketball nba [YYYYMMDD]
  python espn_api_client.py --get-game basketball nba 401468631
  python espn_api_client.py --get-standings basketball nba
  python espn_api_client.py --get-player-stats basketball nba 3975
  python espn_api_client.py --get-schedule basketball nba [YYYY]
  python espn_api_client.py --get-news basketball nba
"""

import os
import sys
import json
import logging
import argparse
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


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='ESPN API Client')
    
    # Add arguments
    parser.add_argument('--get-sports', action='store_true', help='Get list of sports')
    parser.add_argument('--get-leagues', metavar='SPORT', help='Get leagues for a sport')
    parser.add_argument('--get-teams', nargs=2, metavar=('SPORT', 'LEAGUE'), help='Get teams for a league')
    parser.add_argument('--get-team', nargs=3, metavar=('SPORT', 'LEAGUE', 'TEAM_ID'), help='Get details for a team')
    parser.add_argument('--get-scoreboard', nargs='+', metavar='SPORT LEAGUE [DATE]', help='Get scoreboard for a league')
    parser.add_argument('--get-game', nargs=3, metavar=('SPORT', 'LEAGUE', 'GAME_ID'), help='Get details for a game')
    parser.add_argument('--get-standings', nargs=2, metavar=('SPORT', 'LEAGUE'), help='Get standings for a league')
    parser.add_argument('--get-player-stats', nargs=3, metavar=('SPORT', 'LEAGUE', 'PLAYER_ID'), help='Get stats for a player')
    parser.add_argument('--get-schedule', nargs='+', metavar='SPORT LEAGUE [SEASON]', help='Get schedule for a league')
    parser.add_argument('--get-news', nargs=2, metavar=('SPORT', 'LEAGUE'), help='Get news for a league')
    
    return parser.parse_args()

def main():
    """Main function to handle command line arguments"""
    args = parse_args()
    client = ESPNApiClient()
    
    result = None
    
    if args.get_sports:
        result = client.get_sports()
    elif args.get_leagues:
        result = client.get_leagues(args.get_leagues)
    elif args.get_teams:
        sport, league = args.get_teams
        result = client.get_teams(sport, league)
    elif args.get_team:
        sport, league, team_id = args.get_team
        result = client.get_team(sport, league, team_id)
    elif args.get_scoreboard:
        if len(args.get_scoreboard) == 2:
            sport, league = args.get_scoreboard
            result = client.get_scoreboard(sport, league)
        elif len(args.get_scoreboard) == 3:
            sport, league, date = args.get_scoreboard
            result = client.get_scoreboard(sport, league, date)
        else:
            print("Error: Invalid number of arguments for --get-scoreboard")
            sys.exit(1)
    elif args.get_game:
        sport, league, game_id = args.get_game
        result = client.get_game(sport, league, game_id)
    elif args.get_standings:
        sport, league = args.get_standings
        result = client.get_standings(sport, league)
    elif args.get_player_stats:
        sport, league, player_id = args.get_player_stats
        result = client.get_player_stats(sport, league, player_id)
    elif args.get_schedule:
        if len(args.get_schedule) == 2:
            sport, league = args.get_schedule
            result = client.get_schedule(sport, league)
        elif len(args.get_schedule) == 3:
            sport, league, season = args.get_schedule
            result = client.get_schedule(sport, league, season)
        else:
            print("Error: Invalid number of arguments for --get-schedule")
            sys.exit(1)
    elif args.get_news:
        sport, league = args.get_news
        result = client.get_news(sport, league)
    else:
        # If no arguments provided, run a simple test
        print("No arguments provided. Running test...")
        
        # Test getting NBA scoreboard
        nba_scoreboard = client.get_scoreboard('basketball', 'nba')
        print(json.dumps(nba_scoreboard, indent=2))
        
        # Test getting NFL teams
        nfl_teams = client.get_teams('football', 'nfl')
        print(json.dumps(nfl_teams, indent=2))
        
        return
    
    # Print result as JSON
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()