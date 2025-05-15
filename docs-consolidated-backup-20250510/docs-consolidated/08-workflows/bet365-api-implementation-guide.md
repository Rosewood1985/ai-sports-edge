# Bet365 API Scraper Implementation Guide

This document provides detailed implementation instructions for creating a Bet365 API scraper to enhance our ML Sports Edge prediction system. The scraper will collect real-time odds data, market movements, and in-play statistics from Bet365 to improve our prediction models.

## Project Structure

```
api/ml-sports-edge/
├── data/
│   ├── bet365_scraper.py       # Main scraper module
│   ├── bet365_processor.py     # Data processing module
│   └── bet365_models.py        # Data models for Bet365 data
├── config/
│   └── .env.bet365.example     # Example environment variables
└── tests/
    └── test_bet365_scraper.py  # Unit tests for the scraper
```

## Environment Setup

Create a `.env.bet365` file with the following environment variables:

```
# Bet365 API Configuration
INPLAYDIARYAPI='https://mobile.bet365.com/inplaydiaryapi/schedule?timezone=16&lid=33&zid=0'
ACCEPT='text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
ACCEPT_ENCODING='gzip, deflate, br, zstd'
ACCEPT_LANGUAGE='pt-BR,pt;q=0.9,en-GB;q=0.8,en;q=0.7,es-ES;q=0.6,es;q=0.5'
CACHE_CONTROL='max-age=0'
CONNECTION='keep-alive'
COOKIE='your_cookie_here'
HOST='mobile.bet365.com'
ORIGIN='https://www.bet365.com'
PRAGMA='no-cache'
REFERER='https://www.bet365.com/'
SEC_CH_UA='"Opera GX";v="109", "Not;A=Brand";v="8", "Chromium";v="123"'
SEC_CH_UA_MOBILE='?0'
SEC_CH_UA_PLATFORM='macOS'
SEC_FETCH_DEST='document'
SEC_FETCH_MODE='navigate'
SEC_FETCH_SITE='none'
SEC_FETCH_USER='?1'
UPGRADE_INSECURE_REQUESTS='1'
USER_AGENT='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0'
```

## Core Implementation

### 1. Main Scraper Module (bet365_scraper.py)

```python
#!/usr/bin/env python3
"""
Bet365 API Scraper
A module for fetching odds data from Bet365's API
"""

import os
import logging
import requests
from dotenv import load_dotenv
from typing import Dict, List, Optional, Any, Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class Bet365Scraper:
    """
    Scraper for Bet365 API to collect odds data
    """
    
    def __init__(self, env_file: str = '.env.bet365'):
        """
        Initialize the scraper with environment variables
        
        Args:
            env_file: Path to the environment file
        """
        # Load environment variables
        load_dotenv(env_file)
        
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
            return self._process_response(response.text, sport_filter)
            
        except requests.exceptions.ConnectionError as e:
            logging.error(f"Connection error: {e}")
            return []
        except requests.exceptions.Timeout as e:
            logging.error(f"Timeout error: {e}")
            return []
        except requests.exceptions.RequestException as e:
            logging.error(f"Request error: {e}")
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
                'timestamp': self._extract_data(item, 'PD', 'BC'),
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
                scores = event['scores'].split('-')
                if len(scores) == 2:
                    event['home_score'] = int(scores[0].strip())
                    event['away_score'] = int(scores[1].strip())
            
            # Extract odds data (implementation depends on the exact format)
            # This is a placeholder for the actual odds extraction
            
            return event
            
        except Exception as e:
            logging.error(f"Error parsing event: {e}")
            return None
    
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
    """Main function to run the scraper"""
    scraper = Bet365Scraper()
    events = scraper.fetch_data()
    
    # Print results
    for i, event in enumerate(events):
        print(f"\nEvent {i+1}:")
        for key, value in event.items():
            print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
```

### 2. Data Processor Module (bet365_processor.py)

