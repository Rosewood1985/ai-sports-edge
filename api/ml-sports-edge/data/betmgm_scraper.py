#!/usr/bin/env python3
"""
BetMGM API Scraper
A module for fetching odds data from BetMGM's API
"""

import os
import json
import logging
import requests
from dotenv import load_dotenv
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class BetMGMScraper:
    """
    Scraper for BetMGM API to collect odds data
    """
    
    def __init__(self, env_file: str = '.env.betmgm', cache_dir: str = 'cache/betmgm'):
        """
        Initialize the scraper with environment variables
        
        Args:
            env_file: Path to the environment file
            cache_dir: Directory to cache API responses
        """
        # Load environment variables
        load_dotenv(env_file)
        
        # Create cache directory if it doesn't exist
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Initialize session
        self.session = requests.Session()
        
        # Set headers from environment variables
        self.headers = {
            'Accept': os.getenv('BETMGM_ACCEPT'),
            'Accept-Encoding': os.getenv('BETMGM_ACCEPT_ENCODING'),
            'Accept-Language': os.getenv('BETMGM_ACCEPT_LANGUAGE'),
            'User-Agent': os.getenv('BETMGM_USER_AGENT'),
            'Referer': os.getenv('BETMGM_REFERER'),
            'Origin': os.getenv('BETMGM_ORIGIN')
        }
        
        # API URL
        self.api_url = os.getenv('BETMGM_API_URL', '')
        
        logging.info("BetMGMScraper initialized")
    
    def fetch_odds(self, sport: str, league: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch odds data from BetMGM API
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (optional)
            
        Returns:
            List of odds data
        """
        logging.info(f"Fetching odds from BetMGM API for {sport}/{league or 'all'}")
        
        # Check if cached response exists and is less than 15 minutes old
        cache_key = f"{sport}_{league or 'all'}"
        cache_file = os.path.join(self.cache_dir, f"betmgm_odds_{cache_key}.json")
        if os.path.exists(cache_file):
            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
            if file_age.total_seconds() < 900:  # 15 minutes
                logging.info(f"Using cached response from {cache_file}")
                with open(cache_file, 'r') as f:
                    return json.load(f)
        
        # Map sport codes to BetMGM sport IDs
        sport_map = {
            'basketball': 'basketball',
            'football': 'football',
            'baseball': 'baseball',
            'hockey': 'hockey',
            'soccer': 'soccer',
            'tennis': 'tennis'
        }
        
        betmgm_sport = sport_map.get(sport.lower(), sport.lower())
        
        # Construct API URL
        url = f"{self.api_url}/sports/{betmgm_sport}/events"
        if league:
            url += f"?league={league}"
        
        try:
            # Make request to API
            response = self.session.get(
                url,
                headers=self.headers,
                timeout=60
            )
            
            # Raise exception for HTTP errors
            response.raise_for_status()
            
            logging.info("Received response from BetMGM API")
            
            # Parse JSON response
            data = response.json()
            
            # Cache the response
            with open(cache_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            return data.get('events', [])
            
        except requests.exceptions.ConnectionError as e:
            logging.error(f"Connection error: {e}")
            return self._load_cached_data(cache_file)
        except requests.exceptions.Timeout as e:
            logging.error(f"Timeout error: {e}")
            return self._load_cached_data(cache_file)
        except requests.exceptions.RequestException as e:
            logging.error(f"Request error: {e}")
            return self._load_cached_data(cache_file)
    
    def _load_cached_data(self, cache_file: str) -> List[Dict[str, Any]]:
        """
        Load cached data if available
        
        Args:
            cache_file: Path to cache file
            
        Returns:
            Cached data or empty list
        """
        if os.path.exists(cache_file):
            logging.info(f"Loading cached data from {cache_file}")
            with open(cache_file, 'r') as f:
                return json.load(f)
        return []
    
    def fetch_event_odds(self, event_id: str) -> Dict[str, Any]:
        """
        Fetch odds for a specific event
        
        Args:
            event_id: Event ID
            
        Returns:
            Event odds data
        """
        logging.info(f"Fetching odds for event {event_id}")
        
        # Check if cached response exists and is less than 15 minutes old
        cache_file = os.path.join(self.cache_dir, f"betmgm_event_{event_id}.json")
        if os.path.exists(cache_file):
            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
            if file_age.total_seconds() < 900:  # 15 minutes
                logging.info(f"Using cached response from {cache_file}")
                with open(cache_file, 'r') as f:
                    return json.load(f)
        
        # Construct API URL
        url = f"{self.api_url}/events/{event_id}/markets"
        
        try:
            # Make request to API
            response = self.session.get(
                url,
                headers=self.headers,
                timeout=60
            )
            
            # Raise exception for HTTP errors
            response.raise_for_status()
            
            logging.info(f"Received response for event {event_id}")
            
            # Parse JSON response
            data = response.json()
            
            # Cache the response
            with open(cache_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            return data
            
        except requests.exceptions.ConnectionError as e:
            logging.error(f"Connection error: {e}")
            return self._load_cached_data(cache_file)
        except requests.exceptions.Timeout as e:
            logging.error(f"Timeout error: {e}")
            return self._load_cached_data(cache_file)
        except requests.exceptions.RequestException as e:
            logging.error(f"Request error: {e}")
            return self._load_cached_data(cache_file)
    
    def extract_moneyline_odds(self, event_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract moneyline odds from event data
        
        Args:
            event_data: Event data
            
        Returns:
            Dictionary with moneyline odds
        """
        odds = {}
        
        # Extract markets
        markets = event_data.get('markets', [])
        
        # Find moneyline market
        for market in markets:
            if market.get('key') == 'moneyline':
                selections = market.get('selections', [])
                
                for selection in selections:
                    name = selection.get('name', '').lower()
                    price = selection.get('price', {}).get('decimal')
                    
                    if 'home' in name or '1' == name:
                        odds['home_odds'] = float(price) if price else None
                    elif 'away' in name or '2' == name:
                        odds['away_odds'] = float(price) if price else None
                    elif 'draw' in name or 'x' == name:
                        odds['draw_odds'] = float(price) if price else None
        
        return odds
    
    def extract_spread_odds(self, event_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract spread odds from event data
        
        Args:
            event_data: Event data
            
        Returns:
            List of dictionaries with spread odds
        """
        spreads = []
        
        # Extract markets
        markets = event_data.get('markets', [])
        
        # Find spread markets
        for market in markets:
            if market.get('key') == 'point_spread' or market.get('key') == 'handicap':
                selections = market.get('selections', [])
                
                spread_data = {
                    'line': market.get('line'),
                    'home_odds': None,
                    'away_odds': None
                }
                
                for selection in selections:
                    name = selection.get('name', '').lower()
                    price = selection.get('price', {}).get('decimal')
                    handicap = selection.get('handicap')
                    
                    if 'home' in name or '1' == name:
                        spread_data['home_odds'] = float(price) if price else None
                        spread_data['home_handicap'] = handicap
                    elif 'away' in name or '2' == name:
                        spread_data['away_odds'] = float(price) if price else None
                        spread_data['away_handicap'] = handicap
                
                spreads.append(spread_data)
        
        return spreads
    
    def extract_total_odds(self, event_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract total (over/under) odds from event data
        
        Args:
            event_data: Event data
            
        Returns:
            List of dictionaries with total odds
        """
        totals = []
        
        # Extract markets
        markets = event_data.get('markets', [])
        
        # Find total markets
        for market in markets:
            if market.get('key') == 'total' or market.get('key') == 'over_under':
                selections = market.get('selections', [])
                
                total_data = {
                    'line': market.get('line'),
                    'over_odds': None,
                    'under_odds': None
                }
                
                for selection in selections:
                    name = selection.get('name', '').lower()
                    price = selection.get('price', {}).get('decimal')
                    
                    if 'over' in name or 'o' == name:
                        total_data['over_odds'] = float(price) if price else None
                    elif 'under' in name or 'u' == name:
                        total_data['under_odds'] = float(price) if price else None
                
                totals.append(total_data)
        
        return totals


def main():
    """Main function to test the scraper"""
    scraper = BetMGMScraper()
    
    # Fetch odds for NBA
    nba_odds = scraper.fetch_odds('basketball', 'nba')
    print(f"Fetched odds for {len(nba_odds)} NBA events")
    
    # Fetch odds for a specific event
    if nba_odds:
        event_id = nba_odds[0].get('id')
        event_odds = scraper.fetch_event_odds(event_id)
        
        # Extract moneyline odds
        moneyline_odds = scraper.extract_moneyline_odds(event_odds)
        print(f"Moneyline odds: {moneyline_odds}")
        
        # Extract spread odds
        spread_odds = scraper.extract_spread_odds(event_odds)
        print(f"Spread odds: {spread_odds}")
        
        # Extract total odds
        total_odds = scraper.extract_total_odds(event_odds)
        print(f"Total odds: {total_odds}")


if __name__ == "__main__":
    main()