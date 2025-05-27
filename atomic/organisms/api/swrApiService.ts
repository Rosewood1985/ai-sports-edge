/**
 * SWR-based API Service with Caching and WebSocket Integration
 * AI Sports Edge - Modern data fetching with real-time capabilities
 */

import useSWR, { SWRConfiguration, mutate } from 'swr';
import useSWRMutation from 'swr/mutation';
import { useEffect, useRef, useState } from 'react';

// Types
interface ApiResponse<T = any> {
  data: T;
  status: number;
  message: string;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

interface ApiConfig extends SWRConfiguration {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://us-central1-ai-sports-edge.cloudfunctions.net',
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 30000, // 30 seconds
  errorRetryCount: 3,
  timeout: 10000,
};

// Enhanced fetcher with authentication and error handling
const fetcher = async (url: string, options: RequestInit = {}): Promise<any> => {
  const config = { ...DEFAULT_CONFIG, ...options };
  const fullUrl = url.startsWith('http') ? url : `${config.baseUrl}${url}`;
  
  // Add authentication headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
};

// POST/PUT/DELETE fetcher for mutations
const mutationFetcher = async (
  url: string,
  { arg }: { arg: { method: string; data?: any; headers?: Record<string, string> } }
) => {
  return fetcher(url, {
    method: arg.method,
    body: arg.data ? JSON.stringify(arg.data) : undefined,
    headers: arg.headers,
  });
};

// Custom hooks for different API operations

/**
 * Hook for fetching subscription analytics with caching
 */
export const useSubscriptionAnalytics = (timeRange: string = '30d', config?: ApiConfig) => {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    `/subscriptionAnalytics?timeRange=${timeRange}`,
    fetcher,
    {
      ...DEFAULT_CONFIG,
      ...config,
      refreshInterval: 60000, // Refresh every minute for analytics
    }
  );

  return {
    data: data?.data,
    error,
    loading: isLoading,
    revalidate,
    isEmpty: !data && !error && !isLoading,
  };
};

/**
 * Hook for fetching featured games with real-time updates
 */
export const useFeaturedGames = (config?: ApiConfig) => {
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    '/featuredGames',
    fetcher,
    {
      ...DEFAULT_CONFIG,
      ...config,
      refreshInterval: 15000, // Refresh every 15 seconds for live games
    }
  );

  return {
    games: data?.games || [],
    error,
    loading: isLoading,
    revalidate,
    timestamp: data?.timestamp,
  };
};

/**
 * Hook for fetching trending topics
 */
export const useTrendingTopics = (config?: ApiConfig) => {
  const { data, error, isLoading } = useSWR(
    '/trendingTopics',
    fetcher,
    {
      ...DEFAULT_CONFIG,
      ...config,
      refreshInterval: 120000, // Refresh every 2 minutes
    }
  );

  return {
    topics: data?.topics || [],
    error,
    loading: isLoading,
  };
};

/**
 * Hook for fetching game statistics
 */
export const useGameStats = (gameId: string, config?: ApiConfig) => {
  const { data, error, isLoading } = useSWR(
    gameId ? `/gameStats?gameId=${gameId}` : null,
    fetcher,
    {
      ...DEFAULT_CONFIG,
      ...config,
    }
  );

  return {
    stats: data?.stats,
    error,
    loading: isLoading,
  };
};

/**
 * Hook for fetching personalized recommendations
 */
export const usePersonalizedRecommendations = (userId: string, config?: ApiConfig) => {
  const { data, error, isLoading } = useSWR(
    userId ? `/personalizedRecommendations?userId=${userId}` : null,
    fetcher,
    {
      ...DEFAULT_CONFIG,
      ...config,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  return {
    data: data?.data,
    error,
    loading: isLoading,
  };
};

/**
 * Hook for mutation operations (POST, PUT, DELETE)
 */
export const useApiMutation = (endpoint: string) => {
  const { trigger, isMutating, error, data } = useSWRMutation(
    endpoint,
    mutationFetcher
  );

  const post = (data: any, headers?: Record<string, string>) =>
    trigger({ method: 'POST', data, headers });

  const put = (data: any, headers?: Record<string, string>) =>
    trigger({ method: 'PUT', data, headers });

  const del = (headers?: Record<string, string>) =>
    trigger({ method: 'DELETE', headers });

  return {
    post,
    put,
    delete: del,
    loading: isMutating,
    error,
    data,
  };
};

/**
 * WebSocket hook for real-time updates
 */
export const useWebSocket = (config: WebSocketConfig) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = config.maxReconnectAttempts || 5;
  const reconnectInterval = config.reconnectInterval || 5000;

  const connect = () => {
    try {
      setConnectionState('connecting');
      setError(null);
      
      const ws = new WebSocket(config.url, config.protocols);
      
      ws.onopen = () => {
        setConnectionState('connected');
        reconnectAttempts.current = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Invalidate relevant SWR cache based on message type
          switch (message.type) {
            case 'GAME_UPDATE':
              mutate('/featuredGames');
              break;
            case 'ANALYTICS_UPDATE':
              mutate((key) => typeof key === 'string' && key.includes('/subscriptionAnalytics'));
              break;
            case 'TRENDING_UPDATE':
              mutate('/trendingTopics');
              break;
            default:
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      ws.onerror = (event) => {
        setError(new Error('WebSocket error occurred'));
      };
      
      ws.onclose = (event) => {
        setConnectionState('disconnected');
        setSocket(null);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, reconnectInterval);
        }
      };
      
      setSocket(ws);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create WebSocket connection'));
      setConnectionState('disconnected');
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close(1000, 'Manual disconnect');
    }
  };

  const sendMessage = (message: any) => {
    if (socket && connectionState === 'connected') {
      socket.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket is not connected');
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [config.url]);

  return {
    connectionState,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
  };
};

/**
 * Combined hook for real-time featured games with WebSocket updates
 */
export const useRealTimeFeaturedGames = () => {
  const gamesData = useFeaturedGames();
  
  const webSocket = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'wss://ai-sports-edge.cloudfunctions.net/gameUpdates',
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
  });

  return {
    ...gamesData,
    connectionState: webSocket.connectionState,
    wsError: webSocket.error,
  };
};

/**
 * Utility function to prefetch data
 */
export const prefetchData = (key: string) => {
  return mutate(key, fetcher(key), { revalidate: false });
};

/**
 * Utility function to invalidate cache
 */
export const invalidateCache = (key: string | ((key: any) => boolean)) => {
  return mutate(key);
};

/**
 * Export the base fetcher for custom use cases
 */
export { fetcher };