```python
#!/usr/bin/env python3
"""
Bet365 Data Processor
A module for processing and storing data from the Bet365 API
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class Bet365Processor:
    """
    Processor for Bet365 API data
    """
    
    def __init__(self, output_dir: str = 'data/raw/bet365'):
        """
        Initialize the processor
        
        Args:
            output_dir: Directory to save processed data
        """
        self.output_dir = output_dir
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        logging.info(f"Bet365Processor initialized with output directory: {output_dir}")
    
    def process_events(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process events data
        
        Args:
            events: List of events from the scraper
            
        Returns:
            Processed events
        """
        if not events:
            logging.warning("No events to process")
            return []
        
        logging.info(f"Processing {len(events)} events")
        
        processed_events = []
        
        for event in events:
            # Add timestamp
            event['processed_at'] = datetime.now().isoformat()
            
            # Parse team names and scores if not already done
            if 'teams' in event and 'home_team' not in event:
                self._parse_teams(event)
            
            if 'scores' in event and 'home_score' not in event:
                self._parse_scores(event)
            
            # Calculate implied probabilities if odds are available
            if 'odds' in event and event['odds']:
                self._calculate_implied_probabilities(event)
            
            processed_events.append(event)
        
        # Save to file
        self._save_to_file(processed_events)
        
        logging.info(f"Processed {len(processed_events)} events")
        return processed_events
    
    def _parse_teams(self, event: Dict[str, Any]) -> None:
        """
        Parse team names from the teams field
        
        Args:
            event: Event data
        """
        if 'teams' in event and event['teams']:
            teams = event['teams'].split(' v ')
            if len(teams) == 2:
                event['home_team'] = teams[0].strip()
                event['away_team'] = teams[1].strip()
    
    def _parse_scores(self, event: Dict[str, Any]) -> None:
        """
        Parse scores from the scores field
        
        Args:
            event: Event data
        """
        if 'scores' in event and event['scores']:
            try:
                scores = event['scores'].split('-')
                if len(scores) == 2:
                    event['home_score'] = int(scores[0].strip())
                    event['away_score'] = int(scores[1].strip())
            except (ValueError, IndexError):
                logging.warning(f"Could not parse scores: {event['scores']}")
    
    def _calculate_implied_probabilities(self, event: Dict[str, Any]) -> None:
        """
        Calculate implied probabilities from odds
        
        Args:
            event: Event data
        """
        # Implementation depends on the odds format
        # This is a placeholder for the actual calculation
        pass
    
    def _save_to_file(self, events: List[Dict[str, Any]]) -> None:
        """
        Save processed events to file
        
        Args:
            events: Processed events
        """
        if not events:
            return
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"bet365_events_{timestamp}.json"
        filepath = os.path.join(self.output_dir, filename)
        
        # Write to file
        with open(filepath, 'w') as f:
            json.dump(events, f, indent=2)
        
        logging.info(f"Saved {len(events)} events to {filepath}")


def main():
    """Main function to test the processor"""
    # This would typically be called with actual events from the scraper
    processor = Bet365Processor()
    
    # Example event for testing
    example_events = [
        {
            'league': 'Premier League',
            'league_id': '1',
            'teams': 'Manchester United v Liverpool',
            'scores': '2-1',
            'match_time': '70:00',
            'betting_status': 'Open',
            'timestamp': '2025-03-18T10:00:00',
            'odds': {
                'home': 2.10,
                'draw': 3.50,
                'away': 3.20
            }
        }
    ]
    
    processed = processor.process_events(example_events)
    print(json.dumps(processed, indent=2))


if __name__ == "__main__":
    main()
```

### 3. Data Models (bet365_models.py)

