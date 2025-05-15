# Geolocation Features Implementation

This document outlines the implementation of the geolocation features for AI Sports Edge, including Local Team Odds and Nearby Venues.

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Services](#services)
4. [Navigation](#navigation)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Future Enhancements](#future-enhancements)

## Overview

The geolocation features enhance the user experience by providing location-based services:

1. **Local Team Odds**: Shows betting odds for sports teams in the user's vicinity
2. **Nearby Venues**: Displays information about sports venues near the user's location

These features use a combination of IP-based geolocation and device GPS (when available) to determine the user's location, then provide relevant information based on that location.

## Components

### LocalTeamOdds

The `LocalTeamOdds` component displays betting odds for local teams based on the user's location. It includes:

- Location detection and display
- List of local teams with betting odds
- Recommendation indicators (bet/avoid)
- Integration with the BetNowButton for placing bets

```tsx
// Usage example
<LocalTeamOdds onRefresh={() => console.log('Refreshing odds')} />
```

### NearbyVenues

The `NearbyVenues` component shows sports venues near the user's location. It includes:

- Distance calculation and sorting
- Venue details (capacity, teams, sports)
- Map integration for directions
- Filtering options

```tsx
// Usage example
<NearbyVenues maxDistance={50} limit={10} />
```

## Services

### GeolocationService

The `GeolocationService` provides location-based functionality:

- **Location Detection**: Uses IP-based geolocation or device GPS
- **Local Team Identification**: Maps the user's location to nearby sports teams
- **Caching**: Implements efficient caching to minimize API calls
- **Movement Detection**: Detects significant location changes

Key methods:
```typescript
getUserLocation(useCache?: boolean, forceIP?: boolean): Promise<LocationData | null>
getLocalTeams(location?: LocationData, useCache?: boolean): Promise<string[]>
getLocalizedOddsSuggestions(localTeams?: string[]): Promise<OddsSuggestion[]>
```

### VenueService

The `VenueService` manages sports venue data:

- **Venue Database**: Comprehensive collection of sports venues
- **Distance Calculation**: Computes distance between user and venues
- **Filtering**: Allows filtering venues by various criteria
- **Events**: Provides information about upcoming events at venues

Key methods:
```typescript
getAllVenues(useCache?: boolean): Promise<Venue[]>
getNearbyVenues(location?: LocationData, maxDistance?: number, limit?: number): Promise<Venue[]>
filterVenues(options: VenueFilterOptions, location?: LocationData): Promise<Venue[]>
getUpcomingEvents(venueId: string): Promise<VenueEvent[]>
```

### GeoIP Service

The `GeoIPService` provides IP-based geolocation:

- **IP Detection**: Determines the user's IP address
- **Location Lookup**: Uses MaxMind GeoLite2 database for IP-to-location mapping
- **Fallback**: Provides graceful degradation when the service is unavailable

## Navigation

The geolocation features are integrated into the app's navigation system:

1. **Dedicated Tab**: A "Nearby" tab in the bottom navigation provides direct access to location features
2. **LocationStack**: A stack navigator that includes both LocalTeamOdds and NearbyVenues screens
3. **Deep Linking**: Support for deep linking to specific location features

## Configuration

The geolocation features require the following configuration:

1. **API Keys**: 
   - IPGeolocation.io API key for IP-based geolocation
   - Mapbox API key for enhanced location services
   - Google Maps API key for maps integration

2. **Environment Variables**:
   - `REACT_APP_IPGEOLOCATION_API_KEY`
   - `REACT_APP_MAPBOX_API_KEY`
   - `REACT_APP_GOOGLE_MAPS_API_KEY`

3. **Expo Configuration**:
   - Added to `app.json` in the `extra` section
   - Location permissions configured in iOS and Android sections

## Testing

The geolocation features include comprehensive testing:

1. **Test Scripts**:
   - `scripts/test-geolocation-service.js`: Tests the geolocation service
   - `scripts/test-venue-service.js`: Tests the venue service

2. **Mock Data**:
   - Mock location data for testing without API access
   - Mock venue data for testing without a venue database

3. **Testing Considerations**:
   - Test with different locations
   - Test with and without GPS access
   - Test with and without API keys

## Future Enhancements

Planned improvements for the geolocation features:

1. **Enhanced Accuracy**:
   - Integration with device GPS for more precise location (with user permission)
   - Improved reverse geocoding for better address information

2. **Expanded Venue Database**:
   - More comprehensive venue database
   - Additional venue details (images, website links, etc.)
   - Real-time venue information (events, capacity, etc.)

3. **Advanced Filtering**:
   - More sophisticated filtering options
   - Saved filters for quick access
   - Custom sorting options

4. **User Preferences**:
   - Saved locations for travelers
   - Favorite venues and teams
   - Personalized recommendations

5. **Performance Optimizations**:
   - More efficient caching
   - Background data prefetching
   - Reduced API calls

6. **UI Enhancements**:
   - Interactive maps
   - Venue images and virtual tours
   - Animated transitions and loading states