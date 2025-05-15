# Search Functionality

This document outlines the search functionality implemented in the AI Sports Edge application.

## Overview

The search functionality allows users to search for various types of sports content, including:

- News articles
- Teams
- Players
- Betting odds

The search system is designed to be fast, relevant, and personalized to the user's preferences.

## Components

### 1. Search Service

The core search functionality is implemented in `services/searchService.js`. This service provides methods for:

- Searching across all content types
- Filtering results by various criteria
- Managing search history
- Handling user preferences

### 2. Search UI Components

The search UI is built using React Native components:

- `SearchBar`: A reusable component for inputting search queries
- `SearchResults`: A component for displaying search results in a structured format
- `SearchScreen`: The main screen that integrates the search components

### 3. Search Hooks

Custom React hooks are provided to simplify the integration of search functionality:

- `useSearch`: A hook that provides search state and methods

## Usage

### Basic Search

```jsx
import { useSearch } from '../hooks/useSearch';
import { SearchBar, SearchResults } from '../components/search';

const MyComponent = () => {
  const { 
    query, 
    setQuery, 
    results, 
    isLoading, 
    search 
  } = useSearch();

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    search();
  };

  return (
    <View>
      <SearchBar onSearch={handleSearch} />
      <SearchResults 
        isLoading={isLoading}
        query={query}
        newsResults={results.news}
        teamsResults={results.teams}
        playersResults={results.players}
        oddsResults={results.odds}
        totalResults={results.totalResults}
      />
    </View>
  );
};
```

### Filtered Search

```jsx
const { search, results } = useSearch();

// Search with filters
search('basketball', {
  contentTypes: ['news', 'teams'],
  sports: ['NBA'],
  date: { from: new Date('2023-01-01'), to: new Date() }
});
```

## Search Filters

The search functionality supports various filters:

- `contentTypes`: Array of content types to include (e.g., `['news', 'teams']`)
- `sports`: Array of sports to filter by (e.g., `['NBA', 'NFL']`)
- `leagues`: Array of leagues to filter by (e.g., `['NBA', 'WNBA']`)
- `teams`: Array of teams to filter by (e.g., `['Golden State Warriors']`)
- `date`: Date range for filtering (e.g., `{ from: Date, to: Date }`)
- `isBettingContent`: Boolean to filter for betting-related content

## Search History

The search service automatically saves search queries for logged-in users. This history can be:

- Retrieved using `searchService.getSearchHistory(userId)`
- Cleared using `searchService.clearSearchHistory(userId)`

## User Preferences

Users can customize their search experience through preferences:

- Default filters
- Content type priorities
- History settings

These preferences are managed through the search service.

## Implementation Details

### Data Sources

The search functionality aggregates data from multiple sources:

- Firebase Firestore database
- External sports APIs
- RSS feeds
- Betting odds providers

### Performance Considerations

- Search queries are debounced to prevent excessive API calls
- Results are cached where appropriate
- Pagination is implemented for large result sets

## Future Enhancements

Planned enhancements for the search functionality include:

1. Voice search capability
2. Advanced filtering options
3. Improved relevance ranking
4. Search suggestions based on user behavior
5. Integration with more data sources