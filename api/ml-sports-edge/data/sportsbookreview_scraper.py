#!/usr/bin/env python3
"""
Sportsbookreview.com Scraper
----------------------------
This scraper collects historical odds data from sportsbookreview.com going back to 2011.
It provides valuable historical betting data for the AI Sports Edge ML model.
"""

import os
import sys
import time
import json
import argparse
import requests
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

# Base directory for storing scraped data
BASE_DIR = Path(__file__).parent / "historical" / "sportsbookreview"

# Ensure the directory exists
BASE_DIR.mkdir(parents=True, exist_ok=True)

# Constants
SPORTS = {
    "nba": 3,
    "nfl": 1,
    "mlb": 2,
    "nhl": 4,
    "ncaab": 5,
    "ncaaf": 6,
}

# Base URL for the API
BASE_URL = "https://www.sportsbookreview.com/ms-odds-v2/odds-v2-service"

# Headers to mimic a browser request
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.sportsbookreview.com/",
    "Origin": "https://www.sportsbookreview.com",
}

def get_odds_data(sport_id, date_str):
    """
    Fetch odds data for a specific sport and date
    
    Args:
        sport_id (int): Sport ID according to sportsbookreview.com
        date_str (str): Date string in YYYY-MM-DD format
        
    Returns:
        dict: JSON response from the API
    """
    url = f"{BASE_URL}/v2/sports/{sport_id}/events/date/{date_str}"
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for {date_str}: {e}")
        return None

def process_odds_data(data, sport):
    """
    Process the raw odds data into a structured format
    
    Args:
        data (dict): Raw odds data from the API
        sport (str): Sport name
        
    Returns:
        list: List of processed game data
    """
    if not data or "events" not in data:
        return []
    
    processed_games = []
    
    for event in data["events"]:
        try:
            # Basic game info
            game_info = {
                "sport": sport,
                "game_id": event.get("id"),
                "start_time": event.get("startTime"),
                "home_team": event.get("homeTeam", {}).get("name"),
                "away_team": event.get("awayTeam", {}).get("name"),
                "home_score": event.get("homeScore"),
                "away_score": event.get("awayScore"),
                "status": event.get("status"),
                "bookmakers": []
            }
            
            # Process odds from different bookmakers
            if "eventGroup" in event and "markets" in event["eventGroup"]:
                for market in event["eventGroup"]["markets"]:
                    if market.get("type") == "MONEYLINE":
                        for outcome in market.get("outcomes", []):
                            for book in outcome.get("books", []):
                                bookmaker_info = {
                                    "bookmaker": book.get("name"),
                                    "team": outcome.get("team"),
                                    "price": book.get("price"),
                                    "is_home": outcome.get("team") == game_info["home_team"]
                                }
                                game_info["bookmakers"].append(bookmaker_info)
            
            processed_games.append(game_info)
        except Exception as e:
            print(f"Error processing event: {e}")
            continue
    
    return processed_games

def scrape_date_range(sport, start_date, end_date):
    """
    Scrape odds data for a date range
    
    Args:
        sport (str): Sport name (nba, nfl, mlb, nhl, ncaab, ncaaf)
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
        
    Returns:
        dict: Dictionary with dates as keys and processed game data as values
    """
    if sport not in SPORTS:
        print(f"Invalid sport: {sport}. Available sports: {', '.join(SPORTS.keys())}")
        return {}
    
    sport_id = SPORTS[sport]
    
    # Convert string dates to datetime objects
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    # Initialize results dictionary
    results = {}
    
    # Iterate through each date in the range
    current_date = start
    while current_date <= end:
        date_str = current_date.strftime("%Y-%m-%d")
        print(f"Scraping {sport} data for {date_str}...")
        
        # Get odds data for the current date
        data = get_odds_data(sport_id, date_str)
        
        # Process the data
        if data:
            processed_data = process_odds_data(data, sport)
            results[date_str] = processed_data
            
            # Save data for each date to avoid losing everything if the script crashes
            save_path = BASE_DIR / sport / f"{date_str}.json"
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(save_path, "w") as f:
                json.dump(processed_data, f, indent=2)
            
            print(f"Saved {len(processed_data)} games for {date_str}")
        
        # Sleep to avoid rate limiting
        time.sleep(1)
        
        # Move to the next date
        current_date += timedelta(days=1)
    
    return results