```python
#!/usr/bin/env python3
"""
Bet365 Data Models
Data models for Bet365 API data
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime


@dataclass
class Odds:
    """Odds data for an event"""
    home: Optional[float] = None
    draw: Optional[float] = None
    away: Optional[float] = None
    home_implied_probability: Optional[float] = None
    draw_implied_probability: Optional[float] = None
    away_implied_probability: Optional[float] = None
    
    # Additional odds types can be added here
    handicap: Dict[str, float] = field(default_factory=dict)
    total_goals: Dict[str, float] = field(default_factory=dict)
    
    def calculate_implied_probabilities(self) -> None:
        """Calculate implied probabilities from odds"""
        if self.home:
            self.home_implied_probability = 1 / self.home
        
        if self.draw:
            self.draw_implied_probability = 1 / self.draw
        
        if self.away:
            self.away_implied_probability = 1 / self.away


@dataclass
class Event:
    """Event data from Bet365"""
    league: str
    league_id: str
    home_team: str
    away_team: str
    match_time: str
    betting_status: str
    timestamp: str
    processed_at: str = field(default_factory=lambda: datetime.now().isoformat())
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    odds: Odds = field(default_factory=Odds)
    raw_data: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def is_live(self) -> bool:
        """Check if the event is live"""
        return self.match_time != '00:00' and self.betting_status == 'Open'
    
    @property
    def score_difference(self) -> Optional[int]:
        """Calculate score difference (home - away)"""
        if self.home_score is not None and self.away_score is not None:
            return self.home_score - self.away_score
        return None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Event':
        """Create an Event from a dictionary"""
        odds = Odds()
        if 'odds' in data and data['odds']:
            odds = Odds(
                home=data['odds'].get('home'),
                draw=data['odds'].get('draw'),
                away=data['odds'].get('away')
            )
            odds.calculate_implied_probabilities()
        
        return cls(
            league=data.get('league', ''),
            league_id=data.get('league_id', ''),
            home_team=data.get('home_team', ''),
            away_team=data.get('away_team', ''),
            match_time=data.get('match_time', ''),
            betting_status=data.get('betting_status', ''),
            timestamp=data.get('timestamp', ''),
            processed_at=data.get('processed_at', datetime.now().isoformat()),
            home_score=data.get('home_score'),
            away_score=data.get('away_score'),
            odds=odds,
            raw_data=data
        )


@dataclass
class EventCollection:
    """Collection of events"""
    events: List[Event] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def add_event(self, event: Event) -> None:
        """Add an event to the collection"""
        self.events.append(event)
    
    def get_live_events(self) -> List[Event]:
        """Get all live events"""
        return [event for event in self.events if event.is_live]
    
    def get_events_by_league(self, league: str) -> List[Event]:
        """Get events by league"""
        return [event for event in self.events if event.league == league]
    
    def get_events_by_team(self, team: str) -> List[Event]:
        """Get events by team (home or away)"""
        return [
            event for event in self.events 
            if team in event.home_team or team in event.away_team
        ]
    
    @classmethod
    def from_dict_list(cls, data: List[Dict[str, Any]]) -> 'EventCollection':
        """Create an EventCollection from a list of dictionaries"""
        collection = cls()
        for item in data:
            collection.add_event(Event.from_dict(item))
        return collection
```

## Integration with ML Pipeline

### 1. Feature Engineering

Create a new module `bet365_features.py` to extract features from Bet365 data:

