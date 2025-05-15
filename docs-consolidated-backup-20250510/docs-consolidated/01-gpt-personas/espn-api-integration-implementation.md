# ESPN API Integration Implementation

## Overview

This document outlines the implementation of the ESPN API integration for AI Sports Edge. The integration allows the application to fetch sports data from ESPN and calculate odds for various sports leagues, enhancing the betting insights provided to users.

## Components

The ESPN API integration consists of the following components:

1. **Python ESPN API Client**: A Python script that interacts with the ESPN API to fetch sports data.
2. **JavaScript ESPN API Wrapper**: A JavaScript module that wraps the Python client and provides a simple interface for the application.
3. **News Ticker Component**: A React component that displays ESPN calculated odds in the UI.
4. **User Preferences**: Settings that allow users to toggle ESPN integration.

## Implementation Details

### Python ESPN API Client

The Python client (`api/ml-sports-edge/data/espn_api_client.py`) is responsible for fetching data from the ESPN API. It provides various commands for retrieving different types of sports data, such as:

- List of sports
- Leagues for a sport
- Teams for a league
- Scoreboard for a league
- Game details
- Player statistics
- Standings
- Schedule
- News

The client uses the `requests` library to make HTTP requests to the ESPN API endpoints and returns the data in JSON format.

### JavaScript ESPN API Wrapper

The JavaScript wrapper (`api/ml-sports-edge/data/espnApiWrapper.js`) provides a simple interface for the application to interact with the Python client. It spawns a Python process to execute the client and parses the output.

The wrapper includes a `calculateOdds` function that takes a sport and league as parameters and returns calculated odds for upcoming games. The odds include:

- Moneyline odds for home and away teams
- Spread and spread odds
- Over/under and over/under odds

### News Ticker Component

The News Ticker component (`web/components/NewsTicker.js`) has been updated to display ESPN calculated odds. The component fetches odds data using the ESPN API wrapper and displays it in a dedicated section below the news ticker.

The odds are displayed in a visually appealing format, showing:

- Team logos
- Team names
- Moneyline odds
- Spread
- Over/under
- Link to the ESPN game page

### User Preferences

The User Preferences component (`web/components/UserPreferences.js`) has been updated to include an option for toggling ESPN integration. Users can enable or disable the display of ESPN calculated odds in the news ticker.

## CSS Styles

New CSS styles have been added to `web/styles/news-ticker.css` and `web/styles/user-preferences.css` to support the display of ESPN odds and the ESPN integration option in the user preferences.

## Testing

A test script (`scripts/test-espn-integration.js`) has been created to verify the ESPN API integration. The script tests:

1. The ESPN API wrapper's ability to calculate odds for various sports
2. The integration with the ML model
3. The news ticker's display of ESPN odds

## Dependencies

The ESPN API integration requires the following dependencies:

- Python 3.x
- Python packages:
  - requests
  - python-dateutil
- Node.js

## Usage

To use the ESPN API integration:

1. Ensure the required dependencies are installed:
   ```bash
   pip install -r api/ml-sports-edge/requirements.txt
   ```

2. Run the application:
   ```bash
   npm run web
   ```

3. Open the application in a browser:
   ```
   http://localhost:19006
   ```

4. Enable ESPN integration in the user preferences.

## Future Enhancements

Potential future enhancements for the ESPN API integration include:

1. **Caching**: Implement caching of ESPN data to reduce API calls and improve performance.
2. **More Sports**: Extend the integration to support additional sports and leagues.
3. **Advanced Odds Calculation**: Enhance the odds calculation algorithm to provide more accurate predictions.
4. **Historical Data Analysis**: Incorporate historical data analysis to improve odds calculations.
5. **Personalized Recommendations**: Provide personalized betting recommendations based on user preferences and ESPN data.

## Conclusion

The ESPN API integration enhances AI Sports Edge by providing calculated odds based on ESPN data. This integration improves the betting insights provided to users and adds value to the application.