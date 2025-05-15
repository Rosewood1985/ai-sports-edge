# Sportsbookreview.com Scraper Integration

## Overview

This document outlines the integration of the Sportsbookreview.com scraper with the AI Sports Edge ML model. The scraper collects historical odds data from sportsbookreview.com going back to 2011, providing a rich dataset for training more accurate prediction models.

## Features

- **Historical Odds Data**: Access to 10+ years of historical odds data from sportsbookreview.com
- **Multiple Sports Support**: Supports NBA, NFL, MLB, NHL, NCAA Basketball, and NCAA Football
- **Multiple Bookmakers**: Collects odds from various bookmakers for comprehensive analysis
- **ML Model Integration**: Seamlessly integrates with the existing AI Sports Edge ML model
- **Feature Extraction**: Automatically extracts features from the historical data for model training

## Implementation Details

### Scraper Component

The scraper is implemented in Python and is located at `api/ml-sports-edge/data/sportsbookreview_scraper.py`. It performs the following functions:

1. **Data Collection**: Fetches historical odds data from sportsbookreview.com for a specified sport and date range
2. **Data Processing**: Processes the raw data into a structured format
3. **Data Storage**: Saves the processed data in both raw JSON and ML-compatible formats
4. **CSV Export**: Optionally exports the data to CSV for further analysis

### Integration with ML Model

The integration with the ML model is handled by the `run-sportsbookreview-scraper.sh` script, which:

1. Runs the scraper to collect historical odds data
2. Converts the data to the format expected by the ML model
3. Integrates the data with the existing historical dataset
4. Triggers feature extraction to prepare the data for model training

### Data Flow

```
Sportsbookreview.com API → Scraper → Raw JSON Files → ML Format → Feature Extraction → Model Training
```

## Usage

### Running the Scraper

To run the scraper and integrate the data with the ML model, use the following command:

```bash
./scripts/run-sportsbookreview-scraper.sh --sport <sport> --start-date <YYYY-MM-DD> --end-date <YYYY-MM-DD>
```

Where:
- `<sport>` is one of: nba, nfl, mlb, nhl, ncaab, ncaaf
- `<start-date>` and `<end-date>` define the date range to scrape

Additional options:
- `--csv`: Export the data to CSV
- `--no-ml-format`: Skip the conversion to ML format and integration with the ML model

### Example

```bash
# Scrape NBA odds data for the 2022-2023 season
./scripts/run-sportsbookreview-scraper.sh --sport nba --start-date 2022-10-18 --end-date 2023-06-12

# Scrape NFL odds data for the 2022 season and export to CSV
./scripts/run-sportsbookreview-scraper.sh --sport nfl --start-date 2022-09-08 --end-date 2023-02-12 --csv
```

## Data Structure

### Raw JSON Format

Each game is stored in the following format:

```json
{
  "sport": "nba",
  "game_id": "12345",
  "start_time": "2023-01-01T19:00:00Z",
  "home_team": "Los Angeles Lakers",
  "away_team": "Boston Celtics",
  "home_score": 105,
  "away_score": 102,
  "status": "FINAL",
  "bookmakers": [
    {
      "bookmaker": "FanDuel",
      "team": "Los Angeles Lakers",
      "price": -110,
      "is_home": true
    },
    {
      "bookmaker": "FanDuel",
      "team": "Boston Celtics",
      "price": -110,
      "is_home": false
    },
    // Additional bookmakers...
  ]
}
```

### ML Format

The data is converted to the following format for integration with the ML model:

```json
{
  "date": "2023-01-01",
  "sport": "nba",
  "homeTeam": "Los Angeles Lakers",
  "awayTeam": "Boston Celtics",
  "homeScore": 105,
  "awayScore": 102,
  "odds": {
    "homeMoneyline": -110,
    "awayMoneyline": -110
  },
  "dataSource": "sportsbookreview"
}
```

## Benefits for the ML Model

The integration of the Sportsbookreview.com scraper provides several benefits for the AI Sports Edge ML model:

1. **Increased Training Data**: Access to 10+ years of historical odds data significantly increases the amount of training data available to the model.

2. **Improved Accuracy**: More historical data leads to better pattern recognition and improved prediction accuracy.

3. **Bookmaker Insights**: Data from multiple bookmakers allows the model to identify market inefficiencies and value betting opportunities.

4. **Temporal Analysis**: Long-term historical data enables the model to identify seasonal trends and patterns over time.

5. **Cross-Sport Analysis**: Support for multiple sports allows for cross-sport analysis and knowledge transfer.

## Technical Requirements

- Python 3.6+
- Node.js 14+
- Required Python packages:
  - requests
  - pandas
  - json
  - argparse

## Maintenance and Updates

The scraper is designed to be maintainable and adaptable to changes in the Sportsbookreview.com website. If the website structure changes, only the `get_odds_data` and `process_odds_data` functions in the scraper need to be updated.

Regular updates to the historical dataset can be scheduled using cron jobs or similar scheduling mechanisms.

## Conclusion

The integration of the Sportsbookreview.com scraper significantly enhances the AI Sports Edge ML model by providing access to a rich historical odds dataset. This integration enables more accurate predictions, better value betting identification, and a deeper understanding of sports betting markets.