```python
#!/usr/bin/env python3
"""
Bet365 Feature Engineering
Extract features from Bet365 data for ML models
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class Bet365FeatureExtractor:
    """
    Extract features from Bet365 data for ML models
    """
    
    def __init__(self):
        """Initialize the feature extractor"""
        logging.info("Bet365FeatureExtractor initialized")
    
    def extract_features(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract features from events
        
        Args:
            events: List of events
            
        Returns:
            List of feature dictionaries
        """
        features = []
        
        for event in events:
            # Skip events without necessary data
            if not self._validate_event(event):
                continue
            
            # Extract basic features
            event_features = {
                'event_id': self._generate_event_id(event),
                'league': event.get('league', ''),
                'home_team': event.get('home_team', ''),
                'away_team': event.get('away_team', ''),
                'timestamp': datetime.now().isoformat()
            }
            
            # Add odds-based features
            self._add_odds_features(event_features, event)
            
            # Add score-based features
            self._add_score_features(event_features, event)
            
            # Add time-based features
            self._add_time_features(event_features, event)
            
            features.append(event_features)
        
        logging.info(f"Extracted features for {len(features)} events")
        return features
    
    def _validate_event(self, event: Dict[str, Any]) -> bool:
        """
        Validate that an event has the necessary data
        
        Args:
            event: Event data
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = ['home_team', 'away_team', 'league']
        return all(field in event for field in required_fields)
    
    def _generate_event_id(self, event: Dict[str, Any]) -> str:
        """
        Generate a unique ID for an event
        
        Args:
            event: Event data
            
        Returns:
            Event ID
        """
        # Create a unique ID based on teams and timestamp
        home = event.get('home_team', '').replace(' ', '_')
        away = event.get('away_team', '').replace(' ', '_')
        timestamp = event.get('timestamp', '').split('T')[0]
        
        return f"{home}_vs_{away}_{timestamp}"
    
    def _add_odds_features(self, features: Dict[str, Any], event: Dict[str, Any]) -> None:
        """
        Add odds-based features
        
        Args:
            features: Feature dictionary to update
            event: Event data
        """
        if 'odds' not in event or not event['odds']:
            return
        
        odds = event['odds']
        
        # Basic odds
        features['home_odds'] = odds.get('home')
        features['draw_odds'] = odds.get('draw')
        features['away_odds'] = odds.get('away')
        
        # Implied probabilities
        if 'home' in odds and odds['home']:
            features['home_implied_prob'] = 1 / odds['home']
        
        if 'draw' in odds and odds['draw']:
            features['draw_implied_prob'] = 1 / odds['draw']
        
        if 'away' in odds and odds['away']:
            features['away_implied_prob'] = 1 / odds['away']
        
        # Favorite indicator
        if 'home' in odds and 'away' in odds and odds['home'] and odds['away']:
            features['home_is_favorite'] = 1 if odds['home'] < odds['away'] else 0
    
    def _add_score_features(self, features: Dict[str, Any], event: Dict[str, Any]) -> None:
        """
        Add score-based features
        
        Args:
            features: Feature dictionary to update
            event: Event data
        """
        if 'home_score' not in event or 'away_score' not in event:
            return
        
        features['home_score'] = event['home_score']
        features['away_score'] = event['away_score']
        features['total_score'] = event['home_score'] + event['away_score']
        features['score_difference'] = event['home_score'] - event['away_score']
        features['home_leading'] = 1 if event['home_score'] > event['away_score'] else 0
    
    def _add_time_features(self, features: Dict[str, Any], event: Dict[str, Any]) -> None:
        """
        Add time-based features
        
        Args:
            features: Feature dictionary to update
            event: Event data
        """
        if 'match_time' not in event or not event['match_time']:
            return
        
        # Parse match time (format: "MM:SS")
        try:
            minutes, seconds = event['match_time'].split(':')
            match_minutes = int(minutes)
            
            features['match_minutes'] = match_minutes
            features['first_half'] = 1 if match_minutes < 45 else 0
            features['second_half'] = 1 if match_minutes >= 45 else 0
            features['late_game'] = 1 if match_minutes >= 75 else 0
        except (ValueError, IndexError):
            logging.warning(f"Could not parse match time: {event['match_time']}")
```

### 2. Integration Script

Create a script to integrate Bet365 data with the existing ML pipeline:

```python
#!/usr/bin/env python3
"""
Bet365 Integration Script
Integrates Bet365 data with the ML pipeline
"""

import os
import logging
import argparse
from typing import Dict, List, Any, Optional

from bet365_scraper import Bet365Scraper
from bet365_processor import Bet365Processor
from bet365_features import Bet365FeatureExtractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def run_bet365_pipeline(sport_filter: Optional[str] = None, save_raw: bool = True):
    """
    Run the Bet365 data pipeline
    
    Args:
        sport_filter: Optional filter for specific sport
        save_raw: Whether to save raw data
    
    Returns:
        Extracted features
    """
    logging.info(f"Running Bet365 pipeline for sport: {sport_filter or 'all'}")
    
    # Initialize components
    scraper = Bet365Scraper()
    processor = Bet365Processor()
    feature_extractor = Bet365FeatureExtractor()
    
    # Fetch data
    events = scraper.fetch_data(sport_filter)
    logging.info(f"Fetched {len(events)} events")
    
    # Process data
    processed_events = processor.process_events(events)
    logging.info(f"Processed {len(processed_events)} events")
    
    # Extract features
    features = feature_extractor.extract_features(processed_events)
    logging.info(f"Extracted features for {len(features)} events")
    
    return features

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Bet365 Integration Script')
    parser.add_argument('--sport', type=str, help='Sport filter')
    parser.add_argument('--no-save', action='store_true', help='Do not save raw data')
    
    args = parser.parse_args()
    
    features = run_bet365_pipeline(args.sport, not args.no_save)
    
    print(f"Extracted features for {len(features)} events")

if __name__ == "__main__":
    main()
```

