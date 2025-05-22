# Admin Dashboard Patterns (May 22, 2025)

## Pattern: Cross-Platform Component Adaptation

**Description:**
A pattern for adapting React Native components to web equivalents while maintaining consistent styling and behavior. This pattern ensures that the UI remains consistent across platforms while leveraging platform-specific optimizations.

**Components:**

1. **Component Mapping**: A system for mapping React Native components to web equivalents
2. **Shared Styling**: A system for sharing styles between platforms
3. **Platform-Specific Optimizations**: Logic for optimizing components for specific platforms

**Implementation:**

```typescript
// Example implementation pattern for cross-platform component adaptation
// src/components/ui/adapters/ThemedText.tsx

import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

// Shared props interface
export interface ThemedTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'button';
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'bold' | 'semibold' | 'light';
  italic?: boolean;
  underline?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: any;
}

// Web implementation
export function ThemedText({
  variant = 'body',
  color,
  align = 'left',
  weight = 'normal',
  italic = false,
  underline = false,
  children,
  className = '',
  style = {},
}: ThemedTextProps) {
  const { theme } = useTheme();

  // Map variant to HTML element
  const Component = variant.startsWith('h') ? variant : 'p';

  // Map weight to font-weight
  const fontWeight = {
    normal: 400,
    light: 300,
    semibold: 600,
    bold: 700,
  }[weight];

  // Build style object
  const styles = {
    color: color || theme.colors.text,
    textAlign: align,
    fontWeight,
    fontStyle: italic ? 'italic' : 'normal',
    textDecoration: underline ? 'underline' : 'none',
    ...style,
  };

  // Map variant to Tailwind classes
  const variantClasses = {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-bold',
    h4: 'text-xl font-semibold',
    h5: 'text-lg font-semibold',
    h6: 'text-base font-semibold',
    body: 'text-base',
    caption: 'text-sm',
    button: 'text-base font-medium',
  }[variant];

  return (
    <Component className={`${variantClasses} ${className}`} style={styles}>
      {children}
    </Component>
  );
}

// React Native implementation (for reference)
export function ThemedTextNative({
  variant = 'body',
  color,
  align = 'left',
  weight = 'normal',
  italic = false,
  underline = false,
  children,
  style = {},
  ...props
}: ThemedTextProps & Omit<RNTextProps, 'style'>) {
  const { theme } = useTheme();

  // Map variant to font size and weight
  const variantStyles = {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 28, fontWeight: 'bold' },
    h3: { fontSize: 24, fontWeight: 'bold' },
    h4: { fontSize: 20, fontWeight: '600' },
    h5: { fontSize: 18, fontWeight: '600' },
    h6: { fontSize: 16, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: 'normal' },
    caption: { fontSize: 14, fontWeight: 'normal' },
    button: { fontSize: 16, fontWeight: '500' },
  }[variant];

  // Build style object
  const styles = {
    color: color || theme.colors.text,
    textAlign: align,
    fontWeight: weight,
    fontStyle: italic ? 'italic' : 'normal',
    textDecorationLine: underline ? 'underline' : 'none',
    ...variantStyles,
    ...style,
  };

  return (
    <RNText style={styles} {...props}>
      {children}
    </RNText>
  );
}
```

**Usage:**

```tsx
// Example usage of the cross-platform component adaptation pattern
// Web usage
<ThemedText
  variant="h1"
  color="primary"
  align="center"
  className="my-4"
>
  Dashboard Overview
</ThemedText>

// React Native usage (for reference)
<ThemedTextNative
  variant="h1"
  color="primary"
  align="center"
  style={{ marginVertical: 16 }}
>
  Dashboard Overview
</ThemedTextNative>
```

**Benefits:**

- Ensures consistent UI across platforms
- Leverages platform-specific optimizations
- Simplifies cross-platform development
- Reduces code duplication
- Improves maintainability through shared interfaces

## Pattern: SWR Data Fetching

