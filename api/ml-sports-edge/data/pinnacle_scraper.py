#!/usr/bin/env python3
"""
Pinnacle API Scraper
A module for fetching odds data from Pinnacle's API
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

class PinnacleScraper:
    """
    Scraper for Pinnacle API to collect odds data
    """
    
    def __init__(self, env_file: str = '.env.pinnacle', cache_dir: str = 'cache/pinnacle'):
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
            'Accept': os.getenv('PINNACLE_ACCEPT'),
            'Accept-Encoding': os.getenv('PINNACLE_ACCEPT_ENCODING'),
            'Accept-Language': os.getenv('PINNACLE_ACCEPT_LANGUAGE'),
            'User-Agent': os.getenv('PINNACLE_USER_AGENT'),
            'Referer': os.getenv('PINNACLE_REFERER'),
            'Origin': os.getenv('PINNACLE_ORIGIN')
        }
        
        # API URL
        self.api_url = os.getenv('PINNACLE_API_URL', '')
        
        logging.info("PinnacleScraper initialized")
    
    def fetch_odds(self, sport: str, league: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch odds data from Pinnacle API
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (optional)
            
        Returns:
            List of odds data
        """
        logging.info(f"Fetching odds from Pinnacle API for {sport}/{league or 'all'}")
        
        # Check if cached response exists and is less than 15 minutes old
        cache_key = f"{sport}_{league or 'all'}"
        cache_file = os.path.join(self.cache_dir, f"pinnacle_odds_{cache_key}.json")
        if os.path.exists(cache_file):
            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
            if file_age.total_seconds() < 900:  # 15 minutes
                logging.info(f"Using cached response from {cache_file}")
                with open(cache_file, 'r') as f:
                    return json.load(f)
        
        # Map sport codes to Pinnacle sport IDs
        sport_map = {
            'basketball': 'basketball',
            'football': 'football',
            'baseball': 'baseball',
            'hockey': 'hockey',
            'soccer': 'soccer',
            'tennis': 'tennis'
        }
        
        pinnacle_sport = sport_map.get(sport.lower(), sport.lower())
        
        # Construct API URL
        url = f"{self.api_url}/v1/odds?sport={pinnacle_sport}"
        if league:
            url += f"&league={league}"
        
        try:
            # Make request to API
            response = self.session.get(
                url,
                headers=self.headers,
                timeout=60
            )
            
            # Raise exception for HTTP errors
            response.raise_for_status()
            
            logging.info("Received response from Pinnacle API")
            
            # Parse JSON response
            data = response.json()
            
            # Cache the response
            with open(cache_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            return data.get('leagues', [])
            
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
    
    def fetch_markets(self, sport: str, league: Optional[str] = None, event_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch markets data from Pinnacle API
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (optional)
            event_id: Event ID (optional)
            
        Returns:
            List of markets data
        """
        logging.info(f"Fetching markets from Pinnacle API for {sport}/{league or 'all'}/{event_id or 'all'}")
        
        # Check if cached response exists and is less than 15 minutes old
        cache_key = f"{sport}_{league or 'all'}_{event_id or 'all'}"
        cache_file = os.path.join(self.cache_dir, f"pinnacle_markets_{cache_key}.json")
        if os.path.exists(cache_file):
            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
            if file_age.total_seconds() < 900:  # 15 minutes
                logging.info(f"Using cached response from {cache_file}")
                with open(cache_file, 'r') as f:
                    return json.load(f)
        
        # Map sport codes to Pinnacle sport IDs
        sport_map = {
            'basketball': 'basketball',
            'football': 'football',
            'baseball': 'baseball',
            'hockey': 'hockey',
            'soccer': 'soccer',
            'tennis': 'tennis'
        }
        
        pinnacle_sport = sport_map.get(sport.lower(), sport.lower())
        
        # Construct API URL
        url = f"{self.api_url}/v1/markets?sport={pinnacle_sport}"
        if league:
            url += f"&league={league}"
        if event_id:
            url += f"&eventId={event_id}"
        
        try:
            # Make request to API
            response = self.session.get(
                url,
                headers=self.headers,
                timeout=60
            )
            
            # Raise exception for HTTP errors
            response.raise_for_status()
            
            logging.info("Received response from Pinnacle API")
            
            # Parse JSON response
            data = response.json()
            
            # Cache the response
            with open(cache_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            return data.get('markets', [])
            
        except requests.exceptions.ConnectionError as e:
            logging.error(f"Connection error: {e}")
            return self._load_cached_data(cache_file)
        except requests.exceptions.Timeout as e:
            logging.error(f"Timeout error: {e}")
            return self._load_cached_data(cache_file)
        except requests.exceptions.RequestException as e:
            logging.error(f"Request error: {e}")
            return self._load_cached_data(cache_file)
    
    def devig_odds(self, home_odds: float, away_odds: float, draw_odds: Optional[float] = None) -> Dict[str, float]:
        """
        Devig odds to get fair probabilities
        
        Args:
            home_odds: Home team odds (decimal)
            away_odds: Away team odds (decimal)
            draw_odds: Draw odds (decimal, optional)
            
        Returns:
            Dictionary with fair probabilities and odds
        """
        # Calculate implied probabilities
        home_prob = 1 / home_odds
        away_prob = 1 / away_odds
        draw_prob = 1 / draw_odds if draw_odds else 0
        
        # Calculate overround (margin)
        overround = home_prob + away_prob + draw_prob
        
        # Calculate fair probabilities
        fair_home_prob = home_prob / overround
        fair_away_prob = away_prob / overround
        fair_draw_prob = draw_prob / overround if draw_odds else 0
        
        # Calculate fair odds
        fair_home_odds = 1 / fair_home_prob if fair_home_prob > 0 else float('inf')
        fair_away_odds = 1 / fair_away_prob if fair_away_prob > 0 else float('inf')
        fair_draw_odds = 1 / fair_draw_prob if fair_draw_prob > 0 else float('inf')
        
        return {
            'fair_home_odds': fair_home_odds,
            'fair_away_odds': fair_away_odds,
            'fair_draw_odds': fair_draw_odds if draw_odds else None,
            'fair_home_prob': fair_home_prob,
            'fair_away_prob': fair_away_prob,
            'fair_draw_prob': fair_draw_prob if draw_odds else None,
            'overround': overround
        }
    
    def calculate_ev(self, odds: float, fair_odds: float) -> float:
        """
        Calculate expected value (EV) of a bet
        
        Args:
            odds: Offered odds (decimal)
            fair_odds: Fair odds (decimal)
            
        Returns:
            Expected value as a percentage
        """
        # Calculate implied probability
        implied_prob = 1 / odds
        
        # Calculate fair probability
        fair_prob = 1 / fair_odds
        
        # Calculate EV
        ev = (odds * fair_prob) - 1
        
        # Convert to percentage
        ev_percent = ev * 100
        
        return ev_percent


def main():
    """Main function to test the scraper"""
    scraper = PinnacleScraper()
    
    # Fetch odds for NBA
    nba_odds = scraper.fetch_odds('basketball', 'nba')
    print(f"Fetched odds for {len(nba_odds)} NBA leagues")
    
    # Example of devigging odds
    home_odds = 2.10
    away_odds = 1.80
    
    fair_odds = scraper.devig_odds(home_odds, away_odds)
    print(f"Fair odds: {fair_odds}")
    
    # Calculate EV for a bet
    ev = scraper.calculate_ev(home_odds, fair_odds['fair_home_odds'])
    print(f"EV for home bet at {home_odds}: {ev:.2f}%")


if __name__ == "__main__":
    main()