## Usage Examples

### Basic Usage

```python
from bet365_scraper import Bet365Scraper

# Initialize scraper
scraper = Bet365Scraper()

# Fetch all events
events = scraper.fetch_data()

# Print events
for event in events:
    print(f"League: {event['league']}")
    print(f"Teams: {event['teams']}")
    print(f"Scores: {event['scores']}")
    print(f"Match Time: {event['match_time']}")
    print("---")
```

### Filtering by Sport

```python
from bet365_scraper import Bet365Scraper

# Initialize scraper
scraper = Bet365Scraper()

# Fetch football/soccer events only
football_events = scraper.fetch_data(sport_filter='football')

print(f"Found {len(football_events)} football events")
```

### Processing and Saving Data

```python
from bet365_scraper import Bet365Scraper
from bet365_processor import Bet365Processor

# Initialize components
scraper = Bet365Scraper()
processor = Bet365Processor(output_dir='data/bet365')

# Fetch data
events = scraper.fetch_data()

# Process and save data
processed_events = processor.process_events(events)

print(f"Processed and saved {len(processed_events)} events")
```

### Extracting Features for ML

```python
from bet365_scraper import Bet365Scraper
from bet365_processor import Bet365Processor
from bet365_features import Bet365FeatureExtractor

# Initialize components
scraper = Bet365Scraper()
processor = Bet365Processor()
feature_extractor = Bet365FeatureExtractor()

# Fetch and process data
events = scraper.fetch_data()
processed_events = processor.process_events(events)

# Extract features
features = feature_extractor.extract_features(processed_events)

print(f"Extracted features for {len(features)} events")
```

## Testing

Create unit tests for the scraper:

```python
#!/usr/bin/env python3
"""
Tests for Bet365 Scraper
"""

import unittest
from unittest.mock import patch, MagicMock
import os
import json

from bet365_scraper import Bet365Scraper
from bet365_processor import Bet365Processor

class TestBet365Scraper(unittest.TestCase):
    """Test cases for Bet365Scraper"""
    
    def setUp(self):
        """Set up test environment"""
        # Create a mock environment
        self.env_patcher = patch.dict('os.environ', {
            'INPLAYDIARYAPI': 'https://example.com/api',
            'ACCEPT': 'text/html',
            'USER_AGENT': 'Test Agent'
        })
        self.env_patcher.start()
        
        # Create scraper instance
        self.scraper = Bet365Scraper()
    
    def tearDown(self):
        """Clean up after tests"""
        self.env_patcher.stop()
    
    @patch('requests.Session.get')
    def test_fetch_data(self, mock_get):
        """Test fetching data"""
        # Mock response
        mock_response = MagicMock()
        mock_response.text = 'EVFutebol Ao-Vivo CL Premier League CI 1 NA Manchester United v Liverpool VI 2-1 SM 70:00 CN'
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response
        
        # Call method
        events = self.scraper.fetch_data()
        
        # Assertions
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]['league'], 'Premier League')
        self.assertEqual(events[0]['teams'], 'Manchester United v Liverpool')
        self.assertEqual(events[0]['scores'], '2-1')
        self.assertEqual(events[0]['match_time'], '70:00')
    
    def test_extract_data(self):
        """Test extracting data from response"""
        # Test data
        test_item = 'CL Premier League CI 1 NA Manchester United v Liverpool VI 2-1 SM 70:00 CN'
        
        # Call method
        league = self.scraper._extract_data(test_item, 'CL', 'CI')
        teams = self.scraper._extract_data(test_item, 'NA', 'VI')
        scores = self.scraper._extract_data(test_item, 'VI', 'SM')
        
        # Assertions
        self.assertEqual(league, 'Premier League')
        self.assertEqual(teams, 'Manchester United v Liverpool')
        self.assertEqual(scores, '2-1')


class TestBet365Processor(unittest.TestCase):
    """Test cases for Bet365Processor"""
    
    def setUp(self):
        """Set up test environment"""
        # Create a temporary directory for output
        self.output_dir = 'test_output'
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Create processor instance
        self.processor = Bet365Processor(output_dir=self.output_dir)
    
    def tearDown(self):
        """Clean up after tests"""
        # Remove test files
        for file in os.listdir(self.output_dir):
            os.remove(os.path.join(self.output_dir, file))
        os.rmdir(self.output_dir)
    
    def test_process_events(self):
        """Test processing events"""
        # Test data
        test_events = [
            {
                'league': 'Premier League',
                'league_id': '1',
                'teams': 'Manchester United v Liverpool',
                'scores': '2-1',
                'match_time': '70:00',
                'betting_status': 'Open'
            }
        ]
        
        # Call method
        processed = self.processor.process_events(test_events)
        
        # Assertions
        self.assertEqual(len(processed), 1)
        self.assertEqual(processed[0]['home_team'], 'Manchester United')
        self.assertEqual(processed[0]['away_team'], 'Liverpool')
        self.assertEqual(processed[0]['home_score'], 2)
        self.assertEqual(processed[0]['away_score'], 1)
    
    def test_save_to_file(self):
        """Test saving to file"""
        # Test data
        test_events = [
            {
                'league': 'Premier League',
                'home_team': 'Manchester United',
                'away_team': 'Liverpool',
                'home_score': 2,
                'away_score': 1
            }
        ]
        
        # Call method
        self.processor._save_to_file(test_events)
        
        # Check if file was created
        files = os.listdir(self.output_dir)
        self.assertEqual(len(files), 1)
        
        # Check file contents
        with open(os.path.join(self.output_dir, files[0]), 'r') as f:
            saved_data = json.load(f)
        
        self.assertEqual(len(saved_data), 1)
        self.assertEqual(saved_data[0]['home_team'], 'Manchester United')


if __name__ == '__main__':
    unittest.main()
```

