# Firebase Analytics Training

## Slide 1: Introduction to Firebase Analytics

- Firebase Analytics provides app usage insights
- Tracks user behavior and demographics
- Integrated with the consolidated Firebase service

## Slide 2: Using Firebase Analytics

```typescript
// Log an event
firebaseService.analytics.logEvent(
  'purchase',
  {
    currency: 'USD',
    value: 29.99,
    items: [{ id: 'subscription_premium' }]
  }
);

// Set user properties
firebaseService.analytics.setUserProperties({
  subscription_level: 'premium',
  user_type: 'returning'
});

// Set current screen
firebaseService.analytics.setCurrentScreen(
  'HomeScreen',
  'home_screen'
);
```

## Slide 3: Analytics Best Practices

- Use consistent event names
- Include relevant parameters
- Set user properties for segmentation
- Track conversion events
- Track screen views
- Use debug mode during development
- Respect user privacy

## Slide 4: Key Analytics Events

1. User Lifecycle Events
   - sign_up
   - login
   - tutorial_complete
   - subscription_start
   - subscription_cancel

2. Engagement Events
   - screen_view
   - search
   - view_item
   - add_to_favorites
   - share

3. Conversion Events
   - add_to_cart
   - begin_checkout
   - purchase
   - subscription_purchase

## Slide 5: Testing Analytics

```typescript
// Mock the Firebase service
jest.mock('../services/firebaseService', () => ({
  analytics: {
    logEvent: jest.fn(),
    setUserProperties: jest.fn(),
    setCurrentScreen: jest.fn()
  }
}));

// Test logging an event
test('logEvent works correctly', () => {
  logPurchase({ currency: 'USD', value: 29.99 });
  expect(firebaseService.analytics.logEvent).toHaveBeenCalledWith('purchase', {
    currency: 'USD',
    value: 29.99
  });
});
```
