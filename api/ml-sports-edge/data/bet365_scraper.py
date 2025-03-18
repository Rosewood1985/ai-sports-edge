#!/usr/bin/env python3
"""
Bet365 API Scraper
A module for fetching odds data from Bet365's API
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

class Bet365Scraper:
    """
    Scraper for Bet365 API to collect odds data
    """
    
    def __init__(self, env_file: str = '.env.bet365', cache_dir: str = 'cache/bet365'):
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
            'Accept': os.getenv('ACCEPT'),
            'Accept-Encoding': os.getenv('ACCEPT_ENCODING'),
            'Accept-Language': os.getenv('ACCEPT_LANGUAGE'),
            'Cache-Control': os.getenv('CACHE_CONTROL'),
            'Connection': os.getenv('CONNECTION'),
            'Cookie': os.getenv('COOKIE'),
            'Host': os.getenv('HOST'),
            'Origin': os.getenv('ORIGIN'),
            'Pragma': os.getenv('PRAGMA'),
            'Referer': os.getenv('REFERER'),
            'Sec-Ch-Ua': os.getenv('SEC_CH_UA'),
            'Sec-Ch-Ua-Mobile': os.getenv('SEC_CH_UA_MOBILE'),
            'Sec-Ch-Ua-Platform': os.getenv('SEC_CH_UA_PLATFORM'),
            'Sec-Fetch-Dest': os.getenv('SEC_FETCH_DEST'),
            'Sec-Fetch-Mode': os.getenv('SEC_FETCH_MODE'),
            'Sec-Fetch-Site': os.getenv('SEC_FETCH_SITE'),
            'Sec-Fetch-User': os.getenv('SEC_FETCH_USER'),
            'Upgrade-Insecure-Requests': os.getenv('UPGRADE_INSECURE_REQUESTS'),
            'User-Agent': os.getenv('USER_AGENT')
        }
        
        # API URL
        self.api_url = os.getenv('INPLAYDIARYAPI', '')
        
        logging.info("Bet365Scraper initialized")
    
    def fetch_data(self, sport_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch data from Bet365 API
        
        Args:
            sport_filter: Optional filter for specific sport
            
        Returns:
            List of events data
        """
        logging.info(f"Fetching data from Bet365 API for sport: {sport_filter or 'all'}")
        
        # Check if cached response exists and is less than 15 minutes old
        cache_file = os.path.join(self.cache_dir, f"bet365_data_{sport_filter or 'all'}.json")
        if os.path.exists(cache_file):
            file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(cache_file))
            if file_age.total_seconds() < 900:  # 15 minutes
                logging.info(f"Using cached response from {cache_file}")
                with open(cache_file, 'r') as f:
                    return json.load(f)
        
        try:
            # Make request to API
            response = self.session.get(
                self.api_url,
                headers=self.headers,
                timeout=60
            )
            
            # Raise exception for HTTP errors
            response.raise_for_status()
            
            logging.info("Received response from Bet365 API")
            
            # Process the response
            events = self._process_response(response.text, sport_filter)
            
            # Cache the response
            with open(cache_file, 'w') as f:
                json.dump(events, f, indent=2)
            
            return events
            
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
    
    def _process_response(self, response_text: str, sport_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Process the API response
        
        Args:
            response_text: Raw response text
            sport_filter: Optional filter for specific sport
            
        Returns:
            List of processed events
        """
        # Split response by 'EV' delimiter
        data = response_text.split('EV')
        events = []
        
        for item in data:
            # Skip empty items
            if not item.strip():
                continue
            
            # Apply sport filter if provided
            if sport_filter:
                if sport_filter.lower() == 'football' or sport_filter.lower() == 'soccer':
                    if 'Futebol' not in item and 'Soccer' not in item and 'Football' not in item:
                        continue
                elif sport_filter.lower() not in item.lower():
                    continue
            
            # Process live events
            if 'Ao-Vivo' in item or 'In-Play' in item:
                event_data = self._parse_event(item)
                if event_data:
                    events.append(event_data)
        
        logging.info(f"Processed {len(events)} events")
        return events
    
    def _parse_event(self, item: str) -> Optional[Dict[str, Any]]:
        """
        Parse a single event from the response
        
        Args:
            item: Event data string
            
        Returns:
            Parsed event data or None if parsing fails
        """
        try:
            # Extract event data using markers
            event = {
                'league': self._extract_data(item, 'CL', 'CI'),
                'league_id': self._extract_data(item, 'CI', 'NA'),
                'teams': self._extract_data(item, 'NA', 'VI'),
                'scores': self._extract_data(item, 'VI', 'SM'),
                'match_time': self._extract_data(item, 'SM', 'CN'),
                'betting_status': self._extract_data(item, 'CB', 'CI'),
                'timestamp': self._extract_data(item, 'PD', 'BC') or datetime.now().isoformat(),
                'odds': {}
            }
            
            # Parse team names
            if event['teams']:
                teams = event['teams'].split(' v ')
                if len(teams) == 2:
                    event['home_team'] = teams[0].strip()
                    event['away_team'] = teams[1].strip()
            
            # Parse scores
            if event['scores']:
                try:
                    scores = event['scores'].split('-')
                    if len(scores) == 2:
                        event['home_score'] = int(scores[0].strip())
                        event['away_score'] = int(scores[1].strip())
                except (ValueError, IndexError):
                    logging.warning(f"Could not parse scores: {event['scores']}")
            
            # Extract odds data
            self._extract_odds(item, event)
            
            return event
            
        except Exception as e:
            logging.error(f"Error parsing event: {e}")
            return None
    
    def _extract_odds(self, item: str, event: Dict[str, Any]) -> None:
        """
        Extract odds data from the event item
        
        Args:
            item: Event data string
            event: Event dictionary to update with odds
        """
        try:
            # Extract moneyline odds
            home_odds = self._extract_data(item, 'OD1', 'OD2')
            draw_odds = self._extract_data(item, 'OD2', 'OD3')
            away_odds = self._extract_data(item, 'OD3', 'OD4')
            
            if home_odds:
                try:
                    event['odds']['home'] = float(home_odds)
                except ValueError:
                    pass
            
            if draw_odds:
                try:
                    event['odds']['draw'] = float(draw_odds)
                except ValueError:
                    pass
            
            if away_odds:
                try:
                    event['odds']['away'] = float(away_odds)
                except ValueError:
                    pass
            
            # Calculate implied probabilities
            if 'home' in event['odds']:
                event['odds']['home_implied_probability'] = 1 / event['odds']['home']
            
            if 'draw' in event['odds']:
                event['odds']['draw_implied_probability'] = 1 / event['odds']['draw']
            
            if 'away' in event['odds']:
                event['odds']['away_implied_probability'] = 1 / event['odds']['away']
            
        except Exception as e:
            logging.warning(f"Error extracting odds: {e}")
    
    def _extract_data(self, item: str, start: str, end: str) -> Optional[str]:
        """
        Extract data between two markers
        
        Args:
            item: String to extract from
            start: Start marker
            end: End marker
            
        Returns:
            Extracted string or None if extraction fails
        """
        try:
            start_idx = item.index(start) + len(start) + 1
            end_idx = item.index(end) - 1
            return item[start_idx:end_idx].strip()
        except (ValueError, IndexError):
            return None


def main():
    """Main function to test the scraper"""
    scraper = Bet365Scraper()
    events = scraper.fetch_data()
    
    # Print results
    for i, event in enumerate(events):
        print(f"\nEvent {i+1}:")
        for key, value in event.items():
            print(f"  {key}: {value}")


if __name__ == "__main__":
    main()