**Description:**
A pattern for fetching and caching data using the SWR (stale-while-revalidate) library. This pattern ensures that data is always up-to-date while providing a good user experience through caching and revalidation.

**Components:**

1. **SWR Configuration**: Configuration for the SWR library
2. **API Service Integration**: Integration with the API service layer
3. **Error Handling**: Logic for handling errors during data fetching
4. **Revalidation Strategy**: Strategy for revalidating data

**Implementation:**

```typescript
// Example implementation pattern for SWR data fetching
// src/lib/api/swr.ts
import { SWRConfig, SWRConfiguration } from 'swr';
import { ApiError } from '@/types/api';
import { handleApiError } from './errorHandler';

export const swrDefaultConfig: SWRConfiguration = {
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  focusThrottleInterval: 5000,
  dedupingInterval: 2000,
  loadingTimeout: 3000,
  onError: (error: ApiError) => {
    handleApiError(error);
  },
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  shouldRetryOnError: (error: ApiError) => {
    // Don't retry on client errors (4xx)
    return !(error.status >= 400 && error.status < 500);
  },
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrDefaultConfig}>{children}</SWRConfig>;
}

// Custom hook for API data fetching with SWR
import useSWR, { SWRResponse, SWRConfiguration } from 'swr';
import { ApiResponse } from '@/types/api';
import { apiService } from '@/services/api';

export function useApiSWR<T>(
  url: string | null,
  options?: SWRConfiguration
): SWRResponse<T, ApiError> {
  const fetcher = async (url: string) => {
    const response = await apiService.get<ApiResponse<T>>(url);
    return response.data;
  };

  return useSWR<T, ApiError>(url, fetcher, options);
}
```

**Usage:**

```tsx
// Example usage of the SWR data fetching pattern
import { useApiSWR } from '@/lib/api/swr';
import { User } from '@/types/admin';

function UserList() {
  const { data, error, isLoading, mutate } = useApiSWR<User[]>('/api/admin/users');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Users</h1>
      <button onClick={() => mutate()}>Refresh</button>
      <ul>
        {data?.map(user => (
          <li key={user.id}>{user.displayName}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Benefits:**

- Provides automatic revalidation and refetching
- Implements caching for better performance
- Handles loading and error states
- Supports optimistic updates
- Reduces network requests through deduplication

## Pattern: API Gateway

**Description:**
A pattern for routing API requests through a central gateway. This pattern ensures that all API requests are properly authenticated, logged, and routed to the appropriate service.

**Components:**

1. **Request Router**: Logic for routing requests to the appropriate service
2. **Authentication Middleware**: Middleware for authenticating requests
3. **Response Formatter**: Logic for formatting responses consistently
4. **Error Handler**: Logic for handling errors consistently

**Implementation:**

```typescript
// Example implementation pattern for API gateway
// src/pages/api/[[...path]].ts
import { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';
import { adminAuthMiddleware } from '@/middleware/adminAuth';

// Create a proxy server instance
const proxy = httpProxy.createProxyServer({
  target: process.env.INTERNAL_API_URL,
  changeOrigin: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply admin auth middleware
  await adminAuthMiddleware(req, res, async () => {
    // Add client platform to headers
    req.headers['x-client-platform'] = req.headers['user-agent']?.includes('Mobile')
      ? 'mobile'
      : 'web';

    // Add API version
    req.headers['x-api-version'] = '1.0';

    // Handle the proxy request
    await new Promise<void>((resolve, reject) => {
      proxy.web(req, res, { target: process.env.INTERNAL_API_URL }, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}
```

**Usage:**

```typescript
// Example usage of the API gateway pattern
// Client-side API call
import { apiService } from '@/services/api';

// The request will be routed through the API gateway
const response = await apiService.get('/api/admin/users');
```

**Benefits:**

- Centralizes request handling
- Ensures consistent authentication
- Simplifies cross-platform compatibility
- Provides a single point for logging and monitoring
- Enables versioning and content negotiation
