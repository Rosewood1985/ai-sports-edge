# Geolocation Feature Implementation

## Overview

The geolocation feature enhances the user experience by providing location-based sports betting recommendations. By determining the user's location, the app can suggest local teams and relevant odds, creating a more personalized and engaging experience.

## Key Components

### 1. Geolocation Service

The core of this feature is the `GeolocationService` class, which provides the following functionality:

- **Location Detection**: Uses IP-based geolocation to determine the user's city and state
- **Local Team Identification**: Maps the user's location to nearby sports teams
- **Personalized Odds**: Generates betting suggestions for local teams
- **Caching**: Implements efficient caching to minimize API calls

### 2. User Interface Components

- **LocalTeamOdds Component**: Displays local teams and betting odds in a user-friendly format
- **LocalTeamOddsScreen**: Dedicated screen for the geolocation feature
- **Settings Integration**: Access to the feature through the app's settings menu

## Technical Implementation

### Geolocation Service

The service uses the IPGeolocation.io API to determine the user's location based on their IP address. This approach was chosen because:

1. It doesn't require explicit location permissions
2. It works across all platforms (mobile and web)
3. It provides sufficient accuracy for city/region-level targeting

The service includes:

- Error handling for API failures
- Caching to reduce API calls
- Fallback mechanisms when location data is unavailable

### Location-Based Team Mapping

Once the user's location is determined, the service maps it to local sports teams using a comprehensive database of teams organized by city and region. This mapping considers:

- Professional teams across major sports leagues
- Geographic proximity
- Team popularity in the region

### Odds Generation

For local teams, the service generates personalized odds suggestions that:

- Highlight favorable betting opportunities
- Provide context-aware recommendations
- Integrate with the app's existing odds data

## Integration Points

The geolocation feature integrates with several existing systems:

1. **Navigation System**: Added to the app's navigation stack
2. **Settings Menu**: Accessible through a dedicated section in settings
3. **Betting Affiliate System**: Uses the existing BetNowButton component
4. **Theming System**: Leverages ThemedView and ThemedText for consistent styling

## Configuration

The feature requires an API key from IPGeolocation.io, which is configured through:

1. Environment variables (`REACT_APP_IPGEOLOCATION_API_KEY`)
2. Expo configuration (`app.json` extra section)

## Testing

A dedicated test script (`scripts/test-geolocation-service.js`) allows for testing the geolocation service functionality independently of the main application. This script:

- Verifies API connectivity
- Tests location detection
- Validates team mapping
- Confirms odds generation
- Checks caching behavior

## Future Enhancements

Planned improvements for the geolocation feature include:

1. **Enhanced Accuracy**: Integration with device GPS for more precise location (with user permission)
2. **Expanded Team Database**: Adding more teams and sports leagues
3. **Smarter Recommendations**: Using machine learning to improve betting suggestions
4. **Location History**: Remembering user's previous locations for travelers
5. **Location-Based Notifications**: Alerting users about games for local teams

## Privacy Considerations

The geolocation feature is designed with privacy in mind:

- IP-based geolocation is used instead of GPS to minimize privacy concerns
- No precise location data is stored long-term
- Users can disable the feature through settings
- Clear disclosure about what location data is used for

## Technical Requirements

- Expo Location library
- IPGeolocation.io API key
- React Navigation integration
- Expo Constants for configuration access