def save_to_csv(data, sport, start_date, end_date):
    """
    Save the scraped data to a CSV file
    
    Args:
        data (dict): Dictionary with dates as keys and processed game data as values
        sport (str): Sport name
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
    """
    # Flatten the data
    flattened_data = []
    for date, games in data.items():
        for game in games:
            for bookmaker in game.get("bookmakers", []):
                flat_game = {
                    "date": date,
                    "sport": game["sport"],
                    "game_id": game["game_id"],
                    "start_time": game["start_time"],
                    "home_team": game["home_team"],
                    "away_team": game["away_team"],
                    "home_score": game["home_score"],
                    "away_score": game["away_score"],
                    "status": game["status"],
                    "bookmaker": bookmaker["bookmaker"],
                    "team": bookmaker["team"],
                    "price": bookmaker["price"],
                    "is_home": bookmaker["is_home"]
                }
                flattened_data.append(flat_game)
    
    # Convert to DataFrame
    df = pd.DataFrame(flattened_data)
    
    # Save to CSV
    csv_path = BASE_DIR / f"{sport}_{start_date}_to_{end_date}.csv"
    df.to_csv(csv_path, index=False)
    print(f"Saved data to {csv_path}")

def convert_to_ml_format(sport, start_date, end_date):
    """
    Convert the scraped data to a format suitable for the ML model
    
    Args:
        sport (str): Sport name
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
        
    Returns:
        list: List of games in ML model format
    """
    # Path to the directory containing JSON files
    sport_dir = BASE_DIR / sport
    
    if not sport_dir.exists():
        print(f"No data found for {sport}")
        return []
    
    # Initialize list to store all games
    all_games = []
    
    # Iterate through each JSON file in the directory
    for json_file in sport_dir.glob("*.json"):
        with open(json_file, "r") as f:
            games = json.load(f)
            
            for game in games:
                # Extract the consensus odds (average of all bookmakers)
                home_odds = []
                away_odds = []
                
                for bookmaker in game.get("bookmakers", []):
                    if bookmaker["is_home"]:
                        home_odds.append(bookmaker["price"])
                    else:
                        away_odds.append(bookmaker["price"])
                
                # Calculate average odds
                avg_home_odds = sum(home_odds) / len(home_odds) if home_odds else None
                avg_away_odds = sum(away_odds) / len(away_odds) if away_odds else None
                
                # Convert to ML model format
                ml_game = {
                    "date": json_file.stem,  # Date from filename
                    "sport": game["sport"],
                    "homeTeam": game["home_team"],
                    "awayTeam": game["away_team"],
                    "homeScore": game["home_score"],
                    "awayScore": game["away_score"],
                    "odds": {
                        "homeMoneyline": avg_home_odds,
                        "awayMoneyline": avg_away_odds
                    },
                    "dataSource": "sportsbookreview"
                }
                
                all_games.append(ml_game)
    
    # Save to a JSON file in the format expected by the ML model
    ml_path = BASE_DIR / f"{sport}_ml_format_{start_date}_to_{end_date}.json"
    with open(ml_path, "w") as f:
        json.dump(all_games, f, indent=2)
    
    print(f"Converted {len(all_games)} games to ML format and saved to {ml_path}")
    return all_games

def main():
    """Main function to run the scraper"""
    parser = argparse.ArgumentParser(description="Scrape historical odds data from sportsbookreview.com")
    parser.add_argument("sport", choices=SPORTS.keys(), help="Sport to scrape data for")
    parser.add_argument("--start-date", required=True, help="Start date in YYYY-MM-DD format")
    parser.add_argument("--end-date", required=True, help="End date in YYYY-MM-DD format")
    parser.add_argument("--csv", action="store_true", help="Save data to CSV")
    parser.add_argument("--ml-format", action="store_true", help="Convert data to ML model format")
    
    args = parser.parse_args()
    
    # Scrape data for the specified date range
    data = scrape_date_range(args.sport, args.start_date, args.end_date)
    
    # Save to CSV if requested
    if args.csv:
        save_to_csv(data, args.sport, args.start_date, args.end_date)
    
    # Convert to ML format if requested
    if args.ml_format:
        convert_to_ml_format(args.sport, args.start_date, args.end_date)

if __name__ == "__main__":
    main()