## Deployment

### Scheduled Execution

Create a script to run the Bet365 scraper on a schedule:

```python
#!/usr/bin/env python3
"""
Scheduled Bet365 Scraper
Runs the Bet365 scraper on a schedule
"""

import time
import logging
import schedule
from datetime import datetime

from bet365_scraper import Bet365Scraper
from bet365_processor import Bet365Processor
from bet365_features import Bet365FeatureExtractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='bet365_scheduler.log'
)

def run_scraper():
    """Run the scraper and process data"""
    logging.info(f"Running scheduled scraper at {datetime.now().isoformat()}")
    
    try:
        # Initialize components
        scraper = Bet365Scraper()
        processor = Bet365Processor()
        feature_extractor = Bet365FeatureExtractor()
        
        # Fetch data
        events = scraper.fetch_data()
        logging.info(f"Fetched {len(events)} events")
        
        # Process data
        processed_events = processor.process_events(events)
        logging.info(f"Processed {len(processed_events)} events")
        
        # Extract features
        features = feature_extractor.extract_features(processed_events)
        logging.info(f"Extracted features for {len(features)} events")
        
        logging.info("Scheduled run completed successfully")
    except Exception as e:
        logging.error(f"Error in scheduled run: {e}")

def main():
    """Main function"""
    logging.info("Starting Bet365 scheduler")
    
    # Schedule runs
    schedule.every(15).minutes.do(run_scraper)  # During active hours
    schedule.every().day.at("00:00").do(run_scraper)  # Daily run
    
    # Run immediately on startup
    run_scraper()
    
    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()
```

## Conclusion

This implementation guide provides a comprehensive approach to creating a Bet365 API scraper for enhancing our ML Sports Edge prediction system. The scraper is designed to collect real-time odds data, market movements, and in-play statistics from Bet365, which can be used to improve our prediction models.

When implementing this scraper, be sure to:

1. Set up proper environment variables with valid headers and cookies
2. Implement responsible scraping practices with rate limiting
3. Handle errors gracefully to ensure continuous operation
4. Process and store the data in a structured format
5. Extract meaningful features for the ML models

The integration with our existing ML pipeline will provide valuable market-based insights that complement the statistical data from other sources, resulting in more accurate predictions for our users.