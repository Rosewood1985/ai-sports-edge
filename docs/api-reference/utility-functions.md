# Utility Functions API Reference

This document provides detailed API documentation for utility functions in the AI Sports Edge application.

## Table of Contents

- [Date Utilities](#date-utilities)
  - [formatDate](#formatdate)
  - [formatDateTime](#formatdatetime)
  - [getRelativeTimeString](#getrelativetimestring)
  - [formatDuration](#formatduration)
  - [isToday](#istoday)
  - [isYesterday](#isyesterday)
- [String Utilities](#string-utilities)
  - [formatCurrency](#formatcurrency)
  - [truncateText](#truncatetext)
  - [slugify](#slugify)
- [Array Utilities](#array-utilities)
  - [groupBy](#groupby)
  - [sortBy](#sortby)
  - [filterUnique](#filterunique)
- [Object Utilities](#object-utilities)
  - [deepMerge](#deepmerge)
  - [omit](#omit)
  - [pick](#pick)
- [Validation Utilities](#validation-utilities)
  - [validateEmail](#validateemail)
  - [validatePassword](#validatepassword)
  - [validatePhoneNumber](#validatephonenumber)
- [Format Utilities](#format-utilities)
  - [formatOdds](#formatodds)
  - [formatPercentage](#formatpercentage)
  - [formatNumber](#formatnumber)
- [Error Handling Utilities](#error-handling-utilities)
  - [handleError](#handleerror)
  - [logError](#logerror)
  - [parseError](#parseerror)
- [Device Utilities](#device-utilities)
  - [getDeviceInfo](#getdeviceinfo)
  - [isTablet](#istablet)
  - [getScreenDimensions](#getscreendimensions)
- [Performance Utilities](#performance-utilities)
  - [debounce](#debounce)
  - [throttle](#throttle)
  - [memoize](#memoize)
- [Animation Utilities](#animation-utilities)
  - [fadeIn](#fadein)
  - [fadeOut](#fadeout)
  - [slideIn](#slidein)
- [Environment Utilities](#environment-utilities)
  - [envCheck](#envcheck)
  - [envConfig](#envconfig)
  - [environmentUtils](#environmentutils)
- [Cache Utilities](#cache-utilities)
  - [cache](#cache)
  - [firebaseCacheConfig](#firebasecacheconfig)
- [Analytics Utilities](#analytics-utilities)
  - [analyticsLinkGenerator](#analyticslinkgenerator)
  - [affiliateLinkGenerator](#affiliatelinkgenerator)
- [Responsive Utilities](#responsive-utilities)
  - [responsiveImageLoader](#responsiveimageloader)
  - [responsiveUtils](#responsiveutils)
- [Memory Management Utilities](#memory-management-utilities)
  - [memoryManagement](#memorymanagement)
  - [codeSplitting](#codesplitting)

## Date Utilities

### formatDate

Formats a date to a human-readable string.

**Signature:**

```typescript
function formatDate(date: Date): string;
```

**Parameters:**

- `date: Date` - The date to format

**Returns:** A formatted date string in the format "MMM D, YYYY" (e.g., "Jan 1, 2025").

**Example:**

```typescript
import { formatDate } from 'utils/dateUtils';

const date = new Date('2025-01-01');
const formattedDate = formatDate(date);
console.log(formattedDate); // "Jan 1, 2025"
```

### formatDateTime

Formats a date to include time.

**Signature:**

```typescript
function formatDateTime(date: Date): string;
```

**Parameters:**

- `date: Date` - The date to format

**Returns:** A formatted date and time string in the format "MMM D, YYYY, HH:MM AM/PM" (e.g., "Jan 1, 2025, 12:00 PM").

**Example:**

```typescript
import { formatDateTime } from 'utils/dateUtils';

const date = new Date('2025-01-01T12:00:00');
const formattedDateTime = formatDateTime(date);
console.log(formattedDateTime); // "Jan 1, 2025, 12:00 PM"
```

### getRelativeTimeString

Gets a relative time string (e.g., "2 hours ago").

**Signature:**

```typescript
function getRelativeTimeString(date: Date): string;
```

**Parameters:**

- `date: Date` - The date to format

**Returns:** A relative time string describing the time elapsed since the given date.

**Example:**

```typescript
import { getRelativeTimeString } from 'utils/dateUtils';

// Assuming current time is 2025-01-01T14:00:00
const date = new Date('2025-01-01T12:00:00');
const relativeTime = getRelativeTimeString(date);
console.log(relativeTime); // "2 hours ago"
```

### formatDuration

Formats a duration in milliseconds to a human-readable string.

**Signature:**

```typescript
function formatDuration(durationMs: number): string;
```

**Parameters:**

- `durationMs: number` - The duration in milliseconds

**Returns:** A formatted duration string (e.g., "2h 30m" or "45m 20s").

**Example:**

```typescript
import { formatDuration } from 'utils/dateUtils';

const duration = 9000000; // 2.5 hours in milliseconds
const formattedDuration = formatDuration(duration);
console.log(formattedDuration); // "2h 30m"
```

### isToday

Checks if a date is today.

**Signature:**

```typescript
function isToday(date: Date): boolean;
```

**Parameters:**

- `date: Date` - The date to check

**Returns:** `true` if the date is today, `false` otherwise.

**Example:**

```typescript
import { isToday } from 'utils/dateUtils';

const today = new Date();
console.log(isToday(today)); // true

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
console.log(isToday(yesterday)); // false
```

### isYesterday

Checks if a date is yesterday.

**Signature:**

```typescript
function isYesterday(date: Date): boolean;
```

**Parameters:**

- `date: Date` - The date to check

**Returns:** `true` if the date is yesterday, `false` otherwise.

**Example:**

```typescript
import { isYesterday } from 'utils/dateUtils';

const today = new Date();
console.log(isYesterday(today)); // false

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
console.log(isYesterday(yesterday)); // true
```

## Format Utilities

### formatOdds

Formats odds values based on the specified format (American, decimal, or fractional).

**Signature:**

```typescript
function formatOdds(
  odds: number,
  format: 'american' | 'decimal' | 'fractional' = 'american'
): string;
```

**Parameters:**

- `odds: number` - The odds value to format
- `format: 'american' | 'decimal' | 'fractional'` - The format to use (default: 'american')

**Returns:** A formatted odds string.

**Example:**

```typescript
import { formatOdds } from 'utils/formatUtils';

// American odds format
console.log(formatOdds(-110)); // "-110"
console.log(formatOdds(240)); // "+240"

// Decimal odds format
console.log(formatOdds(-110, 'decimal')); // "1.91"
console.log(formatOdds(240, 'decimal')); // "3.40"

// Fractional odds format
console.log(formatOdds(-110, 'fractional')); // "10/11"
console.log(formatOdds(240, 'fractional')); // "12/5"
```

### formatPercentage

Formats a number as a percentage.

**Signature:**

```typescript
function formatPercentage(value: number, decimalPlaces: number = 1): string;
```

**Parameters:**

- `value: number` - The value to format (0-1)
- `decimalPlaces: number` - The number of decimal places to include (default: 1)

**Returns:** A formatted percentage string.

**Example:**

```typescript
import { formatPercentage } from 'utils/formatUtils';

console.log(formatPercentage(0.1234)); // "12.3%"
console.log(formatPercentage(0.1234, 2)); // "12.34%"
console.log(formatPercentage(0.1234, 0)); // "12%"
```

### formatNumber

Formats a number with thousands separators and decimal places.

**Signature:**

```typescript
function formatNumber(value: number, decimalPlaces: number = 0, locale: string = 'en-US'): string;
```

**Parameters:**

- `value: number` - The number to format
- `decimalPlaces: number` - The number of decimal places to include (default: 0)
- `locale: string` - The locale to use for formatting (default: 'en-US')

**Returns:** A formatted number string.

**Example:**

```typescript
import { formatNumber } from 'utils/formatUtils';

console.log(formatNumber(1234567)); // "1,234,567"
console.log(formatNumber(1234567.89, 2)); // "1,234,567.89"
console.log(formatNumber(1234567.89, 2, 'es-ES')); // "1.234.567,89"
```

## Error Handling Utilities

### handleError

Handles an error by logging it and optionally displaying a user-friendly message.

**Signature:**

```typescript
function handleError(error: Error, showToast: boolean = true, customMessage?: string): void;
```

**Parameters:**

- `error: Error` - The error to handle
- `showToast: boolean` - Whether to show a toast message to the user (default: true)
- `customMessage?: string` - Optional custom message to display

**Example:**

```typescript
import { handleError } from 'utils/errorHandling';

try {
  // Some code that might throw an error
} catch (error) {
  handleError(error, true, 'Failed to load data. Please try again later.');
}
```

### logError

Logs an error to the console and monitoring service.

**Signature:**

```typescript
function logError(error: Error, context?: Record<string, any>): void;
```

**Parameters:**

- `error: Error` - The error to log
- `context?: Record<string, any>` - Optional context information

**Example:**

```typescript
import { logError } from 'utils/errorHandling';

try {
  // Some code that might throw an error
} catch (error) {
  logError(error, {
    component: 'PaymentProcessor',
    userId: 'user123',
    action: 'processPayment',
  });
}
```

### parseError

Parses an error object to extract useful information.

**Signature:**

```typescript
function parseError(error: any): { message: string; code?: string; stack?: string };
```

**Parameters:**

- `error: any` - The error to parse

**Returns:** An object containing the error message, code, and stack trace.

**Example:**

```typescript
import { parseError } from 'utils/errorHandling';

try {
  // Some code that might throw an error
} catch (error) {
  const parsedError = parseError(error);
  console.log('Error message:', parsedError.message);
  console.log('Error code:', parsedError.code);
}
```

## Performance Utilities

### debounce

Creates a debounced function that delays invoking the provided function until after a specified wait time.

**Signature:**

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void;
```

**Parameters:**

- `func: T` - The function to debounce
- `wait: number` - The number of milliseconds to delay

**Returns:** A debounced version of the function.

**Example:**

```typescript
import { debounce } from 'utils/performanceUtils';

// Create a debounced search function that only executes 300ms after the last call
const debouncedSearch = debounce((query: string) => {
  // Perform search operation
  console.log('Searching for:', query);
}, 300);

// Call the debounced function
debouncedSearch('react'); // Will not execute immediately
debouncedSearch('react native'); // Will cancel the previous call
// After 300ms, "Searching for: react native" will be logged
```

### throttle

Creates a throttled function that only invokes the provided function at most once per specified time period.

**Signature:**

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void;
```

**Parameters:**

- `func: T` - The function to throttle
- `limit: number` - The time limit in milliseconds

**Returns:** A throttled version of the function.

**Example:**

```typescript
import { throttle } from 'utils/performanceUtils';

// Create a throttled scroll handler that executes at most once every 100ms
const throttledScroll = throttle(() => {
  // Handle scroll event
  console.log('Scroll position:', window.scrollY);
}, 100);

// Add event listener
window.addEventListener('scroll', throttledScroll);
```

### memoize

Creates a memoized version of a function that caches its results.

**Signature:**

```typescript
function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => ReturnType<T>;
```

**Parameters:**

- `func: T` - The function to memoize
- `resolver?: (...args: Parameters<T>) => string` - Optional function to resolve the cache key

**Returns:** A memoized version of the function.

**Example:**

```typescript
import { memoize } from 'utils/performanceUtils';

// Create a memoized fibonacci function
const fibonacci = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

// Compute fibonacci numbers
console.log(fibonacci(10)); // Computes and caches results
console.log(fibonacci(10)); // Returns cached result
```

## Environment Utilities

### envCheck

Checks if required environment variables are set.

**Signature:**

```typescript
function envCheck(requiredVars: string[]): { valid: boolean; missing: string[] };
```

**Parameters:**

- `requiredVars: string[]` - Array of required environment variable names

**Returns:** An object indicating if all variables are valid and which ones are missing.

**Example:**

```typescript
import { envCheck } from 'utils/envCheck';

const { valid, missing } = envCheck(['API_KEY', 'FIREBASE_CONFIG', 'STRIPE_KEY']);
if (!valid) {
  console.error('Missing environment variables:', missing);
}
```

### envConfig

Gets environment configuration values.

**Signature:**

```typescript
function envConfig(key: string, defaultValue?: string): string;
```

**Parameters:**

- `key: string` - The environment variable key
- `defaultValue?: string` - Optional default value if the key is not found

**Returns:** The environment variable value or the default value.

**Example:**

```typescript
import { envConfig } from 'utils/envConfig';

const apiUrl = envConfig('API_URL', 'https://api.default.com');
console.log('API URL:', apiUrl);
```

## Cross-References

- For information on internationalization utilities, see [Internationalization](../core-concepts/internationalization.md)
- For practical guides on implementing internationalization, see [Internationalization Guide](../implementation-guides/internationalization-guide.md)
- For practical guides on testing utilities, see [Testing](../implementation-guides/testing.md)
- For information on components that use these utility functions, see [Component API](component-api.md)
- For information on services that use these utility functions, see [Service API](service-api.md)
