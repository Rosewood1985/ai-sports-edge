# Nearby Venues Feature Implementation

## Overview

The Nearby Venues feature enhances the user experience by providing information about sports venues in the user's vicinity. This location-based feature allows users to discover stadiums, arenas, and other sports facilities near them, along with details about capacity, home teams, and sports played at each venue.

## Key Components

### 1. Venue Service

The core of this feature is the `VenueService` class, which provides the following functionality:

- **Venue Database**: A comprehensive collection of sports venues with detailed information
- **Location-Based Filtering**: Finds venues near the user's current location
- **Distance Calculation**: Computes the distance between the user and each venue
- **Team and Sport Filtering**: Allows filtering venues by teams or sports
- **Caching**: Implements efficient caching to minimize API calls

### 2. User Interface Components

- **NearbyVenues Component**: Displays nearby venues in a user-friendly list format
- **NearbyVenuesScreen**: Dedicated screen for the nearby venues feature
- **Settings Integration**: Access to the feature through the app's settings menu

## Technical Implementation

### Venue Service

The service uses the Haversine formula to calculate the distance between the user's location and each venue. This approach was chosen because:

1. It provides accurate distance calculations on a spherical surface (Earth)
2. It's computationally efficient for mobile devices
3. It doesn't require external API calls for distance calculations

The service includes:

- Error handling for API failures
- Caching to reduce API calls
- Fallback to mock data when API access is unavailable

### Venue Data Structure

Each venue in the database includes:

- Basic information (name, city, state, country)
- Geographic coordinates (latitude, longitude)
- Capacity information
- Teams that call the venue home
- Sports played at the venue
- Calculated distance from the user (when applicable)

### Maps Integration

The feature integrates with native mapping applications by:

- Providing direct links to open venue locations in maps
- Supporting both Apple Maps and Google Maps
- Including venue names for better search results

## Integration Points

The nearby venues feature integrates with several existing systems:

1. **Geolocation Service**: Uses the same location data as the Local Team Odds feature
2. **Navigation System**: Added to the app's navigation stack
3. **Settings Menu**: Accessible through the Location Features section in settings
4. **Theming System**: Leverages ThemedView and ThemedText for consistent styling

## Configuration

The feature can be configured through:

1. Environment variables (`REACT_APP_MAPBOX_API_KEY`)
2. Expo configuration (`app.json` extra section)
3. Distance and limit parameters in the component props

## Future Enhancements

Planned improvements for the nearby venues feature include:

1. **Real-time Events**: Showing upcoming games and events at each venue
2. **Ticket Integration**: Direct links to purchase tickets for events
3. **Enhanced Filtering**: Allowing users to filter venues by sport, team, or distance
4. **User Reviews**: Adding community ratings and reviews for venues
5. **Directions**: Turn-by-turn directions to venues from the user's location

## Privacy Considerations

The nearby venues feature is designed with privacy in mind:

- Uses the same location data already collected for other features
- No additional permissions required beyond what's needed for the geolocation service
- Clear disclosure about what location data is used for

## Technical Requirements

- Geolocation Service
- Mapbox API key (optional for enhanced features)
- React Navigation integration
- Expo Constants for configuration access