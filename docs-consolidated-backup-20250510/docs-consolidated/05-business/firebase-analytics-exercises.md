# Firebase Analytics Exercises

## Exercise 1: Log an Event

Create a function that logs an event to Firebase Analytics.

```typescript
// TODO: Implement logEvent function
const logEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  // 1. Log event to Firebase Analytics
  // 2. Validate event name and parameters
};
```

## Exercise 2: Set User Properties

Create a function that sets user properties in Firebase Analytics.

```typescript
// TODO: Implement setUserProperties function
const setUserProperties = (
  properties: Record<string, any>
) => {
  // 1. Set user properties in Firebase Analytics
  // 2. Validate property names and values
};
```

## Exercise 3: Track Screen View

Create a function that tracks a screen view in Firebase Analytics.

```typescript
// TODO: Implement trackScreenView function
const trackScreenView = (
  screenName: string,
  screenClass?: string
) => {
  // 1. Track screen view in Firebase Analytics
  // 2. Validate screen name
};
```

## Exercise 4: Track User Journey

Create a function that tracks a user journey through multiple screens.

```typescript
// TODO: Implement trackUserJourney function
const trackUserJourney = (
  journeyName: string,
  steps: Array<{ name: string, params?: Record<string, any> }>
) => {
  // 1. Track each step in the journey
  // 2. Include journey name in each event
};
```

## Exercise 5: Implement Analytics Wrapper

Create a wrapper for Firebase Analytics that adds additional functionality.

```typescript
// TODO: Implement AnalyticsWrapper class
class AnalyticsWrapper {
  // 1. Implement methods for logging events
  // 2. Implement methods for setting user properties
  // 3. Implement methods for tracking screen views
  // 4. Add additional functionality like event batching
}
```
