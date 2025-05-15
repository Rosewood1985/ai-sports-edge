#!/usr/bin/env python3
"""
Data Processor
A module for processing and normalizing data from ESPN API and Bet365 API
"""

import os
import json
import logging
import pandas as pd
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

from espn_api_client import ESPNApiClient
from bet365_scraper import Bet365Scraper
from pinnacle_scraper import PinnacleScraper
from betmgm_scraper import BetMGMScraper
from ev_calculator import EVCalculator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class DataProcessor:
    """
    Processor for sports data from ESPN API and Bet365 API
    """
    
    def __init__(self, output_dir: str = 'data/processed'):
        """
        Initialize the data processor
        
        Args:
            output_dir: Directory to save processed data
        """
        self.output_dir = output_dir
        self.espn_client = ESPNApiClient()
        self.bet365_scraper = Bet365Scraper()
        self.pinnacle_scraper = PinnacleScraper()
        self.betmgm_scraper = BetMGMScraper()
        self.ev_calculator = EVCalculator()
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        logging.info("DataProcessor initialized")
    
    def process_data(self, sport: str, league: str) -> pd.DataFrame:
        """
        Process data for a specific sport and league
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            
        Returns:
            DataFrame with processed data
        """
        logging.info(f"Processing data for {sport}/{league}")
        
        # Get data from ESPN API
        espn_data = self._get_espn_data(sport, league)
        
        # Get data from Bet365 API
        bet365_data = self._get_bet365_data(sport)
        
        # Merge data
        merged_data = self._merge_data(espn_data, bet365_data)
        
        # Save processed data
        self._save_data(merged_data, sport, league)
        
        return merged_data
    
    def _get_espn_data(self, sport: str, league: str) -> pd.DataFrame:
        """
        Get and process data from ESPN API
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (e.g., 'nba', 'nfl')
            
        Returns:
            DataFrame with ESPN data
        """
        logging.info(f"Getting ESPN data for {sport}/{league}")
        
        # Get scoreboard data
        scoreboard = self.espn_client.get_scoreboard(sport, league)
        
        # Extract events
        events = scoreboard.get('events', [])
        
        # Process events
        processed_events = []
        
        for event in events:
            try:
                processed_event = self._process_espn_event(event, sport, league)
                if processed_event:
                    processed_events.append(processed_event)
            except Exception as e:
                logging.error(f"Error processing ESPN event: {e}")
        
        # Convert to DataFrame
        if processed_events:
            df = pd.DataFrame(processed_events)
            logging.info(f"Processed {len(df)} ESPN events")
            return df
        
        logging.warning(f"No ESPN events processed for {sport}/{league}")
        return pd.DataFrame()
    
    def _process_espn_event(self, event: Dict[str, Any], sport: str, league: str) -> Optional[Dict[str, Any]]:
        """
        Process an ESPN event
        
        Args:
            event: ESPN event data
            sport: Sport code
            league: League code
            
        Returns:
            Processed event data
        """
        # Extract basic event info
        event_id = event.get('id')
        if not event_id:
            return None
        
        # Get competition
        competitions = event.get('competitions', [])
        if not competitions:
            return None
        
        competition = competitions[0]
        
        # Get teams
        competitors = competition.get('competitors', [])
        if len(competitors) < 2:
            return None
        
        # Determine home and away teams
        home_team = None
        away_team = None
        
        for competitor in competitors:
            if competitor.get('homeAway') == 'home':
                home_team = competitor
            else:
                away_team = competitor
        
        if not home_team or not away_team:
            return None
        
        # Extract team info
        home_team_id = home_team.get('id')
        home_team_name = home_team.get('team', {}).get('displayName')
        home_team_abbrev = home_team.get('team', {}).get('abbreviation')
        home_team_score = home_team.get('score')
        
        away_team_id = away_team.get('id')
        away_team_name = away_team.get('team', {}).get('displayName')
        away_team_abbrev = away_team.get('team', {}).get('abbreviation')
        away_team_score = away_team.get('score')
        
        # Extract game status
        status = competition.get('status', {})
        status_type = status.get('type', {}).get('name')
        status_detail = status.get('type', {}).get('description')
        
        # Extract game time
        date = event.get('date')
        
        # Create processed event
        processed_event = {
            'event_id': event_id,
            'sport': sport,
            'league': league,
            'home_team_id': home_team_id,
            'home_team_name': home_team_name,
            'home_team_abbrev': home_team_abbrev,
            'home_team_score': home_team_score,
            'away_team_id': away_team_id,
            'away_team_name': away_team_name,
            'away_team_abbrev': away_team_abbrev,
            'away_team_score': away_team_score,
            'status': status_type,
            'status_detail': status_detail,
            'date': date,
            'data_source': 'espn'
        }
        
        # Get additional game details if game is in progress or completed
        if status_type in ['STATUS_IN_PROGRESS', 'STATUS_FINAL']:
            try:
                game_details = self.espn_client.get_game(sport, league, event_id)
                
                # Extract additional stats
                stats = self._extract_game_stats(game_details, sport)
                processed_event.update(stats)
                
            except Exception as e:
                logging.error(f"Error getting game details: {e}")
        
        return processed_event
    
    def _extract_game_stats(self, game_details: Dict[str, Any], sport: str) -> Dict[str, Any]:
        """
        Extract stats from game details
        
        Args:
            game_details: Game details from ESPN API
            sport: Sport code
            
        Returns:
            Dictionary of game stats
        """
        stats = {}
        
        # Extract stats based on sport
        if sport == 'basketball':
            stats = self._extract_basketball_stats(game_details)
        elif sport == 'football':
            stats = self._extract_football_stats(game_details)
        elif sport == 'baseball':
            stats = self._extract_baseball_stats(game_details)
        
        return stats
    
    def _extract_basketball_stats(self, game_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract basketball-specific stats
        
        Args:
            game_details: Game details from ESPN API
            
        Returns:
            Dictionary of basketball stats
        """
        stats = {}
        
        # Extract team stats
        boxscore = game_details.get('boxscore', {})
        teams = boxscore.get('teams', [])
        
        if len(teams) >= 2:
            home_stats = teams[0].get('statistics', [])
            away_stats = teams[1].get('statistics', [])
            
            # Process home team stats
            for stat in home_stats:
                name = stat.get('name')
                value = stat.get('displayValue')
                if name and value:
                    stats[f'home_{name.lower().replace(" ", "_")}'] = value
            
            # Process away team stats
            for stat in away_stats:
                name = stat.get('name')
                value = stat.get('displayValue')
                if name and value:
                    stats[f'away_{name.lower().replace(" ", "_")}'] = value
        
        return stats
    
    def _extract_football_stats(self, game_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract football-specific stats
        
        Args:
            game_details: Game details from ESPN API
            
        Returns:
            Dictionary of football stats
        """
        stats = {}
        
        # Extract team stats
        boxscore = game_details.get('boxscore', {})
        teams = boxscore.get('teams', [])
        
        if len(teams) >= 2:
            home_stats = teams[0].get('statistics', [])
            away_stats = teams[1].get('statistics', [])
            
            # Process home team stats
            for stat in home_stats:
                name = stat.get('name')
                value = stat.get('displayValue')
                if name and value:
                    stats[f'home_{name.lower().replace(" ", "_")}'] = value
            
            # Process away team stats
            for stat in away_stats:
                name = stat.get('name')
                value = stat.get('displayValue')
                if name and value:
                    stats[f'away_{name.lower().replace(" ", "_")}'] = value
        
        return stats
    
    def _extract_baseball_stats(self, game_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract baseball-specific stats
        
        Args:
            game_details: Game details from ESPN API
            
        Returns:
            Dictionary of baseball stats
        """
        stats = {}
        
        # Extract team stats
        boxscore = game_details.get('boxscore', {})
        teams = boxscore.get('teams', [])
        
        if len(teams) >= 2:
            home_stats = teams[0].get('statistics', [])
            away_stats = teams[1].get('statistics', [])
            
            # Process home team stats
            for stat in home_stats:
                name = stat.get('name')
                value = stat.get('displayValue')
                if name and value:
                    stats[f'home_{name.lower().replace(" ", "_")}'] = value
            
            # Process away team stats
            for stat in away_stats:
                name = stat.get('name')
                value = stat.get('displayValue')
                if name and value:
                    stats[f'away_{name.lower().replace(" ", "_")}'] = value
        
        return stats
    
    def _get_bet365_data(self, sport: str) -> pd.DataFrame:
        """
        Get and process data from Bet365 API
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            
        Returns:
            DataFrame with Bet365 data
        """
        logging.info(f"Getting Bet365 data for {sport}")
        
        # Map ESPN sport codes to Bet365 sport names
        sport_map = {
            'basketball': 'basketball',
            'football': 'football',
            'baseball': 'baseball',
            'soccer': 'soccer'
        }
        
        bet365_sport = sport_map.get(sport, sport)
        
        # Get events from Bet365
        events = self.bet365_scraper.fetch_data(bet365_sport)
        
        # Process events
        processed_events = []
        
        for event in events:
            try:
                processed_event = self._process_bet365_event(event)
                if processed_event:
                    processed_events.append(processed_event)
            except Exception as e:
                logging.error(f"Error processing Bet365 event: {e}")
        
        # Convert to DataFrame
        if processed_events:
            df = pd.DataFrame(processed_events)
            logging.info(f"Processed {len(df)} Bet365 events")
            return df
        
        logging.warning(f"No Bet365 events processed for {sport}")
        return pd.DataFrame()
    
    def _process_bet365_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Process a Bet365 event
        
        Args:
            event: Bet365 event data
            
        Returns:
            Processed event data
        """
        # Check if event has required fields
        if not event.get('home_team') or not event.get('away_team'):
            return None
        
        # Create processed event
        processed_event = {
            'home_team_name': event.get('home_team'),
            'away_team_name': event.get('away_team'),
            'league': event.get('league'),
            'match_time': event.get('match_time'),
            'betting_status': event.get('betting_status'),
            'data_source': 'bet365'
        }
        
        # Add scores if available
        if 'home_score' in event and 'away_score' in event:
            processed_event['home_team_score'] = event.get('home_score')
            processed_event['away_team_score'] = event.get('away_score')
        
        # Add odds if available
        odds = event.get('odds', {})
        if odds:
            processed_event['home_odds'] = odds.get('home')
            processed_event['draw_odds'] = odds.get('draw')
            processed_event['away_odds'] = odds.get('away')
            processed_event['home_implied_probability'] = odds.get('home_implied_probability')
            processed_event['draw_implied_probability'] = odds.get('draw_implied_probability')
            processed_event['away_implied_probability'] = odds.get('away_implied_probability')
        
        return processed_event
    
    def _merge_data(self, espn_df: pd.DataFrame, bet365_df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge data from ESPN and Bet365
        
        Args:
            espn_df: DataFrame with ESPN data
            bet365_df: DataFrame with Bet365 data
            
        Returns:
            Merged DataFrame
        """
        logging.info("Merging ESPN and Bet365 data")
        
        # Check if both DataFrames have data
        if espn_df.empty and bet365_df.empty:
            logging.warning("No data to merge")
            return pd.DataFrame()
        
        if espn_df.empty:
            logging.warning("No ESPN data to merge")
            return bet365_df
        
        if bet365_df.empty:
            logging.warning("No Bet365 data to merge")
            return espn_df
        
        # Create a copy of the DataFrames
        espn_df_copy = espn_df.copy()
        bet365_df_copy = bet365_df.copy()
        
        # Create a key for matching events
        espn_df_copy['match_key'] = espn_df_copy.apply(
            lambda row: f"{row['home_team_name']} vs {row['away_team_name']}".lower(), axis=1
        )
        
        bet365_df_copy['match_key'] = bet365_df_copy.apply(
            lambda row: f"{row['home_team_name']} vs {row['away_team_name']}".lower(), axis=1
        )
        
        # Merge DataFrames on match_key
        merged_df = pd.merge(
            espn_df_copy,
            bet365_df_copy,
            on='match_key',
            how='outer',
            suffixes=('_espn', '_bet365')
        )
        
        # Clean up merged DataFrame
        merged_df = self._clean_merged_data(merged_df)
        
        # Add EV data
        merged_df = self._add_ev_data(merged_df)
        
        logging.info(f"Merged data has {len(merged_df)} rows")
        
        return merged_df
    
    def _clean_merged_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean merged data
        
        Args:
            df: Merged DataFrame
            
        Returns:
            Cleaned DataFrame
        """
        # Create a copy of the DataFrame
        cleaned_df = df.copy()
        
        # Combine columns from both sources
        columns_to_combine = [
            ('home_team_name', 'home_team_name_espn', 'home_team_name_bet365'),
            ('away_team_name', 'away_team_name_espn', 'away_team_name_bet365'),
            ('home_team_score', 'home_team_score_espn', 'home_team_score_bet365'),
            ('away_team_score', 'away_team_score_espn', 'away_team_score_bet365'),
            ('league', 'league_espn', 'league_bet365')
        ]
        
        for combined_col, espn_col, bet365_col in columns_to_combine:
            if espn_col in cleaned_df.columns and bet365_col in cleaned_df.columns:
                cleaned_df[combined_col] = cleaned_df[espn_col].combine_first(cleaned_df[bet365_col])
                cleaned_df = cleaned_df.drop([espn_col, bet365_col], axis=1)
        
        # Add source indicator
        cleaned_df['has_espn_data'] = ~cleaned_df['data_source_espn'].isna()
        cleaned_df['has_bet365_data'] = ~cleaned_df['data_source_bet365'].isna()
        
        # Drop unnecessary columns
        if 'data_source_espn' in cleaned_df.columns:
            cleaned_df = cleaned_df.drop('data_source_espn', axis=1)
        
        if 'data_source_bet365' in cleaned_df.columns:
            cleaned_df = cleaned_df.drop('data_source_bet365', axis=1)
        
        if 'match_key' in cleaned_df.columns:
            cleaned_df = cleaned_df.drop('match_key', axis=1)
        
        # Add timestamp
        cleaned_df['processed_at'] = datetime.now().isoformat()
        
        return cleaned_df
    
    def _add_ev_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add EV data to the merged DataFrame
        
        Args:
            df: Merged DataFrame
            
        Returns:
            DataFrame with EV data
        """
        logging.info("Adding EV data")
        
        if df.empty:
            logging.warning("No data to add EV data to")
            return df
        
        # Create a copy of the DataFrame
        df_copy = df.copy()
        
        # Add EV data for each row
        for i, row in df_copy.iterrows():
            # Get EV features
            ev_features = self.ev_calculator.get_ev_features({
                'home_team_name': row.get('home_team_name'),
                'away_team_name': row.get('away_team_name')
            })
            
            # Add EV features to DataFrame
            for feature, value in ev_features.items():
                df_copy.at[i, feature] = value
        
        # Find +EV bets for the current sport and league
        try:
            sport = df_copy['sport'].iloc[0] if 'sport' in df_copy.columns else None
            league = df_copy['league'].iloc[0] if 'league' in df_copy.columns else None
            
            if sport:
                # Find +EV bets in the background
                self.ev_calculator.find_ev_bets(sport, league)
        except Exception as e:
            logging.error(f"Error finding +EV bets: {e}")
        
        return df_copy
    
    def _save_data(self, df: pd.DataFrame, sport: str, league: str) -> None:
        """
        Save processed data
        
        Args:
            df: DataFrame with processed data
            sport: Sport code
            league: League code
        """
        if df.empty:
            logging.warning(f"No data to save for {sport}/{league}")
            return
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{sport}_{league}_{timestamp}.csv"
        filepath = os.path.join(self.output_dir, filename)
        
        # Save to CSV
        df.to_csv(filepath, index=False)
        
        logging.info(f"Saved processed data to {filepath}")


def main():
    """Main function to test the data processor"""
    processor = DataProcessor()
    
    # Process NBA data
    nba_data = processor.process_data('basketball', 'nba')
    print(f"Processed {len(nba_data)} NBA events")
    
    # Process NFL data
    nfl_data = processor.process_data('football', 'nfl')
    print(f"Processed {len(nfl_data)} NFL events")


if __name__ == "__main__":
    main()