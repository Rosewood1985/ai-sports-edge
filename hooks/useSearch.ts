import { useState, useEffect, useCallback } from 'react';

import searchService, {
  SearchFilters,
  SearchResults,
  NewsSearchResult,
  TeamSearchResult,
  PlayerSearchResult,
  OddsSearchResult,
} from '../services/searchService';

interface UseSearchProps {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  autoSearch?: boolean;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  results: SearchResults;
  isLoading: boolean;
  error: Error | null;
  search: () => Promise<void>;
  clearResults: () => void;
  newsResults: NewsSearchResult[];
  teamsResults: TeamSearchResult[];
  playersResults: PlayerSearchResult[];
  oddsResults: OddsSearchResult[];
  totalResults: number;
}

/**
 * Hook for searching content
 * @param props Search props
 * @returns Search state and methods
 */
export const useSearch = ({
  initialQuery = '',
  initialFilters = {},
  autoSearch = false,
}: UseSearchProps = {}): UseSearchReturn => {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<SearchResults>({
    news: [],
    teams: [],
    players: [],
    odds: [],
    totalResults: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Search function
  const search = useCallback(async () => {
    if (!query.trim()) {
      setResults({
        news: [],
        teams: [],
        players: [],
        odds: [],
        totalResults: 0,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await searchService.search(query, filters);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred during search'));
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, filters]);

  // Clear results
  const clearResults = useCallback(() => {
    setResults({
      news: [],
      teams: [],
      players: [],
      odds: [],
      totalResults: 0,
    });
  }, []);

  // Auto search when query or filters change
  useEffect(() => {
    if (autoSearch && query.trim()) {
      const debounceTimer = setTimeout(() => {
        search();
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [query, filters, autoSearch, search]);

  // Auto search on mount if initial query is provided
  useEffect(() => {
    if (autoSearch && initialQuery.trim()) {
      search();
    }
  }, [autoSearch, initialQuery, search]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    isLoading,
    error,
    search,
    clearResults,
    newsResults: results.news,
    teamsResults: results.teams,
    playersResults: results.players,
    oddsResults: results.odds,
    totalResults: results.totalResults,
  };
};
