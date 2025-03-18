#!/usr/bin/env python3
"""
EV Calculator
A module for calculating expected value (EV) of bets by comparing BetMGM odds against devigged Pinnacle odds
"""

import os
import json
import logging
import pandas as pd
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime

from pinnacle_scraper import PinnacleScraper
from betmgm_scraper import BetMGMScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class EVCalculator:
    """
    Calculate expected value (EV) of bets by comparing BetMGM odds against devigged Pinnacle odds
    """
    
    def __init__(self, output_dir: str = 'data/ev_bets'):
        """
        Initialize the EV calculator
        
        Args:
            output_dir: Directory to save EV bets
        """
        self.output_dir = output_dir
        self.pinnacle_scraper = PinnacleScraper()
        self.betmgm_scraper = BetMGMScraper()
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        logging.info("EVCalculator initialized")
    
    def find_ev_bets(self, sport: str, league: Optional[str] = None, min_ev: float = 2.0) -> List[Dict[str, Any]]:
        """
        Find +EV bets by comparing BetMGM odds against devigged Pinnacle odds
        
        Args:
            sport: Sport code (e.g., 'basketball', 'football')
            league: League code (optional)
            min_ev: Minimum EV percentage to include (default: 2.0%)
            
        Returns:
            List of +EV bets
        """
        logging.info(f"Finding +EV bets for {sport}/{league or 'all'}")
        
        # Fetch odds from Pinnacle
        pinnacle_odds = self.pinnacle_scraper.fetch_odds(sport, league)
        
        # Fetch odds from BetMGM
        betmgm_odds = self.betmgm_scraper.fetch_odds(sport, league)
        
        # Match events between Pinnacle and BetMGM
        matched_events = self._match_events(pinnacle_odds, betmgm_odds)
        
        # Calculate EV for each matched event
        ev_bets = []
        
        for match in matched_events:
            pinnacle_event = match['pinnacle_event']
            betmgm_event = match['betmgm_event']
            
            # Get Pinnacle odds
            pinnacle_moneyline = self._extract_pinnacle_moneyline(pinnacle_event)
            
            # Get BetMGM odds
            betmgm_event_odds = self.betmgm_scraper.fetch_event_odds(betmgm_event['id'])
            betmgm_moneyline = self.betmgm_scraper.extract_moneyline_odds(betmgm_event_odds)
            
            # Calculate EV
            ev_bet = self._calculate_ev_bet(
                pinnacle_moneyline,
                betmgm_moneyline,
                {
                    'sport': sport,
                    'league': league,
                    'pinnacle_event': pinnacle_event,
                    'betmgm_event': betmgm_event
                }
            )
            
            if ev_bet and ev_bet['max_ev'] >= min_ev:
                ev_bets.append(ev_bet)
        
        # Save EV bets
        self._save_ev_bets(ev_bets, sport, league)
        
        return ev_bets
    
    def _match_events(self, pinnacle_odds: List[Dict[str, Any]], betmgm_odds: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Match events between Pinnacle and BetMGM
        
        Args:
            pinnacle_odds: List of Pinnacle odds
            betmgm_odds: List of BetMGM odds
            
        Returns:
            List of matched events
        """
        matched_events = []
        
        # Extract Pinnacle events
        pinnacle_events = []
        for league in pinnacle_odds:
            for event in league.get('events', []):
                pinnacle_events.append(event)
        
        # Match events by team names
        for pinnacle_event in pinnacle_events:
            pinnacle_home = pinnacle_event.get('home', {}).get('name', '').lower()
            pinnacle_away = pinnacle_event.get('away', {}).get('name', '').lower()
            
            for betmgm_event in betmgm_odds:
                betmgm_home = betmgm_event.get('home_team', {}).get('name', '').lower()
                betmgm_away = betmgm_event.get('away_team', {}).get('name', '').lower()
                
                # Check if team names match
                if (pinnacle_home in betmgm_home or betmgm_home in pinnacle_home) and \
                   (pinnacle_away in betmgm_away or betmgm_away in pinnacle_away):
                    matched_events.append({
                        'pinnacle_event': pinnacle_event,
                        'betmgm_event': betmgm_event
                    })
                    break
        
        logging.info(f"Matched {len(matched_events)} events between Pinnacle and BetMGM")
        
        return matched_events
    
    def _extract_pinnacle_moneyline(self, event: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract moneyline odds from Pinnacle event
        
        Args:
            event: Pinnacle event data
            
        Returns:
            Dictionary with moneyline odds
        """
        odds = {}
        
        # Extract markets
        markets = event.get('markets', [])
        
        # Find moneyline market
        for market in markets:
            if market.get('key') == 'moneyline':
                prices = market.get('prices', [])
                
                for price in prices:
                    participant_type = price.get('participantType', '').lower()
                    decimal_odds = price.get('decimal')
                    
                    if participant_type == 'home':
                        odds['home_odds'] = float(decimal_odds) if decimal_odds else None
                    elif participant_type == 'away':
                        odds['away_odds'] = float(decimal_odds) if decimal_odds else None
                    elif participant_type == 'draw':
                        odds['draw_odds'] = float(decimal_odds) if decimal_odds else None
        
        return odds
    
    def _calculate_ev_bet(self, pinnacle_odds: Dict[str, float], betmgm_odds: Dict[str, float], event_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Calculate EV for a bet by comparing BetMGM odds against devigged Pinnacle odds
        
        Args:
            pinnacle_odds: Pinnacle moneyline odds
            betmgm_odds: BetMGM moneyline odds
            event_info: Event information
            
        Returns:
            Dictionary with EV bet information or None if no +EV bets found
        """
        # Check if we have all the necessary odds
        if not pinnacle_odds or not betmgm_odds:
            return None
        
        # Get home and away odds
        pinnacle_home = pinnacle_odds.get('home_odds')
        pinnacle_away = pinnacle_odds.get('away_odds')
        pinnacle_draw = pinnacle_odds.get('draw_odds')
        
        betmgm_home = betmgm_odds.get('home_odds')
        betmgm_away = betmgm_odds.get('away_odds')
        betmgm_draw = betmgm_odds.get('draw_odds')
        
        # Check if we have all the necessary odds
        if not pinnacle_home or not pinnacle_away or not betmgm_home or not betmgm_away:
            return None
        
        # Devig Pinnacle odds
        fair_odds = self.pinnacle_scraper.devig_odds(pinnacle_home, pinnacle_away, pinnacle_draw)
        
        # Calculate EV for home bet
        home_ev = self.pinnacle_scraper.calculate_ev(betmgm_home, fair_odds['fair_home_odds'])
        
        # Calculate EV for away bet
        away_ev = self.pinnacle_scraper.calculate_ev(betmgm_away, fair_odds['fair_away_odds'])
        
        # Calculate EV for draw bet (if applicable)
        draw_ev = None
        if pinnacle_draw and betmgm_draw and fair_odds['fair_draw_odds']:
            draw_ev = self.pinnacle_scraper.calculate_ev(betmgm_draw, fair_odds['fair_draw_odds'])
        
        # Determine best EV bet
        best_bet = 'home'
        max_ev = home_ev
        
        if away_ev > max_ev:
            best_bet = 'away'
            max_ev = away_ev
        
        if draw_ev and draw_ev > max_ev:
            best_bet = 'draw'
            max_ev = draw_ev
        
        # Create EV bet information
        ev_bet = {
            'sport': event_info['sport'],
            'league': event_info['league'],
            'home_team': event_info['betmgm_event'].get('home_team', {}).get('name'),
            'away_team': event_info['betmgm_event'].get('away_team', {}).get('name'),
            'pinnacle_home_odds': pinnacle_home,
            'pinnacle_away_odds': pinnacle_away,
            'pinnacle_draw_odds': pinnacle_draw,
            'betmgm_home_odds': betmgm_home,
            'betmgm_away_odds': betmgm_away,
            'betmgm_draw_odds': betmgm_draw,
            'fair_home_odds': fair_odds['fair_home_odds'],
            'fair_away_odds': fair_odds['fair_away_odds'],
            'fair_draw_odds': fair_odds['fair_draw_odds'],
            'home_ev': home_ev,
            'away_ev': away_ev,
            'draw_ev': draw_ev,
            'best_bet': best_bet,
            'max_ev': max_ev,
            'betmgm_event_id': event_info['betmgm_event'].get('id'),
            'pinnacle_event_id': event_info['pinnacle_event'].get('id'),
            'timestamp': datetime.now().isoformat()
        }
        
        return ev_bet
    
    def _save_ev_bets(self, ev_bets: List[Dict[str, Any]], sport: str, league: Optional[str] = None) -> None:
        """
        Save EV bets to file
        
        Args:
            ev_bets: List of EV bets
            sport: Sport code
            league: League code (optional)
        """
        if not ev_bets:
            logging.warning(f"No EV bets to save for {sport}/{league or 'all'}")
            return
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{sport}_{league or 'all'}_ev_bets_{timestamp}.json"
        filepath = os.path.join(self.output_dir, filename)
        
        # Save to file
        with open(filepath, 'w') as f:
            json.dump(ev_bets, f, indent=2)
        
        logging.info(f"Saved {len(ev_bets)} EV bets to {filepath}")
    
    def get_ev_features(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get EV features for an event
        
        Args:
            event: Event data
            
        Returns:
            Dictionary with EV features
        """
        # Extract team names
        home_team = event.get('home_team_name', '').lower()
        away_team = event.get('away_team_name', '').lower()
        
        # Find matching EV bets
        ev_bets = self._find_matching_ev_bets(home_team, away_team)
        
        if not ev_bets:
            return {}
        
        # Get the most recent EV bet
        ev_bet = ev_bets[0]
        
        # Extract features
        features = {
            'home_ev': ev_bet.get('home_ev'),
            'away_ev': ev_bet.get('away_ev'),
            'draw_ev': ev_bet.get('draw_ev'),
            'best_bet': ev_bet.get('best_bet'),
            'max_ev': ev_bet.get('max_ev'),
            'pinnacle_home_odds': ev_bet.get('pinnacle_home_odds'),
            'pinnacle_away_odds': ev_bet.get('pinnacle_away_odds'),
            'pinnacle_draw_odds': ev_bet.get('pinnacle_draw_odds'),
            'betmgm_home_odds': ev_bet.get('betmgm_home_odds'),
            'betmgm_away_odds': ev_bet.get('betmgm_away_odds'),
            'betmgm_draw_odds': ev_bet.get('betmgm_draw_odds'),
            'fair_home_odds': ev_bet.get('fair_home_odds'),
            'fair_away_odds': ev_bet.get('fair_away_odds'),
            'fair_draw_odds': ev_bet.get('fair_draw_odds'),
            'home_value': ev_bet.get('home_ev') > 0,
            'away_value': ev_bet.get('away_ev') > 0,
            'draw_value': ev_bet.get('draw_ev', 0) > 0,
            'ev_timestamp': ev_bet.get('timestamp')
        }
        
        return features
    
    def _find_matching_ev_bets(self, home_team: str, away_team: str) -> List[Dict[str, Any]]:
        """
        Find matching EV bets for a given matchup
        
        Args:
            home_team: Home team name
            away_team: Away team name
            
        Returns:
            List of matching EV bets
        """
        matching_bets = []
        
        # Get all EV bet files
        ev_files = [f for f in os.listdir(self.output_dir) if f.endswith('.json')]
        
        for file in sorted(ev_files, reverse=True):  # Sort by filename (which includes timestamp)
            filepath = os.path.join(self.output_dir, file)
            
            try:
                with open(filepath, 'r') as f:
                    ev_bets = json.load(f)
                
                for bet in ev_bets:
                    bet_home = bet.get('home_team', '').lower()
                    bet_away = bet.get('away_team', '').lower()
                    
                    # Check if team names match
                    if (home_team in bet_home or bet_home in home_team) and \
                       (away_team in bet_away or bet_away in away_team):
                        matching_bets.append(bet)
            except Exception as e:
                logging.error(f"Error loading EV bets from {filepath}: {e}")
        
        return matching_bets


def main():
    """Main function to test the EV calculator"""
    calculator = EVCalculator()
    
    # Find EV bets for NBA
    ev_bets = calculator.find_ev_bets('basketball', 'nba')
    
    if ev_bets:
        print(f"Found {len(ev_bets)} +EV bets for NBA")
        
        for i, bet in enumerate(ev_bets):
            print(f"\nEV Bet {i+1}:")
            print(f"  {bet['home_team']} vs {bet['away_team']}")
            print(f"  Best bet: {bet['best_bet']} with {bet['max_ev']:.2f}% EV")
            print(f"  BetMGM odds: {bet[f'betmgm_{bet['best_bet']}_odds']:.2f}")
            print(f"  Fair odds: {bet[f'fair_{bet['best_bet']}_odds']:.2f}")
    else:
        print("No +EV bets found for NBA")


if __name__ == "__main__":
    main()